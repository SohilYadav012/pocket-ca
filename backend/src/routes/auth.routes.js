/**
 * routes/auth.routes.js — Authentication Routes
 * Pocket C.A. Backend
 *
 * Mounts endpoints for account registration, login, and profile fetching.
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authRateLimiter } = require('../middlewares/rateLimiter.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// ─── Public Routes (Rate-limited & Validated) ─────────────────────────────────
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

// ─── Protected Routes (JWT required) ──────────────────────────────────────────
router.get('/me', protect, authController.getMe);

module.exports = router;
