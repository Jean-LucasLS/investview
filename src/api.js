// src/api.js — Frontend HTTP client (calls through Vite proxy → localhost:3001)

const BASE = '/api';

async function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();
  const r = await fetch(`${BASE}${path}${qs ? '?' + qs : ''}`);
  if (!r.ok) throw new Error(`API error ${r.status}`);
  return r.json();
}

/** Current price/change for a list of YF tickers (e.g. ['ITSA4.SA','UNH','USDBRL=X']) */
export const fetchQuotes = (tickers) =>
  get('/quotes', { tickers: tickers.join(',') });

/** Daily close history. period = '3mo'|'6mo'|'1y'|'2y' */
export const fetchHistory = (tickers, period = '1y') =>
  get('/history', { tickers: tickers.join(','), period });

/** Fundamental indicators via quoteSummary */
export const fetchIndicators = (tickers) =>
  get('/indicators', { tickers: tickers.join(',') });

/**
 * BCB time-series proxy.
 * series: 12 = CDI daily, 433 = IPCA monthly, 11 = SELIC daily
 * n: number of data points to fetch
 */
export const fetchBCB = (series, n = 300) =>
  get('/bcb', { series, n });
