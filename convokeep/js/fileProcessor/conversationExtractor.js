/**
 * ConversationExtractor Module
 * 
 * Specialized for extracting conversation data from archive files.
 * Handles finding, extracting, and parsing conversation data.
 */

export class ConversationExtractor {
  /**
   * Extract conversations.json file from the zip data
   * @param {Object} zipData - JSZip object containing extracted zip data
   * @returns {Promise<string>} - Promise resolving to JSON text
   */
  async extractConversationsJson(zipData) {
    // Look for conversations.json or similar files
    const conversationsFile = zipData.files['conversations.json'];
    
    if (!conversationsFile) {
      throw new Error('conversations.json not found in the archive');
    }
    
    // Extract and return the JSON text
    const jsonText = await conversationsFile.async('string');
    
    if (!jsonText || jsonText.trim() === '') {
      throw new Error('Empty JSON data');
    }
    
    return jsonText;
  }
  
  /**
   * Parse JSON text and extract conversations
   * @param {string} jsonText - JSON string containing conversation data
   * @returns {Array} - Array of raw conversation objects
   */
  parseConversations(jsonText) {
    try {
      // Parse JSON
      const rawData = JSON.parse(jsonText);
      
      // Extract conversations based on structure
      return this.getRawConversations(rawData);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error('Failed to parse conversation data');
    }
  }
  
  /**
   * Extract the raw conversations array from parsed JSON data
   * @param {Object|Array} rawData - The parsed JSON data from the file
   * @returns {Array} - Array of raw conversation objects
   */
  getRawConversations(rawData) {
    // If it's already an array, use it
    if (Array.isArray(rawData)) {
      return rawData;
    }
    
    // If it's an object with a "conversations" key, use that
    if (typeof rawData === 'object' && 
        rawData !== null && 
        rawData.conversations && 
        Array.isArray(rawData.conversations)) {
      return rawData.conversations;
    }
    
    // If it's a single conversation object, wrap it in an array
    if (typeof rawData === 'object' && 
        (rawData.mapping || 
        (rawData.chat_messages && Array.isArray(rawData.chat_messages)))) {
      return [rawData];
    }
    
    throw new Error('Unable to extract conversations from file format');
  }
}
