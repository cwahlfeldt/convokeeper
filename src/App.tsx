/**
 * ConvoKeep - Main Application Component
 *
 * Privacy-first AI conversation archive built with SolidJS
 */

import { createSignal, Show } from 'solid-js';
import { ConversationProvider } from './contexts/ConversationContext';
import { BatchOperationsProvider } from './contexts/BatchOperationsContext';
import { TagProvider } from './contexts/TagContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useBatchOperations } from './contexts/BatchOperationsContext';
import { useConversations } from './contexts/ConversationContext';
import ConversationList from './components/ConversationList';
import MessageViewer from './components/MessageViewer';
import UploadModal from './components/UploadModal';

// Import styles
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/messages.css';
import './styles/fuzzy-search-new.css';
import './styles/responsive.css';
import './styles/utilities.css';

function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const [uploadModalOpen, setUploadModalOpen] = createSignal(false);

  return (
    <>
      <header class="app-header">
        <div class="app-branding">
          <h1 class="app-title">ConvoKeep</h1>
          <p class="app-tagline">Privacy-first conversation archive</p>
        </div>

        <div class="app-actions">
          <button
            class="btn btn-primary"
            onClick={() => setUploadModalOpen(true)}
            aria-label="Upload conversations"
          >
            📁 Upload
          </button>

          <button
            class="btn btn-icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme() === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme() === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <UploadModal
        isOpen={uploadModalOpen()}
        onClose={() => setUploadModalOpen(false)}
      />
    </>
  );
}

function BatchToolbar() {
  const { selectionCount, deselectAll, deleteSelected, starSelected, archiveSelected } = useBatchOperations();
  const { reload } = useConversations();

  const handleDelete = async () => {
    await deleteSelected(reload);
  };

  const handleStar = async () => {
    await starSelected(reload);
  };

  const handleArchive = async () => {
    await archiveSelected(reload);
  };

  return (
    <Show when={selectionCount() > 0}>
      <div class="batch-toolbar">
        <div class="batch-info">
          {selectionCount()} selected
        </div>

        <div class="batch-actions">
          <button
            class="btn btn-sm btn-secondary"
            onClick={handleStar}
            aria-label="Star selected conversations"
          >
            ⭐ Star
          </button>

          <button
            class="btn btn-sm btn-secondary"
            onClick={handleArchive}
            aria-label="Archive selected conversations"
          >
            📦 Archive
          </button>

          <button
            class="btn btn-sm btn-danger"
            onClick={handleDelete}
            aria-label="Delete selected conversations"
          >
            🗑️ Delete
          </button>

          <button
            class="btn btn-sm"
            onClick={deselectAll}
            aria-label="Deselect all"
          >
            Clear
          </button>
        </div>
      </div>
    </Show>
  );
}

function AppContent() {
  return (
    <div class="app-layout">
      <aside class="app-sidebar">
        <BatchToolbar />
        <ConversationList />
      </aside>

      <main class="app-main">
        <MessageViewer />
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConversationProvider>
        <BatchOperationsProvider>
          <TagProvider>
            <div class="app-container">
              <AppHeader />
              <AppContent />
            </div>
          </TagProvider>
        </BatchOperationsProvider>
      </ConversationProvider>
    </ThemeProvider>
  );
}

export default App;
