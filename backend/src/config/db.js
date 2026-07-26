/**
 * config/db.js — MongoDB Connection
 * Pocket C.A. Backend
 *
 * Establishes a Mongoose connection to MongoDB Atlas.
 * Called once during server bootstrap. Connection events
 * are logged for observability.
 *
 * In development, a placeholder URI will warn but not crash the server.
 * Replace MONGODB_URI in .env with your real Atlas connection string.
 */

const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');

// Detect placeholder URIs (not real Atlas connections)
const isPlaceholderURI = (uri) =>
  uri.includes('<username>') ||
  uri.includes('<password>') ||
  uri.includes('your_') ||
  uri === '';

const connectDB = async () => {
  // ── Placeholder URI guard ───────────────────────────────────────────────
  if (isPlaceholderURI(MONGODB_URI)) {
    console.warn('');
    console.warn('⚠️  [Database] MONGODB_URI is a placeholder!');
    console.warn('    Update backend/.env with your real MongoDB Atlas connection string.');
    console.warn('    Get a free cluster at: https://www.mongodb.com/atlas');
    console.warn('    Server will start, but database features will not work.\n');
    return null; // Allow server to start without DB in dev
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    if (NODE_ENV === 'development') {
      mongoose.set('debug', false);
    }

    const conn = await mongoose.connect(MONGODB_URI, options);

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB Disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB Reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB Error:', err.message);
    });

    return conn;
  } catch (error) {
    console.error('[Database] Connection Failed:', error.message);
    console.error(
      '[Database] Ensure MONGODB_URI in .env is correct and your IP is whitelisted in Atlas.'
    );

    // In production, crash the server — DB is required
    // In development, warn and continue
    if (NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('[Database] Running without database in development mode.');
      return null;
    }
  }
};

module.exports = connectDB;
