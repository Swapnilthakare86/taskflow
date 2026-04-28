export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="tf-card" style={{ padding: 24, textAlign: 'center' }}>
      {Icon ? <Icon size={26} color="#94a3b8" /> : null}
      <h3 style={{ margin: '10px 0 4px', fontSize: 18 }}>{title}</h3>
      <p className="tf-subtext" style={{ margin: 0 }}>{subtitle}</p>
    </div>
  );
}
