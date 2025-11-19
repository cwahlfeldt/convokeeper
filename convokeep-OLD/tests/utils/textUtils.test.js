/**
 * Tests for textUtils.js
 */

import { TestRunner, assert } from '../testRunner.js';
import { text } from '../../js/utils/textUtils.js';

const suite = new TestRunner('textUtils');

// ========================================
// Truncate Tests
// ========================================

suite.test('text.truncate handles null/undefined', () => {
  assert.equals(text.truncate(null), '');
  assert.equals(text.truncate(undefined), '');
  assert.equals(text.truncate(''), '');
});

suite.test('text.truncate returns original if under limit', () => {
  const shortText = 'Hello world';
  assert.equals(text.truncate(shortText, 100), shortText);
  assert.equals(text.truncate(shortText, 11), shortText);
});

suite.test('text.truncate adds ellipsis when truncating', () => {
  const longText = 'This is a very long text that should be truncated';
  const result = text.truncate(longText, 20);

  assert.equals(result.length, 20, 'Should be exact max length');
  assert.truthy(result.endsWith('...'), 'Should end with ellipsis');
});

suite.test('text.truncate handles very short max lengths', () => {
  const longText = 'This is a long text';
  const result = text.truncate(longText, 10);

  assert.equals(result.length, 10, 'Should respect very short max length');
  assert.truthy(result.endsWith('...'), 'Should end with ellipsis');
});

suite.test('text.truncate uses default max length', () => {
  const longText = 'a'.repeat(150);
  const result = text.truncate(longText);

  assert.equals(result.length, 100, 'Should use default max length of 100');
  assert.truthy(result.endsWith('...'), 'Should end with ellipsis');
});

// ========================================
// Escape HTML Tests
// ========================================

suite.test('text.escapeHtml escapes ampersand', () => {
  assert.equals(text.escapeHtml('foo & bar'), 'foo &amp; bar');
});

suite.test('text.escapeHtml escapes less than', () => {
  assert.equals(text.escapeHtml('foo < bar'), 'foo &lt; bar');
});

suite.test('text.escapeHtml escapes greater than', () => {
  assert.equals(text.escapeHtml('foo > bar'), 'foo &gt; bar');
});

suite.test('text.escapeHtml escapes double quotes', () => {
  assert.equals(text.escapeHtml('say "hello"'), 'say &quot;hello&quot;');
});

suite.test('text.escapeHtml escapes single quotes', () => {
  assert.equals(text.escapeHtml("it's"), 'it&#039;s');
});

suite.test('text.escapeHtml handles XSS attempts', () => {
  const xssAttempt = '<script>alert("XSS")</script>';
  const result = text.escapeHtml(xssAttempt);

  assert.falsy(result.includes('<script>'), 'Should escape script tags');
  assert.truthy(result.includes('&lt;script&gt;'), 'Should contain escaped tags');
});

suite.test('text.escapeHtml handles multiple special chars', () => {
  const input = '<div class="test" data-value=\'123\'>A & B</div>';
  const result = text.escapeHtml(input);

  assert.falsy(result.includes('<'), 'Should not contain <');
  assert.falsy(result.includes('>'), 'Should not contain >');
  assert.truthy(result.includes('&lt;'), 'Should contain &lt;');
  assert.truthy(result.includes('&gt;'), 'Should contain &gt;');
  assert.truthy(result.includes('&amp;'), 'Should escape ampersand');
});

// ========================================
// Is Empty Tests
// ========================================

suite.test('text.isEmpty returns true for null/undefined', () => {
  assert.truthy(text.isEmpty(null), 'Should be empty for null');
  assert.truthy(text.isEmpty(undefined), 'Should be empty for undefined');
});

suite.test('text.isEmpty returns true for empty string', () => {
  assert.truthy(text.isEmpty(''), 'Should be empty for empty string');
});

suite.test('text.isEmpty returns true for whitespace only', () => {
  assert.truthy(text.isEmpty('   '), 'Should be empty for spaces');
  assert.truthy(text.isEmpty('\t'), 'Should be empty for tab');
  assert.truthy(text.isEmpty('\n'), 'Should be empty for newline');
  assert.truthy(text.isEmpty('  \n\t  '), 'Should be empty for mixed whitespace');
});

suite.test('text.isEmpty returns false for non-empty strings', () => {
  assert.falsy(text.isEmpty('hello'), 'Should not be empty for text');
  assert.falsy(text.isEmpty('  hello  '), 'Should not be empty for text with whitespace');
  assert.falsy(text.isEmpty('0'), 'Should not be empty for zero');
});

// ========================================
// Normalize Line Breaks Tests
// ========================================

suite.test('text.normalizeLineBreaks handles null/undefined', () => {
  assert.equals(text.normalizeLineBreaks(null), '');
  assert.equals(text.normalizeLineBreaks(undefined), '');
  assert.equals(text.normalizeLineBreaks(''), '');
});

suite.test('text.normalizeLineBreaks converts Windows line breaks', () => {
  const input = 'line1\r\nline2\r\nline3';
  const result = text.normalizeLineBreaks(input);

  assert.equals(result, 'line1\nline2\nline3', 'Should convert \\r\\n to \\n');
  assert.falsy(result.includes('\r'), 'Should not contain carriage returns');
});

suite.test('text.normalizeLineBreaks converts Mac line breaks', () => {
  const input = 'line1\rline2\rline3';
  const result = text.normalizeLineBreaks(input);

  assert.equals(result, 'line1\nline2\nline3', 'Should convert \\r to \\n');
  assert.falsy(result.includes('\r'), 'Should not contain carriage returns');
});

suite.test('text.normalizeLineBreaks handles mixed line breaks', () => {
  const input = 'line1\r\nline2\rline3\nline4';
  const result = text.normalizeLineBreaks(input);

  assert.equals(result, 'line1\nline2\nline3\nline4', 'Should normalize all types');
  assert.falsy(result.includes('\r'), 'Should not contain carriage returns');
});

suite.test('text.normalizeLineBreaks preserves Unix line breaks', () => {
  const input = 'line1\nline2\nline3';
  const result = text.normalizeLineBreaks(input);

  assert.equals(result, input, 'Should preserve \\n line breaks');
});

suite.test('text.normalizeLineBreaks handles text without line breaks', () => {
  const input = 'single line text';
  const result = text.normalizeLineBreaks(input);

  assert.equals(result, input, 'Should return unchanged text');
});

// Export suite
export default suite;

// Auto-run if loaded directly
if (import.meta.url.endsWith(new URL(import.meta.url).pathname)) {
  suite.run();
}
