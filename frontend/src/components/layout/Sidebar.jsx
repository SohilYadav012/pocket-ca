/**
 * components/layout/Sidebar.jsx — Premium Glassmorphism Navigation Sidebar
 * Pocket C.A. Frontend
 *
 * Ultra-modern, spacious, and interactive left sidebar inspired by Vercel, Linear, Cursor, and Notion AI.
 * Features:
 * - 280px width with spacious padding and 14px card gap
 * - Rounded dark glassmorphism cards for every navigation item
 * - Hover scale, glowing transitions, icon animations, and sliding indicator
 * - Brighter purple active state with left accent bar and elevation
 * - Categorized navigation sections (MAIN, FINANCE, AI TOOLS, ACCOUNT)
 * - Collapsible on desktop with custom glowing tooltips
 * - Ambient animated background gradients and blur
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Sparkles,
  Bot,
  ScanLine,
  BarChart3,
  UserCircle,
  X,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import ROUTES from '../../constants/routes';

// ─── Navigation Groups ────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
      { label: 'Insights', icon: Sparkles, path: ROUTES.INSIGHTS, badge: 'NEW' },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Transactions', icon: ArrowLeftRight, path: ROUTES.TRANSACTIONS },
      { label: 'Budgets', icon: PiggyBank, path: ROUTES.BUDGETS },
      { label: 'Goals', icon: Target, path: ROUTES.GOALS },
      { label: 'Reports', icon: BarChart3, path: ROUTES.REPORTS },
    ],
  },
  {
    title: 'AI TOOLS',
    items: [
      { label: 'AI Chat', icon: Bot, path: ROUTES.AI_CHAT, badge: 'PRO' },
      { label: 'Receipt Scanner', icon: ScanLine, path: ROUTES.OCR_SCANNER, badge: 'OCR' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Profile', icon: UserCircle, path: ROUTES.PROFILE },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <>
      {/* ── Mobile Backdrop Overlay ────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          style={{ background: 'rgba(5, 7, 18, 0.75)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Container ─────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col select-none
          lg:relative lg:z-auto lg:translate-x-0
          transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          ${isOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[280px]'}
          w-[280px] sm:w-[300px]
          overflow-visible
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(16, 18, 38, 0.96) 0%, rgba(10, 11, 26, 0.98) 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 30px -4px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Ambient Animated Background Blobs */}
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-10 -right-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-24 w-56 h-56 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Desktop Collapse Toggle Button ─────────────────────────────── */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3.5 top-9 z-50 hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border border-white/20 text-slate-300 hover:text-white hover:border-indigo-400 hover:bg-indigo-600/30 shadow-[0_0_15px_rgba(0,0,0,0.6)] transition-all duration-200 hover:scale-110 active:scale-95"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle sidebar width"
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        {/* ── Brand / Logo Section ────────────────────────────────────────── */}
        <div
          className={`relative z-10 flex items-center justify-between pt-7 pb-6 mb-2 border-b transition-all duration-300 ${
            isCollapsed ? 'px-4 lg:justify-center' : 'px-6'
          }`}
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Logo Icon with Glow */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.45)] border border-white/20 transition-transform duration-300 hover:scale-105 hover:rotate-3"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary), #ec4899)',
              }}
            >
              <Wallet size={20} color="#fff" />
            </div>

            {/* Logo Typography (Hidden when collapsed on desktop) */}
            {!isCollapsed && (
              <div className="min-w-0 animate-fade-in">
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-lg gradient-text tracking-tight leading-none truncate">
                    Pocket C.A.
                  </p>
                  <Zap size={13} className="text-amber-400 fill-amber-400 animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
                <p className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-indigo-300/80 truncate">
                  AI Finance Workspace
                </p>
              </div>
            )}
          </div>

          {/* Close button — Mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navigation List ─────────────────────────────────────────────── */}
        <nav
          className={`flex-1 py-3 overflow-y-auto overflow-x-visible space-y-6 relative z-10 transition-all duration-300 ${
            isCollapsed ? 'px-3' : 'px-5'
          }`}
          onMouseLeave={() => setHoveredPath(null)}
        >
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.title} className="space-y-3">
              {/* Section Header */}
              {!isCollapsed ? (
                <div className="px-3.5 pt-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400/75 flex items-center justify-between">
                  <span>{section.title}</span>
                  <div className="h-[1px] flex-1 ml-3 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
              ) : (
                idx > 0 && <div className="border-t border-white/[0.08] my-3 mx-2" />
              )}

              {/* Navigation Cards */}
              <div className="space-y-3">
                {section.items.map(({ label, icon: Icon, path, badge }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === ROUTES.DASHBOARD}
                    onClick={onClose}
                    onMouseEnter={() => setHoveredPath(path)}
                    className={({ isActive }) =>
                      `relative group flex items-center gap-3.5 rounded-2xl transition-all duration-300 ${
                        isCollapsed ? 'justify-center p-3' : 'px-4 sm:px-4.5 py-3.5'
                      } ${
                        isActive
                          ? 'text-white font-bold scale-[1.02] z-10'
                          : 'text-slate-300 hover:text-white font-semibold'
                      }`
                    }
                    style={({ isActive }) => ({
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.28) 0%, rgba(139,92,246,0.22) 50%, rgba(236,72,153,0.12) 100%)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isActive
                        ? '1px solid rgba(139, 92, 246, 0.45)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: isActive
                        ? '0 8px 25px -6px rgba(139, 92, 246, 0.4), 0 0 15px rgba(99, 102, 241, 0.25) inset'
                        : 'none',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {/* ── Sliding Hover Background Indicator ───────────────── */}
                        {!isActive && (
                          <div
                            className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent border border-indigo-500/30 shadow-[0_0_20px_rgba(139,92,246,0.18)] transition-all duration-300 pointer-events-none ${
                              hoveredPath === path ? 'opacity-100 scale-100' : 'opacity-0 scale-98'
                            }`}
                          />
                        )}

                        {/* ── Left Accent Glowing Bar (Active State Only) ───────── */}
                        {isActive && (
                          <div
                            className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-gradient-to-b from-cyan-400 via-indigo-400 to-pink-400 shadow-[0_0_12px_rgba(168,85,247,0.9)] animate-pulse"
                            style={{ animationDuration: '3s' }}
                          />
                        )}

                        {/* ── Icon Container with Hover Animation ──────────────── */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 relative z-10 ${
                            isActive
                              ? 'bg-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/30 scale-105'
                              : 'bg-white/5 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 group-hover:scale-110 group-hover:rotate-3 border border-transparent group-hover:border-indigo-500/30'
                          }`}
                        >
                          <Icon size={21} className="transition-transform duration-300" />
                        </div>

                        {/* ── Label & Badges (Expanded View) ────────────────────── */}
                        {!isCollapsed && (
                          <div className="flex items-center justify-between flex-1 min-w-0 relative z-10">
                            <span className="truncate text-[14.5px] tracking-[0.015em] leading-tight">
                              {label}
                            </span>
                            {badge && (
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm shrink-0 ml-2 transition-transform duration-200 group-hover:scale-105 ${
                                  isActive
                                    ? 'bg-pink-500/25 text-pink-300 border-pink-400/40 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                }`}
                              >
                                {badge}
                              </span>
                            )}
                          </div>
                        )}

                        {/* ── Floating Tooltip (Collapsed View on Desktop) ──────── */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-4 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-bold shadow-[0_8px_25px_rgba(0,0,0,0.7)] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 flex items-center gap-2 backdrop-blur-md hidden lg:flex">
                            <span>{label}</span>
                            {badge && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/30">
                                {badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer / System Status Widget ───────────────────────────────── */}
        <div
          className={`p-4 border-t relative z-10 transition-all duration-300 ${
            isCollapsed ? 'px-3 py-4' : 'px-5 py-4'
          }`}
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          {!isCollapsed ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-white/10 flex items-center justify-between shadow-sm group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                    AI Assistant Active
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Gemini 2.5 • Instant</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 text-indigo-300 border border-white/10 shrink-0 shadow-inner">
                v1.2
              </span>
            </div>
          ) : (
            <div className="flex justify-center py-1 group relative">
              <div
                className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse cursor-pointer"
                title="AI Assistant Active • v1.2"
              />
              <div className="absolute left-full ml-4 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-emerald-500/40 text-white text-xs font-bold shadow-[0_8px_25px_rgba(0,0,0,0.7)] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 hidden lg:flex items-center gap-2 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>AI Assistant Active (v1.2)</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
