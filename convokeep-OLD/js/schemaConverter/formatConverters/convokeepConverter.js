/**
 * ConvoKeep Converter Module
 *
 * Handles conversion of ConvoKeep backup format to unified schema.
 * Since ConvoKeep backups are already in unified schema format,
 * this converter acts as a passthrough with validation.
 */

import { BaseConverter } from './baseConverter.js';

export class ConvoKeepConverter extends BaseConverter {
  /**
   * Convert a ConvoKeep format conversation to unified schema
   * Since it's already in unified schema, we just validate and return it
   * @param {Object} conversation - The conversation to convert
   * @returns {Object} - Conversation in unified schema (same as input)
   */
  convert(conversation) {
    // Validate required fields
    if (!conversation.conversation_id) {
      throw new Error('ConvoKeep conversation missing conversation_id');
    }

    if (!conversation.title) {
      throw new Error('ConvoKeep conversation missing title');
    }

    if (!Array.isArray(conversation.messages)) {
      throw new Error('ConvoKeep conversation missing messages array');
    }

    // The conversation is already in unified schema format
    // Just ensure it has all required fields with defaults if needed
    return {
      conversation_id: conversation.conversation_id,
      title: conversation.title,
      created_at: conversation.created_at || new Date().toISOString(),
      updated_at: conversation.updated_at || new Date().toISOString(),
      source: conversation.source || 'convokeep',
      model: conversation.model || 'unknown',
      messages: conversation.messages,
      metadata: conversation.metadata || {}
    };
  }
}
