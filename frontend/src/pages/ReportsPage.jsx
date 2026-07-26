/**
 * pages/ReportsPage.jsx — Financial Reports & Export Interface
 * Pocket C.A. Frontend
 *
 * Stunning 3D dark glass UI for filtering ledger date ranges, previewing financial
 * breakdowns, and downloading professional PDF statements and multi-sheet Excel workbooks.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  FileText,
  FileDown,
  Table,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Hash,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowRight,
  PieChart,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getReportSummary, downloadPdfReport, downloadExcelReport } from '../services/reportService';

const ReportsPage = () => {
  // Date Range State
  const [datePreset, setDatePreset] = useState('all'); // 'all', 'month', '3months', 'year', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data & Loading State
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories', 'monthly', 'recent'

  // Helper: calculate preset date strings (YYYY-MM-DD)
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === '3months') {
      const threeAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
      setStartDate(threeAgo);
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const startYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(startYear);
      setEndDate(todayStr);
    }
  };

  // Fetch Report Summary
  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await getReportSummary(params);
      setSummaryData(data);
    } catch (err) {
      console.error('[Fetch Report Summary Error]', err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to load financial report summary.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    const toastId = toast.loading('Generating professional PDF report statement...');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      await downloadPdfReport(params);
      toast.success('PDF financial report downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('[Export PDF Error]', err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to generate PDF report. Please try again.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Excel Download
  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    const toastId = toast.loading('Generating multi-sheet Excel workbook...');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      await downloadExcelReport(params);
      toast.success('Excel workbook downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('[Export Excel Error]', err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to generate Excel workbook. Please try again.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be later than end date.');
      return;
    }
    fetchSummary();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            Financial Reports & Exports <Sparkles size={22} style={{ color: 'var(--color-primary)' }} />
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Analyze financial trajectories, inspect category breakdowns, and generate auditable PDF & Excel statements
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm" style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--color-primary)' }}>
          <FileText size={15} />
          Professional Statement Generator
        </div>
      </div>

      {/* ── 1. Date Range Selector Console ──────────────────────────────────── */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            <Filter size={15} className="text-indigo-400" />
            <span>Filter Report Period:</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 text-xs font-semibold">
            {[
              { id: 'all', label: '🌐 All Time' },
              { id: 'month', label: '📅 This Month' },
              { id: '3months', label: '📊 Last 3 Months' },
              { id: 'year', label: '🗓️ This Year' },
              { id: 'custom', label: '⚙️ Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  datePreset === p.id
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Inputs (shown if custom or dates are populated) */}
        {(datePreset === 'custom' || startDate || endDate) && (
          <form onSubmit={handleCustomDateSubmit} className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all"
            >
              Apply Filter
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="text-xs text-slate-500 hover:text-slate-300 underline ml-2"
              >
                Reset Dates
              </button>
            )}
          </form>
        )}
      </div>

      {/* ── 2. Export Action Console (High Visibility) ───────────────────────── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <CheckCircle2 size={14} /> Ready for Instant Download
          </div>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Export Professional Ledger Statements
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Download auditable reports matching your currently selected date range. PDF reports include executive summaries and category shares; Excel workbooks provide 4 structured analytical sheets.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isLoading || isExportingPdf}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 8px 25px -5px rgba(99, 102, 241, 0.4)',
            }}
          >
            {isExportingPdf ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown size={17} />
                <span>Download PDF Report</span>
              </>
            )}
          </button>

          {/* Excel Download Button */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isLoading || isExportingExcel}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #10B981, #0D9488)',
              boxShadow: '0 8px 25px -5px rgba(16, 185, 129, 0.4)',
            }}
          >
            {isExportingExcel ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Generating Excel...</span>
              </>
            ) : (
              <>
                <Table size={17} />
                <span>Download Excel Workbook</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 3. Quick Financial Summary Cards ─────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-28 rounded-3xl bg-slate-800/40" />
          ))}
        </div>
      ) : summaryData?.summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Income */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Total Income</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              ₹{summaryData.summary.totalIncome.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Period Inflow</p>
          </div>

          {/* Total Expense */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-rose-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Total Expense</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <TrendingDown size={18} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-400">
              ₹{summaryData.summary.totalExpense.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Period Outflow</p>
          </div>

          {/* Net Balance / Savings */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Net Cash Flow</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Wallet size={18} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-extrabold ${summaryData.summary.currentBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              ₹{summaryData.summary.currentBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Income minus Expense</p>
          </div>

          {/* Total Transactions */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Ledger Records</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Hash size={18} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-purple-400">
              {summaryData.summary.totalTransactions}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Transactions in Range</p>
          </div>
        </div>
      ) : null}

      {/* ── 4. Interactive Report Preview Tabs ───────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--color-bg-border)' }}>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <BarChart3 size={18} className="text-indigo-400" /> Statement Data Preview
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Inspect aggregated metrics and tables before generating your export file
            </p>
          </div>

          {/* Tab Selection Pill */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 text-xs font-semibold">
            {[
              { id: 'categories', label: '📊 Category Breakdown' },
              { id: 'monthly', label: '📅 Monthly Trend' },
              { id: 'recent', label: '🧾 Recent Transactions' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Render */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={24} className="animate-spin text-indigo-500" />
            <p className="text-xs font-semibold">Aggregating report data...</p>
          </div>
        ) : !summaryData ? (
          <div className="py-12 text-center text-slate-500 text-xs">No data available for this filter.</div>
        ) : activeTab === 'categories' ? (
          /* Tab 1: Top Expense Categories */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
              <span>Category Name</span>
              <span>Spent (₹) & Share (%)</span>
            </div>

            {summaryData.topExpenseCategories?.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-white/5">
                No expense transactions found in the selected period.
              </div>
            ) : (
              summaryData.topExpenseCategories.map((cat, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      {cat.category.toUpperCase()}
                      <span className="text-xs font-normal text-slate-400">({cat.count} txns)</span>
                    </span>
                    <span className="font-extrabold text-rose-400">
                      ₹{cat.totalAmount.toLocaleString()} ({cat.percentage}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        background: 'linear-gradient(90deg, #6366F1, #F43F5E)',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'monthly' ? (
          /* Tab 2: Monthly Trend Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Month / Period</th>
                  <th className="py-3 px-4 text-right">Income (₹)</th>
                  <th className="py-3 px-4 text-right">Expense (₹)</th>
                  <th className="py-3 px-4 text-right">Net Flow (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {summaryData.monthlyTrend?.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-slate-500">
                      No monthly activity recorded in this range.
                    </td>
                  </tr>
                ) : (
                  summaryData.monthlyTrend.map((m, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <CalendarDays size={15} className="text-indigo-400" /> {m.month}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        ₹{m.income.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-400">
                        ₹{m.expense.toLocaleString()}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-extrabold ${m.netFlow >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        ₹{m.netFlow.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tab 3: Recent Transactions Preview */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description / Note</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {summaryData.recentTransactions?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-xs text-slate-500">
                      No transactions logged in this period.
                    </td>
                  </tr>
                ) : (
                  summaryData.recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {new Date(tx.transactionDate).toISOString().split('T')[0]}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {tx.description || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-indigo-300 uppercase border border-white/5">
                          {tx.category || 'others'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold ${tx.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-right font-extrabold ${tx.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'Income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
