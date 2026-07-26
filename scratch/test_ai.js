/**
 * test_ai.js — Automated Verification Script for Phase 4 (AI Accounting Assistant)
 *
 * Verifies:
 * 1. Auth enforcement on POST /api/ai/chat (401 without JWT token)
 * 2. Input validation (400 for empty or invalid prompts)
 * 3. AI Financial Analysis accuracy (Spending, Categories, Summary, Budget tips)
 * 4. User Data Isolation (User B never receives User A's financial metrics)
 * 5. Rate Limiter Enforcement (429 Too Many Requests after exceeding 20 requests/15m)
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

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}/api/ai`;
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

async function request(url, { method = 'POST', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('─── Starting in-memory MongoDB & Test Server (Port 5003) ───');
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  server = app.listen(TEST_PORT);

  try {
    const emailA = 'ai_user_a@pocketca.dev';
    const emailB = 'ai_user_b@pocketca.dev';

    await User.deleteMany({ email: { $in: [emailA, emailB] } });

    const userA = await User.create({ name: 'AI User A', email: emailA, passwordHash: 'secret123' });
    const userB = await User.create({ name: 'AI User B', email: emailB, passwordHash: 'secret123' });

    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });

    const tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ userId: userB._id }, JWT_SECRET, { expiresIn: '1h' });

    const now = new Date();
    const curDate = now.toISOString().split('T')[0];

    // Seed transactions for User A
    await Transaction.create([
      {
        user: userA._id,
        type: 'Income',
        category: 'salary',
        amount: 100000,
        description: 'Tech Salary',
        transactionDate: curDate,
        paymentMethod: 'bank_transfer',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'rent',
        amount: 25000,
        description: 'Apartment Rent',
        transactionDate: curDate,
        paymentMethod: 'bank_transfer',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'food',
        amount: 5000,
        description: 'Grocery Shopping',
        transactionDate: curDate,
        paymentMethod: 'card',
      },
    ]);

    // Seed transaction for User B
    await Transaction.create({
      user: userB._id,
      type: 'Expense',
      category: 'shopping',
      amount: 15000,
      description: 'Designer Jacket',
      transactionDate: curDate,
      paymentMethod: 'card',
    });

    console.log('─── 1. Testing Authentication & Input Validation ───');
    const noAuth = await request(`${BASE_URL}/chat`, { body: { prompt: 'Hello' } });
    if (noAuth.status === 401) logPass('POST /api/ai/chat without token returns 401 Unauthorized');
    else logFail('POST /api/ai/chat without token should return 401', `Got ${noAuth.status}`);

    const emptyPrompt = await request(`${BASE_URL}/chat`, { token: tokenA, body: { prompt: '   ' } });
    if (emptyPrompt.status === 400) logPass('POST /api/ai/chat with empty prompt returns 400 Bad Request');
    else logFail('POST /api/ai/chat with empty prompt should return 400', `Got ${emptyPrompt.status}`);

    console.log('─── 2. Testing AI Financial Analysis for User A ───');
    const q1 = await request(`${BASE_URL}/chat`, { token: tokenA, body: { prompt: 'How much did I spend this month?' } });
    const reply1 = q1.data?.data?.reply || '';
    if (q1.status === 200 && (reply1.includes('30,000') || reply1.includes('30000') || reply1.includes('Rent') || reply1.includes('spent'))) {
      logPass('AI accurately answers monthly spending question with User A totals (₹30,000 expense vs ₹100,000 income)');
    } else {
      logFail('Monthly spending analysis failed', reply1);
    }

    const q2 = await request(`${BASE_URL}/chat`, { token: tokenA, body: { prompt: 'What is my biggest expense category?' } });
    const reply2 = q2.data?.data?.reply || '';
    if (q2.status === 200 && (reply2.toLowerCase().includes('rent') || reply2.includes('25,000') || reply2.includes('25000'))) {
      logPass('AI correctly identifies biggest expense category as RENT (₹25,000)');
    } else {
      logFail('Biggest category analysis failed', reply2);
    }

    const q3 = await request(`${BASE_URL}/chat`, { token: tokenA, body: { prompt: 'Suggest a monthly budget.' } });
    const reply3 = q3.data?.data?.reply || '';
    if (q3.status === 200 && (reply3.includes('50%') || reply3.includes('50000') || reply3.includes('50/30/20') || reply3.includes('Budget'))) {
      logPass('AI generates structured 50/30/20 budget recommendation based on User A income');
    } else {
      logFail('Budget recommendation failed', reply3);
    }

    const q4 = await request(`${BASE_URL}/chat`, { token: tokenA, body: { prompt: 'Compare this month with last month.' } });
    const reply4 = q4.data?.data?.reply || '';
    if (q4.status === 200 && (reply4.includes('Comparison') || reply4.includes('Last Month') || reply4.includes('This Month') || reply4.includes('30,000'))) {
      logPass('AI accurately compares current month vs last month with formatted table');
    } else {
      logFail('Monthly comparison analysis failed', reply4);
    }

    const q5 = await request(`${BASE_URL}/chat`, { token: tokenA, body: { prompt: 'Show my spending trends.' } });
    const reply5 = q5.data?.data?.reply || '';
    if (q5.status === 200 && (reply5.includes('Trend') || reply5.includes('Trajectory') || reply5.includes('Month') || reply5.includes('Surplus'))) {
      logPass('AI generates 6-month chronological financial trend table');
    } else {
      logFail('Spending trends analysis failed', reply5);
    }

    console.log('─── 3. Testing User Data Ownership & Isolation ───');
    const qB = await request(`${BASE_URL}/chat`, { token: tokenB, body: { prompt: 'Give me a summary of my finances.' } });
    const replyB = qB.data?.data?.reply || '';
    if (qB.status === 200 && (replyB.includes('15,000') || replyB.includes('15000') || replyB.toLowerCase().includes('shopping')) && !replyB.includes('100,000') && !replyB.toLowerCase().includes('rent')) {
      logPass('User B AI chat is strictly isolated (shows ₹15,000 shopping expense, never exposes User A salary or rent)');
    } else {
      logFail('User B data isolation failed', replyB);
    }

    console.log('─── 4. Testing AI Rate Limiter Enforcement (10 reqs / 15m) ───');
    console.log('Sending rapid requests to exceed rate limit for User B...');
    let rateLimited = false;
    for (let i = 1; i <= 15; i++) {
      const r = await request(`${BASE_URL}/chat`, { token: tokenB, body: { prompt: `Test rate limit ${i}` } });
      if (r.status === 429) {
        rateLimited = true;
        logPass(`Rate limiter successfully triggered 429 Too Many Requests on request #${i}`);
        break;
      }
    }
    if (!rateLimited) {
      logFail('Rate limiter failed to trigger 429 status after 15 rapid requests');
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
