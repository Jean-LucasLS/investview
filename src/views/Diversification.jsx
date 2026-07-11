import { useMemo } from 'react';
import {
  Treemap, ResponsiveContainer, Tooltip as RCTooltip,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts';
import { TIPO_COLOR, TICK_STYLE, GRID_STYLE, ACC, brl, brlFull, pct, colorByValue, CHART_COLORS } from '../utils.js';
import ChartCard from '../components/ChartCard.jsx';

// ── Concentration index (HHI) ─────────────────────────────────────────────
function calcHHI(weights) {
  return weights.reduce((s, w) => s + (w/100) ** 2, 0) * 10000;
}

const GEO_COLORS = { '🇧🇷 Brasil': '#00d4aa', '🇺🇸 EUA': '#667eea' };
const CUR_COLORS = { 'BRL': '#00d4aa', 'USD': '#667eea' };

function CustomTreemapContent({ x, y, width, height, name, tipo, pctGanho }) {
  const color = TIPO_COLOR[tipo] ?? ACC;
  const isSmall = width < 36 || height < 28;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height}
        fill={color} fillOpacity={0.75} stroke="#080c17" strokeWidth={2} rx={3} />
      {!isSmall && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central"
          fill="#fff" fontSize={Math.min(12, width / 5)} fontWeight={500}>
          {name}
        </text>
      )}
      {height > 42 && width > 60 && (
        <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" dominantBaseline="central"
          fill="rgba(255,255,255,0.65)" fontSize={9}>
          {pct(pctGanho)}
        </text>
      )}
    </g>
  );
}

export default function Diversificacao({ df }) {
  // ── Treemap data ──────────────────────────────────────────────────────
  const treemapData = useMemo(() => {
    const byTipo = {};
    df.forEach(r => {
      if (!byTipo[r.tipo]) byTipo[r.tipo] = { name: r.tipo, children: [] };
      byTipo[r.tipo].children.push({
        name: r.ativo, size: r.totalAtual, tipo: r.tipo, pctGanho: r.pctGanho, setor: r.setor,
      });
    });
    return Object.values(byTipo);
  }, [df]);

  // ── Geographic / currency ─────────────────────────────────────────────
  const geoData = useMemo(() => {
    const m = {};
    df.forEach(r => {
      const g = r.moeda === 'USD' ? '🇺🇸 EUA' : '🇧🇷 Brasil';
      m[g] = (m[g] ?? 0) + r.totalAtual;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [df]);

  const curData = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.moeda] = (m[r.moeda] ?? 0) + r.totalAtual; });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [df]);

  // ── Sector allocation ─────────────────────────────────────────────────
  const sectorData = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.setor] = (m[r.setor] ?? 0) + r.totalAtual; });
    const total = df.reduce((s,r) => s + r.totalAtual, 0);
    return Object.entries(m)
      .map(([setor, value]) => ({ setor, value: +value.toFixed(2), peso: +(value/total*100).toFixed(1) }))
      .sort((a,b) => b.value - a.value);
  }, [df]);

  // ── HHI by asset type ─────────────────────────────────────────────────
  const total = useMemo(() => df.reduce((s,r) => s + r.totalAtual, 0), [df]);
  const hhi = useMemo(() => calcHHI(df.map(r => r.peso)), [df]);
  const hhiByTipo = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.tipo] = (m[r.tipo] ?? 0) + r.totalAtual; });
    return calcHHI(Object.values(m).map(v => v/total*100));
  }, [df, total]);

  function hhiLabel(h) {
    if (h < 1000) return { label: 'High Diversification', color: '#00d4aa' };
    if (h < 2500) return { label: 'Moderate Diversification', color: '#ffa726' };
    return { label: 'Concentrated', color: '#ff4b4b' };
  }

  const hhiInfo = hhiLabel(hhi);

  // ── Nested donut (class → sector) ────────────────────────────────────
  const outerRing = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.tipo] = (m[r.tipo] ?? 0) + r.totalAtual; });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) })).sort((a,b) => b.value - a.value);
  }, [df]);

  const innerRing = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.setor] = (m[r.setor] ?? 0) + r.totalAtual; });
    return Object.entries(m).map(([name, value]) => ({ name, value: +value.toFixed(2) })).sort((a,b) => b.value - a.value).slice(0, 10);
  }, [df]);

  return (
    <div className="view-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── HHI summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <div className="glass" style={{ padding: '14px 18px' }}>
          <p style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>HHI — Assets</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: hhiInfo.color }}>{hhi.toFixed(0)}</p>
          <p style={{ fontSize: '0.75rem', color: hhiInfo.color }}>{hhiInfo.label}</p>
          <p style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 4 }}>Herfindahl-Hirschman Index (0–10000)</p>
        </div>
        <div className="glass" style={{ padding: '14px 18px' }}>
          <p style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>HHI — Classes</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: hhiLabel(hhiByTipo).color }}>{hhiByTipo.toFixed(0)}</p>
          <p style={{ fontSize: '0.75rem', color: hhiLabel(hhiByTipo).color }}>{hhiLabel(hhiByTipo).label}</p>
        </div>
        <div className="glass" style={{ padding: '14px 18px' }}>
          <p style={{ fontSize: '0.7rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>No. of Assets</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e2e8f0' }}>{df.length}</p>
          <p style={{ fontSize: '0.75rem', color: '#8892b0' }}>{[...new Set(df.map(r => r.tipo))].length} classes · {[...new Set(df.map(r => r.setor))].length} sectors</p>
        </div>
      </div>

      {/* ── Treemap ── */}
      <ChartCard title="Treemap — Class → Asset  (color = class · opacity = size)">
        <ResponsiveContainer width="100%" height={460}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={16/9}
            content={<CustomTreemapContent />}
          >
            <RCTooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontWeight: 600, color: TIPO_COLOR[d.tipo] ?? '#e2e8f0' }}>{d.name}</p>
                  {d.tipo && <p style={{ color: '#8892b0' }}>{d.tipo} · {d.setor}</p>}
                  {d.size && <p>{brlFull(d.size)}</p>}
                  {d.pctGanho != null && <p style={{ color: colorByValue(d.pctGanho) }}>{pct(d.pctGanho)}</p>}
                </div>
              );
            }} />
          </Treemap>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Geo + Currency pies ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Geographic Exposure">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={geoData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105}
                stroke="none"
                label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                  return (
                    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
                      textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={11} fontWeight={600}>
                      {`${(percent*100).toFixed(0)}%`}
                    </text>
                  );
                }} labelLine={false}>
                {geoData.map((e,i) => <Cell key={i} fill={GEO_COLORS[e.name] ?? CHART_COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.78rem' }}>{v}</span>} />
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="chart-tooltip"><p style={{ fontWeight: 600 }}>{d.name}</p><p>{brlFull(d.value)}</p></div>;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Currency Exposure — BRL vs USD">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={curData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105}
                stroke="none"
                label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                  return (
                    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
                      textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={11} fontWeight={600}>
                      {name}: {`${(percent*100).toFixed(0)}%`}
                    </text>
                  );
                }} labelLine={false}>
                {curData.map((e,i) => <Cell key={i} fill={CUR_COLORS[e.name] ?? CHART_COLORS[i]} />)}
              </Pie>
              <RCTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="chart-tooltip"><p style={{ fontWeight: 600 }}>{d.name}</p><p>{brlFull(d.value)}</p></div>;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Sector allocation ── */}
      <ChartCard title="Sector Allocation">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sectorData} layout="vertical" margin={{ left: 10, right: 80, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => brl(v)} tick={TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="setor" tick={{ ...TICK_STYLE, fontSize: 10 }} width={110} axisLine={false} tickLine={false} />
            <RCTooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontWeight: 600 }}>{label}</p>
                  <p>{brlFull(payload[0].value)}</p>
                  <p style={{ color: '#8892b0' }}>{sectorData.find(s => s.setor === label)?.peso}%</p>
                </div>
              );
            }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[0,4,4,0]}>
              {sectorData.map((e,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              <LabelList dataKey="peso" position="right" formatter={v => `${v}%`} style={{ fill: '#8892b0', fontSize: 10 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Nested donut ── */}
      <ChartCard title="Class → Sector Hierarchy (Sunburst)">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={outerRing} dataKey="value" nameKey="name" innerRadius={120} outerRadius={150}
              stroke="none" labelLine={false}
              label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                if (percent < 0.04) return null;
                const RADIAN = Math.PI / 180;
                const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                return (
                  <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
                    textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={10} fontWeight={500}>
                    {name.length > 8 ? name.slice(0,8) + '…' : name}
                  </text>
                );
              }}>
              {outerRing.map((e,i) => <Cell key={i} fill={TIPO_COLOR[e.name] ?? CHART_COLORS[i]} />)}
            </Pie>
            <Pie data={innerRing} dataKey="value" nameKey="name" innerRadius={70} outerRadius={115}
              stroke="none" labelLine={false}
              label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                if (percent < 0.06) return null;
                const RADIAN = Math.PI / 180;
                const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                return (
                  <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
                    textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.8)" fontSize={8}>
                    {`${(percent*100).toFixed(0)}%`}
                  </text>
                );
              }}>
              {innerRing.map((e,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.6} />)}
            </Pie>
            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>{v}</span>} />
            <RCTooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return <div className="chart-tooltip"><p style={{ fontWeight: 600 }}>{d.name}</p><p>{brlFull(d.value)}</p></div>;
            }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
