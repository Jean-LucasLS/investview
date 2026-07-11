import { useState, useMemo, useEffect } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip as RCTooltip, ResponsiveContainer, BarChart, Bar, Cell,
  LabelList, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from 'recharts';
import { useIndicators } from '../hooks.jsx';
import { TICK_STYLE, GRID_STYLE, POS, NEG, ACC, brl, brlFull, pct, colorByValue } from '../utils.js';
import ChartCard from '../components/ChartCard.jsx';
import DataTable from '../components/DataTable.jsx';

const IND_OPTIONS = [
  { key: 'PL',       label: 'P/E' },
  { key: 'PVP',      label: 'P/B' },
  { key: 'DY',       label: 'DY (%)' },
  { key: 'ROE',      label: 'ROE (%)' },
  { key: 'ROA',      label: 'ROA (%)' },
  { key: 'EVEBITDA', label: 'EV/EBITDA' },
  { key: 'MargemLiq',label: 'Net Margin (%)' },
  { key: 'MargemOp', label: 'Op. Margin (%)' },
  { key: 'Beta',     label: 'Beta' },
];

const SETOR_COLORS = ['#667eea','#00d4aa','#ffa726','#ab47bc','#26c6da','#ef5350','#a78bfa','#f472b6'];

function getSetorColor(setor, setores) {
  return SETOR_COLORS[setores.indexOf(setor) % SETOR_COLORS.length];
}

export default function AcoesBR({ df, onStatusChange }) {
  const [selectedInd, setSelectedInd] = useState('PL');

  const br      = useMemo(() => df.filter(r => r.tipo === 'BR Stock' && r.tickerYF), [df]);
  const setores = useMemo(() => [...new Set(br.map(r => r.setor))], [br]);
  const tickers = useMemo(() => br.map(r => r.tickerYF), [br]);

  const { indicators, status: indStatus } = useIndicators(tickers);

  useEffect(() => { onStatusChange?.(indStatus); }, [indStatus]);

  const enriched = useMemo(() => br.map(r => ({
    ...r, ...(indicators[r.tickerYF] ?? {}),
  })), [br, indicators]);

  const scatterPL_DY = useMemo(() =>
    enriched.filter(r => r.PL != null && r.DY != null)
      .map(r => ({ ativo: r.ativo, setor: r.setor, x: r.PL, y: r.DY, z: r.totalAtual, pct: r.pctGanho }))
  , [enriched]);

  const scatterPVP_ROE = useMemo(() =>
    enriched.filter(r => r.PVP != null && r.ROE != null)
      .map(r => ({ ativo: r.ativo, setor: r.setor, x: r.PVP, y: r.ROE, z: r.totalAtual, pct: r.pctGanho }))
  , [enriched]);

  const barData = useMemo(() =>
    enriched.filter(r => r[selectedInd] != null)
      .sort((a,b) => a[selectedInd] - b[selectedInd])
  , [enriched, selectedInd]);

  const radarData = useMemo(() => {
    const keys = ['PL','PVP','DY','ROE','Beta'];
    // Normalize each key to 0-100 range
    const maxes = {};
    keys.forEach(k => { maxes[k] = Math.max(...enriched.map(r => r[k] ?? 0)); });
    const subjects = keys.map(k => {
      const obj = { key: k };
      enriched.forEach(r => { obj[r.ativo] = maxes[k] ? ((r[k] ?? 0) / maxes[k] * 100) : 0; });
      return obj;
    });
    return subjects;
  }, [enriched]);

  const tableColumns = [
    { key: 'ativo',          label: 'Asset' },
    { key: 'setor',          label: 'Sector' },
    { key: 'totalInvestido', label: 'Invested (R$)', format: 'brl',  align: 'right' },
    { key: 'pctGanho',       label: 'Gain (%)',      format: 'pct',  align: 'right' },
    { key: 'PL',             label: 'P/E',  align: 'right', render: v => v?.toFixed(1) ?? '—' },
    { key: 'PVP',            label: 'P/B',  align: 'right', render: v => v?.toFixed(2) ?? '—' },
    { key: 'DY',             label: 'DY %', align: 'right', render: v => v != null ? `${v.toFixed(1)}%` : '—' },
    { key: 'ROE',            label: 'ROE %',align: 'right', render: v => v != null ? `${v.toFixed(1)}%` : '—' },
    { key: 'Beta',           label: 'Beta', align: 'right', render: v => v?.toFixed(2) ?? '—' },
  ];

  const ScTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{d.ativo}</p>
        <p style={{ color: '#8892b0' }}>{d.setor}</p>
        <p>Position: {brl(d.z)}</p>
        <p style={{ color: colorByValue(d.pct) }}>Gain: {pct(d.pct)}</p>
      </div>
    );
  };

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── P/L × DY and P/VP × ROE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="P/E × Dividend Yield — Valuation vs Dividends">
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
                return pts.length ? (
                  <Scatter key={s} data={pts} fill={getSetorColor(s, setores)} name={s} opacity={0.85} />
                ) : null;
              })}
              <Legend iconType="circle" iconSize={8} formatter={v => (
                <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>
              )} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="P/B × ROE — Price/Book vs Return">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 16 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="x" type="number" name="P/VP" tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'P/VP', position: 'insideBottom', offset: -4, fill: '#8892b0', fontSize: 11 }} />
              <YAxis dataKey="y" type="number" name="ROE %" tickFormatter={v => `${v}%`} tick={TICK_STYLE} axisLine={false} tickLine={false}
                label={{ value: 'ROE (%)', angle: -90, position: 'insideLeft', fill: '#8892b0', fontSize: 11 }} />
              <ZAxis dataKey="z" range={[60,600]} />
              <RCTooltip content={<ScTooltip />} />
              {setores.map(s => {
                const pts = scatterPVP_ROE.filter(p => p.setor === s);
                return pts.length ? (
                  <Scatter key={s} data={pts} fill={getSetorColor(s, setores)} name={s} opacity={0.85} />
                ) : null;
              })}
              <Legend iconType="circle" iconSize={8} formatter={v => (
                <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>
              )} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Indicator selector bar chart ── */}
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
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} margin={{ left: 0, right: 20, top: 4, bottom: 20 }}>
            <XAxis dataKey="ativo" tick={{ ...TICK_STYLE, fontSize: 10 }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
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
              {barData.map((e,i) => <Cell key={i} fill={getSetorColor(e.setor, setores)} />)}
              <LabelList dataKey={selectedInd} position="top" formatter={v => v?.toFixed(1)} style={{ fill: '#8892b0', fontSize: 9 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Radar chart ── */}
      <ChartCard title="Multi-Indicator Radar (normalised 0–100)">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="key" tick={{ fill: '#8892b0', fontSize: 11 }} />
            {enriched.slice(0, 8).map((r, i) => (
              <Radar key={r.ativo} name={r.ativo} dataKey={r.ativo}
                stroke={getSetorColor(r.setor, setores)} fill={getSetorColor(r.setor, setores)}
                fillOpacity={0.08} strokeWidth={1.5}
              />
            ))}
            <Legend iconType="circle" iconSize={8} formatter={v => (
              <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>
            )} />
            <RCTooltip />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Table ── */}
      <div className="glass" style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt-1)', marginBottom: 16 }}>
          Tabela — Ações BR com Indicadores
        </p>
        <DataTable data={enriched} columns={tableColumns} defaultSort={{ key: 'totalInvestido', dir: 'desc' }} />
      </div>
    </div>
  );
}
