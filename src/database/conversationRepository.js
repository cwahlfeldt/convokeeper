/**
 * Conversation Repository Module
 * 
 * Handles storing, retrieving, and managing conversations in the database.
 */

import { processConversations } from '../schemaConverter/index.js';
import { generateUniqueId } from '../utils/idUtils.js';

export class ConversationRepository {
  /**
   * @param {DbConnector} dbConnector - Database connector
   * @param {Object} config - Database configuration
   */
  constructor(dbConnector, config) {
    this.dbConnector = dbConnector;
    this.config = config;
  }
  
  /**
   * Store conversations in the database
   * @param {Array|Object} conversations - Conversations to store
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Object>} Results of the storage operation
   */
  async storeConversations(conversations, progressCallback = null) {
    // Ensure we have an array
    if (!Array.isArray(conversations)) {
      conversations = [conversations];
    }
    
    if (conversations.length === 0) {
      throw new Error('No conversations to store');
    }
    
    // Convert to unified schema
    const unifiedConversations = processConversations(conversations);
    
    
    // Track stats about new vs. updated conversations
    let stats = {
      newConversations: 0,
      updatedConversations: 0
    };
    
    // Process in batches to avoid memory issues with large datasets
    const BATCH_SIZE = this.config.batchSize;
    const totalConversations = unifiedConversations.length;
    let processed = 0;
    
    // Loop through batches
    for (let i = 0; i < totalConversations; i += BATCH_SIZE) {
      const batch = unifiedConversations.slice(i, i + BATCH_SIZE);
      
      // Process this batch
      const batchStats = await this._storeBatch(batch);
      
      // Update stats
      if (batchStats) {
        stats.newConversations += batchStats.newConversations || 0;
        stats.updatedConversations += batchStats.updatedConversations || 0;
      }
      
      // Update progress
      processed += batch.length;
      
      if (progressCallback) {
        const percent = Math.floor((processed / totalConversations) * 100);
        progressCallback(percent, processed, totalConversations);
      }
    }
    
    return {
      totalStored: processed,
      newConversations: stats.newConversations,
      updatedConversations: stats.updatedConversations
    };
  }
  
  /**
   * Store a batch of conversations
   * @param {Array} batch - Batch of conversations to store
   * @returns {Promise<Object>} Statistics about the operation
   */
  async _storeBatch(batch) {
    return new Promise((resolve, reject) => {
      // Get transaction and store
      const transaction = this.dbConnector.createTransaction(
        this.config.stores.conversations,
        'readwrite'
      );

      const store = transaction.objectStore(this.config.stores.conversations);

      // Track statistics for this batch
      let newCount = 0;
      let updateCount = 0;

      // Track pending operations to prevent transaction from completing prematurely
      let pendingOperations = 0;
      let hasError = false;

      // Handle transaction completion
      transaction.oncomplete = () => {
        resolve({
          newConversations: newCount,
          updatedConversations: updateCount
        });
      };

      // Handle transaction errors
      transaction.onerror = (event) => {
        reject(new Error(`Transaction error: ${event.target.error}`));
      };

      transaction.onabort = (event) => {
        reject(new Error(`Transaction aborted: ${event.target.error || 'Unknown error'}`));
      };

      // Process each conversation in the batch sequentially
      const processConversation = (conversation) => {
        // Ensure each conversation has a unique ID
        if (!conversation.conversation_id) {
          conversation.conversation_id = generateUniqueId('conv');
        }

        // Ensure required fields exist
        if (!conversation.created_at) {
          console.warn('[Store] Conversation missing created_at:', conversation.conversation_id);
          conversation.created_at = new Date().toISOString();
        }
        if (!conversation.title) {
          console.warn('[Store] Conversation missing title:', conversation.conversation_id);
          conversation.title = 'Untitled Conversation';
        }

        pendingOperations++;

        // First check if conversation with this ID already exists
        const getRequest = store.index('by_conversation_id').get(conversation.conversation_id);

        getRequest.onsuccess = () => {
          const existingConversation = getRequest.result;

          if (existingConversation) {
            // Update existing conversation
            updateCount++;

            // Update while preserving the original database ID
            const updateRequest = store.put({
              ...conversation,
              id: existingConversation.id
            });

            updateRequest.onsuccess = () => {
              pendingOperations--;
            };

            updateRequest.onerror = (e) => {
              console.error(`[Store] Error updating conversation ${conversation.conversation_id}:`, e.target.error);
              hasError = true;
              pendingOperations--;
            };
          } else {
            // Add new conversation
            newCount++;

            const addRequest = store.add(conversation);

            addRequest.onsuccess = () => {
              pendingOperations--;
            };

            addRequest.onerror = (e) => {
              console.error(`[Store] Error adding conversation ${conversation.conversation_id}:`, e.target.error);
              hasError = true;
              pendingOperations--;
            };
          }
        };

        getRequest.onerror = (e) => {
          console.error(`[Store] Error checking for existing conversation:`, e.target.error);
          hasError = true;
          pendingOperations--;
        };
      };

      // Process all conversations
      batch.forEach(conversation => processConversation(conversation));
    });
  }
  
  /**
   * Get conversations with filtering options
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Conversations matching the query
   */
  async getConversations(options = {}) {
    const defaults = {
      offset: 0,
      limit: 20,
      source: 'all',
      sortOrder: 'newest',
      countOnly: false
    };

    const settings = { ...defaults, ...options };

    // If page is provided, calculate offset from page number
    if (options.page !== undefined) {
      settings.offset = (options.page - 1) * settings.limit;
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Get store and index
        const store = this.dbConnector.getObjectStore(this.config.stores.conversations);

        // First check total count in database
        const countCheckRequest = store.count();
        countCheckRequest.onsuccess = () => {
          console.log('[Query] Total conversations in database:', countCheckRequest.result);
        };

        const index = store.index('by_created_at');

        // Set direction based on sort order
        const direction = settings.sortOrder === 'newest' ? 'prev' : 'next';
        
        // If countOnly, use efficient counting
        if (settings.countOnly) {
          // If no source filter, use direct count for maximum efficiency
          if (settings.source === 'all') {
            const countRequest = store.count();

            countRequest.onsuccess = () => {
              resolve(Array(countRequest.result).fill({ conversation_id: '' }));
            };

            countRequest.onerror = (event) => {
              reject(new Error(`Error counting conversations: ${event.target.error}`));
            };

            return; // Early return for count operation
          }

          // For filtered counts, we still need to iterate but only collect IDs
          const allResults = [];
          const countCursorRequest = index.openCursor(null, direction);

          countCursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;

            if (!cursor) {
              // No more results
              return resolve(allResults);
            }

            const conversation = cursor.value;

            // Apply source filter
            const matchesSource = this._matchesSource(conversation, settings.source);

            // Apply organization filters
            const matchesStarred = settings.starred === undefined || conversation.starred === settings.starred;
            const matchesArchived = settings.archived === undefined || conversation.archived === settings.archived;
            const matchesTag = settings.tag === undefined ||
              (conversation.tags && conversation.tags.includes(settings.tag));

            // Include in count if it matches all filters
            if (matchesSource && matchesStarred && matchesArchived && matchesTag) {
              // For count, we only need IDs
              allResults.push({
                conversation_id: conversation.conversation_id
              });
            }

            // Always continue for count
            cursor.continue();
          };

          countCursorRequest.onerror = (event) => {
            reject(new Error(`Error counting conversations: ${event.target.error}`));
          };

          return; // Early return for count operation
        }
        
        // Normal retrieval with pagination
        console.log('[Query] Opening cursor with settings:', settings);
        const cursorRequest = index.openCursor(null, direction);

        const results = [];
        let skipCount = 0;
        let totalScanned = 0;

        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;

          if (!cursor) {
            // No more results
            console.log('[Query] Cursor complete. Scanned:', totalScanned, 'Results:', results.length);
            return resolve(results);
          }

          totalScanned++;
          const conversation = cursor.value;

          // Log first few conversations to debug
          if (totalScanned <= 3) {
            console.log('[Query] Conversation:', {
              id: conversation.conversation_id,
              title: conversation.title,
              created_at: conversation.created_at,
              source: conversation.source,
              starred: conversation.starred,
              archived: conversation.archived
            });
          }

          // Apply source filter if not 'all'
          const matchesSource = settings.source === 'all' ||
            this._matchesSource(conversation, settings.source);

          // Apply organization filters
          const matchesStarred = settings.starred === undefined || conversation.starred === settings.starred;
          const matchesArchived = settings.archived === undefined || conversation.archived === settings.archived;
          const matchesTag = settings.tag === undefined ||
            (conversation.tags && conversation.tags.includes(settings.tag));

          // Include in results if it matches all filters
          if (matchesSource && matchesStarred && matchesArchived && matchesTag) {
            if (skipCount < settings.offset) {
              skipCount++;
            } else if (results.length < settings.limit) {
              // Create a lightweight version for the list view
              results.push(this._createListViewItem(conversation));
            }
          }

          // Continue if we need more results
          if (results.length < settings.limit) {
            cursor.continue();
          } else {
            console.log('[Query] Limit reached. Scanned:', totalScanned, 'Results:', results.length);
            resolve(results);
          }
        };
        
        cursorRequest.onerror = (event) => {
          reject(new Error(`Error retrieving conversations: ${event.target.error}`));
        };
      } catch (error) {
        reject(new Error(`Failed to query conversations: ${error.message}`));
      }
    });
  }
  
  /**
   * Create a lightweight item for list views
   * @param {Object} conversation - Full conversation object
   * @returns {Object} - Lightweight conversation object
   */
  _createListViewItem(conversation) {
    return {
      id: conversation.id,
      conversation_id: conversation.conversation_id,
      title: conversation.title || 'Untitled Conversation',
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      source: conversation.source,
      model: conversation.model,
      messageCount: conversation.messages ? conversation.messages.length : 0,
      // Organization fields (v3)
      tags: conversation.tags || [],
      starred: conversation.starred || false,
      archived: conversation.archived || false,
    };
  }
  
  /**
   * Get a conversation by ID
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<Object>} The conversation
   */
  async getConversationById(conversationId) {
    return new Promise((resolve, reject) => {
      // Get store and index
      const store = this.dbConnector.getObjectStore(this.config.stores.conversations);
      const index = store.index('by_conversation_id');

      // Get conversation by ID
      const request = index.get(conversationId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(new Error(`Error retrieving conversation: ${event.target.error}`));
      };
    });
  }
  
  /**
   * Check if a conversation matches a specific source filter
   * @param {Object} conversation - The conversation to check
   * @param {string} sourceFilter - The source filter
   * @returns {boolean} Whether the conversation matches
   */
  _matchesSource(conversation, sourceFilter) {
    if (sourceFilter === 'all') {
      return true;
    }
    
    const modelName = (conversation.model || '').toLowerCase();
    const source = (conversation.source || '').toLowerCase();
    
    // Special handling for GPT models
    if (sourceFilter === 'gpt') {
      const gptIndicators = ['chatgpt', 'gpt', 'openai'];
      return gptIndicators.some(indicator =>
        source === indicator ||
        source.includes(indicator) ||
        modelName.includes(indicator)
      );
    }
    
    // Special handling for Claude models
    if (sourceFilter === 'claude') {
      const claudeIndicators = ['claude', 'anthropic'];
      return claudeIndicators.some(indicator =>
        source === indicator ||
        source.includes(indicator) ||
        modelName.includes(indicator)
      );
    }
    
    // For any other source, require exact match
    return source === sourceFilter;
  }
  
  /**
   * Clear all data from the database
   * @returns {Promise<void>}
   */
  async clearDatabase() {
    return new Promise((resolve, reject) => {
      // Get store
      const store = this.dbConnector.getObjectStore(
        this.config.stores.conversations, 
        'readwrite'
      );
      
      // Clear the store
      const request = store.clear();
      
      request.onsuccess = () => {
        
        resolve();
      };
      
      request.onerror = (event) => {
        reject(new Error(`Error clearing database: ${event.target.error}`));
      };
    });
  }
  
  /**
   * Check if there are any conversations in the database
   * @returns {Promise<boolean>} Whether there are conversations
   */
  async hasConversations() {
    return new Promise((resolve, reject) => {
      // Get store
      const store = this.dbConnector.getObjectStore(this.config.stores.conversations);

      // Count items
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        resolve(countRequest.result > 0);
      };

      countRequest.onerror = (event) => {
        reject(new Error(`Error counting conversations: ${event.target.error}`));
      };
    });
  }

  /**
   * Get all conversations (for bulk operations)
   * @returns {Promise<Array>} All conversations
   */
  async getAllConversations() {
    return new Promise((resolve, reject) => {
      const store = this.dbConnector.getObjectStore(this.config.stores.conversations);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(new Error(`Error retrieving all conversations: ${event.target.error}`));
      };
    });
  }

  /**
   * Update conversation metadata (tags, starred, archived)
   * @param {string} conversationId - The conversation ID
   * @param {Object} updates - Fields to update (tags, starred, archived)
   * @returns {Promise<Object>} Updated conversation
   */
  async updateConversationMetadata(conversationId, updates) {
    return new Promise(async (resolve, reject) => {
      try {
        // First get the existing conversation
        const conversation = await this.getConversationById(conversationId);

        if (!conversation) {
          return reject(new Error(`Conversation not found: ${conversationId}`));
        }

        // Apply updates
        if ('tags' in updates) {
          conversation.tags = updates.tags;
        }
        if ('starred' in updates) {
          conversation.starred = updates.starred;
        }
        if ('archived' in updates) {
          conversation.archived = updates.archived;
        }

        // Update timestamp
        conversation.updated_at = new Date().toISOString();

        // Save to database
        const store = this.dbConnector.getObjectStore(
          this.config.stores.conversations,
          'readwrite'
        );

        const request = store.put(conversation);

        request.onsuccess = () => {
          resolve(conversation);
        };

        request.onerror = (event) => {
          reject(new Error(`Error updating conversation: ${event.target.error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Bulk update conversations
   * @param {string[]} conversationIds - Array of conversation IDs
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Update statistics
   */
  async bulkUpdateConversations(conversationIds, updates) {
    return new Promise((resolve, reject) => {
      const transaction = this.dbConnector.createTransaction(
        this.config.stores.conversations,
        'readwrite'
      );

      const store = transaction.objectStore(this.config.stores.conversations);
      const index = store.index('by_conversation_id');

      let updatedCount = 0;
      let errorCount = 0;
      const errors = [];

      transaction.oncomplete = () => {
        resolve({
          updated: updatedCount,
          failed: errorCount,
          errors: errors
        });
      };

      transaction.onerror = (event) => {
        reject(new Error(`Transaction error: ${event.target.error}`));
      };

      // Process each conversation
      conversationIds.forEach(conversationId => {
        const getRequest = index.get(conversationId);

        getRequest.onsuccess = () => {
          const conversation = getRequest.result;

          if (!conversation) {
            errorCount++;
            errors.push(`Conversation not found: ${conversationId}`);
            return;
          }

          // Apply updates
          if ('tags' in updates) {
            conversation.tags = updates.tags;
          }
          if ('starred' in updates) {
            conversation.starred = updates.starred;
          }
          if ('archived' in updates) {
            conversation.archived = updates.archived;
          }

          // Update timestamp
          conversation.updated_at = new Date().toISOString();

          // Save
          const putRequest = store.put(conversation);

          putRequest.onsuccess = () => {
            updatedCount++;
          };

          putRequest.onerror = (e) => {
            errorCount++;
            errors.push(`Error updating ${conversationId}: ${e.target.error}`);
          };
        };

        getRequest.onerror = (e) => {
          errorCount++;
          errors.push(`Error fetching ${conversationId}: ${e.target.error}`);
        };
      });
    });
  }

  /**
   * Bulk delete conversations
   * @param {string[]} conversationIds - Array of conversation IDs to delete
   * @returns {Promise<Object>} Deletion statistics
   */
  async bulkDeleteConversations(conversationIds) {
    return new Promise((resolve, reject) => {
      const transaction = this.dbConnector.createTransaction(
        this.config.stores.conversations,
        'readwrite'
      );

      const store = transaction.objectStore(this.config.stores.conversations);
      const index = store.index('by_conversation_id');

      let deletedCount = 0;
      let errorCount = 0;
      const errors = [];

      transaction.oncomplete = () => {
        resolve({
          deleted: deletedCount,
          failed: errorCount,
          errors: errors
        });
      };

      transaction.onerror = (event) => {
        reject(new Error(`Transaction error: ${event.target.error}`));
      };

      // Delete each conversation
      conversationIds.forEach(conversationId => {
        const getRequest = index.get(conversationId);

        getRequest.onsuccess = () => {
          const conversation = getRequest.result;

          if (!conversation) {
            errorCount++;
            errors.push(`Conversation not found: ${conversationId}`);
            return;
          }

          // Delete using the internal database ID
          const deleteRequest = store.delete(conversation.id);

          deleteRequest.onsuccess = () => {
            deletedCount++;
          };

          deleteRequest.onerror = (e) => {
            errorCount++;
            errors.push(`Error deleting ${conversationId}: ${e.target.error}`);
          };
        };

        getRequest.onerror = (e) => {
          errorCount++;
          errors.push(`Error fetching ${conversationId}: ${e.target.error}`);
        };
      });
    });
  }

  /**
   * Get conversations by tags
   * @param {string[]} tags - Array of tags to filter by
   * @param {boolean} matchAll - If true, conversation must have ALL tags (AND logic)
   * @returns {Promise<Array>} Conversations with the specified tags
   */
  async getConversationsByTags(tags, matchAll = false) {
    return new Promise((resolve, reject) => {
      if (!tags || tags.length === 0) {
        return resolve([]);
      }

      const store = this.dbConnector.getObjectStore(this.config.stores.conversations);
      const index = store.index('by_tags');

      const results = [];
      const conversationIds = new Set();

      // For single tag or OR logic, use the index directly
      if (tags.length === 1 || !matchAll) {
        let processedTags = 0;

        tags.forEach(tag => {
          const request = index.getAll(tag);

          request.onsuccess = () => {
            request.result.forEach(conversation => {
              // Use Set to avoid duplicates for OR logic
              if (!conversationIds.has(conversation.conversation_id)) {
                conversationIds.add(conversation.conversation_id);
                results.push(this._createListViewItem(conversation));
              }
            });

            processedTags++;

            if (processedTags === tags.length) {
              resolve(results);
            }
          };

          request.onerror = (event) => {
            reject(new Error(`Error getting conversations by tag: ${event.target.error}`));
          };
        });
      } else {
        // For AND logic, get all conversations and filter
        const allRequest = store.getAll();

        allRequest.onsuccess = () => {
          const conversations = allRequest.result;

          conversations.forEach(conversation => {
            // Check if conversation has all required tags
            const conversationTags = conversation.tags || [];
            const hasAllTags = tags.every(tag => conversationTags.includes(tag));

            if (hasAllTags) {
              results.push(this._createListViewItem(conversation));
            }
          });

          resolve(results);
        };

        allRequest.onerror = (event) => {
          reject(new Error(`Error getting conversations: ${event.target.error}`));
        };
      }
    });
  }

  /**
   * Get all unique tags across all conversations
   * @returns {Promise<Array>} Array of tag objects with usage counts
   */
  async getAllTags() {
    return new Promise((resolve, reject) => {
      const store = this.dbConnector.getObjectStore(this.config.stores.conversations);
      const request = store.getAll();

      request.onsuccess = () => {
        const conversations = request.result;
        const tagCounts = new Map();

        // Count tag usage
        conversations.forEach(conversation => {
          const tags = conversation.tags || [];
          tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });

        // Convert to array of objects
        const tags = Array.from(tagCounts.entries()).map(([tag, count]) => ({
          tag: tag,
          count: count
        }));

        // Sort by count (descending) then alphabetically
        tags.sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return a.tag.localeCompare(b.tag);
        });

        resolve(tags);
      };

      request.onerror = (event) => {
        reject(new Error(`Error getting tags: ${event.target.error}`));
      };
    });
  }

  /**
   * Rename a tag across all conversations
   * @param {string} oldTag - Current tag name
   * @param {string} newTag - New tag name
   * @returns {Promise<Object>} Update statistics
   */
  async renameTag(oldTag, newTag) {
    return new Promise((resolve, reject) => {
      const transaction = this.dbConnector.createTransaction(
        this.config.stores.conversations,
        'readwrite'
      );

      const store = transaction.objectStore(this.config.stores.conversations);
      const cursorRequest = store.openCursor();

      let updatedCount = 0;

      transaction.oncomplete = () => {
        resolve({
          updated: updatedCount,
          oldTag: oldTag,
          newTag: newTag
        });
      };

      transaction.onerror = (event) => {
        reject(new Error(`Transaction error: ${event.target.error}`));
      };

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const conversation = cursor.value;
          const tags = conversation.tags || [];

          // Check if conversation has the old tag
          const tagIndex = tags.indexOf(oldTag);

          if (tagIndex !== -1) {
            // Replace old tag with new tag (avoid duplicates)
            tags.splice(tagIndex, 1);
            if (!tags.includes(newTag)) {
              tags.push(newTag);
            }

            conversation.tags = tags;
            conversation.updated_at = new Date().toISOString();

            cursor.update(conversation);
            updatedCount++;
          }

          cursor.continue();
        }
      };

      cursorRequest.onerror = (event) => {
        reject(new Error(`Error renaming tag: ${event.target.error}`));
      };
    });
  }

  /**
   * Delete a tag from all conversations
   * @param {string} tag - Tag to delete
   * @returns {Promise<Object>} Deletion statistics
   */
  async deleteTag(tag) {
    return new Promise((resolve, reject) => {
      const transaction = this.dbConnector.createTransaction(
        this.config.stores.conversations,
        'readwrite'
      );

      const store = transaction.objectStore(this.config.stores.conversations);
      const cursorRequest = store.openCursor();

      let updatedCount = 0;

      transaction.oncomplete = () => {
        resolve({
          updated: updatedCount,
          deletedTag: tag
        });
      };

      transaction.onerror = (event) => {
        reject(new Error(`Transaction error: ${event.target.error}`));
      };

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const conversation = cursor.value;
          const tags = conversation.tags || [];

          // Check if conversation has this tag
          const tagIndex = tags.indexOf(tag);

          if (tagIndex !== -1) {
            // Remove the tag
            tags.splice(tagIndex, 1);
            conversation.tags = tags;
            conversation.updated_at = new Date().toISOString();

            cursor.update(conversation);
            updatedCount++;
          }

          cursor.continue();
        }
      };

      cursorRequest.onerror = (event) => {
        reject(new Error(`Error deleting tag: ${event.target.error}`));
      };
    });
  }
}
