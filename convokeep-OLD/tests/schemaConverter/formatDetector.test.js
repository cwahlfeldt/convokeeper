/**
 * Tests for formatDetector.js
 */

import { TestRunner, assert } from '../testRunner.js';
import { FormatDetector } from '../../js/schemaConverter/formatDetector.js';

const suite = new TestRunner('formatDetector');

let detector;

suite.beforeEach(() => {
  detector = new FormatDetector();
});

// ========================================
// ConvoKeep Format Detection Tests
// ========================================

suite.test('isConvoKeepFormat detects valid ConvoKeep format', () => {
  const convoKeepData = {
    conversation_id: 'test-123',
    title: 'Test Conversation',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    source: 'convokeep',
    messages: [
      { id: 'msg1', role: 'user', content: 'Hello' }
    ]
  };

  assert.truthy(
    detector.isConvoKeepFormat(convoKeepData),
    'Should detect ConvoKeep format'
  );
});

suite.test('isConvoKeepFormat rejects missing conversation_id', () => {
  const invalidData = {
    title: 'Test',
    created_at: '2024-01-15T10:30:00Z',
    source: 'convokeep',
    messages: []
  };

  assert.falsy(
    detector.isConvoKeepFormat(invalidData),
    'Should reject data without conversation_id'
  );
});

suite.test('isConvoKeepFormat rejects missing messages array', () => {
  const invalidData = {
    conversation_id: 'test-123',
    created_at: '2024-01-15T10:30:00Z',
    source: 'convokeep'
  };

  assert.falsy(
    detector.isConvoKeepFormat(invalidData),
    'Should reject data without messages array'
  );
});

suite.test('isConvoKeepFormat rejects non-array messages', () => {
  const invalidData = {
    conversation_id: 'test-123',
    created_at: '2024-01-15T10:30:00Z',
    source: 'convokeep',
    messages: 'not an array'
  };

  assert.falsy(
    detector.isConvoKeepFormat(invalidData),
    'Should reject non-array messages'
  );
});

suite.test('isConvoKeepFormat rejects null/undefined', () => {
  assert.falsy(detector.isConvoKeepFormat(null), 'Should reject null');
  assert.falsy(detector.isConvoKeepFormat(undefined), 'Should reject undefined');
});

// ========================================
// ChatGPT Format Detection Tests
// ========================================

suite.test('isChatGptFormat detects valid ChatGPT format', () => {
  const chatGptData = {
    title: 'ChatGPT Conversation',
    create_time: 1704528600,
    mapping: {
      'node1': {
        message: { content: { parts: ['Hello'] } }
      }
    }
  };

  assert.truthy(
    detector.isChatGptFormat(chatGptData),
    'Should detect ChatGPT format'
  );
});

suite.test('isChatGptFormat requires mapping object', () => {
  const invalidData = {
    title: 'Test',
    create_time: 1704528600
  };

  assert.falsy(
    detector.isChatGptFormat(invalidData),
    'Should reject data without mapping'
  );
});

suite.test('isChatGptFormat accepts title or create_time', () => {
  const withTitle = {
    title: 'Test',
    mapping: {}
  };

  const withCreateTime = {
    create_time: 1704528600,
    mapping: {}
  };

  assert.truthy(
    detector.isChatGptFormat(withTitle),
    'Should accept data with title'
  );

  assert.truthy(
    detector.isChatGptFormat(withCreateTime),
    'Should accept data with create_time'
  );
});

suite.test('isChatGptFormat rejects null/undefined', () => {
  assert.falsy(detector.isChatGptFormat(null), 'Should reject null');
  assert.falsy(detector.isChatGptFormat(undefined), 'Should reject undefined');
});

// ========================================
// Claude Format Detection Tests
// ========================================

suite.test('isClaudeFormat detects valid Claude format', () => {
  const claudeData = {
    uuid: 'claude-123',
    name: 'Claude Conversation',
    chat_messages: [
      { uuid: 'msg1', text: 'Hello' }
    ]
  };

  assert.truthy(
    detector.isClaudeFormat(claudeData),
    'Should detect Claude format'
  );
});

suite.test('isClaudeFormat requires chat_messages array', () => {
  const invalidData = {
    uuid: 'claude-123',
    name: 'Test'
  };

  assert.falsy(
    detector.isClaudeFormat(invalidData),
    'Should reject data without chat_messages'
  );
});

suite.test('isClaudeFormat rejects non-array chat_messages', () => {
  const invalidData = {
    uuid: 'claude-123',
    name: 'Test',
    chat_messages: 'not an array'
  };

  assert.falsy(
    detector.isClaudeFormat(invalidData),
    'Should reject non-array chat_messages'
  );
});

suite.test('isClaudeFormat accepts uuid or name', () => {
  const withUuid = {
    uuid: 'claude-123',
    chat_messages: []
  };

  const withName = {
    name: 'Test',
    chat_messages: []
  };

  assert.truthy(
    detector.isClaudeFormat(withUuid),
    'Should accept data with uuid'
  );

  assert.truthy(
    detector.isClaudeFormat(withName),
    'Should accept data with name'
  );
});

suite.test('isClaudeFormat rejects null/undefined', () => {
  assert.falsy(detector.isClaudeFormat(null), 'Should reject null');
  assert.falsy(detector.isClaudeFormat(undefined), 'Should reject undefined');
});

// ========================================
// Format Detection Tests
// ========================================

suite.test('detectFormat identifies ConvoKeep format', () => {
  const data = {
    conversation_id: 'test-123',
    created_at: '2024-01-15T10:30:00Z',
    source: 'convokeep',
    messages: []
  };

  assert.equals(
    detector.detectFormat(data),
    'convokeep',
    'Should identify ConvoKeep format'
  );
});

suite.test('detectFormat identifies ChatGPT format', () => {
  const data = {
    title: 'Test',
    create_time: 1704528600,
    mapping: {}
  };

  assert.equals(
    detector.detectFormat(data),
    'chatgpt',
    'Should identify ChatGPT format'
  );
});

suite.test('detectFormat identifies Claude format', () => {
  const data = {
    uuid: 'claude-123',
    chat_messages: []
  };

  assert.equals(
    detector.detectFormat(data),
    'claude',
    'Should identify Claude format'
  );
});

suite.test('detectFormat returns generic for unknown format', () => {
  const data = {
    some: 'data',
    that: 'does not match any format'
  };

  assert.equals(
    detector.detectFormat(data),
    'generic',
    'Should return generic for unknown format'
  );
});

suite.test('detectFormat prioritizes ConvoKeep format', () => {
  // Data that could match multiple formats
  const data = {
    conversation_id: 'test-123',
    created_at: '2024-01-15T10:30:00Z',
    source: 'convokeep',
    messages: [],
    // Also has ChatGPT-like fields
    title: 'Test',
    mapping: {}
  };

  assert.equals(
    detector.detectFormat(data),
    'convokeep',
    'Should prioritize ConvoKeep format if present'
  );
});

// Export suite
export default suite;

// Auto-run if loaded directly
if (import.meta.url.endsWith(new URL(import.meta.url).pathname)) {
  suite.run();
}
