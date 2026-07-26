/**
 * utils/asyncHandler.js — Async Controller Wrapper
 * Pocket C.A. Backend
 *
 * Eliminates repetitive try-catch blocks in async route handlers.
 * Any thrown error is automatically passed to next() for the
 * global error handler to process.
 *
 * Usage:
 *   router.get('/example', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json({ data });
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
