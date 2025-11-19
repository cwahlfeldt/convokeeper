/**
 * Scroll Utilities
 * 
 * Functions and classes for handling scrolling.
 */

import { debounce } from './performanceUtils.js';

/**
 * Virtual Scroller for efficient rendering of large lists
 */
export class VirtualScroller {
  /**
   * @param {HTMLElement} container - Container element
   * @param {Function} itemRenderer - Function to render each item
   * @param {Array} items - Data items to render
   * @param {Object} options - Configuration options
   */
  constructor(container, itemRenderer, items = [], options = {}) {
    this.container = container;
    this.itemRenderer = itemRenderer;
    this.items = items;
    
    this.options = {
      itemHeight: options.itemHeight || 50,
      overscan: options.overscan || 10,
      ...options,
    };
    
    this.visibleItems = new Map();
    this.firstVisibleIndex = 0;
    this.lastVisibleIndex = 0;
    this.scrollTimeout = null;
    this.pendingRender = false;
    
    this.setupContainer();
    this.bindEvents();
    this.render();
  }
  
  /**
   * Set up the container element
   */
  setupContainer() {
    this.container.innerHTML = '';
    
    this.innerContainer = document.createElement('div');
    this.innerContainer.className = 'virtual-scroller-inner';
    this.container.appendChild(this.innerContainer);
    
    this.container.classList.add('virtual-scroller-container');
  }
  
  /**
   * Bind scroll and resize events
   */
  bindEvents() {
    this.container.addEventListener('scroll', () => {
      if (!this.pendingRender) {
        this.pendingRender = true;
        window.requestAnimationFrame(() => {
          this.render();
          this.pendingRender = false;
        });
      }
    });
    
    window.addEventListener('resize', debounce(() => {
      this.render();
    }, 100));
  }
  
  /**
   * Update the items array
   * @param {Array} items - New items array
   */
  updateItems(items) {
    if (JSON.stringify(this.items) === JSON.stringify(items)) return;
    
    this.items = items;
    this.visibleItems.clear();
    this.render();
  }
  
  /**
   * Render visible items
   */
  render() {
    if (!this.items.length) {
      this.innerContainer.style.height = '0px';
      
      // Show empty state if needed
      if (this.innerContainer.children.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-list-message';
        emptyMessage.textContent = 'No conversations found';
        this.innerContainer.appendChild(emptyMessage);
      }
      
      return;
    } else {
      // Remove any empty message
      const emptyMessage = this.innerContainer.querySelector('.empty-list-message');
      if (emptyMessage) {
        emptyMessage.remove();
      }
    }
    
    // Set height for scrolling
    this.innerContainer.style.height = `${this.items.length * this.options.itemHeight}px`;
    
    // Calculate visible range
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    const firstVisible = Math.floor(scrollTop / this.options.itemHeight);
    const lastVisible = Math.ceil((scrollTop + containerHeight) / this.options.itemHeight);
    
    // Add overscan
    const firstIndex = Math.max(0, firstVisible - this.options.overscan);
    const lastIndex = Math.min(this.items.length - 1, lastVisible + this.options.overscan);
    
    // Check if visible range has significantly changed
    const rangeChanged = 
      firstIndex < this.firstVisibleIndex - 5 ||
      firstIndex > this.firstVisibleIndex + 5 ||
      lastIndex < this.lastVisibleIndex - 5 ||
      lastIndex > this.lastVisibleIndex + 5;
    
    if (!rangeChanged && this.visibleItems.size > 0) return;
    
    this.firstVisibleIndex = firstIndex;
    this.lastVisibleIndex = lastIndex;
    
    // Track which items will remain visible
    const newVisibleIndexes = new Set();
    
    for (let i = firstIndex; i <= lastIndex; i++) {
      newVisibleIndexes.add(i);
    }
    
    // Remove items that are no longer visible
    this.visibleItems.forEach((element, index) => {
      if (!newVisibleIndexes.has(index)) {
        element.remove();
        this.visibleItems.delete(index);
      }
    });
    
    // Add new visible items
    for (let i = firstIndex; i <= lastIndex; i++) {
      if (!this.visibleItems.has(i)) {
        const item = this.items[i];
        
        if (!item) continue;
        
        const itemElement = this.itemRenderer(item, i);
        
        itemElement.classList.add('virtual-item');
        itemElement.style.top = `${i * this.options.itemHeight}px`;
        
        this.innerContainer.appendChild(itemElement);
        this.visibleItems.set(i, itemElement);
      }
    }
  }
  
  /**
   * Force a complete re-render
   */
  forceRender() {
    this.visibleItems.clear();
    this.firstVisibleIndex = -1;
    this.lastVisibleIndex = -1;
    this.innerContainer.innerHTML = '';
    this.render();
  }
  
  /**
   * Scroll to top
   */
  scrollToTop() {
    this.container.scrollTop = 0;
  }
  
  /**
   * Get the number of items
   * @returns {number} - Item count
   */
  getItemCount() {
    return this.items.length;
  }
}

/**
 * Scroll an element into view smoothly
 * @param {HTMLElement} element - Element to scroll into view
 * @param {Object} options - Scroll options
 */
export function scrollIntoView(element, options = {}) {
  if (!element) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  };
  
  element.scrollIntoView({
    ...defaultOptions,
    ...options
  });
}

/**
 * Check if an element is in the viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if element is in viewport
 */
export function isElementInViewport(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
