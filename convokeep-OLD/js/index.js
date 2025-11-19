/**
 * ConvoKeep Application Entry Point
 * 
 * This module serves as the central entry point for the ConvoKeep application,
 * importing and exporting the necessary components.
 */

// Import and re-export main components
export { initDb, storeConversations, getConversations, getConversationById, clearDatabase, hasConversations } from './database/index.js';
export { processFile } from './fileProcessor/index.js';
export { processConversations, convertToUnifiedSchema } from './schemaConverter/index.js';
export { 
  urlParams, 
  formatters, 
  text, 
  ui, 
  debounce, 
  createMarkdownRenderer, 
  copyToClipboard, 
  generateUniqueId, 
  resetDatabase
} from './utils/index.js';

// Import app initialization
import { init as initApp } from './app.js';

// Import viewer module
import viewerCore from './viewer/index.js';

// Export viewer init function
export const initViewer = () => viewerCore.init();

/**
 * Initialize the entire application
 */
export function init() {
  try {
    // Initialize app components
    initApp();
    
    // Initialize viewer
    initViewer();
    
    // Initialize mobile navigation
    initMobileNavigation();
    
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

/**
 * Initialize mobile navigation
 */
function initMobileNavigation() {
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const body = document.body;
  
  // Mobile menu elements
  const mobileUploadBtn = document.getElementById('mobile-upload-button');
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
  const mobileResetDbBtn = document.getElementById('mobile-reset-db-btn');
  
  // Mobile dropdown elements
  const mobileMenuDropdownToggle = document.getElementById('mobile-menu-dropdown-toggle');
  const mobileMenuGrid = document.getElementById('mobile-menu-grid');
  
  // Original menu elements
  const uploadButton = document.getElementById('upload-button');
  const themeToggle = document.getElementById('theme-toggle');
  const resetDbBtn = document.getElementById('menu-reset-db-btn');
  
  if (!mobileNavToggle || !mobileNavOverlay) return;
  
  // Initialize mobile menu dropdown toggle
  if (mobileMenuDropdownToggle && mobileMenuGrid) {
    mobileMenuDropdownToggle.addEventListener('click', () => {
      const isExpanded = mobileMenuDropdownToggle.getAttribute('aria-expanded') === 'true';
      
      // Toggle dropdown state
      mobileMenuDropdownToggle.setAttribute('aria-expanded', !isExpanded);
      mobileMenuGrid.classList.toggle('open');
      
      // Set focus trap if open
      if (!isExpanded) {
        setTimeout(() => {
          // Find the first focusable element in the grid
          const firstFocusable = mobileMenuGrid.querySelector('button, a');
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }, 100);
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.mobile-menu-dropdown') && 
          mobileMenuGrid.classList.contains('open')) {
        mobileMenuDropdownToggle.setAttribute('aria-expanded', 'false');
        mobileMenuGrid.classList.remove('open');
      }
    });
  }
  
  // Set initial state
  mobileNavToggle.setAttribute('aria-expanded', 'false');
  
  // Connect mobile menu buttons to their desktop counterparts
  if (mobileUploadBtn && uploadButton) {
    mobileUploadBtn.addEventListener('click', () => {
      uploadButton.click();
    });
  }
  
  if (mobileThemeToggle && themeToggle) {
    mobileThemeToggle.addEventListener('click', () => {
      themeToggle.click();
    });
    
    // Update mobile theme icon when theme changes
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');
    const mainThemeIcon = document.getElementById('theme-icon');
    
    if (mobileThemeIcon && mainThemeIcon) {
      const updateMobileThemeIcon = () => {
        mobileThemeIcon.textContent = mainThemeIcon.textContent;
      };
      
      // Run once to set initial state
      updateMobileThemeIcon();
      
      // Monitor for theme changes
      const observer = new MutationObserver(updateMobileThemeIcon);
      observer.observe(mainThemeIcon, { childList: true, characterData: true, subtree: true });
    }
  }
  
  // Handle mobile reset button with centralized reset functionality
  if (mobileResetDbBtn) {
    // Create a clean button to remove any existing listeners
    const newMobileResetBtn = mobileResetDbBtn.cloneNode(true);
    mobileResetDbBtn.parentNode.replaceChild(newMobileResetBtn, mobileResetDbBtn);
    
    // Add click handler using the centralized reset function
    newMobileResetBtn.addEventListener('click', (e) => {
      // Prevent immediate propagation to stop multiple handlers
      e.stopImmediatePropagation();
      
      // Close mobile menu first
      closeMobileNav();
      
      // Use the centralized reset function directly
      resetDatabase();
    });
  }
  
  // Toggle mobile navigation
  mobileNavToggle.addEventListener('click', () => {
    body.classList.toggle('mobile-nav-open');
    mobileNavToggle.classList.toggle('active');
    
    // Update accessibility attributes
    const isOpen = body.classList.contains('mobile-nav-open');
    mobileNavToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    
    // Announce state to screen readers
    mobileNavToggle.setAttribute('aria-label', 
      isOpen ? 'Close conversation list' : 'Open conversation list');
  });
  
  // Close navigation when clicking overlay
  mobileNavOverlay.addEventListener('click', () => {
    closeMobileNav();
  });
  
  // Close navigation when selecting a conversation on mobile
  const conversationList = document.getElementById('conversation-list');
  if (conversationList) {
    conversationList.addEventListener('click', (event) => {
      if (window.innerWidth <= 768 && event.target.closest('.conversation-item')) {
        // Small delay to allow the UI to update before closing the nav
        setTimeout(() => {
          closeMobileNav();
        }, 150);
      }
    });
  }
  
  // Handle resize to reset mobile navigation if window is resized beyond mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && body.classList.contains('mobile-nav-open')) {
      closeMobileNav();
    }
  });
  
  // Handle ESC key to close navigation and dropdown
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      // Close mobile navigation if open
      if (body.classList.contains('mobile-nav-open')) {
        closeMobileNav();
      }
      
      // Close mobile menu dropdown if open
      if (mobileMenuGrid && mobileMenuGrid.classList.contains('open')) {
        mobileMenuDropdownToggle.setAttribute('aria-expanded', 'false');
        mobileMenuGrid.classList.remove('open');
      }
    }
  });
  
  // Helper function to close the mobile navigation
  function closeMobileNav() {
    body.classList.remove('mobile-nav-open');
    mobileNavToggle.classList.remove('active');
    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNavToggle.setAttribute('aria-label', 'Open conversation list');
    
    // Also close the mobile menu dropdown if open
    if (mobileMenuGrid && mobileMenuGrid.classList.contains('open')) {
      mobileMenuDropdownToggle.setAttribute('aria-expanded', 'false');
      mobileMenuGrid.classList.remove('open');
    }
  }
}

// Auto-initialize on DOMContentLoaded if this script is loaded directly
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded, initialize now
  init();
}