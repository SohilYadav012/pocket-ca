/**
 * routes/health.routes.js — Health Check Route
 * Pocket C.A. Backend
 *
 * Provides a lightweight endpoint for uptime monitoring,
 * deployment health checks, and load balancer probes.
 */

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

/**
 * GET /api/health
 * Returns API status, database connectivity, and server info.
 */
router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;

  // Mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isHealthy = dbStatus === 1;

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: 'Pocket C.A. API Running',
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatusMap[dbStatus] || 'unknown',
      version: '1.0.0',
      uptime: `${Math.floor(process.uptime())}s`,
    },
  });
});

module.exports = router;
