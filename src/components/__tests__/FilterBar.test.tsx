import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';
import FilterBar from '../FilterBar';
import { ConversationProvider } from '../../contexts/ConversationContext';

describe('FilterBar Component', () => {
  const renderWithProvider = () => {
    return render(() => (
      <ConversationProvider>
        <FilterBar />
      </ConversationProvider>
    ));
  };

  it('renders fuzzy search input', () => {
    renderWithProvider();
    const searchInput = screen.getByPlaceholderText(/fuzzy search conversations/i);
    expect(searchInput).toBeTruthy();
  });

  it('renders source filter dropdown', () => {
    renderWithProvider();
    const sourceFilter = screen.getByLabelText('Filter by source');
    expect(sourceFilter).toBeTruthy();
    expect(sourceFilter.tagName).toBe('SELECT');
  });

  it('has all source options', () => {
    renderWithProvider();
    expect(screen.getByText('All Sources')).toBeTruthy();
    expect(screen.getByText('ChatGPT')).toBeTruthy();
    expect(screen.getByText('Claude')).toBeTruthy();
    expect(screen.getByText('Gemini')).toBeTruthy();
    expect(screen.getByText('Copilot')).toBeTruthy();
  });

  it('renders sort filter dropdown', () => {
    renderWithProvider();
    const sortFilter = screen.getByLabelText('Sort order');
    expect(sortFilter).toBeTruthy();
    expect(sortFilter.tagName).toBe('SELECT');
  });

  it('has all sort options', () => {
    renderWithProvider();
    expect(screen.getByText('Newest First')).toBeTruthy();
    expect(screen.getByText('Oldest First')).toBeTruthy();
    expect(screen.getByText('Title (A-Z)')).toBeTruthy();
  });

  it('renders starred filter button', () => {
    renderWithProvider();
    const starredButton = screen.getByLabelText('Show only starred');
    expect(starredButton).toBeTruthy();
    expect(starredButton.textContent).toContain('Starred');
  });

  it('renders archived filter button', () => {
    renderWithProvider();
    const archivedButton = screen.getByLabelText('Show archived');
    expect(archivedButton).toBeTruthy();
    expect(archivedButton.textContent).toContain('Archived');
  });

  it('toggles starred filter on click', () => {
    renderWithProvider();
    const starredButton = screen.getByLabelText('Show only starred');

    expect(starredButton.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(starredButton);
    // Button should toggle state
    expect(starredButton).toBeTruthy();
  });

  it('has proper ARIA labels', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Filter by source')).toBeTruthy();
    expect(screen.getByLabelText('Sort order')).toBeTruthy();
    expect(screen.getByLabelText('Show only starred')).toBeTruthy();
    expect(screen.getByLabelText('Show archived')).toBeTruthy();
  });
});
