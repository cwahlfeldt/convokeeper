/**
 * BaseConverter Module
 * 
 * Base class for all format converters with shared functionality.
 */

export class BaseConverter {
  /**
   * @param {Function} idGenerator - Function to generate unique IDs
   */
  constructor(idGenerator) {
    this.idGenerator = idGenerator;
  }
  
  /**
   * Format Unix timestamp to ISO string
   * @param {number|string} timestamp - Timestamp to format
   * @returns {string} - ISO formatted date string
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return new Date().toISOString();
    
    // Check if it's a Unix timestamp (seconds)
    if (typeof timestamp === 'number' || !isNaN(Number(timestamp))) {
      // Convert seconds to milliseconds if needed
      const msTimestamp = timestamp < 10000000000
        ? timestamp * 1000
        : timestamp;
        
      return new Date(msTimestamp).toISOString();
    }
    
    // Already a string, try to parse and return
    try {
      return new Date(timestamp).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  }
  
  /**
   * Normalize role names across different sources
   * @param {string} role - Role to normalize
   * @returns {string} - Normalized role name
   */
  normalizeRole(role) {
    if (!role) return 'unknown';
    
    switch (role.toLowerCase()) {
      case 'human':
        return 'user';
      case 'assistant':
        return 'assistant';
      case 'system':
        return 'system';
      default:
        return role.toLowerCase();
    }
  }
  
  /**
   * Generate a unique ID with a prefix
   * @param {string} prefix - Prefix for the ID
   * @returns {string} - Unique ID
   */
  generateId(prefix) {
    return this.idGenerator(prefix);
  }
}
