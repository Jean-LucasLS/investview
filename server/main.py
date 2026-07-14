"""
server/main.py — Yahoo Finance + BCB proxy API (FastAPI)

Endpoints:
  GET /api/quotes?tickers=ITSA4.SA,UNH,USDBRL%3DX
  GET /api/history?tickers=...&period=1y   (1d interval)
  GET /api/indicators?tickers=...
  GET /api/bcb?series=12&n=252
"""

import asyncio
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import httpx
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="[API] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="InvestView API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Thread pool for yfinance (biblioteca síncrona) ────────────────────────
_executor = ThreadPoolExecutor(max_workers=8)

# ── In-memory cache (3 min TTL) ───────────────────────────────────────────
_cache: dict = {}
CACHE_TTL = 180  # segundos


def get_cached(key):
    entry = _cache.get(key)
    if not entry:
        return None
    if time.time() - entry["ts"] > CACHE_TTL:
        del _cache[key]
        return None
    return entry["data"]


def set_cached(key, data):
    _cache[key] = {"data": data, "ts": time.time()}


# ── Helpers ───────────────────────────────────────────────────────────────
def period_start(period: str) -> datetime:
    days = {"3mo": 90, "6mo": 180, "1y": 365, "2y": 730}
    return datetime.now() - timedelta(days=days.get(period, 365))


def safe_num(val, scale: float = 1.0):
    try:
        if val is None:
            return None
        return round(float(val) * scale, 2)
    except (TypeError, ValueError):
        return None


# ── Funções síncronas (rodam no thread pool) ──────────────────────────────
def _fetch_quote(ticker: str):
    cached = get_cached(f"q:{ticker}")
    if cached is not None:
        return cached
    try:
        t = yf.Ticker(ticker)
        fi = t.fast_info
        price = safe_num(fi.last_price)
        prev  = safe_num(fi.previous_close)
        change_pct = (
            round((fi.last_price - fi.previous_close) / fi.previous_close * 100, 4)
            if fi.last_price and fi.previous_close
            else None
        )
        # Tenta obter nome completo; usa ticker como fallback
        name = ticker
        try:
            info = t.info
            name = info.get("longName") or info.get("shortName") or ticker
        except Exception:
            pass

        result = {
            "price":     price,
            "prevClose": prev,
            "changePct": change_pct,
            "name":      name,
            "currency":  getattr(fi, "currency", None),
        }
        if price:
            set_cached(f"q:{ticker}", result)
        return result
    except Exception as e:
        logger.warning(f"Quote error for {ticker}: {e}")
        return get_cached(f"q:{ticker}")  # serve stale se disponível


def _fetch_history(ticker: str, period1: datetime):
    try:
        hist = yf.Ticker(ticker).history(
            start=period1.strftime("%Y-%m-%d"), interval="1d"
        )
        result = []
        for date, row in hist.iterrows():
            close = row.get("Close")
            if close is not None and close == close:  # filtra NaN
                result.append({
                    "date":  date.strftime("%Y-%m-%d"),
                    "close": round(float(close), 4),
                })
        return result
    except Exception as e:
        logger.warning(f"History error for {ticker}: {e}")
        return []


def _fetch_indicators(ticker: str):
    try:
        info = yf.Ticker(ticker).info
        de = info.get("debtToEquity")
        return {
            "PL":        safe_num(info.get("trailingPE") or info.get("forwardPE")),
            "PVP":       safe_num(info.get("priceToBook")),
            "DY":        safe_num(info.get("dividendYield"), 100),
            "ROE":       safe_num(info.get("returnOnEquity"), 100),
            "ROA":       safe_num(info.get("returnOnAssets"), 100),
            "Beta":      safe_num(info.get("beta")),
            "EVEBITDA":  safe_num(info.get("enterpriseToEbitda")),
            "MargemLiq": safe_num(info.get("profitMargins"), 100),
            "MargemOp":  safe_num(info.get("operatingMargins"), 100),
            "DivPL":     safe_num(de / 100 if de is not None else None),
            "LiqCorr":   safe_num(info.get("currentRatio")),
        }
    except Exception as e:
        logger.warning(f"Indicators error for {ticker}: {e}")
        return {}


# ── Endpoints ─────────────────────────────────────────────────────────────
@app.get("/api/quotes")
async def get_quotes(tickers: str = Query("")):
    ticker_list = [t for t in tickers.split(",") if t]
    if not ticker_list:
        return {}

    loop = asyncio.get_event_loop()
    results = await asyncio.gather(
        *[loop.run_in_executor(_executor, _fetch_quote, t) for t in ticker_list],
        return_exceptions=True,
    )
    return {
        t: (None if isinstance(r, Exception) else r)
        for t, r in zip(ticker_list, results)
    }


@app.get("/api/history")
async def get_history(tickers: str = Query(""), period: str = Query("1y")):
    ticker_list = [t for t in tickers.split(",") if t]
    if not ticker_list:
        return {}

    p1 = period_start(period)
    loop = asyncio.get_event_loop()
    results = await asyncio.gather(
        *[loop.run_in_executor(_executor, _fetch_history, t, p1) for t in ticker_list],
        return_exceptions=True,
    )
    return {
        t: ([] if isinstance(r, Exception) else r)
        for t, r in zip(ticker_list, results)
    }


@app.get("/api/indicators")
async def get_indicators(tickers: str = Query("")):
    ticker_list = [t for t in tickers.split(",") if t]
    if not ticker_list:
        return {}

    loop = asyncio.get_event_loop()
    results = await asyncio.gather(
        *[loop.run_in_executor(_executor, _fetch_indicators, t) for t in ticker_list],
        return_exceptions=True,
    )
    return {
        t: ({} if isinstance(r, Exception) else r)
        for t, r in zip(ticker_list, results)
    }


@app.get("/api/bcb")
async def get_bcb(series: str = Query(...), n: int = Query(300)):
    url = (
        f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series}"
        f"/dados/ultimos/{n}?formato=json"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=str(e))


# ── Inicialização ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = 3001
    logger.info(f"Running on http://localhost:{port}")
    logger.info("      /api/quotes      — cotações em tempo real")
    logger.info("      /api/history     — histórico de preços")
    logger.info("      /api/indicators  — indicadores fundamentalistas")
    logger.info("      /api/bcb         — taxas BCB (CDI, IPCA, SELIC)")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
