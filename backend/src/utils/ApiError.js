/**
 * utils/ApiError.js — Custom API Error Class
 * Pocket C.A. Backend
 *
 * Extends the native Error class with statusCode and errorCode
 * properties so the global error handler can format responses correctly.
 *
 * Usage:
 *   throw new ApiError(404, 'Transaction not found', 'NOT_FOUND');
 *   throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details);
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (e.g., 400, 404, 500)
   * @param {string} message     - Human-readable error description
   * @param {string} errorCode   - Machine-readable error identifier
   * @param {Array}  details     - Optional array of field-level error objects
   */
  constructor(
    statusCode = 500,
    message = 'Internal Server Error',
    errorCode = 'INTERNAL_ERROR',
    details = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Distinguishes from programmer errors

    // Capture stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

module.exports = ApiError;
