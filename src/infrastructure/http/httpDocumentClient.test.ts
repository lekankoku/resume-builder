import { describe, expect, it, vi } from 'vitest';
import { createHttpDocumentClient } from './httpDocumentClient';

const respond = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

const aDocument = () => ({ id: crypto.randomUUID(), name: crypto.randomUUID(), size: 1, uploadedAt: new Date().toISOString() });

describe('httpDocumentClient', () => {
  it('lists the stored documents', async () => {
    const documents = [aDocument()];
    const fetchFn = respond(200, documents);

    expect(await createHttpDocumentClient(fetchFn).list()).toEqual(documents);
    expect(fetchFn).toHaveBeenCalledWith('/api/documents', { credentials: 'same-origin' });
  });

  it('uploads a file with its encoded name', async () => {
    const stored = aDocument();
    const fetchFn = respond(201, stored);
    const file = new File([crypto.randomUUID()], `${crypto.randomUUID()} résumé.pdf`);

    expect(await createHttpDocumentClient(fetchFn).upload(file)).toEqual(stored);
    expect(fetchFn).toHaveBeenCalledWith('/api/documents', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-File-Name': encodeURIComponent(file.name) },
      body: file,
    });
  });

  it('renames a document and returns the stored result', async () => {
    const renamed = aDocument();
    const fetchFn = respond(200, renamed);

    expect(await createHttpDocumentClient(fetchFn).rename(renamed.id, renamed.name)).toEqual(renamed);
    expect(fetchFn).toHaveBeenCalledWith(`/api/documents/${renamed.id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renamed.name }),
    });
  });

  it('deletes a document by id', async () => {
    const fetchFn = respond(204);
    const id = crypto.randomUUID();

    await createHttpDocumentClient(fetchFn).remove(id);

    expect(fetchFn).toHaveBeenCalledWith(`/api/documents/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  });

  it('builds the URL a document is served from', () => {
    const id = crypto.randomUUID();

    expect(createHttpDocumentClient(respond(200)).urlOf(id)).toBe(`/api/documents/${id}`);
  });

  it("fails with the server's reason when an upload is refused", async () => {
    const error = crypto.randomUUID();
    const file = new File(['x'], `${crypto.randomUUID()}.html`);

    await expect(createHttpDocumentClient(respond(415, { error })).upload(file)).rejects.toThrow(error);
  });

  it('fails with the status when the response has no reason', async () => {
    await expect(createHttpDocumentClient(respond(500)).list()).rejects.toThrow('Loading documents failed with 500');
    await expect(createHttpDocumentClient(respond(500)).remove(crypto.randomUUID())).rejects.toThrow('Deleting the document failed with 500');
    await expect(createHttpDocumentClient(respond(500)).rename(crypto.randomUUID(), crypto.randomUUID())).rejects.toThrow(
      'Renaming the document failed with 500',
    );
  });
});
