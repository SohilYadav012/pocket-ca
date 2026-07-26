/**
 * services/dashboard.service.js — Dashboard & Financial Analytics Service
 * Pocket C.A. Backend
 *
 * Implements optimized MongoDB aggregation pipelines for dashboard metrics:
 * 1. Financial Summary (Totals, Current Month comparisons, Highest transactions)
 * 2. Monthly Trend (Income vs Expense grouped by YYYY-MM)
 * 3. Category Breakdown (Expense totals and percentages grouped by category)
 * 4. Recent Transactions (Latest 5 transactions)
 *
 * All operations are strictly scoped to the authenticated user's ID.
 */

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction.model');

// ─── 1. Get Financial Summary ─────────────────────────────────────────────────
const getSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Determine start and end of the current month in UTC
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const endOfMonth   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const stats = await Transaction.aggregate([
    { $match: { user: userObjectId } },
    {
      $facet: {
        // Overall totals across all time
        overall: [
          {
            $group: {
              _id: null,
              totalIncome: {
                $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] },
              },
              totalExpense: {
                $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] },
              },
              totalTransactions: { $sum: 1 },
            },
          },
        ],
        // Current month totals
        currentMonth: [
          {
            $match: {
              transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              monthIncome: {
                $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] },
              },
              monthExpense: {
                $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] },
              },
            },
          },
        ],
        // Highest single expense transaction
        highestExpenseTx: [
          { $match: { type: 'Expense' } },
          { $sort: { amount: -1, transactionDate: -1 } },
          { $limit: 1 },
        ],
        // Highest single income transaction
        highestIncomeTx: [
          { $match: { type: 'Income' } },
          { $sort: { amount: -1, transactionDate: -1 } },
          { $limit: 1 },
        ],
      },
    },
  ]);

  const overall    = stats[0]?.overall[0]      || { totalIncome: 0, totalExpense: 0, totalTransactions: 0 };
  const month      = stats[0]?.currentMonth[0] || { monthIncome: 0, monthExpense: 0 };
  const highestExp = stats[0]?.highestExpenseTx[0] || null;
  const highestInc = stats[0]?.highestIncomeTx[0]  || null;

  const totalBalance = parseFloat((overall.totalIncome - overall.totalExpense).toFixed(2));

  return {
    totalBalance,
    totalIncome:         parseFloat(overall.totalIncome.toFixed(2)),
    totalExpense:        parseFloat(overall.totalExpense.toFixed(2)),
    totalTransactions:   overall.totalTransactions,
    currentMonthIncome:  parseFloat(month.monthIncome.toFixed(2)),
    currentMonthExpense: parseFloat(month.monthExpense.toFixed(2)),
    highestExpense:      highestExp,
    highestIncome:       highestInc,
  };
};

// ─── 2. Get Monthly Trend ─────────────────────────────────────────────────────
const getMonthlyTrend = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Aggregate monthly income and expense by YYYY-MM
  const trend = await Transaction.aggregate([
    { $match: { user: userObjectId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] },
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Ensure at least the last 6 months are represented (even if 0) for clean chart rendering
  const monthsMap = new Map();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    monthsMap.set(key, { month: monthName, fullDate: key, income: 0, expense: 0 });
  }

  // Populate map with actual DB results (and add any historical months not in default 6)
  trend.forEach((item) => {
    const key = item._id;
    if (!key) return; // safety check for missing date
    const [year, monthNum] = key.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
    const monthName = dateObj.toLocaleString('en-US', { month: 'short', year: '2-digit' });

    monthsMap.set(key, {
      month: monthName,
      fullDate: key,
      income:  parseFloat(item.income.toFixed(2)),
      expense: parseFloat(item.expense.toFixed(2)),
    });
  });

  // Sort chronologically by YYYY-MM key
  const sortedMonths = Array.from(monthsMap.values()).sort((a, b) =>
    a.fullDate.localeCompare(b.fullDate)
  );

  return sortedMonths;
};

// ─── 3. Get Category Breakdown ────────────────────────────────────────────────
const getCategoryBreakdown = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const breakdown = await Transaction.aggregate([
    {
      $match: {
        user: userObjectId,
        type: 'Expense',
      },
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const totalExpense = breakdown.reduce((acc, item) => acc + item.totalAmount, 0);

  const formatted = breakdown.map((item) => ({
    category:    item._id,
    totalAmount: parseFloat(item.totalAmount.toFixed(2)),
    count:       item.count,
    percentage:  totalExpense > 0 ? parseFloat(((item.totalAmount / totalExpense) * 100).toFixed(1)) : 0,
  }));

  return formatted;
};

// ─── 4. Get Recent Transactions ───────────────────────────────────────────────
const getRecentTransactions = async (userId) => {
  const recent = await Transaction.find({ user: userId })
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(5)
    .lean();

  return recent;
};

module.exports = {
  getSummary,
  getMonthlyTrend,
  getCategoryBreakdown,
  getRecentTransactions,
};
