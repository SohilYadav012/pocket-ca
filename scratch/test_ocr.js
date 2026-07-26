/**
 * scratch/test_ocr.js — Automated Verification for Phase 5 (OCR Receipt Scanner)
 * Pocket C.A. Backend
 *
 * Verifies:
 * 1. JWT Authentication Guard on /api/ocr/scan (401 Unauthorized)
 * 2. Unsupported file type rejection (400 Bad Request)
 * 3. File size limit (>5MB) rejection (400 Bad Request)
 * 4. Empty/blank image OCR failure handling (400 Bad Request)
 * 5. Intelligent Heuristic Receipt Parsing accuracy (Merchant, Amount, Date, Tax, Category, Payment Method)
 * 6. Transaction creation upon OCR confirmation via existing Transaction API
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
process.chdir(backendDir);
process.env.MONGODB_URI = 'mongodb://memory';
module.paths.push(path.join(backendDir, 'node_modules'));

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require(path.join(backendDir, 'src/models/User.model'));
const Transaction = require(path.join(backendDir, 'src/models/Transaction.model'));
const { parseReceiptTextHeuristic } = require(path.join(backendDir, 'src/services/ocr.service'));
require(path.join(backendDir, 'src/config/env'));
const { JWT_SECRET } = require(path.join(backendDir, 'src/config/env'));
const app = require(path.join(backendDir, 'app'));

const TEST_PORT = 5004;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;
let mongod, server;

let passedTests = 0;
let failedTests = 0;

const logPass = (msg) => {
  console.log(`✅ PASS: ${msg}`);
  passedTests++;
};

const logFail = (msg, details = '') => {
  console.error(`❌ FAIL: ${msg}`, details);
  failedTests++;
};

// Helper for multipart/form-data upload simulation
const uploadFile = (endpoint, token, fileBuffer, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    const boundary = '----PocketCAOCRBoundary' + Math.random().toString(16).substring(2);
    const postDataStart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="receipt"; filename="${fileName}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    const postDataEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullBody = Buffer.concat([postDataStart, fileBuffer, postDataEnd]);

    const url = new URL(endpoint);
    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
};

// Helper for regular JSON REST requests
const jsonRequest = (method, endpoint, token, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  try {
    console.log('─── Starting in-memory MongoDB & Test Server (Port 5004) ───');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    server = app.listen(TEST_PORT);

    // Get User A token
    let userA = await User.findOne({ email: 'user.a@pocketca.com' });
    if (!userA) {
      userA = await User.create({
        name: 'User A',
        email: 'user.a@pocketca.com',
        passwordHash: 'Password123!',
      });
    }
    const tokenA = jwt.sign({ userId: userA._id }, JWT_SECRET, { expiresIn: '1h' });

    console.log('─── 1. Testing OCR API Authentication Guard ───');
    const dummyPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
    const resNoAuth = await uploadFile(`${BASE_URL}/ocr/scan`, null, dummyPng, 'receipt.png', 'image/png');
    if (resNoAuth.status === 401) {
      logPass('POST /api/ocr/scan without token returns 401 Unauthorized');
    } else {
      logFail('Auth guard failed on OCR scan endpoint', resNoAuth);
    }

    console.log('─── 2. Testing File Type & Size Validation ───');
    const txtBuffer = Buffer.from('This is a text file not an image');
    const resBadType = await uploadFile(`${BASE_URL}/ocr/scan`, tokenA, txtBuffer, 'document.txt', 'text/plain');
    if (resBadType.status === 400 && resBadType.data?.error?.code === 'INVALID_FILE_TYPE') {
      logPass('Uploading unsupported file type (.txt) returns 400 INVALID_FILE_TYPE');
    } else {
      logFail('File type validation failed', resBadType);
    }

    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 'a'); // 5.5 MB buffer
    const resTooLarge = await uploadFile(`${BASE_URL}/ocr/scan`, tokenA, largeBuffer, 'huge_receipt.png', 'image/png');
    if (resTooLarge.status === 400 && resTooLarge.data?.error?.code === 'FILE_TOO_LARGE') {
      logPass('Uploading file > 5MB returns 400 FILE_TOO_LARGE');
    } else {
      logFail('File size limit validation failed', resTooLarge);
    }

    console.log('─── 3. Testing OCR Error Handling on Blank/Unreadable Image ───');
    const resBlank = await uploadFile(`${BASE_URL}/ocr/scan`, tokenA, dummyPng, 'blank.png', 'image/png');
    if (resBlank.status === 400 && resBlank.data?.error?.code === 'OCR_EMPTY_RESULT') {
      logPass('Scanning blank/unreadable image returns 400 OCR_EMPTY_RESULT with helpful error message');
    } else {
      logFail('Blank image OCR handling failed', resBlank);
    }

    console.log('─── 4. Testing Intelligent Heuristic Receipt Parsing Engine ───');
    const sampleFoodReceipt = `TAX INVOICE
STARBUCKS COFFEE INDIA
CONNUGHT PLACE, NEW DELHI
DATE: 25/07/2026   TIME: 14:30
INV NO: SB-987654
--------------------------------
1x Cappuccino Grande     280.00
1x Croissant             170.00
--------------------------------
SUBTOTAL                 450.00
CGST 2.5%                 11.25
SGST 2.5%                 11.25
--------------------------------
GRAND TOTAL              472.50
PAID VIA UPI (GOOGLE PAY)
THANK YOU FOR VISITING!`;

    const parsedFood = parseReceiptTextHeuristic(sampleFoodReceipt);
    if (
      parsedFood.merchantName === 'STARBUCKS COFFEE INDIA' &&
      parsedFood.totalAmount === 472.5 &&
      parsedFood.taxAmount === 22.5 &&
      parsedFood.suggestedCategory === 'food' &&
      parsedFood.paymentMethod === 'upi' &&
      parsedFood.receiptNumber === 'SB-987654' &&
      parsedFood.transactionDate === '2026-07-25'
    ) {
      logPass('Heuristic parser accurately extracts Starbucks receipt (Merchant: STARBUCKS, Amount: ₹472.50, Tax: ₹22.50, Category: food, upi, Date: 2026-07-25)');
    } else {
      logFail('Food receipt parsing failed', parsedFood);
    }

    const sampleTravelReceipt = `RECEIPT
UBER TECHNOLOGIES
CAB RIDE TO AIRPORT
DATE: 2026-07-22
TOTAL DUE: Rs. 850.00
PAID VIA CREDIT CARD
TRIP ID: UBR-112233`;

    const parsedTravel = parseReceiptTextHeuristic(sampleTravelReceipt);
    if (
      parsedTravel.merchantName === 'UBER TECHNOLOGIES' &&
      parsedTravel.totalAmount === 850 &&
      parsedTravel.suggestedCategory === 'transport' &&
      parsedTravel.paymentMethod === 'card' &&
      parsedTravel.receiptNumber === 'UBR-112233' &&
      parsedTravel.transactionDate === '2026-07-22'
    ) {
      logPass('Heuristic parser accurately extracts Uber cab receipt (Merchant: UBER TECHNOLOGIES, Amount: ₹850.00, Category: transport, card)');
    } else {
      logFail('Travel receipt parsing failed', parsedTravel);
    }

    console.log('─── 5. Testing Transaction Creation from OCR Confirmation ───');
    const txPayload = {
      type: 'Expense',
      category: parsedFood.suggestedCategory,
      amount: parsedFood.totalAmount,
      description: `Receipt: ${parsedFood.merchantName} (${parsedFood.receiptNumber})`,
      transactionDate: parsedFood.transactionDate,
      paymentMethod: parsedFood.paymentMethod,
      tags: ['OCR', 'Verified'],
    };

    const resTx = await jsonRequest('POST', `${BASE_URL}/transactions`, tokenA, txPayload);
    const createdTx = resTx.data?.data?.transaction || resTx.data?.data;
    if (resTx.status === 201 && createdTx?.amount === 472.5 && createdTx?.tags?.includes('OCR')) {
      logPass('User confirmation successfully creates Expense transaction from extracted OCR data');
      // Clean up the created transaction so test is idempotent
      if (createdTx?._id) await Transaction.findByIdAndDelete(createdTx._id);
    } else {
      logFail('Transaction creation from OCR data failed', resTx);
    }

    console.log('\n─── Test Summary ───');
    console.log(`Passed: ${passedTests} | Failed: ${failedTests}`);

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failedTests++;
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    if (server) server.close();
    if (failedTests > 0) process.exit(1);
    process.exit(0);
  }
};

runTests();
