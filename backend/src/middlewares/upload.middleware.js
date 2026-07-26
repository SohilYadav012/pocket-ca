/**
 * middlewares/upload.middleware.js — Multipart File Upload Handler
 * Pocket C.A. Backend
 *
 * Configures Multer for handling receipt image uploads in memory.
 * Enforces strict file type validation (JPG, PNG, WEBP) and size limits (max 5MB).
 */

const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Use memory storage for direct Buffer access without disk I/O overhead
const storage = multer.memoryStorage();

// Allowed MIME types for OCR scanning
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Unsupported file type. Please upload a valid JPG, PNG, or WEBP receipt image.',
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

/**
 * Wrapper middleware to format Multer errors cleanly into ApiError format
 */
const handleReceiptUpload = (req, res, next) => {
  const singleUpload = upload.single('receipt');

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            400,
            'Receipt image exceeds the maximum allowed file size of 5MB.',
            'FILE_TOO_LARGE'
          )
        );
      }
      return next(new ApiError(400, `Upload error: ${err.message}`, 'UPLOAD_ERROR'));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = {
  handleReceiptUpload,
};
