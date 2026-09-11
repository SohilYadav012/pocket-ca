/**
 * services/ai.service.js — AI Integration Service (Gemini API)
 * Pocket C.A. Backend
 */

const { readData } = require('./dataStore');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure the API key is present
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[AI Service] WARNING: GEMINI_API_KEY is missing from environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'MISSING_API_KEY');

// We return an AsyncGenerator so the controller can stream it via SSE.
// This keeps this service perfectly modular!
async function* generateFinancialResponseStream(userId, prompt, history = []) {
  const db = readData();
  const userTxs = db.transactions ? db.transactions.filter(t => t.user === userId) : [];
  const userBudgets = db.budgets ? db.budgets.filter(b => b.user === userId) : [];
  const userGoals = db.goals ? db.goals.filter(g => g.user === userId) : [];

  let totalIncome = 0;
  let totalExpense = 0;
  const categorySpending = {};

  userTxs.forEach(t => {
    const amt = Number(t.amount);
    if (t.type === 'Income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      categorySpending[t.category] = (categorySpending[t.category] || 0) + amt;
    }
  });

  const budgetsContext = userBudgets.map(b => {
    const spent = categorySpending[b.category] || 0;
    const limit = Number(b.monthlyLimit || b.limitAmount) || 0;
    return `- ${b.category}: Limit ₹${limit}, Spent ₹${spent}, Remaining ₹${limit - spent}`;
  }).join('\\n');

  const goalsContext = userGoals.map(g => {
    return `- ${g.name || g.title}: Target ₹${g.targetAmount}, Saved ₹${g.currentAmount || 0}`;
  }).join('\\n');

  const recentTxs = userTxs.slice(0, 15).map(t => {
    const date = t.transactionDate ? t.transactionDate.split('T')[0] : t.createdAt.split('T')[0];
    return `- ${date} | ${t.type} | ${t.category} | ₹${t.amount} | ${t.description || 'No desc'}`;
  }).join('\\n');

  const systemPrompt = `You are "Pocket C.A.", a highly intelligent, empathetic, and professional AI Chartered Accountant.
Your goal is to provide personalized financial advice based on the user's LIVE data provided below.

### USER'S LIVE FINANCIAL DATA
**Overall Summary:**
- Net Balance: ₹${totalIncome - totalExpense}
- Total Income: ₹${totalIncome}
- Total Expense: ₹${totalExpense}

**Category Spending (Expenses):**
${Object.entries(categorySpending).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\\n') || '- None'}

**Active Budgets (Limits):**
${budgetsContext || '- No budgets set'}

**Savings Goals:**
${goalsContext || '- No goals set'}

**Recent Transactions (Last 15):**
${recentTxs || '- No transactions yet'}

Please answer the user's questions accurately using ONLY the data provided above. Do not make up financial numbers or ask the user to input them manually. Format your response in clean Markdown. Be concise and conversational.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: systemPrompt
    });

    // Format history for Gemini SDK
    // Gemini uses "user" and "model" as roles
    const formattedHistory = history.map(msg => ({
      role: (msg.sender === 'user' || msg.role === 'user') ? 'user' : 'model',
      parts: [{ text: msg.text || '' }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    // Start streaming the response
    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    console.error('[Gemini API Error]:', error.message);
    yield `### 💡 Error\n\n**Cannot connect to Gemini API.**\nMake sure GEMINI_API_KEY is configured correctly.\n\n*Error details: ${error.message}*`;
  }
}

// Keep the non-streaming one just in case, but controller will use stream
const generateFinancialResponse = async (userId, prompt, history = []) => {
  let fullResponse = '';
  for await (const chunk of generateFinancialResponseStream(userId, prompt, history)) {
    fullResponse += chunk;
  }
  return fullResponse;
};

module.exports = {
  generateFinancialResponseStream,
  generateFinancialResponse,
};
