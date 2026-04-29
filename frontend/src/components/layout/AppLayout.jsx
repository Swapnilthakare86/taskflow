import { useState } from 'react';
import { Bell, LogOut, Menu, Search, ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useProject } from '../../context/ProjectContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';
import { projectService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import ZohoInviteModal from '../modals/ZohoInviteModal';

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 9999 }}>
      <div className="tf-card" style={{ padding: '10px 12px', minWidth: 240, borderColor: toast.type === 'error' ? '#fecaca' : '#bbf7d0' }}>
        <div style={{ fontSize: 13 }}>{toast.msg}</div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef(null);
  const [inviteState, setInviteState] = useState({
    open: false,
    project: null,
    recipientEmail: '',
    sending: false,
  });
  const { projects, activeId, setActiveId, activeProject, fetchProjects } = useProject();
  const { toast, showToast } = useToast();
  const {
    items: notifications,
    unreadCount,
    markRead,
    markAllRead,
    fetchNotifications,
  } = useNotifications();

  useEffect(() => {
    function closeProjectMenu(event) {
      if (!projectMenuRef.current?.contains(event.target)) {
        setProjectMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeProjectMenu);
    return () => document.removeEventListener('mousedown', closeProjectMenu);
  }, []);

  async function openInvite(targetProject) {
    const project = targetProject || activeProject;
    if (!project?.id) return;
    setInviteState({
      open: true,
      project,
      recipientEmail: '',
      sending: false,
    });
  }

  function closeInviteModal() {
    setInviteState((prev) => ({
      ...prev,
      open: false,
      sending: false,
    }));
  }

  async function sendInviteFromModal() {
    const { project, recipientEmail } = inviteState;
    const email = String(recipientEmail || '').trim();
    if (!project?.id || !email) return;
    setInviteState((prev) => ({ ...prev, sending: true }));
    try {
      await projectService.invite(project.id, { email });
      await fetchNotifications();
      showToast('Invite sent successfully');
      setInviteState((prev) => ({
        ...prev,
        sending: false,
        open: false,
        recipientEmail: '',
      }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send invite', 'error');
      setInviteState((prev) => ({ ...prev, sending: false }));
    }
  }

  function handleMobileLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="tf-app-shell">
      <Sidebar
        unreadCount={unreadCount}
        isOpen={mobileOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onClose={() => setMobileOpen(false)}
      />
      {mobileOpen && <button className="tf-sidebar-backdrop d-lg-none" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}

      <div className="tf-main">
        <header className="tf-topbar">
          <button className="tf-btn tf-btn-ghost tf-btn-xs d-lg-none" onClick={() => setMobileOpen(true)}><Menu size={14} /></button>

          <div className="tf-topbar__project-wrap" ref={projectMenuRef}>
            <button
              type="button"
              className={`tf-topbar__project${projectMenuOpen ? ' tf-topbar__project--open' : ''}`}
              onClick={() => setProjectMenuOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={projectMenuOpen}
            >
              <span className="tf-topbar__project-dot" />
              <span className="tf-topbar__project-copy">
                <span className="tf-topbar__project-label">Select Project</span>
                <span className="tf-topbar__project-name">{activeProject?.name || 'No projects'}</span>
              </span>
              <ChevronDown className="tf-topbar__project-chevron" size={16} />
            </button>

            {projectMenuOpen && (
              <div className="tf-topbar__project-menu" role="listbox">
                {!projects.length ? (
                  <div className="tf-topbar__project-empty">No projects available</div>
                ) : projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`tf-topbar__project-option${Number(activeId) === Number(p.id) ? ' tf-topbar__project-option--active' : ''}`}
                    onClick={() => {
                      setActiveId(Number(p.id));
                      setProjectMenuOpen(false);
                    }}
                    role="option"
                    aria-selected={Number(activeId) === Number(p.id)}
                  >
                    <span className="tf-topbar__project-option-dot" />
                    <span>
                      <strong>{p.name}</strong>
                      {p.code && <small>{p.code}</small>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="tf-topbar__search">
            <Search size={14} color="#94a3b8" />
            <span className="tf-subtext">Search tasks, members...</span>
          </div>

          <div className="tf-topbar__right">
            <button className="tf-topbar__icon-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
              <Bell size={16} />
              {unreadCount > 0 && <span className="tf-topbar__notif-pill">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <button className="tf-topbar__icon-btn tf-topbar__logout-btn d-lg-none" onClick={handleMobileLogout} aria-label="Sign out">
              <LogOut size={15} />
            </button>
            <Avatar user={user} size={40} />
          </div>
        </header>

        <div className="tf-page">
          <Outlet
            context={{
              showToast,
              openInvite,
              refreshProjects: fetchProjects,
              notifications,
              unreadCount,
              markRead,
              markAllRead,
              refreshNotifications: fetchNotifications,
            }}
          />
        </div>
      </div>

      <Toast toast={toast} />
      <ZohoInviteModal
        open={inviteState.open}
        project={inviteState.project}
        senderName={user?.name || 'TaskFlow'}
        senderEmail={user?.email || 'no-reply@taskflow.app'}
        recipientEmail={inviteState.recipientEmail}
        sending={inviteState.sending}
        onRecipientChange={(value) => setInviteState((prev) => ({ ...prev, recipientEmail: value }))}
        onSend={sendInviteFromModal}
        onClose={closeInviteModal}
      />
    </div>
  );
}
