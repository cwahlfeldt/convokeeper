# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ConvoKeep is a privacy-first AI conversation archive that stores ChatGPT, Claude, and other AI conversations locally in the browser using IndexedDB. Built with SolidJS and migrated from Vanilla JavaScript for better performance and developer experience.

## Development Commands

```bash
# Install dependencies (uses bun)
bun install

# Start development server (runs on http://localhost:3000)
bun dev

# Build for production
bun build

# Preview production build
bun serve

# Run all tests with Vitest
bun test

# Run tests with UI
bun test:ui
```

## Architecture

### State Management with SolidJS Contexts

The application uses four main context providers that wrap the entire app (see `src/App.tsx`):

1. **ConversationContext** (`src/contexts/ConversationContext.tsx`)
   - Central state management for conversations, filtering, and pagination
   - Provides reactive signals for `conversations`, `currentConversation`, `loading`
   - Handles filters (source, sortOrder, starred, archived, tag, searchQuery)
   - Manages pagination (currentPage, totalPages, perPage: 20)
   - Key methods: `loadConversation()`, `setFilter()`, `toggleStar()`, `toggleArchive()`, `updateTags()`

2. **BatchOperationsContext** (`src/contexts/BatchOperationsContext.tsx`)
   - Manages multi-select operations on conversations
   - Tracks selected conversation IDs using a Set
   - Provides methods: `deleteSelected()`, `starSelected()`, `archiveSelected()`, `tagSelected()`
   - All batch operations accept an `onComplete()` callback (typically `reload()` from ConversationContext)

3. **TagContext** (`src/contexts/TagContext.tsx`)
   - Manages available tags across all conversations
   - Aggregates and tracks tag usage

4. **ThemeContext** (`src/contexts/ThemeContext.tsx`)
   - Handles dark/light mode switching
   - Persists theme preference to localStorage

### Database Layer Architecture

The database layer is pure JavaScript (not TypeScript) and follows a modular pattern:

- **dbConnector.js** - Low-level IndexedDB connection handler
  - Manages schema creation and migrations
  - Current version: 3 (adds starred/archived/tags fields)
  - Handles database upgrades in `_createSchema()` and `_migrateToV3()`

- **conversationRepository.js** - Conversation CRUD operations
  - Stores conversations in batches (batchSize from config)
  - Handles deduplication by conversation_id
  - Tracks stats: newConversations vs updatedConversations

- **databaseManager.js** - High-level database operations
  - Query operations with filtering, sorting, pagination
  - Bulk operations for batch updates/deletes
  - Export/import functionality

- **dbConfig.js** - Database configuration
  - Database name, version, store names
  - Index definitions (conversation_id, source, created_at, starred, archived, tags)

### File Import Pipeline

Multi-stage processing pipeline for importing conversations:

1. **fileProcessor.js** - Orchestrates the import process
   - Entry point: `processFile(file, progressCallback)`
   - Handles progress updates (0-100%)

2. **fileReader.js** - Reads uploaded files as ArrayBuffer

3. **zipExtractor.js** - Extracts ZIP archives (ChatGPT exports)

4. **conversationExtractor.js** - Extracts conversation JSON from various formats

5. **Schema Conversion** (in `src/schemaConverter/`):
   - **formatDetector.js** - Auto-detects conversation format
   - Detects: 'chatgpt' (mapping structure), 'claude' (chat_messages array), 'convokeep' (already unified), 'generic'
   - **formatConverters/** - Converts to unified ConvoKeep schema
     - `baseConverter.js` - Abstract base class
     - `chatGptConverter.js` - Converts ChatGPT's nested mapping structure
     - `claudeConverter.js` - Converts Claude's chat_messages format
     - `convokeepConverter.js` - Pass-through for already-unified format
     - `genericConverter.js` - Best-effort conversion for unknown formats

### Unified ConvoKeep Schema

All conversations are normalized to this format before storage:

```javascript
{
  conversation_id: string,  // Unique ID
  title: string,
  source: string,           // 'chatgpt', 'claude', 'gemini', etc.
  model?: string,           // AI model used
  created_at: timestamp,
  starred: boolean,
  archived: boolean,
  tags: string[],
  messages: [{
    role: string,           // 'user' or 'assistant'
    content: string,
    timestamp?: number,
    id?: string
  }]
}
```

### Component Architecture

Components are TypeScript/TSX and use SolidJS patterns:

- **ConversationList.tsx** - Left sidebar showing filtered conversations
  - Uses `useConversations()` hook for data
  - Renders ConversationItem components
  - Includes FilterBar and FuzzySearch

- **MessageViewer.tsx** - Main content area displaying conversation messages
  - Shows messages with markdown rendering
  - Handles code highlighting with highlight.js

- **FilterBar.tsx** - Filter controls (source, sort, starred, archived)

- **FuzzySearch.tsx** - Keyboard-navigable fuzzy search with ↑/↓/Enter/Esc

- **Pagination.tsx** - Page navigation component

- **UploadModal.tsx** - File upload dialog with drag-and-drop

Each component has corresponding tests in `__tests__/` subdirectory.

## Testing

Uses Vitest with jsdom environment. Configuration in `vitest.config.ts`:

- Test files: `src/**/*.{test,spec}.{js,ts,jsx,tsx}`
- Setup file: `src/test/setup.ts` (mocks IndexedDB)
- Excludes: `node_modules`, `dist`, `convokeep` (old vanilla JS version)

When writing tests:
- Use `@solidjs/testing-library` for component tests
- IndexedDB is mocked via `fake-indexeddb` in setup
- Test files should import from `'solid-js'` and use `render()`, `screen`, etc.

## Code Patterns

### Working with Contexts

```typescript
import { useConversations } from '../contexts/ConversationContext';

function MyComponent() {
  const { conversations, loading, setFilter } = useConversations();

  // Access reactive signals by calling them
  const convos = conversations();
  const isLoading = loading();

  // Update filters
  setFilter('source', 'chatgpt');
}
```

### Database Operations

All database operations are async and should be wrapped in try/catch:

```javascript
import { getConversations, updateConversationMetadata } from './database/index.js';

// Query conversations
const result = await getConversations({
  page: 1,
  source: 'chatgpt',
  starred: true,
  limit: 20
});

// Update metadata
await updateConversationMetadata(conversationId, {
  starred: true,
  tags: ['important', 'work']
});
```

### Adding New Format Converters

1. Create new converter in `src/schemaConverter/formatConverters/`
2. Extend `BaseConverter` class
3. Implement `convert(conversation)` method
4. Add detection logic to `FormatDetector.detectFormat()`
5. Register in `src/schemaConverter/index.js`

## Build Configuration

### Vite Config

- Development server: port 3000
- Manual chunks: 'vendor' (solid-js), 'database' (database layer)
- Minification: terser
- Plugins: solid-devtools, vite-plugin-solid, @tailwindcss/vite

### TypeScript Config

- JSX: preserve with jsxImportSource: 'solid-js'
- Target: ESNext
- Module: ESNext with bundler resolution
- Strict mode enabled

## Important Notes

### Mixed JS/TS Codebase

- **TypeScript**: Components, contexts, App.tsx, test setup
- **JavaScript**: Database layer, file processors, schema converters, utils

When importing JS files from TS files, always use `.js` extension in imports.

### IndexedDB Constraints

- Store name: 'conversations'
- Key path: 'id' (auto-increment)
- Unique index on 'conversation_id' for deduplication
- Batch operations use batches of 100 (from dbConfig.js)

### SolidJS Patterns

- Use `createSignal()` for simple state
- Use `createStore()` for nested reactive objects
- Use `createEffect()` for side effects (runs when dependencies change)
- Always call signals as functions to access values: `mySignal()`
- Avoid destructuring context values - use them directly to maintain reactivity

### Migration Context

This project was recently migrated from Vanilla JS to SolidJS. The old version exists in `convokeep-OLD/` directory. See `MIGRATION_COMPLETE.md` for migration details. Do not modify files in `convokeep-OLD/`.
