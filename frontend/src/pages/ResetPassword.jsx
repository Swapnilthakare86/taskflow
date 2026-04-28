import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../api/services';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [params] = useSearchParams();

  function flash(text, type = 'error') {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const token = params.get('token');
    if (!token) return flash('Reset token missing from URL.');
    if (password !== confirm) return flash('Passwords do not match.');
    try {
      await authService.resetPassword({ token, password });
      flash('Password reset successful. Please sign in.', 'success');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to reset password');
    }
  }

  return (
    <div className="tf-card" style={{ padding: 26 }}>
      <h1 className="tf-heading-lg">Reset Password</h1>
      <p className="tf-subtext mt-2">Set your new password.</p>
      {msg.text && <div className="tf-card" style={{ marginTop: 12, padding: 10, borderColor: msg.type === 'success' ? '#86efac' : '#fecaca', background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2', color: msg.type === 'success' ? '#166534' : '#b91c1c' }}>{msg.text}</div>}
      <form onSubmit={onSubmit} className="mt-3">
        <label className="tf-label mb-1">NEW PASSWORD</label>
        <input className="tf-input mb-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        <label className="tf-label mb-1">CONFIRM PASSWORD</label>
        <input className="tf-input mb-3" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        <button className="tf-btn tf-btn-primary" style={{ width: '100%' }}>Reset Password</button>
      </form>
      <div className="text-center mt-3 tf-subtext"><Link to="/login" style={{ fontWeight: 700 }}>Back to login</Link></div>
    </div>
  );
}
