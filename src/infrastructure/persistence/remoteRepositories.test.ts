import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StateClient } from '../../application/ports/repositories';
import { DEFAULT_STAGES } from '../../domain/application/stages';
import { Profile } from '../../domain/resume/Resume';
import { aResume } from '../../testing/resumeFixture';
import { createRemoteRepositories } from './remoteRepositories';

const DELAY = 1000;
const aProfile = (): Profile => {
  const { title, ...profile } = aResume().personal;
  return profile;
};
const aClient = () => ({ load: vi.fn(), save: vi.fn<StateClient['save']>(async () => {}) });

describe('remoteRepositories', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('load', () => {
    it('returns the loaded state', () => {
      const stages = [crypto.randomUUID()];
      const profile = aProfile();

      const { repositories } = createRemoteRepositories({ stages, profile }, aClient(), aProfile());

      expect(repositories.stages.load()).toBe(stages);
      expect(repositories.profile.load()).toBe(profile);
    });

    it('falls back to the defaults for keys the server does not have', () => {
      const defaultProfile = aProfile();

      const { repositories } = createRemoteRepositories({}, aClient(), defaultProfile);

      expect(repositories.applications.load()).toEqual([]);
      expect(repositories.drafts.load()).toEqual([]);
      expect(repositories.stages.load()).toEqual(DEFAULT_STAGES);
      expect(repositories.profile.load()).toBe(defaultProfile);
    });
  });

  describe('save', () => {
    it('sends only the latest value once saves pause for the delay', async () => {
      const client = aClient();
      const { repositories, status } = createRemoteRepositories({}, client, aProfile(), DELAY);
      const latest = [crypto.randomUUID()];

      repositories.stages.save([crypto.randomUUID()]);
      repositories.stages.save(latest);
      expect(status.get()).toBe('saving');
      await vi.advanceTimersByTimeAsync(DELAY);

      expect(client.save).toHaveBeenCalledTimes(1);
      expect(client.save).toHaveBeenCalledWith('stages', latest, undefined);
      expect(status.get()).toBe('saved');
      expect(repositories.stages.load()).toBe(latest);
    });

    it('does not send a value that is unchanged from what was loaded', async () => {
      const client = aClient();
      const stages = [crypto.randomUUID()];
      const { repositories, status } = createRemoteRepositories({ stages }, client, aProfile(), DELAY);

      repositories.stages.save(repositories.stages.load());
      await vi.advanceTimersByTimeAsync(DELAY);

      expect(client.save).not.toHaveBeenCalled();
      expect(status.get()).toBe('saved');
    });

    it('notifies subscribers when the status changes', async () => {
      const { repositories, status } = createRemoteRepositories({}, aClient(), aProfile(), DELAY);
      const listener = vi.fn();
      const unsubscribe = status.subscribe(listener);

      repositories.stages.save([crypto.randomUUID()]);
      await vi.advanceTimersByTimeAsync(DELAY);
      unsubscribe();
      repositories.stages.save([crypto.randomUUID()]);

      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe('failures', () => {
    it('reports an error when sending fails and sends the value again on retry', async () => {
      const client = aClient();
      client.save.mockRejectedValueOnce(new Error(crypto.randomUUID()));
      const { repositories, status, retry } = createRemoteRepositories({}, client, aProfile(), DELAY);
      const stages = [crypto.randomUUID()];

      repositories.stages.save(stages);
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(status.get()).toBe('error');
      await retry();

      expect(client.save).toHaveBeenLastCalledWith('stages', stages, undefined);
      expect(status.get()).toBe('saved');
    });
  });

  describe('flush', () => {
    it('sends pending saves right away with the given options', async () => {
      const client = aClient();
      const { repositories, flush } = createRemoteRepositories({}, client, aProfile(), DELAY);
      const drafts = [] as never[];
      const profile = aProfile();

      repositories.drafts.save(drafts);
      repositories.profile.save(profile);
      await flush({ keepalive: true });

      expect(client.save).toHaveBeenCalledWith('drafts', drafts, { keepalive: true });
      expect(client.save).toHaveBeenCalledWith('profile', profile, { keepalive: true });
      await vi.advanceTimersByTimeAsync(DELAY);
      expect(client.save).toHaveBeenCalledTimes(2);
    });
  });
});
