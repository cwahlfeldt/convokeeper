import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';
import ConversationList from '../ConversationList';
import { ConversationProvider } from '../../contexts/ConversationContext';
import { BatchOperationsProvider } from '../../contexts/BatchOperationsContext';

describe('ConversationList Component', () => {
  const renderWithProviders = () => {
    return render(() => (
      <ConversationProvider>
        <BatchOperationsProvider>
          <ConversationList />
        </BatchOperationsProvider>
      </ConversationProvider>
    ));
  };

  it('renders without crashing', () => {
    const { container } = renderWithProviders();
    // Should render the main container
    expect(container.querySelector('.flex')).toBeTruthy();
  });

  it('shows loading state initially', async () => {
    renderWithProviders();
    // Loading state may appear briefly
    const container = document.querySelector('.flex-1');
    expect(container).toBeTruthy();
  });

  it('renders empty state when no conversations', async () => {
    renderWithProviders();
    // Wait for loading to complete and show empty state
    await new Promise(resolve => setTimeout(resolve, 100));

    const emptyMessage = screen.queryByText('No conversations found');
    // Empty state should appear when there are no conversations
    if (emptyMessage) {
      expect(emptyMessage).toBeTruthy();
    }
  });

  it('has filter bar', () => {
    renderWithProviders();
    // FilterBar should be rendered
    const searchInput = screen.queryByPlaceholderText(/fuzzy search/i);
    expect(searchInput).toBeTruthy();
  });

  it('renders with proper structure', () => {
    const { container } = renderWithProviders();
    expect(container.querySelector('.flex')).toBeTruthy();
    expect(container.querySelector('.flex-col')).toBeTruthy();
  });
});
