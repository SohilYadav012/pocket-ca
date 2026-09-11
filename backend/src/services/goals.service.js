/**
 * services/goals.service.js — Savings Goals Service (MOCK with JSON Persistence)
 * Pocket C.A. Backend
 */

const { readData, writeData } = require('./dataStore');

const createGoal = async (userId, data) => {
  const db = readData();
  const newGoal = { ...data, user: userId, _id: `g_${Date.now()}`, currentAmount: data.currentAmount || 0, createdAt: new Date().toISOString() };
  if (!db.goals) db.goals = [];
  db.goals.push(newGoal);
  writeData(db);
  return newGoal;
};

const getGoals = async (userId, query) => {
  const db = readData();
  if (!db.goals) return [];
  return db.goals.filter(g => g.user === userId);
};

const getGoalById = async (id, userId) => {
  const db = readData();
  if (!db.goals) return null;
  return db.goals.find(g => g._id === id && g.user === userId);
};

const updateGoal = async (userId, id, updates) => {
  const db = readData();
  if (!db.goals) return null;
  const index = db.goals.findIndex(g => g._id === id && g.user === userId);
  if (index === -1) return null;
  db.goals[index] = { ...db.goals[index], ...updates };
  writeData(db);
  return db.goals[index];
};

const deleteGoal = async (userId, id) => {
  const db = readData();
  if (!db.goals) return null;
  const index = db.goals.findIndex(g => g._id === id && g.user === userId);
  if (index === -1) return null;
  const deleted = db.goals[index];
  db.goals.splice(index, 1);
  writeData(db);
  return deleted;
};

const addFunds = async (userId, id, amount) => {
  const db = readData();
  if (!db.goals) return null;
  const index = db.goals.findIndex(g => g._id === id && g.user === userId);
  if (index === -1) return null;
  
  db.goals[index].currentAmount = (db.goals[index].currentAmount || 0) + Number(amount);
  writeData(db);
  return db.goals[index];
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  addFunds,
};
