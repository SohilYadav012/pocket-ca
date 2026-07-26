/**
 * pages/BudgetsPage.jsx — Budgets & Category Spending Limits
 * Pocket C.A. Frontend
 *
 * Allows authenticated users to set, edit, and monitor monthly spending limits
 * per category with real-time utilization bars and overspending alerts.
 * Features 3D dark glass aesthetics and responsive grid layouts.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  X,
  PieChart,
} from 'lucide-react';
import budgetService from '../services/budgetService';

const EXPENSE_CATEGORIES = [
  'rent',
  'food',
  'shopping',
  'transport',
  'utilities',
  'entertainment',
  'health',
  'education',
  'groceries',
  'travel',
  'other',
];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const BudgetsPage = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: 'rent',
    monthlyLimit: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch Budgets ────────────────────────────────────────────────────────
  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await budgetService.getBudgets({ month: selectedMonth, year: selectedYear });
      setBudgets(res.data || []);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setError(err.response?.data?.message || 'Failed to load budgets.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // ─── Toast Helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Modal Handlers ───────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingBudget(null);
    setFormData({ category: 'rent', monthlyLimit: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monthlyLimit || Number(formData.monthlyLimit) <= 0) {
      showToast('Please enter a valid positive budget limit.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget._id, {
          monthlyLimit: Number(formData.monthlyLimit),
          category: formData.category,
        });
        showToast('Budget updated successfully! ✨');
      } else {
        await budgetService.createBudget({
          category: formData.category,
          monthlyLimit: Number(formData.monthlyLimit),
          month: selectedMonth,
          year: selectedYear,
        });
        showToast('Monthly budget created successfully! 🎯');
      }
      handleModalClose();
      fetchBudgets();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save budget.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, cat) => {
    if (!window.confirm(`Are you sure you want to delete your budget for "${cat.toUpperCase()}"?`)) {
      return;
    }
    try {
      await budgetService.deleteBudget(id);
      showToast(`Budget for ${cat.toUpperCase()} removed.`);
      fetchBudgets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete budget.', 'error');
    }
  };

  // ─── Calculate Overall Metrics ────────────────────────────────────────────
  const totalBudgeted = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const overbudgetCount = budgets.filter((b) => b.spentAmount > b.monthlyLimit).length;

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-slide-in ${
            toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* ── Header & Month/Year Selector ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5" style={{ color: 'var(--color-text-primary)' }}>
            <PiggyBank className="text-amber-400" size={28} />
            Monthly Category Budgets
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Define spending boundaries, track live utilization, and protect your wealth
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-input text-sm">
            <Calendar size={15} className="text-indigo-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent outline-none font-medium cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-slate-200">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center px-3 py-2 rounded-xl glass-input text-sm">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent outline-none font-medium cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-slate-200">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* New Budget Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
            }}
          >
            <Plus size={16} />
            Set New Budget
          </button>
        </div>
      </div>

      {/* ── Overall Utilization Banner (3D Glass Console) ─────────────────── */}
      <div
        className="p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.85) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear} Overview
            </span>
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Overall Budget Utilization
            </h2>
            <p className="text-sm max-w-xl" style={{ color: 'var(--color-text-secondary)' }}>
              You have budgeted a total of <strong className="text-white">₹{totalBudgeted.toLocaleString()}</strong> across {budgets.length} spending categories this month.
            </p>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[130px]">
              <p className="text-xs text-slate-400 font-medium">Total Spent</p>
              <p className={`text-xl font-bold mt-0.5 ${totalSpent > totalBudgeted && totalBudgeted > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                ₹{totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[130px]">
              <p className="text-xs text-slate-400 font-medium">Remaining</p>
              <p className="text-xl font-bold mt-0.5 text-indigo-300">
                ₹{Math.max(0, totalBudgeted - totalSpent).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[110px]">
              <p className="text-xs text-slate-400 font-medium">Overbudget</p>
              <p className={`text-xl font-bold mt-0.5 ${overbudgetCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                {overbudgetCount} {overbudgetCount === 1 ? 'Category' : 'Categories'}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span style={{ color: 'var(--color-text-secondary)' }}>Total Consumption</span>
            <span className={overallPercentage > 100 ? 'text-red-400' : overallPercentage > 80 ? 'text-amber-400' : 'text-indigo-300'}>
              {overallPercentage}% Utilized
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallPercentage > 100
                  ? 'bg-gradient-to-r from-amber-500 to-red-500 animate-pulse'
                  : overallPercentage > 80
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>

        {/* Decorative background glow */}
        <div
          className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: 'var(--color-primary)' }}
        />
      </div>

      {/* ── Error / Loading States ────────────────────────────────────────── */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={fetchBudgets} className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 rounded-full animate-spin border-indigo-500/20 border-t-indigo-500" />
          <p className="text-sm text-slate-400">Calculating live category expenditures...</p>
        </div>
      ) : budgets.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-12 flex flex-col items-center text-center gap-5 border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <PieChart size={32} className="text-indigo-400" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-white">No Budgets Defined for This Month</h3>
            <p className="text-sm text-slate-400 mt-1">
              Start by setting a monthly spending cap on frequent expense categories like Rent, Food, or Shopping to enable intelligent AI health alerts.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              color: '#fff',
            }}
          >
            <Plus size={16} />
            Create First Budget
          </button>
        </div>
      ) : (
        /* ── Category Budgets Grid ────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const isOver = budget.spentAmount > budget.monthlyLimit;
            const isWarning = !isOver && budget.percentageUsed >= 80;

            return (
              <div
                key={budget._id}
                className={`glass-card p-6 flex flex-col justify-between gap-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  isOver
                    ? 'border-red-500/30 bg-red-950/10'
                    : isWarning
                    ? 'border-amber-500/30 bg-amber-950/10'
                    : 'hover:border-indigo-500/30'
                }`}
                style={{
                  boxShadow: isOver
                    ? '0 10px 30px rgba(239,68,68,0.1)'
                    : isWarning
                    ? '0 10px 30px rgba(245,158,11,0.08)'
                    : '0 10px 30px rgba(0,0,0,0.2)',
                }}
              >
                {/* Top row: Category Badge + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm uppercase tracking-wider ${
                        isOver
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {budget.category.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base capitalize text-white tracking-wide">
                        {budget.category}
                      </h3>
                      <p className="text-xs text-slate-400">Monthly Limit</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit Budget"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget._id, budget.category)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Middle: Spending Breakdown */}
                <div className="space-y-1.5 py-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400 font-medium">Spent so far</span>
                    <span className={`text-2xl font-extrabold ${isOver ? 'text-red-400 font-black' : 'text-white'}`}>
                      ₹{budget.spentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Budget Cap: ₹{budget.monthlyLimit.toLocaleString()}</span>
                    <span className={isOver ? 'text-red-400 font-semibold' : 'text-emerald-400 font-medium'}>
                      {isOver ? `Over by ₹${(budget.spentAmount - budget.monthlyLimit).toLocaleString()}` : `₹${budget.remainingAmount.toLocaleString()} left`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className={isOver ? 'text-red-400 flex items-center gap-1' : isWarning ? 'text-amber-400' : 'text-indigo-300'}>
                      {isOver && <AlertTriangle size={12} className="inline animate-bounce" />}
                      {isOver ? 'Exceeded Budget Limit' : isWarning ? 'Approaching Limit' : 'On Track'}
                    </span>
                    <span className={isOver ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-300'}>
                      {budget.percentageUsed}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-gradient-to-r from-red-500 to-rose-600'
                          : isWarning
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, budget.percentageUsed)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Budget Modal ───────────────────────────────────────── */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={handleModalClose}
        >
          <div
            className="w-full max-w-md rounded-3xl relative overflow-hidden shadow-2xl border animate-fade-in flex flex-col my-auto"
            style={{
              background: 'var(--color-bg-card)',
              borderColor: 'var(--color-bg-border)',
              maxHeight: 'calc(100vh - 2.5rem)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0">
                  <PiggyBank size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {editingBudget ? 'Edit Category Budget' : 'Set New Category Budget'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                  </p>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Category Select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Expense Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    disabled={!!editingBudget} // Prevent category change during edit to preserve unique index simplicity
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-white outline-none focus:border-indigo-500 transition-colors capitalize disabled:opacity-50"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-slate-200 capitalize">
                        {cat}
                      </option>
                    ))}
                  </select>
                  {editingBudget && (
                    <p className="text-[11px] text-slate-400">Category cannot be modified once created. Create a new budget if needed.</p>
                  )}
                </div>

                {/* Monthly Limit Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Monthly Budget Cap (₹)
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      name="monthlyLimit"
                      value={formData.monthlyLimit}
                      onChange={handleFormChange}
                      placeholder="e.g. 25000"
                      min="1"
                      step="any"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm font-medium text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    We will automatically alert you when your expenses in this category reach 80% and 100% of this limit.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 p-6 pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    color: '#fff',
                  }}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      {editingBudget ? 'Update Limit' : 'Save Budget'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BudgetsPage;
