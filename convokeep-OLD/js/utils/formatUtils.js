/**
 * Formatting Utilities
 * 
 * Functions for formatting dates, times, and other data.
 */

/**
 * Date & Time Formatting
 */
export const formatters = {
  // Format a date with smart relative time for recent dates
  date: (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      // Today: show time
      if (diffDays < 1) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      // Last week: show day of week
      else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      // This year: show month and day
      else if (diffDays < 365) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      // Older: show date with year
      else {
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Error';
    }
  },
  
  // Format a full date with time
  fullDate: (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return date.toLocaleDateString([], options);
    } catch (e) {
      console.error('Error formatting full date:', e);
      return 'Error';
    }
  },
  
  // Format time only
  time: (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  },
  
  // Format file size
  fileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};
