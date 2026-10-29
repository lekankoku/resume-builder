// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { DocumentClient, StoredDocument } from '../../application/ports/repositories';
import { ToastProvider } from '../shell/Toast';
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

const renderView = (client: DocumentClient) =>
  render(
    <MemoryRouter>
      <DocumentsView client={client} />
    </MemoryRouter>,
  );

describe('DocumentsView', () => {
  describe('rename', () => {
    it('renames a document and shows its new name', async () => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument();
      const name = `${crypto.randomUUID()}.docx`;
      const rename = vi.fn(async () => ({ ...document, name }));
      renderView(clientWith([document], rename));

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
      renderView(clientWith([document], rename));

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
      renderView(clientWith([document], vi.fn()));

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
      renderView(clientWith([document], async () => Promise.reject(new Error(message))));

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
      renderView(clientWith([document]));

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
      renderView(clientWith([document]));

      // When
      await user.click(await screen.findByRole('button', { name: `Preview ${document.name}` }));

      // Then
      expect(screen.getByRole('img', { name: document.name })).toHaveAttribute('src', `/api/documents/${document.id}`);
    });

    it.each(['doc', 'docx'])('offers no preview for a %s file', async (extension) => {
      // Given
      const document = aStoredDocument(extension);

      // When
      renderView(clientWith([document]));

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
      renderView(clientWith([document]));
      await user.click(await screen.findByRole('button', { name: `Preview ${document.name}` }));

      // When
      await close(user);

      // Then
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps keyboard focus inside the preview and returns it to the preview button on close', async () => {
      // Given
      const user = userEvent.setup();
      const document = aStoredDocument();
      renderView(clientWith([document]));
      await user.click(await screen.findByRole('button', { name: `Preview ${document.name}` }));
      const close = screen.getByRole('button', { name: 'Close preview' });
      expect(close).toHaveFocus();

      // When
      await user.tab();
      await user.tab();

      // Then
      expect(close).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('button', { name: `Preview ${document.name}` })).toHaveFocus();
    });
  });

  describe('upload', () => {
    it('reports every file that failed and confirms the ones that uploaded', async () => {
      // Given
      const user = userEvent.setup();
      const [first, second] = [crypto.randomUUID(), crypto.randomUUID()];
      const uploaded = aStoredDocument();
      const upload = vi
        .fn()
        .mockRejectedValueOnce(new Error(first))
        .mockResolvedValueOnce(uploaded)
        .mockRejectedValueOnce(new Error(second));
      render(
        <MemoryRouter>
          <ToastProvider>
            <DocumentsView client={{ ...clientWith([]), upload }} />
          </ToastProvider>
        </MemoryRouter>,
      );
      const files = ['a.pdf', 'b.pdf', 'c.pdf'].map((name) => new File([''], name, { type: 'application/pdf' }));

      // When
      await user.upload(await screen.findByLabelText('Upload'), files);

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(`${first} ${second}`);
      expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent('1 document uploaded');
      expect(screen.getByRole('link', { name: uploaded.name })).toBeVisible();
    });
  });

  describe('search', () => {
    it('shows only the documents whose name matches', async () => {
      // Given
      const user = userEvent.setup();
      const match = aStoredDocument();
      const other = aStoredDocument();
      renderView(clientWith([match, other]));

      // When
      await user.type(await screen.findByRole('searchbox', { name: 'Search documents' }), match.name.slice(0, 8));

      // Then
      expect(screen.getByRole('link', { name: match.name })).toBeVisible();
      expect(screen.queryByRole('link', { name: other.name })).not.toBeInTheDocument();
    });

    it('says so when no document matches', async () => {
      // Given
      const user = userEvent.setup();
      renderView(clientWith([aStoredDocument()]));

      // When
      await user.type(await screen.findByRole('searchbox', { name: 'Search documents' }), crypto.randomUUID());

      // Then
      expect(screen.getByText('No documents match your search.')).toBeVisible();
    });
  });

  describe('loading', () => {
    it('shows placeholder rows until the documents arrive', async () => {
      // Given
      const document = aStoredDocument();
      let resolve: (documents: StoredDocument[]) => void = () => {};
      const client = { ...clientWith([]), list: () => new Promise<StoredDocument[]>((r) => (resolve = r)) };
      renderView(client);
      expect(screen.getByRole('status', { name: 'Loading documents' })).toBeVisible();

      // When
      resolve([document]);

      // Then
      expect(await screen.findByRole('link', { name: document.name })).toBeVisible();
      expect(screen.queryByRole('status', { name: 'Loading documents' })).not.toBeInTheDocument();
    });

    it('replaces the placeholder rows with the error when the documents cannot be loaded', async () => {
      // Given
      const message = crypto.randomUUID();

      // When
      renderView({ ...clientWith([]), list: async () => Promise.reject(new Error(message)) });

      // Then
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.queryByRole('status', { name: 'Loading documents' })).not.toBeInTheDocument();
    });
  });
});
