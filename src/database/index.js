/**
 * Database Module Entry Point
 * 
 * This module exports the database API needed by the application.
 * It handles initialization and provides access to database operations.
 */

import { DatabaseManager } from './databaseManager.js';

// Create singleton instance
const dbManager = new DatabaseManager();

/**
 * Initialize the database connection
 * @returns {Promise<IDBDatabase>} The database connection
 */
export async function initDb() {
  return dbManager.init();
}

/**
 * Store conversations in the database
 * @param {Array|Object} conversations - Conversations to store
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} Results of the storage operation
 */
export async function storeConversations(conversations, progressCallback) {
  return dbManager.storeConversations(conversations, progressCallback);
}

/**
 * Get conversations with filtering options
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Conversations matching the query
 */
export async function getConversations(options) {
  return dbManager.getConversations(options);
}

/**
 * Get a conversation by ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} The conversation
 */
export async function getConversationById(conversationId) {
  return dbManager.getConversationById(conversationId);
}

/**
 * Clear all data from the database
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  return dbManager.clearDatabase();
}

/**
 * Check if there are any conversations in the database
 * @returns {Promise<boolean>} Whether there are conversations
 */
export async function hasConversations() {
  return dbManager.hasConversations();
}

/**
 * Request persistent storage to prevent automatic data eviction
 * Should be called when user first uploads data for better UX
 * @returns {Promise<boolean>} Whether persistent storage was granted
 */
export async function requestPersistentStorage() {
  return dbManager.requestPersistentStorage();
}

/**
 * Update conversation metadata (tags, starred, archived)
 * @param {string} conversationId - The conversation ID
 * @param {Object} updates - Fields to update (tags, starred, archived)
 * @returns {Promise<Object>} Updated conversation
 */
export async function updateConversationMetadata(conversationId, updates) {
  return dbManager.updateConversationMetadata(conversationId, updates);
}

/**
 * Bulk update conversations
 * @param {string[]} conversationIds - Array of conversation IDs
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Update statistics
 */
export async function bulkUpdateConversations(conversationIds, updates) {
  return dbManager.bulkUpdateConversations(conversationIds, updates);
}

/**
 * Bulk delete conversations
 * @param {string[]} conversationIds - Array of conversation IDs to delete
 * @returns {Promise<Object>} Deletion statistics
 */
export async function bulkDeleteConversations(conversationIds) {
  return dbManager.bulkDeleteConversations(conversationIds);
}

/**
 * Get conversations by tags
 * @param {string[]} tags - Array of tags to filter by
 * @param {boolean} matchAll - If true, conversation must have ALL tags (AND logic)
 * @returns {Promise<Array>} Conversations with the specified tags
 */
export async function getConversationsByTags(tags, matchAll = false) {
  return dbManager.getConversationsByTags(tags, matchAll);
}

/**
 * Get all unique tags across all conversations
 * @returns {Promise<Array>} Array of tag objects with usage counts
 */
export async function getAllTags() {
  return dbManager.getAllTags();
}

/**
 * Rename a tag across all conversations
 * @param {string} oldTag - Current tag name
 * @param {string} newTag - New tag name
 * @returns {Promise<Object>} Update statistics
 */
export async function renameTag(oldTag, newTag) {
  return dbManager.renameTag(oldTag, newTag);
}

/**
 * Delete a tag from all conversations
 * @param {string} tag - Tag to delete
 * @returns {Promise<Object>} Deletion statistics
 */
export async function deleteTag(tag) {
  return dbManager.deleteTag(tag);
}
