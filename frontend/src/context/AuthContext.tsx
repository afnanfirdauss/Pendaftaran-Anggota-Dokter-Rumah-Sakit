import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickDemoLogin: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mediqueue_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mediqueue_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check auth state on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('mediqueue_token');
      if (storedToken) {
        try {
          const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('mediqueue_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token invalid or expired
          localStorage.removeItem('mediqueue_token');
          localStorage.removeItem('mediqueue_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; data: { token: string; user: User } }>('/auth/login', {
      email,
      password,
    });

    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('mediqueue_token', res.data.token);
      localStorage.setItem('mediqueue_user', JSON.stringify(res.data.user));
    }
  };

  const quickDemoLogin = async (role: Role) => {
    const res = await api.post<{ success: boolean; data: { token: string; user: User } }>('/auth/quick-demo-login', {
      role,
    });

    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('mediqueue_token', res.data.token);
      localStorage.setItem('mediqueue_user', JSON.stringify(res.data.user));
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('mediqueue_token');
      localStorage.removeItem('mediqueue_user');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        quickDemoLogin,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
