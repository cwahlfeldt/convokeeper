/**
 * Performance Utilities
 * 
 * Functions for improving application performance.
 */

/**
 * Debounce function to limit rapid firing
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;
    const later = () => {
      clearTimeout(timeout);
      func.apply(context, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum milliseconds between executions
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  
  return function() {
    const context = this;
    const args = arguments;
    
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Request animation frame wrapper for smooth animations
 * @param {Function} callback - Animation callback
 * @returns {number} - Request ID
 */
export function requestAnimationFrameThrottled(callback) {
  let requestId = null;
  
  return function(...args) {
    if (requestId === null) {
      requestId = requestAnimationFrame(() => {
        callback(...args);
        requestId = null;
      });
    }
  };
}

/**
 * Measure execution time of a function
 * @param {Function} func - Function to measure
 * @param {string} label - Console label
 * @returns {Function} - Wrapped function
 */
export function measurePerformance(func, label) {
  return function(...args) {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    
    return result;
  };
}
