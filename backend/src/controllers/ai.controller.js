/**
 * controllers/ai.controller.js — AI Request Handlers
 * Pocket C.A. Backend
 *
 * Handles HTTP requests for AI financial analysis and chat.
 * Enforces input validation and sanitization before delegating to ai.service.js.
 */

const aiService = require('../services/ai.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
const chat = asyncHandler(async (req, res) => {
  const { prompt, history } = req.body;

  // Validate prompt existence & type
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new ApiError(400, 'A valid text prompt is required to generate an AI analysis.', 'INVALID_PROMPT');
  }

  // Enforce length limits to prevent token abuse / prompt injection overflow
  const sanitizedPrompt = prompt.trim();
  if (sanitizedPrompt.length > 1000) {
    throw new ApiError(400, 'Prompt length exceeds maximum allowed limit of 1000 characters.', 'PROMPT_TOO_LONG');
  }

  // Optional history validation
  let sanitizedHistory = [];
  if (history && Array.isArray(history)) {
    sanitizedHistory = history
      .filter((msg) => msg && typeof msg.text === 'string' && (msg.sender === 'user' || msg.sender === 'ai'))
      .map((msg) => ({ sender: msg.sender, text: msg.text.trim().slice(0, 1000) }));
  }

  const reply = await aiService.generateFinancialResponse(req.user._id, sanitizedPrompt, sanitizedHistory);

  return ApiResponse.success(res, 200, 'AI response generated successfully', { reply });
});

module.exports = {
  chat,
};
