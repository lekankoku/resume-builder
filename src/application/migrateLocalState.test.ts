import { describe, expect, it, vi } from 'vitest';
import { migrateLocalState } from './migrateLocalState';
import { StateClient } from './ports/repositories';

const aClient = () => ({ load: vi.fn(), save: vi.fn(async () => {}) }) satisfies StateClient;

describe('migrateLocalState', () => {
  it('uploads local data when the server has none and uses it', async () => {
    const client = aClient();
    const local = { stages: [crypto.randomUUID()], profile: { name: crypto.randomUUID() } as never };

    const state = await migrateLocalState({}, local, client);

    expect(state).toEqual(local);
    expect(client.save).toHaveBeenCalledTimes(2);
    expect(client.save).toHaveBeenCalledWith('stages', local.stages);
    expect(client.save).toHaveBeenCalledWith('profile', local.profile);
  });

  it('keeps the server data and uploads nothing when the server already has data', async () => {
    const client = aClient();
    const remote = { stages: [crypto.randomUUID()] };

    const state = await migrateLocalState(remote, { stages: [crypto.randomUUID()] }, client);

    expect(state).toBe(remote);
    expect(client.save).not.toHaveBeenCalled();
  });

  it('uploads nothing when there is no local data either', async () => {
    const client = aClient();

    expect(await migrateLocalState({}, {}, client)).toEqual({});
    expect(client.save).not.toHaveBeenCalled();
  });
});
