import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 1200) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const raf = (ts) => {
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(target * ease);
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return current;
}

export default function KPICard({ icon, label, value, rawValue, delta, deltaColor, gradient, description }) {
  const animated = useCountUp(typeof rawValue === 'number' ? rawValue : 0);

  const displayValue = typeof rawValue === 'number'
    ? value.replace(/[\d.,]+/, animated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    : value;

  return (
    <div
      className="glass"
      style={{
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,167,38,0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Gradient accent top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: gradient ?? 'linear-gradient(90deg,#667eea,#764ba2)',
        borderRadius: '14px 14px 0 0',
      }} />

      {/* Icon */}
      <div style={{
        width: 36, height: 36,
        background: gradient ? `${gradient.replace('linear-gradient(90deg,','rgba(').replace(',',',.15) linear-gradient(135deg,')}` : 'rgba(102,126,234,0.12)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, marginBottom: 10,
      }}>
        {icon}
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </p>

      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--txt-1)', lineHeight: 1.2, marginBottom: 4 }}>
        {displayValue}
      </p>

      {delta != null && (
        <span
          className={deltaColor === 'pos' ? 'tag tag-pos' : deltaColor === 'neg' ? 'tag tag-neg' : 'tag tag-neu'}
        >
          {delta}
        </span>
      )}

      {description && (
        <p style={{ fontSize: '0.72rem', color: 'var(--txt-3)', marginTop: 4 }}>{description}</p>
      )}
    </div>
  );
}
