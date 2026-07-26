/**
 * models/Transaction.model.js — Transaction Schema
 * Pocket C.A. Backend
 *
 * Represents a single financial transaction (income or expense).
 * Every transaction is scoped to a user (ownership via userId reference).
 */

const mongoose = require('mongoose');

// ─── Valid Category Values ────────────────────────────────────────────────────
const VALID_CATEGORIES = [
  'salary', 'freelance', 'investment',
  'food', 'transport', 'rent', 'utilities', 'healthcare',
  'entertainment', 'education', 'shopping', 'emi', 'insurance', 'others',
];

// ─── Valid Payment Methods ────────────────────────────────────────────────────
const VALID_PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'other'];

// ─── Schema ───────────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user'],
      index: true,
    },

    // ── Core Fields ───────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: {
        values: ['Income', 'Expense'],
        message: 'Type must be Income or Expense',
      },
      required: [true, 'Transaction type is required'],
    },

    category: {
      type: String,
      enum: {
        values: VALID_CATEGORIES,
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      },
      required: [true, 'Category is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01'],
      validate: {
        validator: (v) => isFinite(v) && v > 0,
        message: 'Amount must be a positive number',
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },

    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      validate: {
        validator: (v) => v <= new Date(),
        message: 'Transaction date cannot be in the future',
      },
    },

    paymentMethod: {
      type: String,
      enum: {
        values: VALID_PAYMENT_METHODS,
        message: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
      },
      default: 'other',
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Maximum 10 tags allowed',
      },
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound Indexes for query performance ───────────────────────────────────
transactionSchema.index({ user: 1, transactionDate: -1 }); // default list order
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, paymentMethod: 1 });

// ─── Text index for full-text search on description ──────────────────────────
transactionSchema.index({ description: 'text', category: 'text' });

// ─── Remove __v from responses ────────────────────────────────────────────────
transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// ─── Export constants for reuse in validators/service ────────────────────────
transactionSchema.statics.VALID_CATEGORIES = VALID_CATEGORIES;
transactionSchema.statics.VALID_PAYMENT_METHODS = VALID_PAYMENT_METHODS;

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
