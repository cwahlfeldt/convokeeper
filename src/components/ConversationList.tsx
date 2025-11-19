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
    <div class="flex flex-col h-full bg-white dark:bg-gray-900">
      <FilterBar />

      <div class="flex-1 overflow-y-auto">
        <Show
          when={!loading()}
          fallback={
            <div class="flex flex-col items-center justify-center h-full p-8">
              <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p class="text-gray-600 dark:text-gray-400">Loading conversations...</p>
            </div>
          }
        >
          <Show
            when={conversations().length > 0}
            fallback={
              <div class="flex flex-col items-center justify-center h-full p-8 text-center">
                <div class="text-6xl mb-4">💬</div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No conversations found
                </h3>
                <p class="text-gray-600 dark:text-gray-400 max-w-md">
                  Upload your conversation exports to get started
                </p>
              </div>
            }
          >
            <div role="list">
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
