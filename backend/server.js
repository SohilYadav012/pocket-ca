/**
 * server.js — Entry Point
 * Pocket C.A. Backend
 *
 * Starts the HTTP server and connects to MongoDB.
 * All Express configuration lives in app.js.
 */

const app = require('./app');
const connectDB = require('./src/config/db');
const { PORT, NODE_ENV } = require('./src/config/env');

// ─── Graceful Shutdown Handler ────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Rejection / Exception Guards ───────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
  process.exit(1);
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║        Pocket C.A. API Server            ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Status  : Running                       ║`);
    console.log(`║  Port    : ${PORT}                          ║`);
    console.log(`║  Mode    : ${NODE_ENV.padEnd(10)}                ║`);
    console.log(`║  Health  : /api/health                   ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
  });

  return server;
};

bootstrap();
