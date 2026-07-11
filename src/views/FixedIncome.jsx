import { useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RCTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, LabelList,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
  LineChart, Line,
} from 'recharts';
import { useBCB } from '../hooks.jsx';
import { TICK_STYLE, GRID_STYLE, POS, NEG, ACC, WARN, brl, brlFull, pct, colorByValue } from '../utils.js';
import ChartCard from '../components/ChartCard.jsx';
import DataTable from '../components/DataTable.jsx';

const SELIC_C = '#ab47bc';
const IPCA_C  = '#667eea';

function extractYear(name) {
  const m = name.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}
function extractSubtipo(name) { return name.includes('Selic') ? 'Selic' : 'IPCA+'; }

export default function RendaFixa({ df, onStatusChange }) {
  const rf = useMemo(() => {
    const base = df.filter(r => r.tipo === 'Treasury');
    return base.map(r => ({
      ...r,
      vencimento: extractYear(r.ativo),
      subtipo: extractSubtipo(r.ativo),
      anosVenc: extractYear(r.ativo) ? extractYear(r.ativo) - 2025 : null,
    }));
  }, [df]);

  // ── Maturity ladder ────────────────────────────────────────────────────
  const ladder = useMemo(() => {
    const m = {};
    rf.forEach(r => {
      const k = r.vencimento ?? 0;
      if (!m[k]) m[k] = { ano: k, Selic: 0, 'IPCA+': 0 };
      m[k][r.subtipo] += r.totalAtual;
    });
    return Object.values(m).sort((a,b) => a.ano - b.ano)
      .map(r => ({ ...r, Selic: +r.Selic.toFixed(2), 'IPCA+': +r['IPCA+'].toFixed(2) }));
  }, [rf]);

  // ── Selic vs IPCA+ ────────────────────────────────────────────────────
  const subtipoData = useMemo(() => {
    const m = { Selic: 0, 'IPCA+': 0 };
    rf.forEach(r => { m[r.subtipo] += r.totalAtual; });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [rf]);

  // ── Live BCB rates ─────────────────────────────────────────────────────
  const { data: selicRaw, status: selicStatus } = useBCB(11,  252); // SELIC daily
  const { data: ipcaRaw,  status: ipcaStatus  } = useBCB(433, 15);  // IPCA monthly

  const bcbData = useMemo(() => {
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    try {
      if (selicStatus !== 'live' && ipcaStatus !== 'live') {
        const selic = [10.65,10.65,10.75,10.75,10.50,10.50,10.50,10.50,10.25,10.25,10.50,10.75];
        const ipca  = [0.42, 0.83, 0.16,-0.14, 0.46, 0.36, 0.38, 0.44, 0.54, 0.56, 0.39, 0.52];
        return monthNames.map((month, i) => ({ month, 'SELIC (% p.a.)': selic[i], 'IPCA (% monthly)': ipca[i] }));
      }

      const selicArr = Array.isArray(selicRaw) ? selicRaw : [];
      const ipcaArr  = Array.isArray(ipcaRaw)  ? ipcaRaw  : [];

      const selicByMonth = {};
      selicArr.forEach(d => {
        if (!d?.data) return;
        const parts = d.data.split('/');
        const month = parts[1];
        const year  = parts[2];
        if (!month || !year) return;
        const key = `${year}-${month}`;
        if (!selicByMonth[key]) selicByMonth[key] = [];
        selicByMonth[key].push(parseFloat(String(d.valor ?? 0).replace(',', '.')));
      });
      const ipcaByMonth = {};
      ipcaArr.forEach(d => {
        if (!d?.data) return;
        const parts = d.data.split('/');
        const month = parts.length === 3 ? parts[1] : parts[0];
        const year  = parts.length === 3 ? parts[2] : parts[1];
        if (!month || !year) return;
        ipcaByMonth[`${year}-${month}`] = parseFloat(String(d.valor ?? 0).replace(',', '.'));
      });

      const allMonths = [...new Set([...Object.keys(selicByMonth), ...Object.keys(ipcaByMonth)])].sort().slice(-12);
      if (!allMonths.length) throw new Error('no months');

      return allMonths.map(ym => {
        const [year, month] = ym.split('-');
        const rates = selicByMonth[ym] ?? [];
        const annualSelic = rates.length
          ? +((Math.pow(1 + rates.reduce((s,v) => s+v, 0)/rates.length/100, 252) - 1) * 100).toFixed(2)
          : null;
        return {
          month: (monthNames[parseInt(month,10)-1] ?? '') + '/' + (year?.slice(2) ?? ''),
          'SELIC (% p.a.)': annualSelic,
          'IPCA (% monthly)': ipcaByMonth[ym] ?? null,
        };
      });
    } catch {
      // Fallback to static data on any error
      const selic = [10.65,10.65,10.75,10.75,10.50,10.50,10.50,10.50,10.25,10.25,10.50,10.75];
      const ipca  = [0.42, 0.83, 0.16,-0.14, 0.46, 0.36, 0.38, 0.44, 0.54, 0.56, 0.39, 0.52];
      return monthNames.map((month, i) => ({ month, 'SELIC (% p.a.)': selic[i], 'IPCA (% monthly)': ipca[i] }));
    }
  }, [selicRaw, selicStatus, ipcaRaw, ipcaStatus]);

  const bcbStatus = selicStatus === 'live' || ipcaStatus === 'live' ? 'live'
    : selicStatus === 'loading' || ipcaStatus === 'loading' ? 'loading' : 'error';

  useEffect(() => { onStatusChange?.(bcbStatus); }, [bcbStatus]);

  const rfSorted     = useMemo(() => [...rf].sort((a,b) => b.pctGanho - a.pctGanho), [rf]);
  const rfByMaturity = useMemo(() => rf.filter(r => r.anosVenc != null), [rf]);

  const tableColumns = [
    { key: 'ativo',          label: 'Bond' },
    { key: 'subtipo',        label: 'Type' },
    { key: 'vencimento',     label: 'Maturity' },
    { key: 'anosVenc',       label: 'Yrs to Mat.', align: 'right' },
    { key: 'totalInvestido', label: 'Invested (R$)', format: 'brl', align: 'right' },
    { key: 'totalAtual',     label: 'Current (R$)',  format: 'brl', align: 'right' },
    { key: 'ganho',          label: 'Gain (R$)',    format: 'brl_gain', align: 'right' },
    { key: 'pctGanho',       label: 'Gain (%)',     format: 'pct',      align: 'right' },
  ];

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Maturity ladder + pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <ChartCard title="Maturity Ladder">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ladder} margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="ano" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => brl(v)} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>Maturity {label}</p>
                    {payload.map((p,i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: p.fill }}>{p.name}:</span>
                        <span>{brlFull(p.value)}</span>
                      </div>
                    ))}
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.78rem' }}>{v}</span>} />
              <Bar dataKey="Selic"  stackId="a" fill={SELIC_C} radius={[0,0,0,0]} />
              <Bar dataKey="IPCA+"  stackId="a" fill={IPCA_C}  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Selic vs IPCA+">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={subtipoData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100}
                stroke="none"
                label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}
                labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                {subtipoData.map((e,i) => (
                  <Cell key={i} fill={e.name === 'Selic' ? SELIC_C : IPCA_C} />
                ))}
              </Pie>
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="chart-tooltip"><p style={{ fontWeight: 600 }}>{d.name}</p><p>{brl(d.value)}</p></div>;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Individual returns + scatter ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Individual Returns — Treasury Bonds">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rfSorted} margin={{ left: 0, right: 20, top: 4, bottom: 40 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 9 }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{label}</p>
                    <p style={{ color: colorByValue(v) }}>{pct(v)}</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="pctGanho" radius={[4,4,0,0]}>
                {rfSorted.map((e,i) => <Cell key={i} fill={e.subtipo === 'Selic' ? SELIC_C : IPCA_C} />)}
                <LabelList dataKey="pctGanho" position="top" formatter={v => pct(v)} style={{ fill: '#8892b0', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Years to Maturity × Return">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 20 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="anosVenc" type="number" name="Years" tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'Years to Maturity', position: 'insideBottom', offset: -4, fill: '#8892b0', fontSize: 11 }} />
              <YAxis dataKey="pctGanho" type="number" name="Retorno %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <ZAxis dataKey="totalAtual" range={[60,500]} />
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{d.ativo}</p>
                    <p>Maturity: {d.vencimento}</p>
                    <p style={{ color: colorByValue(d.pctGanho) }}>Return: {pct(d.pctGanho)}</p>
                    <p>{brl(d.totalAtual)}</p>
                  </div>
                );
              }} />
              {['Selic','IPCA+'].map(sub => {
                const pts = rfByMaturity.filter(r => r.subtipo === sub);
                return pts.length ? (
                  <Scatter key={sub} data={pts} fill={sub === 'Selic' ? SELIC_C : IPCA_C} name={sub} opacity={0.85} />
                ) : null;
              })}
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.78rem' }}>{v}</span>} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── BCB rates simulated ── */}
      <ChartCard title="BCB Rates — SELIC & IPCA (2024, estimated data)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={bcbData} margin={{ left: 0, right: 20, top: 8, bottom: 4 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
            <RCTooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontWeight: 600 }}>{label}</p>
                  {payload.map((p,i) => (
                    <div key={i} style={{ display:'flex', gap:8 }}>
                      <span style={{ color: p.stroke }}>{p.name}:</span>
                      <span>{p.value?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              );
            }} />
            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.78rem' }}>{v}</span>} />
            <Line type="monotone" dataKey="SELIC (% p.a.)" stroke={SELIC_C} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="IPCA (% monthly)" stroke={IPCA_C} strokeWidth={2} dot={{ r: 3, fill: IPCA_C }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Table ── */}
      <div className="glass" style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt-1)', marginBottom: 16 }}>
          Table — Treasury Bonds
        </p>
        <DataTable data={rf} columns={tableColumns} defaultSort={{ key: 'totalAtual', dir: 'desc' }} />
      </div>
    </div>
  );
}
