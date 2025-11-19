import '@testing-library/jest-dom';

// Mock IndexedDB for testing
class MockIDBRequest {
  result: any;
  error: any = null;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
}

class MockIDBIndex {
  private store: MockIDBObjectStore;

  constructor(store: MockIDBObjectStore) {
    this.store = store;
  }

  openCursor() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = null; // Empty cursor
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }

  count() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = this.store.data.size;
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }
}

class MockIDBObjectStore {
  data: Map<string, any> = new Map();
  private indices: Map<string, MockIDBIndex> = new Map();

  put(value: any, key?: any) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.set(key || value.id, value);
      request.result = key || value.id;
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }

  get(key: any) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = this.data.get(key);
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }

  getAll() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = Array.from(this.data.values());
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }

  count() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = this.data.size;
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }

  index(name: string) {
    if (!this.indices.has(name)) {
      this.indices.set(name, new MockIDBIndex(this));
    }
    return this.indices.get(name)!;
  }

  openCursor() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request.result = null; // Empty cursor
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }

  createIndex(name: string, keyPath: string | string[], options?: any) {
    const index = new MockIDBIndex(this);
    this.indices.set(name, index);
    return index;
  }
}

class MockIDBTransaction {
  objectStore(name: string) {
    return new MockIDBObjectStore();
  }
}

class MockIDBDatabase {
  transaction(storeNames: string | string[], mode: string) {
    return new MockIDBTransaction();
  }

  createObjectStore(name: string, options?: any) {
    return new MockIDBObjectStore();
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  onupgradeneeded: ((event: any) => void) | null = null;
}

// Mock the indexedDB global
const mockIndexedDB = {
  open: (name: string, version?: number) => {
    const request = new MockIDBOpenDBRequest();
    setTimeout(() => {
      request.result = new MockIDBDatabase();
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  },
  deleteDatabase: (name: string) => {
    const request = new MockIDBRequest();
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }
};

// Set the mock on global object
(global as any).indexedDB = mockIndexedDB;
