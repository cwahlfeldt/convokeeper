/**
 * UI Utilities
 * 
 * Functions for UI manipulation and status updates.
 */

/**
 * UI Helpers
 */
export const ui = {
  // Show an error message to the user
  showError: (message) => {
    console.error(message);
    
    // Use upload-status element if available
    const statusElement = document.getElementById('upload-status');
    if (statusElement) {
      statusElement.textContent = `Error: ${message}`;
      statusElement.className = 'upload-status error';
    } else {
      alert(message); // Fallback to alert if no status element
    }
  },
  
  // Show a processing status message
  showProcessingStatus: (message, elementId = 'upload-status') => {
    const statusElement = document.getElementById(elementId);
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'upload-status processing';
    }
  },
  
  // Show a success message
  showSuccess: (message, elementId = 'upload-status') => {
    const statusElement = document.getElementById(elementId);
    if (statusElement) {
      // Clear any existing success message first
      statusElement.innerHTML = '';
      
      // Add the new message
      statusElement.textContent = message;
      statusElement.className = 'upload-status success';
      
      // Prevent duplicate status messages
      if (statusElement._hasShownMessage) {
        return;
      }
      
      // Mark as shown to prevent duplicates
      statusElement._hasShownMessage = true;
      
      // Reset the flag after a reasonable delay
      setTimeout(() => {
        statusElement._hasShownMessage = false;
      }, 2000);
    }
  },
  
  // Show/update progress bar
  updateProgressBar: (percent, elementId = 'progress-bar') => {
    const progressBar = document.getElementById(elementId);
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
      
      // Show the container if not already visible
      const container = document.getElementById('progress-container');
      if (container) {
        container.style.display = percent > 0 ? 'block' : 'none';
      }
    }
  },
  
  // Show a loading spinner
  showLoading: (container, message = 'Loading...') => {
    if (!container) return;
    
    // Create loading element
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.textContent = message;
    
    // Clear container and add loading indicator
    container.innerHTML = '';
    container.appendChild(loadingElement);
  },
  
  // Hide a loading spinner
  hideLoading: (container) => {
    if (!container) return;
    
    // Remove loading indicators
    const loadingElements = container.querySelectorAll('.loading-indicator');
    loadingElements.forEach(element => element.remove());
  },
  
  // Show a modal dialog
  showModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
    }
  },
  
  // Hide a modal dialog
  hideModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  },
  
  // Toggle element visibility
  toggleVisibility: (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      if (element.style.display === 'none' || getComputedStyle(element).display === 'none') {
        element.style.display = 'block';
      } else {
        element.style.display = 'none';
      }
    }
  }
};
