/**
 * services/dashboardService.js — Dashboard API Service
 * Pocket C.A. Frontend
 *
 * Handles all HTTP calls to the backend dashboard analytics endpoints.
 * Returns response data directly.
 */

import api from './api';

// ─── Get financial summary ────────────────────────────────────────────────────
export const getSummary = async () => {
  const res = await api.get('/dashboard/summary');
  return res.data; // { success, message, data: { totalBalance, ... } }
};

// ─── Get monthly trend for Bar Chart ──────────────────────────────────────────
export const getMonthlyTrend = async () => {
  const res = await api.get('/dashboard/monthly-trend');
  return res.data; // { success, message, data: [ { month, income, expense }, ... ] }
};

// ─── Get expense category breakdown for Donut Chart ───────────────────────────
export const getCategoryBreakdown = async () => {
  const res = await api.get('/dashboard/category-breakdown');
  return res.data; // { success, message, data: [ { category, totalAmount, percentage, count }, ... ] }
};

// ─── Get recent 5 transactions ────────────────────────────────────────────────
export const getRecentTransactions = async () => {
  const res = await api.get('/dashboard/recent-transactions');
  return res.data; // { success, message, data: [ ... ] }
};
