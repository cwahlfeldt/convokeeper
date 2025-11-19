/**
 * ConversationConverter Module
 * 
 * Main class for converting conversations to a unified schema.
 * Uses a format detector and specialized converters for each format.
 */

import { generateUniqueId } from '../utils/idUtils.js';
import { FormatDetector } from './formatDetector.js';
import { ChatGptConverter } from './formatConverters/chatGptConverter.js';
import { ClaudeConverter } from './formatConverters/claudeConverter.js';
import { GenericConverter } from './formatConverters/genericConverter.js';
import { ConvoKeepConverter } from './formatConverters/convokeepConverter.js';

/**
 * Main class to handle conversation format conversion
 */
export class ConversationConverter {
  constructor() {
    this.formatDetector = new FormatDetector();
    this.converters = {
      chatgpt: new ChatGptConverter(generateUniqueId),
      claude: new ClaudeConverter(generateUniqueId),
      convokeep: new ConvoKeepConverter(generateUniqueId),
      generic: new GenericConverter(generateUniqueId)
    };
  }
  
  /**
   * Process a batch of conversations and convert them to unified schema
   * @param {Array|Object} conversations - Array of conversations or single conversation
   * @returns {Array} - Array of unified conversations
   */
  processConversations(conversations) {
    // Handle single conversation case
    if (!Array.isArray(conversations)) {
      return [this.convertToUnifiedSchema(conversations)];
    }
    
    // Process array of conversations
    return conversations.map(conversation => this.convertToUnifiedSchema(conversation));
  }
  
  /**
   * Convert any conversation format to the unified schema
   * @param {Object} conversation - The conversation to convert
   * @returns {Object} - Unified conversation object
   */
  convertToUnifiedSchema(conversation) {
    // Detect format and convert accordingly
    const format = this.formatDetector.detectFormat(conversation);
    
    // Use appropriate converter
    return this.converters[format].convert(conversation);
  }
}
