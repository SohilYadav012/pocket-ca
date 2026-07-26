/**
 * constants/categories.js — Transaction Category Definitions
 * Pocket C.A. Frontend
 *
 * Defines all valid transaction categories with display name,
 * type (income/expense/both), color, and icon name (Lucide).
 */

export const CATEGORIES = [
  // ─── Income Categories ──────────────────────────────────────────────────────
  { id: 'salary',      label: 'Salary',         type: 'income',  color: '#10b981', icon: 'Briefcase' },
  { id: 'freelance',   label: 'Freelance',       type: 'income',  color: '#6366f1', icon: 'Laptop' },
  { id: 'investment',  label: 'Investment',      type: 'both',    color: '#f59e0b', icon: 'TrendingUp' },

  // ─── Expense Categories ──────────────────────────────────────────────────────
  { id: 'food',        label: 'Food & Dining',   type: 'expense', color: '#ef4444', icon: 'Utensils' },
  { id: 'transport',   label: 'Transport',       type: 'expense', color: '#3b82f6', icon: 'Car' },
  { id: 'rent',        label: 'Rent',            type: 'expense', color: '#8b5cf6', icon: 'Home' },
  { id: 'utilities',   label: 'Utilities',       type: 'expense', color: '#06b6d4', icon: 'Zap' },
  { id: 'healthcare',  label: 'Healthcare',      type: 'expense', color: '#ec4899', icon: 'Heart' },
  { id: 'entertainment', label: 'Entertainment', type: 'expense', color: '#f97316', icon: 'Film' },
  { id: 'education',   label: 'Education',       type: 'expense', color: '#14b8a6', icon: 'BookOpen' },
  { id: 'shopping',    label: 'Shopping',        type: 'expense', color: '#a855f7', icon: 'ShoppingBag' },
  { id: 'emi',         label: 'EMI / Loan',      type: 'expense', color: '#f43f5e', icon: 'CreditCard' },
  { id: 'insurance',   label: 'Insurance',       type: 'expense', color: '#0ea5e9', icon: 'Shield' },
  { id: 'others',      label: 'Others',          type: 'both',    color: '#64748b', icon: 'MoreHorizontal' },
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter(
  (c) => c.type === 'expense' || c.type === 'both'
);

export const INCOME_CATEGORIES = CATEGORIES.filter(
  (c) => c.type === 'income' || c.type === 'both'
);

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Cash' },
  { id: 'card',          label: 'Card' },
  { id: 'upi',           label: 'UPI' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'other',         label: 'Other' },
];
