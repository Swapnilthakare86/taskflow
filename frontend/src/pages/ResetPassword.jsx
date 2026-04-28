import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../api/services';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [params] = useSearchParams();

  function flash(text, type = 'error') {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  }

  function setPasswordField(value) {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: '', confirm: '' }));
    setMsg({ type: '', text: '' });
  }

  function setConfirmField(value) {
    setConfirm(value);
    setFieldErrors((prev) => ({ ...prev, confirm: '' }));
    setMsg({ type: '', text: '' });
  }

  function validateForm(token) {
    const errors = {};
    if (!token) errors.form = 'Reset token missing from URL.';
    if (!password) errors.password = 'New password is required.';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (!confirm) errors.confirm = 'Confirm password is required.';
    else if (password !== confirm) errors.confirm = 'Password and confirm password do not match.';
    return errors;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setMsg({ type: '', text: '' });

    const token = params.get('token');
    const errors = validateForm(token);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      if (errors.form) flash(errors.form);
      return;
    }

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
      <form onSubmit={onSubmit} className="mt-3" noValidate>
        <label className="tf-label mb-1">NEW PASSWORD</label>
        <div className="tf-input-wrap">
          <input
            className={`tf-input${fieldErrors.password ? ' tf-input--error' : ''}`}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPasswordField(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="tf-input-eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide new password' : 'Show new password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.password ? <div className="tf-field-error mt-1 mb-2">{fieldErrors.password}</div> : <div className="mb-3" />}

        <label className="tf-label mb-1">CONFIRM PASSWORD</label>
        <div className="tf-input-wrap">
          <input
            className={`tf-input${fieldErrors.confirm ? ' tf-input--error' : ''}`}
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirmField(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="tf-input-eye-btn"
            onClick={() => setShowConfirm((prev) => !prev)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.confirm ? <div className="tf-field-error mt-1 mb-2">{fieldErrors.confirm}</div> : <div className="mb-3" />}

        <button className="tf-btn tf-btn-primary" style={{ width: '100%' }}>Reset Password</button>
      </form>
      <div className="text-center mt-3 tf-subtext"><Link to="/login" style={{ fontWeight: 700 }}>Back to login</Link></div>
    </div>
  );
}
