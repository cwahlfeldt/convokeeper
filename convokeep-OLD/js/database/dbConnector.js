/**
 * Database Connector Module
 * 
 * Handles the low-level IndexedDB connection and schema creation.
 */

export class DbConnector {
  /**
   * @param {Object} config - Database configuration
   */
  constructor(config) {
    this.config = config;
    this.db = null;
  }
  
  /**
   * Establish a connection to the database
   * @returns {Promise<IDBDatabase>} The database connection
   */
  async connect() {
    if (this.db) {
      return this.db;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);
      
      // Handle schema upgrades
      request.onupgradeneeded = (event) => {
        const db = event.target.result;


        this._createSchema(db, event.oldVersion, event.newVersion, event);
      };
      
      // Handle success
      request.onsuccess = (event) => {
        this.db = event.target.result;
        
        resolve(this.db);
      };
      
      // Handle errors
      request.onerror = (event) => {
        const error = new Error(`Failed to initialize database: ${event.target.error}`);
        console.error(error);
        reject(error);
      };
    });
  }
  
  /**
   * Get the current database connection
   * @returns {IDBDatabase|null} The database connection
   */
  getConnection() {
    return this.db;
  }
  
  /**
   * Create or update the database schema
   * @param {IDBDatabase} db - The database connection
   * @param {number} oldVersion - Old schema version
   * @param {number} newVersion - New schema version
   */
  _createSchema(db, oldVersion, newVersion, event) {
    // Create conversations store if it doesn't exist
    if (!db.objectStoreNames.contains(this.config.stores.conversations)) {
      const store = db.createObjectStore(this.config.stores.conversations, { keyPath: 'id', autoIncrement: true });
      // Create indexes
      this._createIndexes(store);
    } else if (event && event.target && event.target.transaction) {
      // Update existing schema if needed
      const store = event.target.transaction.objectStore(this.config.stores.conversations);
      // Add any missing indexes
      this._updateIndexes(store);

      // Handle version-specific migrations
      if (oldVersion < 3 && newVersion >= 3) {
        console.log('Migrating database from v2 to v3: Adding organization features');
        this._migrateToV3(store);
      }
    }
  }

  /**
   * Migrate from v2 to v3: Add organization fields
   * @param {IDBObjectStore} store - The object store
   */
  _migrateToV3(store) {
    // Open cursor to update all existing conversations
    const cursorRequest = store.openCursor();

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        const conversation = cursor.value;

        // Add new organization fields if they don't exist
        if (!('tags' in conversation)) {
          conversation.tags = [];
        }
        if (!('starred' in conversation)) {
          conversation.starred = false;
        }
        if (!('archived' in conversation)) {
          conversation.archived = false;
        }

        // Update the conversation
        cursor.update(conversation);

        // Continue to next conversation
        cursor.continue();
      } else {
        console.log('Migration to v3 complete');
      }
    };

    cursorRequest.onerror = (event) => {
      console.error('Error during v3 migration:', event.target.error);
    };
  }
  
  /**
   * Create indexes for a store
   * @param {IDBObjectStore} store - The object store
   */
  _createIndexes(store) {
    this.config.indexes.forEach(index => {
      store.createIndex(index.name, index.keyPath, { unique: index.unique });
    });
  }
  
  /**
   * Update indexes for a store
   * @param {IDBObjectStore} store - The object store
   */
  _updateIndexes(store) {
    this.config.indexes.forEach(index => {
      if (!store.indexNames.contains(index.name)) {
        
        store.createIndex(index.name, index.keyPath, { unique: index.unique });
      }
    });
  }
  
  /**
   * Create a transaction
   * @param {string} storeName - Name of the store
   * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
   * @returns {IDBTransaction} The transaction
   */
  createTransaction(storeName, mode = 'readonly') {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return this.db.transaction(storeName, mode);
  }
  
  /**
   * Get an object store
   * @param {string} storeName - Name of the store
   * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
   * @returns {IDBObjectStore} The object store
   */
  getObjectStore(storeName, mode = 'readonly') {
    const transaction = this.createTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }
}
