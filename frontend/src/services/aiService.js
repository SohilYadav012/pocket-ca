/**
 * services/aiService.js — AI Accounting Assistant Service
 * Pocket C.A. Frontend
 */

import api from './api';

export const sendChatMessage = async (prompt, history = []) => {
  const res = await api.post('/ai/chat', { prompt, history, stream: false });
  return res.data;
};

// Streaming version using native fetch to read SSE
export const streamChatMessage = async (prompt, history, onChunk) => {
  const token = localStorage.getItem('pca_token'); // Mock token
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const response = await fetch(`${baseURL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ prompt, history, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') return;
        try {
          const data = JSON.parse(dataStr);
          if (data.chunk) {
            onChunk(data.chunk);
          } else if (data.error) {
            throw new Error(data.error);
          }
        } catch (e) {
          // JSON parse error on incomplete chunks
        }
      }
    }
  }
};
