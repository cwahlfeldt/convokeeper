/**
 * Markdown Utilities
 *
 * Functions for rendering and processing markdown.
 */

import MarkdownIt from 'markdown-it';

/**
 * Create a markdown renderer with proper configuration and security measures
 * @returns {Object} - Configured markdown renderer
 */
export function createMarkdownRenderer() {
  // Create markdown renderer with strict security settings
  const md = MarkdownIt({
    html: false,              // Disable HTML completely for security
    breaks: true,             // Convert \n to <br>
    linkify: false,           // Don't auto-convert text to links
    typographer: true,
    highlight: function (str, lang) {
      // Properly escape the code before highlighting
      const escapedStr = escapeHtml(str);

      // Return code with language class - highlighting will be applied later in DOM
      // This prevents the "unescaped HTML" warning from highlight.js
      if (lang && isAllowedLanguage(lang)) {
        // Return with language class - messageRenderer will apply highlighting
        return `<pre><code class="language-${lang}">${escapedStr}</code></pre>`;
      }

      // No language specified - just return escaped code
      return `<pre><code>${escapedStr}</code></pre>`;
    },
  });
  
  // Enhanced link validation - only allow specific protocols
  md.validateLink = function(url) {
    const validProtocols = /^(https?|mailto):/i;
    return validProtocols.test(url);
  };
  
  // Disable potentially dangerous features
  md.disable(['image', 'html_inline', 'html_block']);
  
  return md;
}

/**
 * Check if a language is in our allowed list (security measure)
 * @param {string} lang - Language to check
 * @returns {boolean} - Whether the language is allowed
 */
function isAllowedLanguage(lang) {
  // List of allowed languages - add or remove as needed
  const allowedLanguages = [
    'javascript', 'js', 'python', 'py', 'html', 'css', 'json', 'markdown', 'md',
    'bash', 'shell', 'sh', 'typescript', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp',
    'csharp', 'cs', 'go', 'ruby', 'rb', 'rust', 'php', 'sql', 'xml', 'yaml', 'yml'
  ];
  
  return allowedLanguages.includes(lang.toLowerCase());
}

/**
 * Simple HTML escaping for security
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert plain text to markdown with basic formatting
 * @param {string} text - Plain text to convert
 * @returns {string} - Text with markdown formatting
 */
export function textToMarkdown(text) {
  if (!text) return '';
  
  // Replace URLs with markdown links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  text = text.replace(urlRegex, '[$1]($1)');
  
  // Add line breaks
  text = text.replace(/\n/g, '\n\n');
  
  return text;
}

/**
 * Strip markdown formatting from text
 * @param {string} markdown - Markdown text
 * @returns {string} - Plain text
 */
export function stripMarkdown(markdown) {
  if (!markdown) return '';
  
  return markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove emphasis
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^(?:[-*_]){3,}$/gm, '')
    // Remove list markers
    .replace(/^[\s-*+]*\s+/gm, '');
}
