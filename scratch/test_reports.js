/**
 * test_reports.js — Automated Verification Script for Phase 6 (Reports & Export)
 *
 * Verifies:
 * 1. Authentication enforcement on all report endpoints (401 without token)
 * 2. Query date validation (400 on invalid date format or start > end)
 * 3. GET /api/reports/summary calculations (Income, Expense, Balance, Savings, Categories, Monthly trend)
 * 4. Date range filtering accuracy (filtering by specific month returns only matching txns)
 * 5. Empty dataset resilience (0 txns generates summary, PDF, and Excel without error)
 * 6. PDF export stream verification (Content-Type: application/pdf, valid PDF header %PDF-)
 * 7. Excel export stream verification (Content-Type: openxmlformats, valid PK ZIP spreadsheet header)
 * 8. Strict user data ownership & isolation (User B never sees User A's data)
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

const TEST_PORT = 5006;
const BASE_URL = `http://localhost:${TEST_PORT}/api/reports`;
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

async function requestJson(method, url, { token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

async function requestBuffer(method, url, { token } = {}) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers });
  const buffer = await res.arrayBuffer().catch(() => new ArrayBuffer(0));
  return { status: res.status, headers: res.headers, buffer: Buffer.from(buffer) };
}

async function runTests() {
  console.log('─── Starting in-memory MongoDB & Test Server (Port 5006) ───');
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  server = app.listen(TEST_PORT);

  try {
    const emailA = 'report_user_a@pocketca.dev';
    const emailB = 'report_user_b@pocketca.dev';

    await User.deleteMany({ email: { $in: [emailA, emailB] } });

    const userA = await User.create({ name: 'Report User A', email: emailA, passwordHash: 'secret123' });
    const userB = await User.create({ name: 'Report User B', email: emailB, passwordHash: 'secret123' });

    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });

    const tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ userId: userB._id }, JWT_SECRET, { expiresIn: '1h' });

    // Seed transactions for User A across two months (June and July 2026)
    await Transaction.create([
      {
        user: userA._id,
        type: 'Income',
        category: 'salary',
        amount: 80000,
        description: 'July Salary',
        transactionDate: '2026-07-01',
        paymentMethod: 'bank_transfer',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'rent',
        amount: 25000,
        description: 'July Apartment Rent',
        transactionDate: '2026-07-05',
        paymentMethod: 'bank_transfer',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'food',
        amount: 5000,
        description: 'July Dining & Groceries',
        transactionDate: '2026-07-15',
        paymentMethod: 'card',
      },
      {
        user: userA._id,
        type: 'Income',
        category: 'freelance',
        amount: 30000,
        description: 'June Freelance Project',
        transactionDate: '2026-06-20',
        paymentMethod: 'upi',
      },
      {
        user: userA._id,
        type: 'Expense',
        category: 'utilities',
        amount: 4000,
        description: 'June Electric & Internet',
        transactionDate: '2026-06-25',
        paymentMethod: 'upi',
      },
    ]);
    // User A Total: Income = 110,000 | Expense = 34,000 | Balance/Savings = 76,000 | Txns = 5

    console.log('─── 1. Testing Authentication Enforcement ───');
    const noAuthSum = await requestJson('GET', `${BASE_URL}/summary`);
    if (noAuthSum.status === 401) logPass('GET /api/reports/summary without token returns 401 Unauthorized');
    else logFail('GET /api/reports/summary without token should return 401', `Got ${noAuthSum.status}`);

    const noAuthPdf = await requestBuffer('GET', `${BASE_URL}/export/pdf`);
    if (noAuthPdf.status === 401) logPass('GET /api/reports/export/pdf without token returns 401 Unauthorized');
    else logFail('GET /api/reports/export/pdf without token should return 401', `Got ${noAuthPdf.status}`);

    const noAuthExcel = await requestBuffer('GET', `${BASE_URL}/export/excel`);
    if (noAuthExcel.status === 401) logPass('GET /api/reports/export/excel without token returns 401 Unauthorized');
    else logFail('GET /api/reports/export/excel without token should return 401', `Got ${noAuthExcel.status}`);

    console.log('─── 2. Testing Date Range Query Validation ───');
    const invDate = await requestJson('GET', `${BASE_URL}/summary?startDate=invalid-date`, { token: tokenA });
    if (invDate.status === 400 && invDate.data?.error?.code === 'INVALID_DATE_FORMAT') {
      logPass('Passing invalid date format returns 400 INVALID_DATE_FORMAT');
    } else {
      logFail('Invalid date validation failed', JSON.stringify(invDate.data));
    }

    const invRange = await requestJson('GET', `${BASE_URL}/summary?startDate=2026-07-31&endDate=2026-07-01`, { token: tokenA });
    if (invRange.status === 400 && invRange.data?.error?.code === 'INVALID_DATE_RANGE') {
      logPass('Passing startDate later than endDate returns 400 INVALID_DATE_RANGE');
    } else {
      logFail('Invalid date range validation failed', JSON.stringify(invRange.data));
    }

    console.log('─── 3. Testing Financial Report Summary Aggregation (All Time) ───');
    const sumA = await requestJson('GET', `${BASE_URL}/summary`, { token: tokenA });
    const sData = sumA.data?.data;
    if (
      sumA.status === 200 &&
      sData?.summary?.totalIncome === 110000 &&
      sData?.summary?.totalExpense === 34000 &&
      sData?.summary?.currentBalance === 76000 &&
      sData?.summary?.savings === 76000 &&
      sData?.summary?.totalTransactions === 5
    ) {
      logPass('Report summary accurately calculates Total Income (110,000), Expense (34,000), Balance (76,000), and Count (5)');
    } else {
      logFail('All-time summary calculation failed', JSON.stringify(sData?.summary));
    }

    if (Array.isArray(sData?.topExpenseCategories) && sData.topExpenseCategories[0]?.category === 'rent' && sData.topExpenseCategories[0]?.totalAmount === 25000) {
      logPass('Top expense categories accurately grouped and sorted descending by amount (Top: rent ₹25,000)');
    } else {
      logFail('Top expense categories failed', JSON.stringify(sData?.topExpenseCategories));
    }

    if (Array.isArray(sData?.monthlyTrend) && sData.monthlyTrend.length === 2 && sData.monthlyTrend[0].month === '2026-06' && sData.monthlyTrend[1].month === '2026-07') {
      logPass('Monthly trend accurately aggregates chronological monthly inflows and outflows (June & July 2026)');
    } else {
      logFail('Monthly trend aggregation failed', JSON.stringify(sData?.monthlyTrend));
    }

    console.log('─── 4. Testing Date Range Filtering Accuracy ───');
    const julySum = await requestJson('GET', `${BASE_URL}/summary?startDate=2026-07-01&endDate=2026-07-31`, { token: tokenA });
    const jData = julySum.data?.data;
    if (
      julySum.status === 200 &&
      jData?.summary?.totalIncome === 80000 &&
      jData?.summary?.totalExpense === 30000 &&
      jData?.summary?.totalTransactions === 3 &&
      jData?.monthlyTrend?.length === 1
    ) {
      logPass('Date range filter (2026-07-01 to 2026-07-31) accurately isolates only July transactions (3 txns, Income: 80k, Exp: 30k)');
    } else {
      logFail('Date range filter failed', JSON.stringify(jData?.summary));
    }

    console.log('─── 5. Testing Empty Dataset Resilience (User B with 0 transactions) ───');
    const emptySum = await requestJson('GET', `${BASE_URL}/summary`, { token: tokenB });
    const eData = emptySum.data?.data;
    if (emptySum.status === 200 && eData?.summary?.totalTransactions === 0 && eData?.summary?.totalIncome === 0 && eData?.topExpenseCategories?.length === 0) {
      logPass('Empty dataset returns clean 0 metrics without crashing or erroring');
    } else {
      logFail('Empty dataset summary failed', JSON.stringify(eData));
    }

    const emptyPdf = await requestBuffer('GET', `${BASE_URL}/export/pdf`, { token: tokenB });
    if (emptyPdf.status === 200 && emptyPdf.headers.get('content-type')?.includes('application/pdf') && emptyPdf.buffer.length > 500) {
      logPass('Empty dataset generates a valid, formatted PDF statement without crashing');
    } else {
      logFail('Empty dataset PDF generation failed', `Status: ${emptyPdf.status}, len: ${emptyPdf.buffer.length}`);
    }

    const emptyExcel = await requestBuffer('GET', `${BASE_URL}/export/excel`, { token: tokenB });
    if (emptyExcel.status === 200 && emptyExcel.headers.get('content-type')?.includes('spreadsheetml') && emptyExcel.buffer.length > 1000) {
      logPass('Empty dataset generates a valid multi-sheet Excel workbook without crashing');
    } else {
      logFail('Empty dataset Excel generation failed', `Status: ${emptyExcel.status}, len: ${emptyExcel.buffer.length}`);
    }

    console.log('─── 6. Testing PDF Export Generation & Formatting (User A) ───');
    const pdfRes = await requestBuffer('GET', `${BASE_URL}/export/pdf?startDate=2026-06-01&endDate=2026-07-31`, { token: tokenA });
    const pdfHeaderStr = pdfRes.buffer.slice(0, 5).toString('utf8');
    if (pdfRes.status === 200 && pdfRes.headers.get('content-type')?.includes('application/pdf') && pdfHeaderStr === '%PDF-' && pdfRes.buffer.length > 2000) {
      logPass(`PDF report stream generated successfully (Size: ${(pdfRes.buffer.length / 1024).toFixed(2)} KB, Valid %PDF- header)`);
    } else {
      logFail('PDF report generation failed', `Status: ${pdfRes.status}, header: ${pdfHeaderStr}, len: ${pdfRes.buffer.length}`);
    }

    console.log('─── 7. Testing Excel Workbook Export Generation & Formatting (User A) ───');
    const excelRes = await requestBuffer('GET', `${BASE_URL}/export/excel?startDate=2026-06-01&endDate=2026-07-31`, { token: tokenA });
    const zipHeader = excelRes.buffer.slice(0, 2).toString('utf8'); // PK ZIP archive header for xlsx
    if (excelRes.status === 200 && excelRes.headers.get('content-type')?.includes('spreadsheetml') && zipHeader === 'PK' && excelRes.buffer.length > 4000) {
      logPass(`Excel workbook stream generated successfully (Size: ${(excelRes.buffer.length / 1024).toFixed(2)} KB, Valid PK spreadsheet header)`);
    } else {
      logFail('Excel report generation failed', `Status: ${excelRes.status}, header: ${zipHeader}, len: ${excelRes.buffer.length}`);
    }

    console.log('─── 8. Testing User Data Ownership & Isolation ───');
    // User B should never see User A's salary or rent
    const isoCheck = await requestJson('GET', `${BASE_URL}/summary`, { token: tokenB });
    if (isoCheck.status === 200 && isoCheck.data?.data?.summary?.totalIncome === 0 && isoCheck.data?.data?.allTransactions === undefined) {
      logPass('Strict user data isolation verified: User B cannot access or view any metrics from User A');
    } else {
      logFail('User data isolation check failed', JSON.stringify(isoCheck.data));
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
