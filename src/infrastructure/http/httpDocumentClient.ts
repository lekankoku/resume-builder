import { DocumentClient } from '../../application/ports/repositories';

const errorOf = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => null);
  return new Error(body?.error ?? `${fallback} failed with ${response.status}`);
};

export const createHttpDocumentClient = (
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
): DocumentClient => ({
  list: async () => {
    const response = await fetchFn('/api/documents', { credentials: 'same-origin' });
    if (!response.ok) throw await errorOf(response, 'Loading documents');
    return response.json();
  },
  upload: async (file) => {
    const response = await fetchFn('/api/documents', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-File-Name': encodeURIComponent(file.name) },
      body: file,
    });
    if (!response.ok) throw await errorOf(response, `Uploading ${file.name}`);
    return response.json();
  },
  rename: async (id, name) => {
    const response = await fetchFn(`/api/documents/${id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw await errorOf(response, 'Renaming the document');
    return response.json();
  },
  remove: async (id) => {
    const response = await fetchFn(`/api/documents/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (!response.ok) throw await errorOf(response, 'Deleting the document');
  },
  urlOf: (id) => `/api/documents/${id}`,
});
