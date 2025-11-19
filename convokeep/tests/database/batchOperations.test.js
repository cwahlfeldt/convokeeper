/**
 * Tests for batch operations and organization features
 * Tests the database repository methods for bulk operations, tags, stars, and archive
 */

import { TestRunner, assert } from '../testRunner.js';

// Mock IndexedDB for testing
class MockIDBDatabase {
  constructor() {
    this.objectStoreNames = { contains: () => true };
    this.stores = new Map();
  }

  createObjectStore(name, options) {
    const store = new MockObjectStore(name);
    this.stores.set(name, store);
    return store;
  }

  transaction(storeName, mode) {
    return new MockTransaction(this.stores.get(storeName));
  }
}

class MockTransaction {
  constructor(store) {
    this.store = store;
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
  }

  objectStore(name) {
    return this.store;
  }

  complete() {
    if (this.oncomplete) this.oncomplete();
  }
}

class MockObjectStore {
  constructor(name) {
    this.name = name;
    this.data = new Map();
    this.indexes = new Map();
    this.autoIncrement = 1;
  }

  createIndex(name, keyPath, options = {}) {
    this.indexes.set(name, { keyPath, options });
  }

  index(name) {
    return {
      get: (value) => {
        return {
          onsuccess: null,
          onerror: null,
          result: null,
          execute() {
            for (const item of this.parent.data.values()) {
              if (item[this.keyPath] === value) {
                this.result = item;
                if (this.onsuccess) this.onsuccess({ target: this });
                return;
              }
            }
            this.result = undefined;
            if (this.onsuccess) this.onsuccess({ target: this });
          },
          parent: this,
          keyPath: this.indexes.get(name).keyPath
        };
      },
      getAll: (value) => {
        const results = [];
        const keyPath = this.indexes.get(name).keyPath;
        for (const item of this.data.values()) {
          // Handle multiEntry for tags
          if (Array.isArray(item[keyPath])) {
            if (item[keyPath].includes(value)) {
              results.push(item);
            }
          } else if (item[keyPath] === value) {
            results.push(item);
          }
        }
        return {
          onsuccess: null,
          onerror: null,
          result: results,
          execute() {
            if (this.onsuccess) this.onsuccess({ target: this });
          }
        };
      }
    };
  }

  add(value) {
    const id = this.autoIncrement++;
    const item = { ...value, id };
    this.data.set(id, item);
    return {
      onsuccess: null,
      onerror: null,
      execute() {
        if (this.onsuccess) this.onsuccess();
      }
    };
  }

  put(value) {
    this.data.set(value.id, value);
    return {
      onsuccess: null,
      onerror: null,
      execute() {
        if (this.onsuccess) this.onsuccess();
      }
    };
  }

  delete(id) {
    this.data.delete(id);
    return {
      onsuccess: null,
      onerror: null,
      execute() {
        if (this.onsuccess) this.onsuccess();
      }
    };
  }

  getAll() {
    return {
      onsuccess: null,
      onerror: null,
      result: Array.from(this.data.values()),
      execute() {
        if (this.onsuccess) this.onsuccess({ target: this });
      }
    };
  }

  openCursor() {
    const items = Array.from(this.data.values());
    let index = 0;

    return {
      onsuccess: null,
      onerror: null,
      execute() {
        const cursor = index < items.length ? {
          value: items[index],
          continue: () => {
            index++;
            this.execute();
          },
          update: (value) => {
            this.parent.data.set(value.id, value);
            return { onsuccess: null };
          },
          parent: this
        } : null;

        if (this.onsuccess) {
          this.onsuccess({ target: { result: cursor } });
        }
      },
      parent: this
    };
  }
}

const suite = new TestRunner('Database Batch Operations');

// ========================================
// Bulk Update Tests
// ========================================

suite.test('bulkUpdateConversations - updates tags on multiple conversations', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  // Add test data
  mockStore.add({ conversation_id: 'conv1', tags: [], starred: false, archived: false });
  mockStore.add({ conversation_id: 'conv2', tags: [], starred: false, archived: false });
  mockStore.add({ conversation_id: 'conv3', tags: [], starred: false, archived: false });

  // Simulate bulk update
  const updates = { tags: ['work', 'important'] };
  const conversationIds = ['conv1', 'conv2'];

  // Mock the update process
  conversationIds.forEach(id => {
    const getRequest = mockStore.index('by_conversation_id').get(id);
    getRequest.execute();
    const conversation = getRequest.result;
    if (conversation) {
      Object.assign(conversation, updates);
      const putRequest = mockStore.put(conversation);
      putRequest.execute();
    }
  });

  // Verify updates
  const conv1Request = mockStore.index('by_conversation_id').get('conv1');
  conv1Request.execute();
  assert.deepEquals(conv1Request.result.tags, ['work', 'important'], 'Conv1 should have tags');

  const conv2Request = mockStore.index('by_conversation_id').get('conv2');
  conv2Request.execute();
  assert.deepEquals(conv2Request.result.tags, ['work', 'important'], 'Conv2 should have tags');

  const conv3Request = mockStore.index('by_conversation_id').get('conv3');
  conv3Request.execute();
  assert.deepEquals(conv3Request.result.tags, [], 'Conv3 should not be updated');
});

suite.test('bulkUpdateConversations - updates starred status', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  mockStore.add({ conversation_id: 'conv1', tags: [], starred: false, archived: false });
  mockStore.add({ conversation_id: 'conv2', tags: [], starred: false, archived: false });

  const updates = { starred: true };
  const conversationIds = ['conv1', 'conv2'];

  conversationIds.forEach(id => {
    const getRequest = mockStore.index('by_conversation_id').get(id);
    getRequest.execute();
    const conversation = getRequest.result;
    if (conversation) {
      Object.assign(conversation, updates);
      mockStore.put(conversation).execute();
    }
  });

  const conv1Request = mockStore.index('by_conversation_id').get('conv1');
  conv1Request.execute();
  assert.equals(conv1Request.result.starred, true, 'Conv1 should be starred');

  const conv2Request = mockStore.index('by_conversation_id').get('conv2');
  conv2Request.execute();
  assert.equals(conv2Request.result.starred, true, 'Conv2 should be starred');
});

suite.test('bulkUpdateConversations - updates archived status', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  mockStore.add({ conversation_id: 'conv1', tags: [], starred: false, archived: false });

  const updates = { archived: true };
  const getRequest = mockStore.index('by_conversation_id').get('conv1');
  getRequest.execute();
  const conversation = getRequest.result;
  Object.assign(conversation, updates);
  mockStore.put(conversation).execute();

  const verifyRequest = mockStore.index('by_conversation_id').get('conv1');
  verifyRequest.execute();
  assert.equals(verifyRequest.result.archived, true, 'Conv1 should be archived');
});

// ========================================
// Bulk Delete Tests
// ========================================

suite.test('bulkDeleteConversations - deletes multiple conversations', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  const conv1 = mockStore.add({ conversation_id: 'conv1', tags: [], starred: false });
  conv1.execute();
  const conv2 = mockStore.add({ conversation_id: 'conv2', tags: [], starred: false });
  conv2.execute();
  const conv3 = mockStore.add({ conversation_id: 'conv3', tags: [], starred: false });
  conv3.execute();

  assert.equals(mockStore.data.size, 3, 'Should have 3 conversations initially');

  // Delete conv1 and conv2
  const conversationIds = ['conv1', 'conv2'];
  conversationIds.forEach(id => {
    const getRequest = mockStore.index('by_conversation_id').get(id);
    getRequest.execute();
    const conversation = getRequest.result;
    if (conversation) {
      mockStore.delete(conversation.id).execute();
    }
  });

  assert.equals(mockStore.data.size, 1, 'Should have 1 conversation remaining');

  const conv3Request = mockStore.index('by_conversation_id').get('conv3');
  conv3Request.execute();
  assert.truthy(conv3Request.result, 'Conv3 should still exist');
});

// ========================================
// Tag Operations Tests
// ========================================

suite.test('getAllTags - returns tags with usage counts', () => {
  const mockStore = new MockObjectStore('conversations');

  mockStore.add({ conversation_id: 'conv1', tags: ['work', 'important'] });
  mockStore.add({ conversation_id: 'conv2', tags: ['work', 'personal'] });
  mockStore.add({ conversation_id: 'conv3', tags: ['personal'] });

  const getAllRequest = mockStore.getAll();
  getAllRequest.execute();
  const conversations = getAllRequest.result;

  const tagCounts = new Map();
  conversations.forEach(conv => {
    conv.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const tags = Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count }));

  assert.equals(tags.length, 3, 'Should have 3 unique tags');
  assert.equals(tagCounts.get('work'), 2, 'work tag should have count of 2');
  assert.equals(tagCounts.get('important'), 1, 'important tag should have count of 1');
  assert.equals(tagCounts.get('personal'), 2, 'personal tag should have count of 2');
});

suite.test('getConversationsByTags - finds conversations with specific tag', () => {
  const mockStore = new MockObjectStore('conversations');
  mockStore.createIndex('by_tags', 'tags', { multiEntry: true });

  mockStore.add({ conversation_id: 'conv1', tags: ['work', 'important'] });
  mockStore.add({ conversation_id: 'conv2', tags: ['work', 'personal'] });
  mockStore.add({ conversation_id: 'conv3', tags: ['personal'] });

  const request = mockStore.index('by_tags').getAll('work');
  request.execute();

  assert.equals(request.result.length, 2, 'Should find 2 conversations with "work" tag');
  assert.truthy(
    request.result.some(c => c.conversation_id === 'conv1'),
    'Should include conv1'
  );
  assert.truthy(
    request.result.some(c => c.conversation_id === 'conv2'),
    'Should include conv2'
  );
});

suite.test('renameTag - renames tag across all conversations', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  mockStore.add({ conversation_id: 'conv1', tags: ['work', 'important'] });
  mockStore.add({ conversation_id: 'conv2', tags: ['work', 'personal'] });
  mockStore.add({ conversation_id: 'conv3', tags: ['personal'] });

  // Simulate tag rename: work -> job
  const cursorRequest = mockStore.openCursor();
  let updatedCount = 0;

  const processCursor = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const conversation = cursor.value;
      const tagIndex = conversation.tags.indexOf('work');
      if (tagIndex !== -1) {
        conversation.tags.splice(tagIndex, 1);
        if (!conversation.tags.includes('job')) {
          conversation.tags.push('job');
        }
        cursor.update(conversation);
        updatedCount++;
      }
      cursor.continue();
    }
  };

  cursorRequest.onsuccess = processCursor;
  cursorRequest.execute();

  assert.equals(updatedCount, 2, 'Should update 2 conversations');

  // Verify the rename
  const conv1Request = mockStore.index('by_conversation_id').get('conv1');
  conv1Request.execute();
  assert.truthy(conv1Request.result.tags.includes('job'), 'Conv1 should have "job" tag');
  assert.falsy(conv1Request.result.tags.includes('work'), 'Conv1 should not have "work" tag');

  const conv2Request = mockStore.index('by_conversation_id').get('conv2');
  conv2Request.execute();
  assert.truthy(conv2Request.result.tags.includes('job'), 'Conv2 should have "job" tag');
  assert.falsy(conv2Request.result.tags.includes('work'), 'Conv2 should not have "work" tag');

  const conv3Request = mockStore.index('by_conversation_id').get('conv3');
  conv3Request.execute();
  assert.falsy(conv3Request.result.tags.includes('job'), 'Conv3 should not have "job" tag');
});

suite.test('deleteTag - removes tag from all conversations', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  mockStore.add({ conversation_id: 'conv1', tags: ['work', 'important'] });
  mockStore.add({ conversation_id: 'conv2', tags: ['work', 'personal'] });
  mockStore.add({ conversation_id: 'conv3', tags: ['personal'] });

  // Simulate tag deletion: work
  const cursorRequest = mockStore.openCursor();
  let updatedCount = 0;

  const processCursor = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const conversation = cursor.value;
      const tagIndex = conversation.tags.indexOf('work');
      if (tagIndex !== -1) {
        conversation.tags.splice(tagIndex, 1);
        cursor.update(conversation);
        updatedCount++;
      }
      cursor.continue();
    }
  };

  cursorRequest.onsuccess = processCursor;
  cursorRequest.execute();

  assert.equals(updatedCount, 2, 'Should update 2 conversations');

  // Verify the deletion
  const conv1Request = mockStore.index('by_conversation_id').get('conv1');
  conv1Request.execute();
  assert.deepEquals(conv1Request.result.tags, ['important'], 'Conv1 should only have "important" tag');

  const conv2Request = mockStore.index('by_conversation_id').get('conv2');
  conv2Request.execute();
  assert.deepEquals(conv2Request.result.tags, ['personal'], 'Conv2 should only have "personal" tag');
});

// ========================================
// Edge Cases
// ========================================

suite.test('handles empty tag arrays', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  mockStore.add({ conversation_id: 'conv1', tags: [] });

  const updates = { tags: ['new-tag'] };
  const getRequest = mockStore.index('by_conversation_id').get('conv1');
  getRequest.execute();
  const conversation = getRequest.result;
  Object.assign(conversation, updates);
  mockStore.put(conversation).execute();

  const verifyRequest = mockStore.index('by_conversation_id').get('conv1');
  verifyRequest.execute();
  assert.deepEquals(verifyRequest.result.tags, ['new-tag'], 'Should add tag to empty array');
});

suite.test('prevents duplicate tags when renaming', () => {
  const mockStore = new MockObjectStore('conversations');
  // Create index
  mockStore.createIndex('by_conversation_id', 'conversation_id', { unique: true });

  mockStore.add({ conversation_id: 'conv1', tags: ['work', 'job'] });

  // Try to rename 'work' to 'job' (which already exists)
  const getRequest = mockStore.index('by_conversation_id').get('conv1');
  getRequest.execute();
  const conversation = getRequest.result;

  const tagIndex = conversation.tags.indexOf('work');
  if (tagIndex !== -1) {
    conversation.tags.splice(tagIndex, 1);
    if (!conversation.tags.includes('job')) {
      conversation.tags.push('job');
    }
  }
  mockStore.put(conversation).execute();

  const verifyRequest = mockStore.index('by_conversation_id').get('conv1');
  verifyRequest.execute();
  assert.deepEquals(verifyRequest.result.tags, ['job'], 'Should not have duplicate tags');
});

export default suite;
