/**
 * UIController - Handles DOM interactions for the viewer
 *
 * Manages UI updates, event handling, and user interactions
 * with the DOM elements of the conversation viewer.
 */

import { formatters } from '../utils/formatUtils.js';
import { resetDatabase } from '../utils/index.js';
import batchOpsManager from './batchOperations.js';
import { updateConversationMetadata } from '../database/index.js';

/**
 * Class to handle UI interaction
 */
export class UIController {
  /**
   * @param {ViewerCore} viewerCore - Main viewer controller
   */
  constructor(viewerCore) {
    this.viewerCore = viewerCore;
    this.uploaderInitialized = false; // Instance property to track uploader initialization
    this.elements = {
      conversationList: document.getElementById('conversation-list'),
      messageContainer: document.getElementById('message-container'),
      conversationView: document.getElementById('conversation-view'),
      emptyState: document.getElementById('empty-state'),
      uploadModal: document.getElementById('upload-modal'),
      headerElements: {
        titleEl: document.getElementById('conversation-title'),
        dateEl: document.getElementById('conversation-date'),
        modelEl: document.getElementById('conversation-model')
      }
    };
  }

  /**
   * Set up event listeners for UI components
   */
  setupEventListeners() {
    // Diagnostic click listener
    document.addEventListener('click', (e) => {

    });

    // Upload buttons
    const uploadButtons = document.querySelectorAll('#upload-button, #sidebar-upload-btn');
    uploadButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', this.showUploadModal.bind(this));
      }
    });

    // Modal close button
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
      closeModal.addEventListener('click', this.hideUploadModal.bind(this));
    }

    // Menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mainMenu = document.getElementById('main-menu');

    if (menuToggle && mainMenu) {
      // Ensure the menu is properly initialized
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('active');
      mainMenu.classList.remove('active');

      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (mainMenu.classList.contains('active')) {
          this._closeMenu(menuToggle, mainMenu);
        } else {
          this._openMenu(menuToggle, mainMenu);
        }
      });

      // Close menu when clicking outside
      document.addEventListener('click', (event) => {
        if (!menuToggle.contains(event.target) &&
          !mainMenu.contains(event.target) &&
          mainMenu.classList.contains('active')) {
          this._closeMenu(menuToggle, mainMenu);
        }
      });

      // Close menu on escape key
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mainMenu.classList.contains('active')) {
          this._closeMenu(menuToggle, mainMenu);
        }
      });
    }

    // Reset database button in menu
    const menuResetDbBtn = document.getElementById('menu-reset-db-btn');
    if (menuResetDbBtn) {
      // Create a clean button without existing listeners
      const newMenuResetBtn = menuResetDbBtn.cloneNode(true);
      menuResetDbBtn.parentNode.replaceChild(newMenuResetBtn, menuResetDbBtn);

      // Add click handler using the centralized reset function
      newMenuResetBtn.addEventListener('click', async () => {
        // Close the menu
        if (mainMenu) mainMenu.classList.remove('active');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');

        // Use the centralized reset database function
        await resetDatabase({
          onBeforeReset: () => {
            this.showLoadingIndicator();
          },
          onAfterReset: () => {
            // Clear UI
            if (this.elements.conversationList) {
              this.elements.conversationList.innerHTML = '';

              // Show empty state
              const emptyState = document.getElementById('empty-conversation-list');
              if (emptyState) {
                emptyState.style.display = 'flex';
                this.elements.conversationList.appendChild(emptyState);
              }
            }

            // Hide conversation view if visible
            if (this.elements.conversationView) {
              this.elements.conversationView.classList.add('hidden');
            }

            // Show empty state in main area
            this.showEmptyState();

            // Reset current conversation ID
            this.viewerCore.currentConversationId = null;
          },
          onError: () => {
            this.hideLoadingIndicator();
          }
        });
      });
    }
  }

  /**
   * Display a conversation in the UI
   * @param {Object} conversation - Conversation data
   * @param {Array} messages - Messages to display
   * @param {boolean} hasMoreMessages - Whether there are more messages
   */
  displayConversation(conversation, messages, hasMoreMessages) {
    // Show conversation view
    if (this.elements.emptyState) {
      this.elements.emptyState.classList.add('hidden');
    }

    if (this.elements.conversationView) {
      this.elements.conversationView.classList.remove('hidden');
    }

    // Update header
    this._updateConversationHeader(conversation);

    // Display messages
    this.viewerCore.messageRenderer.renderMessages(
      messages,
      this.elements.messageContainer,
      false, // Not appending
      false  // No animation for initial load
    );

    // Store whether there are more messages (use viewerCore instance property)
    this.viewerCore.hasMoreMessages = hasMoreMessages;
  }

  /**
   * Update the conversation header with metadata
   * @param {Object} conversation - Conversation data
   */
  _updateConversationHeader(conversation) {
    const { titleEl, dateEl, modelEl } = this.elements.headerElements;

    if (titleEl) {
      titleEl.textContent = conversation.title || 'Untitled Conversation';
    }

    if (dateEl) {
      dateEl.textContent = formatters.fullDate(conversation.created_at);
    }

    if (modelEl) {
      let modelText = conversation.model || '';

      // Format the model name to be more readable
      if (modelText.startsWith('gpt-')) {
        modelText = modelText.replace('gpt-', 'GPT-');
      } else if (modelText.startsWith('claude-')) {
        modelText = modelText.replace('claude-unknown', 'Claude ');
      }

      modelEl.textContent = modelText || conversation.source || '';
    }
  }

  /**
   * Show loading state for conversation view
   */
  showConversationLoading() {
    if (this.elements.messageContainer) {
      this.elements.messageContainer.innerHTML =
        '<div class="loading-indicator">Teaching AI to tell dad jokes...</div>';
    }
  }

  /**
   * Update the conversation list UI
   * @param {Array} conversations - Conversations to display
   * @param {boolean} append - Whether to append or replace (no longer used)
   * @param {boolean} animate - Whether to animate the list (default true for initial load)
   */
  updateConversationList(conversations, append = false, animate = true) {
    const container = this.elements.conversationList;

    if (!container) return;

    // Save scroll position before clearing
    const scrollTop = container.scrollTop;

    // Always clear list - we no longer append with paged approach
    container.innerHTML = '';

    // If no conversations, show empty state
    if (conversations.length === 0) {
      // Show empty state with upload button
      const emptyState = document.getElementById('empty-conversation-list');
      if (emptyState) {
        emptyState.style.display = 'flex';
        container.appendChild(emptyState);
      }
      return;
    } else {
      // Hide empty state if we have conversations
      const emptyState = document.getElementById('empty-conversation-list');
      if (emptyState) {
        emptyState.style.display = 'none';
      }
    }

    // Use DocumentFragment for efficient batch DOM insertion
    const fragment = document.createDocumentFragment();
    const items = [];

    // Create all items and add to fragment
    conversations.forEach((conversation) => {
      const item = this._createConversationItem(conversation);
      if (animate) {
        item.classList.add('new-item');
      }
      items.push(item);
      fragment.appendChild(item);
    });

    // Single DOM insertion to avoid layout thrashing
    container.appendChild(fragment);

    // Restore scroll position (for filter changes)
    if (!animate) {
      container.scrollTop = scrollTop;
    }

    // Use requestAnimationFrame for smooth animations (only if animate = true)
    if (animate) {
      requestAnimationFrame(() => {
        items.forEach((item, index) => {
          // Stagger animations using single RAF with CSS delays
          item.style.animationDelay = `${index * 50}ms`;
          item.classList.add('animate-in');
        });
      });
    }
  }

  /**
   * Update selection in conversation list
   * @param {string} conversationId - Selected conversation ID
   */
  updateConversationSelection(conversationId) {
    const items = document.querySelectorAll('.conversation-item');

    items.forEach(item => {
      if (item.dataset.conversationId === conversationId) {
        item.classList.add('active');

        // Scroll item into view
        setTimeout(() => {
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Clear selection in conversation list
   */
  clearConversationSelection() {
    const items = document.querySelectorAll('.conversation-item');

    items.forEach(item => {
      item.classList.remove('active');
    });
  }

  /**
   * Create a conversation item element
   * @param {Object} conversation - Conversation data
   * @returns {HTMLElement} Conversation item element
   */
  _createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.conversationId = conversation.conversation_id;

    // Mark as active if selected
    if (conversation.conversation_id === this.viewerCore.currentConversationId) {
      item.classList.add('active');
    }

    // Mark as archived if applicable
    if (conversation.archived) {
      item.classList.add('archived');
    }

    // Format date
    const fullDate = formatters.fullDate(conversation.created_at);

    // Format source name
    const sourceName = this._formatSourceName(conversation);

    // Render tags (if any)
    const tags = conversation.tags || [];
    const tagsHtml = tags.length > 0
      ? `<div class="conversation-tags">
          ${tags.map(tag => `<span class="conversation-tag">${this._escapeHtml(tag)}</span>`).join('')}
        </div>`
      : '';

    // Create item content
    item.innerHTML = `
      <div class="conversation-item-checkbox-wrapper">
        <input
          type="checkbox"
          class="conversation-item-checkbox"
          data-conversation-id="${conversation.conversation_id}"
          aria-label="Select conversation"
          ${batchOpsManager.isSelected(conversation.conversation_id) ? 'checked' : ''}
        />
      </div>
      <div class="conversation-item-content">
        <div class="conversation-item-header">
          <div class="conversation-item-title">${conversation.title}</div>
          <button
            class="conversation-item-star ${conversation.starred ? 'starred' : ''}"
            data-conversation-id="${conversation.conversation_id}"
            aria-label="${conversation.starred ? 'Unstar conversation' : 'Star conversation'}"
            title="${conversation.starred ? 'Unstar' : 'Star'}"
          >
            ${conversation.starred ? '★' : '☆'}
          </button>
        </div>
        <div class="conversation-item-meta">
          <span class="conversation-item-source">${sourceName}</span>
          <span>•</span>
          <span class="conversation-item-date">${fullDate}</span>
          ${conversation.archived ? '<span class="conversation-item-archived-badge">Archived</span>' : ''}
        </div>
        ${tagsHtml}
      </div>
    `;

    // Get DOM references for event handlers
    const checkbox = item.querySelector('.conversation-item-checkbox');
    const starBtn = item.querySelector('.conversation-item-star');
    const contentArea = item.querySelector('.conversation-item-content');

    // Handle checkbox click (don't propagate to item click)
    if (checkbox) {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        batchOpsManager.toggleSelection(conversation.conversation_id);
      });
    }

    // Handle star button click
    if (starBtn) {
      starBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        // Read current state from button to avoid stale conversation object
        const isCurrentlyStarred = starBtn.classList.contains('starred');
        await this._handleStarToggle(conversation.conversation_id, !isCurrentlyStarred, starBtn);
      });
    }

    // Handle click on content area to select conversation
    if (contentArea) {
      contentArea.addEventListener('click', () => {
        // Ensure we have a valid conversation ID before loading
        if (conversation && conversation.conversation_id) {
          this.viewerCore.loadConversation(conversation.conversation_id);
        } else {
          console.warn('Attempted to load conversation with invalid ID', conversation);
        }
      });
    }

    return item;
  }

  /**
   * Format source name for display
   * @param {Object} conversation - Conversation data
   * @returns {string} Formatted source name
   */
  _formatSourceName(conversation) {
    const source = (conversation.source || '').toLowerCase();
    const model = (conversation.model || '').toLowerCase();

    if (source.includes('chatgpt') || source.includes('gpt') || model.includes('gpt')) {
      return 'ChatGPT';
    } else if (source.includes('claude') || model.includes('claude')) {
      return 'Claude';
    }

    return conversation.source || 'Unknown';
  }

  /**
   * Show loading indicator in conversation list
   */
  showLoadingIndicator() {
    const container = this.elements.conversationList;
    const emptyState = document.getElementById('empty-conversation-list');

    if (container) {
      // Hide empty state
      if (emptyState) {
        emptyState.style.display = 'none';
      }

      // Only add loading indicator if not already present
      if (!container.querySelector('.loading-indicator')) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.textContent = 'Loading conversations...';
        container.appendChild(loadingIndicator);
      }
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    const container = this.elements.conversationList;

    if (container) {
      const loadingIndicator = container.querySelector('.loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }
  }

  /**
   * Show the upload modal
   */
  showUploadModal() {
    if (this.elements.uploadModal) {
      // Remove the hidden attribute and set display to block
      this.elements.uploadModal.removeAttribute('hidden');
      this.elements.uploadModal.style.display = 'block';

      // Initialize uploader functionality if needed (use instance property)
      if (!this.uploaderInitialized) {
        import('../app.js').then(module => {
          module.init();
          this.uploaderInitialized = true;
        }).catch(error => {
          console.error('Failed to load uploader scripts:', error);
          alert('Failed to load uploader functionality');
        });
      }
    }
  }

  /**
   * Hide the upload modal
   */
  hideUploadModal() {
    if (this.elements.uploadModal) {
      // Add the hidden attribute and set display to none
      this.elements.uploadModal.setAttribute('hidden', '');
      this.elements.uploadModal.style.display = 'none';
    }
  }

  /**
   * Show empty state with welcome information
   */
  showEmptyState() {
    if (this.elements.emptyState) {
      this.elements.emptyState.classList.remove('hidden');
      this.elements.emptyState.innerHTML = /*html*/`
        <div class="empty-state-container">
          <div class="empty-state-icon">💬</div>
          <h2 class="empty-state-title">Welcome to ConvoKeep</h2>
          <p class="empty-state-description">
            Your personal, private archive for AI conversations from ChatGPT, Claude, and soon, more.
            All data stays in your browser via IndexedDB - no cloud storage or API keys required.
          </p>
          
          <div class="feature-container">
            <div class="feature-item">
              <div class="feature-icon">🔒</div>
              <div class="feature-title">Privacy-First</div>
              <div class="feature-description">All data stays in your browser via IndexedDB</div>
            </div>
            
            
            <div class="feature-item">
              <div class="feature-icon">🔄</div>
              <div class="feature-title">Multi-Source</div>
              <div class="feature-description">ChatGPT & Claude support</div>
            </div>
          </div>
          
          <div class="getting-started">
            <h3 class="getting-started-title">How to Get Started:</h3>
            <ol class="getting-started-list">
              <li class="getting-started-item">Download your conversation history from <a href="https://chat.openai.com/" target="_blank" rel="noopener">ChatGPT</a> or <a href="https://claude.ai/" target="_blank" rel="noopener">Claude</a></li>
              <li class="getting-started-item">Click the "Upload" button above or below and select your .zip or .dms file</li>
              <li class="getting-started-item">Browse and filter your conversations from the sidebar</li>
              <li class="getting-started-item">Everything is stored locally in your browser - your data never leaves your device</li>
            </ol>
          </div>
          
          <button id="empty-state-upload-btn" class="button">Upload Your Conversations</button>
        
          <div class="feedback-link">
            <a href="mailto:chriswahlfeldt@gmail.com?subject=ConvoKeep%20Feedback">Send Feedback</a>
          </div>
        </div>
      `;
      /*
                <div class="formats-note">
                  Supported formats: ChatGPT and Claude (.zip, .dms) export files
                </div>
                
      */
      // Add event listener to upload button
      const uploadBtn = document.getElementById('empty-state-upload-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', this.showUploadModal.bind(this));
      }
    }

    if (this.elements.conversationView) {
      this.elements.conversationView.classList.add('hidden');
    }
  }

  /**
   * Append additional messages to the conversation view
   * @param {Array} messages - Messages to append
   */
  appendMessages(messages) {
    if (!this.elements.messageContainer || !messages || messages.length === 0) {
      return;
    }

    // Render and append messages
    this.viewerCore.messageRenderer.renderMessages(
      messages,
      this.elements.messageContainer,
      true,  // Append
      true   // Animate
    );

    // Move loader to the end
    const loader = document.getElementById('message-scroll-loader');
    if (loader && this.elements.messageContainer) {
      this.elements.messageContainer.appendChild(loader);
    }
  }

  /**
   * Open the menu
   * @param {HTMLElement} menuToggle - Menu toggle button
   * @param {HTMLElement} mainMenu - Main menu container
   */
  _openMenu(menuToggle, mainMenu) {

    mainMenu.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.classList.add('active');

    // Make sure the menu is visible
    mainMenu.style.display = 'block';

    // Set focus on first menu item
    setTimeout(() => {
      const firstItem = mainMenu.querySelector('.menu-item');
      if (firstItem) firstItem.focus();
    }, 100);
  }

  /**
   * Close the menu
   * @param {HTMLElement} menuToggle - Menu toggle button
   * @param {HTMLElement} mainMenu - Main menu container
   */
  _closeMenu(menuToggle, mainMenu) {

    mainMenu.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.classList.remove('active');
  }

  /**
   * Handle star toggle
   * @param {string} conversationId - Conversation ID
   * @param {boolean} starred - New starred state
   * @param {HTMLElement} starBtn - Star button element
   */
  async _handleStarToggle(conversationId, starred, starBtn) {
    try {
      // Update in database
      await updateConversationMetadata(conversationId, { starred });

      // Update button UI
      starBtn.classList.toggle('starred', starred);
      starBtn.textContent = starred ? '★' : '☆';
      starBtn.setAttribute('aria-label', starred ? 'Unstar conversation' : 'Star conversation');
      starBtn.setAttribute('title', starred ? 'Unstar' : 'Star');

      // NOTE: We don't reload the conversation list here - only update the UI
      // The star change is already persisted to the database
      // If the user is filtering by starred, they can manually refresh
    } catch (error) {
      console.error('Failed to toggle star:', error);
      alert(`Failed to ${starred ? 'star' : 'unstar'} conversation: ${error.message}`);
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
