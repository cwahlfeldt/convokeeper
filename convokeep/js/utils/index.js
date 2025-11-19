/**
 * Utilities Module Entry Point
 * 
 * This module exports all utility functions organized by category.
 */

// Import all utilities
import { urlParams } from './urlUtils.js';
import { formatters } from './formatUtils.js';
import { text } from './textUtils.js';
import { ui } from './uiUtils.js';
import { debounce } from './performanceUtils.js';
import { createMarkdownRenderer } from './markdownUtils.js';
import { copyToClipboard } from './clipboardUtils.js';
import { generateUniqueId } from './idUtils.js';
import { scrollIntoView, isElementInViewport } from './scrollUtils.js';
import { resetDatabase } from './databaseUtils.js';
import { exportAllConversations, exportConversation, getExportStats } from './exportUtils.js';
import { importBackup, isConvoKeepBackup, readBackupFile } from './importUtils.js';
import { getStorageInfo, checkStorageWarning, getStorageStatus, formatBytes } from './storageQuotaUtils.js';

// Export all utilities
export {
  urlParams,
  formatters,
  text,
  ui,
  debounce,
  createMarkdownRenderer,
  copyToClipboard,
  generateUniqueId,
  scrollIntoView,
  isElementInViewport,
  resetDatabase,
  exportAllConversations,
  exportConversation,
  getExportStats,
  importBackup,
  isConvoKeepBackup,
  readBackupFile,
  getStorageInfo,
  checkStorageWarning,
  getStorageStatus,
  formatBytes
};
