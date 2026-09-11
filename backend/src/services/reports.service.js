/**
 * services/reports.service.js — Reports Service (MOCK with JSON Persistence)
 * Pocket C.A. Backend
 */

const { readData } = require('./dataStore');

const generateReport = async (userId, startDate, endDate, format) => {
  const db = readData();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  const transactions = db.transactions.filter(t => {
    if (t.user !== userId) return false;
    const tDate = new Date(t.transactionDate);
    return tDate >= start && tDate <= end;
  });

  // Sort chronological
  transactions.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryBreakdown = {};

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'Income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + amount;
    }
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      startDate,
      endDate,
      recordCount: transactions.length,
    },
    summary: {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
    },
    categoryBreakdown,
    transactions,
  };
};

module.exports = {
  generateReport,
};
