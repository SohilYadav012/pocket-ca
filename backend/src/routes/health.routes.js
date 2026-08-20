/**
 * routes/health.routes.js — Health Check Route
 * Pocket C.A. Backend
 *
 * Provides a lightweight endpoint for uptime monitoring,
 * deployment health checks, and load balancer probes.
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Returns API status and server info.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    message: 'Pocket C.A. API is running smoothly!',
  });
});

module.exports = router;
