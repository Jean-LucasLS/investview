// src/utils.js — Formatters, color maps, shared constants

export const TIPO_COLOR = {
  'Ação BR':  '#39ff14',   // neon lime
  'Ação EUA': '#00d4ff',   // electric cyan
  'FII':      '#ffd60a',   // electric yellow
  'Tesouro':  '#bf5fff',   // neon violet
  'ETF EUA':  '#ff9f0a',   // neon orange
  'Fundo':    '#ff2d78',   // hot pink
};

// Versões escuras para texto legível no light mode
export const TIPO_COLOR_LIGHT = {
  'Ação BR':  '#16a34a',
  'Ação EUA': '#0369a1',
  'FII':      '#92400e',
  'Tesouro':  '#7c3aed',
  'ETF EUA':  '#c2410c',
  'Fundo':    '#be185d',
};

export const CAT_COLOR = {
  'Ações BR':   '#39ff14',
  'Exterior':   '#00d4ff',
  'FIIs':       '#ffd60a',
  'Renda Fixa': '#bf5fff',
  'Previdência': '#ff2d78',
  'Outros':     '#8892b0',
};

export const POS  = '#39ff14';   // neon lime
export const NEG  = '#ff2d78';   // hot pink
export const ACC  = '#00d4ff';   // electric cyan
export const WARN = '#ff9f0a';   // neon orange

export const CHART_COLORS = [
  '#00d4ff','#39ff14','#ffd60a','#ff2d78','#bf5fff','#ff9f0a',
  '#00ffcc','#ff3131','#7fff00','#ff006e','#0af5ff','#ff7c00',
];

export const GRID_STYLE = { stroke: 'rgba(0,212,255,0.08)', strokeDasharray: '3 3' };
export const TICK_STYLE = { fill: '#6b85b0', fontSize: 11 };

// ── Number formatters ─────────────────────────────────────────────────────
export function brl(v) {
  if (v == null || isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v/1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `R$ ${(v/1_000).toFixed(1)}k`;
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function brlFull(v) {
  if (v == null || isNaN(v)) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function pct(v, decimals = 2) {
  if (v == null || isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

export function round(v, d = 2) {
  if (v == null) return null;
  return Math.round(v * 10 ** d) / 10 ** d;
}

export function colorByValue(v) {
  if (v == null) return 'var(--txt-2)';
  return v >= 0 ? 'var(--pos)' : 'var(--neg)';
}

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
