import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALLOWED_EMAIL_DOMAINS = ['xtsworld.in', 'gmail.com'];

function isAllowedDomain(email) {
  const [, domain = ''] = String(email || '').toLowerCase().split('@');
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '';

  function setField(field, value) {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = {};
    const trimmedEmail = String(email || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) errors.email = 'Email is required.';
    else if (!emailPattern.test(trimmedEmail)) errors.email = 'Please enter a valid email address.';
    else if (!isAllowedDomain(trimmedEmail)) {
      errors.email = `Email domain is not allowed. Use: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`;
    }

    if (!password) errors.password = 'Password is required.';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    try {
      await login(trimmedEmail, password);
      navigate(next || '/dashboard', { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        const nextErrors = {};
        for (const item of apiErrors) {
          if (item?.field === 'email') nextErrors.email = item.message;
          if (item?.field === 'password') nextErrors.password = item.message;
        }
        if (Object.keys(nextErrors).length) {
          setFieldErrors(nextErrors);
          return;
        }
      }

      const msg = err.response?.data?.message || 'Login failed.';
      if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: msg });
      } else if (msg.toLowerCase().includes('password')) {
        setFieldErrors({ password: msg });
      } else {
        setError(msg);
      }
    }
  }

  return (
    <div className="tf-card tf-auth-card">
      <h1 className="tf-heading-lg">Welcome Back</h1>
      <p className="tf-subtext mt-2">Sign in with your workspace email and password.</p>

      {error && <div className="tf-card" style={{ marginTop: 12, padding: 10, borderColor: '#fecaca', background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}

      <form onSubmit={onSubmit} noValidate style={{ marginTop: 12 }}>
        <label className="tf-label mb-1">EMAIL</label>
        <input
          className={`tf-input${fieldErrors.email ? ' tf-input--error' : ''}`}
          style={{ marginBottom: fieldErrors.email ? 6 : 12 }}
          type="email"
          value={email}
          onChange={(e) => setField('email', e.target.value)}
          autoComplete="email"
        />
        {fieldErrors.email && <div className="tf-field-error mb-2">{fieldErrors.email}</div>}

        <label className="tf-label mb-1">PASSWORD</label>
        <div className="tf-input-wrap">
          <input
            className={`tf-input${fieldErrors.password ? ' tf-input--error' : ''}`}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setField('password', e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="tf-input-eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.password && <div className="tf-field-error mt-1">{fieldErrors.password}</div>}

        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <Link
            to={next ? `/forgot-password?next=${encodeURIComponent(next)}` : '/forgot-password'}
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            Forgot password?
          </Link>
        </div>

        <button className="tf-btn tf-btn-primary" style={{ width: '100%' }} disabled={loading}>Sign In</button>
      </form>

      <div className="text-center mt-3 tf-subtext">
        New here?{' '}
        <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} style={{ fontWeight: 700 }}>
          Create account
        </Link>
      </div>
    </div>
  );
}
