/**
 * services/dashboard.service.js — Dashboard & Financial Analytics Service (MOCK)
 * Pocket C.A. Backend
 *
 * Implements static mock data for dashboard metrics.
 */

// ─── 1. Get Financial Summary ─────────────────────────────────────────────────
const getSummary = async (userId) => {
  return {
    totalBalance: 45000,
    totalIncome: 120000,
    totalExpense: 75000,
    totalTransactions: 154,
    currentMonthIncome: 35000,
    currentMonthExpense: 21000,
    highestExpense: { amount: 15000, category: 'electronics', description: 'MacBook Installment' },
    highestIncome: { amount: 35000, category: 'salary', description: 'Freelance Design' }
  };
};

// ─── 2. Get Monthly Trend ─────────────────────────────────────────────────────
const getMonthlyTrend = async (userId) => {
  return [
    { year: 2026, month: 1, fullDate: 'Jan 2026', income: 25000, expense: 18000 },
    { year: 2026, month: 2, fullDate: 'Feb 2026', income: 27000, expense: 19500 },
    { year: 2026, month: 3, fullDate: 'Mar 2026', income: 26000, expense: 22000 },
    { year: 2026, month: 4, fullDate: 'Apr 2026', income: 28000, expense: 21000 },
    { year: 2026, month: 5, fullDate: 'May 2026', income: 32000, expense: 24000 },
    { year: 2026, month: 6, fullDate: 'Jun 2026', income: 30000, expense: 25000 },
    { year: 2026, month: 7, fullDate: 'Jul 2026', income: 35000, expense: 21000 },
  ];
};

// ─── 3. Get Category Breakdown ────────────────────────────────────────────────
const getCategoryBreakdown = async (userId) => {
  return [
    { category: 'housing', totalAmount: 12000, count: 1, percentage: 57.1 },
    { category: 'food', totalAmount: 5000, count: 15, percentage: 23.8 },
    { category: 'entertainment', totalAmount: 2500, count: 3, percentage: 11.9 },
    { category: 'transportation', totalAmount: 1500, count: 4, percentage: 7.1 },
  ];
};

// ─── 4. Get Recent Transactions ───────────────────────────────────────────────
const getRecentTransactions = async (userId, limit = 5) => {
  const mockTx = [
    {
      _id: 'tx_1',
      type: 'Expense',
      amount: 800,
      category: 'food',
      description: 'Dinner at Pizza Hut',
      transactionDate: new Date(),
      paymentMethod: 'UPI'
    },
    {
      _id: 'tx_2',
      type: 'Income',
      amount: 35000,
      category: 'salary',
      description: 'Freelance Design Project',
      transactionDate: new Date(Date.now() - 86400000),
      paymentMethod: 'Bank Transfer'
    },
    {
      _id: 'tx_3',
      type: 'Expense',
      amount: 1500,
      category: 'transportation',
      description: 'Uber Ride',
      transactionDate: new Date(Date.now() - 172800000),
      paymentMethod: 'Credit Card'
    },
  ];
  return mockTx.slice(0, limit);
};

module.exports = {
  getSummary,
  getMonthlyTrend,
  getCategoryBreakdown,
  getRecentTransactions,
};
