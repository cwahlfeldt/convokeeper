/**
 * ViewerCore - Main coordinator for the viewer application
 * 
 * Handles initialization and coordinates the various viewer modules.
 * Acts as a facade for the viewer functionality and manages state.
 */

import { initDb, hasConversations } from '../database/index.js';
import { createMarkdownRenderer } from '../utils/markdownUtils.js';
import { urlParams } from '../utils/urlUtils.js';
import { debounce } from '../utils/performanceUtils.js';
import { ConversationManager } from './conversationManager.js';
import { MessageRenderer } from './messageRenderer.js';
import { UIController } from './uiController.js';
import { PaginationComponent } from './paginationComponent.js';
import batchOpsManager from './batchOperations.js';
import tagManager from './tagManager.js';
import './fuzzySearch.js'; // Import the fuzzy search component

// Configuration constants
const CONVERSATIONS_PER_PAGE = 20;
const MESSAGES_PER_PAGE = 30;

/**
 * ViewerCore class to coordinate viewer functionality
 */
class ViewerCore {
  constructor() {
    // Initialize state
    this.currentConversationId = null;
    this.sourceFilter = 'all';
    this.sortOrder = 'newest';
    this.currentPage = 1;
    this.markdownRenderer = null;
    this.isSearchMode = false; // Flag to track if we're in search mode
    this.currentSearchResults = null; // Store search results for later use

    // Organization filters
    this.starredFilter = false;
    this.archivedFilter = false;
    this.tagFilter = null; // null = no filter, string = specific tag

    // Message loading state (replaces global window properties)
    this.hasMoreMessages = false;
    this.isLoadingMoreMessages = false;
    this.messageLoadTriggerPoint = 0;

    // Initialize modules
    this.conversationManager = new ConversationManager(CONVERSATIONS_PER_PAGE);
    this.messageRenderer = null; // Initialized after markdown renderer is created
    this.uiController = null; // Initialized after DOM is loaded
    this.paginationComponent = null; // Initialized after DOM is loaded
  }

  /**
   * Initialize the viewer
   */
  async init() {
    try {
      // Initialize database
      await initDb();

      // Create markdown renderer
      this.markdownRenderer = createMarkdownRenderer();

      // Initialize dependent modules
      this.messageRenderer = new MessageRenderer(this.markdownRenderer);
      this.uiController = new UIController(this);

      // Initialize pagination component
      const paginationContainer = document.getElementById('pagination-container');
      if (paginationContainer) {
        this.paginationComponent = new PaginationComponent({
          container: paginationContainer,
          onPageChange: this.handlePageChange.bind(this),
          visiblePageCount: 3
        });
      }

      // Initialize batch operations manager
      batchOpsManager.init();
      batchOpsManager.onBatchComplete = async (action, result) => {
        console.log(`Batch ${action} completed:`, result);
        // Reload conversations after batch operation (no animation for smoother UX)
        await this.loadConversations({ animate: false });
      };

      // Initialize tag manager
      await tagManager.init();
      tagManager.onTagsChanged = async () => {
        // Reload conversations when tags change (no animation for smoother UX)
        await this.loadConversations({ animate: false });
      };

      // Set up event handlers
      this.setupEventListeners();

      // Show the landing page initially
      this.uiController.showEmptyState();

      // Check if there are existing conversations
      const hasData = await hasConversations();

      if (hasData) {
        // Check for URL parameters first
        this.handleUrlParameters();

        // Load conversations using parameters or defaults
        await this.loadConversations();

        // Check if we have cached search data
        try {
          const cachedSearchData = localStorage.getItem('cachedSearchData');

          if (cachedSearchData) {
            // Use cached search data
            const searchEl = document.getElementById('conversation-search');
            if (searchEl) {
              try {
                searchEl.setSearchData(JSON.parse(cachedSearchData));
                console.log('Using cached search data');
              } catch (parseError) {
                console.error('Failed to parse cached search data, reloading:', parseError);
                localStorage.removeItem('cachedSearchData');
                await this.loadAllConversationsForSearch();
              }
            }
          } else {
            // Load all conversations for search and cache the result
            await this.loadAllConversationsForSearch();
          }
        } catch (error) {
          console.error('Error accessing cached search data:', error);
          // If localStorage fails, just load without cache
          await this.loadAllConversationsForSearch();
        }
      }
    } catch (error) {
      console.error('Failed to initialize viewer:', error);
      this.showError('Failed to initialize viewer. Please check console for details.');
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Set up UI event handlers
    this.uiController.setupEventListeners();

    // Set up filter handlers
    const sourceFilterEl = document.getElementById('source-filter');
    if (sourceFilterEl) {
      sourceFilterEl.addEventListener('change', this.handleFiltersChange.bind(this));
    }

    const sortOrderEl = document.getElementById('sort-order');
    if (sortOrderEl) {
      sortOrderEl.addEventListener('change', this.handleFiltersChange.bind(this));
    }

    // Set up organization filter handlers
    const starredFilterBtn = document.getElementById('filter-starred');
    if (starredFilterBtn) {
      starredFilterBtn.addEventListener('click', this.handleStarredFilter.bind(this));
    }

    const archivedFilterBtn = document.getElementById('filter-archived');
    if (archivedFilterBtn) {
      archivedFilterBtn.addEventListener('click', this.handleArchivedFilter.bind(this));
    }

    // Set up fuzzy search handler
    const searchEl = document.getElementById('conversation-search');
    if (searchEl) {
      // Initialize search with empty data (will be populated when conversations load)
      searchEl.setSearchData([]);

      // Listen for search changes
      searchEl.addEventListener('search-changed', this.handleSearchChanged.bind(this));

      // Listen for result selection
      searchEl.addEventListener('result-selected', this.handleSearchResultSelected.bind(this));

      // Listen for search cleared
      searchEl.addEventListener('search-cleared', this.handleSearchCleared.bind(this));
    }

    // Handle scroll for message container
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
      messageContainer.addEventListener('scroll', debounce(this.handleMessageContainerScroll.bind(this), 150));
    }

    // Browser history navigation
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  /**
   * Handle search query changes
   * @param {CustomEvent} event - Search changed event
   */
  handleSearchChanged(event) {
    const { query, results } = event.detail;

    // If query is empty, reset search flag
    if (!query) {
      this.isSearchMode = false;
      return;
    }

    // Set search mode flag
    this.isSearchMode = true;

    // Store the search results for later use when a result is clicked
    this.currentSearchResults = results;
  }

  /**
   * Handle search result selection
   * @param {CustomEvent} event - Result selected event
   */
  handleSearchResultSelected(event) {
    const { result } = event.detail;

    // If we don't have a valid result, return early
    if (!result || !result.id || typeof result.id !== 'string') {
      console.warn('Invalid search result selected', result);
      return;
    }

    // Get conversation ID
    let conversationId = result.id;
    if (result.originalData && result.originalData.conversation_id) {
      conversationId = result.originalData.conversation_id;
    }

    // Check if result has page information and update pagination state
    if (result.page) {
      // Update current page in state
      this.currentPage = result.page;

      // Update the pagination component
      if (this.paginationComponent) {
        this.paginationComponent.update({
          currentPage: this.currentPage,
          totalPages: this.paginationComponent.totalPages
        });
      }

      // Update conversation list for this page
      this.loadConversations().then(() => {
        // After loading conversations for the page, select and load the conversation
        this.loadConversation(conversationId);
      });
    } else {
      // If no page info, just load the conversation directly
      this.loadConversation(conversationId);
    }
  }

  /**
   * Handle search being cleared
   */
  handleSearchCleared() {
    this.isSearchMode = false;
    this.currentSearchResults = null;
  }

  /**
   * Handle URL parameters on page load
   */
  async handleUrlParameters() {
    // Get parameters from URL
    const conversationId = urlParams.get('conversation');
    const page = parseInt(urlParams.get('page')) || 1;
    const source = urlParams.get('source') || 'all';
    const sortOrder = urlParams.get('sort') || 'newest';

    // Update state from URL parameters
    this.currentPage = page;
    this.sourceFilter = source;
    this.sortOrder = sortOrder;

    // Update UI filters to match URL parameters
    this.updateUIFiltersFromState();

    if (conversationId) {
      // Load the specified conversation
      await this.loadConversation(conversationId);
    } else {
      // No conversation selected, show the empty state
      this.uiController.showEmptyState();
    }
  }

  /**
   * Update UI filter controls to match current state
   */
  updateUIFiltersFromState() {
    const sourceFilterEl = document.getElementById('source-filter');
    const sortOrderEl = document.getElementById('sort-order');

    if (sourceFilterEl) {
      sourceFilterEl.value = this.sourceFilter;
    }

    if (sortOrderEl) {
      sortOrderEl.value = this.sortOrder;
    }
  }

  /**
   * Load conversations with the current filters and page
   * @param {Object} options - Load options
   * @param {boolean} options.animate - Whether to animate the list (default true)
   */
  async loadConversations(options = {}) {
    const { animate = true } = options;

    try {
      // Always load conversations regardless of search mode
      // This ensures the sidebar always shows all conversations

      this.uiController.showLoadingIndicator();

      // Get conversations from database with pagination info
      const result = await this.conversationManager.getConversations({
        page: this.currentPage,
        source: this.sourceFilter,
        sortOrder: this.sortOrder,
        starred: this.starredFilter ? true : undefined,
        archived: this.archivedFilter ? true : undefined,
        tag: this.tagFilter || undefined
      });

      const { conversations, pagination } = result;

      // Update batch operations manager with current conversations
      batchOpsManager.setConversations(conversations);

      // Update conversation list (with animation control)
      this.uiController.updateConversationList(conversations, false, animate);

      // Update pagination component
      if (this.paginationComponent) {
        this.paginationComponent.update(pagination);
      }

      // Update URL with current state
      this.updateUrl();

      // Update search data (append to existing data)
      this.updateSearchData(conversations, this.currentPage);

    } catch (error) {
      console.error('Error loading conversations:', error);
      this.showError('Failed to load conversations');
    } finally {
      this.uiController.hideLoadingIndicator();
    }
  }

  /**
   * Handle page change from pagination component
   * @param {number} pageNum - New page number
   */
  handlePageChange(pageNum) {
    // Update current page
    this.currentPage = pageNum;

    // Update URL
    this.updateUrl();

    // Load conversations for new page (without animation for faster page changes)
    this.loadConversations({ animate: false });

    // Scroll to top of conversation list
    const conversationList = document.getElementById('conversation-list');
    if (conversationList) {
      conversationList.scrollTop = 0;
    }
  }

  /**
   * Update search data with conversations
   * @param {Array} conversations - Conversations to include in search
   * @param {number} page - The page number these conversations are from
   */
  updateSearchData(conversations, page = 1) {
    const searchEl = document.getElementById('conversation-search');
    if (!searchEl) return;

    // Get existing search data
    const existingData = searchEl.searchData || [];

    // Map of existing conversation IDs for quick lookup
    const existingIds = new Map();
    existingData.forEach(item => {
      if (item && item.id) {
        existingIds.set(item.id, true);
      }
    });

    // Transform new conversations to search-friendly format
    const newSearchData = conversations
      .filter(conversation => {
        // Only include conversations not already in search data
        return conversation &&
          conversation.conversation_id &&
          !existingIds.has(conversation.conversation_id);
      })
      .map(conversation => {
        const source = conversation?.model === 'claude-unknown' ? 'Claude' : conversation.model;
        return {
          id: conversation.conversation_id,
          title: conversation.title || 'Untitled Conversation',
          subtitle: `${source || 'Unknown'} • ${conversation.created_at ?
            new Date(conversation.created_at).toLocaleDateString() :
            'Unknown date'
            }`,
          page: page, // Add the page attribute
          originalData: conversation // Optionally store the full conversation data
        };
      });

    // Combine existing and new data
    const combinedData = [...existingData, ...newSearchData];

    // console.log(`Search data: ${existingData.length} existing + ${newSearchData.length} new = ${combinedData.length} total`);

    // Update search component data
    searchEl.setSearchData(combinedData);
  }

  /**
   * Load all conversations for search functionality
   * This loads all pages in the background to populate the search data
   */
  async loadAllConversationsForSearch() {
    try {
      // Get total pages info
      const result = await this.conversationManager.getConversations({
        page: 1,
        source: this.sourceFilter,
        sortOrder: this.sortOrder
      });

      const { pagination } = result;
      const totalPages = pagination.totalPages;

      console.log(`Loading all ${totalPages} pages for search data...`);

      // Skip page 1 since it's already loaded
      for (let page = 2; page <= totalPages; page++) {
        // Load each page in the background
        const pageResult = await this.conversationManager.getConversations({
          page: page,
          source: this.sourceFilter,
          sortOrder: this.sortOrder
        });

        // Add to search data without updating UI
        if (pageResult && pageResult.conversations) {
          this.updateSearchData(pageResult.conversations, page);
        }
      }

      // Cache the final search data with size validation
      const searchEl = document.getElementById('conversation-search');
      if (searchEl && searchEl.searchData) {
        try {
          const searchDataString = JSON.stringify(searchEl.searchData);
          const sizeInBytes = new Blob([searchDataString]).size;
          const sizeInMB = sizeInBytes / (1024 * 1024);

          // Only cache if under 5MB to avoid quota errors
          if (sizeInMB < 5) {
            localStorage.setItem('cachedSearchData', searchDataString);
            console.log(`Search data cached in localStorage (${sizeInMB.toFixed(2)}MB)`);
          } else {
            console.warn(`Search data too large to cache (${sizeInMB.toFixed(2)}MB), skipping localStorage cache`);
            // Clear any existing cache to free up space
            localStorage.removeItem('cachedSearchData');
          }
        } catch (error) {
          console.error('Failed to cache search data:', error);
          // If quota exceeded, try to clear the cache
          if (error.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded, clearing cache');
            localStorage.removeItem('cachedSearchData');
          }
        }
      }

      console.log(`Finished loading all conversations for search`);
    } catch (error) {
      console.error('Error loading all conversations for search:', error);
    }
  }

  /**
   * Load a conversation by ID
   * @param {string} conversationId - Conversation ID to load
   */
  async loadConversation(conversationId) {
    try {
      // Validate conversation ID
      if (!conversationId || typeof conversationId !== 'string') {
        throw new Error('Invalid conversation ID');
      }

      // Update current ID
      this.currentConversationId = conversationId;

      // Update URL
      this.updateUrl();

      // Update UI selection
      this.uiController.updateConversationSelection(conversationId);

      // Show loading state
      this.uiController.showConversationLoading();

      // Load conversation data
      const conversation = await this.conversationManager.getConversationById(
        conversationId
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Display the conversation
      const { messages, hasMoreMessages } = this.conversationManager.getPaginatedMessages(conversation);
      this.uiController.displayConversation(conversation, messages, hasMoreMessages);

    } catch (error) {
      console.error('Error loading conversation:', error);

      // Only show error to user if it's not search-related (which can happen during normal operation)
      if (this.isSearchMode && error.message.includes('not found')) {
        // In search mode, just reset the view if conversation is not found
        this.showEmptyState();
      } else {
        this.showError('Failed to load conversation');
      }
    }
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    this.uiController.showEmptyState();
  }

  /**
   * Reload all conversations (when filters change)
   */
  async reloadConversations() {
    // Note: We don't clear search when reloading conversations
    // This allows the search to be active while still showing all conversations in the sidebar

    // Reset to first page
    this.conversationManager.resetPagination();
    this.currentPage = 1;

    // Reload conversations without animation (for filter/sort changes)
    await this.loadConversations({ animate: false });
  }

  /**
   * Update the URL with current state
   */
  updateUrl() {
    // Create a new URLSearchParams instance
    const params = new URLSearchParams(window.location.search);

    // Add or update conversation ID
    if (this.currentConversationId) {
      params.set('conversation', this.currentConversationId);
    } else {
      params.delete('conversation');
    }

    // Add pagination and filter state
    if (this.currentPage > 1) {
      params.set('page', this.currentPage.toString());
    } else {
      params.delete('page');
    }

    if (this.sourceFilter !== 'all') {
      params.set('source', this.sourceFilter);
    } else {
      params.delete('source');
    }

    if (this.sortOrder !== 'newest') {
      params.set('sort', this.sortOrder);
    } else {
      params.delete('sort');
    }

    // Update URL without refreshing page
    const paramString = params.toString();
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (paramString ? '?' + paramString : '')
    );
  }

  /**
   * Handle filter changes
   */
  async handleFiltersChange() {
    const sourceFilterEl = document.getElementById('source-filter');
    const sortOrderEl = document.getElementById('sort-order');

    const newSourceFilter = sourceFilterEl ? sourceFilterEl.value : 'all';
    const newSortOrder = sortOrderEl ? sortOrderEl.value : 'newest';

    // Skip if unchanged
    if (newSourceFilter === this.sourceFilter && newSortOrder === this.sortOrder) {
      return;
    }

    // Update filters
    this.sourceFilter = newSourceFilter;
    this.sortOrder = newSortOrder;

    // Reset to first page when filters change
    this.currentPage = 1;

    // Reload conversations
    await this.reloadConversations();
  }

  /**
   * Handle starred filter toggle
   */
  async handleStarredFilter() {
    const btn = document.getElementById('filter-starred');
    if (!btn) return;

    // Check current state from button to ensure we have the right state
    const isCurrentlyActive = btn.dataset.active === 'true';

    // Toggle filter state (if currently active, turn off; if off, turn on)
    this.starredFilter = !isCurrentlyActive;

    // Update button UI
    btn.dataset.active = this.starredFilter ? 'true' : 'false';

    // If enabling starred filter, disable archived filter (mutually exclusive)
    if (this.starredFilter && this.archivedFilter) {
      this.archivedFilter = false;
      const archivedBtn = document.getElementById('filter-archived');
      if (archivedBtn) {
        archivedBtn.dataset.active = 'false';
      }
    }

    // Reset to first page when filter changes
    this.currentPage = 1;

    // Reload conversations with new filter state
    await this.reloadConversations();
  }

  /**
   * Handle archived filter toggle
   */
  async handleArchivedFilter() {
    const btn = document.getElementById('filter-archived');
    if (!btn) return;

    // Check current state from button to ensure we have the right state
    const isCurrentlyActive = btn.dataset.active === 'true';

    // Toggle filter state (if currently active, turn off; if off, turn on)
    this.archivedFilter = !isCurrentlyActive;

    // Update button UI
    btn.dataset.active = this.archivedFilter ? 'true' : 'false';

    // If enabling archived filter, disable starred filter (mutually exclusive)
    if (this.archivedFilter && this.starredFilter) {
      this.starredFilter = false;
      const starredBtn = document.getElementById('filter-starred');
      if (starredBtn) {
        starredBtn.dataset.active = 'false';
      }
    }

    // Reset to first page when filter changes
    this.currentPage = 1;

    // Reload conversations with new filter state
    await this.reloadConversations();
  }

  /**
   * Handle scrolling in the message container
   */
  async handleMessageContainerScroll(event) {
    const container = event.target;

    // Check if we're near the bottom
    const isNearBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 200;

    // Check if we should load more (use instance properties)
    if (isNearBottom &&
      !this.isLoadingMoreMessages &&
      this.hasMoreMessages) {

      // Set loading flag
      this.isLoadingMoreMessages = true;

      // Show loader
      const loader = document.getElementById('message-scroll-loader');
      if (loader) loader.classList.add('active');

      // Save scroll position
      this.messageLoadTriggerPoint = container.scrollTop + container.clientHeight;

      // Load more messages
      setTimeout(async () => {
        await this.loadMoreMessages();

        // Reset loading flag
        this.isLoadingMoreMessages = false;

        // Hide loader
        if (loader) loader.classList.remove('active');
      }, 300);
    }
  }

  /**
   * Load more messages for the current conversation
   */
  async loadMoreMessages() {
    if (!this.currentConversationId) return;

    try {
      // Get current message count
      const messageContainer = document.getElementById('message-container');
      const currentCount = messageContainer?.querySelectorAll('.message').length || 0;

      // Get the full conversation
      const conversation = await this.conversationManager.getConversationById(
        this.currentConversationId
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get next batch of messages
      const nextMessages = conversation.messages.slice(
        currentCount,
        currentCount + MESSAGES_PER_PAGE
      );

      // Skip if no new messages
      if (nextMessages.length === 0) {
        this.hasMoreMessages = false;
        return;
      }

      // Update UI
      this.uiController.appendMessages(nextMessages);

      // Update hasMoreMessages flag (use instance property)
      this.hasMoreMessages = conversation.messages.length > currentCount + nextMessages.length;

    } catch (error) {
      console.error('Error loading more messages:', error);
      this.showError('Failed to load more messages');
    }
  }

  /**
   * Handle browser history navigation
   */
  async handlePopState(event) {
    // Get parameters from URL
    const conversationId = urlParams.get('conversation');
    const page = parseInt(urlParams.get('page')) || 1;
    const source = urlParams.get('source') || 'all';
    const sortOrder = urlParams.get('sort') || 'newest';

    // Check if any pagination or filter state has changed
    const filtersChanged =
      source !== this.sourceFilter ||
      sortOrder !== this.sortOrder;

    const pageChanged = page !== this.currentPage;

    // Update state from URL parameters
    this.currentPage = page;
    this.sourceFilter = source;
    this.sortOrder = sortOrder;

    // Update UI filters
    this.updateUIFiltersFromState();

    // If filters changed or page changed, reload conversation list
    if (filtersChanged || pageChanged) {
      await this.loadConversations();
    }

    // Update conversation if changed
    if (conversationId !== this.currentConversationId) {
      if (conversationId) {
        await this.loadConversation(conversationId);
      } else {
        // No conversation selected, show empty state
        this.currentConversationId = null;
        this.uiController.showEmptyState();
        this.uiController.clearConversationSelection();
      }
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to show
   */
  showError(message) {
    console.error(message);
    alert(message);
  }
}

// Create singleton instance
const viewerCore = new ViewerCore();

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // First initialize the viewer
  viewerCore.init();
});

// Export singleton
export default viewerCore;
