/**
 * Integration tests for schema conversion
 * Tests the full flow of format detection and conversion
 */

import { TestRunner, assert } from '../testRunner.js';
import { FormatDetector } from '../../js/schemaConverter/formatDetector.js';
import { generateUniqueId } from '../../js/utils/idUtils.js';
import { BaseConverter } from '../../js/schemaConverter/formatConverters/baseConverter.js';

const suite = new TestRunner('schemaConversion (integration)');

let detector;
let converter;

suite.beforeEach(() => {
  detector = new FormatDetector();
  converter = new BaseConverter(generateUniqueId);
});

// ========================================
// End-to-End Format Detection Tests
// ========================================

suite.test('detects and differentiates between formats', () => {
  const chatGptData = {
    title: 'ChatGPT Conversation',
    create_time: 1704528600,
    mapping: { node1: {} }
  };

  const claudeData = {
    uuid: 'claude-123',
    name: 'Claude Conversation',
    chat_messages: []
  };

  const convoKeepData = {
    conversation_id: 'test-123',
    created_at: '2024-01-15T10:30:00Z',
    source: 'convokeep',
    messages: []
  };

  assert.equals(detector.detectFormat(chatGptData), 'chatgpt');
  assert.equals(detector.detectFormat(claudeData), 'claude');
  assert.equals(detector.detectFormat(convoKeepData), 'convokeep');
});

// ========================================
// Converter Pipeline Tests
// ========================================

suite.test('converter processes timestamps correctly', () => {
  const timestamps = [
    1704528600,        // Unix seconds
    1704528600000,     // Unix milliseconds
    '2024-01-15T10:30:00Z',  // ISO string
    null,              // Should use current time
  ];

  timestamps.forEach((timestamp, index) => {
    const result = converter.formatTimestamp(timestamp);

    assert.isType(result, 'string', `Result ${index} should be string`);
    assert.truthy(result.endsWith('Z'), `Result ${index} should be ISO format`);
    assert.truthy(result.includes('T'), `Result ${index} should have time separator`);
  });
});

suite.test('converter normalizes all role variations', () => {
  const roleMap = {
    'human': 'user',
    'HUMAN': 'user',
    'Human': 'user',
    'assistant': 'assistant',
    'ASSISTANT': 'assistant',
    'system': 'system',
    'SYSTEM': 'system',
    'CustomRole': 'customrole'
  };

  for (const [input, expected] of Object.entries(roleMap)) {
    const result = converter.normalizeRole(input);
    assert.equals(result, expected, `Should normalize "${input}" to "${expected}"`);
  }
});

// ========================================
// ID Generation Tests
// ========================================

suite.test('generates unique IDs consistently', () => {
  const ids = new Set();
  const count = 100;

  for (let i = 0; i < count; i++) {
    const id = converter.generateId('test');
    ids.add(id);
  }

  assert.equals(ids.size, count, 'All generated IDs should be unique');
});

// ========================================
// Format Detection Edge Cases
// ========================================

suite.test('handles ambiguous data structures', () => {
  // Empty object
  assert.equals(detector.detectFormat({}), 'generic');

  // Array instead of object
  assert.equals(detector.detectFormat([]), 'generic');

  // Null/undefined
  assert.equals(detector.detectFormat(null), 'generic');
  assert.equals(detector.detectFormat(undefined), 'generic');
});

suite.test('handles partial format matches', () => {
  // Has mapping but no title/create_time
  const partialChatGpt = {
    mapping: { node1: {} }
  };
  assert.equals(detector.detectFormat(partialChatGpt), 'generic');

  // Has chat_messages but no uuid/name
  const partialClaude = {
    chat_messages: []
  };
  assert.equals(detector.detectFormat(partialClaude), 'generic');

  // Has conversation_id but no messages
  const partialConvoKeep = {
    conversation_id: 'test',
    source: 'test',
    created_at: '2024-01-15T10:30:00Z'
  };
  assert.equals(detector.detectFormat(partialConvoKeep), 'generic');
});

// ========================================
// Data Type Validation Tests
// ========================================

suite.test('validates data types in format detection', () => {
  // ChatGPT with non-object mapping
  const invalidChatGpt = {
    title: 'Test',
    mapping: 'not an object'
  };
  assert.equals(detector.detectFormat(invalidChatGpt), 'generic');

  // Claude with non-array chat_messages
  const invalidClaude = {
    uuid: 'test',
    chat_messages: 'not an array'
  };
  assert.equals(detector.detectFormat(invalidClaude), 'generic');

  // ConvoKeep with non-array messages
  const invalidConvoKeep = {
    conversation_id: 'test',
    source: 'test',
    created_at: '2024-01-15T10:30:00Z',
    messages: 'not an array'
  };
  assert.equals(detector.detectFormat(invalidConvoKeep), 'generic');
});

// ========================================
// Timestamp Conversion Edge Cases
// ========================================

suite.test('handles various timestamp formats', () => {
  const testCases = [
    { input: 0, shouldBeValid: true },  // Unix epoch (edge case)
    { input: 946684800, expected: '2000' },  // Y2K
    { input: '2024-06-15', expected: '2024' },  // Date string
    { input: 'invalid', shouldBeValid: true },  // Invalid (should use current)
  ];

  testCases.forEach(({ input, expected, shouldBeValid }) => {
    const result = converter.formatTimestamp(input);

    if (shouldBeValid) {
      assert.truthy(result.endsWith('Z'), `Should return valid ISO for: ${input}`);
    } else {
      assert.truthy(result.includes(expected), `Should convert ${input} to include ${expected}`);
    }
  });
});

// ========================================
// Combined Workflow Test
// ========================================

suite.test('complete workflow: detect format and process data', () => {
  const conversations = [
    {
      format: 'chatgpt',
      data: {
        title: 'Test ChatGPT',
        create_time: 1704528600,
        mapping: {}
      }
    },
    {
      format: 'claude',
      data: {
        uuid: 'claude-123',
        chat_messages: []
      }
    },
    {
      format: 'convokeep',
      data: {
        conversation_id: 'conv-123',
        created_at: '2024-01-15T10:30:00Z',
        source: 'test',
        messages: []
      }
    }
  ];

  conversations.forEach(({ format, data }) => {
    // Step 1: Detect format
    const detectedFormat = detector.detectFormat(data);
    assert.equals(detectedFormat, format, `Should detect ${format} format`);

    // Step 2: Process timestamps (if applicable)
    if (data.create_time) {
      const timestamp = converter.formatTimestamp(data.create_time);
      assert.truthy(timestamp.endsWith('Z'), 'Should convert timestamp to ISO');
    }

    // Step 3: Generate ID if needed
    if (!data.conversation_id) {
      const id = converter.generateId('conv');
      assert.truthy(id.startsWith('conv_'), 'Should generate conversation ID');
    }
  });
});

// Export suite
export default suite;

// Auto-run if loaded directly
if (import.meta.url.endsWith(new URL(import.meta.url).pathname)) {
  suite.run();
}
