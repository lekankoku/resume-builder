import { describe, expect, it, vi } from 'vitest';
import { createHttpStateClient } from './httpStateClient';

const respond = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('httpStateClient', () => {
  it('loads the state from the API with the session cookie', async () => {
    const state = { stages: [crypto.randomUUID()] };
    const fetchFn = respond(200, state);

    expect(await createHttpStateClient(fetchFn).load()).toEqual(state);
    expect(fetchFn).toHaveBeenCalledWith('/api/state', { credentials: 'same-origin' });
  });

  it('saves a key as JSON with a PUT', async () => {
    const fetchFn = respond(204);
    const stages = [crypto.randomUUID()];

    await createHttpStateClient(fetchFn).save('stages', stages, { keepalive: true });

    expect(fetchFn).toHaveBeenCalledWith('/api/state/stages', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stages),
      keepalive: true,
    });
  });

  it('fails when loading is not successful', async () => {
    await expect(createHttpStateClient(respond(401)).load()).rejects.toThrow('Loading state failed with 401');
  });

  it('fails when saving is not successful', async () => {
    await expect(createHttpStateClient(respond(500)).save('stages', [])).rejects.toThrow('Saving stages failed with 500');
  });
});
