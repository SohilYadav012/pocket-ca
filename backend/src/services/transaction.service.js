/**
 * services/transaction.service.js — Transaction Management Service (MOCK)
 * Pocket C.A. Backend
 */

let mockTransactions = [
  { _id: 'tx_1', user: 'mock_user_123', type: 'Expense', amount: 800, category: 'food', description: 'Dinner at Pizza Hut', transactionDate: new Date(), paymentMethod: 'UPI', createdAt: new Date() },
  { _id: 'tx_2', user: 'mock_user_123', type: 'Income', amount: 35000, category: 'salary', description: 'Freelance Design Project', transactionDate: new Date(Date.now() - 86400000), paymentMethod: 'Bank Transfer', createdAt: new Date(Date.now() - 86400000) },
  { _id: 'tx_3', user: 'mock_user_123', type: 'Expense', amount: 1500, category: 'transportation', description: 'Uber Ride', transactionDate: new Date(Date.now() - 172800000), paymentMethod: 'Credit Card', createdAt: new Date(Date.now() - 172800000) },
];

const createTransaction = async (data) => {
  const newTx = { ...data, _id: `tx_${Date.now()}`, createdAt: new Date() };
  mockTransactions.unshift(newTx);
  return newTx;
};

const getTransactions = async (userId, query) => {
  const { page = 1, limit = 10 } = query;
  const startIndex = (Number(page) - 1) * Number(limit);
  
  return {
    transactions: mockTransactions.slice(startIndex, startIndex + Number(limit)),
    pagination: {
      total: mockTransactions.length,
      page: Number(page),
      pages: Math.ceil(mockTransactions.length / Number(limit))
    }
  };
};

const getTransactionById = async (id, userId) => {
  return mockTransactions.find(t => t._id === id && t.user === userId);
};

const updateTransaction = async (id, userId, updates) => {
  const index = mockTransactions.findIndex(t => t._id === id && t.user === userId);
  if (index === -1) return null;
  mockTransactions[index] = { ...mockTransactions[index], ...updates };
  return mockTransactions[index];
};

const deleteTransaction = async (id, userId) => {
  const index = mockTransactions.findIndex(t => t._id === id && t.user === userId);
  if (index === -1) return null;
  const deleted = mockTransactions[index];
  mockTransactions.splice(index, 1);
  return deleted;
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
