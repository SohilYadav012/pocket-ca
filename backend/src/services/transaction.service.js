/**
 * services/transaction.service.js — Transaction Business Logic
 * Pocket C.A. Backend
 *
 * Contains all database operations and business logic for transactions.
 * Controllers call these methods — they never touch Mongoose directly.
 */

const Transaction = require('../models/Transaction.model');
const ApiError = require('../utils/ApiError');

// ─── Create a transaction ─────────────────────────────────────────────────────
const createTransaction = async (userId, data) => {
  const transaction = await Transaction.create({
    user: userId,
    ...data,
  });
  return transaction;
};

// ─── List transactions with pagination, filtering, sorting, search ────────────
const listTransactions = async (userId, query) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'transactionDate',
    sortOrder = 'desc',
    type,
    category,
    paymentMethod,
    startDate,
    endDate,
    search,
  } = query;

  // ── Build filter ────────────────────────────────────────────────────────────
  const filter = { user: userId };

  if (type)          filter.type = type;
  if (category)      filter.category = category;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  // Date range filter
  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) {
      // Include entire endDate day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.transactionDate.$lte = end;
    }
  }

  // Search by description (case-insensitive regex)
  if (search && search.trim()) {
    filter.$or = [
      { description: { $regex: search.trim(), $options: 'i' } },
      { category:    { $regex: search.trim(), $options: 'i' } },
    ];
  }

  // ── Sort ────────────────────────────────────────────────────────────────────
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  // ── Pagination ──────────────────────────────────────────────────────────────
  const skip  = (page - 1) * limit;
  const total = await Transaction.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const transactions = await Transaction.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean(); // plain JS objects — faster for reads

  return {
    transactions,
    pagination: { page, limit, total, pages },
  };
};

// ─── Get a single transaction by ID ──────────────────────────────────────────
const getTransactionById = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found', 'NOT_FOUND');
  }

  // Ownership check — prevent access to another user's data
  if (transaction.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You are not authorized to access this transaction', 'FORBIDDEN');
  }

  return transaction;
};

// ─── Update a transaction ─────────────────────────────────────────────────────
const updateTransaction = async (transactionId, userId, updates) => {
  // First verify existence and ownership
  const existing = await Transaction.findById(transactionId);

  if (!existing) {
    throw new ApiError(404, 'Transaction not found', 'NOT_FOUND');
  }

  if (existing.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You are not authorized to modify this transaction', 'FORBIDDEN');
  }

  // Apply updates — findByIdAndUpdate with runValidators
  const updated = await Transaction.findByIdAndUpdate(
    transactionId,
    { $set: updates },
    {
      returnDocument: 'after', // return the updated document (modern Mongoose syntax)
      runValidators: true,     // run schema validators on update
    }
  );

  return updated;
};

// ─── Delete a transaction ─────────────────────────────────────────────────────
const deleteTransaction = async (transactionId, userId) => {
  const existing = await Transaction.findById(transactionId);

  if (!existing) {
    throw new ApiError(404, 'Transaction not found', 'NOT_FOUND');
  }

  if (existing.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this transaction', 'FORBIDDEN');
  }

  await Transaction.findByIdAndDelete(transactionId);
  return { deleted: true };
};

module.exports = {
  createTransaction,
  listTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
