/**
 * services/ai.service.js — AI Accounting Assistant Service
 * Pocket C.A. Backend
 *
 * Integrates with Google Gemini (@google/genai) to answer user financial questions.
 *
 * Features:
 * 1. Strict User Scoping: Fetches ONLY the authenticated user's financial metrics.
 * 2. Prompt Optimization: Formats concise financial context (summary, categories, trends, recent tx).
 * 3. Resilient Error Handling: Automatically falls back to an intelligent local financial
 *    rule engine if the Gemini API key is missing/placeholder or if API limits occur.
 * 4. Structured Output: Returns clean Markdown-formatted responses for all 8 required topics.
 */

const { GoogleGenAI } = require('@google/genai');
const dashboardService = require('./dashboard.service');
const Transaction = require('../models/Transaction.model');
const { GEMINI_API_KEY } = require('../config/env');

// ─── Intelligent Local Financial Rule Engine (Fallback & Demo Mode) ───────────
const generateFallbackAnalysis = (prompt, summary, categories, recentTx, monthlyTrend = []) => {
  const p = prompt.toLowerCase();

  const balance    = summary.totalBalance        || 0;
  const income     = summary.totalIncome         || 0;
  const expense    = summary.totalExpense        || 0;
  const curInc     = summary.currentMonthIncome  || 0;
  const curExp     = summary.currentMonthExpense || 0;
  const topCat     = categories[0]               || { category: 'none', totalAmount: 0, percentage: 0 };
  const highestExp = summary.highestExpense      || null;
  const highestInc = summary.highestIncome       || null;

  const savingsRate = income > 0 ? (((income - expense) / income) * 100).toFixed(1) : 0;

  // 1. Spending this month
  if (p.includes('spend') && (p.includes('month') || p.includes('much') || p.includes('how'))) {
    return `### 📅 Current Month Financial Overview

You have spent **₹${curExp.toLocaleString()}** so far this month, compared to an income of **₹${curInc.toLocaleString()}**.

* **Net Monthly Cash Flow**: ${curInc >= curExp ? '🟢 +' : '🔴 -'}₹${Math.abs(curInc - curExp).toLocaleString()}
* **Top Spending Category**: **${topCat.category.toUpperCase()}** (₹${topCat.totalAmount.toLocaleString()} — ${topCat.percentage}% of total expenses)

> **💡 C.A. Tip**: Maintain your monthly spending below 70% of your income to build a solid 6-month emergency fund.`;
  }

  // 2. Biggest expense category
  if (p.includes('category') || p.includes('biggest') || p.includes('most') || p.includes('where')) {
    if (categories.length === 0) {
      return `You currently have no recorded expenses. Start adding transactions to see your spending category breakdown!`;
    }
    let tableRows = categories
      .slice(0, 5)
      .map((c, i) => `| ${i + 1} | **${c.category.toUpperCase()}** | ₹${c.totalAmount.toLocaleString()} | ${c.percentage}% | ${c.count} |`)
      .join('\n');

    return `### 📊 Expense Breakdown by Category

Your biggest spending category is **${topCat.category.toUpperCase()}**, totaling **₹${topCat.totalAmount.toLocaleString()}** (${topCat.percentage}% of all expenses).

| Rank | Category | Amount (₹) | Share (%) | Transactions |
| :---: | :--- | :--- | :---: | :---: |
${tableRows}

> **💡 C.A. Tip**: Reviewing your #1 category (**${topCat.category.toUpperCase()}**) is the fastest way to identify immediate cost-cutting opportunities.`;
  }

  // 3. Financial summary
  if (p.includes('summary') || p.includes('overview') || p.includes('finances') || p.includes('status')) {
    return `### 💼 Pocket C.A. Executive Summary

Here is the complete overview of your personal finances:

| Financial Metric | Amount (₹) | Status / Details |
| :--- | :---: | :--- |
| **Net Balance** | **₹${balance.toLocaleString()}** | ${balance >= 0 ? '🟢 Positive Net Worth' : '🔴 Deficit Balance'} |
| **Total Income** | ₹${income.toLocaleString()} | All-time recorded earnings |
| **Total Expenses** | ₹${expense.toLocaleString()} | All-time recorded spending |
| **Overall Savings Rate**| **${savingsRate}%** | ${savingsRate >= 20 ? '🌟 Excellent (>20%)' : '⚠️ Needs Improvement (<20%)'} |
| **Total Transactions** | ${summary.totalTransactions} | Total tracked records |

#### 🏆 Highlights
* **Highest Single Earned**: ${highestInc ? `₹${highestInc.amount.toLocaleString()} (${highestInc.description})` : 'None'}
* **Highest Single Spent**: ${highestExp ? `₹${highestExp.amount.toLocaleString()} (${highestExp.description})` : 'None'}

> **💡 C.A. Advice**: Your overall savings rate is **${savingsRate}%**. Aim to consistently direct at least 20% of income into high-yield investments or term deposits.`;
  }

  // 4. Reduce spending / advice
  if (p.includes('reduce') || p.includes('save') || p.includes('cut') || p.includes('tip') || p.includes('advice')) {
    return `### ✂️ Actionable Cost-Reduction Strategies

Based on your spending patterns (Total Expenses: **₹${expense.toLocaleString()}**), here are personalized recommendations to optimize your cash flow:

1. **Target Your Largest Outflow (**${topCat.category.toUpperCase()}**)**: Since this category accounts for **${topCat.percentage}%** (₹${topCat.totalAmount.toLocaleString()}) of your spending, even a 10% reduction here saves you **₹${(topCat.totalAmount * 0.1).toLocaleString()}** immediately.
2. **Audit Recurring Subscriptions & Utilities**: Check your recent transactions for auto-debits that you may no longer actively use.
3. **Implement the 30-Day Rule**: For discretionary shopping or entertainment expenses above ₹2,000, wait 30 days before making the purchase.
4. **Automate Savings**: Transfer 20% of your income (approx. **₹${(income * 0.2).toLocaleString()}**) to a separate savings or SIP account the day you receive your salary.`;
  }

  // 5. Compare this month with last month
  if (p.includes('compare') || p.includes('last month') || p.includes('versus') || p.includes('vs') || p.includes('previous')) {
    const len = monthlyTrend.length;
    const current  = len >= 1 ? monthlyTrend[len - 1] : { fullDate: 'Current Month', income: curInc, expense: curExp };
    const previous = len >= 2 ? monthlyTrend[len - 2] : { fullDate: 'Previous Month', income: 0, expense: 0 };

    const expDiff = current.expense - previous.expense;
    const incDiff = current.income - previous.income;

    return `### 🔄 Monthly Financial Comparison

Here is how your current month (**${current.fullDate}**) compares to last month (**${previous.fullDate}**):

| Metric | Last Month (${previous.fullDate}) | This Month (${current.fullDate}) | Variance (Change) |
| :--- | :---: | :---: | :--- |
| **Income** | ₹${previous.income.toLocaleString()} | **₹${current.income.toLocaleString()}** | ${incDiff >= 0 ? '🟢 +' : '🔴 -'}₹${Math.abs(incDiff).toLocaleString()} |
| **Expenses** | ₹${previous.expense.toLocaleString()} | **₹${current.expense.toLocaleString()}** | ${expDiff <= 0 ? '🟢 -' : '🔴 +'}₹${Math.abs(expDiff).toLocaleString()} (${expDiff <= 0 ? 'Lower' : 'Higher'}) |
| **Net Cash Flow** | ₹${(previous.income - previous.expense).toLocaleString()} | **₹${(current.income - current.expense).toLocaleString()}** | Current Savings: ₹${Math.max(0, current.income - current.expense).toLocaleString()} |

> **💡 C.A. Insight**: You spent **${expDiff <= 0 ? `₹${Math.abs(expDiff).toLocaleString()} less` : `₹${expDiff.toLocaleString()} more`}** this month compared to the previous month. Keep monitoring discretionary categories to maintain positive cash flow.`;
  }

  // 6. Show spending trends
  if (p.includes('trend') || p.includes('chart') || p.includes('pattern') || p.includes('over time') || p.includes('history')) {
    if (monthlyTrend.length === 0) {
      return `No historical monthly trends recorded yet. As you log transactions over time, your 6-month trajectory will appear here!`;
    }
    const trendRows = monthlyTrend
      .slice(-6)
      .map((m) => {
        const net = m.income - m.expense;
        const status = net >= 0 ? '🟢 Surplus' : '🔴 Deficit';
        return `| **${m.fullDate}** | ₹${m.income.toLocaleString()} | ₹${m.expense.toLocaleString()} | **${net >= 0 ? '+' : '-'}₹${Math.abs(net).toLocaleString()}** | ${status} |`;
      })
      .join('\n');

    return `### 📈 6-Month Financial Trajectory & Trends

Here is the chronological breakdown of your income and spending patterns:

| Month | Total Income (₹) | Total Expense (₹) | Net Cash Flow | Status |
| :--- | :---: | :---: | :---: | :--- |
${trendRows}

> **💡 C.A. Tip**: Look for seasonal spikes in your spending trend table above to plan ahead for recurring annual or quarterly bills.`;
  }

  // 7. Highest transactions
  if (p.includes('highest') || p.includes('top tx') || p.includes('big') || p.includes('maximum') || p.includes('peak')) {
    return `### 🏆 Highest Recorded Transactions

Here are your all-time peak financial inflows and outflows:

* 🔴 **Highest Single Expense**:
  * **Amount**: **₹${highestExp ? highestExp.amount.toLocaleString() : 0}**
  * **Description**: ${highestExp ? highestExp.description : 'N/A'}
  * **Category**: ${highestExp ? highestExp.category.toUpperCase() : 'N/A'}
  * **Date**: ${highestExp ? highestExp.transactionDate.toISOString().split('T')[0] : 'N/A'}

* 🟢 **Highest Single Income**:
  * **Amount**: **₹${highestInc ? highestInc.amount.toLocaleString() : 0}**
  * **Description**: ${highestInc ? highestInc.description : 'N/A'}
  * **Category**: ${highestInc ? highestInc.category.toUpperCase() : 'N/A'}
  * **Date**: ${highestInc ? highestInc.transactionDate.toISOString().split('T')[0] : 'N/A'}`;
  }

  // 8. Suggest a budget
  if (p.includes('budget') || p.includes('plan') || p.includes('50/30/20') || p.includes('allocat')) {
    const baseIncome = curInc > 0 ? curInc : (income > 0 ? income : 50000);
    const needs    = Math.round(baseIncome * 0.50);
    const wants    = Math.round(baseIncome * 0.30);
    const savings  = Math.round(baseIncome * 0.20);

    return `### 📐 Suggested Monthly Budget Plan (50/30/20 Rule)

Based on a benchmark monthly income of **₹${baseIncome.toLocaleString()}**, here is your recommended wealth-building budget allocation:

| Bucket | Allocation | Recommended Target (₹) | Actual Spending / Focus |
| :--- | :---: | :---: | :--- |
| 🏠 **Needs** (Essential) | **50%** | **₹${needs.toLocaleString()}** | Rent, groceries, utilities, insurance, basic healthcare |
| 🎬 **Wants** (Lifestyle) | **30%** | **₹${wants.toLocaleString()}** | Dining out, entertainment, shopping, hobbies, travel |
| 📈 **Savings & Investments** | **20%** | **₹${savings.toLocaleString()}** | Emergency fund, mutual funds (SIP), PPF, debt reduction |

> **💡 C.A. Tip**: Your current monthly expense is **₹${curExp.toLocaleString()}**. Keep your combined Needs + Wants within **₹${(needs + wants).toLocaleString()}** to meet your 20% savings goal!`;
  }

  // Default intelligent response
  return `### 👋 Hello from Pocket C.A.!

I have analyzed your financial records. Here is a quick snapshot of where you stand today:

* 💰 **Current Net Balance**: **₹${balance.toLocaleString()}**
* 📥 **Total Earned**: ₹${income.toLocaleString()}
* 📤 **Total Spent**: ₹${expense.toLocaleString()}
* 🔝 **Top Spending Area**: **${topCat.category.toUpperCase()}** (₹${topCat.totalAmount.toLocaleString()})

#### 💬 How can I assist you further?
Try asking me questions like:
* *"How much did I spend this month?"*
* *"What is my biggest expense category?"*
* *"Compare this month with last month."*
* *"Show my spending trends."*
* *"Suggest a monthly budget plan."*`;
};

// ─── Main AI Service Method ───────────────────────────────────────────────────
const generateFinancialResponse = async (userId, prompt, history = []) => {
  // 1. Fetch scoped user financial context in parallel
  const [summary, categories, recentTxDocs, monthlyTrend] = await Promise.all([
    dashboardService.getSummary(userId),
    dashboardService.getCategoryBreakdown(userId),
    Transaction.find({ user: userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(15)
      .select('type category amount description transactionDate paymentMethod')
      .lean(),
    dashboardService.getMonthlyTrend(userId),
  ]);

  // Format concise transaction list for LLM context
  const recentTxText = recentTxDocs
    .map((t) => `${t.transactionDate.toISOString().split('T')[0]} | [${t.type}] ${t.category.toUpperCase()}: ₹${t.amount} (${t.description || 'no description'}, via ${t.paymentMethod})`)
    .join('\n');

  const categoriesText = categories
    .map((c) => `${c.category.toUpperCase()}: ₹${c.totalAmount} (${c.percentage}%, ${c.count} tx)`)
    .join(', ');

  const trendsText = monthlyTrend
    .map((m) => `${m.fullDate}: Income ₹${m.income}, Expense ₹${m.expense}`)
    .join('; ');

  // 2. Check if a live Gemini API key is configured
  const hasLiveKey = GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '' && GEMINI_API_KEY !== 'your_google_gemini_api_key_here';

  if (!hasLiveKey) {
    // Graceful fallback when API key is unconfigured or in demo mode
    return generateFallbackAnalysis(prompt, summary, categories, recentTxDocs, monthlyTrend);
  }

  // 3. Prepare Gemini LLM Prompt & System Instructions
  const systemInstruction = `You are Pocket C.A., an expert Chartered Accountant and AI financial assistant built into a personal finance web app.
Your job is to provide accurate, professional, insightful, and friendly financial advice based ONLY on the user's transaction records and summary below.

### USER FINANCIAL CONTEXT (STRICTLY CONFIDENTIAL TO THIS USER):
- Total Net Balance: ₹${summary.totalBalance}
- Total All-Time Income: ₹${summary.totalIncome}
- Total All-Time Expense: ₹${summary.totalExpense}
- Current Month Income: ₹${summary.currentMonthIncome}
- Current Month Expense: ₹${summary.currentMonthExpense}
- Highest Expense Transaction: ${summary.highestExpense ? `₹${summary.highestExpense.amount} (${summary.highestExpense.description}, Category: ${summary.highestExpense.category})` : 'None'}
- Highest Income Transaction: ${summary.highestIncome ? `₹${summary.highestIncome.amount} (${summary.highestIncome.description}, Category: ${summary.highestIncome.category})` : 'None'}
- Expense Category Breakdown: ${categoriesText || 'None recorded'}
- 6-Month Trajectory & Trends: ${trendsText || 'None recorded'}
- Recent 15 Transactions:
${recentTxText || 'None recorded'}

### GUIDANCE RULES:
1. Use Markdown formatting (tables, bold text, bullet points, and headers) to make financial data clean and readable.
2. Be concise and actionable. Provide practical financial or accounting tips (e.g. 50/30/20 budgeting, tax savings, cash flow optimization) when appropriate.
3. Never invent transactions or figures not present in the context above. If asked about something not recorded, politely explain that no data exists in their records.
4. Keep a helpful, encouraging tone suitable for a senior Chartered Accountant advising a client.`;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Format conversation history if provided
    let contentsText = `${systemInstruction}\n\n### USER QUESTION:\n${prompt}`;
    if (history && Array.isArray(history) && history.length > 0) {
      const histText = history
        .slice(-6) // keep last 6 turns for brevity & token efficiency
        .map((h) => `${h.sender === 'user' ? 'User' : 'Pocket C.A.'}: ${h.text}`)
        .join('\n\n');
      contentsText = `${systemInstruction}\n\n### CONVERSATION HISTORY:\n${histText}\n\n### CURRENT USER QUESTION:\n${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contentsText,
    });

    const reply = response.text;
    if (!reply) {
      throw new Error('Empty response received from Gemini LLM');
    }

    return reply;
  } catch (err) {
    // Graceful error handling: log warning and fallback to local analysis without crashing
    console.warn(`[AI Service] Gemini API call failed (${err.message}). Switching to local fallback rule engine.`);
    return generateFallbackAnalysis(prompt, summary, categories, recentTxDocs, monthlyTrend);
  }
};

module.exports = {
  generateFinancialResponse,
  generateFallbackAnalysis,
};
