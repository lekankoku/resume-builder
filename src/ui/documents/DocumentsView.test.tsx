// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DocumentClient, StoredDocument } from '../../application/ports/repositories';
import DocumentsView from './DocumentsView';

const aStoredDocument = (extension = 'pdf'): StoredDocument => ({
  id: crypto.randomUUID(),
  name: `${crypto.randomUUID()}.${extension}`,
  size: 1,
  uploadedAt: new Date().toISOString(),
});

const clientWith = (documents: StoredDocument[], rename: DocumentClient['rename'] = vi.fn()): DocumentClient => ({
  list: async () => documents,
  upload: vi.fn(),
  rename,
  remove: vi.fn(),
  urlOf: (id) => `/api/documents/${id}`,
});

describe('DocumentsView', () => {
  describe('rename', () => {
    it('renames a document and shows its new name', async () => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument();
      const name = `${crypto.randomUUID()}.docx`;
      const rename = vi.fn(async () => ({ ...document, name }));
      render(<DocumentsView client={clientWith([document], rename)} />);

      // When
      await user.click(await screen.findByRole('button', { name: `Rename ${document.name}` }));
      await user.clear(screen.getByRole('textbox', { name: 'Document name' }));
      await user.type(screen.getByRole('textbox', { name: 'Document name' }), `${name}{Enter}`);

      // Then
      expect(rename).toHaveBeenCalledWith(document.id, name);
      expect(await screen.findByRole('link', { name })).toBeVisible();
      expect(screen.queryByRole('textbox', { name: 'Document name' })).not.toBeInTheDocument();
    });

    it('keeps the original name when the rename is cancelled', async () => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument();
      const rename = vi.fn();
      render(<DocumentsView client={clientWith([document], rename)} />);

      // When
      await user.click(await screen.findByRole('button', { name: `Rename ${document.name}` }));
      await user.type(screen.getByRole('textbox', { name: 'Document name' }), crypto.randomUUID());
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      // Then
      expect(rename).not.toHaveBeenCalled();
      expect(screen.getByRole('link', { name: document.name })).toBeVisible();
    });

    it('cancels the rename with Escape', async () => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument();
      render(<DocumentsView client={clientWith([document], vi.fn())} />);

      // When
      await user.click(await screen.findByRole('button', { name: `Rename ${document.name}` }));
      await user.keyboard('{Escape}');

      // Then
      expect(screen.getByRole('link', { name: document.name })).toBeVisible();
    });

    it('shows the error and keeps editing when the rename is refused', async () => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument();
      const message = crypto.randomUUID();
      render(<DocumentsView client={clientWith([document], async () => Promise.reject(new Error(message)))} />);

      // When
      await user.click(await screen.findByRole('button', { name: `Rename ${document.name}` }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.getByRole('textbox', { name: 'Document name' })).toBeVisible();
    });
  });

  describe('preview', () => {
    it.each(['pdf', 'txt'])('shows a %s file in a frame', async (extension) => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument(extension);
      render(<DocumentsView client={clientWith([document])} />);

      // When
      await user.click(await screen.findByRole('button', { name: `Preview ${document.name}` }));

      // Then
      const dialog = screen.getByRole('dialog', { name: `Preview ${document.name}` });
      expect(dialog).toBeVisible();
      expect(within(dialog).getByTitle(document.name)).toHaveAttribute('src', `/api/documents/${document.id}`);
    });

    it.each(['png', 'jpg', 'jpeg'])('shows a %s file as an image', async (extension) => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument(extension);
      render(<DocumentsView client={clientWith([document])} />);

      // When
      await user.click(await screen.findByRole('button', { name: `Preview ${document.name}` }));

      // Then
      expect(screen.getByRole('img', { name: document.name })).toHaveAttribute('src', `/api/documents/${document.id}`);
    });

    it.each(['doc', 'docx'])('offers no preview for a %s file', async (extension) => {
      // Given
      const document = aStoredDocument(extension);

      // When
      render(<DocumentsView client={clientWith([document])} />);

      // Then
      expect(await screen.findByRole('link', { name: document.name })).toBeVisible();
      expect(screen.queryByRole('button', { name: `Preview ${document.name}` })).not.toBeInTheDocument();
    });

    it.each([
      ['the close button', (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Close preview' }))],
      ['Escape', (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
      ['a click outside the document', (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('dialog'))],
    ])('closes with %s', async (_, close) => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument();
      render(<DocumentsView client={clientWith([document])} />);
      await user.click(await screen.findByRole('button', { name: `Preview ${document.name}` }));

      // When
      await close(user);

      // Then
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
