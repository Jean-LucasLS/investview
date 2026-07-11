import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RCTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import { TIPO_COLOR, CAT_COLOR, POS, NEG, ACC, WARN, GRID_STYLE, TICK_STYLE, brl, brlFull, pct, colorByValue } from '../utils.js';
import DataTable from '../components/DataTable.jsx';
import ChartCard from '../components/ChartCard.jsx';
import PortfolioChart from '../components/PortfolioChart.jsx';

function categorizaRow(row) {
  if (['US Stock','US ETF'].includes(row.tipo)) return 'International';
  if (row.tipo === 'BR Stock') return 'BR Stocks';
  if (row.tipo === 'BR REIT')  return 'BR REITs';
  if (row.tipo === 'Treasury') return 'Fixed Income';
  if (row.setor === 'Pension') return 'Pension';
  return 'Other';
}

const PIE_COLORS = ['#667eea','#00d4aa','#ffa726','#ab47bc','#26c6da','#ef5350','#a78bfa','#f472b6'];

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  if (percent < 0.04) return null;
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={10} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function VisaoGeral({ df }) {
  // ── By class ──────────────────────────────────────────────────────────
  const byTipo = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.tipo] = (m[r.tipo] ?? 0) + r.totalAtual; });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) })).sort((a,b) => b.value - a.value);
  }, [df]);

  const bySetor = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.setor] = (m[r.setor] ?? 0) + r.totalAtual; });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) })).sort((a,b) => b.value - a.value);
  }, [df]);

  // ── Individual performance ────────────────────────────────────────────
  const sorted_pct = useMemo(() =>
    [...df].sort((a, b) => a.pctGanho - b.pctGanho), [df]);

  const sorted_abs = useMemo(() =>
    [...df].sort((a, b) => a.ganho - b.ganho), [df]);

  // ── Top 20 ────────────────────────────────────────────────────────────
  const top20 = useMemo(() =>
    [...df].sort((a, b) => b.totalAtual - a.totalAtual).slice(0, 20), [df]);

  // ── By class returns ──────────────────────────────────────────────────
  const byTipoGain = useMemo(() => {
    const m = {};
    df.forEach(r => {
      if (!m[r.tipo]) m[r.tipo] = { inv: 0, atu: 0 };
      m[r.tipo].inv += r.totalInvestido;
      m[r.tipo].atu += r.totalAtual;
    });
    return Object.entries(m).map(([tipo, v]) => ({
      tipo,
      retorno: +((v.atu / v.inv - 1) * 100).toFixed(2),
      ganho: +(v.atu - v.inv).toFixed(2),
    })).sort((a,b) => b.retorno - a.retorno);
  }, [df]);

  // ── Table columns ─────────────────────────────────────────────────────
  const columns = [
    { key: 'ativo',          label: 'Asset' },
    { key: 'tipo',           label: 'Type', render: (v) => (
      <span className="tag tag-neu" style={{ background: `${TIPO_COLOR[v]}22`, color: TIPO_COLOR[v] }}>{v}</span>
    )},
    { key: 'setor',          label: 'Sector' },
    { key: 'totalInvestido', label: 'Invested',   format: 'brl',      align: 'right' },
    { key: 'totalAtual',     label: 'Current',    format: 'brl',      align: 'right' },
    { key: 'ganho',          label: 'Gain (R$)',  format: 'brl_gain', align: 'right' },
    { key: 'pctGanho',       label: 'Gain (%)',   format: 'pct',      align: 'right' },
    { key: 'peso',           label: 'Weight (%)', format: 'weight',   align: 'right' },
  ];

  const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
      <div className="chart-tooltip">
        <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{label}</p>
        <span style={{ color: colorByValue(v) }}>{pct(v)}</span>
      </div>
    );
  };

  const BarTooltipAbs = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
      <div className="chart-tooltip">
        <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{label}</p>
        <span style={{ color: colorByValue(v) }}>{brlFull(v)}</span>
      </div>
    );
  };

  const BAR_H = Math.max(520, df.length * 22);

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── TradingView portfolio chart ── */}
      <PortfolioChart />

      {/* ── Allocation pies ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Allocation by Asset Class">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byTipo} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}
                   stroke="none" labelLine={false} label={CustomLabel}>
                {byTipo.map((e, i) => (
                  <Cell key={i} fill={TIPO_COLOR[e.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={v => (
                <span style={{ color: '#8892b0', fontSize: '0.78rem' }}>{v}</span>
              )} />
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600, color: TIPO_COLOR[d.name] }}>{d.name}</p>
                    <p>{brl(d.value)}</p>
                  </div>
                );
              }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Allocation by Sector">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={bySetor} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}
                   stroke="none" labelLine={false} label={CustomLabel}>
                {bySetor.map((e, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={v => (
                <span style={{ color: '#8892b0', fontSize: '0.78rem' }}>{v}</span>
              )} />
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{d.name}</p>
                    <p>{brl(d.value)}</p>
                  </div>
                );
              }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Individual returns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Individual Return (%)">
          <ResponsiveContainer width="100%" height={BAR_H}>
            <BarChart data={sorted_pct} layout="vertical" margin={{ left: 10, right: 48, top: 4, bottom: 4 }}>
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
              <RCTooltip content={BarTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="pctGanho" name="Retorno" radius={[0,3,3,0]}>
                {sorted_pct.map((e, i) => (
                  <Cell key={i} fill={e.pctGanho >= 0 ? POS : NEG} />
                ))}
                <LabelList dataKey="pctGanho" position="right" formatter={v => pct(v)} style={{ fill: '#8892b0', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Absolute Gain / Loss (R$)">
          <ResponsiveContainer width="100%" height={BAR_H}>
            <BarChart data={sorted_abs} layout="vertical" margin={{ left: 10, right: 64, top: 4, bottom: 4 }}>
              <XAxis type="number" tickFormatter={v => brl(v)} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
              <RCTooltip content={BarTooltipAbs} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="ganho" name="Ganho" radius={[0,3,3,0]}>
                {sorted_abs.map((e, i) => (
                  <Cell key={i} fill={e.ganho >= 0 ? POS : NEG} />
                ))}
                <LabelList dataKey="ganho" position="right" formatter={v => brl(v)} style={{ fill: '#8892b0', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Top 20 positions ── */}
      <ChartCard title="Top 20 Positions — Current Value">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={top20} margin={{ left: 0, right: 20, top: 4, bottom: 40 }}>
            <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => brl(v)} tick={TICK_STYLE} axisLine={false} tickLine={false} />
            <RCTooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{label}</p>
                  <p>{brlFull(payload[0].value)}</p>
                </div>
              );
            }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="totalAtual" name="Current Value" radius={[4,4,0,0]}>
              {top20.map((e, i) => (
                <Cell key={i} fill={TIPO_COLOR[e.tipo] ?? ACC} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Return by class ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Return (%) by Asset Class">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byTipoGain} margin={{ left: 0, right: 20, top: 4, bottom: 20 }}>
              <XAxis dataKey="tipo" tick={{ ...TICK_STYLE, fontSize: 10 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{label}</p>
                    <p style={{ color: colorByValue(v) }}>{pct(v)}</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="retorno" name="Return %" radius={[4,4,0,0]}>
                {byTipoGain.map((e, i) => (
                  <Cell key={i} fill={TIPO_COLOR[e.tipo] ?? ACC} />
                ))}
                <LabelList dataKey="retorno" position="top" formatter={v => pct(v)} style={{ fill: '#8892b0', fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Absolute Gain (R$) by Asset Class">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byTipoGain} margin={{ left: 0, right: 20, top: 4, bottom: 20 }}>
              <XAxis dataKey="tipo" tick={{ ...TICK_STYLE, fontSize: 10 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => brl(v)} tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <RCTooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="chart-tooltip">
                    <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{label}</p>
                    <p style={{ color: colorByValue(payload[0].value) }}>{brlFull(payload[0].value)}</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="ganho" name="Gain R$" radius={[4,4,0,0]}>
                {byTipoGain.map((e, i) => (
                  <Cell key={i} fill={TIPO_COLOR[e.tipo] ?? ACC} />
                ))}
                <LabelList dataKey="ganho" position="top" formatter={v => brl(v)} style={{ fill: '#8892b0', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Full table ── */}
      <div className="glass" style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt-1)', marginBottom: 16 }}>
          Full Portfolio Table
        </p>
        <DataTable data={df} columns={columns} defaultSort={{ key: 'totalAtual', dir: 'desc' }} />
      </div>
    </div>
  );
}
