/**
 * ConversationManager - Handles retrieval and management of conversation data
 * 
 * Provides methods for loading conversations from the database, filtering,
 * pagination. Acts as a data layer for the viewer.
 */

import { getConversations, getConversationById, clearDatabase } from '../database/index.js';

// Configuration constants for pagination
const MESSAGES_PER_PAGE = 30;

/**
 * Class to manage conversations and their retrieval
 */
export class ConversationManager {
  /**
   * @param {number} conversationsPerPage - Number of conversations to load per page
   */
  constructor(conversationsPerPage = 20) {
    this.conversationsPerPage = conversationsPerPage;
    this.hasMore = false;
    this.currentPage = 1;
    this.totalConversations = 0;
    this.totalPages = 1;
  }

  /**
   * Get conversations with current filters and pagination
   * @param {Object} options - Options for loading conversations
   * @returns {Promise<Object>} Object containing loaded conversations and pagination info
   */
  async getConversations(options = {}) {
    const {
      page = 1,
      source = 'all',
      sortOrder = 'newest',
      starred,
      archived,
      tag
    } = options;

    this.currentPage = page;

    try {
      // Calculate offset from page
      const offset = (page - 1) * this.conversationsPerPage;

      // Build query options
      const queryOptions = {
        offset: offset,
        limit: this.conversationsPerPage,
        source,
        sortOrder
      };

      // Add organization filters if specified
      if (starred !== undefined) queryOptions.starred = starred;
      if (archived !== undefined) queryOptions.archived = archived;
      if (tag !== undefined) queryOptions.tag = tag;

      // Load from database
      const conversations = await getConversations(queryOptions);

      // Count total conversations for pagination
      this.totalConversations = await this.countTotalConversations(source, { starred, archived, tag });
      this.totalPages = Math.ceil(this.totalConversations / this.conversationsPerPage);
      
      // Store whether there are more conversations to load
      this.hasMore = page < this.totalPages;

      return {
        conversations,
        pagination: {
          currentPage: this.currentPage,
          totalPages: this.totalPages,
          totalConversations: this.totalConversations,
          hasMore: this.hasMore
        }
      };
    } catch (error) {
      console.error('Error loading conversations:', error);
      throw error;
    }
  }

  /**
   * Count the total number of conversations matching the filter
   * @param {string} source - Source filter
   * @param {Object} orgFilters - Organization filters (starred, archived, tag)
   * @returns {Promise<number>} Total conversation count
   */
  async countTotalConversations(source = 'all', orgFilters = {}) {
    try {
      // For simplicity, we're making a request with a large limit
      // In a production app, you might want a dedicated count method in the database layer
      const queryOptions = {
        offset: 0,
        limit: 1000, // Set a reasonable upper limit
        source,
        countOnly: true // This would be a new option we'd add to the database layer
      };

      // Add organization filters if specified
      if (orgFilters.starred !== undefined) queryOptions.starred = orgFilters.starred;
      if (orgFilters.archived !== undefined) queryOptions.archived = orgFilters.archived;
      if (orgFilters.tag !== undefined) queryOptions.tag = orgFilters.tag;

      const allConversations = await getConversations(queryOptions);

      return Array.isArray(allConversations) ? allConversations.length : 0;
    } catch (error) {
      console.error('Error counting conversations:', error);
      return 0;
    }
  }

  /**
   * Load a conversation by ID
   * @param {string} conversationId - Conversation ID to load
   * @returns {Promise<Object>} Loaded conversation
   */
  async getConversationById(conversationId) {
    try {
      return await getConversationById(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      throw error;
    }
  }

  /**
   * Get a paginated set of messages from a conversation
   * @param {Object} conversation - The conversation with messages
   * @param {number} startIndex - Optional starting index
   * @returns {Object} Object with messages and whether there are more
   */
  getPaginatedMessages(conversation, startIndex = 0) {
    if (!conversation || !conversation.messages) {
      return { messages: [], hasMoreMessages: false };
    }

    // Get messages from the conversation
    const messages = conversation.messages.slice(
      startIndex,
      startIndex + MESSAGES_PER_PAGE
    );

    return {
      messages,
      hasMoreMessages: conversation.messages.length > startIndex + MESSAGES_PER_PAGE
    };
  }

  /**
   * Reset pagination state
   */
  resetPagination() {
    this.currentPage = 1;
  }

  /**
   * Get the current pagination state
   * @returns {Object} Current pagination state
   */
  getPaginationState() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalConversations: this.totalConversations,
      hasMore: this.hasMore
    };
  }

  /**
   * Get next batch of messages from a conversation
   * @param {Object} conversation - Conversation to get messages from
   * @param {number} currentCount - Current number of displayed messages
   * @returns {Array} Next batch of messages
   */
  getNextMessageBatch(conversation, currentCount) {
    if (!conversation || !conversation.messages) {
      return [];
    }

    return conversation.messages.slice(
      currentCount,
      currentCount + MESSAGES_PER_PAGE
    );
  }

  /**
   * Check if there are more conversations to load
   * @returns {boolean} Whether there are more conversations
   */
  hasMoreConversations() {
    return this.hasMore;
  }

  /**
   * Clear the database after confirmation
   * @returns {Promise<void>}
   */
  async clearDatabase() {
    try {
      return await clearDatabase();
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }
}
