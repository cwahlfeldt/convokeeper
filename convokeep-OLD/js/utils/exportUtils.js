/**
 * Export Utilities Module
 *
 * Handles exporting ConvoKeep data in native unified schema format.
 * Exported data can be re-imported without transformation.
 */

import { getConversations } from '../database/index.js';

/**
 * Export all conversations to a JSON file
 * @param {Object} options - Export options
 * @param {boolean} options.pretty - Whether to pretty-print JSON (default: true)
 * @returns {Promise<Object>} Export statistics
 */
export async function exportAllConversations(options = {}) {
  const { pretty = true } = options;

  try {
    // Get all conversations from database
    const conversations = await getConversations({
      limit: -1,  // Get all conversations
      sortBy: 'created_at',
      order: 'asc'
    });

    if (!conversations || conversations.length === 0) {
      throw new Error('No conversations to export');
    }

    // Create export envelope with metadata
    const exportData = {
      version: '1.0',
      source: 'convokeep',
      exported_at: new Date().toISOString(),
      conversation_count: conversations.length,
      schema_version: 2,  // Matches DB_CONFIG.version
      conversations: conversations
    };

    // Convert to JSON
    const jsonString = pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `convokeep-backup-${timestamp}.json`;

    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      conversationCount: conversations.length,
      filename: filename,
      sizeBytes: blob.size
    };
  } catch (error) {
    console.error('Error exporting conversations:', error);
    throw error;
  }
}

/**
 * Export a specific conversation to a JSON file
 * @param {string} conversationId - The conversation ID to export
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export statistics
 */
export async function exportConversation(conversationId, options = {}) {
  const { pretty = true } = options;

  try {
    // Get specific conversation
    const { getConversationById } = await import('../database/index.js');
    const conversation = await getConversationById(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Create export envelope
    const exportData = {
      version: '1.0',
      source: 'convokeep',
      exported_at: new Date().toISOString(),
      conversation_count: 1,
      schema_version: 2,
      conversations: [conversation]
    };

    // Convert to JSON
    const jsonString = pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Generate filename from conversation title
    const safeTitle = conversation.title
      .replace(/[^a-z0-9]/gi, '-')
      .substring(0, 50);
    const filename = `convokeep-${safeTitle}.json`;

    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      conversationCount: 1,
      filename: filename,
      sizeBytes: blob.size
    };
  } catch (error) {
    console.error('Error exporting conversation:', error);
    throw error;
  }
}

/**
 * Get export statistics without actually exporting
 * @returns {Promise<Object>} Export statistics
 */
export async function getExportStats() {
  try {
    const conversations = await getConversations({ limit: -1 });

    // Calculate approximate size
    const dataStr = JSON.stringify({ conversations });
    const sizeBytes = new Blob([dataStr]).size;

    return {
      conversationCount: conversations.length,
      estimatedSizeBytes: sizeBytes,
      estimatedSizeMB: (sizeBytes / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('Error getting export stats:', error);
    return {
      conversationCount: 0,
      estimatedSizeBytes: 0,
      estimatedSizeMB: '0.00'
    };
  }
}

/**
 * Export selected conversations by IDs
 * @param {string[]} conversationIds - Array of conversation IDs
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export statistics
 */
export async function exportSelected(conversationIds, options = {}) {
  const { pretty = true } = options;

  try {
    if (!conversationIds || conversationIds.length === 0) {
      throw new Error('No conversations selected for export');
    }

    // Get conversations by ID
    const { getConversationById } = await import('../database/index.js');
    const conversations = [];

    for (const id of conversationIds) {
      const conv = await getConversationById(id);
      if (conv) {
        conversations.push(conv);
      }
    }

    if (conversations.length === 0) {
      throw new Error('No conversations found for export');
    }

    // Create export envelope with selection metadata
    const exportData = {
      version: '1.0',
      source: 'convokeep',
      exported_at: new Date().toISOString(),
      conversation_count: conversations.length,
      schema_version: 3,
      export_context: {
        type: 'selected',
        selection_ids: conversationIds
      },
      conversations: conversations
    };

    // Convert to JSON
    const jsonString = pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `convokeep-selected-${conversations.length}-${timestamp}.json`;

    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      conversationCount: conversations.length,
      filename: filename,
      sizeBytes: blob.size
    };
  } catch (error) {
    console.error('Error exporting selected conversations:', error);
    throw error;
  }
}

/**
 * Export all conversations with a specific tag
 * @param {string} tag - Tag name to filter by
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export statistics
 */
export async function exportByTag(tag, options = {}) {
  const { pretty = true } = options;

  try {
    if (!tag) {
      throw new Error('Tag name is required');
    }

    // Get conversations with this tag
    const { getConversationsByTags } = await import('../database/index.js');
    const conversationsList = await getConversationsByTags([tag], false);

    if (!conversationsList || conversationsList.length === 0) {
      throw new Error(`No conversations found with tag "${tag}"`);
    }

    // Fetch full conversation data
    const { getConversationById } = await import('../database/index.js');
    const conversations = [];

    for (const item of conversationsList) {
      const conv = await getConversationById(item.conversation_id);
      if (conv) {
        conversations.push(conv);
      }
    }

    // Create export envelope with tag metadata
    const exportData = {
      version: '1.0',
      source: 'convokeep',
      exported_at: new Date().toISOString(),
      conversation_count: conversations.length,
      schema_version: 3,
      export_context: {
        type: 'tag',
        tag: tag
      },
      conversations: conversations
    };

    // Convert to JSON
    const jsonString = pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Generate filename with tag name
    const safeTag = tag.replace(/[^a-z0-9]/gi, '-').substring(0, 30);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `convokeep-tag-${safeTag}-${timestamp}.json`;

    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      conversationCount: conversations.length,
      filename: filename,
      sizeBytes: blob.size
    };
  } catch (error) {
    console.error('Error exporting by tag:', error);
    throw error;
  }
}

/**
 * Export all starred conversations
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export statistics
 */
export async function exportStarred(options = {}) {
  const { pretty = true } = options;

  try {
    // Get all conversations and filter for starred ones
    const allConversations = await getConversations({ limit: -1 });
    const conversations = allConversations.filter(conv => conv.starred);

    if (conversations.length === 0) {
      throw new Error('No starred conversations found');
    }

    // Fetch full conversation data
    const { getConversationById } = await import('../database/index.js');
    const fullConversations = [];

    for (const item of conversations) {
      const conv = await getConversationById(item.conversation_id);
      if (conv) {
        fullConversations.push(conv);
      }
    }

    // Create export envelope with starred metadata
    const exportData = {
      version: '1.0',
      source: 'convokeep',
      exported_at: new Date().toISOString(),
      conversation_count: fullConversations.length,
      schema_version: 3,
      export_context: {
        type: 'starred'
      },
      conversations: fullConversations
    };

    // Convert to JSON
    const jsonString = pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `convokeep-starred-${fullConversations.length}-${timestamp}.json`;

    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      conversationCount: fullConversations.length,
      filename: filename,
      sizeBytes: blob.size
    };
  } catch (error) {
    console.error('Error exporting starred conversations:', error);
    throw error;
  }
}
