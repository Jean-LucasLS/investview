import { useState, useMemo, useEffect } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip as RCTooltip, ResponsiveContainer, BarChart, Bar, Cell,
  LabelList, ReferenceLine, Legend,
} from 'recharts';
import { useIndicators } from '../hooks.jsx';
import { TICK_STYLE, GRID_STYLE, ACC, brl, pct, colorByValue } from '../utils.js';
import ChartCard from '../components/ChartCard.jsx';
import DataTable from '../components/DataTable.jsx';

const IND_OPTIONS = [
  { key: 'PL',        label: 'P/E' },
  { key: 'DY',        label: 'DY (%)' },
  { key: 'ROE',       label: 'ROE (%)' },
  { key: 'ROA',       label: 'ROA (%)' },
  { key: 'EVEBITDA',  label: 'EV/EBITDA' },
  { key: 'MargemLiq', label: 'Net Margin (%)' },
  { key: 'MargemOp',  label: 'Op. Margin (%)' },
  { key: 'Beta',      label: 'Beta' },
];

const TIPO_C = { 'US Stock': '#667eea', 'US ETF': '#26c6da' };
const SETOR_COLORS = ['#667eea','#00d4aa','#ffa726','#ab47bc','#26c6da','#ef5350','#a78bfa','#f472b6'];
function getSeColor(setor, setores) { return SETOR_COLORS[setores.indexOf(setor) % SETOR_COLORS.length]; }

export default function AcoesEUA({ df, onStatusChange }) {
  const [selectedInd, setSelectedInd] = useState('PL');

  const eua     = useMemo(() => df.filter(r => ['US Stock','US ETF'].includes(r.tipo) && r.tickerYF), [df]);
  const setores = useMemo(() => [...new Set(eua.map(r => r.setor))], [eua]);
  const tickers = useMemo(() => eua.map(r => r.tickerYF), [eua]);

  const { indicators, status: indStatus } = useIndicators(tickers);

  useEffect(() => { onStatusChange?.(indStatus); }, [indStatus]);

  const enriched = useMemo(() =>
    eua.map(r => ({ ...r, ...(indicators[r.tickerYF] ?? {}) }))
  , [eua, indicators]);

  const scatterPL_DY = useMemo(() =>
    enriched.filter(r => r.PL != null && r.DY != null)
      .map(r => ({ ativo: r.ativo, tipo: r.tipo, setor: r.setor, x: r.PL, y: r.DY, z: r.totalAtual, pctg: r.pctGanho }))
  , [enriched]);

  const scatterROE_Marg = useMemo(() =>
    enriched.filter(r => r.ROE != null && r.MargemLiq != null)
      .map(r => ({ ativo: r.ativo, tipo: r.tipo, setor: r.setor, x: r.ROE, y: r.MargemLiq, z: r.totalAtual, pctg: r.pctGanho }))
  , [enriched]);

  const barData = useMemo(() =>
    enriched.filter(r => r[selectedInd] != null)
      .sort((a,b) => a[selectedInd] - b[selectedInd])
  , [enriched, selectedInd]);

  const matrixData = useMemo(() =>
    enriched.filter(r => r.EVEBITDA != null && r.PL != null)
      .map(r => ({ ativo: r.ativo, setor: r.setor, x: r.PL, y: r.EVEBITDA, z: r.totalAtual, pctg: r.pctGanho }))
  , [enriched]);

  const ScTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{d.ativo}</p>
        <p style={{ color: '#8892b0' }}>{d.setor}</p>
        <p>Position: {brl(d.z)}</p>
        <p style={{ color: colorByValue(d.pctg) }}>Gain: {pct(d.pctg)}</p>
      </div>
    );
  };

  const tableColumns = [
    { key: 'ativo',          label: 'Asset' },
    { key: 'tipo',           label: 'Type' },
    { key: 'setor',          label: 'Sector' },
    { key: 'totalAtual',     label: 'Value (R$)',    format: 'brl',  align: 'right' },
    { key: 'pctGanho',       label: 'Gain (%)',      format: 'pct',  align: 'right' },
    { key: 'PL',             label: 'P/E',        align: 'right', render: v => v?.toFixed(1) ?? '—' },
    { key: 'DY',             label: 'DY %',       align: 'right', render: v => v != null ? `${v.toFixed(1)}%` : '—' },
    { key: 'ROE',            label: 'ROE %',      align: 'right', render: v => v != null ? `${v.toFixed(1)}%` : '—' },
    { key: 'EVEBITDA',       label: 'EV/EBITDA',  align: 'right', render: v => v?.toFixed(1) ?? '—' },
    { key: 'Beta',           label: 'Beta',       align: 'right', render: v => v?.toFixed(2) ?? '—' },
    { key: 'MargemLiq',      label: 'Net Margin %', align: 'right', render: v => v != null ? `${v.toFixed(1)}%` : '—' },
  ];

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Scatter P/L × DY and ROE × Margem ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="P/E × Dividend Yield — US Stocks">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 16 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="x" type="number" name="P/L" tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'P/L', position: 'insideBottom', offset: -4, fill: '#8892b0', fontSize: 11 }} />
              <YAxis dataKey="y" type="number" name="DY %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'DY (%)', angle: -90, position: 'insideLeft', fill: '#8892b0', fontSize: 11 }} />
              <ZAxis dataKey="z" range={[60,600]} />
              <RCTooltip content={<ScTooltip />} />
              {setores.map(s => {
                const pts = scatterPL_DY.filter(p => p.setor === s);
                return pts.length ? <Scatter key={s} data={pts} fill={getSeColor(s, setores)} name={s} opacity={0.85} /> : null;
              })}
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ROE × Net Margin — US Stocks">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 16 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="x" type="number" name="ROE %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'ROE (%)', position: 'insideBottom', offset: -4, fill: '#8892b0', fontSize: 11 }} />
              <YAxis dataKey="y" type="number" name="Marg. Líq. %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'Marg. Líq. (%)', angle: -90, position: 'insideLeft', fill: '#8892b0', fontSize: 11 }} />
              <ZAxis dataKey="z" range={[60,600]} />
              <RCTooltip content={<ScTooltip />} />
              {setores.map(s => {
                const pts = scatterROE_Marg.filter(p => p.setor === s);
                return pts.length ? <Scatter key={s} data={pts} fill={getSeColor(s, setores)} name={s} opacity={0.85} /> : null;
              })}
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── EV/EBITDA × P/L matrix ── */}
      <ChartCard title="EV/EBITDA × P/E — Valuation Matrix">
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 16 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="x" type="number" name="P/L" tick={TICK_STYLE} axisLine={false} tickLine={false}
              label={{ value: 'P/L', position: 'insideBottom', offset: -4, fill: '#8892b0', fontSize: 11 }} />
            <YAxis dataKey="y" type="number" name="EV/EBITDA" tick={TICK_STYLE} axisLine={false} tickLine={false}
              label={{ value: 'EV/EBITDA', angle: -90, position: 'insideLeft', fill: '#8892b0', fontSize: 11 }} />
            <ZAxis dataKey="z" range={[60,700]} />
            <RCTooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontWeight: 600 }}>{d.ativo}</p>
                  <p style={{ color: '#8892b0' }}>P/L: {d.x?.toFixed(1)}</p>
                  <p style={{ color: '#8892b0' }}>EV/EBITDA: {d.y?.toFixed(1)}</p>
                  <p style={{ color: colorByValue(d.pctg) }}>Gain: {pct(d.pctg)}</p>
                </div>
              );
            }} />
            {setores.map(s => {
              const pts = matrixData.filter(p => p.setor === s);
              return pts.length ? <Scatter key={s} data={pts} fill={getSeColor(s, setores)} name={s} opacity={0.85} /> : null;
            })}
            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Indicator bar ── */}
      <ChartCard title={`Indicator Comparison — ${IND_OPTIONS.find(o => o.key === selectedInd)?.label}`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {IND_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setSelectedInd(o.key)} style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid',
              borderColor: selectedInd === o.key ? '#667eea' : 'rgba(255,255,255,0.1)',
              background: selectedInd === o.key ? 'rgba(102,126,234,0.15)' : 'transparent',
              color: selectedInd === o.key ? '#a78bfa' : '#8892b0',
              fontSize: '0.78rem', cursor: 'pointer',
            }}>{o.label}</button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ left: 0, right: 20, top: 4, bottom: 20 }}>
            <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
            <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
            <RCTooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontWeight: 600 }}>{label}</p>
                  <p style={{ color: ACC }}>{payload[0].value?.toFixed(2)}</p>
                </div>
              );
            }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey={selectedInd} radius={[4,4,0,0]}>
              {barData.map((e,i) => <Cell key={i} fill={getSeColor(e.setor, setores)} />)}
              <LabelList dataKey={selectedInd} position="top" formatter={v => v?.toFixed(1)} style={{ fill: '#8892b0', fontSize: 9 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Table ── */}
      <div className="glass" style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt-1)', marginBottom: 16 }}>
          Table — US Stocks &amp; ETFs
        </p>
        <DataTable data={enriched} columns={tableColumns} defaultSort={{ key: 'totalAtual', dir: 'desc' }} />
      </div>
    </div>
  );
}
