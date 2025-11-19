import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import ConversationItem from '../ConversationItem';
import { ConversationProvider } from '../../contexts/ConversationContext';
import { BatchOperationsProvider } from '../../contexts/BatchOperationsContext';

describe('ConversationItem Component', () => {
  const mockConversation = {
    conversation_id: 'test-123',
    title: 'Test Conversation',
    source: 'ChatGPT',
    model: 'gpt-4',
    created_at: new Date('2024-01-01').toISOString(),
    starred: false,
    archived: false,
    tags: ['test', 'important'],
  };

  const renderWithProviders = (conversation = mockConversation) => {
    return render(() => (
      <ConversationProvider>
        <BatchOperationsProvider>
          <ConversationItem conversation={conversation} />
        </BatchOperationsProvider>
      </ConversationProvider>
    ));
  };

  it('renders conversation title', () => {
    const { container } = renderWithProviders();
    const title = container.querySelector('.conversation-item-title');
    expect(title?.textContent).toBe('Test Conversation');
  });

  it('displays source name', () => {
    const { container } = renderWithProviders();
    const source = container.textContent;
    expect(source).toContain('ChatGPT');
  });

  it('renders tags when present', () => {
    const { container } = renderWithProviders();
    const content = container.textContent;
    expect(content).toContain('test');
    expect(content).toContain('important');
  });

  it('shows unstar icon when not starred', () => {
    renderWithProviders();
    const starButton = screen.getByLabelText('Star');
    expect(starButton.textContent).toBe('☆');
  });

  it('shows star icon when starred', () => {
    const starredConversation = { ...mockConversation, starred: true };
    renderWithProviders(starredConversation);
    const starButton = screen.getByLabelText('Unstar');
    expect(starButton.textContent).toBe('★');
  });

  it('renders checkbox for selection', () => {
    renderWithProviders();
    const checkbox = screen.getByLabelText('Select conversation');
    expect(checkbox).toBeTruthy();
    expect(checkbox.type).toBe('checkbox');
  });

  it('shows archived badge when archived', () => {
    const archivedConversation = { ...mockConversation, archived: true };
    renderWithProviders(archivedConversation);
    expect(screen.getByText('Archived')).toBeTruthy();
  });

  it('formats Claude source name correctly', () => {
    const claudeConversation = { ...mockConversation, source: 'claude', model: 'claude-3' };
    const { container } = renderWithProviders(claudeConversation);
    expect(container.textContent).toContain('Claude');
  });

  it('formats Gemini source name correctly', () => {
    const geminiConversation = { ...mockConversation, source: 'gemini', model: 'gemini-pro' };
    const { container } = renderWithProviders(geminiConversation);
    expect(container.textContent).toContain('Gemini');
  });
});
