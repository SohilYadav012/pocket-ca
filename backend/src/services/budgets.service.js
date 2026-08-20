/**
 * services/budgets.service.js — Budget Management Service (MOCK)
 * Pocket C.A. Backend
 */

let mockBudgets = [
  { _id: 'b_1', user: 'mock_user_123', category: 'food', limitAmount: 15000, spentAmount: 5000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() },
  { _id: 'b_2', user: 'mock_user_123', category: 'entertainment', limitAmount: 5000, spentAmount: 2500, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() },
];

const createBudget = async (data) => {
  const newBudget = { ...data, _id: `b_${Date.now()}`, spentAmount: 0, createdAt: new Date() };
  mockBudgets.push(newBudget);
  return newBudget;
};

const getBudgets = async (userId, query) => {
  return mockBudgets.filter(b => b.user === userId);
};

const getBudgetById = async (id, userId) => {
  return mockBudgets.find(b => b._id === id && b.user === userId);
};

const updateBudget = async (id, userId, updates) => {
  const index = mockBudgets.findIndex(b => b._id === id && b.user === userId);
  if (index === -1) return null;
  mockBudgets[index] = { ...mockBudgets[index], ...updates };
  return mockBudgets[index];
};

const deleteBudget = async (id, userId) => {
  const index = mockBudgets.findIndex(b => b._id === id && b.user === userId);
  if (index === -1) return null;
  const deleted = mockBudgets[index];
  mockBudgets.splice(index, 1);
  return deleted;
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};
