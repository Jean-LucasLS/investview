import { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, Flag, Globe, Building2,
  Landmark, ShieldAlert, PieChart, ChevronLeft, ChevronRight, Table2,
} from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { id: 'visao-geral',    label: 'Visão Geral',    icon: LayoutDashboard },
  { id: 'rentabilidade',  label: 'Rentabilidade',  icon: TrendingUp },
  { id: 'acoes-br',       label: 'Ações BR',        icon: Flag },
  { id: 'acoes-eua',      label: 'Ações EUA',       icon: Globe },
  { id: 'fiis',           label: 'FIIs',            icon: Building2 },
  { id: 'renda-fixa',     label: 'Renda Fixa',      icon: Landmark },
  { id: 'risco',          label: 'Risco',           icon: ShieldAlert },
  { id: 'diversificacao', label: 'Diversificação',  icon: PieChart },
  { id: 'carteira',       label: 'Carteira',         icon: Table2   },
];

export default function Sidebar({ active, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
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
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>📈</div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--txt-1)', whiteSpace: 'nowrap' }}>
            Investimentos
          </span>
        )}
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

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          background: 'transparent', border: 'none',
          color: 'var(--txt-3)', cursor: 'pointer', fontSize: '0.78rem',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-2)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-3)'}
      >
        {collapsed
          ? <ChevronRight size={16} />
          : <><ChevronLeft size={16} /><span>Recolher</span></>
        }
      </button>
    </aside>
  );
}
