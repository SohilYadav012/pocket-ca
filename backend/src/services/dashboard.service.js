/**
 * services/dashboard.service.js — Dashboard & Financial Analytics Service (MOCK with JSON Persistence)
 * Pocket C.A. Backend
 */

const { readData } = require('./dataStore');

// ─── 1. Get Financial Summary ─────────────────────────────────────────────────
const getSummary = async (userId) => {
  const db = readData();
  const userTxs = db.transactions.filter(t => t.user === userId);

  let totalIncome = 0;
  let totalExpense = 0;
  let highestExpense = null;
  let highestIncome = null;

  userTxs.forEach(t => {
    const amount = Number(t.amount) || 0;
    if (t.type === 'Income') {
      totalIncome += amount;
      if (!highestIncome || amount > highestIncome.amount) {
        highestIncome = { amount, category: t.category, description: t.description };
      }
    } else {
      totalExpense += amount;
      if (!highestExpense || amount > highestExpense.amount) {
        highestExpense = { amount, category: t.category, description: t.description };
      }
    }
  });

  const totalBalance = totalIncome - totalExpense;

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    totalTransactions: userTxs.length,
    currentMonthIncome: totalIncome, // Simplified for mock
    currentMonthExpense: totalExpense, // Simplified for mock
    highestExpense,
    highestIncome
  };
};

// ─── 2. Get Monthly Trend ─────────────────────────────────────────────────────
const getMonthlyTrend = async (userId) => {
  const db = readData();
  const userTxs = db.transactions.filter(t => t.user === userId);
  
  // Aggregate by month-year
  const trendMap = {};
  userTxs.forEach(t => {
    const d = new Date(t.transactionDate);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!trendMap[key]) {
      trendMap[key] = { year: d.getFullYear(), month: d.getMonth() + 1, fullDate: `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`, income: 0, expense: 0 };
    }
    if (t.type === 'Income') trendMap[key].income += Number(t.amount);
    else trendMap[key].expense += Number(t.amount);
  });

  return Object.values(trendMap).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
};

// ─── 3. Get Category Breakdown ────────────────────────────────────────────────
const getCategoryBreakdown = async (userId) => {
  const db = readData();
  const expenseTxs = db.transactions.filter(t => t.user === userId && t.type === 'Expense');
  
  let totalExp = 0;
  const catMap = {};
  
  expenseTxs.forEach(t => {
    const amount = Number(t.amount) || 0;
    totalExp += amount;
    if (!catMap[t.category]) catMap[t.category] = { totalAmount: 0, count: 0 };
    catMap[t.category].totalAmount += amount;
    catMap[t.category].count += 1;
  });

  return Object.entries(catMap).map(([category, data]) => ({
    category,
    totalAmount: data.totalAmount,
    count: data.count,
    percentage: totalExp > 0 ? Number(((data.totalAmount / totalExp) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.totalAmount - a.totalAmount);
};

// ─── 4. Get Recent Transactions ───────────────────────────────────────────────
const getRecentTransactions = async (userId, limit = 5) => {
  const db = readData();
  const userTxs = db.transactions.filter(t => t.user === userId);
  // Sort by date descending
  userTxs.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  return userTxs.slice(0, limit);
};

module.exports = {
  getSummary,
  getMonthlyTrend,
  getCategoryBreakdown,
  getRecentTransactions,
};
