/**
 * routes/transaction.routes.js — Transaction API Routes
 * Pocket C.A. Backend
 *
 * All routes are protected by the JWT auth middleware.
 * Input validation applied per endpoint via Joi schemas.
 *
 * Base path: /api/transactions
 */

const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} = require('../validators/transaction.validator');
const {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transaction.controller');

// ─── Apply auth guard to ALL transaction routes ───────────────────────────────
router.use(protect);

// ─── Collection Routes ────────────────────────────────────────────────────────

// POST   /api/transactions         — Create a new transaction
router.post(
  '/',
  validate(createTransactionSchema, 'body'),
  createTransaction
);

// GET    /api/transactions          — List with pagination, filters, sorting
router.get(
  '/',
  validate(listTransactionsQuerySchema, 'query'),
  listTransactions
);

// ─── Resource Routes ──────────────────────────────────────────────────────────

// GET    /api/transactions/:id      — Get single transaction
router.get('/:id', getTransaction);

// PUT    /api/transactions/:id      — Update a transaction
router.put(
  '/:id',
  validate(updateTransactionSchema, 'body'),
  updateTransaction
);

// DELETE /api/transactions/:id      — Delete a transaction
router.delete('/:id', deleteTransaction);

module.exports = router;
