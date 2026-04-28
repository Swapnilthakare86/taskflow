export default function ProgBar({ val = 0, color = '#3b82f6', height = 6 }) {
  const safe = Math.max(0, Math.min(100, Number(val) || 0));
  return (
    <div style={{ height, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
      <div style={{ width: `${safe}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  );
}
