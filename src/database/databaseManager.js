/**
 * Database Manager Module
 *
 * Orchestrates database operations and coordinates specialized components.
 */

import { DB_CONFIG } from './dbConfig.js';
import { DbConnector } from './dbConnector.js';
import { ConversationRepository } from './conversationRepository.js';

/**
 * Main class for coordinating database operations
 */
export class DatabaseManager {
  constructor() {
    // Create dependencies
    this.dbConnector = new DbConnector(DB_CONFIG);
    this.conversationRepo = new ConversationRepository(this.dbConnector, DB_CONFIG);

    // Track initialization state
    this.isInitialized = false;

    // Track persistent storage request state
    this.persistentStorageRequested = false;
  }

  /**
   * Initialize the database connection
   * @returns {Promise<IDBDatabase>} The database connection
   */
  async init() {
    if (this.isInitialized) {
      return this.dbConnector.getConnection();
    }

    try {
      // Initialize database connection
      await this.dbConnector.connect();

      // Set initialized flag
      this.isInitialized = true;

      // Return the database connection
      return this.dbConnector.getConnection();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Request persistent storage to prevent automatic data eviction
   * Should be called when user first uploads data for better UX
   * @returns {Promise<boolean>} Whether persistent storage was granted
   */
  async requestPersistentStorage() {
    // Only request once
    if (this.persistentStorageRequested) {
      return false;
    }

    this.persistentStorageRequested = true;

    if (!navigator.storage || !navigator.storage.persist) {
      console.log('Storage API not supported - data may be evicted under storage pressure');
      return false;
    }

    try {
      // Check if already persistent
      const isPersisted = await navigator.storage.persisted();

      if (isPersisted) {
        console.log('Storage is already persistent');
        return true;
      }

      // Request persistent storage
      const granted = await navigator.storage.persist();

      if (granted) {
        console.log('Persistent storage granted - data will not be automatically evicted');
      } else {
        console.log('Persistent storage denied - data may be evicted under storage pressure');
      }

      return granted;
    } catch (error) {
      console.warn('Error requesting persistent storage:', error);
      return false;
    }
  }
  
  /**
   * Store conversations in the database
   * @param {Array|Object} conversations - Conversations to store
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Object>} Results of the storage operation
   */
  async storeConversations(conversations, progressCallback) {
    // Ensure database is initialized
    if (!this.isInitialized) {
      await this.init();
    }
    
    // Store conversations
    return this.conversationRepo.storeConversations(conversations, progressCallback);
  }
  
  /**
   * Get conversations with filtering options
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Object with conversations array and pagination info
   */
  async getConversations(options) {
    // Ensure database is initialized
    if (!this.isInitialized) {
      await this.init();
    }

    // Get conversations from repository
    const conversations = await this.conversationRepo.getConversations(options);

    // Get total count for pagination
    const totalConversations = await this.conversationRepo.getConversations({
      ...options,
      countOnly: true
    });

    // Calculate pagination info
    const limit = options.limit || 20;
    const page = options.page || 1;
    const totalPages = Math.ceil(totalConversations.length / limit);

    console.log('[DatabaseManager] getConversations returning:', {
      conversationsCount: conversations.length,
      totalConversations: totalConversations.length,
      totalPages: totalPages
    });

    // Return in expected format
    return {
      conversations: conversations,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalConversations: totalConversations.length,
        perPage: limit
      }
    };
  }
  
  /**
   * Get a conversation by ID
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<Object>} The conversation
   */
  async getConversationById(conversationId) {
    // Ensure database is initialized
    if (!this.isInitialized) {
      await this.init();
    }
    
    // Get conversation by ID
    return this.conversationRepo.getConversationById(conversationId);
  }
  
  /**
   * Clear all data from the database
   * @returns {Promise<void>}
   */
  async clearDatabase() {
    // Ensure database is initialized
    if (!this.isInitialized) {
      await this.init();
    }
    
    // Clear the database
    return this.conversationRepo.clearDatabase();
  }
  
  /**
   * Check if there are any conversations in the database
   * @returns {Promise<boolean>} Whether there are conversations
   */
  async hasConversations() {
    // Ensure database is initialized
    if (!this.isInitialized) {
      await this.init();
    }

    // Check if there are any conversations
    return this.conversationRepo.hasConversations();
  }

  /**
   * Update conversation metadata (tags, starred, archived)
   * @param {string} conversationId - The conversation ID
   * @param {Object} updates - Fields to update (tags, starred, archived)
   * @returns {Promise<Object>} Updated conversation
   */
  async updateConversationMetadata(conversationId, updates) {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.conversationRepo.updateConversationMetadata(conversationId, updates);
  }

  /**
   * Bulk update conversations
   * @param {string[]} conversationIds - Array of conversation IDs
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Update statistics
   */
  async bulkUpdateConversations(conversationIds, updates) {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.conversationRepo.bulkUpdateConversations(conversationIds, updates);
  }

  /**
   * Bulk delete conversations
   * @param {string[]} conversationIds - Array of conversation IDs to delete
   * @returns {Promise<Object>} Deletion statistics
   */
  async bulkDeleteConversations(conversationIds) {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.conversationRepo.bulkDeleteConversations(conversationIds);
  }

  /**
   * Get conversations by tags
   * @param {string[]} tags - Array of tags to filter by
   * @param {boolean} matchAll - If true, conversation must have ALL tags (AND logic)
   * @returns {Promise<Array>} Conversations with the specified tags
   */
  async getConversationsByTags(tags, matchAll = false) {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.conversationRepo.getConversationsByTags(tags, matchAll);
  }

  /**
   * Get all unique tags across all conversations
   * @returns {Promise<Array>} Array of tag objects with usage counts
   */
  async getAllTags() {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.conversationRepo.getAllTags();
  }

  /**
   * Rename a tag across all conversations
   * @param {string} oldTag - Current tag name
   * @param {string} newTag - New tag name
   * @returns {Promise<Object>} Update statistics
   */
  async renameTag(oldTag, newTag) {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.conversationRepo.renameTag(oldTag, newTag);
  }

  /**
   * Delete a tag from all conversations
   * @param {string} tag - Tag to delete
   * @returns {Promise<Object>} Deletion statistics
   */
  async deleteTag(tag) {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.conversationRepo.deleteTag(tag);
  }
}
