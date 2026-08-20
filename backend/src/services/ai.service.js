/**
 * services/ai.service.js — AI Integration Service (Ollama)
 * Pocket C.A. Backend
 */

// Use native fetch (Node 18+)
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'llama3'; // Standard fallback model

const generateFallbackAnalysis = (prompt, summary, categories, errorMsg = '') => {
  return `### 💡 AI Financial Analysis (Fallback)

**Error connecting to Ollama API:** *${errorMsg}*

> **Tip:** Make sure Ollama is installed and running on your computer, and that you have pulled at least one model (e.g., open a terminal and run \`ollama run llama3\`).

Here is a quick snapshot of your finances:

* 💰 **Current Net Balance**: **₹${summary.totalBalance.toLocaleString()}**
* 📥 **Total Earned**: ₹${summary.totalIncome.toLocaleString()}
* 📤 **Total Spent**: ₹${summary.totalExpense.toLocaleString()}
* 🔝 **Top Spending Area**: **${categories[0]?.category.toUpperCase() || 'N/A'}** (₹${categories[0]?.totalAmount.toLocaleString() || 0})

You asked: *"**${prompt}**"*
`;
};

// Auto-detect a local model to use, fallback to DEFAULT_MODEL
const getAvailableModel = async () => {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        // Filter out embedding models (like all-minilm or nomic-embed)
        const chatModels = data.models.filter(m => {
          const isEmbeddingName = m.name.includes('embed') || m.name.includes('minilm');
          const isEmbeddingOnly = m.capabilities && m.capabilities.length === 1 && m.capabilities[0] === 'embedding';
          return !isEmbeddingName && !isEmbeddingOnly;
        });
        
        if (chatModels.length > 0) {
          return chatModels[0].name;
        }
        return data.models[0].name;
      }
    }
  } catch (err) {
    // Ignore error, return default if API is completely down
  }
  return DEFAULT_MODEL;
};

const generateFinancialResponse = async (userId, prompt, history = []) => {
  // Static mock context
  const summary = { totalBalance: 45000, totalIncome: 120000, totalExpense: 75000 };
  const categories = [{ category: 'housing', totalAmount: 12000, percentage: 57, count: 1 }, { category: 'food', totalAmount: 5000, percentage: 24, count: 15 }];
  
  const systemPrompt = `You are "Pocket C.A.", a highly intelligent, empathetic, and professional AI Chartered Accountant.
Your goal is to provide personalized financial advice based on the user's data.
Current Context:
- Net Balance: ₹${summary.totalBalance}
- Income: ₹${summary.totalIncome}, Expense: ₹${summary.totalExpense}
Please format your response in clean Markdown. Be concise and conversational.`;

  try {
    const modelToUse = await getAvailableModel();
    console.log(`[AI Service] Using Ollama model: ${modelToUse}`);
    
    // Format history for Ollama API
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of history) {
      const role = (msg.sender === 'user' || msg.role === 'user') ? 'user' : 'assistant';
      const content = msg.text || (msg.parts && msg.parts.length > 0 ? msg.parts[0].text : '');
      
      if (content) {
        ollamaMessages.push({ role, content });
      }
    }

    // Add the current prompt
    ollamaMessages.push({ role: 'user', content: prompt });

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelToUse,
        messages: ollamaMessages,
        stream: false, // Wait for full response
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${errData}`);
    }

    const data = await response.json();
    return data.message.content;
    
  } catch (error) {
    console.error('[Ollama API Error]:', error.message);
    return generateFallbackAnalysis(prompt, summary, categories, error.message);
  }
};

module.exports = {
  generateFinancialResponse,
};
