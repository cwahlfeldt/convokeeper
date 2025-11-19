/**
 * Storage Quota Utilities Module
 *
 * Provides utilities for monitoring browser storage quota and usage.
 * Helps prevent data loss by warning users when storage is running low.
 */

/**
 * Get current storage usage and quota information
 * @returns {Promise<Object>} Storage information
 */
export async function getStorageInfo() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return {
      supported: false,
      usage: 0,
      quota: 0,
      percentUsed: 0,
      available: 0
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
    const available = quota - usage;

    return {
      supported: true,
      usage: usage,
      quota: quota,
      percentUsed: percentUsed,
      available: available,
      usageMB: (usage / (1024 * 1024)).toFixed(2),
      quotaMB: (quota / (1024 * 1024)).toFixed(2),
      availableMB: (available / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      supported: false,
      error: error.message
    };
  }
}

/**
 * Check if storage is running low (over threshold percentage)
 * @param {number} threshold - Percentage threshold (default: 80)
 * @returns {Promise<Object>} Warning status and info
 */
export async function checkStorageWarning(threshold = 80) {
  const info = await getStorageInfo();

  if (!info.supported) {
    return {
      shouldWarn: false,
      message: 'Storage monitoring not supported'
    };
  }

  const shouldWarn = info.percentUsed >= threshold;

  return {
    shouldWarn: shouldWarn,
    percentUsed: info.percentUsed,
    usage: info.usage,
    quota: info.quota,
    available: info.available,
    message: shouldWarn
      ? `Storage is ${info.percentUsed.toFixed(1)}% full. Consider exporting your data as a backup.`
      : 'Storage usage is within safe limits'
  };
}

/**
 * Check if storage is persistent
 * @returns {Promise<boolean>} Whether storage is persistent
 */
export async function isStoragePersistent() {
  if (!navigator.storage || !navigator.storage.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error('Error checking storage persistence:', error);
    return false;
  }
}

/**
 * Get comprehensive storage status
 * @returns {Promise<Object>} Complete storage status
 */
export async function getStorageStatus() {
  const [info, isPersistent] = await Promise.all([
    getStorageInfo(),
    isStoragePersistent()
  ]);

  return {
    ...info,
    isPersistent: isPersistent,
    recommendation: getStorageRecommendation(info, isPersistent)
  };
}

/**
 * Get storage recommendation based on current status
 * @private
 * @param {Object} info - Storage info
 * @param {boolean} isPersistent - Whether storage is persistent
 * @returns {string} Recommendation message
 */
function getStorageRecommendation(info, isPersistent) {
  if (!info.supported) {
    return 'Storage monitoring not available. Export your data regularly to prevent loss.';
  }

  const recommendations = [];

  // Check persistence
  if (!isPersistent) {
    recommendations.push('Enable persistent storage to prevent data loss');
  }

  // Check usage levels
  if (info.percentUsed >= 90) {
    recommendations.push('CRITICAL: Storage almost full. Export and remove old conversations immediately');
  } else if (info.percentUsed >= 80) {
    recommendations.push('WARNING: Storage running low. Export your data and consider removing old conversations');
  } else if (info.percentUsed >= 60) {
    recommendations.push('Consider exporting your data as a precautionary backup');
  }

  if (recommendations.length === 0) {
    return 'Storage is healthy. Regular backups are still recommended.';
  }

  return recommendations.join('. ');
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
