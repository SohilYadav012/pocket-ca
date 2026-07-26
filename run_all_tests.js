/**
 * run_all_tests.js — Master Regression & Smoke Test Runner
 * Pocket C.A.
 *
 * Sequentially executes all Phase 1-8 automated verification scripts and
 * the MongoDB Atlas production smoke test.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const testScripts = [
  { name: 'Phase 1: Authentication & Security', path: 'scratch/test_auth.js' },
  { name: 'Phase 2: Transactions CRUD & Filtering', path: 'scratch/test_transactions.js' },
  { name: 'Phase 3: Dashboard & Analytics', path: 'scratch/test_dashboard.js' },
  { name: 'Phase 4: AI Accounting Assistant', path: 'scratch/test_ai.js' },
  { name: 'Phase 5: OCR Receipt Scanner', path: 'scratch/test_ocr.js' },
  { name: 'Phase 6: Reports & Export', path: 'scratch/test_reports.js' },
  { name: 'Phase 7: Budgets, Goals & Insights', path: 'scratch/test_budgets_goals_insights.js' },
  { name: 'Phase 8: MongoDB Atlas Production Smoke Test', path: 'scratch/test_atlas_smoke.js' },
];

console.log('========================================================================');
console.log('                 POCKET C.A. MASTER VERIFICATION SUITE                  ');
console.log('========================================================================\n');

let totalSuites = testScripts.length;
let passedSuites = 0;
let failedSuites = 0;
const results = [];
const startTime = Date.now();

for (const script of testScripts) {
  console.log(`▶ Running Suite [${script.name}]...`);
  const scriptPath = path.resolve(__dirname, script.path);
  const startSuiteTime = Date.now();

  const res = spawnSync('node', [scriptPath], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const duration = ((Date.now() - startSuiteTime) / 1000).toFixed(2);

  if (res.status === 0) {
    console.log(`\n✔ SUITE PASSED: ${script.name} (${duration}s)\n`);
    console.log('------------------------------------------------------------------------\n');
    passedSuites++;
    results.push({ name: script.name, status: 'PASSED', duration: `${duration}s` });
  } else {
    console.error(`\n✘ SUITE FAILED: ${script.name} (Exit Code: ${res.status}) (${duration}s)\n`);
    console.log('------------------------------------------------------------------------\n');
    failedSuites++;
    results.push({ name: script.name, status: 'FAILED', duration: `${duration}s` });
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('========================================================================');
console.log('                      MASTER SUITE EXECUTION SUMMARY                    ');
console.log('========================================================================');
console.table(results);
console.log(`Total Suites: ${totalSuites} | Passed: ${passedSuites} | Failed: ${failedSuites} | Time: ${totalDuration}s`);
console.log('========================================================================\n');

if (failedSuites > 0) {
  console.error('✘ MASTER VERIFICATION FAILED: One or more suites did not pass.');
  process.exit(1);
} else {
  console.log('✔ MASTER VERIFICATION PASSED: 100% pass rate achieved across all suites!');
  process.exit(0);
}
