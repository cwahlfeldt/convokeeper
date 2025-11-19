/**
 * Tests for formatUtils.js
 */

import { TestRunner, assert } from '../testRunner.js';
import { formatters } from '../../js/utils/formatUtils.js';

const suite = new TestRunner('formatUtils');

// ========================================
// Date Formatting Tests
// ========================================

suite.test('formatters.date handles null/undefined', () => {
  assert.equals(formatters.date(null), 'Unknown date');
  assert.equals(formatters.date(undefined), 'Unknown date');
  assert.equals(formatters.date(''), 'Unknown date');
});

suite.test('formatters.date handles invalid dates', () => {
  assert.equals(formatters.date('not-a-date'), 'Invalid date');
  assert.equals(formatters.date('2024-13-45'), 'Invalid date');
});

suite.test('formatters.date formats today with time', () => {
  const now = new Date();
  const result = formatters.date(now.toISOString());

  // Should return time format (HH:MM)
  assert.truthy(result.includes(':'), 'Should contain colon for time');
  assert.truthy(result.length < 10, 'Should be short time format');
});

suite.test('formatters.date formats dates from last week', () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const result = formatters.date(threeDaysAgo.toISOString());

  // Should return day of week (e.g., "Mon", "Tue")
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hasDayOfWeek = daysOfWeek.some(day => result.includes(day));
  assert.truthy(hasDayOfWeek, 'Should contain day of week');
});

suite.test('formatters.date formats dates from this year', () => {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const result = formatters.date(twoMonthsAgo.toISOString());

  // Should contain month abbreviation (e.g., "Jan", "Feb")
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hasMonth = months.some(month => result.includes(month));
  assert.truthy(hasMonth, 'Should contain month abbreviation');
});

suite.test('formatters.date formats old dates with year', () => {
  const oldDate = new Date('2020-01-15T10:30:00Z');
  const result = formatters.date(oldDate.toISOString());

  // Should include year
  assert.truthy(result.includes('2020'), 'Should contain year for old dates');
});

// ========================================
// Full Date Formatting Tests
// ========================================

suite.test('formatters.fullDate handles null/undefined', () => {
  assert.equals(formatters.fullDate(null), 'Unknown date');
  assert.equals(formatters.fullDate(undefined), 'Unknown date');
  assert.equals(formatters.fullDate(''), 'Unknown date');
});

suite.test('formatters.fullDate handles invalid dates', () => {
  assert.equals(formatters.fullDate('invalid'), 'Invalid date');
});

suite.test('formatters.fullDate includes date and time', () => {
  const date = new Date('2024-06-15T14:30:00Z');
  const result = formatters.fullDate(date.toISOString());

  // Should contain both date and time elements
  assert.truthy(result.includes('Jun') || result.includes('6'), 'Should contain month');
  assert.truthy(result.includes('15'), 'Should contain day');
  assert.truthy(result.includes('2024'), 'Should contain year');
  assert.truthy(result.includes(':'), 'Should contain time separator');
});

// ========================================
// Time Formatting Tests
// ========================================

suite.test('formatters.time handles null/undefined', () => {
  assert.equals(formatters.time(null), '');
  assert.equals(formatters.time(undefined), '');
  assert.equals(formatters.time(''), '');
});

suite.test('formatters.time handles invalid dates', () => {
  assert.equals(formatters.time('invalid'), '');
});

suite.test('formatters.time formats time only', () => {
  const date = new Date('2024-06-15T14:30:00Z');
  const result = formatters.time(date.toISOString());

  // Should contain time separator
  assert.truthy(result.includes(':'), 'Should contain time separator');
  assert.truthy(result.length < 10, 'Should be short time-only format');
});

// ========================================
// File Size Formatting Tests
// ========================================

suite.test('formatters.fileSize handles zero bytes', () => {
  assert.equals(formatters.fileSize(0), '0 Bytes');
});

suite.test('formatters.fileSize formats bytes', () => {
  assert.equals(formatters.fileSize(500), '500 Bytes');
  assert.equals(formatters.fileSize(1023), '1023 Bytes');
});

suite.test('formatters.fileSize formats kilobytes', () => {
  const result = formatters.fileSize(1024);
  assert.truthy(result.includes('KB'), 'Should contain KB unit');
  assert.truthy(result.startsWith('1'), 'Should be approximately 1 KB');
});

suite.test('formatters.fileSize formats megabytes', () => {
  const result = formatters.fileSize(1024 * 1024);
  assert.truthy(result.includes('MB'), 'Should contain MB unit');
  assert.truthy(result.startsWith('1'), 'Should be approximately 1 MB');
});

suite.test('formatters.fileSize formats gigabytes', () => {
  const result = formatters.fileSize(1024 * 1024 * 1024);
  assert.truthy(result.includes('GB'), 'Should contain GB unit');
  assert.truthy(result.startsWith('1'), 'Should be approximately 1 GB');
});

suite.test('formatters.fileSize formats decimal values', () => {
  const result = formatters.fileSize(1536); // 1.5 KB
  assert.truthy(result.includes('KB'), 'Should contain KB unit');
  assert.truthy(result.includes('1.5'), 'Should show decimal value');
});

suite.test('formatters.fileSize handles large values', () => {
  const result = formatters.fileSize(1024 * 1024 * 1024 * 1024); // 1 TB
  assert.truthy(result.includes('TB'), 'Should handle terabytes');
});

// Export suite
export default suite;

// Auto-run if loaded directly
if (import.meta.url.endsWith(new URL(import.meta.url).pathname)) {
  suite.run();
}
