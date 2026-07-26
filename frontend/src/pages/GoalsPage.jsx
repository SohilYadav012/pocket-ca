/**
 * pages/GoalsPage.jsx — Savings Goals & Target Tracking
 * Pocket C.A. Frontend
 *
 * Allows authenticated users to create savings targets, track progress with
 * circular progress indicators, make quick contributions, and celebrate
 * goal completions with animated celebratory popups.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Target,
  Plus,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  X,
  Sparkles,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import goalService from '../services/goalService';

/**
 * Circular Progress Indicator Component
 * Renders an SVG circle with animated gradient stroke.
 */
const CircularProgress = ({ percentage, size = 100, strokeWidth = 8, isCompleted = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, percentage) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isCompleted ? '#10B981' : 'url(#goalGradient)'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-lg font-black ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
          {percentage}%
        </span>
        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-tighter">
          {isCompleted ? 'Done' : 'Saved'}
        </span>
      </div>
    </div>
  );
};

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Completed'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contribution Modal State
  const [contributeModal, setContributeModal] = useState(null); // holds goal object
  const [addAmount, setAddAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);

  // Celebration Modal State
  const [celebrationGoal, setCelebrationGoal] = useState(null);

  // ─── Fetch Goals ──────────────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = statusFilter === 'All' ? {} : { status: statusFilter };
      const res = await goalService.getGoals(params);
      setGoals(res.data || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setError(err.response?.data?.message || 'Failed to load savings goals.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // ─── Toast Helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Modal Handlers ───────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingGoal(null);
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6); // default 6 months out
    const dateStr = futureDate.toISOString().split('T')[0];

    setFormData({
      goalName: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: dateStr,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    const dateStr = goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '';
    setFormData({
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: dateStr,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goalName.trim() || Number(formData.targetAmount) <= 0) {
      showToast('Please provide a valid goal name and target amount.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        goalName: formData.goalName.trim(),
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount) || 0,
        targetDate: formData.targetDate,
      };

      if (editingGoal) {
        const updated = await goalService.updateGoal(editingGoal._id, payload);
        showToast('Savings goal updated successfully! ✨');
        if (updated.data?.status === 'Completed' && editingGoal.status !== 'Completed') {
          setCelebrationGoal(updated.data);
        }
      } else {
        const created = await goalService.createGoal(payload);
        showToast('Savings goal created successfully! 🎯');
        if (created.data?.status === 'Completed') {
          setCelebrationGoal(created.data);
        }
      }
      handleModalClose();
      fetchGoals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save goal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete goal "${name}"?`)) return;
    try {
      await goalService.deleteGoal(id);
      showToast(`Goal "${name}" removed.`);
      fetchGoals();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete goal.', 'error');
    }
  };

  // ─── Quick Contribution Handler ───────────────────────────────────────────
  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) <= 0) {
      showToast('Please enter a valid contribution amount.', 'error');
      return;
    }

    setIsContributing(true);
    try {
      const newTotal = Number(contributeModal.currentAmount) + Number(addAmount);
      const res = await goalService.updateGoal(contributeModal._id, { currentAmount: newTotal });
      showToast(`Added ₹${Number(addAmount).toLocaleString()} to ${contributeModal.goalName}! 💰`);
      
      setContributeModal(null);
      setAddAmount('');
      fetchGoals();

      // If this contribution completed the goal, trigger celebration!
      if (res.data?.status === 'Completed' && contributeModal.status !== 'Completed') {
        setCelebrationGoal(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add contribution.', 'error');
    } finally {
      setIsContributing(false);
    }
  };

  // ─── Metrics ──────────────────────────────────────────────────────────────
  const activeCount = goals.filter((g) => g.status === 'Active').length;
  const completedCount = goals.filter((g) => g.status === 'Completed').length;
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

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

      {/* ── Celebration Modal (Goal Completed!) ───────────────────────────── */}
      {celebrationGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md p-8 rounded-3xl relative overflow-hidden text-center shadow-2xl border border-amber-500/40"
            style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)',
              boxShadow: '0 0 50px rgba(245,158,11,0.3)',
            }}
          >
            {/* Confetti / Trophy Graphic */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-2xl animate-bounce">
              <Trophy size={48} className="text-slate-950 drop-shadow" />
            </div>
            
            <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
              🎉 Milestone Achieved!
            </span>

            <h2 className="text-2xl font-black text-white mt-4">
              {celebrationGoal.goalName} Completed!
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Congratulations! You have successfully accumulated <strong className="text-emerald-400">₹{celebrationGoal.currentAmount.toLocaleString()}</strong> and reached your savings target!
            </p>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
              <button
                onClick={() => setCelebrationGoal(null)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Awesome! Continue Building Wealth 🚀
              </button>
            </div>

            {/* Glowing background rays */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-yellow-500/20 blur-3xl pointer-events-none" />
          </div>
        </div>
      )}

      {/* ── Header & New Goal Button ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5" style={{ color: 'var(--color-text-primary)' }}>
            <Target className="text-emerald-400" size={28} />
            Savings Goals & Milestones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Set wealth targets, visualize progress with circular indicators, and celebrate achievements
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter Pills */}
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold">
            {['All', 'Active', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status} {status === 'All' ? `(${goals.length})` : status === 'Active' ? `(${activeCount})` : `(${completedCount})`}
              </button>
            ))}
          </div>

          {/* New Goal Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            }}
          >
            <Plus size={16} />
            New Goal
          </button>
        </div>
      </div>

      {/* ── Savings Summary Banner (3D Glass Console) ─────────────────────── */}
      <div
        className="p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(6,78,59,0.6) 0%, rgba(15,23,42,0.85) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              💎 Wealth Building Overview
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Total Saved: ₹{totalSaved.toLocaleString()}
            </h2>
            <p className="text-sm max-w-xl text-slate-300">
              You have accumulated <strong className="text-white">{overallProgress}%</strong> of your aggregate savings target of <strong className="text-white">₹{totalTarget.toLocaleString()}</strong> across all financial milestones.
            </p>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[130px]">
              <p className="text-xs text-slate-400 font-medium">Active Goals</p>
              <p className="text-xl font-bold mt-0.5 text-indigo-300">{activeCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[130px]">
              <p className="text-xs text-slate-400 font-medium">Milestones Reached</p>
              <p className="text-xl font-bold mt-0.5 text-emerald-400">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div
          className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: '#10B981' }}
        />
      </div>

      {/* ── Error / Loading States ────────────────────────────────────────── */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={fetchGoals} className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 rounded-full animate-spin border-emerald-500/20 border-t-emerald-500" />
          <p className="text-sm text-slate-400">Loading your savings goals and progress indicators...</p>
        </div>
      ) : goals.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-12 flex flex-col items-center text-center gap-5 border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Target size={32} className="text-emerald-400" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-white">No Savings Goals Found</h3>
            <p className="text-sm text-slate-400 mt-1">
              Whether you're saving for a new laptop, dream vacation, or emergency fund, setting a clear milestone accelerates wealth accumulation.
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
            Create First Milestone
          </button>
        </div>
      ) : (
        /* ── Savings Goals Grid ───────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const isDone = goal.status === 'Completed';

            return (
              <div
                key={goal._id}
                className={`glass-card p-6 flex flex-col justify-between gap-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  isDone ? 'border-emerald-500/30 bg-emerald-950/10' : 'hover:border-indigo-500/30'
                }`}
                style={{
                  boxShadow: isDone ? '0 10px 30px rgba(16,185,129,0.1)' : '0 10px 30px rgba(0,0,0,0.2)',
                }}
              >
                {/* Top: Header + Actions */}
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {isDone ? '🏆 Milestone Reached' : '🟢 In Progress'}
                    </span>
                    <h3 className="font-bold text-lg text-white leading-snug">{goal.goalName}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id, goal.goalName)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Middle: Circular Progress Indicator & Metrics */}
                <div className="flex items-center justify-around py-2">
                  <CircularProgress percentage={goal.percentageCompleted} size={110} isCompleted={isDone} />

                  <div className="space-y-2 text-right">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Accumulated</p>
                      <p className={`text-xl font-extrabold ${isDone ? 'text-emerald-400' : 'text-white'}`}>
                        ₹{goal.currentAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Target Cap</p>
                      <p className="text-sm font-semibold text-slate-300">
                        ₹{goal.targetAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs text-slate-400">
                      <Clock size={12} className="text-indigo-400" />
                      <span>{isDone ? 'Completed' : `${goal.daysRemaining} days left`}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Quick Contribution Button or Completed Badge */}
                <div className="pt-4 border-t border-white/5">
                  {isDone ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 size={16} />
                      Milestone Successfully Reached!
                    </div>
                  ) : (
                    <button
                      onClick={() => setContributeModal(goal)}
                      className="w-full py-2.5 rounded-2xl font-bold text-xs bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 flex items-center justify-center gap-2 transition-all hover:border-indigo-500/30 hover:scale-[1.01]"
                    >
                      <ArrowUpRight size={15} />
                      Add Contribution
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Contribution Modal ──────────────────────────────────────── */}
      {contributeModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setContributeModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl relative overflow-hidden shadow-2xl border animate-fade-in flex flex-col my-auto"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-bg-border)', maxHeight: 'calc(100vh - 2.5rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Add Contribution</h3>
                  <p className="text-xs text-slate-400">{contributeModal.goalName}</p>
                </div>
              </div>
              <button onClick={() => setContributeModal(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleContributeSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between text-sm">
                  <span className="text-slate-400">Current Progress:</span>
                  <span className="font-bold text-white">
                    ₹{contributeModal.currentAmount.toLocaleString()} / ₹{contributeModal.targetAmount.toLocaleString()} ({contributeModal.percentageCompleted}%)
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Contribution Amount (₹)
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      min="1"
                      step="any"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm font-medium text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-6 pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setContributeModal(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isContributing}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
                >
                  {isContributing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Add / Edit Goal Modal ─────────────────────────────────────────── */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={handleModalClose}
        >
          <div
            className="w-full max-w-md rounded-3xl relative overflow-hidden shadow-2xl border animate-fade-in flex flex-col my-auto"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-bg-border)', maxHeight: 'calc(100vh - 2.5rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {editingGoal ? 'Edit Savings Goal' : 'Create New Milestone'}
                  </h3>
                  <p className="text-xs text-slate-400">Define wealth target & deadline</p>
                </div>
              </div>
              <button onClick={handleModalClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Goal Name</label>
                  <input
                    type="text"
                    name="goalName"
                    value={formData.goalName}
                    onChange={handleFormChange}
                    placeholder="e.g. MacBook Pro M3, Emergency Fund"
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Target Amount (₹)</label>
                    <input
                      type="number"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleFormChange}
                      placeholder="e.g. 150000"
                      min="1"
                      step="any"
                      required
                      className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Already Saved (₹)</label>
                    <input
                      type="number"
                      name="currentAmount"
                      value={formData.currentAmount}
                      onChange={handleFormChange}
                      placeholder="e.g. 20000"
                      min="0"
                      step="any"
                      className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Target Deadline Date</label>
                  <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

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
                  className="flex-1 py-3 rounded-xl text-sm font-semibold shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save Milestone'}
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

export default GoalsPage;
