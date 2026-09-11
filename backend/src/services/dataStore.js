/**
 * services/dataStore.js — JSON File Database (MOCK)
 * Pocket C.A. Backend
 *
 * Provides persistent storage using a local JSON file instead of MongoDB.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data.json');

// Default initial state if file doesn't exist
const DEFAULT_DATA = {
  transactions: [
    { _id: 'tx_1', user: 'mock_user_123', type: 'Expense', amount: 800, category: 'food', description: 'Dinner at Pizza Hut', transactionDate: new Date().toISOString(), paymentMethod: 'UPI', createdAt: new Date().toISOString() },
    { _id: 'tx_2', user: 'mock_user_123', type: 'Income', amount: 35000, category: 'salary', description: 'Freelance Design Project', transactionDate: new Date(Date.now() - 86400000).toISOString(), paymentMethod: 'Bank Transfer', createdAt: new Date(Date.now() - 86400000).toISOString() }
  ],
  budgets: [
    { _id: 'b_1', user: 'mock_user_123', category: 'food', limitAmount: 15000, spentAmount: 5000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date().toISOString() }
  ],
  goals: [
    { _id: 'g_1', user: 'mock_user_123', title: 'New MacBook Pro', targetAmount: 150000, currentAmount: 45000, targetDate: new Date(Date.now() + 8640000000).toISOString(), status: 'In Progress', createdAt: new Date().toISOString() }
  ]
};

// Initialize file if it doesn't exist
const initDataStore = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
};

const readData = () => {
  initDataStore();
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(rawData);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

module.exports = {
  readData,
  writeData,
};
