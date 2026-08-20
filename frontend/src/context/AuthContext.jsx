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
  // Hardcoded Mock User
  const mockUser = {
    _id: 'mock_user_123',
    name: 'Guest User',
    email: 'guest@pocketca.ai',
  };

  // ── Provide Auth Context ──────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        user: mockUser,
        token: 'mock_token',
        isAuthenticated: true,
        isLoading: false,
        login: async () => {},
        register: async () => {},
        logout: () => {},
        updateUser: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
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
