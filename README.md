# ConvoKeep

**Privacy-first AI conversation archive** - Store, organize, and search your ChatGPT, Claude, and other AI conversations locally in your browser.

![ConvoKeep](./public/assets/convokeeplogo.png)

## Features

### 🔒 Privacy First
- **100% Local Storage** - All conversations stored in your browser's IndexedDB
- **No Server Required** - Everything runs client-side
- **Your Data Stays Yours** - No tracking, no analytics, no cloud sync

### 🎨 Modern Interface
- **SolidJS + Tailwind** - Fast, reactive UI with modern design
- **Dark/Light Mode** - Seamless theme switching
- **Responsive Design** - Works on desktop and mobile

### 🔍 Powerful Search
- **Fuzzy Search** - Find conversations even with typos
- **Advanced Filters** - Filter by source, date, tags, starred, archived
- **Real-time Results** - Instant search as you type

### 📁 Multi-Format Support
- **ChatGPT** - ZIP exports and JSON files
- **Claude** - JSON conversation exports
- **Generic** - Standard conversation formats
- **Extensible** - Easy to add new formats

### 🏷️ Organization
- **Tags** - Organize conversations with custom tags
- **Star/Archive** - Mark important conversations
- **Batch Operations** - Bulk tag, star, archive, or delete
- **Smart Sorting** - Sort by date, title, or custom order

### 💾 Reliable Storage
- **Persistent Storage** - Request browser permission for data persistence
- **Batch Import** - Import thousands of conversations
- **Progress Tracking** - Visual feedback during imports
- **Automatic Backup** - Export your entire archive

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm serve
```

### Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui
```

## Architecture

### Tech Stack
- **SolidJS 1.9.9** - Fine-grained reactive framework (~7KB)
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **TypeScript 5.9** - Type-safe development
- **Vite 7.1** - Lightning-fast build tool
- **IndexedDB** - Browser-native database
- **Vitest** - Unit testing framework

### Project Structure

```
convokeep/
├── src/
│   ├── components/        # UI components
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── MessageViewer.tsx
│   │   ├── FilterBar.tsx
│   │   ├── FuzzySearch.tsx
│   │   ├── Pagination.tsx
│   │   └── UploadModal.tsx
│   │
│   ├── contexts/          # State management
│   │   ├── ConversationContext.tsx
│   │   ├── BatchOperationsContext.tsx
│   │   ├── TagContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── database/          # IndexedDB layer
│   │   ├── dbConnector.js
│   │   ├── conversationRepository.js
│   │   └── databaseManager.js
│   │
│   ├── fileProcessor/     # File import logic
│   │   ├── fileProcessor.js
│   │   ├── zipExtractor.js
│   │   └── conversationExtractor.js
│   │
│   ├── schemaConverter/   # Format converters
│   │   ├── formatDetector.js
│   │   └── formatConverters/
│   │       ├── chatGptConverter.js
│   │       ├── claudeConverter.js
│   │       └── genericConverter.js
│   │
│   ├── utils/             # Utility functions
│   │   ├── formatUtils.js
│   │   ├── markdownUtils.js
│   │   └── idUtils.js
│   │
│   ├── styles/            # CSS styles
│   └── App.tsx            # Root component
│
├── public/                # Static assets
├── tests/                 # Test files
└── vite.config.ts         # Vite configuration
```

## Usage Guide

### Importing Conversations

1. **Export from AI Service**
   - ChatGPT: Settings → Data Controls → Export Data
   - Claude: Projects → Export Conversations

2. **Upload to ConvoKeep**
   - Click "Upload" button
   - Drag & drop or browse for file
   - Supports .zip, .json, .txt formats

3. **Automatic Processing**
   - ConvoKeep detects format automatically
   - Shows progress during import
   - Deduplicates existing conversations

### Organizing Conversations

- **Star**: Click ⭐ icon to mark important conversations
- **Archive**: Archive old conversations to reduce clutter
- **Tags**: Add custom tags for categorization
- **Batch Operations**: Select multiple conversations for bulk actions

### Searching

- **Fuzzy Search**: Type in search box - finds matches even with typos
- **Filter by Source**: ChatGPT, Claude, Gemini, etc.
- **Filter by Date**: Newest/oldest first
- **Filter by Status**: Starred or archived only
- **Filter by Tags**: Click tags to filter

### Keyboard Shortcuts

- `↑` / `↓` - Navigate search results
- `Enter` - Select result
- `Esc` - Close search / Clear selection

## Performance

### Bundle Size
```
Vendor (SolidJS):    6.28 kB (gzipped: 2.54 kB)
Database Layer:     20.21 kB (gzipped: 4.96 kB)
Application:        35.13 kB (gzipped: 11.58 kB)
CSS:                52.15 kB (gzipped: 10.21 kB)
────────────────────────────────────────────────
Total:             ~114 kB (gzipped: ~29 kB)
```

### Features
- ⚡ Fast initial load (~29KB gzipped)
- 🔄 Hot module reload in development
- 📦 Code splitting for optimal loading
- 🎯 Fine-grained reactivity - only updates what changed
- 💾 Handles thousands of conversations smoothly

## Migration from Vanilla JS

This project was successfully migrated from Vanilla JavaScript to SolidJS. See [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) for details.

### Benefits Achieved
- 60% less UI code
- Better performance with fine-grained reactivity
- Type safety with TypeScript
- No memory leaks (automatic cleanup)
- Improved developer experience

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires IndexedDB support.

## Privacy & Security

- **No Analytics** - Zero tracking or telemetry
- **No Network Requests** - All processing happens locally
- **Open Source** - Audit the code yourself
- **No Account Required** - No sign-up, no authentication

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Development

### Adding a New Format Converter

1. Create converter in `src/schemaConverter/formatConverters/`
2. Implement `BaseConverter` interface
3. Register in `formatDetector.js`
4. Add tests

### Adding a New Component

1. Create component in `src/components/`
2. Use TypeScript for type safety
3. Import required contexts
4. Add tests in `__tests__/`

## License

MIT License - See [LICENSE](./LICENSE) for details

## Acknowledgments

- Built with [SolidJS](https://solidjs.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Lucide](https://lucide.dev)

## Support

- 📖 [Documentation](./SOLIDJS_MIGRATION_GUIDE.md)
- 🐛 [Report Issues](https://github.com/cwahlfeldt/convokeeper/issues)
- 💬 [Discussions](https://github.com/cwahlfeldt/convokeeper/discussions)

---

**Made with ❤️ for privacy-conscious AI users**
