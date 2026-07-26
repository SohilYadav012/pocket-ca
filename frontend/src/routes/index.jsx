/**
 * routes/index.jsx — Application Router Configuration
 * Pocket C.A. Frontend
 *
 * Defines all application routes using React Router v7.
 * - Public routes: accessible without authentication
 * - Protected routes: require authentication (PrivateRoute guard)
 * - Lazy-loaded pages for optimal bundle splitting
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ROUTES from '../constants/routes';
import { useAuth } from '../context/AuthContext';

// ─── Layout ───────────────────────────────────────────────────────────────────
import AppLayout from '../components/layout/AppLayout';

// ─── Lazy Page Imports ────────────────────────────────────────────────────────
const LoginPage       = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage    = lazy(() => import('../pages/Auth/RegisterPage'));
const DashboardPage   = lazy(() => import('../pages/DashboardPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const ReceiptScannerPage = lazy(() => import('../pages/ReceiptScannerPage'));
const BudgetsPage     = lazy(() => import('../pages/BudgetsPage'));
const GoalsPage       = lazy(() => import('../pages/GoalsPage'));
const InsightsPage    = lazy(() => import('../pages/InsightsPage'));
const AIChatPage      = lazy(() => import('../pages/AIChatPage'));
const ReportsPage     = lazy(() => import('../pages/ReportsPage'));
const ProfilePage     = lazy(() => import('../pages/ProfilePage'));
const NotFoundPage    = lazy(() => import('../pages/NotFoundPage'));

// ─── Loading Fallback ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-10 h-10 border-4 rounded-full animate-spin"
        style={{
          borderColor: 'var(--color-bg-border)',
          borderTopColor: 'var(--color-primary)',
        }}
      />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Loading...
      </p>
    </div>
  </div>
);

// ─── Private Route Guard ──────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  // Redirect to login if not authenticated
  // During Phase 1, we allow access for development
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

// ─── Public Route Guard (redirect if already logged in) ───────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : children;
};

// ─── Router ───────────────────────────────────────────────────────────────────
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public Routes ──────────────────────────────────────────── */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* ── Protected Routes (inside AppLayout) ────────────────────── */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />
            <Route path={ROUTES.OCR_SCANNER}  element={<ReceiptScannerPage />} />
            <Route path={ROUTES.BUDGETS}      element={<BudgetsPage />} />
            <Route path={ROUTES.GOALS}        element={<GoalsPage />} />
            <Route path={ROUTES.INSIGHTS}     element={<InsightsPage />} />
            <Route path={ROUTES.AI_CHAT}      element={<AIChatPage />} />
            <Route path={ROUTES.REPORTS}      element={<ReportsPage />} />
            <Route path={ROUTES.PROFILE}      element={<ProfilePage />} />
          </Route>

          {/* ── 404 Fallback ────────────────────────────────────────────── */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
