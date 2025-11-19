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

      if (bestScore > 0.3) {
        searchResults.push({
          conversation,
          score: bestScore,
          matches: titleResult.matches
        });
      }
    }

    // Sort by score
    searchResults.sort((a, b) => b.score - a.score);

    setResults(searchResults.slice(0, 50));
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(-1);
  };

  // Debounced search
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const query = target.value;
    setSearchQuery(query);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

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
    if (matches.length === 0) return [{ text, isMatch: false }];

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
    <div class="fuzzy-search-container relative w-full mb-4">
      <div class="relative w-full">
        <input
          ref={inputRef}
          type="text"
          class="w-full px-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
          placeholder="Fuzzy search conversations..."
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          aria-label="Search conversations"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen()}
        />

        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-400 pointer-events-none">
          🔍
        </span>

        <Show when={searchQuery()}>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center
                   rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400
                   hover:text-gray-700 dark:hover:text-gray-200 text-2xl transition-colors"
            onClick={clearSearch}
            aria-label="Clear search"
            type="button"
          >
            ×
          </button>
        </Show>
      </div>

      <Show when={isOpen()}>
        <div
          class="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto
                 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                 rounded-lg shadow-lg z-50"
          id="search-results"
          role="listbox"
        >
          <Show
            when={results().length > 0}
            fallback={
              <div class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No conversations found for "{searchQuery()}"
              </div>
            }
          >
            <For each={results()}>
              {(result, index) => (
                <div
                  class={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0
                         transition-colors ${
                           index() === selectedIndex()
                             ? 'bg-blue-50 dark:bg-blue-900/20'
                             : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                         }`}
                  onClick={() => selectResult(result)}
                  role="option"
                  aria-selected={index() === selectedIndex()}
                >
                  <div class="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    <For each={highlightMatches(result.conversation.title, result.matches)}>
                      {(part) => (
                        <span class={part.isMatch ? 'bg-yellow-200 dark:bg-yellow-600 font-semibold px-0.5 rounded' : ''}>
                          {part.text}
                        </span>
                      )}
                    </For>
                  </div>
                  <div class="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span class="capitalize">{result.conversation.source}</span>
                    <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
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
