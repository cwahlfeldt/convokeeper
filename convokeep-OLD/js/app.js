/**
 * ConvoKeep - Main Application
 * 
 * A simplified implementation that consolidates application initialization,
 * file upload handling, and database operations.
 */

import { initDb, storeConversations, hasConversations, requestPersistentStorage } from './database/index.js';
import { processFile } from './fileProcessor/index.js';
import { ui, resetDatabase, exportAllConversations, importBackup, readBackupFile } from './utils/index.js';
import { initLicenseUI, showLicenseInfo, withFeature } from './license/index.js';

/**
 * Initialize the application
 */
async function init() {
  try {
    // Initialize database
    await initDb();

    // Initialize license system
    initLicenseUI();

    // Set up UI event handlers
    setupUploadHandlers();
    setupExportImportHandlers();
    setupModalHandlers();
    setupResetDbButton();
    setupLicenseButtons();

    // Check if Web Workers are supported
    updateWorkerStatusDisplay();

  } catch (error) {
    console.error('Failed to initialize application:', error);
    ui.showError('Failed to initialize application. Please check console for details.');
  }
}

/**
 * Set up file upload event handlers
 */
function setupUploadHandlers() {
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');

  if (!dropArea || !fileInput) return;

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when dragging over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.add('active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.remove('active');
    });
  });

  // Handle dropped files
  dropArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Handle file selection via input
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      // Update the file label to show selected file name
      const fileLabel = document.querySelector('.file-input-label');
      if (fileLabel) {
        const fileName = files[0].name;
        const shortenedName = fileName.length > 20 ?
          fileName.substring(0, 15) + '...' + fileName.substring(fileName.lastIndexOf('.')) :
          fileName;
        fileLabel.textContent = shortenedName;
      }

      // Handle the file
      handleFile(files[0]);
    }
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/**
 * Set up export and import button handlers
 */
function setupExportImportHandlers() {
  // Desktop export button
  const exportButton = document.getElementById('export-button');
  if (exportButton) {
    exportButton.addEventListener('click', handleExport);
  }

  // Mobile export button
  const mobileExportButton = document.getElementById('mobile-export-button');
  if (mobileExportButton) {
    mobileExportButton.addEventListener('click', handleExport);
  }

  // Desktop import button
  const importButton = document.getElementById('import-button');
  if (importButton) {
    importButton.addEventListener('click', () => {
      // Trigger the hidden file input
      const importFileInput = document.getElementById('import-file-input');
      if (importFileInput) {
        importFileInput.click();
      }
    });
  }

  // Mobile import button
  const mobileImportButton = document.getElementById('mobile-import-button');
  if (mobileImportButton) {
    mobileImportButton.addEventListener('click', () => {
      // Trigger the hidden file input
      const importFileInput = document.getElementById('import-file-input');
      if (importFileInput) {
        importFileInput.click();
      }
    });
  }

  // Import file input handler
  const importFileInput = document.getElementById('import-file-input');
  if (importFileInput) {
    importFileInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        await handleImportBackup(files[0]);
        // Reset the input so the same file can be selected again
        e.target.value = '';
      }
    });
  }
}

/**
 * Handle export button click
 */
async function handleExport() {
  // Feature is gated by license system via data-feature attribute
  // withFeature will handle showing upgrade prompt if needed
  withFeature('export_conversations', async () => {
    try {
      ui.showProcessingStatus('Preparing export...');

      const result = await exportAllConversations();

      ui.showSuccess(
        `Successfully exported ${result.conversationCount} conversations to ${result.filename}`
      );
    } catch (error) {
      console.error('Error exporting conversations:', error);
      ui.showError(`Export failed: ${error.message}`);
    }
  });
}

/**
 * Handle import backup file
 * @param {File} file - The backup file to import
 */
async function handleImportBackup(file) {
  // Feature is gated by license system
  withFeature('export_conversations', async () => {
    try {
      // Validate file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension !== 'json') {
        throw new Error('Invalid file type. Please select a ConvoKeep backup file (.json).');
      }

      // Request persistent storage IMMEDIATELY while still in user gesture context
      // This must happen before any async operations to keep permission prompt visible
      await requestPersistentStorage();

      ui.showProcessingStatus('Reading backup file...');
      ui.updateProgressBar(0);

      // Read and validate the backup
      const backupData = await readBackupFile(file);

      // Check if it's a ConvoKeep backup
      const { isConvoKeepBackup } = await import('./utils/index.js');
      if (!isConvoKeepBackup(backupData)) {
        throw new Error('Invalid backup file. This does not appear to be a ConvoKeep backup.');
      }

      ui.showProcessingStatus(`Importing ${backupData.conversation_count} conversations...`);
      ui.updateProgressBar(25);

      // Import the conversations
      const conversations = await importBackup(file);

      ui.updateProgressBar(50);

      // Store in database
      ui.showProcessingStatus('Storing conversations in database...');
      const result = await storeConversations(conversations, updateProgress);

      // Show success message
      const newCount = result.newConversations || 0;
      const updatedCount = result.updatedConversations || 0;

      if (updatedCount > 0) {
        ui.showSuccess(
          `Successfully imported ${conversations.length} conversations! (${newCount} new, ${updatedCount} updated)`
        );
      } else {
        ui.showSuccess(`Successfully imported ${conversations.length} conversations!`);
      }

      // Reload page after a delay to show the new data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error importing backup:', error);
      ui.showError(`Import failed: ${error.message}`);
    }
  });
}

/**
 * Set up modal dialog event handlers
 */
function setupModalHandlers() {
  const modal = document.getElementById('upload-modal');
  const closeModalBtn = document.querySelector('.close-modal');

  if (!modal) return;

  // Note: Modal opening is now handled by uiController.js to avoid duplicate event listeners
  // This function only handles modal closing

  // Close modal with X button
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.setAttribute('hidden', '');
      modal.style.display = 'none';
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.setAttribute('hidden', '');
      modal.style.display = 'none';
    }
  });
}

/**
 * Set up database reset button
 */
function setupResetDbButton() {
  // Only handle the modal reset button here
  const resetDbBtn = document.getElementById('reset-db-btn');

  if (resetDbBtn) {
    // Remove any existing listeners by cloning
    const newBtn = resetDbBtn.cloneNode(true);
    resetDbBtn.parentNode.replaceChild(newBtn, resetDbBtn);

    // Add listener to the new button
    newBtn.addEventListener('click', handleResetDatabase);
  }
}

/**
 * Set up license button handlers
 */
function setupLicenseButtons() {
  // Desktop license button
  const licenseMenuBtn = document.getElementById('license-menu-button');
  if (licenseMenuBtn) {
    licenseMenuBtn.addEventListener('click', () => {
      showLicenseInfo();
    });
  }

  // Mobile license button
  const mobileLicenseBtn = document.getElementById('mobile-license-button');
  if (mobileLicenseBtn) {
    mobileLicenseBtn.addEventListener('click', () => {
      showLicenseInfo();
    });
  }
}

/**
 * Update the worker status display
 */
function updateWorkerStatusDisplay() {
  const workerStatus = document.getElementById('worker-status');

  if (workerStatus) {
    if (window.Worker) {
      workerStatus.innerHTML = '<span class="text-green">✓</span> Web Worker support available (will be used for large files)';
    } else {
      workerStatus.innerHTML = '<span class="text-yellow">⚠</span> Web Worker support not available (using main thread only)';
    }
  }
}

/**
 * Handle a selected or dropped file
 * @param {File} file - The file to process
 */
async function handleFile(file) {
  try {
    // Check file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['zip', 'dms'].includes(fileExtension)) {
      throw new Error('Invalid file type. Please upload a .zip or .dms file.');
    }

    // Request persistent storage IMMEDIATELY while still in user gesture context
    // This must happen before any async operations to keep permission prompt visible
    await requestPersistentStorage();

    // Update UI
    ui.showProcessingStatus('Processing file...');
    ui.updateProgressBar(0);

    // Process the file
    const conversations = await processFile(file, updateProgress);

    if (!conversations || conversations.length === 0) {
      throw new Error('No valid conversations found in the file.');
    }

    // Store in database
    ui.showProcessingStatus(`Storing ${conversations.length} conversations in database (duplicates will be updated)...`);
    const result = await storeConversations(conversations, updateProgress);

    // Show success message with details about new vs. updated conversations
    const newCount = result.newConversations || 0;
    const updatedCount = result.updatedConversations || 0;

    if (updatedCount > 0) {
      ui.showSuccess(`Successfully processed ${conversations.length} conversations! (${newCount} new, ${updatedCount} updated)`);
    } else {
      ui.showSuccess(`Successfully processed and stored ${conversations.length} conversations!`);
    }

    // Reload page after a delay to show the new data
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    console.error('Error processing file:', error);
    ui.showError(`Error: ${error.message}`);
  }
}

/**
 * Update progress display
 * @param {number} percent - Progress percentage (0-100)
 */
function updateProgress(percent) {
  ui.updateProgressBar(percent);
}

/**
 * Handle reset database button click
 */
async function handleResetDatabase() {
  // Disable the reset button before we start
  const resetBtn = document.getElementById('reset-db-btn');
  if (resetBtn) resetBtn.disabled = true;
  
  // Use the centralized reset function
  await resetDatabase({
    onError: () => {
      // Re-enable the button on error
      if (resetBtn) resetBtn.disabled = false;
    }
  });
}

// Export init function for the main entry point
// No longer auto-initialize as this is handled by the main index.js

// Export functions for use in other modules
export { init, setupResetDbButton };