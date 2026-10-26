import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StateClient } from '../../application/ports/repositories';
import { ApplicationDraft } from '../../domain/application/ApplicationDraft';
import { createBlankCv, JobApplication } from '../../domain/application/JobApplication';
import { DEFAULT_STAGES } from '../../domain/application/stages';
import { createCandidateFacts } from '../../domain/candidate/CandidateFacts';
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
      expect(repositories.leads.load()).toEqual([]);
      expect(repositories.stages.load()).toEqual(DEFAULT_STAGES);
      expect(repositories.profile.load()).toBe(defaultProfile);
      expect(repositories.facts.load()).toEqual(createCandidateFacts());
    });
  });

  describe('load of saved candidate facts', () => {
    it('fills fields the saved facts do not have', () => {
      const languages = [{ name: crypto.randomUUID(), level: 'C1', basis: 'certificate' as const }];

      const { repositories } = createRemoteRepositories({ facts: { languages } as never }, aClient(), aProfile());

      expect(repositories.facts.load()).toEqual({ ...createCandidateFacts(), languages });
    });
  });

  describe('load of data saved before the CV fields were extended', () => {
    const anOldResume = () => {
      const { volunteering, layout, ...resume } = aResume();
      return { ...resume, education: resume.education.map(({ bullets, ...education }) => education) };
    };
    const anOldCoverLetter = () => {
      const { subject, ...letter } = createBlankCv(new Date()).coverLetter;
      return letter;
    };

    it('fills the new fields of applications and their versions', () => {
      const application = {
        id: crypto.randomUUID(),
        resume: anOldResume(),
        coverLetter: anOldCoverLetter(),
        versions: [{ id: crypto.randomUUID(), savedAt: '', note: '', resume: anOldResume(), coverLetter: anOldCoverLetter() }],
      } as unknown as JobApplication;

      const { repositories } = createRemoteRepositories({ applications: [application] }, aClient(), aProfile());

      const [loaded] = repositories.applications.load();
      expect(loaded.resume.volunteering).toEqual([]);
      expect(loaded.resume.layout).toBe('experience-first');
      expect(loaded.resume.education.every((e) => Array.isArray(e.bullets))).toBe(true);
      expect(loaded.coverLetter.subject).toBe('');
      expect(loaded.versions[0].resume.volunteering).toEqual([]);
      expect(loaded.versions[0].coverLetter.subject).toBe('');
    });

    it('fills the new fields of drafts and turns a draft that generated its CV into a new CV', () => {
      const draft = {
        id: crypto.randomUUID(),
        cvStart: 'generate',
        verifiedSections: ['personal'],
        resume: anOldResume(),
        coverLetter: anOldCoverLetter(),
        generated: { analysis: {} },
      } as unknown as ApplicationDraft;

      const { repositories } = createRemoteRepositories({ drafts: [draft] }, aClient(), aProfile());

      const [loaded] = repositories.drafts.load();
      expect(loaded.resume.volunteering).toEqual([]);
      expect(loaded.coverLetter.subject).toBe('');
      expect(loaded.cvStart).toBe('new');
      expect(loaded).not.toHaveProperty('generated');
      expect(loaded).not.toHaveProperty('verifiedSections');
    });

    it('gives applications without suggestions an empty suggestion set', () => {
      const application = { id: crypto.randomUUID(), ...createBlankCv(new Date()), versions: [] } as unknown as JobApplication;

      const { repositories } = createRemoteRepositories({ applications: [application] }, aClient(), aProfile());

      expect(repositories.applications.load()[0].suggestions).toBeNull();
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
