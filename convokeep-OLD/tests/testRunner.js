/**
 * Vanilla JavaScript Test Runner
 * A simple, zero-dependency test framework for ConvoKeep
 */

export class TestRunner {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.tests = [];
    this.beforeEachFn = null;
    this.afterEachFn = null;
    this.beforeAllFn = null;
    this.afterAllFn = null;
    this.results = { passed: 0, failed: 0, skipped: 0, errors: [] };
  }

  /**
   * Register a test
   * @param {string} name - Test name
   * @param {Function} fn - Test function
   */
  test(name, fn) {
    this.tests.push({ name, fn, skip: false });
  }

  /**
   * Skip a test
   * @param {string} name - Test name
   * @param {Function} fn - Test function
   */
  skip(name, fn) {
    this.tests.push({ name, fn, skip: true });
  }

  /**
   * Run before each test
   * @param {Function} fn - Setup function
   */
  beforeEach(fn) {
    this.beforeEachFn = fn;
  }

  /**
   * Run after each test
   * @param {Function} fn - Teardown function
   */
  afterEach(fn) {
    this.afterEachFn = fn;
  }

  /**
   * Run before all tests
   * @param {Function} fn - Setup function
   */
  beforeAll(fn) {
    this.beforeAllFn = fn;
  }

  /**
   * Run after all tests
   * @param {Function} fn - Teardown function
   */
  afterAll(fn) {
    this.afterAllFn = fn;
  }

  /**
   * Run all tests in this suite
   * @returns {Promise<Object>} Test results
   */
  async run() {
    console.log(`\n🧪 Running: ${this.suiteName}`);
    console.log('─'.repeat(60));

    // Run beforeAll hook
    if (this.beforeAllFn) {
      try {
        await this.beforeAllFn();
      } catch (error) {
        console.error(`❌ beforeAll hook failed: ${error.message}`);
        return this.results;
      }
    }

    for (const { name, fn, skip } of this.tests) {
      if (skip) {
        this.results.skipped++;
        console.log(`⊘ ${name} (skipped)`);
        continue;
      }

      try {
        // Run beforeEach hook
        if (this.beforeEachFn) {
          await this.beforeEachFn();
        }

        // Run test
        await fn();

        // Run afterEach hook
        if (this.afterEachFn) {
          await this.afterEachFn();
        }

        this.results.passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({ test: name, error });
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
        if (error.stack) {
          console.error(`   ${error.stack.split('\n')[1]?.trim()}`);
        }
      }
    }

    // Run afterAll hook
    if (this.afterAllFn) {
      try {
        await this.afterAllFn();
      } catch (error) {
        console.error(`❌ afterAll hook failed: ${error.message}`);
      }
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    const total = this.results.passed + this.results.failed + this.results.skipped;
    console.log('─'.repeat(60));
    console.log(
      `Total: ${total} | ` +
      `Passed: ${this.results.passed} | ` +
      `Failed: ${this.results.failed} | ` +
      `Skipped: ${this.results.skipped}`
    );
    if (this.results.failed === 0 && this.results.passed > 0) {
      console.log('✨ All tests passed!\n');
    } else if (this.results.failed > 0) {
      console.log('💥 Some tests failed\n');
    }
  }
}

/**
 * Assertion utilities
 */
export const assert = {
  /**
   * Assert strict equality
   */
  equals(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected: ${JSON.stringify(expected)}\n` +
        `  Actual: ${JSON.stringify(actual)}`
      );
    }
  },

  /**
   * Assert deep equality (JSON comparison)
   */
  deepEquals(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);
    if (actualStr !== expectedStr) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected: ${expectedStr}\n` +
        `  Actual: ${actualStr}`
      );
    }
  },

  /**
   * Assert value is truthy
   */
  truthy(value, message = '') {
    if (!value) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected truthy value, got: ${JSON.stringify(value)}`
      );
    }
  },

  /**
   * Assert value is falsy
   */
  falsy(value, message = '') {
    if (value) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected falsy value, got: ${JSON.stringify(value)}`
      );
    }
  },

  /**
   * Assert function throws an error
   */
  throws(fn, expectedError = null, message = '') {
    let threw = false;
    let caughtError = null;
    try {
      fn();
    } catch (e) {
      threw = true;
      caughtError = e;
    }
    if (!threw) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected function to throw`
      );
    }
    if (expectedError && caughtError.message !== expectedError) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected error: ${expectedError}\n` +
        `  Actual error: ${caughtError.message}`
      );
    }
  },

  /**
   * Assert promise rejects
   */
  async rejects(promise, expectedError = null, message = '') {
    let threw = false;
    let caughtError = null;
    try {
      await promise;
    } catch (e) {
      threw = true;
      caughtError = e;
    }
    if (!threw) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected promise to reject`
      );
    }
    if (expectedError && caughtError.message !== expectedError) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected error: ${expectedError}\n` +
        `  Actual error: ${caughtError.message}`
      );
    }
  },

  /**
   * Assert array includes item
   */
  arrayIncludes(array, item, message = '') {
    if (!Array.isArray(array)) {
      throw new Error(`Assertion failed: ${message}\n  Value is not an array`);
    }
    if (!array.includes(item)) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Array does not include: ${JSON.stringify(item)}\n` +
        `  Array: ${JSON.stringify(array)}`
      );
    }
  },

  /**
   * Assert array length
   */
  arrayLength(array, expectedLength, message = '') {
    if (!Array.isArray(array)) {
      throw new Error(`Assertion failed: ${message}\n  Value is not an array`);
    }
    if (array.length !== expectedLength) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected length: ${expectedLength}\n` +
        `  Actual length: ${array.length}`
      );
    }
  },

  /**
   * Assert value is null
   */
  isNull(value, message = '') {
    if (value !== null) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected null, got: ${JSON.stringify(value)}`
      );
    }
  },

  /**
   * Assert value is not null
   */
  isNotNull(value, message = '') {
    if (value === null) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected non-null value`
      );
    }
  },

  /**
   * Assert value is undefined
   */
  isUndefined(value, message = '') {
    if (value !== undefined) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected undefined, got: ${JSON.stringify(value)}`
      );
    }
  },

  /**
   * Assert value is not undefined
   */
  isNotUndefined(value, message = '') {
    if (value === undefined) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected defined value`
      );
    }
  },

  /**
   * Assert value type
   */
  isType(value, expectedType, message = '') {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected type: ${expectedType}\n` +
        `  Actual type: ${actualType}`
      );
    }
  },

  /**
   * Assert value is instance of class
   */
  isInstanceOf(value, expectedClass, message = '') {
    if (!(value instanceof expectedClass)) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected instance of: ${expectedClass.name}\n` +
        `  Actual: ${value.constructor.name}`
      );
    }
  },

  /**
   * Assert string contains substring
   */
  stringContains(str, substring, message = '') {
    if (typeof str !== 'string') {
      throw new Error(`Assertion failed: ${message}\n  Value is not a string`);
    }
    if (!str.includes(substring)) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  String does not contain: ${substring}\n` +
        `  String: ${str}`
      );
    }
  },

  /**
   * Assert string matches regex
   */
  stringMatches(str, regex, message = '') {
    if (typeof str !== 'string') {
      throw new Error(`Assertion failed: ${message}\n  Value is not a string`);
    }
    if (!regex.test(str)) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  String does not match regex: ${regex}\n` +
        `  String: ${str}`
      );
    }
  },

  /**
   * Assert number is greater than
   */
  greaterThan(actual, expected, message = '') {
    if (actual <= expected) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected ${actual} to be greater than ${expected}`
      );
    }
  },

  /**
   * Assert number is less than
   */
  lessThan(actual, expected, message = '') {
    if (actual >= expected) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `  Expected ${actual} to be less than ${expected}`
      );
    }
  }
};

/**
 * Mock utilities for testing
 */
export const mock = {
  /**
   * Create a spy function that tracks calls
   */
  fn(implementation = () => {}) {
    const calls = [];
    const spy = function(...args) {
      calls.push(args);
      return implementation(...args);
    };
    spy.calls = calls;
    spy.callCount = () => calls.length;
    spy.calledWith = (...args) => {
      return calls.some(call =>
        JSON.stringify(call) === JSON.stringify(args)
      );
    };
    spy.reset = () => {
      calls.length = 0;
    };
    return spy;
  },

  /**
   * Create a mock object with spy methods
   */
  object(methods = {}) {
    const mockObj = {};
    for (const [name, impl] of Object.entries(methods)) {
      mockObj[name] = mock.fn(impl);
    }
    return mockObj;
  }
};
