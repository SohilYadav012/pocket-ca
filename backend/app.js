/**
 * app.js — Express Application Configuration
 * Pocket C.A. Backend
 *
 * Sets up all middleware, mounts all routes, and applies
 * the global error handler. server.js calls app.listen().
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { FRONTEND_URL, NODE_ENV } = require('./src/config/env');
const errorHandler = require('./src/middlewares/errorHandler.middleware');
const notFound = require('./src/middlewares/notFound.middleware');

// ─── Route Imports ────────────────────────────────────────────────────────────
const healthRoutes      = require('./src/routes/health.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const dashboardRoutes   = require('./src/routes/dashboard.routes');
const aiRoutes          = require('./src/routes/ai.routes');
const ocrRoutes         = require('./src/routes/ocr.routes');
const reportsRoutes     = require('./src/routes/reports.routes');
const budgetsRoutes     = require('./src/routes/budgets.routes');
const goalsRoutes       = require('./src/routes/goals.routes');
const insightsRoutes    = require('./src/routes/insights.routes');
const authRoutes        = require('./src/routes/auth.routes');
const compression       = require('compression');


// ─── App Instance ─────────────────────────────────────────────────────────────
const app = express();

// ─── Response Compression ─────────────────────────────────────────────────────
app.use(compression());

// ─── Security & HTTP Headers (Helmet + CSP) ───────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      connectSrc: ["'self'", "http:", "https:"],
    },
  },
}));

// ─── CORS Policy ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Request Logger ──────────────────────────────────────────────────────
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Static Files (Receipt Uploads) ──────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/health',       healthRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/ocr',          ocrRoutes);
app.use('/api/reports',      reportsRoutes);
app.use('/api/budgets',      budgetsRoutes);
app.use('/api/goals',        goalsRoutes);
app.use('/api/insights',     insightsRoutes);
app.use('/api/auth',         authRoutes);


// ─── 404 Handler (must be after all routes) ───────────────────────────────────
app.use(notFound);

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
