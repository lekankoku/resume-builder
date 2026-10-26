import { AiClient } from '../../application/ports/repositories';

const errorOf = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => null);
  return new Error(body?.error ?? `${fallback} failed with ${response.status}`);
};

const post = async (fetchFn: typeof fetch, path: string, body: unknown, action: string) => {
  const response = await fetchFn(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await errorOf(response, action);
  return response.json();
};

export const createHttpAiClient = (fetchFn: typeof fetch = (input, init) => fetch(input, init)): AiClient => ({
  suggest: (request) => post(fetchFn, '/api/cv/suggest', request, 'Getting suggestions'),
  usage: async () => {
    const response = await fetchFn('/api/usage', { credentials: 'same-origin' });
    if (!response.ok) throw await errorOf(response, 'Loading AI usage');
    return response.json();
  },
});
