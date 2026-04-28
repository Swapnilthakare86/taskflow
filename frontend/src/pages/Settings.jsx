import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/services';

function friendlyError(err, fallback) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.response?.status === 401) return 'Your session expired. Please sign in again.';
  if (err?.response?.status >= 500) return 'Server problem. Please try again in a moment.';
  if (err?.code === 'ERR_NETWORK') return 'Cannot connect to the server. Please check backend is running.';
  return fallback;
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', department: user?.department || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    setProfile({ name: user?.name || '', department: user?.department || '' });
  }, [user?.name, user?.department]);

  function showMessage(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  }

  function setProfileField(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => ({ ...prev, [field]: '' }));
    setMsg({ type: '', text: '' });
  }

  function setPasswordField(field, value) {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: '' }));
    setMsg({ type: '', text: '' });
  }

  function validateProfile() {
    const errors = {};
    const name = String(profile.name || '').trim();
    const department = String(profile.department || '').trim();

    if (!name) errors.name = 'Full name is required.';
    else if (name.length < 2) errors.name = 'Full name must be at least 2 characters.';
    else if (name.length > 120) errors.name = 'Full name must not exceed 120 characters.';

    if (department.length > 120) errors.department = 'Department must not exceed 120 characters.';
    return errors;
  }

  function validatePassword() {
    const errors = {};
    if (!passwords.currentPassword) errors.currentPassword = 'Current password is required.';
    if (!passwords.newPassword) errors.newPassword = 'New password is required.';
    else if (passwords.newPassword.length < 6) errors.newPassword = 'New password must be at least 6 characters.';
    else if (passwords.currentPassword && passwords.currentPassword === passwords.newPassword) {
      errors.newPassword = 'New password must be different from current password.';
    }
    return errors;
  }

  async function saveProfile() {
    const errors = validateProfile();
    setProfileErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    try {
      const { data } = await userService.updateMe({
        name: profile.name.trim(),
        department: profile.department.trim(),
      });
      updateUser?.(data.data);
      showMessage('success', 'Profile updated successfully.');
    } catch (err) {
      showMessage('error', friendlyError(err, 'Failed to update profile.'));
    }
  }

  async function updatePassword() {
    const errors = validatePassword();
    setPasswordErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    try {
      await userService.updatePassword(passwords);
      showMessage('success', 'Password updated successfully.');
    } catch (err) {
      const text = friendlyError(err, 'Failed to update password.');
      if (text.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: text });
      } else if (text.toLowerCase().includes('new password')) {
        setPasswordErrors({ newPassword: text });
      }
      showMessage('error', text);
    } finally {
      setPasswords({ currentPassword: '', newPassword: '' });
    }
  }

  return (
    <div className="tf-fade-up tf-settings-page d-grid gap-3">
      {msg.text && <div className={`tf-alert tf-alert-${msg.type}`}>{msg.text}</div>}

      <div className="tf-card" style={{ padding: 16 }}>
        <h3 className="tf-heading-lg" style={{ fontSize: 28 }}>Profile Information</h3>
        <p className="tf-subtext">Update your name and department. Avatar is auto-generated.</p>
        <div className="row g-2 mt-1">
          <div className="col-md-6">
            <label className="tf-label">FULL NAME</label>
            <input
              className={`tf-input${profileErrors.name ? ' tf-input--error' : ''}`}
              value={profile.name}
              onChange={(e) => setProfileField('name', e.target.value)}
            />
            {profileErrors.name && <div className="tf-field-error">{profileErrors.name}</div>}
          </div>
          <div className="col-md-6">
            <label className="tf-label">DEPARTMENT</label>
            <input
              className={`tf-input${profileErrors.department ? ' tf-input--error' : ''}`}
              value={profile.department}
              onChange={(e) => setProfileField('department', e.target.value)}
            />
            {profileErrors.department && <div className="tf-field-error">{profileErrors.department}</div>}
          </div>
        </div>
        <button className="tf-btn tf-btn-primary mt-3" onClick={saveProfile}>Save Changes</button>
      </div>

      <div className="tf-card" style={{ padding: 16 }}>
        <h3 className="tf-heading-lg" style={{ fontSize: 28 }}>Security</h3>
        <p className="tf-subtext">Manage your password and active sessions.</p>
        <div className="row g-2 mt-1">
          <div className="col-md-6">
            <label className="tf-label">CURRENT PASSWORD</label>
            <div className="tf-input-wrap">
              <input
                className={`tf-input${passwordErrors.currentPassword ? ' tf-input--error' : ''}`}
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.currentPassword}
                onChange={(e) => setPasswordField('currentPassword', e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="tf-input-eye-btn"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.currentPassword && <div className="tf-field-error">{passwordErrors.currentPassword}</div>}
          </div>
          <div className="col-md-6">
            <label className="tf-label">NEW PASSWORD</label>
            <div className="tf-input-wrap">
              <input
                className={`tf-input${passwordErrors.newPassword ? ' tf-input--error' : ''}`}
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={(e) => setPasswordField('newPassword', e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="tf-input-eye-btn"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.newPassword && <div className="tf-field-error">{passwordErrors.newPassword}</div>}
          </div>
        </div>
        <button className="tf-btn tf-btn-ghost mt-3" onClick={updatePassword}>Update Password</button>
      </div>
    </div>
  );
}
