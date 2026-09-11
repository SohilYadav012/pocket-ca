/**
 * controllers/ai.controller.js — AI Request Handlers
 * Pocket C.A. Backend
 */

const aiService = require('../services/ai.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
const chat = asyncHandler(async (req, res) => {
  const { prompt, history, stream } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new ApiError(400, 'A valid text prompt is required.', 'INVALID_PROMPT');
  }

  const sanitizedPrompt = prompt.trim();
  if (sanitizedPrompt.length > 1000) {
    throw new ApiError(400, 'Prompt exceeds 1000 characters.', 'PROMPT_TOO_LONG');
  }

  let sanitizedHistory = [];
  if (history && Array.isArray(history)) {
    sanitizedHistory = history
      .filter((msg) => msg && typeof msg.text === 'string')
      .map((msg) => ({ sender: msg.sender, text: msg.text.trim().slice(0, 1000) }));
  }

  if (stream) {
    // SSE Streaming Setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const streamGenerator = aiService.generateFinancialResponseStream(req.user._id, sanitizedPrompt, sanitizedHistory);
      for await (const chunk of streamGenerator) {
        // Send each chunk as an SSE message
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  } else {
    // Standard JSON Response
    const reply = await aiService.generateFinancialResponse(req.user._id, sanitizedPrompt, sanitizedHistory);
    return ApiResponse.success(res, 200, 'AI response generated successfully', { reply });
  }
});

module.exports = {
  chat,
};
