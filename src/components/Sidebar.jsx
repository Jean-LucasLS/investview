import { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, Flag, Globe, Building2,
  Landmark, ShieldAlert, PieChart, ChevronLeft, ChevronRight, Table2,
} from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { id: 'overview',        label: 'Overview',       icon: LayoutDashboard },
  { id: 'performance',     label: 'Performance',    icon: TrendingUp },
  { id: 'br-stocks',       label: 'BR Stocks',      icon: Flag },
  { id: 'us-stocks',       label: 'US Stocks',      icon: Globe },
  { id: 'reits',           label: 'REITs',          icon: Building2 },
  { id: 'fixed-income',    label: 'Fixed Income',   icon: Landmark },
  { id: 'risk',            label: 'Risk',           icon: ShieldAlert },
  { id: 'diversification', label: 'Diversification',icon: PieChart },
  { id: 'portfolio',       label: 'Portfolio',      icon: Table2   },
];

export default function Sidebar({ active, onNavigate, quoteStatus, usdBrl, dateStr, timeStr }) {
  const [collapsed, setCollapsed] = useState(false);
  const [logoHover, setLogoHover] = useState(false);

  const statusColor = quoteStatus === 'live' ? '#00d4aa'
    : quoteStatus === 'loading' ? '#ffa726'
    : quoteStatus === 'yahoo-offline' ? '#ffa726'
    : '#ff4b4b';

  const statusText = quoteStatus === 'live'
    ? `Live · USD/BRL ${usdBrl?.toFixed(2)}`
    : quoteStatus === 'loading' ? 'Updating…'
    : quoteStatus === 'yahoo-offline' ? 'Yahoo offline'
    : 'Server offline';

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        transition: 'width 0.25s ease',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo + collapse toggle */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '18px 12px 14px',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        gap: 10,
      }}>
        <div
          onClick={collapsed ? () => setCollapsed(false) : undefined}
          onMouseEnter={() => collapsed && setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          title={collapsed ? 'Expand' : undefined}
          style={{
            width: 32, height: 32, flexShrink: 0,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            cursor: collapsed ? 'pointer' : 'default',
            boxShadow: logoHover ? '0 0 0 2px #667eea, 0 0 10px rgba(102,126,234,0.45)' : 'none',
            transition: 'box-shadow 0.2s ease',
          }}
        >📈</div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--txt-1)', whiteSpace: 'nowrap', flex: 1 }}>
            Investments
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 5,
            border: 'none', background: 'transparent',
            color: '#7a96b8', cursor: 'pointer',
            transition: 'color 0.15s',
            padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#aac4e0'}
          onMouseLeave={e => e.currentTarget.style.color = '#7a96b8'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 10px',
                marginBottom: 2,
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(191,95,255,0.08))'
                  : 'transparent',
                color: isActive ? 'var(--acc)' : 'var(--txt-2)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.85rem',
                textAlign: 'left',
                transition: 'all 0.15s',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                borderLeft: isActive ? '2px solid var(--acc)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: isActive ? 'var(--acc)' : 'var(--txt-2)' }} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Date/time + status footer */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: collapsed ? '10px 0' : '10px 14px 12px',
        display: 'flex', flexDirection: 'column',
        alignItems: collapsed ? 'center' : 'flex-start',
        gap: 4,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusColor, flexShrink: 0,
            animation: quoteStatus === 'loading' ? 'pulse 1s ease-in-out infinite' : 'none',
          }} />
          {!collapsed && (
            <span style={{ fontSize: '0.68rem', color: statusColor, whiteSpace: 'nowrap' }}>
              {statusText}
            </span>
          )}
        </div>
        {!collapsed && (
          <span style={{ fontSize: '0.66rem', color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>
            {dateStr} · {timeStr}
          </span>
        )}
      </div>
    </aside>
  );
}
