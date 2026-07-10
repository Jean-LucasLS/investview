// src/hooks.js — Shared React hooks for live data fetching
import { useState, useEffect, useRef } from 'react';
import { fetchQuotes, fetchHistory, fetchIndicators, fetchBCB } from './api.js';
import { INDICATORS } from './data.js';

// ── Status badge helper ────────────────────────────────────────────────────
export function LiveBadge({ status }) {
  if (status === 'loading') return (
    <span style={{ fontSize: '0.68rem', color: '#ffa726', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffa726', animation: 'pulse 1s infinite' }} />
      Carregando dados ao vivo…
    </span>
  );
  if (status === 'live') return (
    <span style={{ fontSize: '0.68rem', color: '#00d4aa', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa' }} />
      Dados ao vivo (Yahoo Finance)
    </span>
  );
  if (status === 'error') return (
    <span style={{ fontSize: '0.68rem', color: '#ff4b4b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4b4b' }} />
      API indisponível — dados estáticos
    </span>
  );
  return null;
}

// ── useIndicators ─────────────────────────────────────────────────────────
/**
 * Fetches live fundamental indicators and merges them over the static fallback.
 * Returns { indicators, status }
 */
export function useIndicators(tickers) {
  const [indicators, setIndicators] = useState(INDICATORS);
  const [status, setStatus]         = useState('loading');
  const key = tickers?.join(',') ?? '';

  useEffect(() => {
    if (!tickers?.length) { setStatus('error'); return; }
    setStatus('loading');
    fetchIndicators(tickers)
      .then((live) => {
        // Ignore empty responses — they'd overwrite the static fallback with {}
        const withData = Object.fromEntries(
          Object.entries(live).filter(([, v]) => v && Object.keys(v).length > 0)
        );
        if (Object.keys(withData).length > 0) {
          setIndicators((prev) => ({ ...prev, ...withData }));
          setStatus('live');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [key]);

  return { indicators, status };
}

// ── useHistory ────────────────────────────────────────────────────────────
/**
 * Fetches daily close history for the given tickers.
 * Returns { history, status }   history = { ticker: [{date,close},...] }
 */
export function useHistory(tickers, period = '1y') {
  const [history, setHistory] = useState(null);
  const [status, setStatus]   = useState('loading');
  const key = (tickers?.join(',') ?? '') + period;

  useEffect(() => {
    if (!tickers?.length) { setStatus('error'); return; }
    setStatus('loading');
    fetchHistory(tickers, period)
      .then((data) => { setHistory(data); setStatus('live'); })
      .catch(() => setStatus('error'));
  }, [key]);

  return { history, status };
}

// ── useBCB ────────────────────────────────────────────────────────────────
/**
 * Fetches a BCB series. Returns { data: [{data,valor},...], status }
 */
export function useBCB(series, n = 300) {
  const [data, setData]     = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('loading');
    fetchBCB(series, n)
      .then((d) => { setData(d); setStatus('live'); })
      .catch(() => setStatus('error'));
  }, [series, n]);

  return { data, status };
}

// ── useQuotes ─────────────────────────────────────────────────────────────
/**
 * Fetches current quotes once on mount. Returns { quotes, usdBrl, status }
 */
export function useQuotes(tickers) {
  const [quotes, setQuotes]   = useState(null);
  const [usdBrl, setUsdBrl]   = useState(null);
  const [status, setStatus]   = useState('loading');
  const key = tickers?.join(',') ?? '';

  useEffect(() => {
    if (!tickers?.length) { setStatus('error'); return; }
    fetchQuotes([...tickers, 'USDBRL=X'])
      .then((data) => {
        setQuotes(data);
        setUsdBrl(data['USDBRL=X']?.price ?? null);
        setStatus('live');
      })
      .catch(() => setStatus('error'));
  }, [key]);

  return { quotes, usdBrl, status };
}

// ── Utility: annualised volatility from daily closes ───────────────────────
export function calcVolFromHistory(closes) {
  if (!closes || closes.length < 10) return null;
  const ret = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > 0 && closes[i-1] > 0)
      ret.push(Math.log(closes[i] / closes[i-1]));
  }
  if (ret.length < 5) return null;
  const mean = ret.reduce((s, r) => s + r, 0) / ret.length;
  const variance = ret.reduce((s, r) => s + (r - mean) ** 2, 0) / (ret.length - 1);
  return +(Math.sqrt(variance * 252) * 100).toFixed(1);
}

// ── Utility: correlation matrix from parallel return arrays ───────────────
export function calcCorrelation(ret_i, ret_j) {
  const n = Math.min(ret_i.length, ret_j.length);
  if (n < 10) return 0;
  const ri = ret_i.slice(0, n), rj = ret_j.slice(0, n);
  const mi = ri.reduce((s,v) => s + v, 0) / n;
  const mj = rj.reduce((s,v) => s + v, 0) / n;
  let cov = 0, vi = 0, vj = 0;
  for (let i = 0; i < n; i++) {
    cov += (ri[i] - mi) * (rj[i] - mj);
    vi  += (ri[i] - mi) ** 2;
    vj  += (rj[i] - mj) ** 2;
  }
  const denom = Math.sqrt(vi * vj);
  return denom < 1e-10 ? 0 : +((cov / denom).toFixed(2));
}

// ── Utility: daily log-returns from [{date,close},...] ────────────────────
export function dailyReturns(history) {
  const out = [];
  for (let i = 1; i < history.length; i++) {
    if (history[i].close > 0 && history[i-1].close > 0)
      out.push(Math.log(history[i].close / history[i-1].close));
    else
      out.push(0);
  }
  return out;
}

// ── Utility: forward-fill aligned history ─────────────────────────────────
/**
 * Given a reference date array and a per-ticker history dict,
 * returns a new dict where each ticker has a value for every reference date.
 */
export function alignToRef(refDates, histories) {
  const aligned = {};
  for (const [ticker, hist] of Object.entries(histories)) {
    if (!hist?.length) { aligned[ticker] = refDates.map(() => null); continue; }
    const lookup = {};
    hist.forEach(d => { lookup[d.date] = d.close; });
    let last = null;
    aligned[ticker] = refDates.map(date => {
      if (lookup[date] != null) last = lookup[date];
      return last;
    });
  }
  return aligned;
}

// ── Utility: portfolio performance from real history ───────────────────────
/**
 * Build a daily portfolio performance series (base 100) from real price history.
 *
 * @param {Array}  df               - portfolio rows
 * @param {Object} histories        - { ticker: [{date, close}] }
 * @param {Object} usdBrlHist       - { 'USDBRL=X': [{date, close}] }
 * @returns {Array} [{ date, value }]
 */
export function buildPortfolioPerf(df, histories, usdBrlHist) {
  // Use ^BVSP dates as reference (Brazilian trading days)
  const ref = histories['^BVSP'] ?? histories[Object.keys(histories)[0]] ?? [];
  if (!ref.length) return [];
  const refDates = ref.map(d => d.date);

  const allHist = { ...histories };
  if (usdBrlHist?.length) allHist['USDBRL=X'] = usdBrlHist;
  const aligned = alignToRef(refDates, allHist);
  
  const usdBrlAligned = aligned['USDBRL=X'];
  const defaultUsdBrl = usdBrlHist?.at(-1)?.close ?? 5.7;

  const totalInv = df.reduce((s, r) => s + r.totalInvestido, 0);
  if (!totalInv) return [];

  const equityRows = df.filter(r => r.tickerYF && aligned[r.tickerYF]?.[0] != null);
  const fixedRows  = df.filter(r => !r.tickerYF);

  const equityWeight = equityRows.reduce((s,r) => s + r.totalInvestido, 0) / totalInv;
  const fixedWeight  = fixedRows.reduce( (s,r) => s + r.totalInvestido, 0) / totalInv;

  // Average fixed return annualised
  const fixedInv  = fixedRows.reduce((s,r) => s + r.totalInvestido, 0);
  const fixedPct  = fixedInv > 0
    ? fixedRows.reduce((s,r) => s + r.pctGanho * r.totalInvestido, 0) / fixedInv / 100
    : 0;
  const n = refDates.length;

  const portSeries = refDates.map((date, i) => {
    // Equity portion: weighted sum of normalised prices
    let equitySum = 0;
    let equityCov = 0;
    equityRows.forEach(r => {
      const prices = aligned[r.tickerYF];
      if (!prices) return;
      const base  = prices[0];
      const curr  = prices[i];
      if (base == null || curr == null) return;
      let brlBase = base;
      let brlCurr = curr;
      if (r.moeda === 'USD') {
        const uBRL0 = usdBrlAligned?.[0] ?? defaultUsdBrl;
        const uBRLi = usdBrlAligned?.[i] ?? defaultUsdBrl;
        brlBase = base * uBRL0;
        brlCurr = curr * uBRLi;
      }
      if (brlBase > 0) {
        const w = r.totalInvestido / totalInv;
        equitySum += (brlCurr / brlBase) * w;
        equityCov += w;
      }
    });
    // Fill any uncovered equity weight with 1 (flat)
    if (equityCov < equityWeight) equitySum += (equityWeight - equityCov);

    // Fixed income portion: linear interpolation
    const fixedContrib = fixedWeight * (1 + fixedPct * i / Math.max(n - 1, 1));

    return equitySum + fixedContrib;
  });

  // Normalise to base 100
  const base = portSeries[0] ?? 1;
  return refDates.map((date, i) => ({
    date,
    value: +(portSeries[i] / base * 100).toFixed(2),
  }));
}
