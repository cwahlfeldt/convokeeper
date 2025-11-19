/**
 * ClaudeConverter Module
 * 
 * Specialized converter for Claude conversation format.
 */

import { BaseConverter } from './baseConverter.js';

export class ClaudeConverter extends BaseConverter {
  /**
   * Convert Claude format to unified schema
   * @param {Object} conversation - The conversation to convert
   * @returns {Object} - Unified conversation object
   */
  convert(conversation) {
    // Extract messages
    const messages = this.extractMessages(conversation);

    return {
      conversation_id: conversation.uuid || conversation.conversation_id || this.generateId('conv'),
      title: conversation.name || 'Untitled Conversation',
      created_at: conversation.created_at || new Date().toISOString(),
      updated_at: conversation.updated_at || new Date().toISOString(),
      source: 'claude',
      model: this.extractModel(conversation),
      messages: messages,
      metadata: {
        account_uuid: conversation.account?.uuid,
        original_id: conversation.id,
      },
    };
  }

  /**
   * Extract messages from Claude conversation
   * @param {Object} conversation - The conversation to extract messages from
   * @returns {Array} - Array of messages
   */
  extractMessages(conversation) {
    if (!conversation.chat_messages || !Array.isArray(conversation.chat_messages)) {
      return [];
    }

    return conversation.chat_messages.map(message => {
      let content = '';

      // Get content from text field or content array
      if (message.text) {
        content = message.text;
      } else if (Array.isArray(message.content)) {
        content = message.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');
      }

      return {
        id: message.uuid || this.generateId('msg'),
        role: this.normalizeRole(message.sender),
        content: content,
        created_at: message.created_at || new Date().toISOString(),
        metadata: {
          attachments: message.attachments,
          files: message.files,
        },
      };
    });
  }

  /**
   * Extract model info from Claude conversation
   * @param {Object} conversation - The conversation to extract model from
   * @returns {string} - Model name
   */
  extractModel(conversation) {
    // Try to find model in metadata or messages
    if (conversation.metadata && conversation.metadata.model) {
      return conversation.metadata.model;
    }

    // Look in messages
    if (Array.isArray(conversation.chat_messages)) {
      for (const message of conversation.chat_messages) {
        if (message.metadata && message.metadata.model) {
          return message.metadata.model;
        }
      }
    }

    return 'claude-unknown';
  }
}
