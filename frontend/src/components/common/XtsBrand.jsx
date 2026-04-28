import xtsLogo from '../../assets/xts_final_logo_white.png';

export default function XtsBrand({ compact = false, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={xtsLogo} alt="XTS" style={{ width: compact ? 70 : 100, height: compact ? 70 : 100, objectFit: 'contain' }} />
      {!compact && <span style={{ color: light ? '#fff' : '#0f172a', fontWeight: 800, letterSpacing: 0.4 }}>XTS WORKSPACE</span>}
    </div>
  );
}
