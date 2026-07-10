import { useState, useMemo, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getPortfolio, updatePortfolioWithPrices } from './data.js';
import { brl, brlFull, pct, colorByValue, POS, NEG, ACC, WARN } from './utils.js';
import { fetchQuotes } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import KPICard from './components/KPICard.jsx';
import VisaoGeral    from './views/VisaoGeral.jsx';
import Rentabilidade from './views/Rentabilidade.jsx';
import AcoesBR       from './views/AcoesBR.jsx';
import AcoesEUA      from './views/AcoesEUA.jsx';
import FIIs          from './views/FIIs.jsx';
import RendaFixa     from './views/RendaFixa.jsx';
import Risco         from './views/Risco.jsx';
import Diversificacao from './views/Diversificacao.jsx';
import Carteira       from './views/Carteira.jsx';

const VIEW_MAP = {
  'visao-geral':    { component: VisaoGeral,    title: 'Visão Geral',   subtitle: 'Alocação, rentabilidade individual e composição completa da carteira' },
  'rentabilidade':  { component: Rentabilidade, title: 'Rentabilidade', subtitle: 'Desempenho vs benchmarks — IBOVESPA, S&P 500, CDI e IPCA' },
  'acoes-br':       { component: AcoesBR,       title: 'Ações BR',      subtitle: 'Indicadores fundamentalistas das ações brasileiras' },
  'acoes-eua':      { component: AcoesEUA,      title: 'Ações EUA',     subtitle: 'Indicadores e análise das ações e ETFs americanos' },
  'fiis':           { component: FIIs,          title: 'FIIs',          subtitle: 'Fundos de Investimento Imobiliário — DY, P/VP e segmento' },
  'renda-fixa':     { component: RendaFixa,     title: 'Renda Fixa',    subtitle: 'Tesouro Direto — Selic, IPCA+ e escada de vencimentos' },
  'risco':          { component: Risco,         title: 'Risco',         subtitle: 'Volatilidade, correlação, beta e métricas de risco da carteira' },
  'diversificacao': { component: Diversificacao, title: 'Diversificação', subtitle: 'Treemap, exposição geográfica/cambial e índice HHI' },
  'carteira':        { component: Carteira,       title: 'Carteira',       subtitle: 'Todos os ativos com filtros, ordenação e indicadores visuais' },
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
const DATE_STR = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const TIME_STR = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// ── Portfolio live update helper ──────────────────────────────────────────
const staticDf = getPortfolio();
const allTickers = [...new Set(staticDf.filter(r => r.tickerYF).map(r => r.tickerYF))];

export default function App() {
  const [activeView, setActiveView] = useState('visao-geral');
  const [portfolio, setPortfolio]   = useState(staticDf);
  const [quoteStatus, setQuoteStatus] = useState('loading');
  const [usdBrl, setUsdBrl]           = useState(null);

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
      icon: '💰', label: 'Total Investido', value: brl(totalInv), rawValue: totalInv,
      gradient: 'linear-gradient(90deg,#00d4ff,#0055ff)',
    },
    {
      icon: '📊', label: 'Patrimônio Atual', value: brl(totalAtu), rawValue: totalAtu,
      gradient: 'linear-gradient(90deg,#39ff14,#00c400)',
    },
    {
      icon: totalGain >= 0 ? '📈' : '📉', label: 'Ganho / Perda', value: brl(totalGain), rawValue: totalGain,
      delta: pct(totalPct), deltaColor: totalGain >= 0 ? 'pos' : 'neg',
      gradient: totalGain >= 0 ? 'linear-gradient(90deg,#ffd60a,#ff9f0a)' : 'linear-gradient(90deg,#ff3a1a,#aa0000)',
    },
    {
      icon: '🏆', label: 'Melhor Ativo', value: best?.ativo ?? '—',
      delta: pct(best?.pctGanho ?? 0), deltaColor: 'pos',
      gradient: 'linear-gradient(90deg,#ff2d78,#bf00ff)',
    },
    {
      icon: '📉', label: 'Pior Ativo', value: worst?.ativo ?? '—',
      delta: pct(worst?.pctGanho ?? 0), deltaColor: 'neg',
      gradient: 'linear-gradient(90deg,#ff3a1a,#cc1100)',
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar active={activeView} onNavigate={setActiveView} />

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
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 3 }}>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
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
              {quoteStatus === 'loading' && (
                <span style={{ fontSize: '0.72rem', color: '#ffa726', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffa726', animation: 'pulse 1s ease-in-out infinite' }} />
                  Atualizando preços…
                </span>
              )}
              {quoteStatus === 'live' && (
                <span style={{ fontSize: '0.72rem', color: '#00d4aa', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa' }} />
                  Dados ao vivo · USD/BRL {usdBrl?.toFixed(2)}
                </span>
              )}
              {quoteStatus === 'yahoo-offline' && (
                <span style={{ fontSize: '0.72rem', color: '#ffa726', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffa726' }} />
                  Yahoo Finance indisponível — dados estáticos
                </span>
              )}
              {quoteStatus === 'static' && (
                <span style={{ fontSize: '0.72rem', color: '#ff4b4b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4b4b' }} />
                  Servidor offline — dados estáticos
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--txt-3)' }}>{DATE_STR} · {TIME_STR}</p>
          </div>
        </header>

        {/* ── KPI Cards ── */}
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
          <ViewComponent df={df} />

          {/* Footer */}
          <footer style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--txt-3)' }}>
              Dashboard de Investimentos · Dados estáticos · {DATE_STR}
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
