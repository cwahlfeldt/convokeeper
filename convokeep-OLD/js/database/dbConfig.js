/**
 * Database Configuration Module
 * 
 * Contains all database configuration constants.
 * Centralizes configuration to make it easier to update.
 */

export const DB_CONFIG = {
  name: 'convokeep-db',
  version: 3,  // Incremented for organization features
  stores: {
    conversations: 'conversations'
  },
  indexes: [
    { name: 'by_conversation_id', keyPath: 'conversation_id', unique: true },
    { name: 'by_source', keyPath: 'source', unique: false },
    { name: 'by_created_at', keyPath: 'created_at', unique: false },
    { name: 'by_updated_at', keyPath: 'updated_at', unique: false },
    { name: 'by_model', keyPath: 'model', unique: false },
    { name: 'by_title', keyPath: 'title', unique: false },
    // New indexes for organization features (v3)
    { name: 'by_starred', keyPath: 'starred', unique: false },
    { name: 'by_archived', keyPath: 'archived', unique: false },
    { name: 'by_tags', keyPath: 'tags', unique: false, multiEntry: true }
  ],
  batchSize: 50,  // Number of items to process in a batch
  searchFuzzyThreshold: 0.7  // Threshold for fuzzy search matching
};
