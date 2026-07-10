// ChartCard.jsx — Glass card wrapper for charts
export default function ChartCard({ title, children, style }) {
  return (
    <div className="glass" style={{ padding: '18px 20px', ...style }}>
      {title && (
        <p style={{
          fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt-1)', marginBottom: 16,
        }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
