/**
 * services/goals.service.js — Savings Goals Service (MOCK)
 * Pocket C.A. Backend
 */

let mockGoals = [
  { _id: 'g_1', user: 'mock_user_123', title: 'New MacBook Pro', targetAmount: 150000, currentAmount: 45000, targetDate: new Date(Date.now() + 8640000000), status: 'In Progress', createdAt: new Date() },
  { _id: 'g_2', user: 'mock_user_123', title: 'Emergency Fund', targetAmount: 300000, currentAmount: 120000, targetDate: new Date(Date.now() + 15000000000), status: 'In Progress', createdAt: new Date() },
];

const createGoal = async (data) => {
  const newGoal = { ...data, _id: `g_${Date.now()}`, currentAmount: data.currentAmount || 0, createdAt: new Date() };
  mockGoals.push(newGoal);
  return newGoal;
};

const getGoals = async (userId) => {
  return mockGoals.filter(g => g.user === userId);
};

const getGoalById = async (id, userId) => {
  return mockGoals.find(g => g._id === id && g.user === userId);
};

const updateGoal = async (id, userId, updates) => {
  const index = mockGoals.findIndex(g => g._id === id && g.user === userId);
  if (index === -1) return null;
  mockGoals[index] = { ...mockGoals[index], ...updates };
  return mockGoals[index];
};

const deleteGoal = async (id, userId) => {
  const index = mockGoals.findIndex(g => g._id === id && g.user === userId);
  if (index === -1) return null;
  const deleted = mockGoals[index];
  mockGoals.splice(index, 1);
  return deleted;
};

const addFunds = async (id, userId, amount) => {
  const index = mockGoals.findIndex(g => g._id === id && g.user === userId);
  if (index === -1) return null;
  mockGoals[index].currentAmount += Number(amount);
  if (mockGoals[index].currentAmount >= mockGoals[index].targetAmount) {
    mockGoals[index].status = 'Achieved';
  }
  return mockGoals[index];
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  addFunds,
};
