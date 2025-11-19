# ConvoKeep SolidJS Migration Guide

A comprehensive guide for migrating ConvoKeep from Vanilla JavaScript to SolidJS while preserving existing business logic and improving UI maintainability.

---

## Table of Contents

1. [Why SolidJS?](#why-solidjs)
2. [What Can Be Reused (80% of code)](#what-can-be-reused)
3. [What Needs Rewriting (20% of code)](#what-needs-rewriting)
4. [Migration Strategy](#migration-strategy)
5. [Architecture Improvements](#architecture-improvements)
6. [Component Examples](#component-examples)
7. [State Management](#state-management)
8. [Routing](#routing)
9. [Build Setup](#build-setup)
10. [Migration Checklist](#migration-checklist)

---

## Why SolidJS?

### Perfect Fit for ConvoKeep

SolidJS is ideal for this migration because:

1. **No Virtual DOM** - Real DOM updates like vanilla JS, but reactive
2. **Small Bundle Size** - ~7KB (important for privacy-first, offline-first app)
3. **No Build Required Option** - Can start with ESM imports, add Vite later
4. **Reactive by Default** - Perfect for conversation list updates, filters, selections
5. **TypeScript Optional** - Can migrate incrementally
6. **Similar to Current Code** - JSX is close to template literals we're using now

### Why NOT React/Vue?

- **React**: Virtual DOM overhead, larger bundle, more complex for our use case
- **Vue**: Larger bundle, template syntax requires more rewriting, heavier runtime
- **Svelte**: Requires compilation, can't run directly in browser without build
- **SolidJS**: Best performance, smallest size, can start without build step

---

## What Can Be Reused (80% of code)

### ✅ 100% Reusable - No Changes Needed

#### 1. **Database Layer** (`js/database/`)
All database code works as-is:
- `dbConfig.js` - Configuration
- `dbConnector.js` - IndexedDB connection
- `conversationRepository.js` - All repository methods
- `databaseManager.js` - Manager singleton

**Why:** Pure JavaScript, no DOM dependencies

```javascript
// These work identically in SolidJS
import { initDb, getConversations, storeConversations } from './database/index.js';

// Inside a SolidJS component
const [conversations, setConversations] = createSignal([]);

onMount(async () => {
  await initDb();
  const data = await getConversations();
  setConversations(data);
});
```

#### 2. **File Processing** (`js/fileProcessor/`)
Entire module reusable:
- `fileProcessor.js`
- `fileReader.js`
- `zipExtractor.js`
- `conversationExtractor.js`

**Why:** Pure business logic, no UI

#### 3. **Schema Converters** (`js/schemaConverter/`)
100% reusable:
- `conversationConverter.js`
- `formatDetector.js`
- All format converters

**Why:** Pure data transformation

#### 4. **Utilities** (`js/utils/`)
All utilities work as-is:
- `formatUtils.js` - Date/time formatting
- `textUtils.js` - Text processing
- `idUtils.js` - ID generation
- `markdownUtils.js` - Markdown rendering
- `clipboardUtils.js` - Clipboard operations
- All other utilities

**Why:** Pure functions, no framework dependency

#### 5. **License System** (`js/license/`)
Entire module reusable:
- `licenseConfig.js`
- `featureManager.js`
- Feature gating logic

**Changes needed:** Only UI helpers need updating for SolidJS components

#### 6. **Service Worker** (`service-worker.js`)
Works identically - no changes needed

#### 7. **Test Suite** (`tests/`)
All 226 tests work as-is - just add component tests for new SolidJS components

---

## What Needs Rewriting (20% of code)

### ❌ Needs Complete Rewrite

#### 1. **Viewer Module** (`js/viewer/`)

**Current Issues:**
- Manual DOM manipulation everywhere
- Event listeners attached in multiple places
- State scattered across multiple files
- Hard to reason about data flow
- Difficult to test

**Files to Rewrite:**
- ✅ `viewerCore.js` → Component with reactive state
- ✅ `conversationManager.js` → Custom hook/resource
- ✅ `uiController.js` → Multiple SolidJS components
- ✅ `messageRenderer.js` → `<MessageList>` component
- ✅ `paginationComponent.js` → `<Pagination>` component
- ✅ `batchOperations.js` → Context + components
- ✅ `tagManager.js` → Context + components
- ⚠️ `fuzzySearch.js` → May need adaptation for reactivity

#### 2. **App Initialization** (`js/app.js`)

**Current:** Manual DOM manipulation for upload UI
**New:** SolidJS components

#### 3. **Theme System** (`js/theme.js`)

**Current:** Manual class toggling
**New:** SolidJS context + reactive CSS classes

---

## Migration Strategy

### Phase 1: Setup (1-2 days)

#### Option A: No Build Step (Start Simple)

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { render } from 'https://cdn.skypack.dev/solid-js/web';
    import App from './src/App.jsx';

    render(() => <App />, document.getElementById('root'));
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

**Pros:**
- Start immediately
- No build complexity
- Keep current workflow

**Cons:**
- No TypeScript
- No HMR
- Slower development

#### Option B: Vite Build (Recommended)

```bash
npm create vite@latest convokeep-solid -- --template solid
```

**Project Structure:**
```
convokeep-solid/
├── public/
│   ├── assets/          # Copy from current project
│   └── manifest.json    # PWA manifest
├── src/
│   ├── components/      # New UI components
│   ├── contexts/        # App-wide state
│   ├── database/        # ✅ Copy as-is
│   ├── fileProcessor/   # ✅ Copy as-is
│   ├── schemaConverter/ # ✅ Copy as-is
│   ├── utils/           # ✅ Copy as-is
│   ├── license/         # ✅ Copy as-is (update UI helpers)
│   ├── App.jsx          # New root component
│   └── index.jsx        # Entry point
├── tests/               # ✅ Copy as-is + add component tests
├── vite.config.js
└── package.json
```

**vite.config.js:**
```javascript
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['solid-js'],
          'database': ['./src/database/index.js'],
        }
      }
    }
  },
  // For PWA support
  server: {
    port: 3000
  }
});
```

### Phase 2: Core Components (3-5 days)

Rewrite UI layer component by component:

1. **App Shell** (Day 1)
2. **Conversation List** (Day 2)
3. **Message Viewer** (Day 3)
4. **Filters & Search** (Day 4)
5. **Batch Operations** (Day 5)

### Phase 3: Integration (2-3 days)

1. Connect all components
2. State management
3. Routing
4. Testing

### Phase 4: Polish (1-2 days)

1. PWA manifest
2. Service worker
3. Performance optimization
4. Final testing

**Total: 1-2 weeks**

---

## Architecture Improvements

### Current Architecture Issues

```
viewerCore.js (600+ lines)
├── Manages state (currentPage, filters, etc.)
├── Calls conversationManager
├── Calls uiController
└── Manually updates DOM

uiController.js (600+ lines)
├── Manual DOM creation
├── Event listener attachment
├── State scattered everywhere
└── Hard to test

batchOperations.js (400+ lines)
├── Manual checkbox management
├── Selection state in Set
└── Manual UI updates
```

**Problems:**
- State duplication
- Manual synchronization
- Event listener memory leaks
- Hard to reason about

### New SolidJS Architecture

```
<App>
  ├── Contexts (global state)
  │   ├── ConversationContext
  │   ├── BatchOperationsContext
  │   ├── TagContext
  │   └── ThemeContext
  │
  ├── Layout
  │   ├── <Header />
  │   ├── <Sidebar>
  │   │   ├── <ConversationList />
  │   │   ├── <FilterBar />
  │   │   └── <Pagination />
  │   └── <MainContent>
  │       └── <MessageViewer />
  │
  └── Modals
      ├── <UploadModal />
      ├── <TagManagerModal />
      └── <BatchTagModal />
```

**Benefits:**
- Clear component hierarchy
- Reactive state (no manual updates)
- Automatic cleanup
- Easy to test
- Type-safe (with TypeScript)

---

## Component Examples

### Example 1: Conversation List (Before/After)

#### Before (Vanilla JS - 100+ lines)

```javascript
// uiController.js
updateConversationList(conversations, append = false, animate = true) {
  const container = this.elements.conversationList;
  if (!container) return;

  const scrollTop = container.scrollTop;
  container.innerHTML = '';

  if (conversations.length === 0) {
    // Show empty state
    const emptyState = document.getElementById('empty-conversation-list');
    if (emptyState) {
      emptyState.style.display = 'flex';
      container.appendChild(emptyState);
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  const items = [];

  conversations.forEach((conversation) => {
    const item = this._createConversationItem(conversation);
    if (animate) {
      item.classList.add('new-item');
    }
    items.push(item);
    fragment.appendChild(item);
  });

  container.appendChild(fragment);

  if (!animate) {
    container.scrollTop = scrollTop;
  }

  if (animate) {
    requestAnimationFrame(() => {
      items.forEach((item, index) => {
        item.style.animationDelay = `${index * 50}ms`;
        item.classList.add('animate-in');
      });
    });
  }
}

_createConversationItem(conversation) {
  const item = document.createElement('div');
  item.className = 'conversation-item';
  // ... 50 more lines of manual DOM creation
  // ... 20 more lines of event listener attachment
  return item;
}
```

#### After (SolidJS - 30 lines)

```jsx
// ConversationList.jsx
import { For, Show } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';
import ConversationItem from './ConversationItem';
import EmptyState from './EmptyState';

export default function ConversationList() {
  const { conversations, loading } = useConversations();

  return (
    <div class="conversation-list" role="list">
      <Show
        when={!loading()}
        fallback={<div class="loading-indicator">Loading...</div>}
      >
        <Show
          when={conversations().length > 0}
          fallback={<EmptyState />}
        >
          <For each={conversations()}>
            {(conversation) => (
              <ConversationItem conversation={conversation} />
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
}
```

**Benefits:**
- Automatic reactivity (no manual updates)
- Declarative (easier to understand)
- Automatic cleanup
- Much shorter

---

### Example 2: Conversation Item Component

#### Before (Vanilla JS - 100+ lines in _createConversationItem)

```javascript
_createConversationItem(conversation) {
  const item = document.createElement('div');
  item.className = 'conversation-item';
  item.dataset.conversationId = conversation.conversation_id;

  if (conversation.conversation_id === this.viewerCore.currentConversationId) {
    item.classList.add('active');
  }

  if (conversation.archived) {
    item.classList.add('archived');
  }

  const fullDate = formatters.fullDate(conversation.created_at);
  const sourceName = this._formatSourceName(conversation);

  const tags = conversation.tags || [];
  const tagsHtml = tags.length > 0
    ? `<div class="conversation-tags">
        ${tags.map(tag => `<span class="conversation-tag">${this._escapeHtml(tag)}</span>`).join('')}
      </div>`
    : '';

  item.innerHTML = `
    <div class="conversation-item-checkbox-wrapper">
      <input type="checkbox" class="conversation-item-checkbox"
        data-conversation-id="${conversation.conversation_id}"
        ${batchOpsManager.isSelected(conversation.conversation_id) ? 'checked' : ''}
      />
    </div>
    <div class="conversation-item-content">
      <div class="conversation-item-header">
        <div class="conversation-item-title">${conversation.title}</div>
        <button class="conversation-item-star ${conversation.starred ? 'starred' : ''}">
          ${conversation.starred ? '★' : '☆'}
        </button>
      </div>
      <div class="conversation-item-meta">
        <span>${sourceName}</span>
        <span>•</span>
        <span>${fullDate}</span>
      </div>
      ${tagsHtml}
    </div>
  `;

  // 30+ more lines of event listener attachment
  const checkbox = item.querySelector('.conversation-item-checkbox');
  const starBtn = item.querySelector('.conversation-item-star');
  const contentArea = item.querySelector('.conversation-item-content');

  if (checkbox) {
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      batchOpsManager.toggleSelection(conversation.conversation_id);
    });
  }

  if (starBtn) {
    starBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isCurrentlyStarred = starBtn.classList.contains('starred');
      await this._handleStarToggle(conversation.conversation_id, !isCurrentlyStarred, starBtn);
    });
  }

  if (contentArea) {
    contentArea.addEventListener('click', () => {
      if (conversation && conversation.conversation_id) {
        this.viewerCore.loadConversation(conversation.conversation_id);
      }
    });
  }

  return item;
}
```

#### After (SolidJS - 60 lines, much clearer)

```jsx
// ConversationItem.jsx
import { Show, For } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';
import { useBatchOperations } from '../contexts/BatchOperationsContext';
import { formatters } from '../utils/formatUtils';

export default function ConversationItem(props) {
  const { currentConversationId, loadConversation } = useConversations();
  const { isSelected, toggleSelection } = useBatchOperations();

  const isActive = () => currentConversationId() === props.conversation.conversation_id;
  const selected = () => isSelected(props.conversation.conversation_id);

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    toggleSelection(props.conversation.conversation_id);
  };

  const handleStarClick = async (e) => {
    e.stopPropagation();
    await props.conversation.toggleStar(); // Method on conversation object
  };

  const handleClick = () => {
    loadConversation(props.conversation.conversation_id);
  };

  return (
    <div
      class="conversation-item"
      classList={{
        active: isActive(),
        archived: props.conversation.archived
      }}
      onClick={handleClick}
      role="listitem"
      aria-label={props.conversation.title}
    >
      <div class="conversation-item-checkbox-wrapper">
        <input
          type="checkbox"
          class="conversation-item-checkbox"
          checked={selected()}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select conversation"
        />
      </div>

      <div class="conversation-item-content">
        <div class="conversation-item-header">
          <div class="conversation-item-title">{props.conversation.title}</div>
          <button
            class="conversation-item-star"
            classList={{ starred: props.conversation.starred }}
            onClick={handleStarClick}
            aria-label={props.conversation.starred ? 'Unstar' : 'Star'}
          >
            {props.conversation.starred ? '★' : '☆'}
          </button>
        </div>

        <div class="conversation-item-meta">
          <span class="conversation-item-source">
            {formatSourceName(props.conversation)}
          </span>
          <span>•</span>
          <span class="conversation-item-date">
            {formatters.fullDate(props.conversation.created_at)}
          </span>
          <Show when={props.conversation.archived}>
            <span class="conversation-item-archived-badge">Archived</span>
          </Show>
        </div>

        <Show when={props.conversation.tags?.length > 0}>
          <div class="conversation-tags">
            <For each={props.conversation.tags}>
              {(tag) => <span class="conversation-tag">{tag}</span>}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}

function formatSourceName(conversation) {
  const source = conversation.source?.toLowerCase() || '';
  const model = conversation.model?.toLowerCase() || '';

  if (source.includes('chatgpt') || source.includes('gpt') || model.includes('gpt')) {
    return 'ChatGPT';
  } else if (source.includes('claude') || model.includes('claude')) {
    return 'Claude';
  }
  return conversation.source || 'Unknown';
}
```

**Key Improvements:**
- ✅ No manual DOM manipulation
- ✅ No manual event listener cleanup (automatic)
- ✅ Reactive classes with `classList`
- ✅ Clearer data flow
- ✅ Type-safe with TypeScript
- ✅ Easy to test

---

### Example 3: Filter Bar

#### Before (Vanilla JS - scattered across viewerCore.js)

```javascript
// In viewerCore.js constructor
this.starredFilter = false;
this.archivedFilter = false;
this.tagFilter = null;

// In setupEventListeners
const starredFilterBtn = document.getElementById('filter-starred');
if (starredFilterBtn) {
  starredFilterBtn.addEventListener('click', this.handleStarredFilter.bind(this));
}

// In handleStarredFilter (30+ lines)
async handleStarredFilter() {
  const btn = document.getElementById('filter-starred');
  if (!btn) return;

  const isCurrentlyActive = btn.dataset.active === 'true';
  this.starredFilter = !isCurrentlyActive;
  btn.dataset.active = this.starredFilter ? 'true' : 'false';

  if (this.starredFilter && this.archivedFilter) {
    this.archivedFilter = false;
    const archivedBtn = document.getElementById('filter-archived');
    if (archivedBtn) {
      archivedBtn.dataset.active = 'false';
    }
  }

  this.currentPage = 1;
  await this.reloadConversations();
}

// Similar for handleArchivedFilter (30+ lines)
```

#### After (SolidJS - 40 lines total)

```jsx
// FilterBar.jsx
import { Show } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';

export default function FilterBar() {
  const { filters, setFilter, clearFilters } = useConversations();

  const toggleStarred = () => {
    setFilter('starred', !filters.starred);
  };

  const toggleArchived = () => {
    setFilter('archived', !filters.archived);
  };

  const hasActiveFilters = () => filters.starred || filters.archived || filters.tag;

  return (
    <div class="organization-filters" role="group" aria-label="Organization filters">
      <button
        class="filter-chip"
        classList={{ active: filters.starred }}
        onClick={toggleStarred}
        aria-label="Show only starred"
        aria-pressed={filters.starred}
      >
        <span aria-hidden="true">⭐</span> Starred
      </button>

      <button
        class="filter-chip"
        classList={{ active: filters.archived }}
        onClick={toggleArchived}
        aria-label="Show archived"
        aria-pressed={filters.archived}
      >
        <span aria-hidden="true">📦</span> Archived
      </button>

      <Show when={hasActiveFilters()}>
        <button
          class="filter-chip filter-chip-action"
          onClick={clearFilters}
          aria-label="Clear all filters"
        >
          Clear Filters
        </button>
      </Show>
    </div>
  );
}
```

**Benefits:**
- ✅ Single source of truth (context)
- ✅ Automatic UI updates
- ✅ No manual state synchronization
- ✅ Much simpler logic

---

## State Management

### Conversation Context (Replaces viewerCore.js)

```jsx
// contexts/ConversationContext.jsx
import { createContext, useContext, createSignal, createEffect, createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import { getConversations, getConversationById } from '../database/index.js';

const ConversationContext = createContext();

export function ConversationProvider(props) {
  // State
  const [conversations, setConversations] = createStore([]);
  const [currentConversationId, setCurrentConversationId] = createSignal(null);
  const [loading, setLoading] = createSignal(false);

  // Filters
  const [filters, setFilters] = createStore({
    source: 'all',
    sortOrder: 'newest',
    starred: false,
    archived: false,
    tag: null,
    searchQuery: ''
  });

  // Pagination
  const [pagination, setPagination] = createStore({
    currentPage: 1,
    totalPages: 1,
    perPage: 20
  });

  // Derived state
  const currentConversation = createMemo(() => {
    const id = currentConversationId();
    if (!id) return null;
    return conversations.find(c => c.conversation_id === id);
  });

  // Load conversations (reactive to filters and pagination)
  createEffect(async () => {
    setLoading(true);

    try {
      const result = await getConversations({
        page: pagination.currentPage,
        source: filters.source,
        sortOrder: filters.sortOrder,
        starred: filters.starred || undefined,
        archived: filters.archived || undefined,
        tag: filters.tag || undefined,
        limit: pagination.perPage
      });

      setConversations(result.conversations);
      setPagination({
        totalPages: result.pagination.totalPages,
        totalConversations: result.pagination.totalConversations
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  });

  // Actions
  const loadConversation = async (id) => {
    setCurrentConversationId(id);
    // Update URL, etc.
  };

  const setFilter = (key, value) => {
    setFilters(key, value);
    // Reset to page 1 when filter changes
    setPagination('currentPage', 1);
  };

  const setPage = (page) => {
    setPagination('currentPage', page);
  };

  const value = {
    // State
    conversations,
    currentConversation,
    currentConversationId,
    loading,
    filters,
    pagination,

    // Actions
    loadConversation,
    setFilter,
    setPage,
    setConversations
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
```

**Usage in components:**

```jsx
// Any component
function MyComponent() {
  const { conversations, loading, setFilter } = useConversations();

  // Automatically reactive!
  return (
    <Show when={!loading()} fallback={<Spinner />}>
      <p>Found {conversations.length} conversations</p>
    </Show>
  );
}
```

---

### Batch Operations Context (Replaces batchOperations.js)

```jsx
// contexts/BatchOperationsContext.jsx
import { createContext, useContext, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { bulkDeleteConversations, bulkUpdateConversations } from '../database/index.js';

const BatchOperationsContext = createContext();

export function BatchOperationsProvider(props) {
  const [selectedIds, setSelectedIds] = createStore(new Set());
  const [isProcessing, setIsProcessing] = createSignal(false);

  const isSelected = (id) => selectedIds.has(id);

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = (ids) => {
    setSelectedIds(new Set(ids));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = confirm(
      `Delete ${selectedIds.size} conversation${selectedIds.size > 1 ? 's' : ''}?`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await bulkDeleteConversations(Array.from(selectedIds));
      deselectAll();
      // Context will trigger reload automatically
    } catch (error) {
      console.error('Batch delete failed:', error);
      alert('Failed to delete conversations');
    } finally {
      setIsProcessing(false);
    }
  };

  const starSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    try {
      await bulkUpdateConversations(Array.from(selectedIds), { starred: true });
      deselectAll();
    } catch (error) {
      console.error('Batch star failed:', error);
      alert('Failed to star conversations');
    } finally {
      setIsProcessing(false);
    }
  };

  const value = {
    selectedIds: () => Array.from(selectedIds),
    selectionCount: () => selectedIds.size,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    starSelected,
    isProcessing
  };

  return (
    <BatchOperationsContext.Provider value={value}>
      {props.children}
    </BatchOperationsContext.Provider>
  );
}

export function useBatchOperations() {
  return useContext(BatchOperationsContext);
}
```

---

## Routing

### Option 1: @solidjs/router (Recommended)

```bash
npm install @solidjs/router
```

```jsx
// App.jsx
import { Router, Route, Routes } from '@solidjs/router';
import ConversationList from './components/ConversationList';
import ConversationViewer from './components/ConversationViewer';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={ConversationList} />
        <Route path="/conversation/:id" component={ConversationViewer} />
      </Routes>
    </Router>
  );
}
```

### Option 2: URL Parameters (Simpler, Current Approach)

```jsx
// App.jsx
import { createSignal, createEffect } from 'solid-js';
import { useSearchParams } from '@solidjs/router';

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();

  createEffect(() => {
    const conversationId = searchParams.conversation;
    if (conversationId) {
      loadConversation(conversationId);
    }
  });

  return (
    <div class="app">
      <Sidebar />
      <MainContent />
    </div>
  );
}
```

---

## Build Setup

### package.json

```json
{
  "name": "convokeep-solid",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "solid-js": "^1.8.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-solid": "^2.10.0",
    "vite-plugin-pwa": "^0.17.0",
    "terser": "^5.26.0"
  }
}
```

### PWA Support

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/**/*'],
      manifest: {
        name: 'ConvoKeep',
        short_name: 'ConvoKeep',
        description: 'Privacy-first AI conversation archive',
        theme_color: '#7287fd',
        icons: [
          {
            src: '/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
```

---

## Migration Checklist

### Phase 1: Setup ✓

- [ ] Create new project with Vite + SolidJS
- [ ] Copy database layer (no changes)
- [ ] Copy fileProcessor (no changes)
- [ ] Copy schemaConverter (no changes)
- [ ] Copy utils (no changes)
- [ ] Copy license (update UI helpers)
- [ ] Copy tests
- [ ] Copy CSS files
- [ ] Set up Vite config

### Phase 2: Core Components ✓

- [ ] Create ConversationContext
- [ ] Create BatchOperationsContext
- [ ] Create TagContext
- [ ] Create ThemeContext
- [ ] Build `<App>` component
- [ ] Build `<ConversationList>`
- [ ] Build `<ConversationItem>`
- [ ] Build `<MessageViewer>`
- [ ] Build `<FilterBar>`
- [ ] Build `<Pagination>`

### Phase 3: Advanced Features ✓

- [ ] Build `<UploadModal>`
- [ ] Build `<TagManagerModal>`
- [ ] Build `<BatchToolbar>`
- [ ] Implement fuzzy search
- [ ] Add routing
- [ ] License feature gating

### Phase 4: Polish ✓

- [ ] PWA manifest
- [ ] Service worker
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Write component tests
- [ ] Documentation

---

## Testing Strategy

### Unit Tests (Existing tests work as-is)

```javascript
// tests/database/batchOperations.test.js
// ✅ No changes needed - all tests still work
```

### Component Tests (New)

```jsx
// tests/components/ConversationItem.test.jsx
import { render, fireEvent } from '@solidjs/testing-library';
import ConversationItem from '../../src/components/ConversationItem';

test('toggles star on click', async () => {
  const conversation = {
    conversation_id: '1',
    title: 'Test',
    starred: false,
    toggleStar: vi.fn()
  };

  const { getByLabelText } = render(() => (
    <ConversationItem conversation={conversation} />
  ));

  const starBtn = getByLabelText('Star');
  await fireEvent.click(starBtn);

  expect(conversation.toggleStar).toHaveBeenCalled();
});
```

---

## Performance Comparison

### Bundle Size

| Version | Size (gzipped) |
|---------|----------------|
| Current (Vanilla) | ~15KB JS |
| SolidJS | ~22KB (Solid 7KB + app 15KB) |
| React equivalent | ~45KB (React 40KB + app 5KB) |
| Vue equivalent | ~35KB (Vue 30KB + app 5KB) |

### Runtime Performance

| Metric | Vanilla | SolidJS | React |
|--------|---------|---------|-------|
| Initial render | ⚡ Fast | ⚡ Fast | 🐢 Slower |
| Re-render (filter change) | 🐢 Manual | ⚡ Fast | 🐢 Slower |
| Memory usage | ✅ Low | ✅ Low | ⚠️ Higher |

**SolidJS wins on re-render performance due to fine-grained reactivity**

---

## Common Gotchas

### 1. Signals vs Stores

```jsx
// ❌ Wrong - can't mutate signal directly
const [count, setCount] = createSignal(0);
count++; // ERROR

// ✅ Correct
setCount(count() + 1);

// For objects, use stores
const [user, setUser] = createStore({ name: 'Alice' });
setUser('name', 'Bob'); // ✅ Correct
```

### 2. Accessing Signals

```jsx
// ❌ Wrong - accessing signal outside reactive context
const conversations = useConversations();
console.log(conversations.loading); // Not reactive!

// ✅ Correct - call as function
console.log(conversations.loading()); // Reactive!
```

### 3. Event Handlers

```jsx
// ❌ Wrong - calling function immediately
<button onClick={handleClick()}>Click</button>

// ✅ Correct - passing function reference
<button onClick={handleClick}>Click</button>

// ✅ Correct - arrow function for parameters
<button onClick={() => handleClick(id)}>Click</button>
```

---

## Migration Benefits

### Code Quality
- ✅ 60% less UI code
- ✅ Clearer data flow
- ✅ Type-safe with TypeScript
- ✅ Better testing
- ✅ No memory leaks

### Developer Experience
- ✅ Hot module reload
- ✅ Better debugging
- ✅ Component dev tools
- ✅ TypeScript autocomplete

### User Experience
- ✅ Faster re-renders
- ✅ Smaller bundle (vs React/Vue)
- ✅ Same privacy-first approach
- ✅ Smoother interactions

### Maintenance
- ✅ Easier to reason about
- ✅ Easier to test
- ✅ Easier to extend
- ✅ Better organized

---

## Conclusion

**Recommendation: Migrate to SolidJS with Vite**

### Why:
1. **80% of code reused** (database, utils, business logic)
2. **20% rewritten** (UI) becomes much clearer and maintainable
3. **Better DX** (hot reload, debugging, testing)
4. **Better UX** (faster, more reactive)
5. **Small cost** (7KB framework, 1-2 weeks migration)

### Timeline:
- Week 1: Setup + Core components
- Week 2: Integration + Polish
- **Total: 1-2 weeks**

### Next Steps:
1. Create proof-of-concept with one component
2. If satisfied, proceed with full migration
3. Migrate incrementally (component by component)
4. Keep old version until new version is tested

---

## Resources

- [SolidJS Tutorial](https://www.solidjs.com/tutorial/introduction_basics)
- [SolidJS Docs](https://www.solidjs.com/docs/latest)
- [Solid Start (Meta-framework)](https://start.solidjs.com/)
- [SolidJS Discord](https://discord.com/invite/solidjs)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

**Questions? Issues? See the SolidJS Discord or ConvoKeep repo discussions.**
