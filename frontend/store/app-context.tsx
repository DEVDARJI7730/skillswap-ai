'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AppContextType {
  user: any | null;
  loading: boolean;
  activeTab: string;
  theme: 'dark' | 'light';
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
  loginUser: (credentials: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  logoutUser: () => void;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for settings and tokens
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const res = await api.get('/api/users/me');
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const loginUser = async (credentials: any) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/login', credentials);
      const { access_token, refresh_token } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      const userRes = await api.get('/api/users/me');
      setUser(userRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
      throw err;
    }
  };

  const registerUser = async (data: any) => {
    setError(null);
    try {
      await api.post('/api/auth/register', data);
      // Auto login after successful register
      await loginUser({ email: data.email, password: data.password });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    }
  };

  const loginGoogle = async (idToken: string) => {
    setError(null);
    try {
      const res = await api.post(`/api/auth/google?id_token=${encodeURIComponent(idToken)}`);
      const { access_token, refresh_token } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      const userRes = await api.get('/api/users/me');
      setUser(userRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google Authentication failed');
      throw err;
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setActiveTab('dashboard');
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/users/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to refresh user profile data:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        activeTab,
        theme,
        setActiveTab,
        toggleTheme,
        loginUser,
        registerUser,
        loginGoogle,
        logoutUser,
        refreshUser,
        error,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
