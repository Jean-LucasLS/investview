import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RCTooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
  PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { useIndicators, LiveBadge } from '../hooks.jsx';
import { TICK_STYLE, GRID_STYLE, POS, NEG, ACC, WARN, brl, brlFull, pct, colorByValue } from '../utils.js';
import ChartCard from '../components/ChartCard.jsx';
import DataTable from '../components/DataTable.jsx';

const SEG_COLORS = { 'FII Logístico': '#00d4aa', 'FII Renda Urb.': '#667eea', 'FII CRI': '#ffa726' };
const PIE_COLORS = ['#00d4aa','#667eea','#ffa726','#ab47bc','#26c6da','#ef5350'];

function pvpColor(v) {
  if (v <= 1.05) return POS;
  if (v <= 1.20) return WARN;
  return NEG;
}

export default function FIIs({ df }) {
  const fiis    = useMemo(() => df.filter(r => r.tipo === 'FII'), [df]);
  const tickers = useMemo(() => fiis.map(r => r.tickerYF).filter(Boolean), [fiis]);

  const { indicators, status: indStatus } = useIndicators(tickers);

  const enriched = useMemo(() =>
    fiis.map(r => ({
      ...r,
      PVP: indicators[r.tickerYF]?.PVP ?? null,
      DY:  indicators[r.tickerYF]?.DY  ?? null,
      LPA: indicators[r.tickerYF]?.LPA ?? null,
      Beta:indicators[r.tickerYF]?.Beta ?? null,
    }))
  , [fiis, indicators]);

  const bySegmento = useMemo(() => {
    const m = {};
    fiis.forEach(r => { m[r.setor] = (m[r.setor] ?? 0) + r.totalAtual; });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [fiis]);

  const dyData  = useMemo(() => [...enriched].filter(r => r.DY  != null).sort((a,b) => b.DY  - a.DY),  [enriched]);
  const pvpData = useMemo(() => [...enriched].filter(r => r.PVP != null).sort((a,b) => a.PVP - b.PVP), [enriched]);
  const scData  = useMemo(() => enriched.filter(r => r.DY != null && r.PVP != null)
    .map(r => ({ fii: r.ativo, setor: r.setor, x: r.PVP, y: r.DY, z: r.totalAtual, pctg: r.pctGanho }))
  , [enriched]);

  const avgDY = dyData.length ? dyData.reduce((s,r) => s + r.DY, 0) / dyData.length : null;

  const tableColumns = [
    { key: 'ativo',          label: 'FII' },
    { key: 'setor',          label: 'Segmento' },
    { key: 'totalInvestido', label: 'Invest. (R$)', format: 'brl', align: 'right' },
    { key: 'totalAtual',     label: 'Atual (R$)',   format: 'brl', align: 'right' },
    { key: 'pctGanho',       label: 'Ganho (%)',    format: 'pct', align: 'right' },
    { key: 'PVP',  label: 'P/VP',  align: 'right', render: v => v != null ? `${v.toFixed(2)}x` : '—',
      sortable: true },
    { key: 'DY',   label: 'DY (%)',align: 'right', render: v => v != null ? `${v.toFixed(1)}%` : '—' },
    { key: 'LPA',  label: 'LPA',   align: 'right', render: v => v?.toFixed(2) ?? '—' },
    { key: 'Beta', label: 'Beta',  align: 'right', render: v => v?.toFixed(2) ?? '—' },
  ];

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display:'flex', justifyContent:'flex-end' }}><LiveBadge status={indStatus} /></div>

      {/* ── DY and P/VP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Dividend Yield (DY %) dos FIIs">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dyData} margin={{ left: 0, right: 20, top: 4, bottom: 20 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} angle={-15} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              {avgDY && (
                <ReferenceLine y={avgDY} stroke={WARN} strokeDasharray="5 3"
                  label={{ value: `Média: ${avgDY.toFixed(1)}%`, fill: WARN, fontSize: 10, position: 'insideTopRight' }} />
              )}
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{label}</p>
                    <p style={{ color: POS }}>{payload[0].value?.toFixed(1)}%</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="DY" radius={[4,4,0,0]}>
                {dyData.map((e,i) => <Cell key={i} fill={SEG_COLORS[e.setor] ?? ACC} />)}
                <LabelList dataKey="DY" position="top" formatter={v => `${v.toFixed(1)}%`} style={{ fill: '#8892b0', fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="P/VP dos FIIs  (verde ≤1,05 · amarelo ≤1,20 · vermelho >1,20)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pvpData} margin={{ left: 0, right: 20, top: 4, bottom: 20 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} angle={-15} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} domain={[0, 'auto']} />
              <ReferenceLine y={1.0} stroke={WARN} strokeDasharray="5 3"
                label={{ value: 'P/VP = 1,0', fill: WARN, fontSize: 10, position: 'insideTopRight' }} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{label}</p>
                    <p style={{ color: pvpColor(v) }}>{v?.toFixed(2)}x</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="PVP" radius={[4,4,0,0]}>
                {pvpData.map((e,i) => <Cell key={i} fill={pvpColor(e.PVP)} />)}
                <LabelList dataKey="PVP" position="top" formatter={v => `${v.toFixed(2)}x`} style={{ fill: '#8892b0', fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Segment pie and P/VP × DY scatter ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Alocação por Segmento dos FIIs">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bySegmento} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105}
                stroke="none" labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                  const RADIAN = Math.PI / 180;
                  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                  if (percent < 0.06) return null;
                  return (
                    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
                      textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={10} fontWeight={500}>
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}>
                {bySegmento.map((e,i) => <Cell key={i} fill={SEG_COLORS[e.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.78rem' }}>{v}</span>} />
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="chart-tooltip"><p style={{ fontWeight: 600 }}>{d.name}</p><p>{brl(d.value)}</p></div>;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="P/VP × DY — Valuation vs Rendimento">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 20 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="x" type="number" name="P/VP" tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'P/VP', position: 'insideBottom', offset: -4, fill: '#8892b0', fontSize: 11 }} />
              <YAxis dataKey="y" type="number" name="DY %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'DY (%)', angle: -90, position: 'insideLeft', fill: '#8892b0', fontSize: 11 }} />
              <ZAxis dataKey="z" range={[80,600]} />
              <ReferenceLine x={1.0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600 }}>{d.fii}</p>
                    <p>P/VP: {d.x?.toFixed(2)}x</p>
                    <p>DY: {d.y?.toFixed(1)}%</p>
                    <p>{brl(d.z)}</p>
                  </div>
                );
              }} />
              <Scatter data={scData} fill={POS} name="FIIs" opacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Table ── */}
      <div className="glass" style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
          Tabela — FIIs com Indicadores
        </p>
        <DataTable data={enriched} columns={tableColumns} defaultSort={{ key: 'DY', dir: 'desc' }} />
      </div>
    </div>
  );
}
