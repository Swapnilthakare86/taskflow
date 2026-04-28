import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Layout, List, Users,
  Bell, Settings, LogOut, Layers, Shield, Briefcase, Crown, User, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth }    from '../../context/AuthContext';
import Avatar         from '../common/Avatar';
import XtsBrand       from '../common/XtsBrand';
import './Sidebar.css';

const MANAGER_NAV = [
  { to: '/dashboard',     label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/projects',      label: 'Projects',    Icon: Layers },
  { to: '/board',         label: 'Team Board',  Icon: Layout },
  { to: '/list',          label: 'Task List',   Icon: List },
  { to: '/team',          label: 'Team',        Icon: Users },
];

const EMPLOYEE_NAV = [
  { to: '/dashboard',  label: 'My Dashboard', Icon: LayoutDashboard },
  { to: '/board',      label: 'Board',        Icon: Layout },
  { to: '/list',       label: 'Team Tasks',   Icon: List },
  { to: '/team',       label: 'Team',         Icon: Users },
];

const FOOTER_NAV = [
  { to: '/notifications', label: 'Notifications', Icon: Bell },
  { to: '/settings',      label: 'Settings',      Icon: Settings },
];

export default function Sidebar({
  unreadCount = 0,
  isOpen = false,
  collapsed = false,
  onToggleCollapse,
  onClose,
}) {
  const { user, canManage, isClient, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = (canManage || isClient) ? MANAGER_NAV : EMPLOYEE_NAV;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className={`tf-sidebar${isOpen ? ' tf-sidebar--open' : ''}${collapsed ? ' tf-sidebar--collapsed' : ''}`}>
      <button className="tf-sidebar__mobile-close" onClick={onClose} aria-label="Close menu">
        <X size={16} />
      </button>
      <button
        className="tf-sidebar__collapse-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      {/* Brand */}
      <div className="tf-sidebar__brand">
        <div className="mb-1">
          <XtsBrand compact light />
        </div>

        {/* User card */}
        <div className="tf-sidebar__user mt-3">
          <Avatar user={user} size={30} />
          {!collapsed && (
            <div className="min-w-0 flex-grow-1">
              <div className="tf-sidebar__user-name">{user?.name}</div>
              <span className={
                user?.role === 'admin'
                  ? 'tf-role-admin'
                  : user?.role === 'manager'
                    ? 'tf-role-manager'
                    : user?.role === 'client'
                      ? 'tf-role-client'
                      : 'tf-role-employee'
              }>
                {user?.role === 'admin'
                  ? <><Crown size={9} className="me-1" />ADMIN</>
                  : user?.role === 'manager'
                    ? <><Shield size={9} className="me-1" />MANAGER</>
                    : user?.role === 'client'
                      ? <><User size={9} className="me-1" />CLIENT</>
                      : <><Briefcase size={9} className="me-1" />EMPLOYEE</>}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="tf-sidebar__nav">
        {!collapsed && <div className="tf-sidebar__section-label"></div>}
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `tf-sidebar__nav-item${isActive ? ' tf-sidebar__nav-item--active' : ''}`
            }
          >
            <Icon size={15} />
            <span className="tf-sidebar__nav-item-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer nav */}
      <div className="tf-sidebar__footer">
        {FOOTER_NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `tf-sidebar__nav-item${isActive ? ' tf-sidebar__nav-item--active' : ''}`
            }
          >
            <Icon size={14} />
            <span className="tf-sidebar__nav-item-label flex-grow-1">{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="tf-sidebar__notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}

        <button className="tf-sidebar__logout" onClick={handleLogout} title={collapsed ? 'Sign out' : undefined}>
          <LogOut size={13} />
          <span className="tf-sidebar__nav-item-label">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
