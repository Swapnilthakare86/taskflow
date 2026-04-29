import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/services';

const ALLOWED_EMAIL_DOMAINS = ['xtsworld.in', 'gmail.com'];

function isAllowedDomain(email) {
  const [, domain = ''] = String(email || '').toLowerCase().split('@');
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  function flash(text, type = 'error') {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setFieldError('');
    setMsg({ type: '', text: '' });

    const trimmedEmail = String(email || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setFieldError('Email is required.');
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setFieldError('Please enter a valid email address.');
      return;
    }
    if (!isAllowedDomain(trimmedEmail)) {
      setFieldError(`Email domain is not allowed. Use: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword({ email: trimmedEmail });
      flash('Reset link sent to your email.', 'success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        const emailError = apiErrors.find((item) => item?.field === 'email');
        if (emailError?.message) {
          setFieldError(emailError.message);
          return;
        }
      }
      flash(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tf-card tf-auth-card">
      <h1 className="tf-heading-lg">Forgot Password</h1>
      <p className="tf-subtext mt-2">Enter your account email to receive a password reset link.</p>
      {msg.text && <div className="tf-card" style={{ marginTop: 12, padding: 10, borderColor: msg.type === 'success' ? '#86efac' : '#fecaca', background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2', color: msg.type === 'success' ? '#166534' : '#b91c1c' }}>{msg.text}</div>}
      <form onSubmit={onSubmit} className="mt-3" noValidate>
        <label className="tf-label mb-1">EMAIL ADDRESS</label>
        <input className={`tf-input${fieldError ? ' tf-input--error' : ''}`} style={{ marginBottom: fieldError ? 6 : 12 }} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(''); }} autoComplete="email" />
        {fieldError && <div className="tf-field-error mb-2">{fieldError}</div>}
        <button className="tf-btn tf-btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <div className="text-center mt-3 tf-subtext">Remembered your password? <Link to="/login" style={{ fontWeight: 700 }}>Back to login</Link></div>
    </div>
  );
}
