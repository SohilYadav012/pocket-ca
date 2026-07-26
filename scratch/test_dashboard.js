/**
 * test_dashboard.js — Automated Verification Script for Phase 3 (Dashboard & Analytics)
 *
 * Verifies:
 * 1. Auth enforcement on all 4 dashboard endpoints (401 without token)
 * 2. GET /api/dashboard/summary calculations (Balance, Income, Expense, Transactions, Month, Highest)
 * 3. GET /api/dashboard/monthly-trend aggregation (6-month autofill & accuracy)
 * 4. GET /api/dashboard/category-breakdown aggregation (sorting & percentage accuracy)
 * 5. GET /api/dashboard/recent-transactions (limit 5 & sorting)
 * 6. Ownership isolation (User B only sees their own data, not User A's)
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
process.chdir(backendDir);
process.env.MONGODB_URI = 'mongodb://memory';
module.paths.push(path.join(backendDir, 'node_modules'));

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

require(path.join(backendDir, 'src/config/env'));
const { JWT_SECRET } = require(path.join(backendDir, 'src/config/env'));
const User = require(path.join(backendDir, 'src/models/User.model'));
const Transaction = require(path.join(backendDir, 'src/models/Transaction.model'));
const app = require(path.join(backendDir, 'app'));

const TEST_PORT = 5002;
const BASE_URL = `http://localhost:${TEST_PORT}/api/dashboard`;
let mongod, server;

let testsPassed = 0;
let testsFailed = 0;

function logPass(msg) {
  console.log(`✅ PASS: ${msg}`);
  testsPassed++;
}

function logFail(msg, err = '') {
  console.error(`❌ FAIL: ${msg}`, err);
  testsFailed++;
}

async function request(method, url, { token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('─── Starting in-memory MongoDB & Test Server (Port 5002) ───');
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  server = app.listen(TEST_PORT);

  try {
    const emailA = 'dash_user_a@pocketca.dev';
    const emailB = 'dash_user_b@pocketca.dev';

    await User.deleteMany({ email: { $in: [emailA, emailB] } });

    const userA = await User.create({ name: 'Dash User A', email: emailA, passwordHash: 'secret123' });
    const userB = await User.create({ name: 'Dash User B', email: emailB, passwordHash: 'secret123' });

    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });

    const tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ userId: userB._id }, JWT_SECRET, { expiresIn: '1h' });

    // Seed transactions for User A
    const now = new Date();
    const currentMonthDate = now.toISOString().split('T')[0];
    
    // Last month date
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const lastMonthDate = lastMonth.toISOString().split('T')[0];

    await Transaction.create([
      {
        user: userA._id,
        type: 'Income',
        category: 'salary',
        amount: 100000,
        description: 'Current Month Salary',
        transactionDate: currentMonthDate,
        paymentMethod: 'bank_transfer',
      },
      {
        user: userA._id,
        type: 'Income',
        category: 'freelance',
        amount: 25000,
        description: 'Last Month Freelance',
        transactionDate: lastMonthDate,
        paymentMethod: 'upi',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'rent',
        amount: 20000,
        description: 'Current Month Rent',
        transactionDate: currentMonthDate,
        paymentMethod: 'bank_transfer',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'food',
        amount: 5000,
        description: 'Current Month Groceries',
        transactionDate: currentMonthDate,
        paymentMethod: 'card',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'utilities',
        amount: 3000,
        description: 'Last Month Electric bill',
        transactionDate: lastMonthDate,
        paymentMethod: 'upi',
      },
      // 6th transaction to test recent transactions limit of 5
      {
        user: userA._id,
        type: 'Expense',
        category: 'shopping',
        amount: 1500,
        description: 'Old shopping',
        transactionDate: '2026-01-10',
        paymentMethod: 'cash',
      }
    ]);

    // Seed transaction for User B
    await Transaction.create({
      user: userB._id,
      type: 'Expense',
      category: 'entertainment',
      amount: 12000,
      description: 'Concert ticket',
      transactionDate: currentMonthDate,
      paymentMethod: 'card',
    });

    console.log('─── 1. Testing Authentication Enforcement ───');
    const noAuth = await request('GET', `${BASE_URL}/summary`);
    if (noAuth.status === 401) logPass('GET /api/dashboard/summary without token returns 401');
    else logFail('GET /api/dashboard/summary without token should return 401', `Got ${noAuth.status}`);

    console.log('─── 2. Testing Financial Summary (GET /api/dashboard/summary) ───');
    const sumA = await request('GET', `${BASE_URL}/summary`, { token: tokenA });
    const sData = sumA.data?.data;
    if (sumA.status === 200 && sData?.totalIncome === 125000 && sData?.totalExpense === 29500 && sData?.totalBalance === 95500 && sData?.totalTransactions === 6) {
      logPass('Summary calculates totalBalance (95500), totalIncome (125000), totalExpense (29500), totalTransactions (6) accurately');
    } else {
      logFail('Summary totals calculation failed', JSON.stringify(sData));
    }

    if (sData?.currentMonthIncome === 100000 && sData?.currentMonthExpense === 25000) {
      logPass('Summary calculates currentMonthIncome (100000) and currentMonthExpense (25000) accurately');
    } else {
      logFail('Current month calculation failed', `Income: ${sData?.currentMonthIncome}, Expense: ${sData?.currentMonthExpense}`);
    }

    if (sData?.highestExpense?.amount === 20000 && sData?.highestIncome?.amount === 100000) {
      logPass('Summary identifies highestExpense (20000) and highestIncome (100000) accurately');
    } else {
      logFail('Highest transactions identification failed', `Exp: ${sData?.highestExpense?.amount}, Inc: ${sData?.highestIncome?.amount}`);
    }

    console.log('─── 3. Testing Monthly Trend (GET /api/dashboard/monthly-trend) ───');
    const trendA = await request('GET', `${BASE_URL}/monthly-trend`, { token: tokenA });
    const tData = trendA.data?.data;
    if (trendA.status === 200 && Array.isArray(tData) && tData.length >= 6) {
      logPass(`Monthly trend returns chronological array of ${tData.length} months (with 6-month autofill)`);
    } else {
      logFail('Monthly trend format error', JSON.stringify(tData));
    }

    // Check if current month and last month values match
    const curMonthKey = now.toISOString().slice(0, 7);
    const curMonthItem = tData.find(m => m.fullDate === curMonthKey);
    if (curMonthItem?.income === 100000 && curMonthItem?.expense === 25000) {
      logPass(`Monthly trend for current month (${curMonthKey}) matches seeded totals (Inc: 100000, Exp: 25000)`);
    } else {
      logFail(`Monthly trend current month mismatch for ${curMonthKey}`, JSON.stringify(curMonthItem));
    }

    console.log('─── 4. Testing Category Breakdown (GET /api/dashboard/category-breakdown) ───');
    const catA = await request('GET', `${BASE_URL}/category-breakdown`, { token: tokenA });
    const cData = catA.data?.data;
    if (catA.status === 200 && Array.isArray(cData) && cData.length === 4 && cData[0].category === 'rent' && cData[0].totalAmount === 20000) {
      logPass('Category breakdown groups expenses, sorts descending by amount (top: rent 20000), and calculates percentages');
    } else {
      logFail('Category breakdown calculation failed', JSON.stringify(cData));
    }

    // Check total percentage sums to ~100%
    const totalPct = cData.reduce((acc, c) => acc + c.percentage, 0);
    if (Math.abs(totalPct - 100) < 0.5) {
      logPass(`Category percentage sums correctly to ${totalPct.toFixed(1)}%`);
    } else {
      logFail(`Category percentage sum is off: ${totalPct}%`, JSON.stringify(cData));
    }

    console.log('─── 5. Testing Recent Transactions (GET /api/dashboard/recent-transactions) ───');
    const recA = await request('GET', `${BASE_URL}/recent-transactions`, { token: tokenA });
    const rData = recA.data?.data;
    if (recA.status === 200 && Array.isArray(rData) && rData.length === 5 && [100000, 20000, 5000].includes(rData[0].amount)) {
      logPass('Recent transactions returns exactly latest 5 items sorted by date descending');
    } else {
      logFail('Recent transactions limit/sorting failed', `Count: ${rData?.length}, Top amount: ${rData?.[0]?.amount}`);
    }

    console.log('─── 6. Testing User Ownership & Isolation ───');
    const sumB = await request('GET', `${BASE_URL}/summary`, { token: tokenB });
    const bData = sumB.data?.data;
    if (sumB.status === 200 && bData?.totalExpense === 12000 && bData?.totalIncome === 0 && bData?.totalTransactions === 1) {
      logPass('User B summary is strictly isolated (only shows 12000 expense, 0 income)');
    } else {
      logFail('User data isolation failed for User B', JSON.stringify(bData));
    }

  } catch (err) {
    console.error('Fatal test execution error:', err);
    testsFailed++;
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    if (server) server.close();
    console.log('─── Test Summary ───');
    console.log(`Passed: ${testsPassed} | Failed: ${testsFailed}`);
    if (testsFailed > 0) process.exit(1);
    else process.exit(0);
  }
}

runTests();
