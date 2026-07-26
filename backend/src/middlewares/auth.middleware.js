/**
 * middlewares/auth.middleware.js — JWT Authentication Guard
 * Pocket C.A. Backend
 *
 * Verifies the Bearer token in the Authorization header.
 * Attaches the decoded user payload to req.user for use in controllers.
 * Throws ApiError(401) for missing, invalid, or expired tokens.
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User.model');

const protect = asyncHandler(async (req, res, next) => {
  // ── 1. Extract token from Authorization header ────────────────────────────
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please log in.', 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Authentication token is missing.', 'UNAUTHORIZED');
  }

  // ── 2. Verify token ───────────────────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your session has expired. Please log in again.', 'SESSION_EXPIRED');
    }
    throw new ApiError(401, 'Invalid authentication token.', 'UNAUTHORIZED');
  }

  // ── 3. Confirm user still exists in DB ───────────────────────────────────
  const user = await User.findById(decoded.userId).select('-passwordHash');
  if (!user) {
    throw new ApiError(401, 'The user associated with this token no longer exists.', 'UNAUTHORIZED');
  }

  // ── 4. Attach user to request ─────────────────────────────────────────────
  req.user = user;
  next();
});

module.exports = { protect };
