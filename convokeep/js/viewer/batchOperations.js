/**
 * Batch Operations Module
 *
 * Handles batch/bulk operations on multiple conversations:
 * - Multi-select with checkboxes
 * - Bulk delete, archive, star, tag
 * - Bulk export
 * - Selection state management
 */

import {
  bulkUpdateConversations,
  bulkDeleteConversations
} from '../database/index.js';
import { withFeature } from '../license/index.js';

/**
 * Batch Operations Manager
 */
export class BatchOperationsManager {
  constructor() {
    this.selectedConversations = new Set();
    this.allConversations = [];
    this.onSelectionChange = null;
    this.onBatchComplete = null;
  }

  /**
   * Initialize batch operations UI
   */
  init() {
    this.setupEventListeners();
    this.updateUI();
  }

  /**
   * Set up event listeners for batch operations
   */
  setupEventListeners() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectAll();
        } else {
          this.deselectAll();
        }
      });
    }

    // Batch action buttons
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    if (batchDeleteBtn) {
      batchDeleteBtn.addEventListener('click', () => {
        withFeature('batch_operations', () => this.handleBatchDelete());
      });
    }

    const batchArchiveBtn = document.getElementById('batch-archive-btn');
    if (batchArchiveBtn) {
      batchArchiveBtn.addEventListener('click', () => {
        withFeature('batch_operations', () => this.handleBatchArchive());
      });
    }

    const batchStarBtn = document.getElementById('batch-star-btn');
    if (batchStarBtn) {
      batchStarBtn.addEventListener('click', () => {
        withFeature('enhanced_organization', () => this.handleBatchStar());
      });
    }

    const batchTagBtn = document.getElementById('batch-tag-btn');
    if (batchTagBtn) {
      batchTagBtn.addEventListener('click', () => {
        withFeature('enhanced_organization', () => this.handleBatchTag());
      });
    }

    const batchExportBtn = document.getElementById('batch-export-btn');
    if (batchExportBtn) {
      batchExportBtn.addEventListener('click', () => {
        withFeature('export_conversations', () => this.handleBatchExport());
      });
    }
  }

  /**
   * Update the list of all available conversations on current page
   * @param {Array} conversations - Current conversation list (current page only)
   */
  setConversations(conversations) {
    this.allConversations = conversations;

    // NOTE: We intentionally do NOT clear selections from other pages
    // Users should be able to select items across multiple pages
    // Selections are only cleared when:
    // - User manually deselects
    // - Batch operation completes
    // - User explicitly clears selection

    this.updateUI();
  }

  /**
   * Toggle selection for a conversation
   * @param {string} conversationId - Conversation ID to toggle
   */
  toggleSelection(conversationId) {
    if (this.selectedConversations.has(conversationId)) {
      this.selectedConversations.delete(conversationId);
    } else {
      this.selectedConversations.add(conversationId);
    }

    // Update UI but don't re-query all checkboxes (they're already updated via click)
    this.updateUIWithoutCheckboxes();

    if (this.onSelectionChange) {
      this.onSelectionChange(this.getSelectedConversationIds());
    }
  }

  /**
   * Select all conversations
   */
  selectAll() {
    this.selectedConversations.clear();
    this.allConversations.forEach(conv => {
      this.selectedConversations.add(conv.conversation_id);
    });

    this.updateUI();

    if (this.onSelectionChange) {
      this.onSelectionChange(this.getSelectedConversationIds());
    }
  }

  /**
   * Deselect all conversations
   */
  deselectAll() {
    this.selectedConversations.clear();
    this.updateUI();

    if (this.onSelectionChange) {
      this.onSelectionChange(this.getSelectedConversationIds());
    }
  }

  /**
   * Check if a conversation is selected
   * @param {string} conversationId - Conversation ID to check
   * @returns {boolean} Whether the conversation is selected
   */
  isSelected(conversationId) {
    return this.selectedConversations.has(conversationId);
  }

  /**
   * Get array of selected conversation IDs
   * @returns {string[]} Selected conversation IDs
   */
  getSelectedConversationIds() {
    return Array.from(this.selectedConversations);
  }

  /**
   * Get count of selected conversations
   * @returns {number} Selection count
   */
  getSelectionCount() {
    return this.selectedConversations.size;
  }

  /**
   * Update UI based on current selection state
   */
  updateUI() {
    this.updateUIWithoutCheckboxes();
    this.updateCheckboxes();
  }

  /**
   * Update toolbar and count without re-querying checkboxes (for performance)
   */
  updateUIWithoutCheckboxes() {
    const count = this.getSelectionCount();
    const toolbar = document.getElementById('batch-toolbar');
    const selectionCountEl = document.getElementById('selection-count');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');

    // Show/hide batch toolbar
    if (toolbar) {
      if (count > 0) {
        toolbar.classList.remove('hidden');
      } else {
        toolbar.classList.add('hidden');
      }
    }

    // Update selection count text
    if (selectionCountEl) {
      const text = count === 1 ? '1 selected' : `${count} selected`;
      selectionCountEl.textContent = text;
    }

    // Update select all checkbox state
    if (selectAllCheckbox) {
      const allSelected = count > 0 && count === this.allConversations.length;
      const someSelected = count > 0 && count < this.allConversations.length;

      selectAllCheckbox.checked = allSelected;
      selectAllCheckbox.indeterminate = someSelected;
    }
  }

  /**
   * Update individual conversation checkboxes
   */
  updateCheckboxes() {
    const checkboxes = document.querySelectorAll('.conversation-item-checkbox');
    checkboxes.forEach(checkbox => {
      const conversationId = checkbox.dataset.conversationId;
      if (conversationId) {
        checkbox.checked = this.isSelected(conversationId);
      }
    });
  }

  /**
   * Handle batch delete operation
   */
  async handleBatchDelete() {
    const count = this.getSelectionCount();
    if (count === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${count} conversation${count > 1 ? 's' : ''}?\n\n` +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const ids = this.getSelectedConversationIds();

      // Show loading state
      this.showLoadingState('Deleting conversations...');

      const result = await bulkDeleteConversations(ids);

      // Clear selection
      this.deselectAll();

      // Show success message
      this.showSuccessMessage(
        `Successfully deleted ${result.deleted} conversation${result.deleted > 1 ? 's' : ''}`
      );

      // Notify completion (will trigger reload)
      if (this.onBatchComplete) {
        this.onBatchComplete('delete', result);
      }
    } catch (error) {
      console.error('Batch delete failed:', error);
      this.showErrorMessage(`Failed to delete conversations: ${error.message}`);
    }
  }

  /**
   * Handle batch archive operation
   */
  async handleBatchArchive() {
    const count = this.getSelectionCount();
    if (count === 0) return;

    try {
      const ids = this.getSelectedConversationIds();

      // Determine if we're archiving or unarchiving
      // For simplicity, always archive selected items
      const updates = { archived: true };

      this.showLoadingState('Archiving conversations...');

      const result = await bulkUpdateConversations(ids, updates);

      this.deselectAll();

      this.showSuccessMessage(
        `Successfully archived ${result.updated} conversation${result.updated > 1 ? 's' : ''}`
      );

      if (this.onBatchComplete) {
        this.onBatchComplete('archive', result);
      }
    } catch (error) {
      console.error('Batch archive failed:', error);
      this.showErrorMessage(`Failed to archive conversations: ${error.message}`);
    }
  }

  /**
   * Handle batch star operation
   */
  async handleBatchStar() {
    const count = this.getSelectionCount();
    if (count === 0) return;

    try {
      const ids = this.getSelectedConversationIds();

      // For simplicity, always star selected items
      const updates = { starred: true };

      this.showLoadingState('Starring conversations...');

      const result = await bulkUpdateConversations(ids, updates);

      this.deselectAll();

      this.showSuccessMessage(
        `Successfully starred ${result.updated} conversation${result.updated > 1 ? 's' : ''}`
      );

      if (this.onBatchComplete) {
        this.onBatchComplete('star', result);
      }
    } catch (error) {
      console.error('Batch star failed:', error);
      this.showErrorMessage(`Failed to star conversations: ${error.message}`);
    }
  }

  /**
   * Handle batch tag operation
   */
  handleBatchTag() {
    const count = this.getSelectionCount();
    if (count === 0) return;

    // Show batch tag modal
    const modal = document.getElementById('batch-tag-modal');
    const countEl = document.getElementById('batch-tag-count');

    if (modal && countEl) {
      countEl.textContent = count;
      modal.removeAttribute('hidden');
    }
  }

  /**
   * Handle batch export operation
   */
  async handleBatchExport() {
    const count = this.getSelectionCount();
    if (count === 0) return;

    try {
      const ids = this.getSelectedConversationIds();

      // Import export module dynamically
      const { exportSelected } = await import('../utils/exportUtils.js');

      this.showLoadingState('Preparing export...');

      const result = await exportSelected(ids);

      this.showSuccessMessage(
        `Successfully exported ${result.conversationCount} conversation${result.conversationCount > 1 ? 's' : ''}`
      );
    } catch (error) {
      console.error('Batch export failed:', error);
      this.showErrorMessage(`Failed to export conversations: ${error.message}`);
    }
  }

  /**
   * Show loading state message
   * @param {string} message - Loading message
   */
  showLoadingState(message) {
    // This would integrate with your existing UI notification system
    console.log(`[Loading] ${message}`);
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    // This would integrate with your existing UI notification system
    console.log(`[Success] ${message}`);

    // Could also show a toast notification
    if (window.showToast) {
      window.showToast(message, 'success');
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    // This would integrate with your existing UI notification system
    console.error(`[Error] ${message}`);
    alert(message);
  }
}

// Create singleton instance
const batchOpsManager = new BatchOperationsManager();

export default batchOpsManager;
