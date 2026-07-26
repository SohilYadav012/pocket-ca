/**
 * context/FinanceContext.jsx — Finance & Dashboard Data Context
 * Pocket C.A. Frontend
 *
 * Provides a shared, cached repository of the user's financial dashboard
 * metrics (summary, monthly trends, category breakdown, recent transactions).
 *
 * Performance optimizations:
 * - Caches dashboard data in memory to prevent duplicate API calls on navigation.
 * - Implements a 60-second freshness window for automatic background revalidation.
 * - Provides a `force` parameter to immediately refresh data after CRUD operations.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import * as dashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';

// ─── Context Shape ────────────────────────────────────────────────────────────
const FinanceContext = createContext({
  summary: null,
  monthlyTrend: [],
  categoryBreakdown: [],
  recentTransactions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  refreshDashboard: async () => {},
  refreshSummary: async () => {},
  clearFinanceData: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const FinanceProvider = ({ children }) => {
  const [summary, setSummary]                       = useState(null);
  const [monthlyTrend, setMonthlyTrend]             = useState([]);
  const [categoryBreakdown, setCategoryBreakdown]   = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading]                   = useState(false);
  const [error, setError]                           = useState(null);
  const [lastUpdated, setLastUpdated]               = useState(null);

  // ── Refresh ALL dashboard analytics (parallel fetch) ───────────────────────
  const refreshDashboard = useCallback(async (force = false) => {
    // Return cached data if fresh (less than 60s old) and not forced
    if (!force && lastUpdated && Date.now() - lastUpdated < 60000 && summary) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [sumRes, trendRes, catRes, recRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getMonthlyTrend(),
        dashboardService.getCategoryBreakdown(),
        dashboardService.getRecentTransactions(),
      ]);

      setSummary(sumRes.data || null);
      setMonthlyTrend(trendRes.data || []);
      setCategoryBreakdown(catRes.data || []);
      setRecentTransactions(recRes.data || []);
      setLastUpdated(Date.now());
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update dashboard analytics';
      setError(msg);
      // Suppress toast on initial background load to avoid noise if unauthenticated
      if (force) toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [lastUpdated, summary]);

  // ── Refresh only summary (lightweight alias for quick updates) ─────────────
  const refreshSummary = useCallback(async () => {
    try {
      const res = await dashboardService.getSummary();
      setSummary(res.data || null);
    } catch (err) {
      console.error('Failed to refresh summary:', err);
    }
  }, []);

  // ── Clear data on logout ──────────────────────────────────────────────────
  const clearFinanceData = useCallback(() => {
    setSummary(null);
    setMonthlyTrend([]);
    setCategoryBreakdown([]);
    setRecentTransactions([]);
    setError(null);
    setLastUpdated(null);
  }, []);

  const value = {
    summary,
    monthlyTrend,
    categoryBreakdown,
    recentTransactions,
    isLoading,
    error,
    lastUpdated,
    refreshDashboard,
    refreshSummary,
    clearFinanceData,
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export default FinanceContext;
