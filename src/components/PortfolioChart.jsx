// PortfolioChart.jsx — TradingView Lightweight Charts area chart
import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import { getPerformanceSeries } from '../data.js';
import { brl } from '../utils.js';

const PERIODS = ['3 Months', '6 Months', '1 Year', '2 Years'];

function getThemeColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    bg:        isLight ? '#ffffff'       : '#07091a',
    text:      isLight ? '#4a5568'       : '#6b85b0',
    grid:      isLight ? 'rgba(0,0,0,0.06)'  : 'rgba(0,220,255,0.06)',
    border:    isLight ? 'rgba(0,0,0,0.08)'  : 'rgba(0,220,255,0.1)',
    line:      isLight ? '#0369a1'       : '#00d4ff',
    topFill:   isLight ? 'rgba(3,105,161,0.18)' : 'rgba(0,212,255,0.18)',
    botFill:   isLight ? 'rgba(3,105,161,0.01)' : 'rgba(0,212,255,0.01)',
    crosshair: isLight ? 'rgba(0,0,0,0.3)'   : 'rgba(0,212,255,0.5)',
  };
}

export default function PortfolioChart() {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const [period, setPeriod] = useState('1 Year');
  const [tooltip, setTooltip] = useState(null);

  // Build / update chart
  useEffect(() => {
    if (!containerRef.current) return;
    const c = getThemeColors();

    if (!chartRef.current) {
      // Create chart once
      chartRef.current = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: c.bg },
          textColor: c.text,
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        grid: {
          vertLines: { color: c.grid },
          horzLines: { color: c.grid },
        },
        crosshair: {
          vertLine: { color: c.crosshair, width: 1, style: 0 },
          horzLine: { color: c.crosshair, width: 1, style: 0 },
        },
        rightPriceScale: {
          borderColor: c.border,
          scaleMargins: { top: 0.08, bottom: 0.08 },
        },
        timeScale: {
          borderColor: c.border,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        handleScroll: false,
        handleScale: false,
        width:  containerRef.current.clientWidth,
        height: 260,
      });

      seriesRef.current = chartRef.current.addSeries(AreaSeries, {
        lineColor:  c.line,
        topColor:   c.topFill,
        bottomColor: c.botFill,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBackgroundColor: c.line,
        priceFormat: { type: 'custom', formatter: v => `${v.toFixed(1)}` },
      });

      // Tooltip on crosshair
      chartRef.current.subscribeCrosshairMove(param => {
        if (!param.time || !param.seriesData.size) {
          setTooltip(null);
          return;
        }
        const val = param.seriesData.get(seriesRef.current)?.value;
        setTooltip({ time: param.time, value: val });
      });

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current)
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      });
      ro.observe(containerRef.current);
    }

    // Apply theme (in case of toggle)
    chartRef.current.applyOptions({
      layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      rightPriceScale: { borderColor: c.border },
      timeScale: { borderColor: c.border },
    });
    seriesRef.current.applyOptions({
      lineColor: c.line, topColor: c.topFill, bottomColor: c.botFill,
      crosshairMarkerBackgroundColor: c.line,
    });

    // Load data
    const raw = getPerformanceSeries(period);
    const data = raw.map(d => ({ time: d.date, value: d['My Portfolio'] }));
    seriesRef.current.setData(data);
    chartRef.current.timeScale().fitContent();

    return () => {};
  }, [period]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { chartRef.current?.remove(); chartRef.current = null; };
  }, []);

  const data = getPerformanceSeries(period);
  const first = data[0]?.['My Portfolio'] ?? 100;
  const last  = data[data.length - 1]?.['My Portfolio'] ?? 100;
  const delta = last - first;
  const isUp  = delta >= 0;

  return (
    <div className="glass" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt-1)' }}>
            Portfolio Evolution
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--txt-3)', marginTop: 2 }}>
            Base 100 · simulated data
          </p>
        </div>

        {/* Live tooltip value */}
        {tooltip ? (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--acc)', fontVariantNumeric: 'tabular-nums' }}>
              {tooltip.value?.toFixed(2)}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>{tooltip.time}</p>
          </div>
        ) : (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: isUp ? 'var(--pos)' : 'var(--neg)', fontVariantNumeric: 'tabular-nums' }}>
              {isUp ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}%
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>return in period</p>
          </div>
        )}
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ width: '100%' }} />

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            fontSize: '0.72rem', fontWeight: 600,
            background: period === p ? 'rgba(0,212,255,0.15)' : 'transparent',
            border: `1px solid ${period === p ? 'var(--acc)' : 'var(--border)'}`,
            color: period === p ? 'var(--acc)' : 'var(--txt-3)',
            transition: 'all 0.15s',
          }}>{p}</button>
        ))}
      </div>
    </div>
  );
}
