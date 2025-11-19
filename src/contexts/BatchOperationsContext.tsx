/**
 * Batch Operations Context
 *
 * Manages batch selection and operations on multiple conversations
 * Replaces the old batchOperations.js with reactive state management
 */

import { createContext, useContext, createSignal, JSX, Accessor } from 'solid-js';
import {
  bulkDeleteConversations,
  bulkUpdateConversations
} from '../database/index.js';

interface BatchOperationsContextValue {
  selectedIds: Accessor<string[]>;
  selectionCount: Accessor<number>;
  isProcessing: Accessor<boolean>;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  deleteSelected: (onComplete?: () => void) => Promise<void>;
  starSelected: (onComplete?: () => void) => Promise<void>;
  unstarSelected: (onComplete?: () => void) => Promise<void>;
  archiveSelected: (onComplete?: () => void) => Promise<void>;
  unarchiveSelected: (onComplete?: () => void) => Promise<void>;
  tagSelected: (tags: string[], onComplete?: () => void) => Promise<void>;
}

const BatchOperationsContext = createContext<BatchOperationsContextValue>();

export function BatchOperationsProvider(props: { children: JSX.Element }) {
  const [selectedSet, setSelectedSet] = createSignal<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = createSignal(false);

  // Get selected IDs as array
  const selectedIds = () => Array.from(selectedSet());

  // Get selection count
  const selectionCount = () => selectedSet().size;

  // Check if ID is selected
  const isSelected = (id: string) => selectedSet().has(id);

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedSet());
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSet(newSet);
  };

  // Select all
  const selectAll = (ids: string[]) => {
    setSelectedSet(new Set(ids));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedSet(new Set());
  };

  // Delete selected conversations
  const deleteSelected = async (onComplete?: () => void) => {
    if (selectedSet().size === 0) return;

    const count = selectedSet().size;
    const confirmed = confirm(
      `Delete ${count} conversation${count > 1 ? 's' : ''}? This cannot be undone.`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await bulkDeleteConversations(Array.from(selectedSet()));
      deselectAll();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Batch delete failed:', error);
      alert('Failed to delete conversations. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Star selected conversations
  const starSelected = async (onComplete?: () => void) => {
    if (selectedSet().size === 0) return;

    setIsProcessing(true);
    try {
      await bulkUpdateConversations(Array.from(selectedSet()), { starred: true });
      deselectAll();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Batch star failed:', error);
      alert('Failed to star conversations. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Unstar selected conversations
  const unstarSelected = async (onComplete?: () => void) => {
    if (selectedSet().size === 0) return;

    setIsProcessing(true);
    try {
      await bulkUpdateConversations(Array.from(selectedSet()), { starred: false });
      deselectAll();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Batch unstar failed:', error);
      alert('Failed to unstar conversations. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Archive selected conversations
  const archiveSelected = async (onComplete?: () => void) => {
    if (selectedSet().size === 0) return;

    setIsProcessing(true);
    try {
      await bulkUpdateConversations(Array.from(selectedSet()), { archived: true });
      deselectAll();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Batch archive failed:', error);
      alert('Failed to archive conversations. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Unarchive selected conversations
  const unarchiveSelected = async (onComplete?: () => void) => {
    if (selectedSet().size === 0) return;

    setIsProcessing(true);
    try {
      await bulkUpdateConversations(Array.from(selectedSet()), { archived: false });
      deselectAll();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Batch unarchive failed:', error);
      alert('Failed to unarchive conversations. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tag selected conversations
  const tagSelected = async (tags: string[], onComplete?: () => void) => {
    if (selectedSet().size === 0) return;

    setIsProcessing(true);
    try {
      await bulkUpdateConversations(Array.from(selectedSet()), { tags });
      deselectAll();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Batch tag failed:', error);
      alert('Failed to tag conversations. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const value: BatchOperationsContextValue = {
    selectedIds,
    selectionCount,
    isProcessing,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    starSelected,
    unstarSelected,
    archiveSelected,
    unarchiveSelected,
    tagSelected
  };

  return (
    <BatchOperationsContext.Provider value={value}>
      {props.children}
    </BatchOperationsContext.Provider>
  );
}

export function useBatchOperations() {
  const context = useContext(BatchOperationsContext);
  if (!context) {
    throw new Error('useBatchOperations must be used within BatchOperationsProvider');
  }
  return context;
}
