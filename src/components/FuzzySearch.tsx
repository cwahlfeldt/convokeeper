/**
 * Fuzzy Search Component
 *
 * Provides fuzzy search functionality for conversations with keyboard navigation
 */

import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';

interface SearchResult {
  conversation: any;
  score: number;
  matches: string[];
}

export default function FuzzySearch() {
  const { conversations, loadConversation } = useConversations();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [results, setResults] = createSignal<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = createSignal(-1);
  const [isOpen, setIsOpen] = createSignal(false);

  let inputRef: HTMLInputElement | undefined;
  let debounceTimer: NodeJS.Timeout | undefined;

  // Fuzzy search algorithm
  const fuzzyScore = (text: string, query: string): { score: number; matches: number[] } => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let score = 0;
    let queryIndex = 0;
    const matches: number[] = [];

    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        matches.push(i);
        score += 1;
        queryIndex++;
      }
    }

    // Calculate final score (0-1 range)
    if (queryIndex === lowerQuery.length) {
      const consecutiveBonus = matches.reduce((acc, curr, idx) => {
        if (idx > 0 && curr === matches[idx - 1] + 1) {
          return acc + 0.1;
        }
        return acc;
      }, 0);

      score = (score / lowerQuery.length) + consecutiveBonus;
      score = Math.min(score, 1);
      return { score, matches };
    }

    return { score: 0, matches: [] };
  };

  // Perform fuzzy search
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults: SearchResult[] = [];
    const convos = conversations();

    for (const conversation of convos) {
      const titleResult = fuzzyScore(conversation.title || '', query);
      const sourceResult = fuzzyScore(conversation.source || '', query);

      // Search in tags
      let tagScore = 0;
      if (conversation.tags && conversation.tags.length > 0) {
        const tagResults = conversation.tags.map((tag: string) => fuzzyScore(tag, query));
        tagScore = Math.max(...tagResults.map(r => r.score));
      }

      // Get best score
      const bestScore = Math.max(titleResult.score, sourceResult.score, tagScore);

      if (bestScore > 0.3) { // Minimum threshold
        searchResults.push({
          conversation,
          score: bestScore,
          matches: titleResult.matches
        });
      }
    }

    // Sort by score
    searchResults.sort((a, b) => b.score - a.score);

    setResults(searchResults.slice(0, 50)); // Max 50 results
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(-1);
  };

  // Debounced search
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const query = target.value;
    setSearchQuery(query);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const resultsList = results();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < resultsList.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        const selected = resultsList[selectedIndex()];
        if (selected) {
          selectResult(selected);
        }
        break;

      case 'Escape':
        e.preventDefault();
        clearSearch();
        break;
    }
  };

  // Select a result
  const selectResult = (result: SearchResult) => {
    loadConversation(result.conversation.conversation_id);
    clearSearch();
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (inputRef) {
      inputRef.value = '';
      inputRef.blur();
    }
  };

  // Click outside to close
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.fuzzy-search-container')) {
      setIsOpen(false);
    }
  };

  createEffect(() => {
    document.addEventListener('click', handleClickOutside);
    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    });
  });

  // Highlight matches in text
  const highlightMatches = (text: string, matches: number[]) => {
    if (matches.length === 0) return text;

    const parts: { text: string; isMatch: boolean }[] = [];
    let lastIndex = 0;

    for (const matchIndex of matches) {
      if (matchIndex > lastIndex) {
        parts.push({ text: text.slice(lastIndex, matchIndex), isMatch: false });
      }
      parts.push({ text: text[matchIndex], isMatch: true });
      lastIndex = matchIndex + 1;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isMatch: false });
    }

    return parts;
  };

  return (
    <div class="fuzzy-search-container">
      <div class="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          class="search-input"
          placeholder="Fuzzy search conversations..."
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          aria-label="Search conversations"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen()}
        />

        <span class="search-icon" aria-hidden="true">
          🔍
        </span>

        <Show when={searchQuery()}>
          <button
            class="clear-button"
            onClick={clearSearch}
            aria-label="Clear search"
            type="button"
          >
            ×
          </button>
        </Show>
      </div>

      <Show when={isOpen()}>
        <div class="search-results" id="search-results" role="listbox">
          <Show
            when={results().length > 0}
            fallback={
              <div class="search-no-results">
                No conversations found for "{searchQuery()}"
              </div>
            }
          >
            <For each={results()}>
              {(result, index) => (
                <div
                  class="search-result-item"
                  classList={{ selected: index() === selectedIndex() }}
                  onClick={() => selectResult(result)}
                  role="option"
                  aria-selected={index() === selectedIndex()}
                >
                  <div class="result-title">
                    <For each={highlightMatches(result.conversation.title, result.matches)}>
                      {(part) => (
                        <span classList={{ highlight: part.isMatch }}>
                          {part.text}
                        </span>
                      )}
                    </For>
                  </div>
                  <div class="result-meta">
                    <span class="result-source">{result.conversation.source}</span>
                    <span class="result-score" title="Match score">
                      {Math.round(result.score * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  );
}
