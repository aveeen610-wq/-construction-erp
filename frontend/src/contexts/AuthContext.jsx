import { createContext, useContext, useState } from 'react';
import { auth as authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.adminLogin({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const isAuthenticated = !!token && !!user;
  const isSuperAdmin = user?.role === 'super_admin';
  const isOwner = user?.role === 'owner';
  const isManager = user?.role === 'manager';
  const canManageEmployees = isOwner || isManager;
  const canViewAccounting = user?.permissions?.includes('can_view_accounting') || isOwner || isManager || user?.role === 'accountant';
  const canViewInventory = user?.permissions?.includes('can_view_inventory') || isOwner || isManager || user?.role === 'inventory';

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, adminLogin, logout,
      isAuthenticated, isSuperAdmin, isOwner, isManager,
      canManageEmployees, canViewAccounting, canViewInventory
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
