import { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RCTooltip, Legend,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
  BarChart, Bar, Cell, LabelList,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { useHistory, useBCB, buildPortfolioPerf } from '../hooks.jsx';
import { getPerformanceSeries } from '../data.js';
import { TIPO_COLOR, POS, NEG, ACC, WARN, GRID_STYLE, TICK_STYLE, brl, brlFull, pct, colorByValue } from '../utils.js';
import ChartCard from '../components/ChartCard.jsx';

const PERIOD_YF = { '3 Months': '3mo', '6 Months': '6mo', '1 Year': '1y', '2 Years': '2y' };
const BCB_N     = { '3 Months': 70,   '6 Months': 130,   '1 Year': 265,  '2 Years': 530  };

const PERIODS = ['3 Months', '6 Months', '1 Year', '2 Years'];

const LINE_COLORS = {
  'My Portfolio': WARN,
  'IBOVESPA':     ACC,
  'S&P 500':      '#a78bfa',
  'CDI':          POS,
  'IPCA':         '#ff7043',
};
const LINE_DASH = {
  'My Portfolio': '0',
  'IBOVESPA':     '6 3',
  'S&P 500':      '2 4',
  'CDI':          '8 3',
  'IPCA':         '4 2 1 2',
};

function buildCDISeries(bcbData, refDates) {
  if (!bcbData?.length || !refDates?.length) return [];
  const lookup = {};
  bcbData.forEach(d => {
    const [day, month, year] = d.data.split('/');
    lookup[`${year}-${month}-${day}`] = parseFloat(d.valor.replace(',', '.'));
  });
  const sorted = Object.entries(lookup).sort((a,b) => a[0].localeCompare(b[0]));
  let cum = 100;
  const cumMap = {};
  sorted.forEach(([date, rate]) => { cum *= (1 + rate / 100); cumMap[date] = +cum.toFixed(4); });
  const base = cumMap[refDates[0]] ?? Object.values(cumMap)[0] ?? 100;
  let last = null;
  return refDates.map(d => {
    if (cumMap[d] != null) last = cumMap[d];
    return last != null ? +(last / base * 100).toFixed(2) : null;
  });
}

function buildIPCASeries(bcbData, refDates) {
  if (!bcbData?.length || !refDates?.length) return [];
  let cum = 100;
  const cumByMonth = {};
  [...bcbData].sort((a,b) => {
    const da = a.data.split('/'), db = b.data.split('/');
    return new Date(`${da[2]}-${da[1]}-${da[0]}`) - new Date(`${db[2]}-${db[1]}-${db[0]}`);
  }).forEach(d => {
    const [day, month, year] = d.data.split('/');
    cum *= (1 + parseFloat(d.valor.replace(',', '.')) / 100);
    cumByMonth[`${year}-${month}`] = +cum.toFixed(4);
  });
  const base = Object.values(cumByMonth)[0] ?? 100;
  let last = null;
  return refDates.map(d => {
    const ym = d.slice(0,7);
    if (cumByMonth[ym] != null) last = cumByMonth[ym];
    return last != null ? +(last / base * 100).toFixed(2) : null;
  });
}

export default function Rentabilidade({ df, onStatusChange }) {
  const [period, setPeriod] = useState('1 Year');
  const yfPeriod = PERIOD_YF[period];

  const allTickers = useMemo(() => {
    const t = df.filter(r => r.tickerYF).map(r => r.tickerYF);
    return ['^BVSP', 'VOO', 'USDBRL=X', ...new Set(t)];
  }, [df]);

  const { history, status: histStatus } = useHistory(allTickers, yfPeriod);
  const { data: cdiData,  status: cdiStatus  } = useBCB(12,  BCB_N[period]);
  const { data: ipcaData, status: ipcaStatus } = useBCB(433, Math.ceil(BCB_N[period] / 21));

  const chartData = useMemo(() => {
    if (histStatus !== 'live' || !history) return getPerformanceSeries(period);

    const usdBrlHist = history['USDBRL=X'] ?? [];
    const portPerf   = buildPortfolioPerf(df, history, usdBrlHist);
    if (!portPerf.length) return getPerformanceSeries(period);

    const refDates = portPerf.map(d => d.date);
    const makeSeries = (hist) => {
      const lookup = {}; hist.forEach(d => { lookup[d.date] = d.close; });
      const base   = hist[0]?.close ?? 1; let last = null;
      return refDates.map(d => { if (lookup[d] != null) last = lookup[d]; return last ? +(last / base * 100).toFixed(2) : null; });
    };

    const ibovSeries = makeSeries(history['^BVSP'] ?? []);
    const vooSeries  = makeSeries(history['VOO']   ?? []);
    const cdiSeries  = cdiStatus  === 'live' ? buildCDISeries(cdiData, refDates)   : refDates.map(() => null);
    const ipcaSeries = ipcaStatus === 'live' ? buildIPCASeries(ipcaData, refDates) : refDates.map(() => null);

    return refDates.map((date, i) => ({
      date,
      'My Portfolio': portPerf[i].value,
      'IBOVESPA': ibovSeries[i],
      'S&P 500':  vooSeries[i],
      'CDI':      cdiSeries[i],
      'IPCA':     ipcaSeries[i],
    }));
  }, [history, histStatus, cdiData, cdiStatus, ipcaData, ipcaStatus, period, df]);

  const finalValues = useMemo(() => {
    if (!chartData.length) return {};
    const last = chartData[chartData.length - 1];
    return Object.fromEntries(
      ['My Portfolio','IBOVESPA','S&P 500','CDI','IPCA']
        .map(k => [k, last[k] != null ? +(last[k] - 100).toFixed(2) : null])
        .filter(([,v]) => v != null)
    );
  }, [chartData]);

  const byTipo = useMemo(() => {
    const m = {};
    df.forEach(r => { if (!m[r.tipo]) m[r.tipo] = {inv:0,atu:0}; m[r.tipo].inv += r.totalInvestido; m[r.tipo].atu += r.totalAtual; });
    return Object.entries(m).map(([tipo,v]) => ({ tipo, retorno: +((v.atu/v.inv-1)*100).toFixed(2) })).sort((a,b) => b.retorno - a.retorno);
  }, [df]);

  const scatterData = useMemo(() =>
    df.map(r => ({ ativo: r.ativo, tipo: r.tipo, x: r.totalAtual, y: r.pctGanho, z: r.totalAtual }))
  , [df]);

  const thin = useMemo(() => {
    const step = Math.max(1, Math.floor(chartData.length / 200));
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);
  }, [chartData]);

  const xFmt = (v) => { if (!v) return ''; const d = new Date(v); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; };
  const isLive = histStatus === 'live';

  useEffect(() => { onStatusChange?.(histStatus); }, [histStatus]);

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Period selector + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid',
              borderColor: period === p ? '#667eea' : 'rgba(255,255,255,0.1)',
              background: period === p ? 'rgba(102,126,234,0.15)' : 'transparent',
              color: period === p ? '#a78bfa' : '#8892b0',
              fontSize: '0.82rem', cursor: 'pointer', fontWeight: period === p ? 600 : 400,
            }}>{p}</button>
          ))}
        </div>
      </div>

      {!isLive && histStatus !== 'loading' && (
        <div style={{ padding:'8px 14px', borderRadius:8, background:'rgba(255,167,38,0.08)', border:'1px solid rgba(255,167,38,0.2)', fontSize:'0.78rem', color:'#ffa726' }}>
          ⚠️ Simulated data — start the server (<code>cd server &amp;&amp; node index.mjs</code>) for real data.
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(Object.keys(finalValues).length, 1)},1fr)`, gap: 12 }}>
        {Object.entries(finalValues).map(([name, val]) => (
          <div key={name} className="glass" style={{ padding:'12px 14px', textAlign:'center' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:LINE_COLORS[name], margin:'0 auto 6px' }} />
            <p style={{ fontSize:'0.68rem', color:'#8892b0', marginBottom:4 }}>{name}</p>
            <p style={{ fontSize:'1.1rem', fontWeight:700, color:colorByValue(val) }}>{pct(val)}</p>
          </div>
        ))}
      </div>

      {/* Performance chart */}
      <ChartCard title={`Cumulative Performance — ${period} (Base 100)${isLive ? ' · Yahoo Finance + BCB' : ' · Estimated'}`}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={thin} margin={{ left:0, right:20, top:8, bottom:4 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="date" tickFormatter={xFmt} tick={{ ...TICK_STYLE, fontSize:10 }} axisLine={false} tickLine={false} minTickGap={30} />
            <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} domain={['auto','auto']} />
            <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <RCTooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontWeight:600, color:'#8892b0', marginBottom:6, fontSize:'0.75rem' }}>{label}</p>
                  {payload.filter(p => p.value != null).map((p,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
                      <span style={{ color:'#8892b0', minWidth:110 }}>{p.name}</span>
                      <span style={{ color:colorByValue(p.value-100), fontWeight:600 }}>{p.value?.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              );
            }} />
            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:'#8892b0', fontSize:'0.78rem' }}>{v}</span>} />
            {Object.keys(LINE_COLORS).map(name => (
              <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[name]}
                strokeWidth={name === 'Minha Carteira' ? 2.5 : 1.5} strokeDasharray={LINE_DASH[name]}
                dot={false} activeDot={{ r:4 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Return by class + scatter */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <ChartCard title="Return (%) by Asset Class">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byTipo} margin={{ left:0, right:20, top:4, bottom:20 }}>
              <XAxis dataKey="tipo" tick={{ ...TICK_STYLE, fontSize:10 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value;
                return <div className="chart-tooltip"><p style={{ fontWeight:600 }}>{label}</p><p style={{ color:colorByValue(v) }}>{pct(v)}</p></div>;
              }} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="retorno" radius={[4,4,0,0]}>
                {byTipo.map((e,i) => <Cell key={i} fill={TIPO_COLOR[e.tipo] ?? ACC} />)}
                <LabelList dataKey="retorno" position="top" formatter={v => pct(v)} style={{ fill:'#8892b0', fontSize:10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Return (%) vs Position Size">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ left:0, right:20, top:8, bottom:16 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="x" type="number" tickFormatter={v => brl(v)} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value:'Current Value (R$)', position:'insideBottom', offset:-4, fill:'#8892b0', fontSize:11 }} />
              <YAxis dataKey="y" type="number" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <ZAxis dataKey="z" range={[40,400]} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <RCTooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="chart-tooltip"><p style={{ fontWeight:600 }}>{d.ativo}</p><p>{d.tipo}</p><p style={{ color:colorByValue(d.y) }}>{pct(d.y)}</p><p>{brl(d.x)}</p></div>;
              }} />
              {Object.keys(TIPO_COLOR).map(tipo => {
                const pts = scatterData.filter(d => d.tipo === tipo);
                return pts.length ? <Scatter key={tipo} data={pts} fill={TIPO_COLOR[tipo]} name={tipo} opacity={0.85} /> : null;
              })}
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:'#8892b0', fontSize:'0.78rem' }}>{v}</span>} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
