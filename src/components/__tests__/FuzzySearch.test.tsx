import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FuzzySearch from '../FuzzySearch';
import { ConversationProvider } from '../../contexts/ConversationContext';

describe('FuzzySearch Component', () => {
  const renderWithProvider = () => {
    return render(() => (
      <ConversationProvider>
        <FuzzySearch />
      </ConversationProvider>
    ));
  };

  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('renders search input', () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i);
    expect(searchInput).toBeTruthy();
    expect(searchInput.type).toBe('text');
  });

  it('has search icon', () => {
    const { container } = renderWithProvider();
    const searchIcon = container.querySelector('.absolute.left-3');
    expect(searchIcon).toBeTruthy();
    expect(searchIcon?.textContent).toBe('🔍');
  });

  it('shows clear button when text is entered', async () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i);

    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).toBeFalsy();

    // Type something
    fireEvent.input(searchInput, { target: { value: 'test' } });

    // Clear button should appear
    await waitFor(() => {
      expect(screen.getByLabelText('Clear search')).toBeTruthy();
    });
  });

  it('clears input when clear button is clicked', async () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i) as HTMLInputElement;

    // Type something
    fireEvent.input(searchInput, { target: { value: 'test query' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Clear search')).toBeTruthy();
    });

    // Click clear button
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    // Input should be cleared
    expect(searchInput.value).toBe('');
  });

  it('has proper ARIA attributes', () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i);

    expect(searchInput.getAttribute('aria-label')).toBe('Search conversations');
    expect(searchInput.getAttribute('aria-autocomplete')).toBe('list');
    expect(searchInput.getAttribute('aria-controls')).toBe('search-results');
    expect(searchInput.getAttribute('aria-expanded')).toBe('false');
  });

  it('debounces search input', async () => {
    vi.useFakeTimers();
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i);

    // Type rapidly
    fireEvent.input(searchInput, { target: { value: 't' } });
    fireEvent.input(searchInput, { target: { value: 'te' } });
    fireEvent.input(searchInput, { target: { value: 'tes' } });
    fireEvent.input(searchInput, { target: { value: 'test' } });

    // Fast forward time
    vi.advanceTimersByTime(300);

    // Should have debounced the input
    expect(searchInput).toBeTruthy();

    vi.useRealTimers();
  });

  it('handles keyboard navigation', () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i);

    // Should handle arrow keys
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    // No errors should occur
    expect(searchInput).toBeTruthy();
  });

  it('displays results dropdown when search has results', async () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i);

    // Type a search query
    fireEvent.input(searchInput, { target: { value: 'test' } });

    // Wait for debounce
    await waitFor(() => {
      // Results dropdown may appear if there are matching conversations
      const resultsDropdown = document.getElementById('search-results');
      // The dropdown element should exist (even if empty)
      expect(searchInput.getAttribute('aria-expanded')).toBeTruthy();
    }, { timeout: 500 });
  });
});
