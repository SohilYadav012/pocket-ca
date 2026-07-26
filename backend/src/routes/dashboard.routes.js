/**
 * routes/dashboard.routes.js — Dashboard API Routes
 * Pocket C.A. Backend
 *
 * All routes are protected by the JWT auth middleware.
 * Base path: /api/dashboard
 */

const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const {
  getSummary,
  getMonthlyTrend,
  getCategoryBreakdown,
  getRecentTransactions,
} = require('../controllers/dashboard.controller');

// ─── Apply auth guard to ALL dashboard routes ─────────────────────────────────
router.use(protect);

// ─── Analytics Endpoints ──────────────────────────────────────────────────────
router.get('/summary',              getSummary);
router.get('/monthly-trend',        getMonthlyTrend);
router.get('/category-breakdown',   getCategoryBreakdown);
router.get('/recent-transactions',  getRecentTransactions);

module.exports = router;
