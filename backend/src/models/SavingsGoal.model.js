/**
 * models/SavingsGoal.model.js — Savings Goal Model
 * Pocket C.A. Backend
 *
 * Tracks financial targets, accumulated contributions, and completion status.
 * Automatically transitions to 'Completed' when targetAmount is reached.
 */

const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a savings goal.'],
      index: true,
    },
    goalName: {
      type: String,
      required: [true, 'Goal name is required.'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters.'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required.'],
      min: [1, 'Target amount must be a positive monetary value greater than 0.'],
    },
    currentAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Current amount cannot be negative.'],
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required.'],
    },
    status: {
      type: String,
      enum: ['Active', 'Completed'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to automatically transition status based on progress
savingsGoalSchema.pre('save', function () {
  if (this.currentAmount >= this.targetAmount) {
    this.status = 'Completed';
  } else {
    this.status = 'Active';
  }
});

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal;
