/**
 * services/aiService.js — AI Accounting Assistant Service
 * Pocket C.A. Frontend
 *
 * Handles HTTP requests to the backend /api/ai endpoints.
 */

import api from './api';

// ─── Send Chat Message to AI Assistant ────────────────────────────────────────
export const sendChatMessage = async (prompt, history = []) => {
  const res = await api.post('/ai/chat', { prompt, history });
  return res.data; // { success: true, message: '...', data: { reply: '...' } }
};
