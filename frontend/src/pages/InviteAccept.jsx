import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../api/services';

export default function InviteAccept() {
  const [msg, setMsg] = useState('Accepting invite...');
  const [mode, setMode] = useState('loading');
  const [params] = useSearchParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = params.get('token');
  const nextUrl = token ? `/invite/accept?token=${encodeURIComponent(token)}` : '/invite/accept';

  function signInWithInvitedAccount() {
    logout();
    navigate(`/login?next=${encodeURIComponent(nextUrl)}`, { replace: true });
  }

  useEffect(() => {
    async function accept() {
      if (!token) {
        setMsg('Invite token missing.');
        setMode('error');
        return;
      }
      if (!user) {
        navigate(`/login?next=/invite/accept?token=${encodeURIComponent(token)}`, { replace: true });
        return;
      }
      try {
        await projectService.acceptInvite({ token });
        setMsg('Invite accepted. Redirecting to projects...');
        setMode('success');
        setTimeout(() => navigate('/projects', { replace: true }), 900);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to accept invite.';
        if (message.toLowerCase().includes('different email')) {
          setMsg(`This invite was sent to a different email account. You are currently signed in as ${user.email}. Please sign in with the invited email address to accept it.`);
          setMode('email_mismatch');
        } else {
          setMsg(message);
          setMode('error');
        }
      }
    }
    accept();
  }, [navigate, token, user]);

  return (
    <div className="tf-card" style={{ maxWidth: 520, margin: '48px auto', padding: 26 }}>
      <h1 className="tf-heading-lg">
        {mode === 'success' ? 'Invite Accepted' : mode === 'email_mismatch' ? 'Use Invited Email' : 'Project Invite'}
      </h1>
      <p className="tf-subtext mt-2" style={{ lineHeight: 1.6 }}>{msg}</p>

      {mode === 'email_mismatch' && (
        <div className="d-flex gap-2 mt-3 flex-wrap">
          <button className="tf-btn tf-btn-primary" onClick={signInWithInvitedAccount}>
            Sign in with invited email
          </button>
          <button className="tf-btn tf-btn-ghost" onClick={() => navigate('/projects', { replace: true })}>
            Back to projects
          </button>
        </div>
      )}

      {mode === 'error' && (
        <button className="tf-btn tf-btn-ghost mt-3" onClick={() => navigate('/projects', { replace: true })}>
          Back to projects
        </button>
      )}
    </div>
  );
}
