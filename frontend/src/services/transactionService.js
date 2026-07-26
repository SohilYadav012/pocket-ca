/**
 * services/transactionService.js — Transaction API Service
 * Pocket C.A. Frontend
 *
 * All Axios calls for the transaction API.
 * Every method returns the response data directly (not the Axios wrapper).
 */

import api from './api';

// ─── Create transaction ───────────────────────────────────────────────────────
export const createTransaction = async (data) => {
  const res = await api.post('/transactions', data);
  return res.data;
};

// ─── List transactions (with query params) ────────────────────────────────────
export const listTransactions = async (params = {}) => {
  // Remove empty/undefined params
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  const res = await api.get('/transactions', { params: cleanParams });
  return res.data; // { success, message, data: [...], pagination: {...} }
};

// ─── Get single transaction ───────────────────────────────────────────────────
export const getTransaction = async (id) => {
  const res = await api.get(`/transactions/${id}`);
  return res.data;
};

// ─── Update transaction ───────────────────────────────────────────────────────
export const updateTransaction = async (id, data) => {
  const res = await api.put(`/transactions/${id}`, data);
  return res.data;
};

// ─── Delete transaction ───────────────────────────────────────────────────────
export const deleteTransaction = async (id) => {
  const res = await api.delete(`/transactions/${id}`);
  return res.data;
};
