/**
 * controllers/goals.controller.js — Savings Goal Controller
 * Pocket C.A. Backend
 *
 * Handles HTTP requests for savings goal creation, progress tracking,
 * contributions, and deletions.
 */

const goalsService = require('../services/goals.service');
const ApiResponse = require('../utils/ApiResponse');

// ─── 1. Create Savings Goal ───────────────────────────────────────────────────
const createGoal = async (req, res, next) => {
  try {
    const goal = await goalsService.createGoal(req.user._id, req.body);
    return ApiResponse.success(res, 201, 'Savings goal created successfully.', goal);
  } catch (err) {
    next(err);
  }
};

// ─── 2. Get User Savings Goals ────────────────────────────────────────────────
const getGoals = async (req, res, next) => {
  try {
    const goals = await goalsService.getGoals(req.user._id, req.query);
    return ApiResponse.success(res, 200, 'Savings goals retrieved successfully.', goals);
  } catch (err) {
    next(err);
  }
};

// ─── 3. Update Existing Goal / Add Contribution ───────────────────────────────
const updateGoal = async (req, res, next) => {
  try {
    const goal = await goalsService.updateGoal(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, 200, 'Savings goal updated successfully.', goal);
  } catch (err) {
    next(err);
  }
};

// ─── 4. Delete Savings Goal ───────────────────────────────────────────────────
const deleteGoal = async (req, res, next) => {
  try {
    const result = await goalsService.deleteGoal(req.user._id, req.params.id);
    return ApiResponse.success(res, 200, 'Savings goal deleted successfully.', result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
};
