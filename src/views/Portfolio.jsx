// src/views/Portfolio.jsx — Full portfolio table with filters and visual indicators
import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TIPO_COLOR, TIPO_COLOR_LIGHT, brlFull, pct, POS, NEG } from '../utils.js';

const FILTERS = ['All', 'BR Stock', 'US Stock', 'US ETF', 'BR REIT', 'Treasury', 'Fund'];

const COLS = [
  { key: 'ativo',          label: 'Asset',       align: 'left',  w: '13%' },
  { key: 'tipo',           label: 'Type',        align: 'left',  w: '8%'  },
  { key: 'setor',          label: 'Sector',      align: 'left',  w: '11%' },
  { key: 'qtd',            label: 'Qty',         align: 'right', w: '6%'  },
  { key: 'precoMedio',     label: 'Avg Price',   align: 'right', w: '8%'  },
  { key: 'precoAtual',     label: 'Price',       align: 'right', w: '9%'  },
  { key: 'totalInvestido', label: 'Invested',    align: 'right', w: '9%'  },
  { key: 'totalAtual',     label: 'Current',     align: 'right', w: '9%'  },
  { key: 'ganho',          label: 'Gain/Loss',   align: 'right', w: '10%' },
  { key: 'pctGanho',       label: '% Gain',      align: 'right', w: '9%'  },
  { key: 'peso',           label: 'Weight',      align: 'left',  w: '9%'  },
];

function SortIcon({ dir }) {
  if (!dir) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />;
  return dir === 'asc'
    ? <ArrowUp   size={11} style={{ color: 'var(--acc)' }} />
    : <ArrowDown size={11} style={{ color: 'var(--acc)' }} />;
}

function GainArrow({ value }) {
  if (value >  0.3) return <TrendingUp   size={13} style={{ color: POS, flexShrink: 0 }} />;
  if (value < -0.3) return <TrendingDown size={13} style={{ color: NEG, flexShrink: 0 }} />;
  return <Minus size={13} style={{ color: '#4a5568', flexShrink: 0 }} />;
}

function PesoBar({ value, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, maxWidth: 52, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: 'var(--acc)', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--txt-2)', whiteSpace: 'nowrap' }}>{value?.toFixed(1)}%</span>
    </div>
  );
}

function BrlCell({ value, muted }) {
  if (value == null) return <span style={{ color: 'var(--txt-3)' }}>—</span>;
  const str = Math.abs(value) >= 1000
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  return <span style={{ color: muted ? 'var(--txt-2)' : 'var(--txt-1)' }}>{str}</span>;
}

export default function Carteira({ df }) {
  const [filter,  setFilter]  = useState('All');
  const [query,   setQuery]   = useState('');
  const [sortKey, setSortKey] = useState('totalAtual');
  const [sortDir, setSortDir] = useState('desc');

  const maxPeso = useMemo(() => Math.max(...df.map(r => r.peso ?? 0)), [df]);
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const TC = isLight ? TIPO_COLOR_LIGHT : TIPO_COLOR;

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const rows = useMemo(() => {
    let r = df;
    if (filter !== 'All') r = r.filter(x => x.tipo === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(x =>
        x.ativo?.toLowerCase().includes(q) ||
        x.setor?.toLowerCase().includes(q) ||
        x.tipo?.toLowerCase().includes(q)
      );
    }
    return [...r].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      return sortDir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
  }, [df, filter, query, sortKey, sortDir]);

  const totalInv  = rows.reduce((s, r) => s + r.totalInvestido, 0);
  const totalAtu  = rows.reduce((s, r) => s + r.totalAtual, 0);
  const totalGain = totalAtu - totalInv;
  const totalPct  = totalInv > 0 ? (totalGain / totalInv * 100) : 0;
  const gainColor = totalGain >= 0 ? 'var(--pos)' : 'var(--neg)';

  // Count by type for filter pills
  const countByTipo = useMemo(() => {
    const m = {};
    df.forEach(r => { m[r.tipo] = (m[r.tipo] ?? 0) + 1; });
    return m;
  }, [df]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
              placeholder="Search asset, sector…"
            style={{
              padding: '7px 12px 7px 30px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--txt-1)',
              fontSize: '0.82rem', outline: 'none', width: 200,
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = filter === f;
            const color  = TC[f] ?? 'var(--acc)';
            const count  = f === 'All' ? df.length : (countByTipo[f] ?? 0);
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                fontSize: '0.73rem', fontWeight: 600,
                background: active ? `${color}22` : 'var(--bg-hover)',
                border: `1px solid ${active ? color : 'var(--border-lit)'}`,
                color: active ? color : 'var(--txt-2)',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}>
                {f}
                <span style={{
                  fontSize: '0.65rem', padding: '1px 5px', borderRadius: 8,
                  background: 'var(--bg-card)',
                  color: 'var(--txt-3)',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--txt-3)', marginBottom: 1 }}>Current (filtered)</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--txt-1)' }}>{brlFull(totalAtu)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--txt-3)', marginBottom: 1 }}>Gain/Loss</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: gainColor }}>
              {totalGain >= 0 ? '+' : ''}{brlFull(totalGain)}
            </div>
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: `${gainColor}18`,
            border: `1px solid ${gainColor}40`,
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: gainColor }}>
              {totalGain >= 0 ? '▲' : '▼'} {Math.abs(totalPct).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        borderRadius: 10, border: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '10px 12px',
                    textAlign: col.align,
                    fontSize: '0.7rem', fontWeight: 600,
                    color: sortKey === col.key ? 'var(--acc)' : 'var(--txt-2)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    position: 'sticky', top: 0, zIndex: 2,
                    width: col.w,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    <SortIcon dir={sortKey === col.key ? sortDir : null} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const gainColor = row.ganho > 0 ? 'var(--pos)' : row.ganho < 0 ? 'var(--neg)' : 'var(--txt-3)';
              const tipoColor = TC[row.tipo] ?? 'var(--acc)';
              return (
                <tr
                  key={row.ativo}
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg-hover)',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(102,126,234,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-hover)'}
                >
                  {/* Ativo */}
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 3, height: 26, borderRadius: 2, background: tipoColor, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--txt-1)' }}>{row.ativo}</span>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                      background: `${tipoColor}20`, color: tipoColor, whiteSpace: 'nowrap',
                    }}>{row.tipo}</span>
                  </td>

                  {/* Setor */}
                  <td style={{ padding: '8px 12px', fontSize: '0.76rem', color: 'var(--txt-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.setor}
                  </td>

                  {/* Qtd */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.76rem', color: 'var(--txt-2)' }}>
                    {row.qtd != null
                      ? row.qtd % 1 !== 0
                        ? row.qtd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                        : row.qtd.toLocaleString('pt-BR')
                      : '—'}
                  </td>

                  {/* Preço Médio */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.76rem' }}>
                    {row.precoMedio != null
                      ? <BrlCell value={row.precoMedio} muted />
                      : <span style={{ color: '#4a5568' }}>—</span>}
                  </td>

                  {/* Cotação atual */}
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <GainArrow value={row.pctGanho} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt-1)' }}>
                        {row.precoAtual != null
                          ? row.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
                          : '—'}
                      </span>
                    </div>
                  </td>

                  {/* Total Investido */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.78rem' }}>
                    <BrlCell value={row.totalInvestido} muted />
                  </td>

                  {/* Total Atual */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600 }}>
                    <BrlCell value={row.totalAtual} />
                  </td>

                  {/* Ganho/Perda */}
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: gainColor }}>
                      {row.ganho > 0 ? '+' : ''}{row.ganho?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }) ?? '—'}
                    </span>
                  </td>

                  {/* % Ganho */}
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: '0.78rem', fontWeight: 700, color: gainColor,
                      background: `${gainColor}15`, padding: '3px 8px', borderRadius: 6,
                      whiteSpace: 'nowrap',
                    }}>
                      {row.pctGanho > 0 ? '▲' : row.pctGanho < 0 ? '▼' : '●'}
                      {' '}{Math.abs(row.pctGanho ?? 0).toFixed(2)}%
                    </span>
                  </td>

                  {/* Peso */}
                  <td style={{ padding: '8px 12px' }}>
                    <PesoBar value={row.peso ?? 0} max={maxPeso} />
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── Footer totals ── */}
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-lit)', background: 'rgba(102,126,234,0.06)' }}>
                <td colSpan={3} style={{ padding: '9px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt-2)', textTransform: 'uppercase' }}>
                  Total · {rows.length} assets
                </td>
                <td colSpan={3} />
                <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: '0.8rem', color: '#8892b0', fontWeight: 600 }}>
                  {brlFull(totalInv)}
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 700 }}>
                  {brlFull(totalAtu)}
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: gainColor }}>
                  {totalGain >= 0 ? '+' : ''}{brlFull(totalGain)}
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: '0.8rem', fontWeight: 800, color: gainColor,
                    background: `${gainColor}15`, padding: '3px 8px', borderRadius: 6,
                  }}>
                    {totalGain >= 0 ? '▲' : '▼'} {Math.abs(totalPct).toFixed(2)}%
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>

        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a5568', fontSize: '0.9rem' }}>
            No assets found
          </div>
        )}
      </div>
    </div>
  );
}
