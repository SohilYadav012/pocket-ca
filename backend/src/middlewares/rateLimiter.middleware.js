/**
 * middlewares/rateLimiter.middleware.js — API Rate Limiter
 * Pocket C.A. Backend
 *
 * Implements rate limiting for AI and sensitive endpoints using express-rate-limit.
 * Scoped by authenticated user ID (or IP as fallback) to prevent free-tier abuse.
 */

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const ApiResponse = require('../utils/ApiResponse');

// ─── AI Endpoint Rate Limiter (20 requests per 15 mins per user) ──────────────
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // limit each user to 10 AI requests per windowMs
  standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
  validate: { xForwardedForHeader: false },
  keyGenerator: (req, res) => {
    // Scoped per authenticated user ID if available, otherwise IP
    return req.user ? req.user._id.toString() : ipKeyGenerator(req, res);
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'AI rate limit exceeded (max 10 requests per 15 minutes). Please try again later.',
      },
    });
  },
});

// ─── Authentication Rate Limiter (15 attempts per 15 mins per IP) ─────────────
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                  // limit each IP to 15 auth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      },
    });
  },
});

module.exports = {
  aiRateLimiter,
  authRateLimiter,
};

