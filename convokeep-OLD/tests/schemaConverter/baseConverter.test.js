/**
 * Tests for baseConverter.js
 */

import { TestRunner, assert, mock } from '../testRunner.js';
import { BaseConverter } from '../../js/schemaConverter/formatConverters/baseConverter.js';

const suite = new TestRunner('baseConverter');

let converter;
let mockIdGenerator;

suite.beforeEach(() => {
  mockIdGenerator = mock.fn((prefix) => `${prefix}_mock_id`);
  converter = new BaseConverter(mockIdGenerator);
});

// ========================================
// Format Timestamp Tests
// ========================================

suite.test('formatTimestamp handles null/undefined', () => {
  const result1 = converter.formatTimestamp(null);
  const result2 = converter.formatTimestamp(undefined);

  // Should return current timestamp in ISO format
  assert.truthy(result1.endsWith('Z'), 'Should return ISO format for null');
  assert.truthy(result2.endsWith('Z'), 'Should return ISO format for undefined');
});

suite.test('formatTimestamp converts Unix timestamp (seconds)', () => {
  // January 15, 2024 10:30:00 UTC
  const unixSeconds = 1705318200;
  const result = converter.formatTimestamp(unixSeconds);

  assert.truthy(result.includes('2024'), 'Should convert Unix seconds to ISO format');
  assert.truthy(result.endsWith('Z'), 'Should end with Z (UTC)');
});

suite.test('formatTimestamp converts Unix timestamp (milliseconds)', () => {
  // January 15, 2024 10:30:00 UTC
  const unixMillis = 1705318200000;
  const result = converter.formatTimestamp(unixMillis);

  assert.truthy(result.includes('2024'), 'Should convert Unix millis to ISO format');
  assert.truthy(result.endsWith('Z'), 'Should end with Z (UTC)');
});

suite.test('formatTimestamp handles string timestamps', () => {
  const dateString = '2024-01-15T10:30:00Z';
  const result = converter.formatTimestamp(dateString);

  // Node.js may add milliseconds (.000), so check for inclusion rather than exact match
  assert.truthy(result.includes('2024-01-15'), 'Should include date');
  assert.truthy(result.includes('10:30:00'), 'Should include time');
  assert.truthy(result.endsWith('Z'), 'Should end with Z');
});

suite.test('formatTimestamp handles numeric strings', () => {
  const numericString = '1705318200';
  const result = converter.formatTimestamp(numericString);

  assert.truthy(result.includes('2024'), 'Should parse numeric strings');
  assert.truthy(result.endsWith('Z'), 'Should end with Z (UTC)');
});

suite.test('formatTimestamp handles invalid input gracefully', () => {
  const result = converter.formatTimestamp('invalid-date');

  // Should return current timestamp as fallback
  assert.truthy(result.endsWith('Z'), 'Should return valid ISO format as fallback');
});

suite.test('formatTimestamp distinguishes seconds from milliseconds', () => {
  // Timestamp < 10000000000 should be treated as seconds
  const recentSeconds = 1700000000; // ~2023
  const result1 = converter.formatTimestamp(recentSeconds);

  // Timestamp >= 10000000000 should be treated as milliseconds
  const recentMillis = 1700000000000;
  const result2 = converter.formatTimestamp(recentMillis);

  assert.truthy(result1.includes('2023'), 'Should handle seconds correctly');
  assert.truthy(result2.includes('2023'), 'Should handle milliseconds correctly');
});

// ========================================
// Normalize Role Tests
// ========================================

suite.test('normalizeRole handles null/undefined', () => {
  assert.equals(converter.normalizeRole(null), 'unknown');
  assert.equals(converter.normalizeRole(undefined), 'unknown');
  assert.equals(converter.normalizeRole(''), 'unknown');
});

suite.test('normalizeRole converts "human" to "user"', () => {
  assert.equals(converter.normalizeRole('human'), 'user');
  assert.equals(converter.normalizeRole('Human'), 'user');
  assert.equals(converter.normalizeRole('HUMAN'), 'user');
});

suite.test('normalizeRole preserves "assistant"', () => {
  assert.equals(converter.normalizeRole('assistant'), 'assistant');
  assert.equals(converter.normalizeRole('Assistant'), 'assistant');
  assert.equals(converter.normalizeRole('ASSISTANT'), 'assistant');
});

suite.test('normalizeRole preserves "system"', () => {
  assert.equals(converter.normalizeRole('system'), 'system');
  assert.equals(converter.normalizeRole('System'), 'system');
  assert.equals(converter.normalizeRole('SYSTEM'), 'system');
});

suite.test('normalizeRole lowercases unknown roles', () => {
  assert.equals(converter.normalizeRole('CustomRole'), 'customrole');
  assert.equals(converter.normalizeRole('BOT'), 'bot');
});

suite.test('normalizeRole is case-insensitive', () => {
  assert.equals(converter.normalizeRole('HuMaN'), 'user');
  assert.equals(converter.normalizeRole('aSsIsTaNt'), 'assistant');
  assert.equals(converter.normalizeRole('SyStEm'), 'system');
});

// ========================================
// Generate ID Tests
// ========================================

suite.test('generateId calls id generator with prefix', () => {
  const result = converter.generateId('test');

  assert.equals(mockIdGenerator.callCount(), 1, 'Should call id generator once');
  assert.truthy(mockIdGenerator.calledWith('test'), 'Should pass prefix to generator');
  assert.equals(result, 'test_mock_id', 'Should return generated ID');
});

suite.test('generateId works with different prefixes', () => {
  const id1 = converter.generateId('conv');
  const id2 = converter.generateId('msg');

  assert.equals(id1, 'conv_mock_id', 'Should generate ID with conv prefix');
  assert.equals(id2, 'msg_mock_id', 'Should generate ID with msg prefix');
  assert.equals(mockIdGenerator.callCount(), 2, 'Should call generator for each ID');
});

suite.test('generateId uses provided id generator', () => {
  const customGenerator = mock.fn((prefix) => `custom_${prefix}_123`);
  const customConverter = new BaseConverter(customGenerator);

  const result = customConverter.generateId('test');

  assert.equals(result, 'custom_test_123', 'Should use custom generator');
  assert.equals(customGenerator.callCount(), 1, 'Should call custom generator');
});

// Export suite
export default suite;

// Auto-run if loaded directly
if (import.meta.url.endsWith(new URL(import.meta.url).pathname)) {
  suite.run();
}
