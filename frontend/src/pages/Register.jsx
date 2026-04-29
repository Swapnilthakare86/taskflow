import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../api/services';

const ALLOWED_EMAIL_DOMAINS = ['xtsworld.in', 'gmail.com'];

function isAllowedDomain(email) {
  const [, domain = ''] = String(email || '').toLowerCase().split('@');
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', role: 'employee', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const next = params.get('next') || '';

  function show(text, type = 'error') {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setMsg({ type: '', text: '' });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    const trimmedName = String(form.name || '').trim();
    const trimmedEmail = String(form.email || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) errors.name = 'Name is required.';
    if (!trimmedEmail) errors.email = 'Email is required.';
    else if (!emailPattern.test(trimmedEmail)) errors.email = 'Please enter a valid email address.';
    else if (!isAllowedDomain(trimmedEmail)) {
      errors.email = `Email domain is not allowed. Use: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`;
    }
    if (!form.role) errors.role = 'Role is required.';
    if (!form.password) errors.password = 'Password is required.';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (!form.confirm) errors.confirm = 'Confirm password is required.';
    else if (form.password !== form.confirm) errors.confirm = 'Password and confirm password do not match.';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await authService.register({ name: trimmedName, email: trimmedEmail, role: form.role, password: form.password });
      show('Registration successful. Please sign in.', 'success');
      const loginWithNext = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
      setTimeout(() => navigate(loginWithNext, { replace: true }), 800);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        const mapped = {};
        for (const item of apiErrors) {
          if (item?.field) mapped[item.field] = item.message;
        }
        if (Object.keys(mapped).length) {
          setFieldErrors(mapped);
          return;
        }
      }
      show(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tf-card tf-auth-card">
      <h1 className="tf-heading-lg">Create Account</h1>
      <p className="tf-subtext mt-2">Create a new workspace account.</p>
      {msg.text && <div className="tf-card" style={{ marginTop: 12, padding: 10, borderColor: msg.type === 'success' ? '#86efac' : '#fecaca', background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2', color: msg.type === 'success' ? '#166534' : '#b91c1c' }}>{msg.text}</div>}

      <form onSubmit={onSubmit} className="mt-3" noValidate>
        <label className="tf-label mb-1">FULL NAME</label>
        <input className={`tf-input${fieldErrors.name ? ' tf-input--error' : ''}`} style={{ marginBottom: fieldErrors.name ? 6 : 12 }} value={form.name} onChange={(e) => setField('name', e.target.value)} />
        {fieldErrors.name && <div className="tf-field-error mb-2">{fieldErrors.name}</div>}

        <label className="tf-label mb-1">WORK EMAIL</label>
        <input className={`tf-input${fieldErrors.email ? ' tf-input--error' : ''}`} style={{ marginBottom: fieldErrors.email ? 6 : 12 }} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} autoComplete="email" />
        {fieldErrors.email && <div className="tf-field-error mb-2">{fieldErrors.email}</div>}

        <label className="tf-label mb-1">ROLE</label>
        <select className={`tf-input${fieldErrors.role ? ' tf-input--error' : ''}`} style={{ marginBottom: fieldErrors.role ? 6 : 12 }} value={form.role} onChange={(e) => setField('role', e.target.value)}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
        {fieldErrors.role && <div className="tf-field-error mb-2">{fieldErrors.role}</div>}

        <div className="row g-2 mb-3 tf-auth-password-grid">
          <div className="col-6">
            <label className="tf-label mb-1">PASSWORD</label>
            <div className="tf-input-wrap">
              <input
                className={`tf-input${fieldErrors.password ? ' tf-input--error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                autoComplete="new-password"
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
          </div>
          <div className="col-6">
            <label className="tf-label mb-1">CONFIRM</label>
            <div className="tf-input-wrap">
              <input
                className={`tf-input${fieldErrors.confirm ? ' tf-input--error' : ''}`}
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => setField('confirm', e.target.value)}
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
            {fieldErrors.confirm && <div className="tf-field-error mt-1">{fieldErrors.confirm}</div>}
          </div>
        </div>

        <button className="tf-btn tf-btn-primary" style={{ width: '100%' }} disabled={loading}>Create Account</button>
      </form>

      <div className="text-center mt-3 tf-subtext">
        Already have an account?{' '}
        <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} style={{ fontWeight: 700 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
