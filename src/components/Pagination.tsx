/**
 * Pagination Component
 *
 * Handles page navigation for conversation list
 */

import { Show } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';

export default function Pagination() {
  const { pagination, setPage } = useConversations();

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPage(page);
  };

  const goToPrevious = () => {
    if (pagination.currentPage > 1) {
      goToPage(pagination.currentPage - 1);
    }
  };

  const goToNext = () => {
    if (pagination.currentPage < pagination.totalPages) {
      goToPage(pagination.currentPage + 1);
    }
  };

  const goToFirst = () => {
    goToPage(1);
  };

  const goToLast = () => {
    goToPage(pagination.totalPages);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const current = pagination.currentPage;
    const total = pagination.totalPages;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      // Show all pages if there are 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  };

  return (
    <Show when={pagination.totalPages > 1}>
      <div class="pagination-container">
        <div class="pagination" role="navigation" aria-label="Pagination">
          <div class="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
            {pagination.totalConversations > 0 && (
              <span class="pagination-count">
                ({pagination.totalConversations} total)
              </span>
            )}
          </div>

          <div class="pagination-controls">
            <button
              class="pagination-button"
              onClick={goToFirst}
              disabled={pagination.currentPage === 1}
              aria-label="Go to first page"
              title="First page"
            >
              ««
            </button>

            <button
              class="pagination-button"
              onClick={goToPrevious}
              disabled={pagination.currentPage === 1}
              aria-label="Go to previous page"
              title="Previous page"
            >
              ‹
            </button>

            {getPageNumbers().map((page) => (
              <>
                {typeof page === 'number' ? (
                  <button
                    class="pagination-button pagination-page"
                    classList={{ active: page === pagination.currentPage }}
                    onClick={() => goToPage(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={page === pagination.currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ) : (
                  <span class="pagination-ellipsis">{page}</span>
                )}
              </>
            ))}

            <button
              class="pagination-button"
              onClick={goToNext}
              disabled={pagination.currentPage === pagination.totalPages}
              aria-label="Go to next page"
              title="Next page"
            >
              ›
            </button>

            <button
              class="pagination-button"
              onClick={goToLast}
              disabled={pagination.currentPage === pagination.totalPages}
              aria-label="Go to last page"
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
