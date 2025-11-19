#!/usr/bin/env node

/**
 * Node.js Test Runner for ConvoKeep
 *
 * Runs vanilla JavaScript tests in Node.js without any build step.
 * Uses native ES6 modules.
 *
 * Usage:
 *   node tests/run.js
 *   npm test
 */

// Mock browser globals for Node.js environment
global.window = {
  location: {
    search: '',
    href: 'http://localhost:3000'
  }
};

// Node.js v15+ has crypto.webcrypto.getRandomValues built-in
// No need to override global.crypto

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Enhanced console logging with colors
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  let message = args.join(' ');

  // Colorize based on content
  if (message.includes('✅')) {
    message = message.replace('✅', `${colors.green}✅${colors.reset}`);
  }
  if (message.includes('❌')) {
    message = message.replace('❌', `${colors.red}❌${colors.reset}`);
  }
  if (message.includes('⊘')) {
    message = message.replace('⊘', `${colors.yellow}⊘${colors.reset}`);
  }
  if (message.includes('🧪')) {
    message = message.replace('🧪', `${colors.cyan}🧪${colors.reset}`);
  }
  if (message.includes('Running:')) {
    message = `${colors.bright}${colors.blue}${message}${colors.reset}`;
  }
  if (message.includes('All tests passed')) {
    message = `${colors.green}${message}${colors.reset}`;
  }
  if (message.includes('Some tests failed')) {
    message = `${colors.red}${message}${colors.reset}`;
  }

  originalLog(message);
};

console.error = (...args) => {
  const message = args.join(' ');
  originalError(`${colors.red}${message}${colors.reset}`);
};

/**
 * Test suite configuration
 * Only include tests that don't require browser APIs
 */
const testSuites = [
  // Utility tests (pure logic, no DOM)
  { path: './utils/formatUtils.test.js', name: 'formatUtils' },
  { path: './utils/textUtils.test.js', name: 'textUtils' },
  { path: './utils/idUtils.test.js', name: 'idUtils' },

  // Schema converter tests (pure logic)
  { path: './schemaConverter/formatDetector.test.js', name: 'formatDetector' },
  { path: './schemaConverter/baseConverter.test.js', name: 'baseConverter' },

  // Integration tests (pure logic)
  { path: './integration/schemaConversion.test.js', name: 'schemaConversion' },

  // Database tests (using mock IndexedDB)
  { path: './database/batchOperations.test.js', name: 'batchOperations' },

  // Note: File processor tests may require browser APIs - skipped in Node.js
];

/**
 * Load all test suites
 */
async function loadTestSuites() {
  const suites = [];

  for (const { path, name } of testSuites) {
    try {
      const module = await import(path);
      suites.push({ suite: module.default, name });
    } catch (error) {
      console.error(`Failed to load test suite: ${name}`);
      console.error(`  Error: ${error.message}`);
      console.error(`  Path: ${path}`);
    }
  }

  return suites;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          ConvoKeep Test Suite - Node.js Runner            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  const startTime = performance.now();
  const suites = await loadTestSuites();

  console.log(`${colors.dim}Loaded ${suites.length} test suites${colors.reset}\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalTests = 0;
  const failedSuites = [];

  for (const { suite, name } of suites) {
    try {
      const results = await suite.run();
      totalPassed += results.passed;
      totalFailed += results.failed;
      totalSkipped += results.skipped || 0;
      totalTests += results.passed + results.failed + (results.skipped || 0);

      if (results.failed > 0) {
        failedSuites.push({ name, errors: results.errors });
      }
    } catch (error) {
      console.error(`Suite "${name}" failed with error: ${error.message}`);
      console.error(error.stack);
      failedSuites.push({ name, errors: [{ error }] });
    }
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log(`\n${colors.bright}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📊 OVERALL TEST RESULTS${colors.reset}`);
  console.log(`${colors.bright}${'═'.repeat(60)}${colors.reset}`);
  console.log(`Total Tests:  ${colors.bright}${totalTests}${colors.reset}`);
  console.log(`${colors.green}Passed:${colors.reset}       ${totalPassed}`);
  console.log(`${colors.red}Failed:${colors.reset}       ${totalFailed}`);
  console.log(`${colors.yellow}Skipped:${colors.reset}      ${totalSkipped}`);
  console.log(`${colors.dim}Duration:${colors.reset}     ${duration}s`);
  console.log(`${colors.bright}${'═'.repeat(60)}${colors.reset}\n`);

  // Print detailed error information if there are failures
  if (failedSuites.length > 0) {
    console.log(`${colors.red}${colors.bright}Failed Test Suites:${colors.reset}\n`);

    failedSuites.forEach(({ name, errors }) => {
      console.log(`${colors.red}▸ ${name}${colors.reset}`);
      errors.forEach(({ test, error }) => {
        console.log(`  ${colors.dim}${test}${colors.reset}`);
        console.log(`  ${colors.red}${error.message}${colors.reset}`);
      });
      console.log('');
    });
  }

  // Final result
  if (totalFailed === 0 && totalPassed > 0) {
    console.log(`${colors.green}${colors.bright}✨ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else if (totalPassed === 0 && totalTests === 0) {
    console.log(`${colors.yellow}⚠️  No tests were run${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.red}${colors.bright}💥 ${totalFailed} test(s) failed${colors.reset}\n`);
    process.exit(1);
  }
}

/**
 * Handle errors
 */
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled promise rejection:');
  console.error(error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught exception:');
  console.error(error);
  process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
  console.error('\n❌ Test runner failed:');
  console.error(error);
  process.exit(1);
});
