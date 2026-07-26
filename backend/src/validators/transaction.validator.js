/**
 * validators/transaction.validator.js — Transaction Joi Schemas
 * Pocket C.A. Backend
 *
 * Validates all transaction API request bodies and query parameters.
 * Used by the validate middleware before reaching controllers.
 */

const Joi = require('joi');

const VALID_CATEGORIES = [
  'salary', 'freelance', 'investment',
  'food', 'transport', 'rent', 'utilities', 'healthcare',
  'entertainment', 'education', 'shopping', 'emi', 'insurance', 'others',
];

const VALID_PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'other'];
const VALID_TYPES = ['Income', 'Expense'];
const VALID_SORT_FIELDS = ['transactionDate', 'amount', 'createdAt', 'category'];
const VALID_SORT_ORDERS = ['asc', 'desc'];

// ─── Create Transaction ───────────────────────────────────────────────────────
const createTransactionSchema = Joi.object({
  type: Joi.string()
    .valid(...VALID_TYPES)
    .required()
    .messages({
      'any.only': 'Type must be Income or Expense',
      'any.required': 'Transaction type is required',
    }),

  category: Joi.string()
    .valid(...VALID_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999)
    .required()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'number.max': 'Amount cannot exceed 999,999,999',
      'any.required': 'Amount is required',
    }),

  description: Joi.string().trim().max(500).allow('').default('').messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),

  transactionDate: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Transaction date cannot be in the future',
      'any.required': 'Transaction date is required',
    }),

  paymentMethod: Joi.string()
    .valid(...VALID_PAYMENT_METHODS)
    .default('other')
    .messages({
      'any.only': `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
    }),

  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]).messages({
    'array.max': 'Maximum 10 tags allowed',
  }),
});

// ─── Update Transaction (all fields optional) ─────────────────────────────────
const updateTransactionSchema = Joi.object({
  type: Joi.string().valid(...VALID_TYPES),
  category: Joi.string().valid(...VALID_CATEGORIES),
  amount: Joi.number().positive().precision(2).max(999999999),
  description: Joi.string().trim().max(500).allow(''),
  transactionDate: Joi.date().max('now'),
  paymentMethod: Joi.string().valid(...VALID_PAYMENT_METHODS),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// ─── List Transactions Query Parameters ──────────────────────────────────────
const listTransactionsQuerySchema = Joi.object({
  page:          Joi.number().integer().min(1).default(1),
  limit:         Joi.number().integer().min(1).max(100).default(20),
  sortBy:        Joi.string().valid(...VALID_SORT_FIELDS).default('transactionDate'),
  sortOrder:     Joi.string().valid(...VALID_SORT_ORDERS).default('desc'),
  type:          Joi.string().valid(...VALID_TYPES),
  category:      Joi.string().valid(...VALID_CATEGORIES),
  paymentMethod: Joi.string().valid(...VALID_PAYMENT_METHODS),
  startDate:     Joi.date(),
  endDate:       Joi.date().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('startDate')).messages({
      'date.min': 'endDate must be after startDate',
    }),
  }),
  search: Joi.string().trim().max(100).allow(''),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
};
