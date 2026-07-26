/**
 * test_transactions.js — Automated Verification Script for Phase 2B
 *
 * Verifies:
 * 1. Auth enforcement (401 without token / invalid token)
 * 2. CRUD Operations (POST, GET list, GET :id, PUT :id, DELETE :id)
 * 3. Pagination, sorting, and filtering (date range, category, type, payment method)
 * 4. Full-text / regex search by description and category
 * 5. Ownership isolation (User B receives 403 when accessing User A's transaction)
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
process.chdir(backendDir);
process.env.MONGODB_URI = 'mongodb://memory';
module.paths.push(path.join(backendDir, 'node_modules'));

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load backend config and models
require(path.join(backendDir, 'src/config/env'));
const { JWT_SECRET } = require(path.join(backendDir, 'src/config/env'));
const User = require(path.join(backendDir, 'src/models/User.model'));
const Transaction = require(path.join(backendDir, 'src/models/Transaction.model'));
const app = require(path.join(backendDir, 'app'));

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}/api/transactions`;
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

async function request(method, url, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('─── Starting in-memory MongoDB & Test Server (Port 5001) ───');
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  server = app.listen(TEST_PORT);

  try {
    // Clean up previous test users and transactions
    const testEmailA = 'test_user_a@pocketca.dev';
    const testEmailB = 'test_user_b@pocketca.dev';

    await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });

    // 1. Create Test User A and User B
    const userA = await User.create({
      name: 'Test User A',
      email: testEmailA,
      passwordHash: 'secret123',
    });

    const userB = await User.create({
      name: 'Test User B',
      email: testEmailB,
      passwordHash: 'secret123',
    });

    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });

    const tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ userId: userB._id }, JWT_SECRET, { expiresIn: '1h' });

    console.log('─── 1. Testing Authentication Enforcement ───');
    const noAuthRes = await request('GET', BASE_URL);
    if (noAuthRes.status === 401) logPass('GET /api/transactions without token returns 401');
    else logFail('GET /api/transactions without token should return 401', `Got ${noAuthRes.status}`);

    const invalidAuthRes = await request('GET', BASE_URL, { token: 'invalid_token_string' });
    if (invalidAuthRes.status === 401) logPass('GET /api/transactions with invalid token returns 401');
    else logFail('GET /api/transactions with invalid token should return 401', `Got ${invalidAuthRes.status}`);

    console.log('─── 2. Testing Transaction Creation (POST) ───');
    const createPayload1 = {
      type: 'Expense',
      category: 'food',
      amount: 450.50,
      description: 'Dinner at Italian restaurant',
      transactionDate: '2026-07-20',
      paymentMethod: 'card',
      tags: ['dining', 'weekend'],
    };

    const createRes1 = await request('POST', BASE_URL, { token: tokenA, body: createPayload1 });
    if (createRes1.status === 201 && createRes1.data?.data?.transaction?._id) {
      logPass('POST /api/transactions creates transaction for User A');
    } else {
      logFail('POST /api/transactions failed', JSON.stringify(createRes1));
    }
    const txIdA1 = createRes1.data?.data?.transaction?._id;

    // Create more transactions for User A for filtering/sorting/pagination tests
    await request('POST', BASE_URL, {
      token: tokenA,
      body: {
        type: 'Income',
        category: 'salary',
        amount: 85000,
        description: 'Monthly Salary July',
        transactionDate: '2026-07-01',
        paymentMethod: 'bank_transfer',
        tags: ['salary', 'work'],
      },
    });

    await request('POST', BASE_URL, {
      token: tokenA,
      body: {
        type: 'Expense',
        category: 'transport',
        amount: 120,
        description: 'Uber ride to office',
        transactionDate: '2026-07-15',
        paymentMethod: 'upi',
        tags: ['commute'],
      },
    });

    await request('POST', BASE_URL, {
      token: tokenA,
      body: {
        type: 'Expense',
        category: 'utilities',
        amount: 2500,
        description: 'Electricity Bill July',
        transactionDate: '2026-07-10',
        paymentMethod: 'upi',
        tags: ['bills', 'home'],
      },
    });

    // Create a transaction for User B
    const createResB = await request('POST', BASE_URL, {
      token: tokenB,
      body: {
        type: 'Expense',
        category: 'shopping',
        amount: 3200,
        description: 'New running shoes',
        transactionDate: '2026-07-18',
        paymentMethod: 'card',
        tags: ['fitness'],
      },
    });
    const txIdB = createResB.data?.data?.transaction?._id;
    if (createResB.status === 201) logPass('POST /api/transactions creates transaction for User B');
    else logFail('POST /api/transactions for User B failed', JSON.stringify(createResB));

    console.log('─── 3. Testing Ownership & Isolation ───');
    const listA = await request('GET', BASE_URL, { token: tokenA });
    if (listA.status === 200 && listA.data?.data?.length === 4) {
      logPass('User A list returns exactly 4 transactions (isolation verified)');
    } else {
      logFail('User A list transaction count mismatch', `Expected 4, got ${listA.data?.data?.length}`);
    }

    const getOtherRes = await request('GET', `${BASE_URL}/${txIdB}`, { token: tokenA });
    if (getOtherRes.status === 403) {
      logPass('User A accessing User B transaction returns 403 Forbidden');
    } else {
      logFail('User A accessing User B transaction should return 403', `Got ${getOtherRes.status}`);
    }

    const putOtherRes = await request('PUT', `${BASE_URL}/${txIdB}`, {
      token: tokenA,
      body: { amount: 100 },
    });
    if (putOtherRes.status === 403) {
      logPass('User A updating User B transaction returns 403 Forbidden');
    } else {
      logFail('User A updating User B transaction should return 403', `Got ${putOtherRes.status}`);
    }

    const deleteOtherRes = await request('DELETE', `${BASE_URL}/${txIdB}`, { token: tokenA });
    if (deleteOtherRes.status === 403) {
      logPass('User A deleting User B transaction returns 403 Forbidden');
    } else {
      logFail('User A deleting User B transaction should return 403', `Got ${deleteOtherRes.status}`);
    }

    console.log('─── 4. Testing Single Fetch & Update (GET / PUT :id) ───');
    const getSingleRes = await request('GET', `${BASE_URL}/${txIdA1}`, { token: tokenA });
    if (getSingleRes.status === 200 && getSingleRes.data?.data?.transaction?.amount === 450.50) {
      logPass('GET /api/transactions/:id successfully fetches transaction');
    } else {
      logFail('GET /api/transactions/:id failed', JSON.stringify(getSingleRes));
    }

    const updateRes = await request('PUT', `${BASE_URL}/${txIdA1}`, {
      token: tokenA,
      body: { amount: 500, description: 'Updated dinner amount' },
    });
    if (updateRes.status === 200 && updateRes.data?.data?.transaction?.amount === 500) {
      logPass('PUT /api/transactions/:id successfully updates transaction');
    } else {
      logFail('PUT /api/transactions/:id failed', JSON.stringify(updateRes));
    }

    console.log('─── 5. Testing Filtering, Searching, Sorting, Pagination ───');
    // Filter by type
    const filterType = await request('GET', `${BASE_URL}?type=Income`, { token: tokenA });
    if (filterType.status === 200 && filterType.data?.data?.length === 1 && filterType.data.data[0].category === 'salary') {
      logPass('Filtering by type=Income returns correct transaction');
    } else {
      logFail('Filtering by type failed', JSON.stringify(filterType));
    }

    // Filter by payment method
    const filterPM = await request('GET', `${BASE_URL}?paymentMethod=upi`, { token: tokenA });
    if (filterPM.status === 200 && filterPM.data?.data?.length === 2) {
      logPass('Filtering by paymentMethod=upi returns 2 transactions');
    } else {
      logFail('Filtering by paymentMethod failed', JSON.stringify(filterPM));
    }

    // Filter by date range
    const filterDate = await request('GET', `${BASE_URL}?startDate=2026-07-12&endDate=2026-07-22`, { token: tokenA });
    if (filterDate.status === 200 && filterDate.data?.data?.length === 2) {
      logPass('Filtering by date range (2026-07-12 to 2026-07-22) returns 2 transactions');
    } else {
      logFail('Filtering by date range failed', `Got ${filterDate.data?.data?.length} items`);
    }

    // Search by description
    const searchRes = await request('GET', `${BASE_URL}?search=Electricity`, { token: tokenA });
    if (searchRes.status === 200 && searchRes.data?.data?.length === 1 && searchRes.data.data[0].category === 'utilities') {
      logPass('Search by description ("Electricity") works correctly');
    } else {
      logFail('Search by description failed', JSON.stringify(searchRes));
    }

    // Sort by amount asc
    const sortRes = await request('GET', `${BASE_URL}?sortBy=amount&sortOrder=asc`, { token: tokenA });
    if (sortRes.status === 200 && sortRes.data?.data?.[0]?.amount === 120) {
      logPass('Sorting by amount ascending returns smallest amount first (120)');
    } else {
      logFail('Sorting by amount ascending failed', `First amount: ${sortRes.data?.data?.[0]?.amount}`);
    }

    // Pagination
    const pageRes = await request('GET', `${BASE_URL}?page=1&limit=2`, { token: tokenA });
    if (pageRes.status === 200 && pageRes.data?.data?.length === 2 && pageRes.data?.pagination?.total === 4 && pageRes.data?.pagination?.pages === 2) {
      logPass('Pagination works correctly (limit=2 returns 2 items, total=4, pages=2)');
    } else {
      logFail('Pagination failed', JSON.stringify(pageRes.data?.pagination));
    }

    console.log('─── 6. Testing Deletion (DELETE /api/transactions/:id) ───');
    const delRes = await request('DELETE', `${BASE_URL}/${txIdA1}`, { token: tokenA });
    if (delRes.status === 200) {
      logPass('DELETE /api/transactions/:id successfully deletes transaction');
    } else {
      logFail('DELETE /api/transactions/:id failed', JSON.stringify(delRes));
    }

    const verifyDel = await request('GET', `${BASE_URL}/${txIdA1}`, { token: tokenA });
    if (verifyDel.status === 404) {
      logPass('Deleted transaction returns 404 Not Found on subsequent GET');
    } else {
      logFail('Deleted transaction should return 404', `Got ${verifyDel.status}`);
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
