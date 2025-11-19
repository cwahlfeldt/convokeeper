/**
 * GenericConverter Module
 * 
 * Fallback converter for handling unknown or generic conversation formats.
 */

import { BaseConverter } from './baseConverter.js';

export class GenericConverter extends BaseConverter {
  /**
   * Convert generic format to unified schema
   * @param {Object|Array} conversation - The conversation to convert
   * @returns {Object} - Unified conversation object
   */
  convert(conversation) {
    // Handle array of messages directly
    if (Array.isArray(conversation)) {
      return this.convertMessageArray(conversation);
    }

    // For object with messages array
    return this.convertMessageObject(conversation);
  }

  /**
   * Convert an array of messages to a unified conversation
   * @param {Array} messages - Array of message objects
   * @returns {Object} - Unified conversation object
   */
  convertMessageArray(messages) {
    const convertedMessages = messages.map(msg => ({
      id: msg.id || this.generateId('msg'),
      role: msg.role || '',
      content: msg.content || msg.text || '',
      created_at: this.formatTimestamp(msg.created_at || msg.timestamp),
      metadata: {},
    }));

    return {
      conversation_id: this.generateId('conv'),
      title: 'Imported Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'unknown',
      model: '',
      messages: convertedMessages,
      metadata: {},
    };
  }

  /**
   * Convert an object with messages to a unified conversation
   * @param {Object} conversation - Object with messages array
   * @returns {Object} - Unified conversation object
   */
  convertMessageObject(conversation) {
    // Extract and convert messages
    const messages = Array.isArray(conversation.messages)
      ? conversation.messages.map(msg => ({
        id: msg.id || this.generateId('msg'),
        role: msg.role || 'unknown',
        content: msg.content || msg.text || '',
        created_at: this.formatTimestamp(msg.created_at || msg.timestamp),
        metadata: {},
      }))
      : [];

    return {
      conversation_id: conversation.conversation_id || conversation.id || this.generateId('conv'),
      title: conversation.title || conversation.name || 'Untitled Conversation',
      created_at: this.formatTimestamp(conversation.created_at || conversation.create_time),
      updated_at: this.formatTimestamp(conversation.updated_at || conversation.update_time),
      source: 'unknown',
      model: conversation.model || 'unknown',
      messages: messages,
      metadata: {},
    };
  }
}
