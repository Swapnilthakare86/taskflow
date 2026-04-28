import { createContext, useContext, useMemo, useState } from 'react';
import { authService } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tf_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('tf_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  function persist(nextToken, nextUser) {
    setToken(nextToken || '');
    setUser(nextUser || null);
    if (nextToken) localStorage.setItem('tf_token', nextToken);
    else localStorage.removeItem('tf_token');
    if (nextUser) localStorage.setItem('tf_user', JSON.stringify(nextUser));
    else localStorage.removeItem('tf_user');
  }

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await authService.login({ email, password });
      persist(data.data.token, data.data.user);
      return data.data;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await authService.register(payload);
      persist(data.data.token, data.data.user);
      return data.data;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    persist('', null);
  }

  function updateUser(nextUser) {
    if (!nextUser) return;
    setUser((prev) => {
      const merged = { ...(prev || {}), ...nextUser };
      localStorage.setItem('tf_user', JSON.stringify(merged));
      return merged;
    });
  }

  const role = user?.role || '';
  const canManage = role === 'admin' || role === 'manager';
  const canReadAll = canManage || role === 'client';
  const isClient = role === 'client';

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    canManage,
    canReadAll,
    isClient,
  }), [user, token, loading, canManage, canReadAll, isClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
