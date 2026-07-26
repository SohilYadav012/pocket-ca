/**
 * services/goals.service.js — Savings Goal Management Service
 * Pocket C.A. Backend
 *
 * Handles creation, progress tracking, and contribution updates for savings goals.
 * Enforces future target date validation and automatic completion state transition.
 */

const mongoose = require('mongoose');
const SavingsGoal = require('../models/SavingsGoal.model');
const ApiError = require('../utils/ApiError');

/**
 * Helper: Enrich goal documents with calculated percentage completed and days remaining.
 */
const enrichGoal = (goal) => {
  const g = goal.toObject ? goal.toObject() : { ...goal };
  const target = Number(g.targetAmount) || 1;
  const current = Number(g.currentAmount) || 0;
  
  const percentageCompleted = Math.min(100, Math.round((current / target) * 100));
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const targetDate = new Date(g.targetDate);
  const diffTime = targetDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    ...g,
    percentageCompleted,
    daysRemaining,
  };
};

// ─── 1. Create Savings Goal ───────────────────────────────────────────────────
const createGoal = async (userId, data) => {
  const { goalName, targetAmount, currentAmount = 0, targetDate } = data;

  if (!goalName || !goalName.trim()) {
    throw new ApiError(400, 'Please enter a valid goal name.', 'INVALID_GOAL_NAME');
  }
  if (!targetAmount || Number(targetAmount) <= 0) {
    throw new ApiError(400, 'Target amount must be greater than 0.', 'INVALID_TARGET_AMOUNT');
  }
  if (Number(currentAmount) < 0) {
    throw new ApiError(400, 'Current amount cannot be negative.', 'INVALID_CURRENT_AMOUNT');
  }
  if (!targetDate) {
    throw new ApiError(400, 'Please specify a target date.', 'INVALID_TARGET_DATE');
  }

  const tDate = new Date(targetDate);
  if (isNaN(tDate.getTime())) {
    throw new ApiError(400, 'Invalid targetDate format. Use YYYY-MM-DD.', 'INVALID_TARGET_DATE');
  }

  // Validate that targetDate is in the future or today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (tDate < today) {
    throw new ApiError(400, 'Target date must be in the future or today.', 'INVALID_TARGET_DATE');
  }

  const goal = await SavingsGoal.create({
    user: userId,
    goalName: goalName.trim(),
    targetAmount: Number(targetAmount),
    currentAmount: Number(currentAmount),
    targetDate: tDate,
  });

  return enrichGoal(goal);
};

// ─── 2. Get User Savings Goals ────────────────────────────────────────────────
const getGoals = async (userId, { status } = {}) => {
  const query = { user: userId };
  if (status && ['Active', 'Completed'].includes(status)) {
    query.status = status;
  }

  const goals = await SavingsGoal.find(query).sort({ status: 1, targetDate: 1 });
  return goals.map((g) => enrichGoal(g));
};

// ─── 3. Update Existing Goal / Add Contribution ───────────────────────────────
const updateGoal = async (userId, goalId, data) => {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new ApiError(400, 'Invalid goal ID format.', 'INVALID_ID');
  }

  const goal = await SavingsGoal.findOne({ _id: goalId, user: userId });
  if (!goal) {
    throw new ApiError(404, 'Savings goal not found or access denied.', 'GOAL_NOT_FOUND');
  }

  if (data.goalName !== undefined) {
    if (!data.goalName.trim()) throw new ApiError(400, 'Goal name cannot be empty.', 'INVALID_GOAL_NAME');
    goal.goalName = data.goalName.trim();
  }

  if (data.targetAmount !== undefined) {
    if (Number(data.targetAmount) <= 0) throw new ApiError(400, 'Target amount must be greater than 0.', 'INVALID_TARGET_AMOUNT');
    goal.targetAmount = Number(data.targetAmount);
  }

  if (data.currentAmount !== undefined) {
    if (Number(data.currentAmount) < 0) throw new ApiError(400, 'Current amount cannot be negative.', 'INVALID_CURRENT_AMOUNT');
    goal.currentAmount = Number(data.currentAmount);
  }

  if (data.targetDate !== undefined) {
    const tDate = new Date(data.targetDate);
    if (isNaN(tDate.getTime())) throw new ApiError(400, 'Invalid targetDate format.', 'INVALID_TARGET_DATE');
    goal.targetDate = tDate;
  }

  // Saving triggers pre-save hook in SavingsGoal.model.js to transition status to Completed
  await goal.save();

  return enrichGoal(goal);
};

// ─── 4. Delete Savings Goal ───────────────────────────────────────────────────
const deleteGoal = async (userId, goalId) => {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new ApiError(400, 'Invalid goal ID format.', 'INVALID_ID');
  }

  const deleted = await SavingsGoal.findOneAndDelete({ _id: goalId, user: userId });
  if (!deleted) {
    throw new ApiError(404, 'Savings goal not found or access denied.', 'GOAL_NOT_FOUND');
  }
  return { id: deleted._id };
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
};
