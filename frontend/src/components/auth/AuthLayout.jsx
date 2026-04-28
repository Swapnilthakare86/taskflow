import { Outlet } from 'react-router-dom';
import xtsLogo from '../../assets/xts_final_logo_white.png';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#eef2ff' }}>
      {/* Left Side - Branding and Visual */}
      <div style={{
        background: 'linear-gradient(180deg, #0f1e4d, #09324a)',
        color: '#fff',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Visual Board Element */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 220,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Board Header */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b6c9f2' }}>Team Board</div>
          {/* Board Rows */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 6,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: ['#60a5fa', '#34d399', '#fbbf24', '#f87171'][i - 1],
              }} />
              <div style={{ fontSize: 11, color: '#e5e7eb', flex: 1 }}>Task {i}</div>
              <div style={{
                fontSize: 9,
                background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i - 1],
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 3,
              }}>
                {['TODO', 'DONE', 'PROGRESS', 'BLOCKED'][i - 1]}
              </div>
            </div>
          ))}
        </div>

        {/* Text Content */}
        <div style={{ maxWidth: 560, position: 'relative', zIndex: 10 }}>
          {/* XTS Logo */}
          <div style={{ marginBottom: 40 }}>
            <img 
              src={xtsLogo} 
              alt="XTS Logo" 
              style={{ height: 100, objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: 54, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>Workflows that stay sharp.</h1>
          <p style={{ marginTop: 18, color: '#b6c9f2', fontSize: 20 }}>Plan, assign, and ship with one workspace.</p>
          
          {/* Team Avatars */}
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', marginRight: 8 }}>
              {['#3b82f6', '#10b981', '#f59e0b'].map((color, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: color,
                    marginLeft: idx > 0 ? -12 : 0,
                    border: '3px solid #09324a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 14, color: '#b6c9f2' }}>+3 team members</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
