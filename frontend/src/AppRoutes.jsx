// Purpose: Contains module logic for this part of the application.
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout      from './components/layout/AppLayout';
import AuthLayout     from './components/auth/AuthLayout';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import InviteAccept   from './pages/InviteAccept';
import Dashboard      from './pages/Dashboard';
import Projects       from './pages/Projects';
import Board          from './pages/Board';
import TaskList       from './pages/TaskList';
import Team           from './pages/Team';
import Notifications  from './pages/Notifications';
import Settings       from './pages/Settings';

// Private route - redirect to login if not authenticated
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Public route - redirect to dashboard if already authenticated
function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/invite/accept" element={<InviteAccept />} />

      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index              element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="projects"    element={<Projects />} />
        <Route path="board"       element={<Board />} />
        <Route path="list"        element={<TaskList />} />
        <Route path="team"        element={<Team />} />
        <Route path="reports"     element={<Navigate to="/dashboard" replace />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings"    element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}


