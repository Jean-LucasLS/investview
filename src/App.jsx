import { useState, useMemo, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getPortfolio, updatePortfolioWithPrices } from './data.js';
import { brl, brlFull, pct, colorByValue, POS, NEG, ACC, WARN } from './utils.js';
import { fetchQuotes } from './api.js';
import { LiveBadge } from './hooks.jsx';
import Sidebar from './components/Sidebar.jsx';
import KPICard from './components/KPICard.jsx';
import Overview        from './views/Overview.jsx';
import Performance     from './views/Performance.jsx';
import BRStocks        from './views/BRStocks.jsx';
import USStocks        from './views/USStocks.jsx';
import REITs           from './views/REITs.jsx';
import FixedIncome     from './views/FixedIncome.jsx';
import Risk            from './views/Risk.jsx';
import Diversification from './views/Diversification.jsx';
import Portfolio       from './views/Portfolio.jsx';

const VIEW_MAP = {
  'overview':       { component: Overview,       title: 'Overview',       subtitle: 'Allocation, individual performance and full portfolio composition' },
  'performance':    { component: Performance,    title: 'Performance',    subtitle: 'Returns vs benchmarks — IBOVESPA, S&P 500, CDI and IPCA' },
  'br-stocks':      { component: BRStocks,       title: 'BR Stocks',      subtitle: 'Fundamental indicators for Brazilian equities' },
  'us-stocks':      { component: USStocks,       title: 'US Stocks',      subtitle: 'Indicators and analysis for US stocks and ETFs' },
  'reits':          { component: REITs,          title: 'BR REITs',       subtitle: 'BR Real Estate Investment Trusts (FIIs) — DY, P/VP and segment' },
  'fixed-income':   { component: FixedIncome,    title: 'Fixed Income',   subtitle: 'Tesouro Direto — Selic, IPCA+ and maturity ladder' },
  'risk':           { component: Risk,           title: 'Risk',           subtitle: 'Volatility, correlation, beta and portfolio risk metrics' },
  'diversification':{ component: Diversification, title: 'Diversification', subtitle: 'Treemap, geographic/currency exposure and HHI index' },
  'portfolio':      { component: Portfolio,      title: 'Portfolio',      subtitle: 'All assets with filters, sorting and visual indicators' },
};

function usePortfolio() {
  return useMemo(() => getPortfolio(), []);
}

function useMetrics(df) {
  return useMemo(() => {
    const totalInv  = df.reduce((s,r) => s + r.totalInvestido, 0);
    const totalAtu  = df.reduce((s,r) => s + r.totalAtual, 0);
    const totalGain = totalAtu - totalInv;
    const totalPct  = totalGain / totalInv * 100;
    const best  = df.reduce((b,r) => r.pctGanho > b.pctGanho ? r : b, df[0]);
    const worst = df.reduce((w,r) => r.pctGanho < w.pctGanho ? r : w, df[0]);
    return { totalInv, totalAtu, totalGain, totalPct, best, worst };
  }, [df]);
}

const now = new Date();
const DATE_STR = now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
const TIME_STR = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// ── Portfolio live update helper ──────────────────────────────────────────
const staticDf = getPortfolio();
const allTickers = [...new Set(staticDf.filter(r => r.tickerYF).map(r => r.tickerYF))];

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [portfolio, setPortfolio]   = useState(staticDf);
  const [quoteStatus, setQuoteStatus] = useState('loading');
  const [usdBrl, setUsdBrl]           = useState(null);
  const [viewStatus, setViewStatus]   = useState(null);

  // Reset view status on navigation
  useEffect(() => { setViewStatus(null); }, [activeView]);

  // ── Theme ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Fetch live quotes on mount
  useEffect(() => {
    fetchQuotes([...allTickers, 'USDBRL=X'])
      .then((quotes) => {
        const rate = quotes['USDBRL=X']?.price ?? null;
        const hasAnyLive = Object.values(quotes).some(q => q?.price != null);
        setUsdBrl(rate);
        setPortfolio(updatePortfolioWithPrices(staticDf, quotes, rate));
        setQuoteStatus(hasAnyLive ? 'live' : 'yahoo-offline');
      })
      .catch(() => setQuoteStatus('static'));
  }, []);

  const df = portfolio;
  const { totalInv, totalAtu, totalGain, totalPct, best, worst } = useMetrics(df);
  const { component: ViewComponent, title, subtitle } = VIEW_MAP[activeView];

  const kpis = [
    {
      icon: '💰', label: 'Total Invested', value: brl(totalInv), rawValue: totalInv,
      gradient: 'linear-gradient(90deg,#00d4ff,#0055ff)',
    },
    {
      icon: '📊', label: 'Current Balance', value: brl(totalAtu), rawValue: totalAtu,
      gradient: 'linear-gradient(90deg,#39ff14,#00c400)',
    },
    {
      icon: totalGain >= 0 ? '📈' : '📉', label: 'Gain / Loss', value: brl(totalGain), rawValue: totalGain,
      delta: pct(totalPct), deltaColor: totalGain >= 0 ? 'pos' : 'neg',
      gradient: totalGain >= 0 ? 'linear-gradient(90deg,#ffd60a,#ff9f0a)' : 'linear-gradient(90deg,#ff3a1a,#aa0000)',
    },
    {
      icon: '🏆', label: 'Best Asset', value: best?.ativo ?? '—',
      delta: pct(best?.pctGanho ?? 0), deltaColor: 'pos',
      gradient: 'linear-gradient(90deg,#ff2d78,#bf00ff)',
    },
    {
      icon: '📉', label: 'Worst Asset', value: worst?.ativo ?? '—',
      delta: pct(worst?.pctGanho ?? 0), deltaColor: 'neg',
      gradient: 'linear-gradient(90deg,#ff3a1a,#cc1100)',
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar active={activeView} onNavigate={setActiveView} quoteStatus={quoteStatus} usdBrl={usdBrl} dateStr={DATE_STR} timeStr={TIME_STR} />

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ── Header ── */}
        <header style={{
          padding: '16px 28px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-header)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--txt-1)' }}>{title}</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--txt-2)', marginTop: 2 }}>{subtitle}</p>
            {viewStatus && (
              <div style={{ marginTop: 5 }}>
                <LiveBadge status={viewStatus} />
              </div>
            )}
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-lit)',
              background: 'var(--bg-hover)', cursor: 'pointer', color: 'var(--txt-2)',
              flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-2)'}
          >
            {theme === 'dark'
              ? <Sun  size={14} />
              : <Moon size={14} />}
          </button>
        </header>

        {/* ── KPI Cards — Overview only ── */}
        {activeView === 'overview' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 16,
            padding: '16px 28px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            background: 'var(--bg-kpi-strip)',
          }}>
            {kpis.map((kpi, i) => (
              <KPICard key={i} {...kpi} />
            ))}
          </div>
        )}

        {/* ── View content ── */}
        <main
          key={activeView}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            background: 'var(--bg-base)',
          }}
          className="view-enter"
        >
          <ViewComponent df={df} onStatusChange={setViewStatus} />

          {/* Footer */}
          <footer style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--txt-3)' }}>
              Dashboard · Static data · {DATE_STR}
            </p>
          </footer>
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
