/**
 * Filter Bar Component
 *
 * Provides filtering options for conversations (source, sort, starred, archived)
 */

import { Show } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';
import FuzzySearch from './FuzzySearch';

export default function FilterBar() {
  const { filters, setFilter, clearFilters } = useConversations();

  const toggleStarred = () => {
    setFilter('starred', !filters.starred);
  };

  const toggleArchived = () => {
    setFilter('archived', !filters.archived);
  };

  const handleSourceChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setFilter('source', target.value);
  };

  const handleSortChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setFilter('sortOrder', target.value);
  };

  const hasActiveFilters = () =>
    filters.starred || filters.archived || filters.source !== 'all' || filters.sortOrder !== 'newest';

  return (
    <div class="p-4 space-y-4 border-b border-gray-200 dark:border-gray-700">
      {/* Fuzzy Search */}
      <FuzzySearch />

      {/* Filters */}
      <div class="flex flex-wrap gap-3 items-center">
        {/* Source Filter */}
        <div class="flex items-center gap-2">
          <label for="source-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Source:
          </label>
          <select
            id="source-filter"
            class="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.source}
            onChange={handleSourceChange}
            aria-label="Filter by source"
          >
            <option value="all">All Sources</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="copilot">Copilot</option>
          </select>
        </div>

        {/* Sort Order */}
        <div class="flex items-center gap-2">
          <label for="sort-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort:
          </label>
          <select
            id="sort-filter"
            class="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.sortOrder}
            onChange={handleSortChange}
            aria-label="Sort order"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>

        {/* Organization Filters */}
        <div class="flex gap-2 ml-auto" role="group" aria-label="Organization filters">
          <button
            class={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                   ${filters.starred
                     ? 'bg-blue-500 text-white'
                     : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                   }`}
            onClick={toggleStarred}
            aria-label="Show only starred"
            aria-pressed={filters.starred}
          >
            <span aria-hidden="true">⭐</span> Starred
          </button>

          <button
            class={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                   ${filters.archived
                     ? 'bg-blue-500 text-white'
                     : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                   }`}
            onClick={toggleArchived}
            aria-label="Show archived"
            aria-pressed={filters.archived}
          >
            <span aria-hidden="true">📦</span> Archived
          </button>

          <Show when={hasActiveFilters()}>
            <button
              class="px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 dark:bg-red-900/30
                     text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
}
