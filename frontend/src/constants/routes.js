/**
 * constants/routes.js — Route Path Constants
 * Pocket C.A. Frontend
 *
 * Single source of truth for all application route paths.
 * Import this instead of hardcoding path strings in components.
 */

const ROUTES = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',

  // Protected routes
  DASHBOARD: '/',
  TRANSACTIONS: '/transactions',
  BUDGETS: '/budgets',
  GOALS: '/goals',
  INSIGHTS: '/insights',
  AI_CHAT: '/ai-chat',
  OCR_SCANNER: '/ocr-scanner',
  REPORTS: '/reports',
  PROFILE: '/profile',

  // Fallback
  NOT_FOUND: '*',
};

export default ROUTES;
