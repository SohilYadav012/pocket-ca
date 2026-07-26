/**
 * scratch/test_auth.js — Automated Verification for Authentication Module
 * Pocket C.A. Project (Phase 8)
 *
 * Verifies:
 * - User registration (/api/auth/register)
 * - Duplicate email prevention (409 DUPLICATE_EMAIL)
 * - Login with invalid credentials (401 INVALID_CREDENTIALS)
 * - Login with valid credentials (/api/auth/login)
 * - Protected profile fetching (/api/auth/me)
 * - Unauthorized access guard (401)
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');
process.chdir(backendDir);
module.paths.push(path.join(backendDir, 'node_modules'));

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = 5009;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_pocket_ca_phase_8';

const app = require('../backend/app');

let server;
let mongoServer;
let passedTests = 0;
let totalTests = 0;

const assert = (condition, message) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
};

const assertEqual = (actual, expected, message) => {
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`✅ [PASS] ${message} (Got: ${actual})`);
  } else {
    console.error(`❌ [FAIL] ${message} — Expected: "${expected}", Got: "${actual}"`);
  }
};

const request = (method, path, { body = null, token = null } = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: parsed });
        } else {
          reject({ status: res.statusCode, data: parsed });
        }
      });
    });

    req.on('error', (err) => reject({ status: 500, error: err.message }));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log('🧪 Starting Phase 8 Automated Verification: Authentication Module');
  console.log('──────────────────────────────────────────────────────────────────────');

  // 1. Start MongoMemoryServer & Express Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('[Test Setup] Connected to in-memory MongoDB');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[Test Setup] Test server running on port ${PORT}\n`);
      resolve();
    });
  });

  try {
    let tokenA;
    let userIdA;

    // Test 1: Register User A
    try {
      const res = await request('POST', '/api/auth/register', {
        body: {
          name: 'Alice Accountant',
          email: 'alice@pocketca.com',
          password: 'SecretPassword123!',
          currency: 'INR',
        },
      });
      assertEqual(res.status, 201, 'POST /api/auth/register returns 201 Created');
      assert(res.data?.data?.user?.email === 'alice@pocketca.com', 'User email correctly returned in registration response');
      assert(!!res.data?.data?.token, 'JWT token returned upon successful registration');
      tokenA = res.data.data.token;
      userIdA = res.data.data.user._id;
    } catch (err) {
      console.error('Test 1 failed:', err);
      totalTests++;
    }

    // Test 2: Prevent Duplicate Email Registration
    try {
      await request('POST', '/api/auth/register', {
        body: {
          name: 'Alice Clone',
          email: 'alice@pocketca.com',
          password: 'AnotherPassword456',
        },
      });
      console.error('❌ [FAIL] Duplicate registration did not throw error');
      totalTests++;
    } catch (err) {
      assertEqual(err.status, 409, 'Duplicate registration returns 409 Conflict');
      assert(
        (err.data?.error?.code === 'DUPLICATE_EMAIL'),
        'Error code is DUPLICATE_EMAIL'
      );
    }

    // Test 3: Login with Invalid Password
    try {
      await request('POST', '/api/auth/login', {
        body: {
          email: 'alice@pocketca.com',
          password: 'WrongPassword!!!',
        },
      });
      console.error('❌ [FAIL] Login with wrong password did not throw error');
      totalTests++;
    } catch (err) {
      assertEqual(err.status, 401, 'Login with wrong password returns 401 Unauthorized');
      assert(
        (err.data?.error?.code === 'INVALID_CREDENTIALS'),
        'Error code is INVALID_CREDENTIALS'
      );
    }

    // Test 4: Login with Correct Credentials
    try {
      const res = await request('POST', '/api/auth/login', {
        body: {
          email: 'alice@pocketca.com',
          password: 'SecretPassword123!',
        },
      });
      assertEqual(res.status, 200, 'POST /api/auth/login returns 200 OK');
      assert(res.data?.data?.user?._id === userIdA, 'Logged in user ID matches registered ID');
      assert(!!res.data?.data?.token, 'New JWT token issued on login');
    } catch (err) {
      console.error('Test 4 failed:', err);
      totalTests++;
    }

    // Test 5: GET /api/auth/me with Token
    try {
      const res = await request('GET', '/api/auth/me', { token: tokenA });
      assertEqual(res.status, 200, 'GET /api/auth/me with valid token returns 200 OK');
      assert(res.data?.data?.name === 'Alice Accountant', 'User profile retrieved successfully');
      assert(!res.data?.data?.passwordHash, 'Sensitive passwordHash is excluded from profile');
    } catch (err) {
      console.error('Test 5 failed:', err);
      totalTests++;
    }

    // Test 6: GET /api/auth/me without Token
    try {
      await request('GET', '/api/auth/me');
      console.error('❌ [FAIL] Unauthenticated request to GET /api/auth/me did not throw error');
      totalTests++;
    } catch (err) {
      assertEqual(err.status, 401, 'GET /api/auth/me without token returns 401 Unauthorized');
    }

  } finally {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    server.close();

    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log(`║   Auth Module Test Results: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)                    ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    if (passedTests === totalTests) {
      console.log('🚀 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error('❌ SOME TESTS FAILED. Please check logs above.');
      process.exit(1);
    }
  }
};

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
