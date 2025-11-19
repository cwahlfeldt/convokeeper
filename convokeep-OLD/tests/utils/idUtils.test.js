/**
 * Tests for idUtils.js
 */

import { TestRunner, assert } from '../testRunner.js';
import {
  generateUniqueId,
  generateUuidV4,
  createSequentialIdGenerator,
  hashString
} from '../../js/utils/idUtils.js';

const suite = new TestRunner('idUtils');

// ========================================
// Generate Unique ID Tests
// ========================================

suite.test('generateUniqueId creates unique IDs', () => {
  const id1 = generateUniqueId();
  const id2 = generateUniqueId();

  assert.isType(id1, 'string', 'Should return string');
  assert.isType(id2, 'string', 'Should return string');
  assert.truthy(id1 !== id2, 'Should generate unique IDs');
});

suite.test('generateUniqueId uses default prefix', () => {
  const id = generateUniqueId();
  assert.truthy(id.startsWith('id_'), 'Should use default "id" prefix');
});

suite.test('generateUniqueId uses custom prefix', () => {
  const id = generateUniqueId('custom');
  assert.truthy(id.startsWith('custom_'), 'Should use custom prefix');
});

suite.test('generateUniqueId includes timestamp', () => {
  const before = Date.now();
  const id = generateUniqueId('test');
  const after = Date.now();

  // Extract timestamp from ID (format: prefix_timestamp_random)
  const parts = id.split('_');
  const timestamp = parseInt(parts[1]);

  assert.truthy(timestamp >= before && timestamp <= after, 'Should include current timestamp');
});

suite.test('generateUniqueId includes random component', () => {
  const id = generateUniqueId('test');
  const parts = id.split('_');

  assert.equals(parts.length, 3, 'Should have 3 parts: prefix, timestamp, random');
  assert.truthy(parts[2].length > 0, 'Should have random component');
});

// ========================================
// Generate UUID v4 Tests
// ========================================

suite.test('generateUuidV4 creates valid UUID format', () => {
  const uuid = generateUuidV4();

  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  assert.truthy(uuidRegex.test(uuid), 'Should match UUID v4 format');
});

suite.test('generateUuidV4 creates unique UUIDs', () => {
  const uuid1 = generateUuidV4();
  const uuid2 = generateUuidV4();

  assert.truthy(uuid1 !== uuid2, 'Should generate unique UUIDs');
});

suite.test('generateUuidV4 has correct version number', () => {
  const uuid = generateUuidV4();
  const parts = uuid.split('-');

  // Version should be 4 (in the 3rd group)
  assert.truthy(parts[2].startsWith('4'), 'Should have version 4');
});

suite.test('generateUuidV4 has correct variant', () => {
  const uuid = generateUuidV4();
  const parts = uuid.split('-');

  // Variant bits should be 8, 9, a, or b (in the 4th group)
  const variantChar = parts[3][0].toLowerCase();
  assert.truthy(['8', '9', 'a', 'b'].includes(variantChar), 'Should have correct variant');
});

// ========================================
// Sequential ID Generator Tests
// ========================================

suite.test('createSequentialIdGenerator creates generator function', () => {
  const generator = createSequentialIdGenerator();
  assert.isType(generator, 'function', 'Should return a function');
});

suite.test('createSequentialIdGenerator generates sequential IDs', () => {
  const generator = createSequentialIdGenerator('test');

  const id1 = generator();
  const id2 = generator();
  const id3 = generator();

  assert.equals(id1, 'test_1', 'First ID should be test_1');
  assert.equals(id2, 'test_2', 'Second ID should be test_2');
  assert.equals(id3, 'test_3', 'Third ID should be test_3');
});

suite.test('createSequentialIdGenerator uses default prefix', () => {
  const generator = createSequentialIdGenerator();
  const id = generator();

  assert.truthy(id.startsWith('id_'), 'Should use default "id" prefix');
});

suite.test('createSequentialIdGenerator uses custom prefix', () => {
  const generator = createSequentialIdGenerator('custom');
  const id = generator();

  assert.truthy(id.startsWith('custom_'), 'Should use custom prefix');
});

suite.test('createSequentialIdGenerator uses custom seed', () => {
  const generator = createSequentialIdGenerator('test', 100);

  const id1 = generator();
  const id2 = generator();

  assert.equals(id1, 'test_100', 'First ID should start at seed');
  assert.equals(id2, 'test_101', 'Second ID should increment from seed');
});

suite.test('createSequentialIdGenerator maintains independent counters', () => {
  const gen1 = createSequentialIdGenerator('a');
  const gen2 = createSequentialIdGenerator('b');

  const a1 = gen1();
  const b1 = gen2();
  const a2 = gen1();
  const b2 = gen2();

  assert.equals(a1, 'a_1', 'Generator 1 should start at 1');
  assert.equals(b1, 'b_1', 'Generator 2 should start at 1');
  assert.equals(a2, 'a_2', 'Generator 1 should increment independently');
  assert.equals(b2, 'b_2', 'Generator 2 should increment independently');
});

// ========================================
// Hash String Tests
// ========================================

suite.test('hashString returns consistent hash for same input', () => {
  const input = 'test string';
  const hash1 = hashString(input);
  const hash2 = hashString(input);

  assert.equals(hash1, hash2, 'Should return same hash for same input');
});

suite.test('hashString returns different hashes for different inputs', () => {
  const hash1 = hashString('test1');
  const hash2 = hashString('test2');

  assert.truthy(hash1 !== hash2, 'Should return different hashes for different inputs');
});

suite.test('hashString handles empty string', () => {
  const hash = hashString('');
  assert.isType(hash, 'string', 'Should return string for empty input');
  assert.truthy(hash.length > 0, 'Should return non-empty hash');
});

suite.test('hashString returns base-36 string', () => {
  const hash = hashString('test');
  const base36Regex = /^[0-9a-z]+$/;

  assert.truthy(base36Regex.test(hash), 'Should return base-36 string (0-9, a-z)');
});

suite.test('hashString handles long strings', () => {
  const longString = 'a'.repeat(10000);
  const hash = hashString(longString);

  assert.isType(hash, 'string', 'Should handle long strings');
  assert.truthy(hash.length > 0, 'Should return non-empty hash');
});

suite.test('hashString handles special characters', () => {
  const hash = hashString('test@#$%^&*()!');
  assert.isType(hash, 'string', 'Should handle special characters');
  assert.truthy(hash.length > 0, 'Should return non-empty hash');
});

suite.test('hashString handles unicode', () => {
  const hash = hashString('测试 🚀 café');
  assert.isType(hash, 'string', 'Should handle unicode');
  assert.truthy(hash.length > 0, 'Should return non-empty hash');
});

suite.test('hashString is deterministic', () => {
  const input = 'deterministic test';
  const hashes = Array.from({ length: 10 }, () => hashString(input));

  const allSame = hashes.every(hash => hash === hashes[0]);
  assert.truthy(allSame, 'Should always return same hash for same input');
});

// Export suite
export default suite;

// Auto-run if loaded directly
if (import.meta.url.endsWith(new URL(import.meta.url).pathname)) {
  suite.run();
}
