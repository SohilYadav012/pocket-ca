/**
 * services/ocrService.js — OCR Receipt Scanner API Service
 * Pocket C.A. Frontend
 *
 * Handles multipart/form-data receipt image uploads to /api/ocr/scan.
 */

import api from './api';

/**
 * Upload receipt image for OCR scanning and heuristic extraction.
 * @param {File} file - Receipt image file (jpg, png, webp)
 * @param {Function} [onUploadProgress] - Progress callback function for Axios
 */
export const scanReceipt = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('receipt', file);

  const res = await api.post('/ocr/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return res.data; // { success: true, message: '...', data: { rawText, extracted: { ... } } }
};
