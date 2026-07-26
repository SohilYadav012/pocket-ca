/**
 * middlewares/errorHandler.middleware.js — Global Error Handler
 * Pocket C.A. Backend
 *
 * Catches all errors passed to next(error) and formats them
 * into a consistent JSON response envelope.
 * Must be the LAST middleware registered in app.js.
 */

const { NODE_ENV } = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || [];

  // ─── Mongoose Validation Error ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ─── Mongoose Cast Error (Invalid ObjectId) ───────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid value for field: ${err.path}`;
  }

  // ─── Mongoose Duplicate Key ───────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists`;
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'SESSION_EXPIRED';
    message = 'Your session has expired. Please log in again';
  }

  // ─── Log error in development ─────────────────────────────────────────────
  if (NODE_ENV === 'development') {
    console.error('[ErrorHandler]', {
      statusCode,
      errorCode,
      message,
      stack: err.stack,
    });
  }

  // ─── Send response ────────────────────────────────────────────────────────
  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details.length > 0 && { details }),
    },
  };

  // Include stack trace only in development
  if (NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
