/**
 * controllers/reports.controller.js — Reports & Export Controller
 * Pocket C.A. Backend
 *
 * Handles date range validation, summary aggregation responses, and streaming
 * PDF and Excel file downloads.
 */

const reportsService = require('../services/reports.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Validate date query parameters.
 */
const validateDateRange = (startDate, endDate) => {
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new ApiError(400, 'Invalid startDate format. Use YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
    }
  }
  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new ApiError(400, 'Invalid endDate format. Use YYYY-MM-DD.', 'INVALID_DATE_FORMAT');
    }
  }
  if (startDate && endDate) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new ApiError(400, 'startDate cannot be later than endDate.', 'INVALID_DATE_RANGE');
    }
  }
};

// ─── 1. Get Summary Report ────────────────────────────────────────────────────
const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const reportData = await reportsService.getReportSummary(req.user._id, {
      startDate,
      endDate,
    });

    // Remove allTransactions from JSON summary to keep response lightweight
    const { allTransactions, ...responseData } = reportData;

    return ApiResponse.success(res, 200, 'Financial report summary retrieved successfully.', responseData);
  } catch (err) {
    next(err);
  }
};

// ─── 2. Export Report as PDF ──────────────────────────────────────────────────
const exportPdf = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const reportData = await reportsService.getReportSummary(req.user._id, {
      startDate,
      endDate,
    });

    await reportsService.generatePdfReport(req.user, reportData, { startDate, endDate }, res);
  } catch (err) {
    next(err);
  }
};

// ─── 3. Export Report as Excel ────────────────────────────────────────────────
const exportExcel = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    validateDateRange(startDate, endDate);

    const reportData = await reportsService.getReportSummary(req.user._id, {
      startDate,
      endDate,
    });

    await reportsService.generateExcelReport(req.user, reportData, { startDate, endDate }, res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  exportPdf,
  exportExcel,
};
