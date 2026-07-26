/**
 * scratch/test_budgets_goals_insights.js — Phase 7 Automated Verification Suite
 * Pocket C.A. Backend
 *
 * Verifies:
 * 1. Authentication guards (401 without token)
 * 2. Budget CRUD, negative limit validation, and duplicate budget prevention (400 DUPLICATE_BUDGET)
 * 3. Dynamic spending calculations (spentAmount, remainingAmount, percentageUsed) via transactions
 * 4. Savings Goal CRUD, future date validation, and automatic completion status transition
 * 5. Financial Insights health score algorithm (0-100) and Gemini/fallback suggestions
 * 6. Strict user data isolation between accounts
 */

const path = require('path');
const backendDir = 'c:/Users/yadav/OneDrive/Desktop/POCKET C.A/backend';
process.chdir(backendDir); // Ensure dotenv loads backend/.env
module.paths.push(path.join(backendDir, 'node_modules'));

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { JWT_SECRET } = require(path.join(backendDir, 'src/config/env'));
const User = require(path.join(backendDir, 'src/models/User.model'));
const Transaction = require(path.join(backendDir, 'src/models/Transaction.model'));
const Budget = require(path.join(backendDir, 'src/models/Budget.model'));
const SavingsGoal = require(path.join(backendDir, 'src/models/SavingsGoal.model'));
const app = require(path.join(backendDir, 'app'));

const TEST_PORT = 5005;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

let passedTests = 0;
let totalTests = 0;

const runTest = async (name, testFn) => {
  totalTests++;
  try {
    await testFn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Reason: ${err.message}`);
    if (err.status) {
      console.error(`   Status: ${err.status} — Body:`, JSON.stringify(err.data));
    }
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
};

/**
 * Helper using native Node.js fetch
 */
const request = async (method, endpoint, { body = null, token = null } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return { status: res.status, data };
};

(async () => {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║   Pocket C.A. — Phase 7 (Budgets, Goals & Insights) Test Suite       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  console.log('─── Starting local test HTTP server on port 5005 ───');
  const server = app.listen(TEST_PORT);

  let mongod = null;
  console.log('─── Starting in-memory MongoDB server for isolated testing ───');
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  console.log('─── Connecting Mongoose to in-memory MongoDB ───');
  await mongoose.connect(uri);

  const emailA = `phase7_user_a_${Date.now()}@pocketca.dev`;
  const emailB = `phase7_user_b_${Date.now()}@pocketca.dev`;

  let tokenA = '';
  let tokenB = '';
  let budgetId = '';
  let goalId = '';
  let userA = null;
  let userB = null;

  try {
    // ─── 1. User Setup & Token Signing ────────────────────────────────────────
    await runTest('Create Test Users in DB and generate JWT tokens', async () => {
      userA = await User.create({ name: 'Phase7 User A', email: emailA, passwordHash: 'secret123' });
      userB = await User.create({ name: 'Phase7 User B', email: emailB, passwordHash: 'secret123' });

      tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });
      tokenB = jwt.sign({ userId: userB._id }, JWT_SECRET, { expiresIn: '1h' });

      assert(tokenA && tokenB, 'Tokens should be generated cleanly');
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // ─── 2. Authentication Guards ─────────────────────────────────────────────
    await runTest('Unauthenticated request to GET /api/budgets returns 401', async () => {
      try {
        await request('GET', '/budgets');
        throw new Error('Should have failed with 401');
      } catch (err) {
        assertEqual(err.status, 401, 'Status should be 401 Unauthorized');
      }
    });

    await runTest('Unauthenticated request to GET /api/goals returns 401', async () => {
      try {
        await request('GET', '/goals');
        throw new Error('Should have failed with 401');
      } catch (err) {
        assertEqual(err.status, 401, 'Status should be 401 Unauthorized');
      }
    });

    await runTest('Unauthenticated request to GET /api/insights returns 401', async () => {
      try {
        await request('GET', '/insights');
        throw new Error('Should have failed with 401');
      } catch (err) {
        assertEqual(err.status, 401, 'Status should be 401 Unauthorized');
      }
    });

    // ─── 3. Budget CRUD & Validation ──────────────────────────────────────────
    await runTest('Creating a budget with negative limit returns 400 Bad Request', async () => {
      try {
        await request('POST', '/budgets', {
          body: {
            category: 'rent',
            monthlyLimit: -500,
            month: currentMonth,
            year: currentYear,
          },
          token: tokenA,
        });
        throw new Error('Should have failed with 400');
      } catch (err) {
        assertEqual(err.status, 400, 'Status should be 400 Bad Request');
      }
    });

    await runTest('User A creates valid budget for "rent" (Limit: ₹20,000)', async () => {
      const res = await request('POST', '/budgets', {
        body: {
          category: 'Rent', // test case-insensitivity
          monthlyLimit: 20000,
          month: currentMonth,
          year: currentYear,
        },
        token: tokenA,
      });
      assertEqual(res.status, 201, 'Status should be 201 Created');
      const budget = res.data.data;
      assertEqual(budget.category, 'rent', 'Category should be lowercase');
      assertEqual(budget.monthlyLimit, 20000, 'Limit should be 20000');
      assertEqual(budget.spentAmount, 0, 'Initial spentAmount should be 0');
      assertEqual(budget.remainingAmount, 20000, 'Initial remainingAmount should be 20000');
      budgetId = budget._id;
    });

    await runTest('Duplicate Budget Prevention: Creating second "rent" budget returns 400 DUPLICATE_BUDGET', async () => {
      try {
        await request('POST', '/budgets', {
          body: {
            category: 'rent',
            monthlyLimit: 25000,
            month: currentMonth,
            year: currentYear,
          },
          token: tokenA,
        });
        throw new Error('Should have failed with 400 DUPLICATE_BUDGET');
      } catch (err) {
        assertEqual(err.status, 400, 'Status should be 400');
        assert(
          (err.data?.message || err.data?.error?.message || '').toLowerCase().includes('already exists'),
          'Error message should mention duplicate budget'
        );
      }
    });

    // ─── 4. Dynamic Spending Aggregation ──────────────────────────────────────
    await runTest('Create expense transaction (Rent: ₹15,000) & verify dynamic budget utilization', async () => {
      // 1. Create transaction
      await request('POST', '/transactions', {
        body: {
          type: 'Expense',
          category: 'rent',
          amount: 15000,
          description: 'Monthly office rent',
          transactionDate: new Date().toISOString(),
          paymentMethod: 'bank_transfer',
        },
        token: tokenA,
      });

      // 2. Fetch budgets and verify spending aggregation
      const res = await request('GET', `/budgets?month=${currentMonth}&year=${currentYear}`, { token: tokenA });
      assertEqual(res.status, 200, 'Status should be 200 OK');
      const rentBudget = res.data.data.find((b) => b.category === 'rent');
      assert(rentBudget, 'Rent budget should exist');
      assertEqual(rentBudget.spentAmount, 15000, 'spentAmount should dynamically aggregate to 15000');
      assertEqual(rentBudget.remainingAmount, 5000, 'remainingAmount should be 5000');
      assertEqual(rentBudget.percentageUsed, 75, 'percentageUsed should be 75%');
    });

    // ─── 5. Savings Goals CRUD & Automatic Completion ─────────────────────────
    await runTest('Creating a goal with past targetDate returns 400 Bad Request', async () => {
      try {
        await request('POST', '/goals', {
          body: {
            goalName: 'Past Goal',
            targetAmount: 50000,
            targetDate: '2020-01-01',
          },
          token: tokenA,
        });
        throw new Error('Should have failed with 400');
      } catch (err) {
        assertEqual(err.status, 400, 'Status should be 400 Bad Request');
      }
    });

    await runTest('User A creates valid Savings Goal ("MacBook Pro": Target ₹100,000, Saved ₹80,000)', async () => {
      const res = await request('POST', '/goals', {
        body: {
          goalName: 'MacBook Pro M3',
          targetAmount: 100000,
          currentAmount: 80000,
          targetDate: futureDateStr,
        },
        token: tokenA,
      });
      assertEqual(res.status, 201, 'Status should be 201 Created');
      const goal = res.data.data;
      assertEqual(goal.status, 'Active', 'Initial status should be Active');
      assertEqual(goal.percentageCompleted, 80, 'Percentage completed should be 80%');
      assert(goal.daysRemaining > 0, 'daysRemaining should be positive');
      goalId = goal._id;
    });

    await runTest('Automatic Goal Completion: Adding ₹20,000 contribution automatically sets status to "Completed"', async () => {
      const res = await request('PUT', `/goals/${goalId}`, {
        body: {
          currentAmount: 100000,
        },
        token: tokenA,
      });
      assertEqual(res.status, 200, 'Status should be 200 OK');
      const updated = res.data.data;
      assertEqual(updated.currentAmount, 100000, 'Current amount should be 100000');
      assertEqual(updated.status, 'Completed', 'Status should automatically transition to Completed!');
      assertEqual(updated.percentageCompleted, 100, 'Percentage completed should be 100%');
    });

    // ─── 6. Financial Insights & Health Score Algorithm ───────────────────────
    await runTest('GET /api/insights returns 0-100 Health Score, Grade, and AI Recommendations', async () => {
      const res = await request('GET', '/insights', { token: tokenA });
      assertEqual(res.status, 200, 'Status should be 200 OK');
      const insights = res.data.data;

      // Verify Health Score
      assert(typeof insights.healthScore === 'number', 'healthScore should be a number');
      assert(insights.healthScore >= 0 && insights.healthScore <= 100, 'healthScore should be between 0 and 100');
      assert(['A+', 'A', 'B', 'C', 'D'].includes(insights.grade), 'grade should be a valid rating string');

      // Verify Utilization & Goals data
      assertEqual(insights.budgetUtilization.totalBudgeted, 20000, 'totalBudgeted should match User A budget limit');
      assertEqual(insights.budgetUtilization.totalSpentOnBudgets, 15000, 'totalSpentOnBudgets should match User A expense');
      assertEqual(insights.savingsProgress.completedGoalsCount, 1, 'completedGoalsCount should be 1');

      // Verify AI / Fallback suggestions
      assert(Array.isArray(insights.aiSuggestions), 'aiSuggestions should be an array');
      assert(insights.aiSuggestions.length > 0, 'Should return actionable recommendations');
      console.log(`   🏆 Health Score Generated: ${insights.healthScore}/100 (Grade ${insights.grade})`);
      console.log(`   💡 Sample Recommendation: "${insights.aiSuggestions[0].slice(0, 70)}..."`);
    });

    // ─── 7. User Data Isolation ───────────────────────────────────────────────
    await runTest('User Isolation: User B receives 0 budgets and 0 goals, never seeing User A data', async () => {
      const bBudgets = await request('GET', '/budgets', { token: tokenB });
      assertEqual(bBudgets.data.data.length, 0, 'User B should see 0 budgets');

      const bGoals = await request('GET', '/goals', { token: tokenB });
      assertEqual(bGoals.data.data.length, 0, 'User B should see 0 goals');

      const bInsights = await request('GET', '/insights', { token: tokenB });
      assertEqual(bInsights.data.data.budgetUtilization.totalBudgetsCount, 0, 'User B should have 0 budget count');
      assertEqual(bInsights.data.data.savingsProgress.totalTargetAmount, 0, 'User B should have 0 savings target');
    });

  } catch (err) {
    console.error('Fatal test error:', err);
    totalTests++;
  } finally {
    // Clean up test data and connections
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    server.close();

    // ─── Summary ────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log(`║   Phase 7 Test Results: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)                    ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════╝');

    if (passedTests === totalTests && totalTests > 0) {
      console.log('\n🚀 ALL PHASE 7 TESTS PASSED SUCCESSFULLY! The Budgets, Goals & Insights engine is production ready.\n');
      process.exit(0);
    } else {
      console.error('\n❌ SOME TESTS FAILED. Please check logs above.\n');
      process.exit(1);
    }
  }
})();
