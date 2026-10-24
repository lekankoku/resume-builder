import { StateClient } from '../../application/ports/repositories';

export const createHttpStateClient = (
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
): StateClient => ({
  load: async () => {
    const response = await fetchFn('/api/state', { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Loading state failed with ${response.status}`);
    return response.json();
  },
  save: async (key, value, options) => {
    const response = await fetchFn(`/api/state/${key}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
      keepalive: options?.keepalive,
    });
    if (!response.ok) throw new Error(`Saving ${key} failed with ${response.status}`);
  },
});
