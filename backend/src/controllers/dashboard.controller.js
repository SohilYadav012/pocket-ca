/**
 * controllers/dashboard.controller.js — Dashboard Request Handlers
 * Pocket C.A. Backend
 *
 * Handles HTTP requests for dashboard analytics.
 * Delegates all database aggregation logic to dashboard.service.js.
 */

const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/dashboard/summary ───────────────────────────────────────────────
const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.user._id);
  return ApiResponse.success(res, 200, 'Dashboard summary fetched successfully', summary);
});

// ─── GET /api/dashboard/monthly-trend ─────────────────────────────────────────
const getMonthlyTrend = asyncHandler(async (req, res) => {
  const trend = await dashboardService.getMonthlyTrend(req.user._id);
  return ApiResponse.success(res, 200, 'Monthly trend fetched successfully', trend);
});

// ─── GET /api/dashboard/category-breakdown ────────────────────────────────────
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await dashboardService.getCategoryBreakdown(req.user._id);
  return ApiResponse.success(res, 200, 'Category breakdown fetched successfully', breakdown);
});

// ─── GET /api/dashboard/recent-transactions ───────────────────────────────────
const getRecentTransactions = asyncHandler(async (req, res) => {
  const recent = await dashboardService.getRecentTransactions(req.user._id);
  return ApiResponse.success(res, 200, 'Recent transactions fetched successfully', recent);
});

module.exports = {
  getSummary,
  getMonthlyTrend,
  getCategoryBreakdown,
  getRecentTransactions,
};
