import { Outlet } from 'react-router-dom';
import xtsLogo from '../../assets/xts_final_logo_white.png';

export default function AuthLayout() {
  return (
    <div className="tf-auth-shell">
      <div className="tf-auth-brand">
        <div className="tf-auth-board">
          <div className="tf-auth-board__title">Team Board</div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="tf-auth-board__row">
              <div className="tf-auth-board__dot" style={{ background: ['#60a5fa', '#34d399', '#fbbf24', '#f87171'][i - 1] }} />
              <div className="tf-auth-board__task">Task {i}</div>
              <div className="tf-auth-board__badge" style={{ background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i - 1] }}>
                {['TODO', 'DONE', 'PROGRESS', 'BLOCKED'][i - 1]}
              </div>
            </div>
          ))}
        </div>

        <div className="tf-auth-brand__content">
          <div className="tf-auth-logo-wrap">
            <img src={xtsLogo} alt="XTS Logo" className="tf-auth-logo" />
          </div>
          <h1 className="tf-auth-brand__title">Stay on top of every project.</h1>
          <p className="tf-auth-brand__text">Plan work, follow progress, review blockers, and deliver on time with one shared workspace.</p>

          <div className="tf-auth-team">
            <div className="tf-auth-team__avatars">
              {['#3b82f6', '#10b981', '#f59e0b'].map((color, idx) => (
                <div
                  key={idx}
                  className="tf-auth-team__avatar"
                  style={{ background: color, marginLeft: idx > 0 ? -12 : 0 }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
              ))}
            </div>
            <span>+3 team members</span>
          </div>
        </div>
      </div>

      <div className="tf-auth-panel">
        <div className="tf-auth-panel__inner">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
