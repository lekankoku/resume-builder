import { beforeEach, describe, expect, it } from 'vitest';
import { Repositories } from '../../application/ports/repositories';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { aResume } from '../../testing/resumeFixture';
import { createLocalStorageRepositories } from './localStorageRepositories';

class FakeStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

describe('localStorage repositories', () => {
  const now = new Date(2026, 0, 6);
  const defaults = aResume();
  let storage: FakeStorage;
  let repositories: Repositories;

  beforeEach(() => {
    storage = new FakeStorage();
    repositories = createLocalStorageRepositories(storage, defaults, () => now);
  });

  describe('resume', () => {
    it('loads the defaults when nothing is stored', () => {
      expect(repositories.resume.load()).toEqual(defaults);
    });

    it('restores identity, references, languages and education that were saved', () => {
      const edited = aResume();

      repositories.resume.save(edited);
      const loaded = repositories.resume.load();

      expect(loaded.personal).toEqual({ ...edited.personal, title: defaults.personal.title });
      expect(loaded.references).toEqual(edited.references);
      expect(loaded.languages).toEqual(edited.languages);
      expect(loaded.education).toEqual(edited.education);
    });

    it('always takes the remaining sections and the title from the defaults', () => {
      repositories.resume.save(aResume());

      const loaded = repositories.resume.load();

      expect(loaded.experiences).toEqual(defaults.experiences);
      expect(loaded.projects).toEqual(defaults.projects);
      expect(loaded.personal.title).toBe(defaults.personal.title);
    });
  });

  describe('cover letter', () => {
    it('loads an empty letter dated today when nothing is stored', () => {
      expect(repositories.coverLetter.load()).toEqual(createCoverLetter(now));
    });

    it('restores the saved letter', () => {
      const letter = { ...createCoverLetter(now), body: crypto.randomUUID() };

      repositories.coverLetter.save(letter);

      expect(repositories.coverLetter.load()).toEqual(letter);
    });
  });

  describe('target company', () => {
    it('loads an empty name when nothing is stored', () => {
      expect(repositories.targetCompany.load()).toBe('');
    });

    it('restores the saved name', () => {
      const company = crypto.randomUUID();

      repositories.targetCompany.save(company);

      expect(repositories.targetCompany.load()).toBe(company);
    });
  });
});
