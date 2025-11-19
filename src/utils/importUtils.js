/**
 * Import Utilities Module
 *
 * Handles importing ConvoKeep backup files.
 * ConvoKeep backups contain conversations in native unified schema format
 * and can be imported directly without transformation.
 */

/**
 * Validate if a JSON object is a valid ConvoKeep backup
 * @param {Object} data - Parsed JSON data
 * @returns {Object} Validation result with isValid and errors
 */
export function validateConvoKeepBackup(data) {
  const errors = [];

  // Check required top-level fields
  if (!data.source || data.source !== 'convokeep') {
    errors.push('Missing or invalid "source" field (expected "convokeep")');
  }

  if (!data.version) {
    errors.push('Missing "version" field');
  }

  if (!data.conversations || !Array.isArray(data.conversations)) {
    errors.push('Missing or invalid "conversations" array');
  }

  if (data.conversation_count !== undefined &&
      data.conversations.length !== data.conversation_count) {
    errors.push(`Conversation count mismatch: expected ${data.conversation_count}, found ${data.conversations.length}`);
  }

  // Validate conversations structure
  if (data.conversations && Array.isArray(data.conversations)) {
    data.conversations.forEach((conv, index) => {
      // Check required fields for unified schema
      if (!conv.conversation_id) {
        errors.push(`Conversation ${index}: missing "conversation_id"`);
      }
      if (!conv.title) {
        errors.push(`Conversation ${index}: missing "title"`);
      }
      if (!conv.messages || !Array.isArray(conv.messages)) {
        errors.push(`Conversation ${index}: missing or invalid "messages" array`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    conversationCount: data.conversations ? data.conversations.length : 0,
    version: data.version,
    exportedAt: data.exported_at
  };
}

/**
 * Extract conversations from a ConvoKeep backup
 * @param {Object} backupData - Parsed backup JSON
 * @returns {Array} Array of conversations in unified schema
 */
export function extractConversations(backupData) {
  // Validate first
  const validation = validateConvoKeepBackup(backupData);

  if (!validation.isValid) {
    throw new Error(`Invalid ConvoKeep backup: ${validation.errors.join(', ')}`);
  }

  // Return conversations directly - they're already in unified schema
  return backupData.conversations;
}

/**
 * Check if a parsed JSON object is a ConvoKeep backup
 * @param {Object} data - Parsed JSON data
 * @returns {boolean} True if this is a ConvoKeep backup
 */
export function isConvoKeepBackup(data) {
  return data &&
         typeof data === 'object' &&
         data.source === 'convokeep' &&
         Array.isArray(data.conversations);
}

/**
 * Read and parse a ConvoKeep backup file
 * @param {File} file - The file to read
 * @returns {Promise<Object>} Parsed backup data
 */
export async function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Import a ConvoKeep backup file
 * @param {File} file - The backup file to import
 * @returns {Promise<Array>} Array of conversations
 */
export async function importBackup(file) {
  try {
    // Read and parse the file
    const backupData = await readBackupFile(file);

    // Validate and extract conversations
    const conversations = extractConversations(backupData);

    console.log(`Imported ${conversations.length} conversations from ConvoKeep backup`);

    return conversations;
  } catch (error) {
    console.error('Error importing backup:', error);
    throw error;
  }
}
