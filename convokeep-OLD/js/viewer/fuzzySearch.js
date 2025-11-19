/**
 * FuzzySearchBar - A customizable search component with fuzzy matching
 * 
 * This is a vanilla JS web component that provides a search bar with fuzzy
 * search capabilities.
 */

class FuzzySearchBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Configuration with defaults
    this.minScore = 0.6; // Minimum fuzzy match score (0-1) - reduced to catch more matches
    this.maxResults = 50; // Maximum results to display - increased to show more matches
    this.debounceTime = 300; // Debounce time in ms
    this.placeholder = 'Fuzzy Search...';
    this.searchData = []; // Data to search through

    // State
    this.currentResults = [];
    this.selectedIndex = -1;
    this.debounceTimer = null;
    this.eventHandlers = {};

    // Initialize
    this.render();
    this.setupEventListeners();
  }

  // Observed attributes for configuration
  static get observedAttributes() {
    return ['placeholder', 'min-score', 'max-results', 'debounce-time', 'data'];
  }

  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'placeholder':
        this.placeholder = newValue;
        const input = this.shadowRoot.querySelector('input');
        if (input) input.placeholder = newValue;
        break;
      case 'min-score':
        this.minScore = parseFloat(newValue) || 0.3;
        break;
      case 'max-results':
        this.maxResults = parseInt(newValue) || 10;
        break;
      case 'debounce-time':
        this.debounceTime = parseInt(newValue) || 300;
        break;
      case 'data':
        try {
          const data = JSON.parse(newValue);
          this.setSearchData(data);
        } catch (e) {
          console.error('Invalid JSON data in data attribute', e);
        }
        break;
    }
  }

  // Initial render
  render() {
    // Link external stylesheet for Shadow DOM
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'css/fuzzy-search.css');

    // Create content container
    const container = document.createElement('div');
    container.classList.add('search-container');
    container.innerHTML = /*html*/`
      <input type="text" class="search-input" placeholder="${this.placeholder}">
      <button type="button" class="clear-button" aria-label="Clear search">×</button>
      <div class="search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <div class="search-results">
        <!-- Results will be populated here -->
      </div>
    `;

    // Append to shadow root
    this.shadowRoot.appendChild(linkElem);
    this.shadowRoot.appendChild(container);
  }

  // Set up event listeners
  setupEventListeners() {
    const input = this.shadowRoot.querySelector('.search-input');
    const clearButton = this.shadowRoot.querySelector('.clear-button');
    const resultsContainer = this.shadowRoot.querySelector('.search-results');

    // Input event for search
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this.updateClearButton();

      // Debounce search
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.search(query);
      }, this.debounceTime);
    });

    // Focus/blur events for results dropdown
    input.addEventListener('focus', () => {
      if (input.value.trim() && this.currentResults.length > 0) {
        this.showResults();
      }
    });

    // Handle clear button
    clearButton.addEventListener('click', () => {
      input.value = '';
      this.updateClearButton();
      this.hideResults();
      input.focus();

      // Dispatch clear event
      this.dispatchEvent(new CustomEvent('search-cleared'));
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      if (this.currentResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentResults.length - 1);
          this.updateSelectedResult();
          break;

        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          this.updateSelectedResult();
          break;

        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex >= 0) {
            this.selectResult(this.currentResults[this.selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          this.hideResults();
          break;
      }
    });

    // Prevent close on result click
    resultsContainer.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    // Handle clicks outside the component - store reference for cleanup
    this._handleOutsideClick = (e) => {
      if (!this.contains(e.target)) {
        this.hideResults();
      }
    };
    document.addEventListener('click', this._handleOutsideClick);
  }

  // Update clear button visibility
  updateClearButton() {
    const input = this.shadowRoot.querySelector('.search-input');
    const clearButton = this.shadowRoot.querySelector('.clear-button');

    if (input.value.trim()) {
      clearButton.classList.add('visible');
    } else {
      clearButton.classList.remove('visible');
    }
  }

  // Search function that uses fuzzy matching
  search(query) {
    if (!query) {
      this.currentResults = [];
      this.hideResults();

      // Dispatch empty search event
      this.dispatchEvent(new CustomEvent('search-changed', {
        detail: { query: '', results: [] }
      }));

      return;
    }

    // Increase minimum score for short queries to avoid false positives
    const effectiveMinScore = query.length <= 3 ? Math.max(this.minScore, 0.5) : this.minScore;

    // Start timing for performance monitoring
    const startTime = performance.now();

    // Perform fuzzy search
    const results = this.searchData
      .map(item => {
        // Search in title (high priority)
        const titleScore = this.fuzzyMatch(query, item.title);

        // Use best match score
        const finalScore = Math.max(titleScore);

        // For content matches, include debug info showing matched section
        // let matchDebug = null;
        // if (finalScore > effectiveMinScore) {
        //   matchDebug = this.findMatchContext(query, item.content);
        // }

        return {
          ...item,
          score: finalScore,
          matchType: 'title',
          // matchDebug
        };
      })
      .filter(item => item.score > effectiveMinScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxResults);

    this.currentResults = results;
    this.selectedIndex = -1;

    // Log performance for large datasets
    const endTime = performance.now();
    if (this.searchData.length > 100 || endTime - startTime > 100) {

    }

    // Update UI
    this.renderResults(query);

    // Dispatch results event
    this.dispatchEvent(new CustomEvent('search-changed', {
      detail: { query, results }
    }));
  }

  // Fuzzy matching algorithm
  fuzzyMatch(pattern, str) {
    if (!pattern || !str) return 0;

    // For very large strings, extract chunks around exact matches first
    if (str.length > 10000) {
      return this.fuzzyMatchLargeText(pattern, str);
    }

    // Case-insensitive match
    pattern = pattern.toLowerCase();
    str = str.toLowerCase();

    // Fast fail if pattern is longer than string
    if (pattern.length > str.length) return 0;

    // Exact match bonus
    if (str.includes(pattern)) {
      return 0.9 + (pattern.length / str.length) * 0.1;
    }

    let score = 0;
    let patternIdx = 0;
    let prevMatchIdx = -1;
    let inSequenceBonus = 0;

    // Walk through pattern and find matches
    for (let i = 0; i < pattern.length; i++) {
      const patternChar = pattern[i];
      let found = false;

      // Look for this character in the remaining string
      for (let j = prevMatchIdx + 1; j < str.length; j++) {
        if (str[j] === patternChar) {
          // Match found!
          found = true;

          // Calculate match score based on position and adjacency
          const positionScore = 1 - (j / str.length);

          // Bonus for adjacent matches
          if (prevMatchIdx !== -1 && j === prevMatchIdx + 1) {
            inSequenceBonus += 0.15;
          } else {
            inSequenceBonus = 0;
          }

          score += positionScore + inSequenceBonus;

          prevMatchIdx = j;
          break;
        }
      }

      // If any character isn't found, return 0
      if (!found) return 0;
    }

    // Normalize score
    const maxPossibleScore = pattern.length * (1 + 0.15 * (pattern.length - 1));
    return score / maxPossibleScore;
  }

  // Specialized fuzzy match for large text content
  fuzzyMatchLargeText(pattern, text) {
    // Case-insensitive match
    pattern = pattern.toLowerCase();
    const lowerText = text.toLowerCase();

    // Look for exact matches (full words or phrases)
    const exactMatchIndex = lowerText.indexOf(pattern);
    if (exactMatchIndex !== -1) {
      // Immediate high score for exact matches
      const contextImportance = this.getContextImportance(text, exactMatchIndex, pattern.length);
      return 0.9 + contextImportance * 0.1;
    }

    // Check if we're dealing with multiple words
    const patternWords = pattern.split(/\s+/).filter(word => word.length > 0);

    if (patternWords.length > 1) {
      // For multi-word patterns, check how many words match
      let matchedWordCount = 0;
      let totalScore = 0;

      for (const word of patternWords) {
        if (word.length < 3) continue; // Skip very short words

        const wordScore = this.fuzzyMatchWord(word, text);
        if (wordScore > 0.4) {
          matchedWordCount++;
          totalScore += wordScore;
        }
      }

      if (matchedWordCount > 0) {
        // Weight by percentage of words matched and their scores
        return (matchedWordCount / patternWords.length) * (totalScore / matchedWordCount);
      }
    }

    // For single word or if multi-word search failed
    if (pattern.length >= 3) {
      return this.fuzzyMatchWord(pattern, text);
    }

    return 0;
  }

  // Match a single word against large text
  fuzzyMatchWord(word, text) {
    if (word.length < 3) return 0; // Ignore very short words to reduce false positives

    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();

    // Try to find exact match
    if (lowerText.includes(lowerWord)) {
      // Give bonus based on word boundaries
      const exactIndex = lowerText.indexOf(lowerWord);

      // Check if at word boundary
      const beforeChar = exactIndex > 0 ? lowerText[exactIndex - 1] : ' ';
      const afterChar = exactIndex + lowerWord.length < lowerText.length ?
        lowerText[exactIndex + lowerWord.length] : ' ';

      const isAtWordBoundary = /\W/.test(beforeChar) && /\W/.test(afterChar);

      return isAtWordBoundary ? 0.95 : 0.8;
    }

    // Check if we have a good percentage of consecutive characters
    // This is a stricter check to avoid false positives like "enemy" matching "except"
    const minSequenceLength = Math.max(3, Math.floor(word.length * 0.6));
    let bestSequenceLength = 0;

    const wordChars = lowerWord.split('');

    // Check for consecutive char sequences in text
    for (let i = 0; i < lowerText.length - minSequenceLength + 1; i++) {
      let sequenceLength = 0;
      for (let j = 0; j < wordChars.length && i + j < lowerText.length; j++) {
        if (lowerText[i + j] === wordChars[j]) {
          sequenceLength++;
        } else {
          break; // Break on first non-match
        }
      }

      bestSequenceLength = Math.max(bestSequenceLength, sequenceLength);
    }

    // If we have a good sequence match, score it
    if (bestSequenceLength >= minSequenceLength) {
      return (bestSequenceLength / lowerWord.length) * 0.7;
    }

    // If the word is more than 5 chars, we need at least 60% character match with proper ordering
    if (word.length > 5) {
      // Require more strict matching for longer words
      let matchedInOrder = 0;
      let lastMatchedIndex = -1;

      for (const char of lowerWord) {
        const fromIndex = lastMatchedIndex + 1; // Only look after the last match
        const foundIndex = lowerText.indexOf(char, fromIndex);

        if (foundIndex !== -1) {
          matchedInOrder++;
          lastMatchedIndex = foundIndex;
        }
      }

      const percentageMatched = matchedInOrder / lowerWord.length;

      // Higher threshold (60%) for longer words
      if (percentageMatched >= 0.6) {
        return percentageMatched * 0.6; // Max 0.36 score for this type of match
      }
    }

    return 0; // No good match found
  }

  // Get importance of match context (is it in a keyword, code block, etc.)
  getContextImportance(text, matchIndex, matchLength) {
    // Extract context around match
    const contextStart = Math.max(0, matchIndex - 50);
    const contextEnd = Math.min(text.length, matchIndex + matchLength + 50);
    const context = text.substring(contextStart, contextEnd);

    // Check if in code block (indentation patterns, common symbols)
    const codeIndicators = ['{', '}', '()', '[]', ';', 'function', 'class', 'var', 'const', 'let', '=>', '==='];
    const isLikelyCode = codeIndicators.some(indicator => context.includes(indicator));

    // Check if match is standalone word (not part of larger word)
    const matchSubstr = text.substring(matchIndex, matchIndex + matchLength);
    const beforeChar = matchIndex > 0 ? text[matchIndex - 1] : ' ';
    const afterChar = matchIndex + matchLength < text.length ? text[matchIndex + matchLength] : ' ';
    const isStandaloneWord = /\W/.test(beforeChar) && /\W/.test(afterChar);

    // Calculate a context importance factor (0-1)
    let importance = 0.5; // Base importance

    if (isLikelyCode) importance += 0.2;
    if (isStandaloneWord) importance += 0.3;

    return Math.min(1, importance);
  }

  // Find context around a match for debugging
  findMatchContext(query, text) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // First try exact matches
    const exactMatchIndex = lowerText.indexOf(lowerQuery);
    if (exactMatchIndex !== -1) {
      // Show context around the match
      const contextStart = Math.max(0, exactMatchIndex - 40);
      const contextEnd = Math.min(text.length, exactMatchIndex + lowerQuery.length + 40);

      return {
        type: 'exact',
        match: query,
        context: text.substring(contextStart, contextEnd),
        position: exactMatchIndex
      };
    }

    // Try to find the best partial match by checking individual words
    const words = query.split(/\s+/);
    for (const word of words) {
      if (word.length >= 4) { // Only check substantial words
        const wordIndex = lowerText.indexOf(word.toLowerCase());
        if (wordIndex !== -1) {
          const contextStart = Math.max(0, wordIndex - 40);
          const contextEnd = Math.min(text.length, wordIndex + word.length + 40);

          return {
            type: 'partial',
            match: word,
            context: text.substring(contextStart, contextEnd),
            position: wordIndex
          };
        }
      }
    }

    // If no direct matches, return first part of text
    return {
      type: 'unknown',
      match: query,
      context: text.substring(0, 80) + '...',
      position: 0
    };
  }

  // Render search results
  renderResults(query) {
    const resultsContainer = this.shadowRoot.querySelector('.search-results');

    if (this.currentResults.length === 0) {
      resultsContainer.innerHTML = `<div class="no-results">No results found</div>`;
      this.showResults();
      return;
    }

    // Create result elements with a hint at the top
    let resultsHTML = `<div class="search-instructions">Click a result to jump to that conversation</div>`;
    
    resultsHTML += this.currentResults.map((result, index) => {
      const highlightedTitle = this.highlightMatches(result.title, query);
      const highlightedSubtitle = result.subtitle ? this.highlightMatches(result.subtitle, query) : '';

      return /*html*/`
        <div class="result-item" data-index="${index}" data-id="${result.id || index}">
          <div class="result-item-title">${highlightedTitle}</div>
          ${highlightedSubtitle ? `<div class="result-item-subtitle">${highlightedSubtitle}</div>` : ''}
        </div>
      `;
    }).join('');

    resultsContainer.innerHTML = resultsHTML;

    // Add click event listeners to results
    const resultItems = this.shadowRoot.querySelectorAll('.result-item');
    resultItems.forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.selectResult(this.currentResults[index]);
      });
    });

    this.showResults();
  }

  // Highlight matching characters
  highlightMatches(text, query) {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let result = '';
    let lastIndex = 0;

    // Try exact match first
    const exactMatchIndex = lowerText.indexOf(lowerQuery);
    if (exactMatchIndex !== -1) {
      return text.substring(0, exactMatchIndex) +
        `<span class="highlight">${text.substring(exactMatchIndex, exactMatchIndex + query.length)}</span>` +
        text.substring(exactMatchIndex + query.length);
    }

    // Character by character match
    const indices = [];
    let i = 0;

    for (const char of lowerQuery) {
      // Find the next occurrence of this character
      const idx = lowerText.indexOf(char, i);
      if (idx === -1) break;

      indices.push(idx);
      i = idx + 1;
    }

    // No matches found
    if (indices.length !== lowerQuery.length) {
      return text;
    }

    // Highlight each matched character
    let highlightedText = '';
    let prevPos = 0;

    indices.forEach(pos => {
      highlightedText += text.substring(prevPos, pos);
      highlightedText += `<span class="highlight">${text.substring(pos, pos + 1)}</span>`;
      prevPos = pos + 1;
    });

    highlightedText += text.substring(prevPos);
    return highlightedText;
  }

  // Show results dropdown
  showResults() {
    const resultsContainer = this.shadowRoot.querySelector('.search-results');
    resultsContainer.classList.add('visible');
  }

  // Hide results dropdown
  hideResults() {
    const resultsContainer = this.shadowRoot.querySelector('.search-results');
    resultsContainer.classList.remove('visible');
    this.selectedIndex = -1;
  }

  // Update selected result highlight
  updateSelectedResult() {
    const resultItems = this.shadowRoot.querySelectorAll('.result-item');

    // Remove previous selection
    resultItems.forEach(item => {
      item.classList.remove('selected');
    });

    // Add highlight to selected item
    if (this.selectedIndex >= 0 && resultItems[this.selectedIndex]) {
      resultItems[this.selectedIndex].classList.add('selected');

      // Scroll into view if needed
      resultItems[this.selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // Handle result selection
  selectResult(result) {
    if (!result) return;

    // Keep the search term visible instead of replacing with the result title
    // This allows for multiple searches without clearing the search box
    const input = this.shadowRoot.querySelector('.search-input');
    // input.value = result.title; (removed)
    this.updateClearButton();
    this.hideResults();

    // Dispatch selection event
    this.dispatchEvent(new CustomEvent('result-selected', {
      detail: { result }
    }));
  }

  // API: Set search data
  setSearchData(data) {
    this.searchData = data.map(item => {
      // Handle string items
      if (typeof item === 'string') {
        return { id: String(Math.random()), title: item };
      }

      // Handle object items
      const processedItem = {
        id: item.id || String(Math.random()),
        title: item.title || item.name || String(item),
        subtitle: item.subtitle || item.description || null,
      };

      // For large text content
      if (item.content || item.text) {
        processedItem.content = item.content || item.text;

        // Create content summary for debugging
        const contentLength = processedItem.content.length;
        processedItem.contentSummary = contentLength > 100
          ? `${contentLength} chars, starts with: ${processedItem.content.substring(0, 100)}...`
          : processedItem.content;
      } else if (item.messages) {
        // Handle conversation data with messages
        processedItem.content = this.extractContentFromMessages(item.messages);
      }

      // Preserve any other properties
      return { ...item, ...processedItem };
    });

    // Dispatch event
    this.dispatchEvent(new CustomEvent('data-loaded', {
      detail: { count: this.searchData.length }
    }));
  }

  // Helper to extract content from conversation messages
  extractContentFromMessages(messages) {
    if (!Array.isArray(messages)) return '';

    // Extract and concatenate message content
    return messages.map(msg => {
      if (typeof msg === 'string') return msg;

      // Handle various message formats
      const content = msg.content || msg.text || msg.message || '';
      const role = msg.role ? `[${msg.role}]: ` : '';

      return `${role}${content}`;
    }).join(' ');
  }

  // API: Get current value
  getValue() {
    return this.shadowRoot.querySelector('.search-input').value;
  }

  // API: Set value programmatically
  setValue(value) {
    const input = this.shadowRoot.querySelector('.search-input');
    input.value = value;
    this.updateClearButton();

    // Trigger search
    clearTimeout(this.debounceTimer);
    this.search(value);
  }

  // API: Add event listener
  on(eventName, callback) {
    this.addEventListener(eventName, callback);

    // Store reference for cleanup
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    this.eventHandlers[eventName].push(callback);

    return this; // For chaining
  }

  // API: Remove event listener
  off(eventName, callback) {
    if (callback) {
      this.removeEventListener(eventName, callback);
    } else if (this.eventHandlers[eventName]) {
      // Remove all handlers for this event
      this.eventHandlers[eventName].forEach(handler => {
        this.removeEventListener(eventName, handler);
      });
      delete this.eventHandlers[eventName];
    }

    return this; // For chaining
  }

  // Cleanup on disconnect
  disconnectedCallback() {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Remove document-level event listener
    if (this._handleOutsideClick) {
      document.removeEventListener('click', this._handleOutsideClick);
      this._handleOutsideClick = null;
    }

    // Remove all custom event listeners
    Object.keys(this.eventHandlers).forEach(eventName => {
      this.eventHandlers[eventName].forEach(handler => {
        this.removeEventListener(eventName, handler);
      });
    });
    this.eventHandlers = {};
  }
}

// Register the web component
customElements.define('fuzzy-search-bar', FuzzySearchBar);
