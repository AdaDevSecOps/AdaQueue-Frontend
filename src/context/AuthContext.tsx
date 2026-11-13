import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiPath, apiFetch, setApiToken } from '../config/api';

interface User {
  username: string;
  role: 'ADMIN' | 'STAFF';
  sourceRole: string;
  name: string;
}
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (pin: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | null>(null);
const storageKey = 'adaqueue_kds_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expires, setExpires] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logout = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setApiToken(null); setUser(null); setToken(null); setExpires(null);
  }, []);
  const saveSession = (value: { user: User; exp: number }, valueToken: string) => {
    if (!['ADMIN', 'STAFF'].includes(value.user?.role) || !Number.isFinite(value.exp) || value.exp * 1000 <= Date.now())
      throw new Error('Invalid authentication response');
    sessionStorage.setItem(storageKey, valueToken);
    setApiToken(valueToken); setToken(valueToken); setUser(value.user); setExpires(value.exp);
  };
  useEffect(() => {
    let active = true;
    localStorage.removeItem('adaqueue_token');
    localStorage.removeItem('adaqueue_user');
    window.addEventListener('adaqueue:unauthorized', logout);
    const stored = sessionStorage.getItem(storageKey);
    const restore = async () => {
      if (stored) {
        setApiToken(stored);
        try {
          const response = await apiFetch(apiPath('/api/auth/session'));
          if (!response.ok) throw new Error('Session unavailable');
          const value = await response.json();
          if (active) saveSession(value, stored);
        } catch { if (active) logout(); }
      }
      if (active) setIsLoading(false);
    };
    restore();
    return () => { active = false; window.removeEventListener('adaqueue:unauthorized', logout); };
  }, [logout]);
  useEffect(() => {
    if (!expires) return;
    const timer = window.setTimeout(logout, Math.max(0, expires * 1000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expires, logout]);
  const login = async (pin: string): Promise<User | null> => {
    const response = await apiFetch(apiPath('/api/auth/login-pin'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error('Authentication unavailable');
    const value = await response.json();
    if (typeof value.token !== 'string') throw new Error('Invalid authentication response');
    saveSession(value, value.token);
    return value.user;
  };
  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
