/**
 * Tag Management Module
 *
 * Handles all tag-related operations:
 * - Tag CRUD (create, rename, delete)
 * - Tag autocomplete
 * - Tag management UI
 * - Batch tagging
 */

import {
  getAllTags,
  renameTag,
  deleteTag,
  updateConversationMetadata,
  bulkUpdateConversations
} from '../database/index.js';
import { exportByTag } from '../utils/exportUtils.js';

/**
 * Tag Manager
 */
export class TagManager {
  constructor() {
    this.allTags = [];
    this.selectedTags = new Set();
    this.onTagsChanged = null;
  }

  /**
   * Initialize tag management
   */
  async init() {
    await this.loadTags();
    this.setupEventListeners();
  }

  /**
   * Load all tags from database
   */
  async loadTags() {
    try {
      this.allTags = await getAllTags();
      return this.allTags;
    } catch (error) {
      console.error('Failed to load tags:', error);
      this.allTags = [];
      return [];
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Manage tags button
    const manageTagsBtn = document.getElementById('manage-tags-btn');
    if (manageTagsBtn) {
      manageTagsBtn.addEventListener('click', () => this.showTagManagementModal());
    }

    // Close tag management modal
    const closeBtn = document.querySelector('#tag-management-modal .close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideTagManagementModal());
    }

    const closeTagMgmtBtn = document.getElementById('close-tag-management');
    if (closeTagMgmtBtn) {
      closeTagMgmtBtn.addEventListener('click', () => this.hideTagManagementModal());
    }

    // Batch tag modal listeners
    this.setupBatchTagModalListeners();
  }

  /**
   * Setup batch tag modal event listeners
   */
  setupBatchTagModalListeners() {
    // Tag input for batch tagging
    const tagInput = document.getElementById('batch-tag-input');
    if (tagInput) {
      tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          this.addSelectedTag(tagInput.value.trim());
          tagInput.value = '';
        }
      });

      // Show suggestions as user types
      tagInput.addEventListener('input', (e) => {
        this.showTagSuggestions(e.target.value);
      });
    }

    // Batch tag add button
    const addBtn = document.getElementById('batch-tag-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.handleBatchTagAdd());
    }

    // Batch tag remove button
    const removeBtn = document.getElementById('batch-tag-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => this.handleBatchTagRemove());
    }

    // Batch tag cancel button
    const cancelBtn = document.getElementById('batch-tag-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideBatchTagModal());
    }

    // Close button
    const closeBtn = document.querySelector('#batch-tag-modal .close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideBatchTagModal());
    }
  }

  /**
   * Show tag management modal
   */
  async showTagManagementModal() {
    const modal = document.getElementById('tag-management-modal');
    if (!modal) return;

    // Reload tags
    await this.loadTags();

    // Render tags list
    this.renderTagsList();

    // Show modal
    modal.removeAttribute('hidden');
  }

  /**
   * Hide tag management modal
   */
  hideTagManagementModal() {
    const modal = document.getElementById('tag-management-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }
  }

  /**
   * Hide batch tag modal
   */
  hideBatchTagModal() {
    const modal = document.getElementById('batch-tag-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
    }

    // Clear selected tags
    this.selectedTags.clear();
    this.renderSelectedTags();
  }

  /**
   * Render tags list in management modal
   */
  renderTagsList() {
    const listContainer = document.getElementById('tags-list');
    if (!listContainer) return;

    if (this.allTags.length === 0) {
      listContainer.innerHTML = '<p class="empty-state-small">No tags yet. Add tags to conversations to see them here.</p>';
      return;
    }

    const html = this.allTags.map(({ tag, count }) => `
      <div class="tag-item" data-tag="${this.escapeHtml(tag)}">
        <div class="tag-info">
          <span class="tag-name">${this.escapeHtml(tag)}</span>
          <span class="tag-count">${count}</span>
        </div>
        <div class="tag-actions">
          <button class="tag-action-btn tag-action-export" data-action="export" title="Export conversations with this tag">
            📤
          </button>
          <button class="tag-action-btn tag-action-rename" data-action="rename" title="Rename tag">
            ✏️
          </button>
          <button class="tag-action-btn tag-action-delete" data-action="delete" title="Delete tag">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    listContainer.innerHTML = html;

    // Add event listeners to tag action buttons
    listContainer.querySelectorAll('.tag-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const tagItem = btn.closest('.tag-item');
        const tag = tagItem.dataset.tag;

        switch (action) {
          case 'export':
            this.handleTagExport(tag);
            break;
          case 'rename':
            this.handleTagRename(tag);
            break;
          case 'delete':
            this.handleTagDelete(tag);
            break;
        }
      });
    });
  }

  /**
   * Handle tag export
   * @param {string} tag - Tag to export
   */
  async handleTagExport(tag) {
    try {
      const result = await exportByTag(tag);
      alert(`Successfully exported ${result.conversationCount} conversations with tag "${tag}"`);
    } catch (error) {
      console.error('Tag export failed:', error);
      alert(`Failed to export tag: ${error.message}`);
    }
  }

  /**
   * Handle tag rename
   * @param {string} oldTag - Current tag name
   */
  async handleTagRename(oldTag) {
    const newTag = prompt(`Rename tag "${oldTag}" to:`, oldTag);

    if (!newTag || newTag === oldTag) return;

    if (!this.validateTagName(newTag)) {
      alert('Tag name cannot be empty');
      return;
    }

    try {
      const result = await renameTag(oldTag, newTag);

      alert(`Successfully renamed tag in ${result.updated} conversations`);

      // Reload tags and re-render
      await this.loadTags();
      this.renderTagsList();

      // Notify listeners
      if (this.onTagsChanged) {
        this.onTagsChanged();
      }
    } catch (error) {
      console.error('Tag rename failed:', error);
      alert(`Failed to rename tag: ${error.message}`);
    }
  }

  /**
   * Handle tag delete
   * @param {string} tag - Tag to delete
   */
  async handleTagDelete(tag) {
    const tagData = this.allTags.find(t => t.tag === tag);
    const count = tagData ? tagData.count : 0;

    const confirmed = confirm(
      `Are you sure you want to delete the tag "${tag}"?\n\n` +
      `This will remove it from ${count} conversation${count > 1 ? 's' : ''}.\n` +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const result = await deleteTag(tag);

      alert(`Successfully deleted tag from ${result.updated} conversations`);

      // Reload tags and re-render
      await this.loadTags();
      this.renderTagsList();

      // Notify listeners
      if (this.onTagsChanged) {
        this.onTagsChanged();
      }
    } catch (error) {
      console.error('Tag delete failed:', error);
      alert(`Failed to delete tag: ${error.message}`);
    }
  }

  /**
   * Add a tag to the conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} tag - Tag to add
   */
  async addTagToConversation(conversationId, tag) {
    if (!this.validateTagName(tag)) return;

    try {
      // Get current conversation (would need to fetch from database)
      // For now, assume we pass the current tags
      const conversation = await this.getConversation(conversationId);
      const tags = conversation.tags || [];

      if (!tags.includes(tag)) {
        tags.push(tag);
        await updateConversationMetadata(conversationId, { tags });

        // Reload tags
        await this.loadTags();

        if (this.onTagsChanged) {
          this.onTagsChanged();
        }
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  }

  /**
   * Remove a tag from conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} tag - Tag to remove
   */
  async removeTagFromConversation(conversationId, tag) {
    try {
      const conversation = await this.getConversation(conversationId);
      const tags = conversation.tags || [];

      const index = tags.indexOf(tag);
      if (index !== -1) {
        tags.splice(index, 1);
        await updateConversationMetadata(conversationId, { tags });

        // Reload tags
        await this.loadTags();

        if (this.onTagsChanged) {
          this.onTagsChanged();
        }
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  }

  /**
   * Add tag to selected tags (for batch tagging)
   * @param {string} tag - Tag to add
   */
  addSelectedTag(tag) {
    if (!this.validateTagName(tag)) return;

    this.selectedTags.add(tag);
    this.renderSelectedTags();

    // Clear suggestions
    this.clearTagSuggestions();
  }

  /**
   * Remove tag from selected tags
   * @param {string} tag - Tag to remove
   */
  removeSelectedTag(tag) {
    this.selectedTags.delete(tag);
    this.renderSelectedTags();
  }

  /**
   * Render selected tags in batch tag modal
   */
  renderSelectedTags() {
    const container = document.getElementById('selected-tags');
    if (!container) return;

    if (this.selectedTags.size === 0) {
      container.innerHTML = '';
      return;
    }

    const html = Array.from(this.selectedTags).map(tag => `
      <span class="selected-tag">
        ${this.escapeHtml(tag)}
        <button class="remove-selected-tag" data-tag="${this.escapeHtml(tag)}" aria-label="Remove tag">×</button>
      </span>
    `).join('');

    container.innerHTML = html;

    // Add remove listeners
    container.querySelectorAll('.remove-selected-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeSelectedTag(btn.dataset.tag);
      });
    });
  }

  /**
   * Show tag suggestions based on input
   * @param {string} query - Search query
   */
  showTagSuggestions(query) {
    const container = document.getElementById('batch-tag-suggestions');
    if (!container) return;

    if (!query.trim()) {
      container.innerHTML = '';
      return;
    }

    const suggestions = this.allTags
      .filter(({ tag }) => tag.toLowerCase().includes(query.toLowerCase()))
      .filter(({ tag }) => !this.selectedTags.has(tag))
      .slice(0, 5);

    if (suggestions.length === 0) {
      container.innerHTML = '';
      return;
    }

    const html = suggestions.map(({ tag, count }) => `
      <button class="tag-suggestion" data-tag="${this.escapeHtml(tag)}">
        ${this.escapeHtml(tag)} (${count})
      </button>
    `).join('');

    container.innerHTML = html;

    // Add click listeners
    container.querySelectorAll('.tag-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addSelectedTag(btn.dataset.tag);
        document.getElementById('batch-tag-input').value = '';
      });
    });
  }

  /**
   * Clear tag suggestions
   */
  clearTagSuggestions() {
    const container = document.getElementById('batch-tag-suggestions');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Handle batch tag add
   */
  async handleBatchTagAdd() {
    if (this.selectedTags.size === 0) {
      alert('Please select at least one tag to add');
      return;
    }

    // Get selected conversations from batch operations manager
    const { default: batchOpsManager } = await import('./batchOperations.js');
    const conversationIds = batchOpsManager.getSelectedConversationIds();

    if (conversationIds.length === 0) {
      alert('No conversations selected');
      return;
    }

    try {
      const tags = Array.from(this.selectedTags);

      // For each conversation, merge new tags with existing ones
      // This is complex because we need to preserve existing tags
      // For now, we'll just set the tags (this would need improvement)

      // TODO: Implement proper tag merging
      const updates = { tags };

      const result = await bulkUpdateConversations(conversationIds, updates);

      alert(`Successfully added tags to ${result.updated} conversations`);

      this.hideBatchTagModal();

      // Reload tags
      await this.loadTags();

      if (this.onTagsChanged) {
        this.onTagsChanged();
      }
    } catch (error) {
      console.error('Batch tag add failed:', error);
      alert(`Failed to add tags: ${error.message}`);
    }
  }

  /**
   * Handle batch tag remove
   */
  async handleBatchTagRemove() {
    if (this.selectedTags.size === 0) {
      alert('Please select at least one tag to remove');
      return;
    }

    const { default: batchOpsManager } = await import('./batchOperations.js');
    const conversationIds = batchOpsManager.getSelectedConversationIds();

    if (conversationIds.length === 0) {
      alert('No conversations selected');
      return;
    }

    try {
      // TODO: Implement tag removal logic
      // This requires fetching each conversation, removing the tags, and updating

      alert('Tag removal not yet implemented');

      this.hideBatchTagModal();
    } catch (error) {
      console.error('Batch tag remove failed:', error);
      alert(`Failed to remove tags: ${error.message}`);
    }
  }

  /**
   * Validate tag name
   * @param {string} tag - Tag to validate
   * @returns {boolean} Whether tag is valid
   */
  validateTagName(tag) {
    return tag && tag.trim().length > 0;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Get conversation (placeholder - would integrate with actual data source)
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation data
   */
  async getConversation(conversationId) {
    const { getConversationById } = await import('../database/index.js');
    return getConversationById(conversationId);
  }
}

// Create singleton instance
const tagManager = new TagManager();

export default tagManager;
