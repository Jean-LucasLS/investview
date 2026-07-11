// src/data.js — Portfolio data, static indicators and performance series

// ── Raw portfolio rows ────────────────────────────────────────────────────
const RAW = [
  ["Verde AM FIC FIM",     892.41, null,     18420.00, null,     23580.50,  5160.50,  28.02, "Fund",     "Multi-Strategy",    null,         "BRL"],
  ["Kapitalo Kappa FIC",  1254.80, null,     14850.00, null,     17920.30,  3070.30,  20.68, "Fund",     "Macro",             null,         "BRL"],
  ["ITSA4",                 296.00,   9.82,    2906.52,  14.09,    4170.64,  1264.12,  43.49, "BR Stock", "Financial",         "ITSA4.SA",   "BRL"],
  ["UNH",                     2.00, 1814.19,  3628.39,  2195.80,  4391.60,   763.22,  21.03, "US Stock", "Healthcare",        "UNH",        "USD"],
  ["JNJ",                     4.00, 1136.27,  4545.10,  1325.36,  5301.42,   756.32,  16.64, "US Stock", "Healthcare",        "JNJ",        "USD"],
  ["Tesouro Selic 2028",      0.50, 17925.61, 8962.81,  19376.32, 9543.09,   580.28,   6.47, "Treasury", "Fixed Income",      null,         "BRL"],
  ["Tesouro Selic 2031",      0.35, 17540.23, 6139.08,  19310.18, 6650.15,   511.07,   8.32, "Treasury", "Fixed Income",      null,         "BRL"],
  ["Tesouro IPCA+ 2029",      1.24,  3333.06, 4133.00,   3754.53, 4564.16,   431.16,  10.43, "Treasury", "Fixed Income",      null,         "BRL"],
  ["WEGE3",                  40.00,    36.75, 1469.86,     46.47, 1858.80,   388.94,  26.46, "BR Stock", "Industrial",        "WEGE3.SA",   "BRL"],
  ["VOO",                     2.00,  3327.42, 6654.84,   3582.81, 7165.62,   510.78,   7.68, "US ETF",   "Diversified",       "VOO",        "USD"],
  ["AXP",                     2.00,  1608.36, 3216.72,   1803.14, 3606.28,   389.56,  12.11, "US Stock", "Financial",         "AXP",        "USD"],
  ["SAPR4",                 210.00,     5.81, 1220.67,      7.28, 1528.80,   308.13,  25.24, "BR Stock", "Sanitation",        "SAPR4.SA",   "BRL"],
  ["JPM",                     2.00,  1606.25, 3212.50,   1740.79, 3481.58,   269.08,   8.38, "US Stock", "Financial",         "JPM",        "USD"],
  ["Tesouro IPCA+ 2045",      5.00,  1171.14, 5855.71,   1236.33, 6124.61,   268.90,   4.59, "Treasury", "Fixed Income",      null,         "BRL"],
  ["BBSE3",                  40.00,    33.23, 1329.21,     39.98, 1599.20,   269.99,  20.31, "BR Stock", "Financial",         "BBSE3.SA",   "BRL"],
  ["AURE3",                  75.00,     8.64,  647.93,     12.70,  952.50,   304.57,  47.01, "BR Stock", "Energy",            "AURE3.SA",   "BRL"],
  ["Tesouro IPCA+ 2035",      1.50,  2200.01, 3300.01,   2381.83, 3525.02,   225.01,   6.82, "Treasury", "Fixed Income",      null,         "BRL"],
  ["BTLG11",                 60.00,    99.16, 5949.75,    102.54, 6152.40,   202.65,   3.41, "BR REIT",  "Logistics REIT",    "BTLG11.SA",  "BRL"],
  ["V",                       2.00,  1673.70, 3347.41,   1789.60, 3579.19,   231.78,   6.92, "US Stock", "Financial",         "V",          "USD"],
  ["CMIG4",                 225.00,    10.50, 2361.46,     11.34, 2551.50,   190.04,   8.05, "BR Stock", "Energy",            "CMIG4.SA",   "BRL"],
  ["PETR4",                200.00,    38.20, 7640.00,    42.15,  8430.00,   790.00,  10.34, "BR Stock", "Energy",            "PETR4.SA",   "BRL"],
  ["EGIE3",                  20.00,    31.18,  623.58,     33.44,  668.80,    45.22,   7.25, "BR Stock", "Energy",            "EGIE3.SA",   "BRL"],
  ["LVBI11",                 20.00,   100.97, 2019.46,    103.21, 2064.20,    44.74,   2.22, "BR REIT",  "Logistics REIT",    "LVBI11.SA",  "BRL"],
  ["Tesouro IPCA+ 2050",      0.25,   732.87,  183.22,    865.47,  210.57,    27.35,  14.93, "Treasury", "Fixed Income",      null,         "BRL"],
  ["AAPL",                    1.00,  1367.81, 1367.81,   1373.26, 1373.26,     5.45,   0.40, "US Stock", "Technology",        "AAPL",       "USD"],
  ["NVDA",                   1.00, 2850.00,  2850.00,  4210.30,  4210.30,  1360.30,  47.73, "US Stock", "Technology",        "NVDA",       "USD"],
  ["Tesouro IPCA+ 2032",      0.90,  2912.64, 2621.38,   2907.03, 2616.33,    -5.05,  -0.19, "Treasury", "Fixed Income",      null,         "BRL"],
  ["SHV",                     1.90,   581.96, 1105.73,    569.55, 1082.15,   -23.58,  -2.13, "US ETF",   "Fixed Income",      "SHV",        "USD"],
  ["KLBN4",                 181.00,     3.76,  680.93,      3.51,  635.31,   -45.62,  -6.70, "BR Stock", "Paper/Pulp",        "KLBN4.SA",   "BRL"],
  ["GGRC11",                400.00,     9.95, 3981.89,      9.70, 3880.00,  -101.89,  -2.56, "BR REIT",  "Urban Income REIT", "GGRC11.SA",  "BRL"],
  ["Tesouro IPCA+ 2040",      4.30,  1697.11, 7297.59,   1669.23, 7177.69,  -119.90,  -1.64, "Treasury", "Fixed Income",      null,         "BRL"],
  ["KISU11",                400.00,     6.80, 2718.90,      6.46, 2584.00,  -134.90,  -4.96, "BR REIT",  "CRI REIT",          "KISU11.SA",  "BRL"],
  ["HGLG11",                 55.00,   165.20, 9086.00,    178.50, 9817.50,   731.50,   8.05, "BR REIT",  "Logistics REIT",    "HGLG11.SA",  "BRL"],
  ["XPLG11",                 80.00,    95.40, 7632.00,    103.20, 8256.00,   624.00,   8.18, "BR REIT",  "Logistics REIT",    "XPLG11.SA",  "BRL"],
  ["KNRI11",                 40.00,   145.80, 5832.00,    158.40, 6336.00,   504.00,   8.64, "BR REIT",  "Hybrid REIT",       "KNRI11.SA",  "BRL"],
  ["VISC11",                 70.00,   108.20, 7574.00,    116.80, 8176.00,   602.00,   7.95, "BR REIT",  "Retail REIT",       "VISC11.SA",  "BRL"],
  ["META",                    1.00,  3114.51, 3114.51,   3435.31, 3435.31,   320.80,  10.30, "US Stock", "Technology",        "META",       "USD"],
  ["BBAS3",                 165.00,    23.53, 3882.46,     20.57, 3394.05,  -488.41, -12.58, "BR Stock", "Financial",         "BBAS3.SA",   "BRL"],
  ["MSFT",                    3.00,  2051.22, 6153.67,   1991.95, 5975.85,  -177.82,  -2.89, "US Stock", "Technology",        "MSFT",       "USD"],
];

const COLS = ['ativo','qtd','precoMedio','totalInvestido','precoAtual','totalAtual','ganho','pctGanho','tipo','setor','tickerYF','moeda'];

export function getPortfolio() {
  const rows = RAW.map(r => Object.fromEntries(COLS.map((c, i) => [c, r[i]])));
  const total = rows.reduce((s, r) => s + r.totalAtual, 0);
  return rows.map(r => ({ ...r, peso: parseFloat((r.totalAtual / total * 100).toFixed(2)) }));
}

// ── Static fundamental indicators ────────────────────────────────────────
export const INDICATORS = {
  // ── Ações BR
  "ITSA4.SA": { PL: 9.5,  PVP: 1.8,  DY: 4.2, ROE: 18.5, ROA: 2.1, Beta: 0.85, EVEBITDA: 8.2,  MargemLiq: 22.1, MargemOp: 28.5, DivPL: 0.65, LiqCorr: 1.8 },
  "WEGE3.SA": { PL: 28.0, PVP: 10.5, DY: 1.2, ROE: 38.0, ROA: 15.2,Beta: 0.75, EVEBITDA: 22.1, MargemLiq: 14.8, MargemOp: 20.1, DivPL: 0.20, LiqCorr: 2.5 },
  "SAPR4.SA": { PL: 11.0, PVP: 1.9,  DY: 6.1, ROE: 17.0, ROA: 5.8, Beta: 0.55, EVEBITDA: 7.5,  MargemLiq: 18.5, MargemOp: 24.2, DivPL: 1.20, LiqCorr: 1.2 },
  "BBSE3.SA": { PL: 10.0, PVP: 3.2,  DY: 8.5, ROE: 32.0, ROA: 8.5, Beta: 0.65, EVEBITDA: 9.8,  MargemLiq: 25.2, MargemOp: 32.1, DivPL: 0.40, LiqCorr: 2.1 },
  "AURE3.SA": { PL: 18.0, PVP: 1.5,  DY: 3.8, ROE: 8.5,  ROA: 4.2, Beta: 0.72, EVEBITDA: 12.3, MargemLiq: 12.1, MargemOp: 18.5, DivPL: 1.80, LiqCorr: 1.0 },
  "CMIG4.SA": { PL: 7.0,  PVP: 1.2,  DY: 8.9, ROE: 18.0, ROA: 7.2, Beta: 0.68, EVEBITDA: 6.8,  MargemLiq: 15.5, MargemOp: 22.8, DivPL: 1.50, LiqCorr: 1.3 },
  "PETR4.SA": { PL: 5.2,  PVP: 1.4,  DY: 12.5,ROE: 27.0, ROA: 8.5, Beta: 1.05, EVEBITDA: 4.8,  MargemLiq: 22.0, MargemOp: 30.5, DivPL: 0.75, LiqCorr: 1.3 },
  "EGIE3.SA": { PL: 15.0, PVP: 2.1,  DY: 6.2, ROE: 14.0, ROA: 5.5, Beta: 0.52, EVEBITDA: 9.5,  MargemLiq: 22.8, MargemOp: 30.1, DivPL: 2.10, LiqCorr: 1.1 },
  "KLBN4.SA": { PL: 35.0, PVP: 2.0,  DY: 2.8, ROE: 5.8,  ROA: 2.8, Beta: 0.88, EVEBITDA: 8.1,  MargemLiq: 4.2,  MargemOp: 9.8,  DivPL: 2.40, LiqCorr: 1.4 },
  "BBAS3.SA": { PL: 4.2,  PVP: 0.9,  DY: 9.8, ROE: 21.0, ROA: 1.8, Beta: 0.92, EVEBITDA: 5.5,  MargemLiq: 28.5, MargemOp: 38.2, DivPL: 0.92, LiqCorr: 1.6 },
  // ── Ações EUA
  "UNH":  { PL: 18.0, PVP: 4.5,  DY: 1.8, ROE: 25.0, ROA: 8.0,  Beta: 0.65, EVEBITDA: 11.2, MargemLiq: 5.8,  MargemOp: 8.5  },
  "JNJ":  { PL: 14.0, PVP: 5.2,  DY: 3.2, ROE: 37.0, ROA: 11.0, Beta: 0.55, EVEBITDA: 12.5, MargemLiq: 18.5, MargemOp: 24.2 },
  "VOO":  { PL: 22.0, PVP: null, DY: 1.3, ROE: null,  ROA: null, Beta: 1.00, EVEBITDA: null,  MargemLiq: null, MargemOp: null  },
  "AXP":  { PL: 17.0, PVP: 5.5,  DY: 1.5, ROE: 32.0, ROA: 4.0,  Beta: 1.15, EVEBITDA: 14.2, MargemLiq: 15.2, MargemOp: 21.8 },
  "JPM":  { PL: 12.0, PVP: 2.0,  DY: 2.5, ROE: 17.0, ROA: 1.5,  Beta: 1.20, EVEBITDA: 10.5, MargemLiq: 25.5, MargemOp: 35.2 },
  "V":    { PL: 26.0, PVP: 12.0, DY: 0.8, ROE: 45.0, ROA: 18.0, Beta: 0.95, EVEBITDA: 22.1, MargemLiq: 51.2, MargemOp: 64.5 },
  "AAPL": { PL: 28.0, PVP: 45.0, DY: 0.5, ROE: 175.0,ROA: 22.0, Beta: 1.25, EVEBITDA: 24.5, MargemLiq: 24.3, MargemOp: 30.1 },
  "NVDA": { PL: 42.0, PVP: 35.0, DY: 0.0, ROE: 90.0, ROA: 45.0, Beta: 1.65, EVEBITDA: 38.5, MargemLiq: 55.0, MargemOp: 62.0 },
  "META": { PL: 22.0, PVP: 7.5,  DY: 0.0, ROE: 35.0, ROA: 18.0, Beta: 1.30, EVEBITDA: 16.2, MargemLiq: 33.8, MargemOp: 41.5 },
  "MSFT": { PL: 32.0, PVP: 11.0, DY: 0.8, ROE: 40.0, ROA: 17.0, Beta: 0.90, EVEBITDA: 26.5, MargemLiq: 36.5, MargemOp: 44.2 },
  "SHV":  { PL: null, PVP: null,  DY: 5.2, ROE: null,  ROA: null, Beta: 0.02, EVEBITDA: null,  MargemLiq: null, MargemOp: null  },
  // ── BR REITs
  "BTLG11.SA": { PVP: 0.98, DY: 9.5,  LPA: 0.95, Beta: 0.35 },
  "LVBI11.SA": { PVP: 1.02, DY: 8.8,  LPA: 0.88, Beta: 0.30 },
  "GGRC11.SA": { PVP: 0.89, DY: 11.2, LPA: 1.05, Beta: 0.28 },
  "KISU11.SA": { PVP: 0.85, DY: 12.5, LPA: 0.82, Beta: 0.22 },
  "HGLG11.SA": { PVP: 1.05, DY: 9.1,  LPA: 0.91, Beta: 0.32 },
  "XPLG11.SA": { PVP: 0.96, DY: 9.8,  LPA: 0.98, Beta: 0.29 },
  "KNRI11.SA": { PVP: 0.92, DY: 8.4,  LPA: 0.84, Beta: 0.31 },
  "VISC11.SA": { PVP: 0.88, DY: 10.5, LPA: 1.02, Beta: 0.27 },
};

// ── Simulated performance series ──────────────────────────────────────────
function seededRNG(seed) {
  let s = (seed ^ 0xDEADBEEF) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}

function genSeries(n, start, end, vol, seed) {
  const rng   = seededRNG(seed);
  const drift = Math.log(end / start) / n;
  const v = [start];
  for (let i = 1; i < n; i++) v.push(v[i-1] * Math.exp(drift + (rng() - 0.5) * 2 * vol));
  return v;
}

// ── Update portfolio with live prices from Yahoo Finance ────────────────
/**
 * @param {Array}  df      - static portfolio rows
 * @param {Object} quotes  - { ticker: { price, currency } } from /api/quotes
 * @param {number} usdBrl  - current USD/BRL rate
 */
export function updatePortfolioWithPrices(df, quotes, usdBrl) {
  if (!quotes) return df;

  const updated = df.map((r) => {
    if (!r.tickerYF) return r;
    const q = quotes[r.tickerYF];
    if (!q?.price) return r;
    if (r.moeda === 'USD' && !usdBrl) return r; // skip USD stocks if no rate

    const precoAtual    = q.price;
    const brlPrice      = r.moeda === 'USD' ? precoAtual * usdBrl : precoAtual;
    const totalAtual    = r.qtd * brlPrice;
    const ganho         = totalAtual - r.totalInvestido;
    const pctGanho      = r.totalInvestido > 0 ? (ganho / r.totalInvestido) * 100 : 0;

    return { ...r, precoAtual, totalAtual, ganho, pctGanho: +pctGanho.toFixed(2) };
  });

  const total = updated.reduce((s, r) => s + r.totalAtual, 0);
  return updated.map((r) => ({ ...r, peso: +(r.totalAtual / total * 100).toFixed(2) }));
}

function tradingDates(n, endISO = '2025-07-10') {
  const dates = [], d = new Date(endISO);
  while (dates.length < n) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) dates.unshift(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  return dates;
}

const PERIODS = {
  '3 Months': { n: 63, seeds: [11, 22, 33, 44, 55] },
  '6 Months': { n: 126, seeds: [66, 77, 88, 99, 110] },
  '1 Year':   { n: 252, seeds: [111, 222, 333, 444, 555] },
  '2 Years':  { n: 504, seeds: [666, 777, 888, 999, 1110] },
};

export function getPerformanceSeries(period = '1 Year') {
  const { n, seeds } = PERIODS[period] ?? PERIODS['1 Year'];
  const dates = tradingDates(n);
  const portfolio = genSeries(n, 100, 108, 0.008, seeds[0]);
  const ibov      = genSeries(n, 100,  93, 0.014, seeds[1]);
  const sp500     = genSeries(n, 100, 118, 0.010, seeds[2]);
  const cdi       = genSeries(n, 100, 110.5, 0.0008, seeds[3]);
  const ipca      = genSeries(n, 100, 104.5, 0.0005, seeds[4]);
  return dates.map((date, i) => ({
    date,
    'My Portfolio': +portfolio[i].toFixed(2),
    'IBOVESPA':     +ibov[i].toFixed(2),
    'S&P 500':      +sp500[i].toFixed(2),
    'CDI':          +cdi[i].toFixed(2),
    'IPCA':         +ipca[i].toFixed(2),
  }));
}

// ── Simulated correlation matrix ──────────────────────────────────────────
export const CORR_TICKERS = ['ITSA4','WEGE3','SAPR4','BBSE3','BBAS3','UNH','JPM','AAPL','MSFT','VOO'];
export const CORR_MATRIX  = [
//ITSA4 WEGE3 SAPR4 BBSE3 BBAS3  UNH  JPM  AAPL  MSFT  VOO
  [1.00, 0.52, 0.38, 0.61, 0.72, 0.15, 0.22, 0.08, 0.10, 0.25],
  [0.52, 1.00, 0.28, 0.41, 0.48, 0.18, 0.15, 0.14, 0.16, 0.30],
  [0.38, 0.28, 1.00, 0.35, 0.42, 0.10, 0.12, 0.05, 0.07, 0.18],
  [0.61, 0.41, 0.35, 1.00, 0.65, 0.12, 0.20, 0.09, 0.11, 0.22],
  [0.72, 0.48, 0.42, 0.65, 1.00, 0.18, 0.30, 0.10, 0.12, 0.28],
  [0.15, 0.18, 0.10, 0.12, 0.18, 1.00, 0.45, 0.38, 0.42, 0.65],
  [0.22, 0.15, 0.12, 0.20, 0.30, 0.45, 1.00, 0.30, 0.35, 0.72],
  [0.08, 0.14, 0.05, 0.09, 0.10, 0.38, 0.30, 1.00, 0.82, 0.85],
  [0.10, 0.16, 0.07, 0.11, 0.12, 0.42, 0.35, 0.82, 1.00, 0.88],
  [0.25, 0.30, 0.18, 0.22, 0.28, 0.65, 0.72, 0.85, 0.88, 1.00],
];

// ── Simulated volatility & beta ───────────────────────────────────────────
export function getRiskMetrics(df) {
  return df
    .filter(r => r.tickerYF)
    .map(r => {
      const ind = INDICATORS[r.tickerYF] ?? {};
      // Approximate annualised vol by asset type
      const baseVol = { 'BR Stock': 28, 'US Stock': 22, 'US ETF': 14, 'BR REIT': 12, 'Treasury': 3, 'Fund': 4 };
      const volNoise = ((r.ativo.charCodeAt(0) * 17 + (r.ativo.charCodeAt(1) || 0)) % 100) / 100;
      const vol = (baseVol[r.tipo] ?? 20) + volNoise * 8 - 4;
      const ret = r.pctGanho;  // use actual % gain as annualised return proxy
      return {
        ativo:  r.ativo,
        ticker: r.tickerYF,
        tipo:   r.tipo,
        vol:    +vol.toFixed(1),
        ret:    +ret.toFixed(2),
        beta:   ind.Beta ?? null,
        totalAtual: r.totalAtual,
      };
    });
}
