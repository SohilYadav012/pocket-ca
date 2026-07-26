/**
 * routes/ocr.routes.js — OCR Scanner Routes
 * Pocket C.A. Backend
 *
 * Defines JWT-protected endpoint for receipt image upload and OCR extraction.
 */

const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocr.controller');
const { protect } = require('../middlewares/auth.middleware');
const { handleReceiptUpload } = require('../middlewares/upload.middleware');

// Protected OCR scan endpoint
router.post('/scan', protect, handleReceiptUpload, ocrController.scan);

module.exports = router;
