/**
 * services/insights.service.js — Financial Insights Service (MOCK)
 * Pocket C.A. Backend
 */

const getInsights = async (userId) => {
  return [
    { type: 'warning', title: 'High Spending', description: 'You spent 57% of your budget on Housing this month.', recommendation: 'Consider negotiating rent or moving to a cheaper place.' },
    { type: 'success', title: 'Great Job!', description: 'You saved ₹5,000 more than last month.', recommendation: 'Invest the extra savings in a mutual fund.' },
    { type: 'info', title: 'Upcoming Bill', description: 'Your Netflix subscription is due tomorrow.', recommendation: 'Ensure you have ₹649 in your account.' },
  ];
};

module.exports = {
  getInsights,
};
