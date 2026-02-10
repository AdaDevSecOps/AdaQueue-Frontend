import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock Token Types
interface User {
  username: string;
  role: 'ADMIN' | 'STAFF' | 'KIOSK';
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

  const login = async (pin: string): Promise<User | null> => {
    // Simulate API Call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (pin === '1234') {
          const mockUser: User = { username: 'admin', role: 'ADMIN', name: 'System Admin' };
          const mockToken = 'mock-jwt-token-admin';
          saveSession(mockUser, mockToken);
          resolve(mockUser);
        } else if (pin === '0000') {
            const mockUser: User = { username: 'staff', role: 'STAFF', name: 'Service Staff' };
            const mockToken = 'mock-jwt-token-staff';
            saveSession(mockUser, mockToken);
            resolve(mockUser);
        } else if (pin === '9999') {
             const mockUser: User = { username: 'kiosk', role: 'KIOSK', name: 'Kiosk Terminal' };
             const mockToken = 'mock-jwt-token-kiosk';
             saveSession(mockUser, mockToken);
             resolve(mockUser);
        } else {
          resolve(null);
        }
      }, 800);
    });
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
