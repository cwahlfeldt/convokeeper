/**
 * FormatDetector Module
 * 
 * Detects the format of conversation data to determine which converter to use.
 */

export class FormatDetector {
  /**
   * Detect the format of a conversation
   * @param {Object} conversation - The conversation to check
   * @returns {string} - Format identifier ('chatgpt', 'claude', 'convokeep', or 'generic')
   */
  detectFormat(conversation) {
    if (this.isConvoKeepFormat(conversation)) {
      return 'convokeep';
    } else if (this.isChatGptFormat(conversation)) {
      return 'chatgpt';
    } else if (this.isClaudeFormat(conversation)) {
      return 'claude';
    } else {
      return 'generic';
    }
  }
  
  /**
   * Check if the conversation is in ChatGPT format
   * @param {Object} conversation - The conversation to check
   * @returns {boolean} - True if it's in ChatGPT format
   */
  isChatGptFormat(conversation) {
    return conversation
      && conversation.mapping
      && typeof conversation.mapping === 'object'
      && (conversation.title !== undefined || conversation.create_time !== undefined);
  }
  
  /**
   * Check if the conversation is in Claude format
   * @param {Object} conversation - The conversation to check
   * @returns {boolean} - True if it's in Claude format
   */
  isClaudeFormat(conversation) {
    return conversation
      && Array.isArray(conversation.chat_messages)
      && (conversation.uuid !== undefined || conversation.name !== undefined);
  }

  /**
   * Check if the conversation is in ConvoKeep's unified format
   * @param {Object} conversation - The conversation to check
   * @returns {boolean} - True if it's already in ConvoKeep format
   */
  isConvoKeepFormat(conversation) {
    return conversation
      && conversation.conversation_id !== undefined
      && Array.isArray(conversation.messages)
      && conversation.source !== undefined
      && conversation.created_at !== undefined;
  }
}
