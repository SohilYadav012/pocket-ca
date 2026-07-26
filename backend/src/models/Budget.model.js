/**
 * models/Budget.model.js — Monthly Category Budget Model
 * Pocket C.A. Backend
 *
 * Enforces a unique limit per user per category per month/year.
 * Dynamic spending calculations (spentAmount, remainingAmount, percentageUsed)
 * are computed on the fly in budgets.service.js via transaction aggregations.
 */

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a budget.'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      trim: true,
      lowercase: true,
    },
    monthlyLimit: {
      type: Number,
      required: [true, 'Monthly budget limit is required.'],
      min: [1, 'Budget limit must be a positive monetary value greater than 0.'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required (1-12).'],
      min: [1, 'Month must be between 1 and 12.'],
      max: [12, 'Month must be between 1 and 12.'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required.'],
      min: [2020, 'Year must be 2020 or later.'],
      max: [2100, 'Year cannot exceed 2100.'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate budgets for the same user, category, and month/year combination
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
