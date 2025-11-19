/**
 * Schema Converter Module Entry Point
 * 
 * This module exports the main schema conversion functionality.
 * It serves as a facade to the various converters needed for different formats.
 */

import { ConversationConverter } from './conversationConverter.js';

// Create singleton instance
const conversationConverter = new ConversationConverter();

/**
 * Process a batch of conversations and convert them to unified schema
 * @param {Array|Object} conversations - Array of conversations or single conversation
 * @returns {Array} - Array of unified conversations
 */
export function processConversations(conversations) {
  return conversationConverter.processConversations(conversations);
}

/**
 * Convert any conversation format to the unified schema
 * @param {Object} conversation - The conversation to convert
 * @returns {Object} - Unified conversation object
 */
export function convertToUnifiedSchema(conversation) {
  return conversationConverter.convertToUnifiedSchema(conversation);
}
