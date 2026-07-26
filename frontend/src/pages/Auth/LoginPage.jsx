/**
 * pages/Auth/LoginPage.jsx — Login Page
 * Pocket C.A. Frontend
 *
 * Public page — redirects to dashboard if already authenticated.
 * Handles interactive sign-in with validation and error feedback.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import ROUTES from '../../constants/routes';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD || '/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      showSuccess('Welcome back to Pocket C.A.!');
      navigate(ROUTES.DASHBOARD || '/');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to sign in. Please check your credentials.';
      setError(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Background gradient orbs */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--color-primary)' }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--color-secondary)' }}
      />

      <div className="w-full max-w-md animate-fade-in">
        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Wallet size={26} color="#fff" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Welcome Back</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Sign in to your Pocket C.A. account
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'var(--color-bg-hover)',
                    border: '1px solid var(--color-bg-border)',
                    color: 'var(--color-text-primary)',
                    paddingLeft: '2.5rem',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'var(--color-bg-hover)',
                    border: '1px solid var(--color-bg-border)',
                    color: 'var(--color-text-primary)',
                    paddingLeft: '2.5rem',
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all mt-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                color: '#fff',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--color-bg-border)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              New to Pocket C.A.?
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-bg-border)' }} />
          </div>

          <Link
            to={ROUTES.REGISTER}
            className="block text-center text-sm font-medium py-2.5 rounded-xl transition-all hover:bg-white/5"
            style={{
              border: '1px solid var(--color-bg-border)',
              color: 'var(--color-primary)',
            }}
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
