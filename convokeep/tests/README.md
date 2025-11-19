# ConvoKeep Test Suite

A comprehensive, zero-dependency vanilla JavaScript test framework for ConvoKeep.

## Philosophy

ConvoKeep maintains a strict **no-framework** policy. This test suite follows the same principles:

- ✅ **100% Vanilla JavaScript** - No testing frameworks (Jest, Mocha, etc.)
- ✅ **ES6 Modules** - Native module system
- ✅ **No Build Step** - Tests run directly without compilation
- ✅ **Browser & Node.js** - Works in both environments
- ✅ **Zero Dependencies** - Completely self-contained

## Quick Start

### Running Tests in Node.js

```bash
# Install no dependencies needed! Just run:
npm test

# Or directly:
node tests/run.js
```

### Running Tests in Browser

1. **Option 1**: Open directly in browser
   ```bash
   open tests/index.html
   # or just double-click tests/index.html
   ```

2. **Option 2**: Serve locally (recommended for development)
   ```bash
   # Python 3
   python3 -m http.server 8000

   # Node.js
   npx http-server -p 8000

   # Then visit: http://localhost:8000/tests/
   ```

## Test Structure

```
tests/
├── index.html                  # Browser test runner (visual UI)
├── run.js                      # Node.js test runner (CLI)
├── testRunner.js               # Core test framework
├── README.md                   # This file
│
├── utils/                      # Unit tests for utilities
│   ├── formatUtils.test.js     # Date/time formatting tests
│   ├── textUtils.test.js       # Text processing tests
│   └── idUtils.test.js         # ID generation tests
│
├── schemaConverter/            # Schema conversion tests
│   ├── formatDetector.test.js  # Format detection tests
│   └── baseConverter.test.js   # Base converter tests
│
└── integration/                # Integration tests
    └── schemaConversion.test.js # End-to-end conversion tests
```

## Writing Tests

### Basic Test Suite

```javascript
import { TestRunner, assert } from '../testRunner.js';

const suite = new TestRunner('My Feature');

suite.test('does something correctly', () => {
  const result = myFunction();
  assert.equals(result, expectedValue);
});

suite.test('handles edge cases', () => {
  assert.throws(() => myFunction(null));
});

export default suite;
```

### Available Assertions

```javascript
// Equality
assert.equals(actual, expected, message);
assert.deepEquals(obj1, obj2, message);

// Truthiness
assert.truthy(value, message);
assert.falsy(value, message);

// Null checks
assert.isNull(value, message);
assert.isNotNull(value, message);
assert.isUndefined(value, message);
assert.isNotUndefined(value, message);

// Type checking
assert.isType(value, 'string', message);
assert.isInstanceOf(obj, ClassName, message);

// Arrays
assert.arrayIncludes(array, item, message);
assert.arrayLength(array, length, message);

// Strings
assert.stringContains(str, substring, message);
assert.stringMatches(str, /regex/, message);

// Numbers
assert.greaterThan(actual, expected, message);
assert.lessThan(actual, expected, message);

// Error handling
assert.throws(fn, message);
await assert.rejects(promise, message);
```

### Setup and Teardown

```javascript
const suite = new TestRunner('My Feature');

// Run once before all tests
suite.beforeAll(() => {
  // Setup expensive resources
});

// Run before each test
suite.beforeEach(() => {
  // Reset state
});

// Run after each test
suite.afterEach(() => {
  // Cleanup
});

// Run once after all tests
suite.afterAll(() => {
  // Teardown expensive resources
});
```

### Async Tests

```javascript
suite.test('async operation works', async () => {
  const result = await fetchData();
  assert.truthy(result);
});

suite.test('promise rejection works', async () => {
  await assert.rejects(
    fetchData('/invalid'),
    'Expected error message'
  );
});
```

### Mocking

```javascript
import { mock } from '../testRunner.js';

suite.test('calls callback correctly', () => {
  const callback = mock.fn((x) => x * 2);

  myFunction(callback);

  assert.equals(callback.callCount(), 1);
  assert.truthy(callback.calledWith(5));
});

// Mock object with multiple methods
const mockApi = mock.object({
  get: (id) => ({ id, name: 'Test' }),
  post: (data) => ({ ...data, id: 123 })
});
```

### Skipping Tests

```javascript
// Skip a test temporarily
suite.skip('not ready yet', () => {
  // This won't run
});
```

## Test Organization

### Unit Tests

Test individual functions in isolation:

```javascript
// tests/utils/myUtil.test.js
import { TestRunner, assert } from '../testRunner.js';
import { myFunction } from '../../js/utils/myUtil.js';

const suite = new TestRunner('myUtil');

suite.test('handles valid input', () => {
  assert.equals(myFunction('test'), 'TEST');
});

export default suite;
```

### Integration Tests

Test multiple components working together:

```javascript
// tests/integration/myFeature.test.js
import { TestRunner, assert } from '../testRunner.js';
import { ComponentA } from '../../js/componentA.js';
import { ComponentB } from '../../js/componentB.js';

const suite = new TestRunner('myFeature (integration)');

suite.test('components work together', () => {
  const a = new ComponentA();
  const b = new ComponentB(a);

  const result = b.process();
  assert.truthy(result.success);
});

export default suite;
```

## Browser vs Node.js

### Browser-Only Tests

Some tests require browser APIs (DOM, IndexedDB, etc.) and only run in the browser:

```javascript
// This test will only run in tests/index.html
suite.test('uses DOM API', () => {
  const el = document.createElement('div');
  assert.truthy(el instanceof HTMLElement);
});
```

### Node.js-Only Tests

Tests that run in Node.js avoid browser APIs:

```javascript
// This test runs in both browser and Node.js
suite.test('pure JavaScript', () => {
  const result = 2 + 2;
  assert.equals(result, 4);
});
```

### Test Configuration

To add a new test suite:

**1. Browser (`tests/index.html`):**
```javascript
const testSuites = [
  { path: './your/test.js', name: 'yourTest' },
  // ...
];
```

**2. Node.js (`tests/run.js`):**
```javascript
const testSuites = [
  { path: './your/test.js', name: 'yourTest' },
  // ...
];
```

## Best Practices

### ✅ DO

- Write descriptive test names
- Test one thing per test
- Use setup/teardown for repeated code
- Test edge cases and error handling
- Keep tests independent (no shared state)
- Export your test suite as default

### ❌ DON'T

- Don't test implementation details
- Don't write tests that depend on other tests
- Don't use external dependencies
- Don't leave tests skipped for long
- Don't write flaky tests (random failures)

## Examples

### Testing a Utility Function

```javascript
// js/utils/formatDate.js
export function formatDate(date) {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString();
}

// tests/utils/formatDate.test.js
import { TestRunner, assert } from '../testRunner.js';
import { formatDate } from '../../js/utils/formatDate.js';

const suite = new TestRunner('formatDate');

suite.test('formats valid dates', () => {
  const result = formatDate('2024-01-15');
  assert.truthy(result.includes('2024'));
});

suite.test('handles null gracefully', () => {
  assert.equals(formatDate(null), 'Unknown');
});

export default suite;
```

### Testing a Class

```javascript
// js/models/User.js
export class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, ${this.name}!`;
  }
}

// tests/models/User.test.js
import { TestRunner, assert } from '../testRunner.js';
import { User } from '../../js/models/User.js';

const suite = new TestRunner('User');

suite.test('creates user with name', () => {
  const user = new User('Alice');
  assert.equals(user.name, 'Alice');
});

suite.test('greets correctly', () => {
  const user = new User('Bob');
  assert.equals(user.greet(), 'Hello, Bob!');
});

export default suite;
```

## Troubleshooting

### Tests fail in Node.js but pass in browser

- Check for browser-only APIs (window, document, etc.)
- Ensure all imports use relative paths
- Verify ES6 module syntax

### Tests fail in browser but pass in Node.js

- Check for Node.js-only APIs (process, fs, etc.)
- Ensure browser compatibility
- Check CSP (Content Security Policy) issues

### Import errors

- Use `.js` extension in all imports
- Use relative paths (`./` or `../`)
- Ensure `type: "module"` in package.json for Node.js

### Async tests timing out

- Ensure async functions return promises
- Use `async/await` properly
- Check for unhandled promise rejections

## Coverage

To manually check coverage:

1. Run tests in browser with DevTools open
2. Go to Coverage tab
3. Start coverage recording
4. Run tests
5. Check which lines were executed

## Performance

The test suite is designed to be fast:

- ✅ No compilation or build step
- ✅ Parallel test execution where possible
- ✅ Minimal overhead
- ✅ Fast startup time

Typical run time: **< 1 second** for all tests

## Contributing

When adding new features to ConvoKeep:

1. **Write tests first** (TDD approach recommended)
2. **Add unit tests** for individual functions
3. **Add integration tests** for component interactions
4. **Update both test runners** (browser and Node.js)
5. **Ensure all tests pass** before committing

## Future Enhancements

Potential improvements (while staying vanilla):

- [ ] Code coverage reporting
- [ ] Test result history
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Parallel test execution
- [ ] Watch mode for development

## License

Same as ConvoKeep - MIT License
