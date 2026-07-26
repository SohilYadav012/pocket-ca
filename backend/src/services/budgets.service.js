/**
 * services/budgets.service.js — Budget Management Service
 * Pocket C.A. Backend
 *
 * Enforces duplicate budget prevention and dynamically calculates category-wise
 * spending utilization by aggregating user transaction records.
 */

const mongoose = require('mongoose');
const Budget = require('../models/Budget.model');
const Transaction = require('../models/Transaction.model');
const ApiError = require('../utils/ApiError');

/**
 * Helper: Dynamically enrich budget documents with actual spent amount,
 * remaining amount, and percentage used from Expense transactions.
 */
const enrichBudgetsWithSpending = async (userId, budgets, month, year) => {
  if (!budgets || budgets.length === 0) return [];

  // Calculate start and end of the requested month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Aggregate total expenses per category for this user in this month/year
  const categorySpending = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'Expense',
        transactionDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $toLower: '$category' },
        totalSpent: { $sum: '$amount' },
      },
    },
  ]);

  const spendingMap = {};
  categorySpending.forEach((item) => {
    spendingMap[item._id] = item.totalSpent;
  });

  return budgets.map((b) => {
    const budgetObj = b.toObject ? b.toObject() : { ...b };
    const catKey = (budgetObj.category || '').toLowerCase();
    const spentAmount = Math.round((spendingMap[catKey] || 0) * 100) / 100;
    const remainingAmount = Math.round(Math.max(0, budgetObj.monthlyLimit - spentAmount) * 100) / 100;
    const percentageUsed = budgetObj.monthlyLimit > 0
      ? Math.round((spentAmount / budgetObj.monthlyLimit) * 100)
      : 0;

    return {
      ...budgetObj,
      spentAmount,
      remainingAmount,
      percentageUsed,
    };
  });
};

// ─── 1. Create New Budget ─────────────────────────────────────────────────────
const createBudget = async (userId, data) => {
  const { category, monthlyLimit, month, year } = data;

  if (!category || typeof category !== 'string') {
    throw new ApiError(400, 'Please specify a valid category name.', 'INVALID_CATEGORY');
  }
  if (!monthlyLimit || Number(monthlyLimit) <= 0) {
    throw new ApiError(400, 'Budget limit must be a positive number greater than 0.', 'INVALID_LIMIT');
  }

  const now = new Date();
  const targetMonth = month ? Number(month) : now.getMonth() + 1;
  const targetYear = year ? Number(year) : now.getFullYear();

  if (targetMonth < 1 || targetMonth > 12) {
    throw new ApiError(400, 'Month must be between 1 and 12.', 'INVALID_MONTH');
  }

  const cleanCategory = category.trim().toLowerCase();

  // Enforce duplicate budget prevention rule
  const existing = await Budget.findOne({
    user: userId,
    category: cleanCategory,
    month: targetMonth,
    year: targetYear,
  });

  if (existing) {
    throw new ApiError(
      400,
      `A budget for category "${cleanCategory}" already exists for ${targetMonth}/${targetYear}.`,
      'DUPLICATE_BUDGET'
    );
  }

  const budget = await Budget.create({
    user: userId,
    category: cleanCategory,
    monthlyLimit: Number(monthlyLimit),
    month: targetMonth,
    year: targetYear,
  });

  const enriched = await enrichBudgetsWithSpending(userId, [budget], targetMonth, targetYear);
  return enriched[0];
};

// ─── 2. Get User Budgets for Month/Year ───────────────────────────────────────
const getBudgets = async (userId, { month, year } = {}) => {
  const now = new Date();
  const targetMonth = month ? Number(month) : now.getMonth() + 1;
  const targetYear = year ? Number(year) : now.getFullYear();

  const budgets = await Budget.find({
    user: userId,
    month: targetMonth,
    year: targetYear,
  }).sort({ category: 1 });

  return await enrichBudgetsWithSpending(userId, budgets, targetMonth, targetYear);
};

// ─── 3. Update Existing Budget ────────────────────────────────────────────────
const updateBudget = async (userId, budgetId, data) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new ApiError(400, 'Invalid budget ID format.', 'INVALID_ID');
  }

  const budget = await Budget.findOne({ _id: budgetId, user: userId });
  if (!budget) {
    throw new ApiError(404, 'Budget not found or access denied.', 'BUDGET_NOT_FOUND');
  }

  if (data.monthlyLimit !== undefined) {
    if (Number(data.monthlyLimit) <= 0) {
      throw new ApiError(400, 'Budget limit must be greater than 0.', 'INVALID_LIMIT');
    }
    budget.monthlyLimit = Number(data.monthlyLimit);
  }

  if (data.category && data.category.trim().toLowerCase() !== budget.category) {
    const cleanCategory = data.category.trim().toLowerCase();
    // Check if new category collides with another existing budget
    const existing = await Budget.findOne({
      user: userId,
      category: cleanCategory,
      month: budget.month,
      year: budget.year,
      _id: { $ne: budget._id },
    });
    if (existing) {
      throw new ApiError(400, `A budget for category "${cleanCategory}" already exists for this month.`, 'DUPLICATE_BUDGET');
    }
    budget.category = cleanCategory;
  }

  await budget.save();

  const enriched = await enrichBudgetsWithSpending(userId, [budget], budget.month, budget.year);
  return enriched[0];
};

// ─── 4. Delete Budget ─────────────────────────────────────────────────────────
const deleteBudget = async (userId, budgetId) => {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new ApiError(400, 'Invalid budget ID format.', 'INVALID_ID');
  }

  const deleted = await Budget.findOneAndDelete({ _id: budgetId, user: userId });
  if (!deleted) {
    throw new ApiError(404, 'Budget not found or access denied.', 'BUDGET_NOT_FOUND');
  }
  return { id: deleted._id };
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
