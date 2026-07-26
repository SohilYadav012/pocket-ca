/**
 * controllers/ocr.controller.js — OCR Receipt Scanner Controller
 * Pocket C.A. Backend
 *
 * Handles HTTP requests for OCR receipt scanning and data extraction.
 */

const ocrService = require('../services/ocr.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// ─── POST /api/ocr/scan ───────────────────────────────────────────────────────
const scan = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new ApiError(
        400,
        'Please upload a valid receipt image (JPG, PNG, WEBP) under 5MB.',
        'NO_FILE_UPLOADED'
      );
    }

    const ocrResult = await ocrService.scanReceipt(req.file.buffer, req.file.mimetype);
    return ApiResponse.success(res, 200, 'Receipt scanned and parsed successfully', ocrResult);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scan,
};
