/**
 * Clipboard Utilities
 * 
 * Functions for clipboard operations.
 */

/**
 * Copy text to clipboard with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export function copyToClipboard(text) {
  // Use modern navigator.clipboard API if available
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(err => {
        console.error('Could not copy text: ', err);
        return false;
      });
  } else {
    // Fallback for older browsers
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback method for copying to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
function fallbackCopyToClipboard(text) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    // Save current focus and selection
    const activeEl = document.activeElement;
    const selection = document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : null;

    // Select the text
    textArea.focus();
    textArea.select();

    // Execute copy command
    const success = document.execCommand('copy');

    // Clean up
    document.body.removeChild(textArea);

    // Restore original focus and selection
    if (activeEl && activeEl.focus) {
      activeEl.focus();
    }
    if (selection) {
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(selection);
    }

    return Promise.resolve(success);
  } catch (err) {
    console.error('Could not copy text: ', err);
    return Promise.resolve(false);
  }
}

/**
 * Read text from clipboard
 * @returns {Promise<string>} - Text from clipboard
 */
export function readFromClipboard() {
  // Use modern navigator.clipboard API if available
  if (navigator.clipboard && window.isSecureContext && navigator.clipboard.readText) {
    return navigator.clipboard.readText()
      .then(text => text)
      .catch(err => {
        console.error('Could not read from clipboard: ', err);
        return '';
      });
  } else {
    // No good fallback for reading from clipboard in older browsers
    console.warn('Clipboard read API not available');
    return Promise.resolve('');
  }
}

/**
 * Check if clipboard API is available
 * @returns {boolean} - True if API is available
 */
export function isClipboardAvailable() {
  return !!(navigator.clipboard && window.isSecureContext);
}
