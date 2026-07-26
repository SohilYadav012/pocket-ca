/**
 * context/AuthContext.jsx — Authentication Context
 * Pocket C.A. Frontend
 *
 * Manages global authentication state (token, user).
 * Provides login, logout, and register actions.
 * Persists auth state in localStorage.
 *
 * NOTE: Business logic (API calls) will be added in Phase 2.
 * This file establishes the context shape and provider structure.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

// ─── Context Shape ────────────────────────────────────────────────────────────
const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'pca_token';
const USER_KEY  = 'pca_user';

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session from localStorage on mount ────────────────────────────
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser  = localStorage.getItem(USER_KEY);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      // Corrupted localStorage — clear it
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Persist session to localStorage ──────────────────────────────────────
  const persistSession = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  // ── Clear session ─────────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password });
    persistSession(data.token, data.user);
    return data;
  }, [persistSession]);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password, currency = 'INR') => {
    const data = await authService.register({ name, email, password, currency });
    persistSession(data.token, data.user);
    return data;
  }, [persistSession]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // ── Update user (e.g., after profile edit) ────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    persistSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
