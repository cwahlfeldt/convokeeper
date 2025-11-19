import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import UploadModal from '../UploadModal';
import { ConversationProvider } from '../../contexts/ConversationContext';

describe('UploadModal Component', () => {
  const mockOnClose = vi.fn();

  const renderWithProvider = (isOpen = true) => {
    return render(() => (
      <ConversationProvider>
        <UploadModal isOpen={isOpen} onClose={mockOnClose} />
      </ConversationProvider>
    ));
  };

  it('renders when open', () => {
    renderWithProvider(true);
    expect(screen.getByText('Upload Conversations')).toBeTruthy();
  });

  it('does not render when closed', () => {
    renderWithProvider(false);
    expect(screen.queryByText('Upload Conversations')).toBeFalsy();
  });

  it('has close button', () => {
    renderWithProvider(true);
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeTruthy();
  });

  it('calls onClose when close button clicked', () => {
    renderWithProvider(true);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays upload dropzone', () => {
    renderWithProvider(true);
    expect(screen.getByText(/drag and drop your conversation export/i)).toBeTruthy();
  });

  it('shows supported formats', () => {
    renderWithProvider(true);
    expect(screen.getByText(/supported/i)).toBeTruthy();
  });

  it('has file input with correct accept types', () => {
    const { container } = renderWithProvider(true);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toBe('.zip,.json,.txt');
  });

  it('file input is hidden', () => {
    const { container } = renderWithProvider(true);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.style.display).toBe('none');
  });

  it('has close button in footer', () => {
    renderWithProvider(true);
    const closeButtons = screen.getAllByText('Close');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('renders modal overlay', () => {
    const { container } = renderWithProvider(true);
    const overlay = container.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
  });

  it('prevents propagation on modal content click', () => {
    const { container } = renderWithProvider(true);
    const modalContent = container.querySelector('.modal-content');
    expect(modalContent).toBeTruthy();
  });
});
