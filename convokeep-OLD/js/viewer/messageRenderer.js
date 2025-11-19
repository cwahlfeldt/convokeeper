/**
 * MessageRenderer - Renders messages and handles message-specific UI
 * 
 * Responsible for converting message data to DOM elements,
 * handling markdown rendering, code highlighting, and artifacts.
 */

import { parseAntArtifacts } from '../utils/antArtifactHandler.js';
import { formatters } from '../utils/formatUtils.js';
import { generateUniqueId } from '../utils/idUtils.js';

/**
 * Class to handle message rendering
 */
export class MessageRenderer {
  /**
   * @param {Function} markdownRenderer - Markdown rendering function
   */
  constructor(markdownRenderer) {
    this.markdownRenderer = markdownRenderer;
  }

  /**
   * Render a batch of messages to a container
   * @param {Array} messages - Messages to render
   * @param {HTMLElement} container - Container element
   * @param {boolean} append - Whether to append or replace content
   * @param {boolean} animate - Whether to animate new messages
   * @returns {Array} Array of created message elements
   */
  renderMessages(messages, container, append = false, animate = false) {
    if (!container) return [];

    // Clear container if not appending
    if (!append) {
      container.innerHTML = '';
    }

    // Handle empty messages
    if (!messages || messages.length === 0) {
      if (!append) {
        container.innerHTML = '<div class="empty-messages">Hmm... appears the AI was speechless for once</div>';
      }
      return [];
    }

    const createdElements = [];

    // Create and append elements for each message
    messages.forEach((message, index) => {
      const element = this.createMessageElement(message);
      if (element) {
        container.appendChild(element);
        createdElements.push(element);

        // Add animation if requested
        if (animate) {
          element.classList.add('new-item');

          // Add staggered entrance animations
          setTimeout(() => {
            element.classList.add('animate-in');
          }, index * 50);
        }
      }
    });

    return createdElements;
  }

  /**
   * Create a message element from message data
   * @param {Object} message - Message data
   * @returns {HTMLElement} - Message element
   */
  createMessageElement(message) {
    // Skip empty messages
    if (!message.content || message.content.trim() === '') {
      return null;
    }

    const element = document.createElement('div');
    element.className = `message ${message.role || 'unknown'}`;
    element.dataset.messageId = message.id || generateUniqueId('msg');

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    // Render content with markdown
    const content = document.createElement('div');
    content.className = 'message-content';

    // Parse Ant Artifacts in the content (converts to markdown code blocks)
    const contentWithParsedArtifacts = parseAntArtifacts(message.content);

    // Then render with markdown
    if (this.markdownRenderer) {
      content.innerHTML = this.markdownRenderer.render(contentWithParsedArtifacts);
    } else {
      content.textContent = contentWithParsedArtifacts;
    }

    // Add timestamp and metadata
    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const timestamp = document.createElement('span');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = formatters.time(message.created_at);

    const role = document.createElement('span');
    role.className = 'message-role';
    role.textContent = this._formatRole(message.role);

    meta.appendChild(role);
    meta.appendChild(timestamp);

    // Add copy buttons to code blocks
    this._addCopyButtonsToCodeBlocks(content);

    // Apply syntax highlighting to all code blocks
    // This must be done AFTER markdown rendering to prevent XSS warnings
    this._applySyntaxHighlighting(content);

    // Assemble the message
    bubble.appendChild(content);
    bubble.appendChild(meta);
    element.appendChild(bubble);

    return element;
  }

  /**
   * Format role name for display
   * @param {string} role - Role name
   * @returns {string} - Formatted role name
   */
  _formatRole(role) {
    if (!role) return 'Unknown';

    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  /**
   * Apply syntax highlighting to all code blocks in the container
   * IMPORTANT: This must be called AFTER content is in the DOM to prevent XSS warnings
   * @param {HTMLElement} container - The container with code blocks
   */
  _applySyntaxHighlighting(container) {
    // Find all code blocks with language classes
    const codeBlocks = container.querySelectorAll('code[class^="language-"]');

    if (window.hljs && codeBlocks.length > 0) {
      codeBlocks.forEach(block => {
        // Skip if already highlighted
        if (block.classList.contains('hljs')) {
          return;
        }

        // Get the language from the class
        const className = Array.from(block.classList).find(cls => cls.startsWith('language-'));
        const language = className ? className.replace('language-', '') : '';

        try {
          // Only apply highlighting for allowed languages - security measure
          if (language && language !== 'plaintext' &&
              this._isAllowedLanguage(language) &&
              window.hljs.getLanguage(language)) {
            // Use highlightElement which is secure when content is already escaped
            // and element is in the DOM
            window.hljs.highlightElement(block);
          } else {
            // Skip auto-detection for security (as recommended by highlight.js)
            // Just leave as-is with standard HTML escaping
          }
        } catch (e) {
          console.warn('Error highlighting code block:', e);
        }
      });
    }
  }
  
  /**
   * Check if a language is allowed for syntax highlighting (security measure)
   * @param {string} lang - Language to check
   * @returns {boolean} - Whether the language is allowed
   */
  _isAllowedLanguage(lang) {
    // List of allowed languages - should match the list in markdownUtils.js
    const allowedLanguages = [
      'javascript', 'js', 'python', 'py', 'html', 'css', 'json', 'markdown', 'md',
      'bash', 'shell', 'sh', 'typescript', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp',
      'csharp', 'cs', 'go', 'ruby', 'rb', 'rust', 'php', 'sql', 'xml', 'yaml', 'yml'
    ];
    
    return allowedLanguages.includes(lang.toLowerCase());
  }

  /**
   * Add copy buttons to code blocks
   * @param {HTMLElement} container - Container with code blocks
   */
  _addCopyButtonsToCodeBlocks(container) {
    // Get all pre elements (code blocks)
    const codeBlocks = container.querySelectorAll('pre');

    // Add copy button to each block
    codeBlocks.forEach(block => {
      // Skip if already has a copy button
      if (block.querySelector('.code-copy-btn')) {
        return;
      }

      const code = block.querySelector('code');
      const codeText = code ? code.textContent : block.textContent;

      // Skip empty blocks
      if (!codeText || codeText.trim() === '') return;

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-btn';
      copyButton.innerHTML = '<span>Copy</span>';
      copyButton.title = 'Copy code to clipboard';

      // Add button to code block
      block.appendChild(copyButton);

      // Add click handler
      copyButton.addEventListener('click', () => {
        this._copyToClipboard(codeText, copyButton);
      });
    });
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @param {HTMLElement} button - Button element to update
   */
  _copyToClipboard(text, button) {
    // Use navigator.clipboard if available, otherwise fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          button.innerHTML = '<span>Copied!</span>';
          setTimeout(() => {
            button.innerHTML = '<span>Copy</span>';
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          this._copyFallback(text, button);
        });
    } else {
      this._copyFallback(text, button);
    }
  }

  /**
   * Fallback method for copying text to clipboard
   * @param {string} text - Text to copy
   * @param {HTMLElement} button - Button element to update
   */
  _copyFallback(text, button) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = 0;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      button.innerHTML = '<span>Copied!</span>';
      setTimeout(() => {
        button.innerHTML = '<span>Copy</span>';
      }, 2000);
    } catch (err) {
      console.error('Fallback copy failed:', err);
      button.innerHTML = '<span>Error!</span>';
      setTimeout(() => {
        button.innerHTML = '<span>Copy</span>';
      }, 2000);
    }

    document.body.removeChild(textarea);
  }
}
