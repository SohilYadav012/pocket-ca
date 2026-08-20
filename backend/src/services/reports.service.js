/**
 * services/reports.service.js — Reports Service (MOCK)
 * Pocket C.A. Backend
 */

const generateReport = async (userId, startDate, endDate, format) => {
  return {
    meta: {
      generatedAt: new Date(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      recordCount: 1,
    },
    summary: {
      totalIncome: 120000,
      totalExpense: 75000,
      netSavings: 45000,
    },
    categoryBreakdown: {
      food: 5000,
      housing: 12000,
    },
    transactions: [
      { date: new Date().toISOString(), type: 'Expense', amount: 800, category: 'food' }
    ],
  };
};

module.exports = {
  generateReport,
};
