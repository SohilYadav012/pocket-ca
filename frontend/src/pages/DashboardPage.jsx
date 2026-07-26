/**
 * pages/DashboardPage.jsx — Premium Dashboard & Financial Analytics
 * Pocket C.A. Frontend
 *
 * Displays a stunning dark glass 3D grid layout with:
 * - Top Summary Cards (Balance, Income, Expense, Transactions)
 * - Monthly Trend Bar Chart (Recharts)
 * - Expense Category Donut Chart (Recharts)
 * - Recent 5 Transactions Widget
 * - Financial Highlights Widget (Highest Income & Expense)
 *
 * Implements real-time refresh, loading skeletons, empty states, and error handling.
 */

import { useEffect } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Receipt,
  RefreshCw, Award, AlertCircle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import SummaryCard from '../components/dashboard/SummaryCard';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import CategoryBreakdownChart from '../components/dashboard/CategoryBreakdownChart';
import RecentTransactionsWidget from '../components/dashboard/RecentTransactionsWidget';
import CategoryBadge from '../components/common/CategoryBadge';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

// ─── Financial Highlights Widget (Highest Income & Expense) ──────────────────
const HighlightsWidget = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4 h-full flex flex-col justify-center">
        <div className="skeleton h-5 w-40 rounded mb-2" />
        <div className="skeleton h-24 w-full rounded-xl" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    );
  }

  const highestExp = summary?.highestExpense;
  const highestInc = summary?.highestIncome;

  return (
    <div className="glass-card p-6 flex flex-col justify-between h-full space-y-4">
      <div className="flex items-center gap-2">
        <Award size={18} style={{ color: 'var(--color-warning)' }} />
        <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Financial Highlights
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 flex-1">
        {/* Highest Expense Card */}
        <div
          className="p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <div className="space-y-1 min-w-0 pr-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
              <ArrowDownRight size={14} /> Highest Expense
            </span>
            <p className="text-base font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {highestExp ? (highestExp.description || 'Expense') : 'None recorded'}
            </p>
            {highestExp && (
              <div className="flex items-center gap-2 pt-0.5">
                <CategoryBadge categoryId={highestExp.category} size="sm" />
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDate(highestExp.transactionDate, 'short')}
                </span>
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-extrabold" style={{ color: 'var(--color-danger)' }}>
              {highestExp ? formatCurrency(highestExp.amount) : '₹0.00'}
            </p>
          </div>
        </div>

        {/* Highest Income Card */}
        <div
          className="p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="space-y-1 min-w-0 pr-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
              <ArrowUpRight size={14} /> Highest Income
            </span>
            <p className="text-base font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {highestInc ? (highestInc.description || 'Income') : 'None recorded'}
            </p>
            {highestInc && (
              <div className="flex items-center gap-2 pt-0.5">
                <CategoryBadge categoryId={highestInc.category} size="sm" />
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDate(highestInc.transactionDate, 'short')}
                </span>
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-extrabold" style={{ color: 'var(--color-success)' }}>
              {highestInc ? formatCurrency(highestInc.amount) : '₹0.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const {
    summary,
    monthlyTrend,
    categoryBreakdown,
    recentTransactions,
    isLoading,
    error,
    refreshDashboard,
  } = useFinance();

  // Fetch dashboard analytics on mount (uses cached data if fresh)
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Financial Overview
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Real-time analytics and insights for your personal finances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshDashboard(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'var(--color-bg-hover)',
              border: '1px solid var(--color-bg-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-primary' : ''} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-fade-in"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--color-danger)',
          }}
        >
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => refreshDashboard(true)} className="ml-auto underline font-semibold text-xs">
            Retry
          </button>
        </div>
      )}

      {/* ── Top Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Balance"
          value={isLoading && !summary ? '---' : formatCurrency(summary?.totalBalance || 0)}
          subtext="Net worth overview"
          icon={Wallet}
          color="var(--color-primary)"
          isNegative={summary?.totalBalance < 0}
        />
        <SummaryCard
          title="Total Income"
          value={isLoading && !summary ? '---' : formatCurrency(summary?.totalIncome || 0)}
          subtext={`+${formatCurrency(summary?.currentMonthIncome || 0)} this month`}
          icon={TrendingUp}
          color="var(--color-success)"
        />
        <SummaryCard
          title="Total Expense"
          value={isLoading && !summary ? '---' : formatCurrency(summary?.totalExpense || 0)}
          subtext={`-${formatCurrency(summary?.currentMonthExpense || 0)} this month`}
          icon={TrendingDown}
          color="var(--color-danger)"
        />
        <SummaryCard
          title="Total Transactions"
          value={isLoading && !summary ? '---' : (summary?.totalTransactions || 0).toLocaleString()}
          subtext="Recorded entries"
          icon={Receipt}
          color="var(--color-warning)"
        />
      </div>

      {/* ── Visualizations (Recharts) ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendChart data={monthlyTrend} isLoading={isLoading && monthlyTrend.length === 0} />
        <CategoryBreakdownChart data={categoryBreakdown} isLoading={isLoading && categoryBreakdown.length === 0} />
      </div>

      {/* ── Bottom Widgets ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactionsWidget
            transactions={recentTransactions}
            isLoading={isLoading && recentTransactions.length === 0}
          />
        </div>
        <div className="lg:col-span-1">
          <HighlightsWidget summary={summary} isLoading={isLoading && !summary} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
