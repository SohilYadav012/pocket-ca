/**
 * controllers/insights.controller.js — Financial Insights Controller
 * Pocket C.A. Backend
 *
 * Handles HTTP requests for retrieving comprehensive financial insights,
 * health score metrics, and Gemini AI suggestions.
 */

const insightsService = require('../services/insights.service');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/insights ────────────────────────────────────────────────────────
const getInsights = async (req, res, next) => {
  try {
    const insights = await insightsService.getFinancialInsights(req.user._id);
    return ApiResponse.success(res, 200, 'Financial insights retrieved successfully.', insights);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInsights,
};
