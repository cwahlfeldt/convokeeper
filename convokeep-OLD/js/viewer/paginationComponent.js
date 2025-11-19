/**
 * Pagination Component
 * 
 * A reusable component for rendering and handling pagination controls.
 */

/**
 * Creates and manages a pagination component
 */
export class PaginationComponent {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element for pagination controls
   * @param {Function} options.onPageChange - Callback when page changes
   * @param {number} options.visiblePageCount - Number of page buttons to show
   */
  constructor(options = {}) {
    this.container = options.container;
    this.onPageChange = options.onPageChange || (() => { });
    this.visiblePageCount = 3;

    this.currentPage = 1;
    this.totalPages = 1;

    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    if (!this.container) {
      console.error('Pagination container element not found');
      return;
    }

    // Create pagination element
    this.paginationElement = document.createElement('div');
    this.paginationElement.className = 'pagination';
    this.paginationElement.setAttribute('role', 'navigation');
    this.paginationElement.setAttribute('aria-label', 'Conversation page navigation');

    // Add to container
    this.container.appendChild(this.paginationElement);

    // Initial render
    this.update({ currentPage: 1, totalPages: 1, totalConversations: 1 });
  }

  /**
   * Update pagination state and render
   * @param {Object} state - New pagination state
   */
  update(state) {
    this.currentPage = state.currentPage || 1;
    this.totalPages = state.totalPages || 1;
    this.totalItems = state.totalConversations || 0;

    this.render();
  }

  /**
   * Render the pagination controls
   */
  render() {
    if (!this.paginationElement) return;

    // Clear existing content
    this.paginationElement.innerHTML = '';

    // Don't render if only one page
    if (this.totalPages <= 1) {
      this.paginationElement.style.display = 'none';
      return;
    } else {
      this.paginationElement.style.display = 'flex';
    }

    // Create controls
    const controls = document.createElement('div');
    controls.className = 'pagination-controls';

    // Previous button
    const prevButton = this._createButton('<', this.currentPage > 1, () => {
      this._goToPage(this.currentPage - 1);
    });
    prevButton.classList.add('pagination-prev');
    prevButton.setAttribute('aria-label', 'Go to previous page');
    controls.appendChild(prevButton);

    // Page buttons
    const pageButtons = this._createPageButtons();
    controls.appendChild(pageButtons);

    // Next button
    const nextButton = this._createButton('>', this.currentPage < this.totalPages, () => {
      this._goToPage(this.currentPage + 1);
    });
    nextButton.classList.add('pagination-next');
    nextButton.setAttribute('aria-label', 'Go to next page');
    controls.appendChild(nextButton);

    // Add controls to pagination element
    this.paginationElement.appendChild(controls);

    // Add pagination info
    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    info.setAttribute('aria-live', 'polite');
    this.paginationElement.appendChild(info);
  }

  _createPageButtons() {
    const fragment = document.createDocumentFragment();
    const pagesList = document.createElement('div');
    pagesList.className = 'pagination-pages';

    // Calculate which pages to show
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // Create page buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = this._createPageButton(i);
      pagesList.appendChild(pageButton);
    }

    fragment.appendChild(pagesList);
    return fragment;
  }

  /**
   * Create a page number button
   * @param {number} pageNum - Page number
   * @returns {HTMLButtonElement} Page button
   */
  _createPageButton(pageNum) {
    const button = document.createElement('button');
    button.className = 'pagination-button';
    button.textContent = pageNum;
    button.setAttribute('aria-label', `Go to page ${pageNum}`);

    // Mark current page
    if (pageNum === this.currentPage) {
      button.classList.add('active');
      button.setAttribute('aria-current', 'page');
      button.setAttribute('disabled', true);
    } else {
      button.addEventListener('click', () => {
        this._goToPage(pageNum);
      });
    }

    return button;
  }

  /**
   * Create a pagination button
   * @param {string} text - Button text
   * @param {boolean} enabled - Whether the button is enabled
   * @param {Function} onClick - Click handler
   * @returns {HTMLButtonElement} Button element
   */
  _createButton(text, enabled, onClick) {
    const button = document.createElement('button');
    button.className = 'pagination-button';
    button.textContent = text;

    if (!enabled) {
      button.setAttribute('disabled', true);
      button.classList.add('disabled');
    } else {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  /**
   * Go to a specific page
   * @param {number} pageNum - Page number to go to
   */
  _goToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.totalPages || pageNum === this.currentPage) {
      return;
    }

    this.currentPage = pageNum;

    // Call the onPageChange callback
    if (typeof this.onPageChange === 'function') {
      this.onPageChange(pageNum);
    }
  }
}
