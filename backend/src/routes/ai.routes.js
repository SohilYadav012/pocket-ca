/**
 * routes/ai.routes.js — AI Assistant API Routes
 * Pocket C.A. Backend
 *
 * All routes are protected by JWT authentication and user-scoped rate limiting.
 * Base path: /api/ai
 */

const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const { aiRateLimiter } = require('../middlewares/rateLimiter.middleware');
const { chat } = require('../controllers/ai.controller');

// ─── Apply auth guard and AI rate limiter to all routes in this router ────────
router.use(protect);
router.use(aiRateLimiter);

// ─── Endpoints ────────────────────────────────────────────────────────────────
router.post('/chat', chat);

module.exports = router;
