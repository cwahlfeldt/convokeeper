/**
 * URL Utilities
 * 
 * Functions for working with URL parameters.
 */

/**
 * URL Parameter Management
 */
export const urlParams = {
  // Internal storage of params
  _params: new URLSearchParams(window.location.search),
  
  // Get a URL parameter
  get: (key) => {
    return new URLSearchParams(window.location.search).get(key);
  },
  
  // Set a URL parameter without reloading the page
  set: (key, value) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    return params;
  },
  
  // Remove a URL parameter
  remove: (key) => {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    return params;
  },
  
  // Get string representation
  toString: () => {
    return new URLSearchParams(window.location.search).toString();
  }
};
