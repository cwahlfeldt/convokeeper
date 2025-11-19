/**
 * Text Utilities
 * 
 * Functions for text processing and manipulation.
 */

/**
 * Text Processing
 */
export const text = {
  // Truncate text with smart handling
  truncate: (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    // Simple truncation for very short lengths
    if (maxLength < 30) {
      return text.substring(0, maxLength - 3) + '...';
    }
    
    // Try to preserve meaningful parts
    const truncated = text.substring(0, maxLength - 3);
    return truncated + '...';
  },
  
  
  // Escape HTML to prevent XSS
  escapeHtml: (unsafe) => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  
  // Check if a string is empty or just whitespace
  isEmpty: (str) => {
    return !str || str.trim() === '';
  },
  
  // Normalize line breaks for consistency
  normalizeLineBreaks: (text) => {
    if (!text) return '';
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
};
