/**
 * Ant Artifact Handler
 * 
 * This module handles the parsing of Ant Artifacts in conversation messages
 * and converts them to markdown code blocks for the markdown parser.
 */

/**
 * Parse content for Ant Artifacts and convert to markdown code blocks
 * @param {string} content - The content to parse
 * @returns {string} - The content with Ant Artifacts converted to markdown code blocks
 */
export function parseAntArtifacts(content) {
  if (!content || typeof content !== 'string') {
    return content;
  }

  // First check for p tags before artifacts to extract potential filenames
  const contentWithContext = addContextToArtifacts(content);

  // Simple regex to detect Ant Artifacts
  // This looks for <antArtifact...>...</antArtifact> tags
  const artifactRegex = /<antArtifact\s+([^>]*)>([\s\S]*?)<\/antArtifact>/g;

  // Replace artifacts with markdown code blocks
  return contentWithContext.replace(artifactRegex, (match, attributesStr, artifactContent) => {
    try {
      // Parse the attributes
      const attributes = parseAttributes(attributesStr);

      // Convert to markdown code block
      return convertToMarkdownCodeBlock(attributes, artifactContent);
    } catch (error) {
      console.error('Error parsing Ant Artifact:', error);
      // Return the original match if there's an error
      return match;
    }
  });
}

/**
 * Add context information from surrounding paragraphs to artifacts
 * @param {string} content - The original content
 * @returns {string} - Content with context information added to artifacts
 */
function addContextToArtifacts(content) {
  // Look for patterns like <p>filename.ext</p><antArtifact ...>
  const contextRegex = /<p>([^<]+)<\/p>\s*<antArtifact/g;

  // Replace to add the filename as a data attribute and add a class to the paragraph
  return content.replace(contextRegex, (match, pContent) => {
    // Clean up the paragraph content
    const filename = pContent.trim();

    // Add the filename as a data attribute to the artifact tag and class to paragraph
    return `<antArtifact data-filename="${filename}"`;
  });
}

/**
 * Parse the attributes string into an object with security considerations
 * @param {string} attributesStr - The attributes string
 * @returns {Object} - The parsed attributes
 */
function parseAttributes(attributesStr) {
  const attributes = {};

  // Match all attribute="value" pairs
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let attrMatch;

  while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
    const [_, attrName, attrValue] = attrMatch;
    // Only allow known safe attributes and sanitize values
    if (isAllowedAttribute(attrName)) {
      attributes[attrName] = sanitizeAttributeValue(attrName, attrValue);
    }
  }

  return attributes;
}

/**
 * Check if an attribute is allowed (security measure)
 * @param {string} attrName - Attribute name to check
 * @returns {boolean} - Whether the attribute is allowed
 */
function isAllowedAttribute(attrName) {
  // Only allow specific attributes that we need
  const allowedAttributes = [
    'type', 'language', 'title', 'identifier', 'data-filename'
  ];
  
  return allowedAttributes.includes(attrName);
}

/**
 * Sanitize attribute value based on attribute name
 * @param {string} attrName - Attribute name
 * @param {string} value - Attribute value to sanitize
 * @returns {string} - Sanitized value
 */
function sanitizeAttributeValue(attrName, value) {
  if (!value) return '';
  
  // Basic HTML encoding for all attribute values
  let sanitized = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Additional sanitization based on attribute type
  if (attrName === 'type') {
    // Only allow specific MIME types
    const allowedTypes = [
      'application/vnd.ant.code',
      'text/markdown',
      'text/html',
      'image/svg+xml',
      'application/vnd.ant.mermaid',
      'application/vnd.ant.react'
    ];
    
    if (!allowedTypes.includes(sanitized)) {
      sanitized = 'text/plain';
    }
  } else if (attrName === 'language') {
    // Use alphanumeric and common punctuation only
    sanitized = sanitized.replace(/[^a-zA-Z0-9-+#.]/g, '');
  }
  
  return sanitized;
}

/**
 * Convert an Ant Artifact to a markdown code block with proper sanitization
 * @param {Object} attributes - The artifact attributes
 * @param {string} content - The artifact content
 * @returns {string} - The markdown code block
 */
function convertToMarkdownCodeBlock(attributes, content) {
  const { type, language, title } = attributes;

  // Sanitize content to protect against code injection
  // We're not using dangerouslySetInnerHTML so we need to make sure content is safe
  const sanitizedContent = sanitizeContent(content);
  
  // Determine language for code fence
  let codeLanguage = language || '';
  
  // Validate language is safe (only allow alphanumeric characters)
  if (codeLanguage && !/^[a-zA-Z0-9-]+$/.test(codeLanguage)) {
    codeLanguage = 'plaintext';
  }

  // If no language specified, determine from type
  if (!codeLanguage) {
    switch (type) {
      case 'application/vnd.ant.code':
        codeLanguage = 'plaintext';
        break;
      case 'text/markdown':
        codeLanguage = 'markdown';
        break;
      case 'text/html':
        codeLanguage = 'html';
        break;
      case 'image/svg+xml':
        codeLanguage = 'xml';
        break;
      case 'application/vnd.ant.mermaid':
        codeLanguage = 'mermaid';
        break;
      case 'application/vnd.ant.react':
        codeLanguage = 'jsx';
        break;
      default:
        codeLanguage = 'plaintext';
    }
  }

  // Add filename as first line inside code block if available
  let codeHeader = '';
  if (title) {
    // Sanitize title
    const safeTitle = sanitizeTitle(title);
    codeHeader = `// ${safeTitle}\n`;
  }

  // Format title outside the code block if available
  let titleHeader = '';
  if (title) {
    // Sanitize title
    const safeTitle = sanitizeTitle(title);
    titleHeader = `**${safeTitle}**\n\n`;
  }

  // Format as markdown code block with title outside
  return `${titleHeader}\`\`\`${codeLanguage}\n${codeHeader}${sanitizedContent}\n\`\`\`\n`;
}

/**
 * Sanitize content to prevent code injection
 * @param {string} content - Content to sanitize
 * @returns {string} - Sanitized content
 */
function sanitizeContent(content) {
  if (!content) return '';
  
  // For code blocks, we don't want to escape everything as it would
  // break the formatting, but we do need to prevent specific injection vectors
  
  // Prevent crafted markdown escape sequences
  // This blocks attempts to break out of code blocks with crafted content
  return content
    // Ensure backtick sequences don't break out of our code fence
    .replace(/`{3,}/g, (match) => match.substring(0, 2) + '‌' + match.substring(2))
    // Ensure no dangerous HTML gets executed if markdown renderer has HTML enabled
    .replace(/<(script|iframe|object|embed|applet)/gi, '&lt;$1');
}

/**
 * Sanitize title to prevent injection
 * @param {string} title - Title to sanitize
 * @returns {string} - Sanitized title
 */
function sanitizeTitle(title) {
  if (!title) return '';
  
  // For titles that may appear in markdown, we need to escape markdown syntax
  return title
    .replace(/[*_`~<>[\]]/g, '\\$&') // Escape markdown syntax
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}
