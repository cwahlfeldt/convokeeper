import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';
import MessageViewer from '../MessageViewer';
import { ConversationProvider } from '../../contexts/ConversationContext';

describe('MessageViewer Component', () => {
  const renderWithProvider = () => {
    return render(() => (
      <ConversationProvider>
        <MessageViewer />
      </ConversationProvider>
    ));
  };

  it('renders without crashing', () => {
    renderWithProvider();
    expect(document.querySelector('.message-viewer')).toBeTruthy();
  });

  it('shows empty state when no conversation selected', () => {
    renderWithProvider();
    expect(screen.getByText(/no conversation selected/i)).toBeTruthy();
  });

  it('displays helper text in empty state', () => {
    renderWithProvider();
    expect(screen.getByText(/select a conversation from the list/i)).toBeTruthy();
  });

  it('has message icon in empty state', () => {
    renderWithProvider();
    expect(screen.getByText('💬')).toBeTruthy();
  });

  it('renders with proper structure', () => {
    const { container } = renderWithProvider();
    const messageViewer = container.querySelector('.message-viewer');
    expect(messageViewer).toBeTruthy();
  });

  it('applies correct CSS classes', () => {
    const { container } = renderWithProvider();
    const noConversation = container.querySelector('.no-conversation-selected');
    expect(noConversation).toBeTruthy();
  });
});
