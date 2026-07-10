import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RCTooltip,
  ResponsiveContainer, Cell, LabelList, ReferenceLine,
  ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts';
import { getRiskMetrics, CORR_TICKERS, CORR_MATRIX } from '../data.js';
import { useHistory, calcVolFromHistory, calcCorrelation, dailyReturns, LiveBadge } from '../hooks.jsx';
import { TIPO_COLOR, TICK_STYLE, GRID_STYLE, POS, NEG, ACC, WARN, brl, pct, colorByValue } from '../utils.js';
import ChartCard from '../components/ChartCard.jsx';

function volColor(v) {
  if (v < 10) return POS;
  if (v < 20) return WARN;
  return NEG;
}

function corrColor(v) {
  if (v >= 0) {
    const t = Math.min(v, 1);
    return `rgba(255,75,75,${0.12 + t * 0.75})`;
  } else {
    const t = Math.min(-v, 1);
    return `rgba(102,126,234,${0.12 + t * 0.75})`;
  }
}

function HeatmapChart({ labels, matrix }) {
  const n = labels.length;
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `70px repeat(${n}, 1fr)`,
        gap: 3,
        minWidth: `${70 + n * 58}px`,
      }}>
        {/* Header row */}
        <div />
        {labels.map((l,i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.65rem', color: '#8892b0', padding: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {l}
          </div>
        ))}
        {/* Data rows */}
        {matrix.map((row, i) => (
          <>
            <div key={`row-${i}`} style={{ fontSize: '0.65rem', color: '#8892b0', display: 'flex', alignItems: 'center', paddingRight: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {labels[i]}
            </div>
            {row.map((val, j) => (
              <div key={j} className="hm-cell"
                style={{ background: corrColor(val), color: '#e2e8f0' }}
                title={`${labels[i]} × ${labels[j]}: ${val.toFixed(2)}`}>
                {val.toFixed(2)}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}

export default function Risco({ df }) {
  const staticRisk = useMemo(() => getRiskMetrics(df), [df]);

  // All equity tickers for live volatility
  const tickers = useMemo(() => df.filter(r => r.tickerYF).map(r => r.tickerYF), [df]);
  const { history, status: histStatus } = useHistory(tickers, '1y');

  // Compute live risk metrics from real price history
  const riskData = useMemo(() => {
    if (histStatus !== 'live' || !history) return staticRisk;
    return staticRisk.map(r => {
      const hist = history[r.ticker];
      if (!hist?.length) return r;
      const vol = calcVolFromHistory(hist.map(d => d.close));
      return vol != null ? { ...r, vol } : r;
    });
  }, [staticRisk, history, histStatus]);

  // Compute live correlation matrix from real returns
  const { corrLabels, corrMatrix } = useMemo(() => {
    if (histStatus !== 'live' || !history) {
      return { corrLabels: CORR_TICKERS, corrMatrix: CORR_MATRIX };
    }
    // Use the 10 largest positions with available history
    const top10 = df
      .filter(r => r.tickerYF && history[r.tickerYF]?.length > 20)
      .sort((a,b) => b.totalAtual - a.totalAtual)
      .slice(0, 10);

    if (top10.length < 2) return { corrLabels: CORR_TICKERS, corrMatrix: CORR_MATRIX };

    const labels  = top10.map(r => r.ativo);
    const returns = {};
    top10.forEach(r => { returns[r.ativo] = dailyReturns(history[r.tickerYF]); });

    const matrix = labels.map((li) =>
      labels.map((lj) => {
        if (li === lj) return 1.00;
        return calcCorrelation(returns[li], returns[lj]);
      })
    );
    return { corrLabels: labels, corrMatrix: matrix };
  }, [df, history, histStatus]);

  const volData   = useMemo(() => [...riskData].sort((a,b) => b.vol - a.vol), [riskData]);
  const betaData  = useMemo(() => riskData.filter(r => r.beta != null).sort((a,b) => b.beta - a.beta), [riskData]);
  const scData    = useMemo(() => riskData.filter(r => r.vol != null && r.ret != null), [riskData]);

  // Sharpe approx (ret - CDI%) / vol
  const CDI = 10.75;
  const sharpeData = useMemo(() =>
    riskData
      .filter(r => r.vol > 0)
      .map(r => ({ ...r, sharpe: +((r.ret - CDI) / r.vol).toFixed(2) }))
      .sort((a,b) => b.sharpe - a.sharpe)
  , [riskData]);

  // VaR 95% ≈ -1.645 * daily_vol * sqrt(21) per asset
  const portfolioVol = useMemo(() => {
    const weights = riskData.map(r => r.totalAtual);
    const totalW = weights.reduce((s,w) => s + w, 0);
    if (!totalW) return 0;
    const varPct = riskData.reduce((s, r, i) => s + (weights[i] / totalW) * r.vol, 0);
    return +varPct.toFixed(1);
  }, [riskData]);

  const totalAtual = useMemo(() => df.reduce((s,r) => s + r.totalAtual, 0), [df]);
  const var95 = +(totalAtual * portfolioVol / 100 * 1.645 / Math.sqrt(252)).toFixed(2);

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display:'flex', justifyContent:'flex-end' }}><LiveBadge status={histStatus} /></div>

      {/* ── Risk summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Vol. Média Carteira', value: `${portfolioVol}%`, color: volColor(portfolioVol) },
          { label: 'VaR 95% (1 dia)', value: brl(-var95), color: NEG, note: 'Estimado' },
          { label: 'Melhor Sharpe', value: sharpeData[0]?.ativo ?? '—', sub: sharpeData[0]?.sharpe?.toFixed(2), color: POS },
          { label: 'Maior Volatilidade', value: volData[0]?.ativo ?? '—', sub: `${volData[0]?.vol}%`, color: NEG },
        ].map((c, i) => (
          <div key={i} className="glass" style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{c.label}</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: c.color }}>{c.value}</p>
            {c.sub && <p style={{ fontSize: '0.78rem', color: '#8892b0', marginTop: 2 }}>{c.sub}</p>}
            {c.note && <p style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 4 }}>{c.note}</p>}
          </div>
        ))}
      </div>

      {/* ── Volatility + risk/return scatter ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Volatilidade Anualizada por Ativo (1 ano, estimada)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volData} margin={{ left: 0, right: 20, top: 4, bottom: 40 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 9 }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{label}</p>
                    <p style={{ color: volColor(payload[0].value) }}>{payload[0].value?.toFixed(1)}%</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="vol" radius={[4,4,0,0]}>
                {volData.map((e,i) => <Cell key={i} fill={volColor(e.vol)} />)}
                <LabelList dataKey="vol" position="top" formatter={v => `${v}%`} style={{ fill: '#8892b0', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risco × Retorno (tamanho = posição)">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 16 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="vol" type="number" name="Volatilidade %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'Volatilidade (%)', position: 'insideBottom', offset: -4, fill: '#8892b0', fontSize: 11 }} />
              <YAxis dataKey="ret" type="number" name="Retorno %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'Retorno (%)', angle: -90, position: 'insideLeft', fill: '#8892b0', fontSize: 11 }} />
              <ZAxis dataKey="totalAtual" range={[60,600]} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{d.ativo}</p>
                    <p style={{ color: '#8892b0' }}>{d.tipo}</p>
                    <p>Volatilidade: {d.vol}%</p>
                    <p style={{ color: colorByValue(d.ret) }}>Retorno: {pct(d.ret)}</p>
                    <p>{brl(d.totalAtual)}</p>
                  </div>
                );
              }} />
              {Object.keys(TIPO_COLOR).map(tipo => {
                const pts = scData.filter(d => d.tipo === tipo);
                return pts.length ? (
                  <Scatter key={tipo} data={pts} fill={TIPO_COLOR[tipo]} name={tipo} opacity={0.85} />
                ) : null;
              })}
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Correlation heatmap ── */}
      <ChartCard title={`Matriz de Correlação${histStatus === 'live' ? ' (dados reais — 1 ano)' : ' (estática)'}`}>
        <HeatmapChart labels={corrLabels} matrix={corrMatrix} />
        <p style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: 12 }}>
          Azul = correlação negativa · Vermelho = correlação positiva · Diagonal = 1,00
        </p>
      </ChartCard>

      {/* ── Beta + Sharpe ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Beta — Sensibilidade ao Mercado">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={betaData} margin={{ left: 0, right: 20, top: 4, bottom: 40 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 9 }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <ReferenceLine y={1} stroke={WARN} strokeDasharray="4 4"
                label={{ value: 'Beta = 1', fill: WARN, fontSize: 10, position: 'insideTopRight' }} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{label}</p>
                    <p style={{ color: v > 1 ? NEG : v < 0.5 ? POS : WARN }}>Beta: {v?.toFixed(2)}</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="beta" radius={[4,4,0,0]}>
                {betaData.map((e,i) => <Cell key={i} fill={TIPO_COLOR[e.tipo] ?? ACC} />)}
                <LabelList dataKey="beta" position="top" formatter={v => v?.toFixed(2)} style={{ fill: '#8892b0', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Índice de Sharpe Estimado (CDI = 10,75%)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sharpeData.slice(0,12)} layout="vertical" margin={{ left: 10, right: 48, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} width={70} axisLine={false} tickLine={false} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{label}</p>
                    <p style={{ color: colorByValue(v) }}>Sharpe: {v}</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="sharpe" radius={[0,3,3,0]}>
                {sharpeData.slice(0,12).map((e,i) => <Cell key={i} fill={e.sharpe >= 0 ? POS : NEG} />)}
                <LabelList dataKey="sharpe" position="right" formatter={v => v?.toFixed(2)} style={{ fill: '#8892b0', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
