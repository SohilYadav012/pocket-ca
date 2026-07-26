/**
 * middlewares/notFound.middleware.js — 404 Handler
 * Pocket C.A. Backend
 *
 * Catches any request that didn't match a registered route
 * and returns a consistent 404 JSON response.
 * Must be registered AFTER all routes but BEFORE errorHandler.
 */

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.errorCode = 'ROUTE_NOT_FOUND';
  next(error);
};

module.exports = notFound;
