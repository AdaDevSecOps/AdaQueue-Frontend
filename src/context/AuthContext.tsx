import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Mock Token Types
interface User {
  username: string;
  role: 'ADMIN' | 'STAFF' | 'KIOSK' | 'CHEF';
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, pin: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedToken = localStorage.getItem('adaqueue_token');
    const storedUser = localStorage.getItem('adaqueue_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, pin: string): Promise<User | null> => {
    try {
      const response = await axios.post(`${API_CONFIG.BASE}/api/auth/login`, {
        username: username,
        password: pin,
      });

      if (response.data && response.data.access_token) {
        const { user: userData, access_token } = response.data;
        saveSession(userData, access_token);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const saveSession = (user: User, token: string) => {
    localStorage.setItem('adaqueue_token', token);
    localStorage.setItem('adaqueue_user', JSON.stringify(user));
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('adaqueue_token');
    localStorage.removeItem('adaqueue_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
