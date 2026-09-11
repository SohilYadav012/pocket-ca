/**
 * services/transaction.service.js — Transaction Management Service (MOCK with JSON Persistence)
 * Pocket C.A. Backend
 */

const { readData, writeData } = require('./dataStore');

const createTransaction = async (userId, data) => {
  const db = readData();
  const newTx = { ...data, user: userId, _id: `tx_${Date.now()}`, createdAt: new Date().toISOString() };
  if (!db.transactions) db.transactions = [];
  db.transactions.unshift(newTx);
  writeData(db);
  return newTx;
};

const listTransactions = async (userId, query) => {
  const db = readData();
  const { page = 1, limit = 10 } = query;
  const startIndex = (Number(page) - 1) * Number(limit);
  
  if (!db.transactions) db.transactions = [];
  const userTxs = db.transactions.filter(t => t.user === userId);
  
  return {
    transactions: userTxs.slice(startIndex, startIndex + Number(limit)),
    pagination: {
      total: userTxs.length,
      page: Number(page),
      pages: Math.ceil(userTxs.length / Number(limit)) || 1
    }
  };
};

const getTransactionById = async (id, userId) => {
  const db = readData();
  return db.transactions.find(t => t._id === id && t.user === userId);
};

const updateTransaction = async (id, userId, updates) => {
  const db = readData();
  if (!db.transactions) return null;
  const index = db.transactions.findIndex(t => t._id === id && t.user === userId);
  if (index === -1) return null;
  db.transactions[index] = { ...db.transactions[index], ...updates };
  writeData(db);
  return db.transactions[index];
};

const deleteTransaction = async (id, userId) => {
  const db = readData();
  if (!db.transactions) return null;
  const index = db.transactions.findIndex(t => t._id === id && t.user === userId);
  if (index === -1) return null;
  const deleted = db.transactions[index];
  db.transactions.splice(index, 1);
  writeData(db);
  return deleted;
};

module.exports = {
  createTransaction,
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
