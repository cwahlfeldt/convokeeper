/**
 * ID Utilities
 * 
 * Functions for generating unique identifiers.
 */

/**
 * Generate a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateUniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a UUID v4
 * @returns {string} - UUID v4 string
 */
export function generateUuidV4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/**
 * Generate a sequential ID with a prefix
 * @param {string} prefix - Prefix for the ID
 * @param {number} seed - Starting seed value
 * @returns {Function} - Function that returns sequential IDs
 */
export function createSequentialIdGenerator(prefix = 'id', seed = 1) {
  let counter = seed;
  
  return function() {
    return `${prefix}_${counter++}`;
  };
}

/**
 * Hash a string to create a deterministic ID
 * @param {string} str - String to hash
 * @returns {string} - Hashed string
 */
export function hashString(str) {
  let hash = 0;
  
  if (str.length === 0) return hash.toString(36);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}
