import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { colorByValue, brlFull, pct } from '../utils.js';

function SortIcon({ dir }) {
  if (!dir) return <ArrowUpDown size={12} style={{ color: '#4a5568' }} />;
  return dir === 'asc'
    ? <ArrowUp size={12} style={{ color: '#667eea' }} />
    : <ArrowDown size={12} style={{ color: '#667eea' }} />;
}

export default function DataTable({ data, columns, defaultSort, maxRows }) {
  const [sortKey, setSortKey]     = useState(defaultSort?.key ?? null);
  const [sortDir, setSortDir]     = useState(defaultSort?.dir ?? 'desc');
  const [query, setQuery]         = useState('');
  const [page, setPage]           = useState(0);
  const perPage = maxRows ?? 20;

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  }

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter(row =>
      columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(q))
    );
  }, [data, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      return sortDir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 12, maxWidth: 280 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)' }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(0); }}
          placeholder="Buscar..."
          style={{
            width: '100%', padding: '7px 10px 7px 30px',
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--txt-1)', fontSize: '0.82rem', outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => col.sortable !== false && handleSort(col.key)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable !== false && <SortIcon dir={sortKey === col.key ? sortDir : null} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i}>
                {columns.map(col => {
                  const raw = row[col.key];
                  let display = raw;
                  let color;

                  if (col.format === 'brl')    { display = brlFull(raw);  }
                  if (col.format === 'pct')    { display = pct(raw); color = colorByValue(raw); }
                  if (col.format === 'pct0')   { display = pct(raw, 0); color = colorByValue(raw); }
                  if (col.format === 'brl_gain') { display = brlFull(raw); color = colorByValue(raw); }
                  if (col.format === 'weight') { display = `${(+raw).toFixed(2)}%`; }
                  if (col.render)              { display = col.render(raw, row); color = undefined; }

                  return (
                    <td key={col.key} style={{ color: color ?? 'var(--txt-1)', textAlign: col.align ?? 'left' }}>
                      {col.render ? display : display ?? '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--txt-3)', padding: 24 }}>Nenhum resultado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: '0.78rem', color: 'var(--txt-2)' }}>
          <span>{filtered.length} registros</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{
                width: 28, height: 28,
                background: page === i ? 'rgba(102,126,234,0.2)' : 'transparent',
                border: '1px solid',
                borderColor: page === i ? 'var(--acc)' : 'var(--border)',
                borderRadius: 6, color: page === i ? 'var(--acc)' : 'var(--txt-2)',
                cursor: 'pointer', fontSize: '0.78rem',
              }}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
