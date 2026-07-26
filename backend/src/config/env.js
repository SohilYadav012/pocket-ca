/**
 * config/env.js — Environment Configuration
 * Pocket C.A. Backend
 *
 * Single source of truth for all environment variables.
 * Validates required variables at startup and provides defaults.
 */

require('dotenv').config();

const requiredVars = ['MONGODB_URI'];

// Validate required environment variables
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `[Config] Missing required environment variables: ${missingVars.join(', ')}`
  );
  console.error('[Config] Please copy .env.example to .env and fill in values.');
  process.exit(1);
}

module.exports = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  MONGODB_URI: process.env.MONGODB_URI,

  // Authentication (to be used in future auth module)
  JWT_SECRET: process.env.JWT_SECRET || 'pocket_ca_default_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // AI (to be used in future AI module)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
