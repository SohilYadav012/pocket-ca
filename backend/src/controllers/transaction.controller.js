/**
 * controllers/transaction.controller.js — Transaction Request Handlers
 * Pocket C.A. Backend
 *
 * Thin controllers: extract data from req, call service, send response.
 * All business logic and DB operations live in transaction.service.js.
 */

const transactionService = require('../services/transaction.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /api/transactions ───────────────────────────────────────────────────
const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user._id, req.body);
  return ApiResponse.success(res, 201, 'Transaction created successfully', { transaction });
});

// ─── GET /api/transactions ────────────────────────────────────────────────────
const listTransactions = asyncHandler(async (req, res) => {
  const { transactions, pagination } = await transactionService.listTransactions(
    req.user._id,
    req.query
  );

  return ApiResponse.paginated(
    res,
    200,
    'Transactions fetched successfully',
    transactions,
    pagination
  );
});

// ─── GET /api/transactions/:id ────────────────────────────────────────────────
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.params.id,
    req.user._id
  );
  return ApiResponse.success(res, 200, 'Transaction fetched successfully', { transaction });
});

// ─── PUT /api/transactions/:id ────────────────────────────────────────────────
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.updateTransaction(
    req.params.id,
    req.user._id,
    req.body
  );
  return ApiResponse.success(res, 200, 'Transaction updated successfully', { transaction });
});

// ─── DELETE /api/transactions/:id ─────────────────────────────────────────────
const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.deleteTransaction(req.params.id, req.user._id);
  return ApiResponse.success(res, 200, 'Transaction deleted successfully');
});

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
};
