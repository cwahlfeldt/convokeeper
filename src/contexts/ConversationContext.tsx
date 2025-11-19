/**
 * Conversation Context
 *
 * Manages conversation state, filtering, and pagination
 * Replaces the old viewerCore.js with reactive state management
 */

import { createContext, useContext, createSignal, createEffect, JSX, Accessor } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import {
  getConversations,
  getConversationById,
  updateConversationMetadata,
  initDb
} from '../database/index.js';

// Types
interface Conversation {
  conversation_id: string;
  title: string;
  source?: string;
  model?: string;
  created_at: string | number;
  starred?: boolean;
  archived?: boolean;
  tags?: string[];
  messages?: any[];
}

interface Filters {
  source: string;
  sortOrder: string;
  starred: boolean;
  archived: boolean;
  tag: string | null;
  searchQuery: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalConversations: number;
  perPage: number;
}

interface ConversationContextValue {
  conversations: Accessor<Conversation[]>;
  currentConversation: Accessor<Conversation | null>;
  currentConversationId: Accessor<string | null>;
  loading: Accessor<boolean>;
  filters: Filters;
  pagination: Pagination;
  loadConversation: (id: string) => Promise<void>;
  setFilter: (key: keyof Filters, value: any) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  reload: () => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  updateTags: (id: string, tags: string[]) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextValue>();

export function ConversationProvider(props: { children: JSX.Element }) {
  // State
  const [conversations, setConversations] = createSignal<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = createSignal<string | null>(null);
  const [currentConversation, setCurrentConversation] = createSignal<Conversation | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [initialized, setInitialized] = createSignal(false);

  // Filters
  const [filters, setFilters] = createStore<Filters>({
    source: 'all',
    sortOrder: 'newest',
    starred: false,
    archived: false,
    tag: null,
    searchQuery: ''
  });

  // Pagination
  const [pagination, setPagination] = createStore<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalConversations: 0,
    perPage: 20
  });

  // Initialize database
  createEffect(async () => {
    try {
      await initDb();
      setInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  });

  // Load conversations when filters or pagination change
  createEffect(async () => {
    if (!initialized()) return;

    setLoading(true);

    try {
      const result = await getConversations({
        page: pagination.currentPage,
        source: filters.source !== 'all' ? filters.source : undefined,
        sortOrder: filters.sortOrder,
        starred: filters.starred || undefined,
        archived: filters.archived || undefined,
        tag: filters.tag || undefined,
        searchQuery: filters.searchQuery || undefined,
        limit: pagination.perPage
      });

      setConversations(result.conversations || []);
      setPagination({
        totalPages: result.pagination?.totalPages || 1,
        totalConversations: result.pagination?.totalConversations || 0
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  });

  // Load conversation by ID
  const loadConversation = async (id: string) => {
    try {
      const conversation = await getConversationById(id);
      setCurrentConversationId(id);
      setCurrentConversation(conversation);

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('conversation', id);
      window.history.pushState({}, '', url);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // Set filter
  const setFilter = (key: keyof Filters, value: any) => {
    setFilters(key, value);

    // Reset to page 1 when filter changes
    setPagination('currentPage', 1);

    // Clear mutually exclusive filters
    if (key === 'starred' && value === true) {
      setFilters('archived', false);
    } else if (key === 'archived' && value === true) {
      setFilters('starred', false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      source: 'all',
      sortOrder: 'newest',
      starred: false,
      archived: false,
      tag: null,
      searchQuery: ''
    });
    setPagination('currentPage', 1);
  };

  // Set page
  const setPage = (page: number) => {
    setPagination('currentPage', page);
  };

  // Reload conversations
  const reload = async () => {
    // Trigger reload by accessing reactive dependencies
    const currentPage = pagination.currentPage;
    setPagination('currentPage', currentPage);
  };

  // Toggle star
  const toggleStar = async (id: string) => {
    const conversation = conversations().find(c => c.conversation_id === id);
    if (!conversation) return;

    try {
      await updateConversationMetadata(id, { starred: !conversation.starred });
      await reload();

      // Update current conversation if it's the one being starred
      if (currentConversationId() === id) {
        const updated = await getConversationById(id);
        setCurrentConversation(updated);
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  // Toggle archive
  const toggleArchive = async (id: string) => {
    const conversation = conversations().find(c => c.conversation_id === id);
    if (!conversation) return;

    try {
      await updateConversationMetadata(id, { archived: !conversation.archived });
      await reload();

      // Update current conversation if it's the one being archived
      if (currentConversationId() === id) {
        const updated = await getConversationById(id);
        setCurrentConversation(updated);
      }
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  // Update tags
  const updateTags = async (id: string, tags: string[]) => {
    try {
      await updateConversationMetadata(id, { tags });
      await reload();

      // Update current conversation if it's the one being updated
      if (currentConversationId() === id) {
        const updated = await getConversationById(id);
        setCurrentConversation(updated);
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const value: ConversationContextValue = {
    conversations,
    currentConversation,
    currentConversationId,
    loading,
    filters,
    pagination,
    loadConversation,
    setFilter,
    clearFilters,
    setPage,
    reload,
    toggleStar,
    toggleArchive,
    updateTags
  };

  return (
    <ConversationContext.Provider value={value}>
      {props.children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversations must be used within ConversationProvider');
  }
  return context;
}
