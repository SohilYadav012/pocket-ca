/**
 * routes/insights.routes.js — Financial Insights Routes
 * Pocket C.A. Backend
 *
 * Protected by JWT authentication:
 * - GET /api/insights — Retrieve health score and AI suggestions
 */

const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insights.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', insightsController.getInsights);

module.exports = router;
