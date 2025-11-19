# CLAUDE.md - AI Assistant Development Guide

This document provides a comprehensive guide to the ConvoKeep codebase for AI assistants. It explains the architecture, conventions, and workflows to help you effectively contribute to this project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Codebase Structure](#codebase-structure)
4. [Module System](#module-system)
5. [Data Flow](#data-flow)
6. [Development Workflow](#development-workflow)
7. [Coding Conventions](#coding-conventions)
8. [Common Patterns](#common-patterns)
9. [Testing & Debugging](#testing--debugging)
10. [Important Constraints](#important-constraints)

---

## Project Overview

**ConvoKeep** is a privacy-first, client-side web application for archiving, viewing, and searching AI conversations from multiple LLM providers (ChatGPT, Claude, etc.).

### Core Characteristics

- **100% Client-Side**: No backend server, no API calls, no data leaves the browser
- **Vanilla JavaScript**: No frameworks (React, Vue, etc.), no build systems required
- **ES6 Modules**: Modern JavaScript with native module system
- **IndexedDB Storage**: All data persists locally in the browser
- **Progressive Web App**: Offline-capable with service worker support
- **Privacy-First**: Zero data collection, zero tracking, zero external services (except optional Ko-fi widget)

### Tech Stack

- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage**: IndexedDB (native browser API)
- **External Libraries**:
  - JSZip (3.7.1) - ZIP file processing
  - Markdown-it (13.0.1) - Markdown rendering
  - Highlight.js (11.7.0) - Code syntax highlighting
  - Catppuccin - Color theme system (Latte/Mocha)

---

## Architecture & Design Principles

### Design Philosophy

The codebase follows **SOLID principles** and **DRY (Don't Repeat Yourself)** patterns with a strong emphasis on:

1. **Modularity**: Each module has a single, well-defined responsibility
2. **Separation of Concerns**: Clear boundaries between data, logic, and presentation
3. **Testability**: Components can be tested in isolation
4. **Maintainability**: Code is organized logically and documented
5. **Performance**: Efficient handling of large datasets with pagination and virtual scrolling

### Core Architectural Patterns

#### 1. **Module Pattern**
Each major feature is organized into its own module with:
- `index.js` - Public API entry point
- Supporting files - Internal implementation details
- `README.md` - Module-specific documentation (where applicable)

#### 2. **Singleton Pattern**
Core services (DatabaseManager, ConversationConverter) use singletons to ensure single instances throughout the application.

#### 3. **Repository Pattern**
Database access is abstracted through repositories (`ConversationRepository`) that handle all data operations.

#### 4. **Facade Pattern**
Public APIs expose simplified interfaces while hiding internal complexity.

#### 5. **Strategy Pattern**
Format converters use a strategy pattern to handle different conversation formats (ChatGPT, Claude, Generic).

---

## Codebase Structure

```
convokeep/
│
├── index.html                  # Main HTML entry point
├── manifest.json               # PWA manifest
├── service-worker.js           # Service worker for offline support
├── robots.txt                  # SEO robots file
├── sitemap.xml                 # SEO sitemap
├── browserconfig.xml           # Browser configuration
│
├── assets/                     # Static assets
│   ├── icons/                  # App icons (various sizes)
│   ├── fonts/                  # Web fonts (Open Sans)
│   ├── convokeeplogo.png       # Logo
│   └── og-image.jpg            # Social media preview image
│
├── css/                        # Modular stylesheets
│   ├── main.css                # CSS entry point (imports all modules)
│   ├── variables.css           # CSS custom properties & theme definitions
│   ├── base.css                # Reset, typography, base styles
│   ├── layout.css              # Layout structures (grid, flex)
│   ├── components.css          # UI component styles
│   ├── messages.css            # Message-specific styling
│   ├── utilities.css           # Utility classes
│   ├── responsive.css          # Media queries & responsive styles
│   └── mobile-menu.css         # Mobile navigation styles
│
└── js/                         # JavaScript modules
    ├── index.js                # Application entry point
    ├── app.js                  # App initialization & upload UI
    ├── theme.js                # Theme management (light/dark mode)
    │
    ├── database/               # Database operations
    │   ├── index.js            # Database module public API
    │   ├── dbConfig.js         # Database configuration constants
    │   ├── dbConnector.js      # Database connection management
    │   ├── databaseManager.js  # Main database coordinator
    │   └── conversationRepository.js  # Conversation CRUD operations
    │
    ├── fileProcessor/          # File upload & processing
    │   ├── index.js            # File processor public API
    │   ├── fileProcessor.js    # Main processing coordinator
    │   ├── fileReader.js       # File reading operations
    │   ├── zipExtractor.js     # ZIP/DMS extraction
    │   ├── conversationExtractor.js  # Conversation data extraction
    │   └── README.md           # Module documentation
    │
    ├── schemaConverter/        # Format conversion
    │   ├── index.js            # Schema converter public API
    │   ├── conversationConverter.js  # Main conversion coordinator
    │   ├── formatDetector.js   # Format detection logic
    │   └── formatConverters/   # Format-specific converters
    │       ├── baseConverter.js      # Base converter class
    │       ├── chatGptConverter.js   # ChatGPT format
    │       ├── claudeConverter.js    # Claude format
    │       └── genericConverter.js   # Fallback generic format
    │
    ├── viewer/                 # Conversation viewing UI
    │   ├── index.js            # Viewer module public API
    │   ├── viewerCore.js       # Main viewer coordinator
    │   ├── conversationManager.js  # Data management
    │   ├── messageRenderer.js  # Message rendering
    │   ├── fuzzySearch.js      # Fuzzy search implementation
    │   ├── paginationComponent.js  # Pagination UI
    │   └── uiController.js     # DOM interactions
    │
    ├── license/                # License & feature gating
    │   ├── index.js            # License module public API
    │   ├── licenseConfig.js    # Premium feature definitions
    │   ├── featureManager.js   # Feature availability checking
    │   ├── uiHelpers.js        # UI components for license prompts
    │   └── README.md           # Detailed license module documentation
    │
    └── utils/                  # Shared utilities
        ├── index.js            # Utils module public API
        ├── urlUtils.js         # URL parameter handling
        ├── formatUtils.js      # Date/time formatting
        ├── textUtils.js        # Text processing utilities
        ├── uiUtils.js          # UI manipulation helpers
        ├── performanceUtils.js # Performance utilities
        ├── markdownUtils.js    # Markdown rendering
        ├── clipboardUtils.js   # Clipboard operations
        ├── idUtils.js          # ID generation
        ├── scrollUtils.js      # Scrolling & virtual scrolling
        ├── databaseUtils.js    # Database-related utilities
        └── antArtifactHandler.js  # Anthropic artifact handling
```

---

## Module System

### JavaScript Modules

ConvoKeep uses **ES6 native modules** (`import`/`export`). Key principles:

1. **Each module exports a public API** through `index.js`
2. **Internal implementation files** are imported but not re-exported
3. **Circular dependencies are avoided** through careful module organization
4. **Modules are loaded via `<script type="module">`** in HTML

### Module Entry Points

Every major module has an `index.js` that serves as the **public API gateway**:

```javascript
// js/database/index.js
import { DatabaseManager } from './databaseManager.js';

const dbManager = new DatabaseManager();

export async function initDb() {
  return dbManager.init();
}

export async function storeConversations(conversations, progressCallback) {
  return dbManager.storeConversations(conversations, progressCallback);
}
// ... other exports
```

### Import/Export Patterns

**Named Exports** (preferred):
```javascript
export function myFunction() { }
export const myConstant = 42;
```

**Default Exports** (used sparingly):
```javascript
export default viewerCore;
```

**Re-exports**:
```javascript
export { initDb, storeConversations } from './database/index.js';
```

---

## Data Flow

### 1. File Upload Flow

```
User uploads ZIP/DMS file
    ↓
app.js: handleFile()
    ↓
fileProcessor: processFile()
    ├→ fileReader: Read file as ArrayBuffer
    ├→ zipExtractor: Extract ZIP contents
    └→ conversationExtractor: Parse JSON files
    ↓
schemaConverter: convertToUnifiedSchema()
    ├→ formatDetector: Detect conversation format
    └→ formatConverters: Convert to unified schema
    ↓
database: storeConversations()
    └→ conversationRepository: Save to IndexedDB
    ↓
Page reload to display new data
```

### 2. Conversation Viewing Flow

```
Page loads
    ↓
js/index.js: init()
    ├→ app.js: init() - Setup upload handlers
    ├→ viewer: init() - Initialize viewer
    └→ database: initDb() - Connect to IndexedDB
    ↓
viewer: loadConversations()
    ├→ database: getConversations() - Fetch from IndexedDB
    ├→ conversationManager: processConversations()
    └→ uiController: renderConversationList()
    ↓
User selects conversation
    ↓
viewer: displayConversation()
    ├→ database: getConversationById()
    └→ messageRenderer: renderMessages()
        ├→ markdownUtils: Render markdown
        └→ highlight.js: Syntax highlighting
```

### 3. Search Flow

```
User types in search box
    ↓
fuzzySearch: debounced search()
    ↓
conversationManager: searchConversations()
    ├→ Search conversation titles
    └→ Search message content
    ↓
uiController: renderConversationList()
    └→ Display filtered results
```

---

## Development Workflow

### Getting Started

1. **Clone the repository**
2. **Open `index.html` in a modern browser**
3. **No build process required** - just edit and refresh!

### Local Development

- **Edit files directly** - changes are immediately visible on refresh
- **Use browser DevTools** for debugging and testing
- **Test in multiple browsers** (Chrome, Firefox, Safari recommended)
- **Use browser's IndexedDB inspector** to view stored data

### File Editing Guidelines

1. **Always read files before editing** to understand current implementation
2. **Maintain module boundaries** - don't mix concerns between modules
3. **Update relevant documentation** if changing module interfaces
4. **Test thoroughly** after changes, especially database operations

### Adding New Features

#### Adding a New Conversation Format

1. Create a new converter in `js/schemaConverter/formatConverters/`
2. Extend from `BaseConverter` class
3. Implement detection logic in `formatDetector.js`
4. Update `conversationConverter.js` to use the new converter
5. Test with real export files from the provider

#### Adding a New UI Component

1. Add component styles to `css/components.css`
2. Create component logic in appropriate module
3. Follow existing patterns for event handling
4. Ensure responsive design (test mobile/desktop)
5. Add accessibility attributes (ARIA labels, roles)

### Browser Compatibility Testing

Test in:
- **Chrome/Edge** (Chromium-based)
- **Firefox**
- **Safari** (especially for IndexedDB quirks)

Required features:
- IndexedDB
- ES6+ JavaScript (modules, async/await, classes)
- CSS custom properties (variables)
- Service Workers (for offline support)

---

## Coding Conventions

### JavaScript Style

#### Naming Conventions

- **Variables/Functions**: `camelCase`
  ```javascript
  const userName = 'Alice';
  function getUserData() { }
  ```

- **Classes**: `PascalCase`
  ```javascript
  class DatabaseManager { }
  class ConversationRepository { }
  ```

- **Constants**: `UPPER_SNAKE_CASE`
  ```javascript
  const DB_CONFIG = { };
  const MAX_BATCH_SIZE = 50;
  ```

- **Private/Internal**: Prefix with `_` (convention only)
  ```javascript
  _internalMethod() { }
  ```

#### Function Documentation

Use JSDoc comments for public functions:

```javascript
/**
 * Store conversations in the database
 * @param {Array|Object} conversations - Conversations to store
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} Results of the storage operation
 */
async function storeConversations(conversations, progressCallback) {
  // Implementation
}
```

#### Error Handling

- **Always use try/catch** for async operations
- **Provide meaningful error messages** to users
- **Log errors to console** for debugging
- **Don't swallow errors silently**

```javascript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  console.error('Error in someAsyncOperation:', error);
  ui.showError(`Failed to complete operation: ${error.message}`);
  throw error; // Re-throw if caller needs to handle
}
```

#### Async/Await Pattern

Prefer `async/await` over raw Promises:

```javascript
// Good
async function loadData() {
  const db = await initDb();
  const conversations = await getConversations();
  return conversations;
}

// Avoid
function loadData() {
  return initDb()
    .then(db => getConversations())
    .then(conversations => conversations);
}
```

### CSS Style

#### Organization

CSS is split into modular files:
- **variables.css**: Theme colors, spacing, typography
- **base.css**: Resets, base element styles
- **layout.css**: Grid, flexbox, structural layouts
- **components.css**: Reusable UI components
- **utilities.css**: Helper classes (`.hidden`, `.text-center`, etc.)

#### Naming Convention

Use **BEM-inspired** naming:

```css
/* Component */
.conversation-item { }

/* Element */
.conversation-item-title { }
.conversation-item-meta { }

/* Modifier */
.conversation-item--active { }
.conversation-item--archived { }
```

#### CSS Custom Properties

Theme variables use the Catppuccin naming convention:

```css
:root[data-theme="light"] {
  --ctp-base: #eff1f5;      /* Latte base */
  --ctp-text: #4c4f69;      /* Latte text */
  --ctp-accent: #7287fd;    /* Latte lavender */
}

:root[data-theme="dark"] {
  --ctp-base: #1e1e2e;      /* Mocha base */
  --ctp-text: #cdd6f4;      /* Mocha text */
  --ctp-accent: #b4befe;    /* Mocha lavender */
}
```

### HTML Conventions

#### Semantic HTML

Use semantic elements:
```html
<header>, <nav>, <main>, <article>, <aside>, <footer>, <section>
```

#### Accessibility

- **Always include ARIA labels** for interactive elements
- **Use proper heading hierarchy** (h1 → h2 → h3)
- **Include alt text** for images
- **Ensure keyboard navigation** works properly

```html
<button id="upload-button" aria-label="Upload conversations">
  <span class="menu-item-icon" aria-hidden="true">📁</span>
  <span class="menu-item-text">Upload Files</span>
</button>
```

---

## Common Patterns

### Database Operations

#### Initialize Database

```javascript
import { initDb } from './database/index.js';

const db = await initDb();
```

#### Store Conversations

```javascript
import { storeConversations } from './database/index.js';

const result = await storeConversations(conversations, (progress) => {
  console.log(`Progress: ${progress}%`);
});
```

#### Query Conversations

```javascript
import { getConversations } from './database/index.js';

const conversations = await getConversations({
  source: 'claude',
  sortBy: 'created_at',
  order: 'desc',
  limit: 50,
  offset: 0
});
```

### UI Updates

#### Show Status Messages

```javascript
import { ui } from './utils/index.js';

ui.showSuccess('Operation completed successfully!');
ui.showError('Something went wrong');
ui.showProcessingStatus('Processing...');
```

#### Update Progress Bar

```javascript
import { ui } from './utils/index.js';

ui.updateProgressBar(50); // 50% complete
```

### Format Conversion

#### Convert Conversations to Unified Schema

```javascript
import { processConversations } from './schemaConverter/index.js';

const unifiedConversations = processConversations(rawConversations);
```

### Unified Schema Structure

All conversations are converted to this schema:

```javascript
{
  conversation_id: string,    // Unique identifier
  title: string,              // Conversation title
  created_at: string,         // ISO 8601 timestamp
  updated_at: string,         // ISO 8601 timestamp
  source: string,             // 'chatgpt', 'claude', etc.
  model: string,              // Model name (if available)

  messages: [
    {
      id: string,             // Message ID
      role: string,           // 'user', 'assistant', 'system'
      content: string,        // Message content (text)
      created_at: string,     // ISO 8601 timestamp
      metadata: object        // Additional metadata
    }
  ],

  metadata: object            // Source-specific metadata
}
```

### Markdown Rendering

```javascript
import { createMarkdownRenderer } from './utils/index.js';

const md = createMarkdownRenderer();
const html = md.render(markdownText);
```

### Theme Management

Theme is managed by `theme.js` and persists to `localStorage`:

```javascript
// Theme is automatically initialized on page load
// Toggle is handled by the theme toggle button
// Current theme: document.documentElement.getAttribute('data-theme')
```

### Premium Features & License Gating

**IMPORTANT**: All premium features MUST be gated using the license/feature gating system to ensure they are properly hidden or disabled for unlicensed users.

ConvoKeep uses a client-side license validation system to gate premium features while maintaining the privacy-first, zero-backend architecture.

#### Defining Premium Features

Add new premium features to `js/license/licenseConfig.js`:

```javascript
export const LICENSE_CONFIG = {
  premiumFeatures: {
    EXPORT_CONVERSATIONS: 'export_conversations',
    ADVANCED_SEARCH: 'advanced_search',
    YOUR_NEW_FEATURE: 'your_new_feature',  // Add here
  },
  featureDescriptions: {
    export_conversations: 'Export conversations to JSON, Markdown, or PDF',
    advanced_search: 'Advanced search with filters and regex support',
    your_new_feature: 'Description shown to users',  // Add here
  }
};
```

#### Gate Features in HTML (Declarative)

Use `data-feature` attributes to automatically gate UI elements:

```html
<!-- Hide completely (removed from DOM) -->
<button data-feature="export_conversations">
  Export to PDF
</button>

<!-- Disable but keep visible (shows lock icon and upgrade prompt on click) -->
<button data-feature="advanced_search" data-feature-mode="disable">
  Advanced Search
</button>
```

The system automatically:
- Hides or disables elements based on license status
- Adds lock icons to disabled features
- Shows upgrade prompts when locked features are clicked
- Updates UI when license status changes

#### Gate Features in JavaScript (Programmatic)

Check feature availability before executing premium code:

```javascript
import { getFeatureManager, withFeature } from './license/index.js';

// Method 1: Check if feature is available
const featureManager = getFeatureManager();
if (featureManager.hasFeature('export_conversations')) {
  // Execute premium feature
  exportConversations();
} else {
  // Optionally show upgrade prompt
  showUpgradePrompt('export_conversations');
}

// Method 2: Use helper function (recommended)
withFeature('export_conversations', () => {
  // This code only runs if feature is unlocked
  // Automatically shows upgrade prompt if locked
  exportConversations();
});

// Method 3: Require feature (throws error if not available)
featureManager.requireFeature('export_conversations');
// Continue with premium feature code...
```

#### Complete Example: Adding a New Premium Feature

```javascript
// Step 1: Add to licenseConfig.js
premiumFeatures: {
  BATCH_DELETE: 'batch_delete',
}

// Step 2: Add button to HTML with feature gating
<button
  id="batch-delete-btn"
  data-feature="batch_delete"
  data-feature-mode="disable"
  class="button-danger">
  Delete Selected
</button>

// Step 3: Implement feature with gating
import { withFeature } from './license/index.js';

document.getElementById('batch-delete-btn').addEventListener('click', () => {
  withFeature('batch_delete', () => {
    const selected = getSelectedConversations();
    if (confirm(`Delete ${selected.length} conversations?`)) {
      deleteConversations(selected);
    }
  });
});
```

#### License System API

```javascript
import {
  getFeatureManager,
  initLicenseUI,
  showLicenseInfo,
  showUpgradePrompt
} from './license/index.js';

// Initialize license system (called once in app.js)
initLicenseUI();

// Get license status
const featureManager = getFeatureManager();
const status = featureManager.getLicenseStatus();
console.log(status.isLicensed);  // true/false
console.log(status.features);    // Array of features

// Show license info modal
showLicenseInfo();

// Show upgrade prompt for specific feature
showUpgradePrompt('export_conversations');

// Activate license (for testing - any string works currently)
featureManager.activateLicense('test-key-12345');

// Deactivate license
featureManager.deactivateLicense();
```

#### License Events

Listen for license status changes:

```javascript
window.addEventListener('licenseStatusChanged', (event) => {
  const { isLicensed, features } = event.detail;
  // Update UI based on new license status
  updateCustomUI();
});
```

#### Important Notes

- **Always gate premium features**: Use either HTML data attributes or JavaScript checks
- **Privacy-first**: All validation is client-side, no backend calls
- **Graceful degradation**: Features should degrade gracefully for unlicensed users
- **Testing**: Any non-empty string works as a license key for now
- **Future**: Cryptographic signature validation will replace simple validation
- **Documentation**: See `js/license/README.md` for comprehensive documentation

---

## Testing & Debugging

### Automated Test Suite

**IMPORTANT**: ConvoKeep uses a comprehensive vanilla JavaScript test suite. When adding features or fixing bugs, **ALWAYS write tests**.

#### Running Tests

**Node.js (Preferred for Development):**
```bash
npm test
# or
node tests/run.js
```

**Browser (For Visual Testing):**
```bash
# Option 1: Direct open
open tests/index.html

# Option 2: Serve locally
python3 -m http.server 8000
# Visit: http://localhost:8000/tests/
```

#### Test Suite Overview

The test suite includes **216+ tests** covering:

- **Utility Functions** (`tests/utils/`)
  - Date/time formatting
  - Text processing and sanitization
  - ID generation and hashing

- **Schema Converters** (`tests/schemaConverter/`)
  - Format detection (ChatGPT, Claude, ConvoKeep)
  - Data conversion and normalization

- **Integration Tests** (`tests/integration/`)
  - End-to-end workflows
  - Component interaction

#### Writing Tests for New Features

**REQUIRED**: Every new feature MUST include tests. Follow this workflow:

1. **Create test file** in appropriate directory:
   ```
   tests/
   ├── utils/           # For utility functions
   ├── schemaConverter/ # For converters
   ├── integration/     # For multi-component features
   └── viewer/          # For UI components (when applicable)
   ```

2. **Write tests using the test runner**:
   ```javascript
   import { TestRunner, assert } from '../testRunner.js';
   import { myFunction } from '../../js/myModule.js';

   const suite = new TestRunner('myModule');

   suite.test('handles valid input', () => {
     const result = myFunction('test');
     assert.equals(result, 'expected');
   });

   suite.test('handles edge cases', () => {
     assert.throws(() => myFunction(null));
   });

   export default suite;
   ```

3. **Add to test runners**:
   - Add import to `tests/index.html` (browser runner)
   - Add to `testSuites` array in `tests/run.js` (Node.js runner)

4. **Run tests before committing**:
   ```bash
   npm test  # All tests must pass
   ```

#### Available Assertions

```javascript
// Equality
assert.equals(actual, expected, message);
assert.deepEquals(obj1, obj2, message);

// Truthiness
assert.truthy(value, message);
assert.falsy(value, message);

// Type checking
assert.isType(value, 'string', message);
assert.isInstanceOf(obj, ClassName, message);

// Arrays
assert.arrayIncludes(array, item, message);
assert.arrayLength(array, length, message);

// Strings
assert.stringContains(str, substring, message);
assert.stringMatches(str, /regex/, message);

// Error handling
assert.throws(fn, message);
await assert.rejects(promise, message);

// See tests/README.md for complete reference
```

#### Test Best Practices

✅ **DO:**
- Write tests **before** or **alongside** feature implementation (TDD)
- Test edge cases (null, undefined, empty, invalid input)
- Keep tests isolated (no shared state between tests)
- Use descriptive test names
- Test one thing per test

❌ **DON'T:**
- Skip writing tests (no exceptions!)
- Write tests that depend on other tests
- Test implementation details (test behavior, not internals)
- Leave tests skipped for long periods
- Use external dependencies in tests

#### Test Coverage Requirements

- **New features**: Must have unit tests
- **Bug fixes**: Must have regression tests
- **Refactoring**: Existing tests must pass
- **API changes**: Update affected tests

#### Test Documentation

For detailed testing documentation, see:
- `tests/README.md` - Comprehensive testing guide
- `tests/testRunner.js` - Framework API reference

### Browser DevTools

#### IndexedDB Inspection

1. Open DevTools → Application → Storage → IndexedDB
2. View `convokeep-db` database
3. Inspect `conversations` object store

#### Console Debugging

Enable verbose logging:
```javascript
console.log('Debug info:', data);
console.error('Error occurred:', error);
console.table(arrayOfObjects); // Displays array as table
```

#### Network Monitoring

Monitor CDN resource loading:
- JSZip
- Markdown-it
- Highlight.js
- Catppuccin themes

### Common Issues

#### Database Not Initializing

- Check browser supports IndexedDB
- Clear existing database and try again
- Check console for quota exceeded errors

#### File Upload Failing

- Verify file is .zip or .dms format
- Check file contains valid JSON
- Ensure JSZip library loaded successfully

#### Conversations Not Displaying

- Check URL parameters (`?conversation_id=...`)
- Verify data exists in IndexedDB
- Check console for rendering errors

### Performance Profiling

Use Chrome DevTools Performance tab:
1. Start recording
2. Perform action (upload, search, scroll)
3. Stop recording
4. Analyze timeline for bottlenecks

---

## Important Constraints

### No Build System

- **No transpilation** - write modern JavaScript that browsers support
- **No bundling** - use native ES6 modules
- **No preprocessing** - use standard CSS

### Browser APIs Only

- **No Node.js APIs** - code runs in browser only
- **No server-side code** - everything is client-side
- **No external API calls** - except CDN resources

### Privacy Requirements

- **No tracking scripts** - absolutely zero analytics
- **No external data storage** - all data stays in IndexedDB
- **No cookies** - use localStorage for preferences only
- **No user identification** - completely anonymous

### Security Considerations

- **Content Security Policy** enforced in `index.html`
- **No eval()** or similar dynamic code execution
- **Sanitize user input** when rendering
- **Use HTTPS** in production

### Performance Goals

- **Fast initial load** - minimal JavaScript on first paint
- **Responsive UI** - operations don't block user interaction
- **Efficient pagination** - handle thousands of conversations
- **Virtual scrolling** - handle long message threads

---

## IndexedDB Schema

### Database Configuration

```javascript
// js/database/dbConfig.js
export const DB_CONFIG = {
  name: 'convokeep-db',
  version: 2,
  stores: {
    conversations: 'conversations'
  },
  indexes: [
    { name: 'by_conversation_id', keyPath: 'conversation_id', unique: true },
    { name: 'by_source', keyPath: 'source', unique: false },
    { name: 'by_created_at', keyPath: 'created_at', unique: false },
    { name: 'by_updated_at', keyPath: 'updated_at', unique: false },
    { name: 'by_model', keyPath: 'model', unique: false },
    { name: 'by_title', keyPath: 'title', unique: false }
  ],
  batchSize: 50,
  searchFuzzyThreshold: 0.7
};
```

### Schema Migrations

When updating database schema:
1. Increment `DB_CONFIG.version`
2. Add migration logic in `dbConnector.js`'s `onupgradeneeded` handler
3. Test with existing data to ensure no data loss

---

## Key Files Reference

### Entry Points

- **index.html**: HTML entry point, loads all resources
- **js/index.js**: JavaScript entry point, initializes app
- **css/main.css**: CSS entry point, imports all styles

### Core Modules

- **js/app.js**: Upload UI and file handling
- **js/database/**: All database operations
- **js/fileProcessor/**: File upload and processing
- **js/schemaConverter/**: Format detection and conversion
- **js/viewer/**: Conversation viewing and rendering
- **js/utils/**: Shared utility functions

### Configuration Files

- **manifest.json**: PWA manifest
- **service-worker.js**: Offline support
- **browserconfig.xml**: Microsoft browser config
- **robots.txt**: SEO configuration
- **sitemap.xml**: SEO sitemap

---

## Development Best Practices

### When Adding Features

1. ✅ **Read existing code** to understand patterns
2. ✅ **Write tests first** (TDD) or alongside implementation
3. ✅ **Follow module structure** - keep related code together
4. ✅ **Maintain separation of concerns** - data, logic, UI
5. ✅ **Write JSDoc comments** for public APIs
6. ✅ **Run test suite** (`npm test`) - all tests must pass
7. ✅ **Test in multiple browsers** before committing
8. ✅ **Update documentation** if changing interfaces
9. ✅ **Consider accessibility** - add ARIA labels
10. ✅ **Optimize for performance** - use pagination, debouncing

### When Fixing Bugs

1. ✅ **Reproduce the issue** first
2. ✅ **Write a failing test** that demonstrates the bug
3. ✅ **Check browser console** for errors
4. ✅ **Use debugger** or console.log strategically
5. ✅ **Fix the bug** - test should now pass
6. ✅ **Run full test suite** to prevent regressions
7. ✅ **Test fix thoroughly** in multiple browsers
8. ✅ **Consider edge cases** - empty data, large datasets, etc.

### When Refactoring

1. ✅ **Run existing tests** to establish baseline
2. ✅ **Understand current behavior** completely
3. ✅ **Make small, incremental changes**
4. ✅ **Run tests after each change** - they should still pass
5. ✅ **Don't change too much at once**
6. ✅ **Preserve backward compatibility** where possible
7. ✅ **Update tests** if API changes

---

## Useful Commands

### Testing

```bash
# Run all tests (required before commits)
npm test

# Run tests with Node.js directly
node tests/run.js

# Open browser test runner
open tests/index.html
```

### Local Development

```bash
# Serve locally (optional, can just open index.html)
python3 -m http.server 8000
# or
npx http-server -p 8000
```

### Browser DevTools Shortcuts

- **Open DevTools**: `F12` or `Cmd+Opt+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Console**: `Cmd+Opt+J` (Mac) / `Ctrl+Shift+J` (Windows)
- **Sources**: `Cmd+Opt+P` (Mac) / `Ctrl+Shift+P` (Windows)

### IndexedDB Clear (Console)

```javascript
// Delete database (requires page reload)
indexedDB.deleteDatabase('convokeep-db');

// Or use the reset button in UI
```

---

## Additional Resources

### External Documentation

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Markdown-it](https://github.com/markdown-it/markdown-it)
- [Highlight.js](https://highlightjs.org/)
- [Catppuccin Theme](https://github.com/catppuccin/catppuccin)

### Project Files

- **README.md**: User-facing documentation
- **js/fileProcessor/README.md**: File processor module docs
- **GitHub Repository**: (if applicable)

---

## Quick Reference: Common Tasks

### Task: Add a new conversation format support

1. Create `js/schemaConverter/formatConverters/newFormatConverter.js`
2. Extend `BaseConverter` class
3. Implement `detect()` and `convert()` methods
4. Add detection logic to `formatDetector.js`
5. Update `conversationConverter.js` to include new converter
6. Test with real export file

### Task: Add a new database index

1. Edit `js/database/dbConfig.js`
2. Add new index to `DB_CONFIG.indexes` array
3. Increment `DB_CONFIG.version`
4. Add migration logic in `dbConnector.js`
5. Test migration with existing data

### Task: Add a new UI component

1. Add styles to `css/components.css`
2. Create HTML structure in `index.html` or dynamically
3. Add JavaScript logic to appropriate module
4. Wire up event handlers
5. Test responsive behavior (mobile/desktop)
6. Add accessibility attributes

### Task: Modify the unified schema

1. Update schema definition in this document
2. Update all converters to produce new schema
3. Increment database version
4. Add migration logic to handle old data
5. Update all code that reads/writes schema
6. Test thoroughly with old and new data

---

## Troubleshooting Guide

### Issue: "Database failed to initialize"

**Possible Causes:**
- Browser doesn't support IndexedDB
- Database quota exceeded
- Corrupt database

**Solutions:**
- Check `window.indexedDB` exists
- Clear IndexedDB storage
- Try different browser

### Issue: "File upload not working"

**Possible Causes:**
- JSZip not loaded
- Invalid file format
- File too large

**Solutions:**
- Check network tab for JSZip load errors
- Verify file is .zip or .dms
- Check browser console for specific errors

### Issue: "Conversations not displaying"

**Possible Causes:**
- Database empty
- Rendering error
- URL parameter issue

**Solutions:**
- Check IndexedDB has data
- Check console for JavaScript errors
- Clear URL parameters and reload

---

## Conclusion

This guide should help you understand the ConvoKeep codebase and contribute effectively. Remember:

- **Privacy first** - never add tracking or external data storage
- **Keep it simple** - no frameworks, no build systems
- **Maintain modularity** - follow existing patterns
- **Test thoroughly** - especially database operations
- **Document changes** - update this guide if needed

For questions or clarifications, refer to the code itself - it's well-commented and follows consistent patterns throughout.

Happy coding! 🚀
