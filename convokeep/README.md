# ConvoKeep

A client-side web application for uploading, parsing, and storing conversation data from LLM providers (such as ChatGPT and Claude) into IndexedDB. ConvoKeep helps you maintain a personal, private archive of your AI conversations.

## Overview

ConvoKeep is designed to be a fully client-side solution for managing your AI conversation history. It requires no server, API keys, or cloud storage - all data stays in your browser's IndexedDB storage. The application automatically detects and converts different conversation formats into a unified schema, making it easy to browse, search, and view your conversations from multiple providers in one interface.

## Features

- **Privacy-First Design**: All processing happens in your browser; no data is sent to any servers
- **Multiple Source Support**: Compatible with ChatGPT and Claude exports, with extensible architecture for more providers
- **Unified Format**: Automatically detects and converts different conversation formats to a standardized schema
- **Rich Search**: Search through conversation titles and message content with keyword highlighting
- **Filters & Sorting**: Filter by source (ChatGPT/Claude) and sort by date
- **Markdown Rendering**: Proper rendering of markdown content with syntax highlighting for code
- **Pagination**: Efficiently handle large conversation histories with pagination
- **Theme Support**: Light and dark mode with automatic OS preference detection
- **Responsive Design**: Works on various screen sizes from desktop to mobile
- **Offline Capable**: Once loaded, the application can function without an internet connection

## Technical Architecture

### Core Modules

- **app.js**: Application initialization and file upload handling
- **database.js**: IndexedDB operations and data management
- **fileProcessor.js**: File extraction and processing using JSZip
- **schemaConverter.js**: Format detection and conversion to unified schema
- **viewer.js**: Conversation browsing and viewing UI controller
- **utils.js**: Shared utility functions (formatters, text processing, UI helpers)
- **theme.js**: Theme management (light/dark mode)

### Tech Stack

- **Pure JavaScript**: No frameworks or build systems - just vanilla JS for maximum longevity
- **IndexedDB**: For client-side persistent storage
- **JSZip**: For processing ZIP/DMS files
- **Markdown-it**: For rendering markdown content in messages
- **Highlight.js**: For code syntax highlighting
- **Catppuccin**: Color theme system for consistent styling across light/dark modes

## Getting Started

### Quick Start

1. Clone the repository
2. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
3. No build process or server required!

### Development Environment

The project is designed to be simple to work with:

1. Edit files directly - no build process required
2. Refresh the browser to see changes
3. Use browser devtools for debugging

### Uploading Test Data

To test the application with your own data:

1. For ChatGPT: Export your data from chat.openai.com settings
2. For Claude: Export your chat history from claude.ai
3. Upload the resulting ZIP file through the application's upload interface

## Project Structure

The project has been refactored to follow SOLID and DRY principles, with a modular architecture:

```
convokeep/
│
├── css/
│   └── style.css               # Main stylesheet with theme variables and components
│
├── js/
│   ├── viewer/                 # Conversation viewing components
│   │   ├── index.js            # Viewer module entry point
│   │   ├── viewerCore.js       # Main coordinator for viewing
│   │   ├── conversationManager.js  # Data management
│   │   ├── messageRenderer.js  # Message rendering
│   │   ├── searchHandler.js    # Search functionality
│   │   ├── uiController.js     # DOM interactions
│   │   └── README.md           # Documentation for viewer module
│   │
│   ├── fileProcessor/          # File handling components
│   │   ├── index.js            # File processor entry point
│   │   ├── fileProcessor.js    # Main file processing coordinator
│   │   ├── fileReader.js       # File reading operations
│   │   ├── zipExtractor.js     # Zip file extraction
│   │   ├── conversationExtractor.js  # Conversation data extraction
│   │   └── README.md           # Documentation for file processor
│   │
│   ├── schemaConverter/        # Format conversion components
│   │   ├── index.js            # Schema converter entry point
│   │   ├── conversationConverter.js  # Main conversion coordinator
│   │   ├── formatDetector.js   # Format detection
│   │   ├── formatConverters/   # Format-specific converters
│   │   │   ├── baseConverter.js    # Base converter with shared logic
│   │   │   ├── chatGptConverter.js # ChatGPT format converter
│   │   │   ├── claudeConverter.js  # Claude format converter
│   │   │   └── genericConverter.js # Generic format converter
│   │   └── README.md           # Documentation for schema converter
│   │
│   ├── database/               # Database components
│   │   ├── index.js            # Database module entry point
│   │   ├── databaseManager.js  # Main database coordinator
│   │   ├── dbConnector.js      # Database connection handling
│   │   ├── conversationRepository.js  # Conversation storage and retrieval
│   │   ├── searchProvider.js   # Search functionality
│   │   ├── dbConfig.js         # Database configuration
│   │   └── README.md           # Documentation for database module
│   │
│   ├── utils/                  # Utilities by category
│   │   ├── index.js            # Utility module entry point
│   │   ├── urlUtils.js         # URL parameter utilities
│   │   ├── formatUtils.js      # Date, time, formatting utilities
│   │   ├── textUtils.js        # Text processing utilities
│   │   ├── uiUtils.js          # UI manipulation utilities
│   │   ├── performanceUtils.js # Performance-related utilities
│   │   ├── markdownUtils.js    # Markdown rendering utilities
│   │   ├── clipboardUtils.js   # Clipboard operation utilities
│   │   ├── idUtils.js          # ID generation utilities
│   │   ├── scrollUtils.js      # Scrolling utilities and VirtualScroller
│   │   └── README.md           # Documentation for utilities module
│   │
│   ├── app.js                  # Application initialization & upload UI
│   ├── theme.js                # Theme switching functionality
│   ├── index.js                # Main application entry point
│   └── README.md               # Documentation for JS architecture
│
├── index.html                  # Main application HTML
└── README.md                   # This documentation
```

## Data Flow Architecture

ConvoKeep follows a clear data flow:

1. **Upload**: User uploads a ZIP/DMS file
2. **Extraction**: The file is processed by JSZip to extract JSON data
3. **Conversion**: The data format is detected and converted to the unified schema
4. **Storage**: Converted data is stored in IndexedDB
5. **Retrieval**: Data is loaded from IndexedDB for display
6. **Rendering**: Conversations are rendered with proper formatting and highlighting

## Unified Schema

The application uses a standardized schema to represent conversations from any provider:

```javascript
{
  // Core conversation properties
  conversation_id: string,       // Unique identifier
  title: string,                 // Conversation title/name
  created_at: string,            // ISO timestamp of creation
  updated_at: string,            // ISO timestamp of last update
  source: string,                // 'chatgpt', 'claude', etc.
  model: string,                 // Model used (if available)

  // Messages array
  messages: [
    {
      id: string,                // Message ID
      role: string,              // 'user', 'assistant', 'system', etc.
      content: string,           // Message content as text
      created_at: string,        // ISO timestamp
      metadata: object           // Any additional metadata
    }
  ],

  // Additional metadata
  metadata: object               // Source-specific details
}
```

## Format Detection

The application automatically detects conversation formats:

- **ChatGPT**: Identified by the presence of a `mapping` object and specific metadata structure
- **Claude**: Identified by a `chat_messages` array and specific UUID format
- **Generic**: Fallback for simple message arrays that don't match other formats

## Development Guide

### Adding Support for New Formats

To add support for a new conversation format:

1. Add a detection function in `schemaConverter.js`
2. Create a converter function for the new format
3. Update the source filtering in the viewer UI

### Database Schema Updates

If you need to update the database schema:

1. Increment the `DB_CONFIG.version` in `database.js`
2. Add migration logic in the `onupgradeneeded` event handler

### Theme Customization

The application uses CSS variables for theming:

1. Base variables are defined at the top of `style.css`
2. Light/dark theme colors use the Catppuccin palette
3. Variables are mapped to functional names in each theme section

## Performance Considerations

The application includes several optimizations for performance:

- **Pagination**: Both conversation lists and message views use pagination
- **Web Workers**: Support for processing large files in a background thread
- **Incremental Loading**: Message content is loaded incrementally for large conversations
- **Virtual Scrolling**: Implemented for efficient handling of large lists
- **Debounced Search**: Search input is debounced to prevent excessive database queries

## Browser Compatibility

The application is designed to work in modern browsers (last 2 versions):

- Chrome/Edge (Chromium-based)
- Firefox
- Safari

Required browser features:

- IndexedDB
- ES6+ JavaScript support
- CSS Variables

## Contributing

Contributions are welcome! Here are some areas that could be expanded:

- Add support for more LLM platform export formats
- Implement full text search indexing for better search performance
- Add visualization tools for conversation analytics
- Improve accessibility features
- Add export functionality to different formats

## License

This project is available for open use. Feel free to modify and build upon it.
