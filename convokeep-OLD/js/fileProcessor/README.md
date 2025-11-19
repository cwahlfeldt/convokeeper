# File Processor Module

This directory contains the refactored version of the original `fileProcessor.js` file, split into logical modules following SOLID and DRY principles.

## Overview

The original monolithic fileProcessor.js file has been refactored into several focused modules:

1. **fileProcessor.js** - The main coordinator that orchestrates the file processing workflow
2. **fileReader.js** - Handles reading files in different formats (ArrayBuffer, text, etc.)
3. **zipExtractor.js** - Specializes in extracting content from zip/dms files
4. **conversationExtractor.js** - Extracts and parses conversation data from archive content
5. **index.js** - Entry point that exports the public API

## Design Principles

### SOLID Principles

- **Single Responsibility**: Each module has one focused responsibility
- **Open/Closed**: The design allows for extending functionality without modifying existing code
- **Liskov Substitution**: Components maintain consistent interfaces
- **Interface Segregation**: Each component exposes only what's necessary
- **Dependency Inversion**: High-level modules depend on abstractions

### DRY (Don't Repeat Yourself)

Common functionality is extracted into reusable methods, eliminating code duplication.

## Key Improvements

1. **Enhanced Modularity**: Each component focuses on a specific aspect of file processing
2. **Better Error Handling**: Each module can handle its specific error cases
3. **Improved Testability**: Components can be tested in isolation
4. **Flexible Design**: New file formats or extraction methods can be added more easily
5. **Clear Responsibilities**: Each module has a well-defined, focused purpose

## Module Responsibilities

- **fileProcessor.js**: Coordinates the file processing workflow and updates progress
- **fileReader.js**: Handles different methods of reading file content
- **zipExtractor.js**: Extracts content from compressed archives using JSZip
- **conversationExtractor.js**: Parses and extracts conversation data from JSON
- **index.js**: Provides a clean public API for the module
