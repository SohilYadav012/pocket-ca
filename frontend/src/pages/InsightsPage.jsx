/**
 * pages/InsightsPage.jsx — AI Financial Insights & Health Score
 * Pocket C.A. Frontend
 *
 * Displays a 0-100 Monthly Financial Health Score gauge, real-time Gemini AI
 * recommendations, overspending warnings, and savings opportunity breakdowns.
 * Built with premium 3D dark glass aesthetics and smooth micro-animations.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  PiggyBank,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Award,
  Zap,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import insightService from '../services/insightService';
import { Link } from 'react-router-dom';
import ROUTES from '../constants/routes';

/**
 * Health Score Meter Gauge (Semi-circular 3D SVG Gauge)
 */
const HealthScoreMeter = ({ score = 50, grade = 'C' }) => {
  // Map grade to vibrant gradient color
  const getGradeColor = (g) => {
    switch (g) {
      case 'A+':
      case 'A':
        return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/20', shadow: 'rgba(16,185,129,0.3)' };
      case 'B':
        return { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/20', shadow: 'rgba(6,182,212,0.3)' };
      case 'C':
        return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/20', shadow: 'rgba(245,158,11,0.3)' };
      default:
        return { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/20', shadow: 'rgba(244,63,94,0.3)' };
    }
  };

  const color = getGradeColor(grade);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
        {/* Semi-circular track */}
        <div className="absolute top-0 w-48 h-48 rounded-full border-[16px] border-slate-800/80 box-border" />
        
        {/* Animated fill indicator */}
        <div
          className="absolute top-0 w-48 h-48 rounded-full border-[16px] border-transparent transition-all duration-1000 ease-out"
          style={{
            borderTopColor: grade.startsWith('A') ? '#10B981' : grade === 'B' ? '#06B6D4' : grade === 'C' ? '#F59E0B' : '#F43F5E',
            borderRightColor: grade.startsWith('A') ? '#10B981' : grade === 'B' ? '#06B6D4' : grade === 'C' ? '#F59E0B' : '#F43F5E',
            transform: `rotate(${Math.min(180, Math.max(0, (score / 100) * 180 - 135))}deg)`,
          }}
        />

        {/* Center label */}
        <div className="z-10 flex flex-col items-center mb-1">
          <span className="text-4xl font-black tracking-tight text-white drop-shadow-md">
            {score}
            <span className="text-base font-medium text-slate-400">/100</span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            Health Score
          </span>
        </div>
      </div>

      {/* Grade Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-lg ${color.bg} ${color.text} ${color.border}`}
          style={{ boxShadow: `0 4px 15px ${color.shadow}` }}
        >
          Grade {grade} Rating
        </span>
      </div>
    </div>
  );
};

const InsightsPage = () => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Fetch Insights ───────────────────────────────────────────────────────
  const fetchInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await insightService.getInsights();
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError(err.response?.data?.message || 'Failed to generate financial insights.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="w-12 h-12 border-4 rounded-full animate-spin border-indigo-500/20 border-t-indigo-500" />
        <p className="text-sm font-medium text-slate-400">
          Analyzing ledger patterns & generating AI financial recommendations...
        </p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-300 flex flex-col items-center text-center gap-4 max-w-lg mx-auto mt-12 animate-fade-in">
        <AlertTriangle size={36} className="text-red-400" />
        <div>
          <h3 className="font-bold text-lg text-white">Insight Generation Failed</h3>
          <p className="text-sm mt-1 text-slate-300">{error || 'An unexpected error occurred.'}</p>
        </div>
        <button
          onClick={() => fetchInsights(false)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 font-semibold text-sm transition-all"
        >
          <RefreshCw size={16} />
          Retry Analysis
        </button>
      </div>
    );
  }

  const {
    healthScore,
    grade,
    budgetUtilization,
    categoriesExceedingBudget = [],
    savingsProgress,
    aiSuggestions = [],
  } = insights;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Header & Refresh Button ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5" style={{ color: 'var(--color-text-primary)' }}>
            <Sparkles className="text-indigo-400 animate-pulse" size={28} />
            AI Financial Insights & Health Score
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Algorithmic wealth scoring, overspending warnings, and personalized Gemini recommendations
          </p>
        </div>

        <button
          onClick={() => fetchInsights(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-200 self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'} />
          {isRefreshing ? 'Recalculating...' : 'Refresh AI Insights'}
        </button>
      </div>

      {/* ── Top Row: Health Score Console & AI Recommendations Feed ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial Health Score Meter (5 cols) */}
        <div
          className="lg:col-span-5 p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award size={15} className="text-indigo-400" />
                Monthly Rating
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                0-100 Algorithm
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Financial Health Score</h2>
          </div>

          <HealthScoreMeter score={healthScore} grade={grade} />

          {/* Breakdown Pills */}
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[11px] text-slate-400 font-medium">Budget Adherence</p>
              <p className={`text-sm font-bold mt-0.5 ${categoriesExceedingBudget.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {categoriesExceedingBudget.length > 0 ? `${categoriesExceedingBudget.length} Overbudget` : '100% On Track'}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[11px] text-slate-400 font-medium">Goal Progress</p>
              <p className="text-sm font-bold mt-0.5 text-indigo-300">
                {savingsProgress?.overallSavingsPercentage || 0}% Saved
              </p>
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -left-16 -top-16 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        </div>

        {/* Right: AI Financial Recommendations Card (7 cols) */}
        <div
          className="lg:col-span-7 p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.85) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">AI Chartered Accountant Advice</h3>
                  <p className="text-xs text-slate-400">Tailored action plan generated for your current cash flow</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini Intelligence
              </span>
            </div>

            {/* Suggestions Feed */}
            <div className="space-y-3 mt-4">
              {aiSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-start gap-3 transition-all duration-200 hover:border-indigo-500/30 hover:bg-slate-900"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 text-xs font-bold border border-indigo-500/20">
                    {idx + 1}
                  </div>
                  <div
                    className="text-sm text-slate-200 leading-relaxed font-normal"
                    dangerouslySetInnerHTML={{ __html: sug.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>💡 Pro Tip: Maintaining a health score above 80 qualifies you for prime financial stability.</span>
            <Link to={ROUTES.AI_CHAT} className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
              Ask C.A. More Questions <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Overspending Alerts Banner ────────────────────────── */}
      {categoriesExceedingBudget.length > 0 ? (
        <div
          className="p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(127,29,29,0.35) 0%, rgba(30,41,59,0.8) 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
            boxShadow: '0 15px 35px rgba(239,68,68,0.1)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5 w-max">
                <AlertTriangle size={14} className="animate-bounce" />
                Immediate Action Required
              </span>
              <h3 className="text-xl font-bold text-white mt-2">
                {categoriesExceedingBudget.length} Category Spending Limit{categoriesExceedingBudget.length > 1 ? 's' : ''} Exceeded
              </h3>
              <p className="text-sm text-slate-300 max-w-2xl">
                Your expenditures in these categories have surpassed your allocated monthly cap. Consider reducing discretionary outflows to stabilize your monthly cash flow.
              </p>
            </div>

            <Link
              to={ROUTES.BUDGETS}
              className="px-5 py-3 rounded-2xl text-sm font-bold bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 flex items-center gap-2 transition-all self-start md:self-auto shrink-0"
            >
              Manage Budgets <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* Overbudget Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-4 border-t border-red-500/20">
            {categoriesExceedingBudget.map((cat, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-red-950/40 border border-red-500/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white capitalize">{cat.category}</p>
                  <p className="text-xs text-slate-400">Limit: ₹{cat.limit.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-red-400">₹{cat.spent.toLocaleString()}</p>
                  <p className="text-xs font-semibold text-red-300">Over by ₹{cat.overspend.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Green Adherence Banner */
        <div
          className="p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(6,78,59,0.3) 0%, rgba(30,41,59,0.7) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
                <ShieldCheck size={28} />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🟢 100% Budget Adherence
                </span>
                <h3 className="text-lg font-bold text-white mt-1">All Spending Categories Are Within Limit</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  You are utilizing {budgetUtilization?.overallBudgetPercentage || 0}% of your ₹{budgetUtilization?.totalBudgeted?.toLocaleString() || 0} budget cap. Keep up the disciplined spending!
                </p>
              </div>
            </div>
            <Link
              to={ROUTES.BUDGETS}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/20 transition-all self-start md:self-auto shrink-0"
            >
              View Budget Cap <ChevronRight size={14} className="inline" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Bottom Row: Savings Opportunities & Progress Grid ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Savings Goals Summary Card */}
        <div className="glass-card p-6 md:p-8 flex flex-col justify-between gap-6 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <Target size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Savings Progress</h3>
                <p className="text-xs text-slate-400">Milestone accumulation tracking</p>
              </div>
            </div>
            <Link to={ROUTES.GOALS} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              View All Goals <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-slate-300">Total Capital Saved</span>
              <span className="text-2xl font-black text-emerald-400">
                ₹{savingsProgress?.totalSavedAmount?.toLocaleString() || 0}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${Math.min(100, savingsProgress?.overallSavingsPercentage || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Target: ₹{savingsProgress?.totalTargetAmount?.toLocaleString() || 0}</span>
              <span>{savingsProgress?.overallSavingsPercentage || 0}% Completed</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-300">Active Goals in Pipeline</span>
            <span className="font-bold text-white px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300">
              {savingsProgress?.activeGoalsCount || 0} Milestones
            </span>
          </div>
        </div>

        {/* Budget Utilization Summary Card */}
        <div className="glass-card p-6 md:p-8 flex flex-col justify-between gap-6 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                <PiggyBank size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Budget Consumption</h3>
                <p className="text-xs text-slate-400">Monthly expense boundary check</p>
              </div>
            </div>
            <Link to={ROUTES.BUDGETS} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Manage Caps <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-slate-300">Total Budgeted Outflow</span>
              <span className="text-2xl font-black text-indigo-300">
                ₹{budgetUtilization?.totalSpentOnBudgets?.toLocaleString() || 0}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (budgetUtilization?.overallBudgetPercentage || 0) > 100
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${Math.min(100, budgetUtilization?.overallBudgetPercentage || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Limit: ₹{budgetUtilization?.totalBudgeted?.toLocaleString() || 0}</span>
              <span>{budgetUtilization?.overallBudgetPercentage || 0}% Utilized</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-300">Defined Category Budgets</span>
            <span className="font-bold text-white px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300">
              {budgetUtilization?.totalBudgetsCount || 0} Categories
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
