/**
 * Filter Bar Component
 *
 * Provides filtering options for conversations (source, sort, starred, archived)
 */

import { Show } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';

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
    <div class="filter-bar">
      {/* Source Filter */}
      <div class="filter-group">
        <label for="source-filter" class="filter-label">Source:</label>
        <select
          id="source-filter"
          class="filter-select"
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
      <div class="filter-group">
        <label for="sort-filter" class="filter-label">Sort:</label>
        <select
          id="sort-filter"
          class="filter-select"
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
      <div class="organization-filters" role="group" aria-label="Organization filters">
        <button
          class="filter-chip"
          classList={{ active: filters.starred }}
          onClick={toggleStarred}
          aria-label="Show only starred"
          aria-pressed={filters.starred}
        >
          <span aria-hidden="true">⭐</span> Starred
        </button>

        <button
          class="filter-chip"
          classList={{ active: filters.archived }}
          onClick={toggleArchived}
          aria-label="Show archived"
          aria-pressed={filters.archived}
        >
          <span aria-hidden="true">📦</span> Archived
        </button>

        <Show when={hasActiveFilters()}>
          <button
            class="filter-chip filter-chip-action"
            onClick={clearFilters}
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        </Show>
      </div>
    </div>
  );
}
