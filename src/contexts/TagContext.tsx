/**
 * Tag Context
 *
 * Manages tag operations and tag management across conversations
 */

import { createContext, useContext, createSignal, createEffect, JSX, Accessor } from 'solid-js';
import {
  getAllTags,
  renameTag,
  deleteTag
} from '../database/index.js';

interface TagInfo {
  name: string;
  count: number;
}

interface TagContextValue {
  tags: Accessor<TagInfo[]>;
  loading: Accessor<boolean>;
  reload: () => Promise<void>;
  rename: (oldTag: string, newTag: string) => Promise<void>;
  delete: (tag: string) => Promise<void>;
}

const TagContext = createContext<TagContextValue>();

export function TagProvider(props: { children: JSX.Element }) {
  const [tags, setTags] = createSignal<TagInfo[]>([]);
  const [loading, setLoading] = createSignal(false);

  // Load tags on mount
  createEffect(async () => {
    await loadTags();
  });

  // Load all tags
  const loadTags = async () => {
    setLoading(true);
    try {
      const allTags = await getAllTags();
      setTags(allTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload tags
  const reload = async () => {
    await loadTags();
  };

  // Rename a tag
  const rename = async (oldTag: string, newTag: string) => {
    if (!oldTag || !newTag || oldTag === newTag) return;

    try {
      await renameTag(oldTag, newTag);
      await reload();
    } catch (error) {
      console.error('Failed to rename tag:', error);
      throw error;
    }
  };

  // Delete a tag
  const deleteTagFn = async (tag: string) => {
    if (!tag) return;

    const confirmed = confirm(
      `Delete tag "${tag}" from all conversations? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteTag(tag);
      await reload();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      throw error;
    }
  };

  const value: TagContextValue = {
    tags,
    loading,
    reload,
    rename,
    delete: deleteTagFn
  };

  return (
    <TagContext.Provider value={value}>
      {props.children}
    </TagContext.Provider>
  );
}

export function useTags() {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within TagProvider');
  }
  return context;
}
