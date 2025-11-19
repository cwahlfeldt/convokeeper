/**
 * Database Utilities
 *
 * Centralized utility functions for database operations
 */

import { clearDatabase } from '../database/index.js';
import { ui } from './uiUtils.js';

// Module-scoped flag to prevent multiple reset operations
let isResettingDatabase = false;

/**
 * Reset the database after confirmation
 * Centralizes the reset database functionality to avoid duplication
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onBeforeReset - Called before resetting (optional)
 * @param {Function} options.onAfterReset - Called after successful reset (optional)
 * @param {Function} options.onCancel - Called if user cancels the reset (optional)
 * @param {Function} options.onError - Called if an error occurs (optional)
 * @param {boolean} options.reloadAfterReset - Whether to reload the page after reset (default: true)
 * @param {number} options.reloadDelay - Delay in ms before reload (default: 1500)
 * @returns {Promise<boolean>} - Whether the reset was successful
 */
export async function resetDatabase(options = {}) {
  const {
    onBeforeReset = () => { },
    onAfterReset = () => { },
    onCancel = () => { },
    onError = () => { },
    reloadAfterReset = true,
    reloadDelay = 100,
  } = options;

  // Flag to prevent multiple confirmation dialogs
  if (isResettingDatabase) {
    return false;
  }

  try {
    // Show confirmation dialog
    const confirmResult = confirm('Are you sure you want to clear all stored data? This cannot be undone.');

    if (!confirmResult) {
      onCancel();
      return false;
    }

    // Set flag to prevent multiple dialogs
    isResettingDatabase = true;

    // Disable all reset buttons
    const resetButtons = document.querySelectorAll('#reset-db-btn, #menu-reset-db-btn, #mobile-reset-db-btn');
    resetButtons.forEach(btn => {
      if (btn) btn.disabled = true;
    });

    // Show processing status
    ui.showProcessingStatus('Clearing database...');

    // Call pre-reset callback
    await onBeforeReset();

    // Clear the database
    await clearDatabase();

    // Show success message
    ui.showSuccess('Database cleared successfully!');

    // Call post-reset callback
    await onAfterReset();

    // Clear cache data
    localStorage.removeItem('cachedSearchData');

    // Reload page after delay if requested
    if (reloadAfterReset) {
      setTimeout(() => window.location.reload(), reloadDelay);
    }

    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    ui.showError(`Error: ${error.message}`);

    // Call error callback
    onError(error);

    // Re-enable buttons
    const resetButtons = document.querySelectorAll('#reset-db-btn, #menu-reset-db-btn, #mobile-reset-db-btn');
    resetButtons.forEach(btn => {
      if (btn) btn.disabled = false;
    });

    return false;
  } finally {
    // Reset the flag
    isResettingDatabase = false;
  }
}