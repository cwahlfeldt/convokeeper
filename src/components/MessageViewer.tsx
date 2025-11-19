/**
 * Message Viewer Component
 *
 * Displays the messages of the currently selected conversation
 */

import { Show, For, createSignal, onMount } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';
import { createMarkdownRenderer } from '../utils/markdownUtils.js';
import { formatters } from '../utils/formatUtils.js';

interface Message {
  role: string;
  content: string;
  timestamp?: string | number;
  model?: string;
}

export default function MessageViewer() {
  const { currentConversation } = useConversations();
  const [markdownRenderer, setMarkdownRenderer] = createSignal<any>(null);

  onMount(async () => {
    // Initialize markdown renderer
    const renderer = await createMarkdownRenderer();
    setMarkdownRenderer(() => renderer);
  });

  const renderMessage = (content: string): string => {
    const renderer = markdownRenderer();
    if (!renderer) return content;

    try {
      return renderer.render(content);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return content;
    }
  };

  const getRoleClass = (role: string): string => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole.includes('user') || normalizedRole.includes('human')) {
      return 'message-user';
    } else if (normalizedRole.includes('assistant') || normalizedRole.includes('ai')) {
      return 'message-assistant';
    } else if (normalizedRole.includes('system')) {
      return 'message-system';
    }
    return 'message-other';
  };

  const getRoleLabel = (role: string): string => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole.includes('user') || normalizedRole.includes('human')) {
      return 'You';
    } else if (normalizedRole.includes('assistant') || normalizedRole.includes('ai')) {
      return 'Assistant';
    } else if (normalizedRole.includes('system')) {
      return 'System';
    }
    return role;
  };

  return (
    <div class="message-viewer">
      <Show
        when={currentConversation()}
        fallback={
          <div class="no-conversation-selected">
            <div class="no-conversation-icon">💬</div>
            <h2>No conversation selected</h2>
            <p>Select a conversation from the list to view its messages</p>
          </div>
        }
      >
        {(conversation) => (
          <>
            {/* Conversation Header */}
            <div class="conversation-header">
              <h1 class="conversation-title">{conversation().title}</h1>
              <div class="conversation-metadata">
                <span class="conversation-source">
                  {conversation().source || 'Unknown Source'}
                </span>
                {conversation().model && (
                  <>
                    <span class="separator">•</span>
                    <span class="conversation-model">{conversation().model}</span>
                  </>
                )}
                <span class="separator">•</span>
                <span class="conversation-date">
                  {formatters.fullDate(conversation().created_at)}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div class="messages-container">
              <Show
                when={conversation().messages && conversation().messages!.length > 0}
                fallback={
                  <div class="no-messages">
                    <p>No messages in this conversation</p>
                  </div>
                }
              >
                <For each={conversation().messages}>
                  {(message: Message, index) => (
                    <div class={`message ${getRoleClass(message.role)}`}>
                      <div class="message-header">
                        <span class="message-role">{getRoleLabel(message.role)}</span>
                        {message.timestamp && (
                          <span class="message-timestamp">
                            {formatters.fullDate(message.timestamp)}
                          </span>
                        )}
                      </div>
                      <div
                        class="message-content"
                        innerHTML={renderMessage(message.content)}
                      />
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
