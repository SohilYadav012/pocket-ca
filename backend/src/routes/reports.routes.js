/**
 * routes/reports.routes.js — Financial Reports & Export Routes
 * Pocket C.A. Backend
 *
 * All endpoints protected by JWT authentication:
 * - GET /api/reports/summary       — Get aggregated report metrics
 * - GET /api/reports/export/pdf    — Stream professional PDF document
 * - GET /api/reports/export/excel  — Stream multi-sheet Excel spreadsheet
 */

const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { protect } = require('../middlewares/auth.middleware');

// Enforce JWT authentication on all report endpoints
router.use(protect);

// Report routes
router.get('/summary', reportsController.getSummary);
router.get('/export/pdf', reportsController.exportPdf);
router.get('/export/excel', reportsController.exportExcel);

module.exports = router;
