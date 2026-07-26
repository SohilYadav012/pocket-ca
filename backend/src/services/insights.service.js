/**
 * services/insights.service.js — Financial Insights & Health Score Service
 * Pocket C.A. Backend
 *
 * Aggregates budget utilization, savings goal progress, and spending categories
 * to compute a 0-100 Monthly Financial Health Score and generate actionable AI
 * recommendations using Google Gemini (with resilient local fallback rule engine).
 */

const { GoogleGenAI } = require('@google/genai');
const budgetsService = require('./budgets.service');
const goalsService = require('./goals.service');
const dashboardService = require('./dashboard.service');
const { GEMINI_API_KEY } = require('../config/env');

/**
 * Intelligent Local Rule Engine for generating financial insights
 * when Gemini API is unavailable or rate-limited.
 */
const generateFallbackSuggestions = (healthScore, grade, budgetsData, goalsData, dashboardSummary, topCategories) => {
  const suggestions = [];
  const { categoriesExceedingBudget, overallBudgetPercentage } = budgetsData;
  const { activeGoalsCount, overallSavingsPercentage } = goalsData;
  const { currentMonthIncome = 0, currentMonthExpense = 0 } = dashboardSummary || {};

  // 1. Budget Adherence Tip
  if (categoriesExceedingBudget && categoriesExceedingBudget.length > 0) {
    const names = categoriesExceedingBudget.map((b) => `**${b.category.toUpperCase()}**`).join(', ');
    suggestions.push(
      `🔴 **Overbudget Alert**: You have exceeded your monthly spending limit in ${names}. Consider reallocating funds from lower-priority categories for the remainder of this month.`
    );
  } else if (overallBudgetPercentage > 85) {
    suggestions.push(
      `🟡 **Budget Approaching Limit**: You have utilized **${overallBudgetPercentage}%** of your total budgeted limit. Monitor discretionary spending closely over the coming days.`
    );
  } else if (budgetsData.totalBudgeted > 0) {
    suggestions.push(
      `🟢 **Excellent Budget Discipline**: You are comfortably within your monthly spending limits (**${overallBudgetPercentage}%** utilized). Keep up the great financial discipline!`
    );
  } else {
    suggestions.push(
      `💡 **Pro Tip — Set Monthly Budgets**: You haven't defined any category spending limits for this month yet. Creating budgets for high-frequency categories like Food and Rent can boost your savings rate by up to 15%.`
    );
  }

  // 2. Savings Goal Tip
  if (activeGoalsCount > 0) {
    suggestions.push(
      `🎯 **Savings Momentum**: You have accumulated **₹${goalsData.totalSavedAmount.toLocaleString()}** across ${activeGoalsCount} active goal(s) (${overallSavingsPercentage}% overall progress). Setting up an automated weekly deposit can help you reach your targets 20% faster.`
    );
  } else {
    suggestions.push(
      `🛡️ **Emergency Fund Opportunity**: We noticed you don't have any active savings goals. Financial experts recommend building an Emergency Fund goal equal to 3 to 6 months of living expenses.`
    );
  }

  // 3. Cash Flow & Health Score Tip
  if (currentMonthIncome > 0) {
    const netFlow = currentMonthIncome - currentMonthExpense;
    const savingsRate = Math.round((netFlow / currentMonthIncome) * 100);
    if (savingsRate >= 20) {
      suggestions.push(
        `🏆 **Grade ${grade} Financial Health (${healthScore}/100)**: Your monthly savings rate of **${savingsRate}%** aligns perfectly with the golden 50/30/20 wealth-building rule!`
      );
    } else if (savingsRate > 0) {
      suggestions.push(
        `📈 **Grade ${grade} Financial Health (${healthScore}/100)**: You have a positive cash flow this month (**+₹${netFlow.toLocaleString()}**). Try trimming dining and shopping expenses to elevate your savings rate above 20%.`
      );
    } else {
      suggestions.push(
        `⚠️ **Cash Flow Warning**: Your current month expenses exceed your income by **₹${Math.abs(netFlow).toLocaleString()}**. Review your Top Spending Categories to identify immediate cost-cutting opportunities.`
      );
    }
  } else {
    suggestions.push(
      `📊 **Financial Health Score (${healthScore}/100 — Grade ${grade})**: Log your primary monthly income transactions to unlock tailored cash-flow ratios and wealth-building forecasts.`
    );
  }

  // 4. Top Category Insight
  if (topCategories && topCategories.length > 0) {
    const top = topCategories[0];
    suggestions.push(
      `🔍 **Spending Focus**: **${top.category.toUpperCase()}** is your largest outflow this period, accounting for **₹${top.totalAmount.toLocaleString()}** (${top.percentage}% of expenses).`
    );
  }

  return suggestions;
};

/**
 * Generate AI-powered financial suggestions using Google Gemini (@google/genai).
 * Automatically falls back to the local rule engine if Gemini is unavailable.
 */
const getGeminiSuggestions = async (healthScore, grade, budgetsData, goalsData, dashboardSummary, topCategories) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_google_gemini_api_key_here') {
    console.log('[Insights Service] Gemini API Key not found, using Local Rule Engine.');
    return generateFallbackSuggestions(healthScore, grade, budgetsData, goalsData, dashboardSummary, topCategories);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `You are Pocket C.A., an expert AI Chartered Accountant and financial advisor.
Analyze the following financial metrics for the current month and generate exactly 4 actionable, encouraging, and professional financial recommendations formatted as Markdown bullet points. Use emojis for high visual readability.

Context:
- Financial Health Score: ${healthScore}/100 (Grade ${grade})
- Monthly Income: ₹${dashboardSummary?.currentMonthIncome || 0}
- Monthly Expense: ₹${dashboardSummary?.currentMonthExpense || 0}
- Total Budgeted: ₹${budgetsData.totalBudgeted} | Total Spent on Budgets: ₹${budgetsData.totalSpentOnBudgets} (${budgetsData.overallBudgetPercentage}% utilized)
- Categories Exceeding Budget: ${budgetsData.categoriesExceedingBudget.map(b => b.category).join(', ') || 'None'}
- Savings Goals Progress: ₹${goalsData.totalSavedAmount} saved out of ₹${goalsData.totalTargetAmount} target (${goalsData.activeGoalsCount} active goals, ${goalsData.completedGoalsCount} completed)
- Top Expense Categories: ${topCategories.slice(0, 3).map(c => `${c.category} (₹${c.totalAmount})`).join(', ') || 'None'}

Rules:
1. Output ONLY the 4 Markdown bullet points (each starting with * or - and an emoji).
2. Do not include any introductory or concluding text outside the bullet points.
3. Be specific with amounts and percentages from the context.
4. Highlight overbudget categories if any exist; praise good savings rates if present.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const bullets = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('*') || line.startsWith('-'))
      .map((line) => line.replace(/^[\*\-\s]+/, '').trim());

    if (bullets.length > 0) {
      return bullets.slice(0, 4);
    }
    return generateFallbackSuggestions(healthScore, grade, budgetsData, goalsData, dashboardSummary, topCategories);
  } catch (err) {
    console.warn('[Insights Service] Gemini API Error during insights generation, falling back to Local Rule Engine:', err.message);
    return generateFallbackSuggestions(healthScore, grade, budgetsData, goalsData, dashboardSummary, topCategories);
  }
};

// ─── Main: Get Comprehensive Financial Insights ───────────────────────────────
const getFinancialInsights = async (userId) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Fetch budgets for current month
  const budgets = await budgetsService.getBudgets(userId, { month: currentMonth, year: currentYear });
  let totalBudgeted = 0;
  let totalSpentOnBudgets = 0;
  const categoriesExceedingBudget = [];

  budgets.forEach((b) => {
    totalBudgeted += b.monthlyLimit;
    totalSpentOnBudgets += b.spentAmount;
    if (b.spentAmount > b.monthlyLimit) {
      categoriesExceedingBudget.push({
        category: b.category,
        limit: b.monthlyLimit,
        spent: b.spentAmount,
        overspend: Math.round((b.spentAmount - b.monthlyLimit) * 100) / 100,
      });
    }
  });

  const overallBudgetPercentage = totalBudgeted > 0
    ? Math.round((totalSpentOnBudgets / totalBudgeted) * 100)
    : 0;

  const budgetsData = {
    totalBudgeted: Math.round(totalBudgeted * 100) / 100,
    totalSpentOnBudgets: Math.round(totalSpentOnBudgets * 100) / 100,
    overallBudgetPercentage,
    categoriesExceedingBudget,
    totalBudgetsCount: budgets.length,
  };

  // 2. Fetch savings goals
  const goals = await goalsService.getGoals(userId);
  let activeGoalsCount = 0;
  let completedGoalsCount = 0;
  let totalTargetAmount = 0;
  let totalSavedAmount = 0;

  goals.forEach((g) => {
    totalTargetAmount += g.targetAmount;
    totalSavedAmount += g.currentAmount;
    if (g.status === 'Completed') completedGoalsCount++;
    else activeGoalsCount++;
  });

  const overallSavingsPercentage = totalTargetAmount > 0
    ? Math.round((totalSavedAmount / totalTargetAmount) * 100)
    : 0;

  const goalsData = {
    activeGoalsCount,
    completedGoalsCount,
    totalTargetAmount: Math.round(totalTargetAmount * 100) / 100,
    totalSavedAmount: Math.round(totalSavedAmount * 100) / 100,
    overallSavingsPercentage,
  };

  // 3. Fetch dashboard summary & category breakdown
  const dashboardSummary = await dashboardService.getSummary(userId);
  const topCategories = await dashboardService.getCategoryBreakdown(userId);

  // 4. Compute Monthly Financial Health Score (0 - 100)
  let score = 50; // Base score

  // Savings rate component (up to +30 pts or -15 pts)
  const inc = dashboardSummary?.currentMonthIncome || 0;
  const exp = dashboardSummary?.currentMonthExpense || 0;
  if (inc > 0) {
    const savingsRate = ((inc - exp) / inc) * 100;
    if (savingsRate >= 20) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate > 0) score += 10;
    else score -= 15;
  }

  // Budget adherence component (up to +20 pts or -15 pts)
  if (budgets.length > 0) {
    if (categoriesExceedingBudget.length === 0) {
      score += overallBudgetPercentage <= 80 ? 20 : 10;
    } else {
      score -= Math.min(15, categoriesExceedingBudget.length * 5);
    }
  } else {
    score += 10; // Moderate default for no budgets
  }

  // Goal progress component (up to +10 pts)
  if (completedGoalsCount > 0 || overallSavingsPercentage >= 50) {
    score += 10;
  } else if (activeGoalsCount > 0 && totalSavedAmount > 0) {
    score += 5;
  }

  const healthScore = Math.min(100, Math.max(0, Math.round(score)));
  let grade = 'C';
  if (healthScore >= 90) grade = 'A+';
  else if (healthScore >= 80) grade = 'A';
  else if (healthScore >= 70) grade = 'B';
  else if (healthScore >= 60) grade = 'C';
  else grade = 'D';

  // 5. Generate AI Suggestions (Gemini with Local Rule Engine fallback)
  const aiSuggestions = await getGeminiSuggestions(
    healthScore,
    grade,
    budgetsData,
    goalsData,
    dashboardSummary,
    topCategories
  );

  return {
    healthScore,
    grade,
    budgetUtilization: budgetsData,
    categoriesExceedingBudget,
    savingsProgress: goalsData,
    topSpendingCategories: topCategories.slice(0, 5),
    aiSuggestions,
  };
};

module.exports = {
  getFinancialInsights,
};
