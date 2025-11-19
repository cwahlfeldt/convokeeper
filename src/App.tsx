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

function AppHeader(props: { onUploadClick: () => void }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header class="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">ConvoKeep</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Privacy-first conversation archive</p>
      </div>

      <div class="flex gap-3">
        <button
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium
                 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={props.onUploadClick}
          aria-label="Upload conversations"
        >
          📁 Upload
        </button>

        <button
          class="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                 text-gray-900 dark:text-gray-100 rounded-lg transition-colors
                 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme() === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme() === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
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
      <div class="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div class="text-sm font-medium text-blue-900 dark:text-blue-100">
          {selectionCount()} selected
        </div>

        <div class="flex gap-2">
          <button
            class="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
                   text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600
                   rounded text-sm font-medium transition-colors"
            onClick={handleStar}
            aria-label="Star selected conversations"
          >
            ⭐ Star
          </button>

          <button
            class="px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
                   text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600
                   rounded text-sm font-medium transition-colors"
            onClick={handleArchive}
            aria-label="Archive selected conversations"
          >
            📦 Archive
          </button>

          <button
            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white
                   rounded text-sm font-medium transition-colors"
            onClick={handleDelete}
            aria-label="Delete selected conversations"
          >
            🗑️ Delete
          </button>

          <button
            class="px-3 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500
                   text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition-colors"
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
    <div class="flex h-[calc(100vh-73px)]">
      <aside class="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <BatchToolbar />
        <ConversationList />
      </aside>

      <main class="flex-1 overflow-hidden">
        <MessageViewer />
      </main>
    </div>
  );
}

function App() {
  const [uploadModalOpen, setUploadModalOpen] = createSignal(false);

  return (
    <ThemeProvider>
      <ConversationProvider>
        <BatchOperationsProvider>
          <TagProvider>
            <div class="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
              <AppHeader onUploadClick={() => setUploadModalOpen(true)} />
              <AppContent />
            </div>

            {/* Render modal at root level for proper overlay */}
            <UploadModal
              isOpen={uploadModalOpen()}
              onClose={() => setUploadModalOpen(false)}
            />
          </TagProvider>
        </BatchOperationsProvider>
      </ConversationProvider>
    </ThemeProvider>
  );
}

export default App;
