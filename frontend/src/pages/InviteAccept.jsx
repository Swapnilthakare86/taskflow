import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../api/services';

export default function InviteAccept() {
  const [msg, setMsg] = useState('Accepting invite...');
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function accept() {
      const token = params.get('token');
      if (!token) {
        setMsg('Invite token missing.');
        return;
      }
      if (!user) {
        navigate(`/login?next=/invite/accept?token=${encodeURIComponent(token)}`, { replace: true });
        return;
      }
      try {
        await projectService.acceptInvite({ token });
        setMsg('Invite accepted. Redirecting to projects...');
        setTimeout(() => navigate('/projects', { replace: true }), 900);
      } catch (err) {
        setMsg(err.response?.data?.message || 'Failed to accept invite.');
      }
    }
    accept();
  }, [params, user, navigate]);

  return <div className="tf-card" style={{ margin: 30, padding: 24 }}>{msg}</div>;
}
