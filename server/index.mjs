/**
 * server/index.mjs — Yahoo Finance + BCB proxy API
 *
 * Endpoints:
 *   GET /api/quotes?tickers=ITSA4.SA,UNH,USDBRL%3DX
 *   GET /api/history?tickers=...&period=1y   (1d interval)
 *   GET /api/indicators?tickers=...
 *   GET /api/bcb?series=12&n=252
 */

import express from 'express';
import cors    from 'cors';
import yahooFinance from 'yahoo-finance2';

// ── Prevent ECONNREFUSED / network errors from crashing the process ───────
process.on('unhandledRejection', (reason) => {
  const msg = reason?.message ?? String(reason);
  if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT')) {
    console.warn('[API] Yahoo Finance unreachable:', msg.split('\n')[0]);
  } else {
    console.error('[API] Unhandled rejection:', msg);
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Configure yahoo-finance2
yahooFinance.setGlobalConfig({
  queue: { concurrency: 4, timeout: 30_000 },
  validation: { logErrors: false },
});

// Suppress noisy console notices from yahoo-finance2
try { yahooFinance.suppressNotices?.(['yahooSurvey', 'ripHistoricalDividends']); } catch {}

// ── In-memory cache (3 min TTL) ─────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 3 * 60 * 1000;

function getCached(key) {
  const e = _cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(key); return undefined; }
  return e.data;
}
function setCached(key, data) { _cache.set(key, { data, ts: Date.now() }); }

// ── Helpers ───────────────────────────────────────────────────────────────
function withTimeout(promise, ms = 60_000) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms)),
  ]);
}

function periodStart(period) {
  const d = new Date();
  const months = { '3mo': 3, '6mo': 6, '1y': 12, '2y': 24 };
  d.setMonth(d.getMonth() - (months[period] ?? 12));
  return d;
}

async function safeQuote(ticker) {
  const hit = getCached(`q:${ticker}`);
  if (hit !== undefined) return hit;
  try {
    const q = await withTimeout(yahooFinance.quote(ticker));
    const result = {
      price:     q.regularMarketPrice ?? null,
      prevClose: q.regularMarketPreviousClose ?? null,
      changePct: q.regularMarketChangePercent ?? null,
      name:      q.longName ?? q.shortName ?? ticker,
      currency:  q.currency,
    };
    if (result.price) setCached(`q:${ticker}`, result);
    return result;
  } catch {
    return getCached(`q:${ticker}`) ?? null; // serve stale if available
  }
}

async function safeHistory(ticker, period1, interval = '1d') {
  try {
    const data = await withTimeout(yahooFinance.chart(ticker, { period1, interval }));
    return (data.quotes ?? [])
      .filter((q) => q.close != null)
      .map((q) => ({ date: new Date(q.date).toISOString().slice(0, 10), close: q.close }));
  } catch {
    return [];
  }
}

// ── GET /api/quotes ───────────────────────────────────────────────────────
app.get('/api/quotes', async (req, res) => {
  const tickers = (req.query.tickers ?? '').split(',').filter(Boolean);
  if (!tickers.length) return res.json({});

  const results = {};
  await Promise.allSettled(
    tickers.map(async (t) => {
      results[t] = await safeQuote(t).catch(() => null);
    }),
  );
  res.json(results);
});

// ── GET /api/history ──────────────────────────────────────────────────────
app.get('/api/history', async (req, res) => {
  const tickers = (req.query.tickers ?? '').split(',').filter(Boolean);
  const period  = req.query.period ?? '1y';
  if (!tickers.length) return res.json({});

  const period1 = periodStart(period);
  const results = {};

  await Promise.allSettled(
    tickers.map(async (t) => {
      results[t] = await safeHistory(t, period1).catch(() => []);
    }),
  );
  res.json(results);
});

// ── GET /api/indicators ───────────────────────────────────────────────────
app.get('/api/indicators', async (req, res) => {
  const tickers = (req.query.tickers ?? '').split(',').filter(Boolean);
  if (!tickers.length) return res.json({});

  const results = {};
  await Promise.allSettled(
    tickers.map(async (t) => {
      try {
        const data = await withTimeout(
          yahooFinance.quoteSummary(t, {
            modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
          }),
        );
        const sd = data.summaryDetail        ?? {};
        const ks = data.defaultKeyStatistics ?? {};
        const fd = data.financialData        ?? {};

        const num = (v, scale = 1) =>
          v != null && isFinite(v) ? +((v * scale).toFixed(2)) : null;

        results[t] = {
          PL:        num(sd.trailingPE ?? ks.forwardPE),
          PVP:       num(ks.priceToBook),
          DY:        num(sd.dividendYield, 100),
          ROE:       num(fd.returnOnEquity, 100),
          ROA:       num(fd.returnOnAssets, 100),
          Beta:      num(sd.beta),
          EVEBITDA:  num(ks.enterpriseToEbitda),
          MargemLiq: num(fd.profitMargins, 100),
          MargemOp:  num(fd.operatingMargins, 100),
          DivPL:     num(fd.debtToEquity != null ? fd.debtToEquity / 100 : null),
          LiqCorr:   num(fd.currentRatio),
        };
      } catch {
        results[t] = {};
      }
    }),
  );
  res.json(results);
});

// ── GET /api/bcb?series=12&n=252 ──────────────────────────────────────────
app.get('/api/bcb', async (req, res) => {
  const { series, n = 300 } = req.query;
  if (!series) return res.status(400).json({ error: 'Missing series param' });

  try {
    const url  = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados/ultimos/${n}?formato=json`;
    const resp = await withTimeout(fetch(url), 10_000);
    if (!resp.ok) throw new Error(`BCB ${resp.status}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`[API] Running on http://localhost:${PORT}`);
  console.log('      /api/quotes      — cotações em tempo real');
  console.log('      /api/history     — histórico de preços (yahoo finance)');
  console.log('      /api/indicators  — indicadores fundamentalistas');
  console.log('      /api/bcb         — taxas BCB (CDI, IPCA, SELIC)');
});
