/**
 * Conversation Item Component
 *
 * Displays a single conversation in the list with metadata and actions
 */

import { Show, For } from 'solid-js';
import { useConversations } from '../contexts/ConversationContext';
import { useBatchOperations } from '../contexts/BatchOperationsContext';
import { formatters } from '../utils/formatUtils.js';

interface Conversation {
  conversation_id: string;
  title: string;
  source?: string;
  model?: string;
  created_at: string | number;
  starred?: boolean;
  archived?: boolean;
  tags?: string[];
}

interface ConversationItemProps {
  conversation: Conversation;
}

export default function ConversationItem(props: ConversationItemProps) {
  const { currentConversationId, loadConversation, toggleStar, toggleArchive } = useConversations();
  const { isSelected, toggleSelection } = useBatchOperations();

  const isActive = () => currentConversationId() === props.conversation.conversation_id;
  const selected = () => isSelected(props.conversation.conversation_id);

  const handleCheckboxChange = (e: Event) => {
    e.stopPropagation();
    toggleSelection(props.conversation.conversation_id);
  };

  const handleStarClick = async (e: Event) => {
    e.stopPropagation();
    await toggleStar(props.conversation.conversation_id);
  };

  const handleClick = () => {
    loadConversation(props.conversation.conversation_id);
  };

  const formatSourceName = (conversation: Conversation): string => {
    const source = conversation.source?.toLowerCase() || '';
    const model = conversation.model?.toLowerCase() || '';

    if (source.includes('chatgpt') || source.includes('gpt') || model.includes('gpt')) {
      return 'ChatGPT';
    } else if (source.includes('claude') || model.includes('claude')) {
      return 'Claude';
    } else if (source.includes('gemini') || model.includes('gemini')) {
      return 'Gemini';
    } else if (source.includes('copilot') || model.includes('copilot')) {
      return 'Copilot';
    }
    return conversation.source || 'Unknown';
  };

  return (
    <div
      class="conversation-item"
      classList={{
        active: isActive(),
        archived: props.conversation.archived || false,
        selected: selected()
      }}
      onClick={handleClick}
      role="listitem"
      tabindex="0"
      aria-label={props.conversation.title}
    >
      <div class="conversation-item-checkbox-wrapper">
        <input
          type="checkbox"
          class="conversation-item-checkbox"
          checked={selected()}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select conversation"
        />
      </div>

      <div class="conversation-item-content">
        <div class="conversation-item-header">
          <div class="conversation-item-title">{props.conversation.title}</div>
          <button
            class="conversation-item-star"
            classList={{ starred: props.conversation.starred || false }}
            onClick={handleStarClick}
            aria-label={props.conversation.starred ? 'Unstar' : 'Star'}
          >
            {props.conversation.starred ? '★' : '☆'}
          </button>
        </div>

        <div class="conversation-item-meta">
          <span class="conversation-item-source">
            {formatSourceName(props.conversation)}
          </span>
          <span>•</span>
          <span class="conversation-item-date">
            {formatters.fullDate(props.conversation.created_at)}
          </span>
          <Show when={props.conversation.archived}>
            <span class="conversation-item-archived-badge">Archived</span>
          </Show>
        </div>

        <Show when={props.conversation.tags && props.conversation.tags.length > 0}>
          <div class="conversation-tags">
            <For each={props.conversation.tags}>
              {(tag) => <span class="conversation-tag">{tag}</span>}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
