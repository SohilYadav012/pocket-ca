/**
 * controllers/budgets.controller.js — Budget Controller
 * Pocket C.A. Backend
 *
 * Handles HTTP requests for creating, viewing, updating, and deleting
 * monthly category budgets.
 */

const budgetsService = require('../services/budgets.service');
const ApiResponse = require('../utils/ApiResponse');

// ─── 1. Create Budget ─────────────────────────────────────────────────────────
const createBudget = async (req, res, next) => {
  try {
    const budget = await budgetsService.createBudget(req.user._id, req.body);
    return ApiResponse.success(res, 201, 'Budget created successfully.', budget);
  } catch (err) {
    next(err);
  }
};

// ─── 2. Get Budgets ───────────────────────────────────────────────────────────
const getBudgets = async (req, res, next) => {
  try {
    const budgets = await budgetsService.getBudgets(req.user._id, req.query);
    return ApiResponse.success(res, 200, 'Budgets retrieved successfully.', budgets);
  } catch (err) {
    next(err);
  }
};

// ─── 3. Update Budget ─────────────────────────────────────────────────────────
const updateBudget = async (req, res, next) => {
  try {
    const budget = await budgetsService.updateBudget(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, 200, 'Budget updated successfully.', budget);
  } catch (err) {
    next(err);
  }
};

// ─── 4. Delete Budget ─────────────────────────────────────────────────────────
const deleteBudget = async (req, res, next) => {
  try {
    const result = await budgetsService.deleteBudget(req.user._id, req.params.id);
    return ApiResponse.success(res, 200, 'Budget deleted successfully.', result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
