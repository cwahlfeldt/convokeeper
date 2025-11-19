/**
 * Upload Modal Component
 *
 * Handles file uploads for conversation exports
 */

import { Show, createSignal } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';
import { processFile } from '../fileProcessor/index.js';
import { storeConversations } from '../database/index.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal(props: UploadModalProps) {
  const { reload } = useConversations();
  const [uploading, setUploading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [status, setStatus] = createSignal('');
  const [error, setError] = createSignal('');
  const [dragActive, setDragActive] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;

  const handleClose = () => {
    if (!uploading()) {
      props.onClose();
      // Reset state
      setProgress(0);
      setStatus('');
      setError('');
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFileUpload(file);
  };

  const processFileUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setProgress(0);
    setStatus('Reading file...');

    try {
      console.log('[Upload] Starting file processing:', file.name);

      // Process the file
      const conversations = await processFile(file);
      console.log('[Upload] Processed conversations:', conversations?.length || 0);

      if (!conversations || conversations.length === 0) {
        throw new Error('No conversations found in file');
      }

      setStatus(`Found ${conversations.length} conversation${conversations.length > 1 ? 's' : ''}. Storing...`);
      setProgress(50);

      // Store conversations
      console.log('[Upload] Storing conversations to database...');
      const result = await storeConversations(conversations, (percent: number) => {
        setProgress(50 + (percent / 2)); // Map 0-100 to 50-100
      });

      console.log('[Upload] Store result:', result);

      setProgress(100);
      setStatus(`Successfully imported ${result.totalStored} conversations!`);

      // Reload conversations and wait for it to complete
      console.log('[Upload] Reloading conversations list...');
      await reload();
      console.log('[Upload] Reload complete');

      // Wait a bit for UI to update, then close
      setTimeout(() => {
        console.log('[Upload] Closing modal');
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('[Upload] Error:', err);
      setError(err.message || 'Failed to process file');
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClickUpload = () => {
    fileInputRef?.click();
  };

  return (
    <div
      class="upload-modal"
      style={{ display: props.isOpen ? 'block' : 'none' }}
      onClick={handleClose}
      role="dialog"
      aria-labelledby="upload-modal-title"
      aria-modal="true"
    >
      <div class="upload-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          class="close-modal"
          onClick={handleClose}
          disabled={uploading()}
          aria-label="Close upload modal"
        >
          ×
        </button>

        <div class="upload-section">
          <h2 id="upload-modal-title">Upload Conversations</h2>

          <Show
            when={!uploading()}
            fallback={
              <div class="upload-progress">
                <div id="progress-container" class="progress-container">
                  <div
                    id="progress-bar"
                    class="progress-bar"
                    style={{ width: `${progress()}%` }}
                  />
                </div>
                <div id="upload-status" class="upload-status">{status()}</div>
              </div>
            }
          >
            <div
              id="drop-area"
              class="drop-area"
              classList={{ active: dragActive() }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleClickUpload}
              role="region"
              aria-description="File upload area"
            >
              <p>Drag and drop your .zip or .json file here</p>
              <p>or</p>
              <input
                ref={fileInputRef}
                type="file"
                id="file-input"
                accept=".zip,.json,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
                aria-label="Choose file to upload"
              />
              <label htmlFor="file-input" class="file-input-label">Choose File</label>
            </div>
          </Show>

          <Show when={error()}>
            <div class="upload-status error-message">
              <strong>Error:</strong> {error()}
            </div>
          </Show>

          <Show when={status() && !uploading()}>
            <div class="upload-status success-message">{status()}</div>
          </Show>
        </div>
      </div>
    </div>
  );
}
