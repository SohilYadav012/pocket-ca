/**
 * services/budgets.service.js — Budget Management Service (MOCK with JSON Persistence)
 * Pocket C.A. Backend
 */

const { readData, writeData } = require('./dataStore');

const createBudget = async (userId, data) => {
  const db = readData();
  const newBudget = { ...data, user: userId, _id: `b_${Date.now()}`, spentAmount: 0, createdAt: new Date().toISOString() };
  if (!db.budgets) db.budgets = [];
  db.budgets.push(newBudget);
  writeData(db);
  return newBudget;
};

const getBudgets = async (userId, query) => {
  const db = readData();
  if (!db.budgets) return [];
  
  const { month, year } = query;
  
  // Filter user's budgets
  const userBudgets = db.budgets.filter(b => b.user === userId);
  
  // Get all user transactions
  const userTxs = db.transactions ? db.transactions.filter(t => t.user === userId && t.type === 'Expense') : [];
  
  return userBudgets.map(budget => {
    // Calculate total spent for this budget's category in the given month/year
    const spentAmount = userTxs
      .filter(t => {
        if (t.category !== budget.category) return false;
        if (!month || !year) return true;
        const d = new Date(t.transactionDate || t.createdAt);
        return (d.getMonth() + 1) === Number(month) && d.getFullYear() === Number(year);
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyLimit = Number(budget.monthlyLimit) || 0;
    const remainingAmount = monthlyLimit - spentAmount;
    const percentageUsed = monthlyLimit > 0 ? Math.round((spentAmount / monthlyLimit) * 100) : 0;
    
    return {
      ...budget,
      spentAmount,
      remainingAmount,
      percentageUsed
    };
  });
};

const getBudgetById = async (id, userId) => {
  const db = readData();
  if (!db.budgets) return null;
  return db.budgets.find(b => b._id === id && b.user === userId);
};

const updateBudget = async (userId, id, updates) => {
  const db = readData();
  if (!db.budgets) return null;
  const index = db.budgets.findIndex(b => b._id === id && b.user === userId);
  if (index === -1) return null;
  db.budgets[index] = { ...db.budgets[index], ...updates };
  writeData(db);
  return db.budgets[index];
};

const deleteBudget = async (userId, id) => {
  const db = readData();
  if (!db.budgets) return null;
  const index = db.budgets.findIndex(b => b._id === id && b.user === userId);
  if (index === -1) return null;
  const deleted = db.budgets[index];
  db.budgets.splice(index, 1);
  writeData(db);
  return deleted;
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};
