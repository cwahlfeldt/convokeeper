/**
 * Conversation List Component
 *
 * Displays the list of conversations with filters and pagination
 */

import { For, Show } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';
import ConversationItem from './ConversationItem';
import FilterBar from './FilterBar';
import Pagination from './Pagination';

export default function ConversationList() {
  const { conversations, loading } = useConversations();

  return (
    <div class="conversation-list-container">
      <FilterBar />

      <div class="conversation-list-wrapper">
        <Show
          when={!loading()}
          fallback={
            <div class="loading-indicator">
              <div class="spinner"></div>
              <p>Loading conversations...</p>
            </div>
          }
        >
          <Show
            when={conversations().length > 0}
            fallback={
              <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <h3>No conversations found</h3>
                <p>Upload your conversation exports to get started</p>
              </div>
            }
          >
            <div class="conversation-list" role="list">
              <For each={conversations()}>
                {(conversation) => (
                  <ConversationItem conversation={conversation} />
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>

      <Pagination />
    </div>
  );
}
