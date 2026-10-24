import { describe, expect, it } from 'vitest';
import { readLocalState } from './readLocalState';

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

describe('readLocalState', () => {
  it('reads every store that was saved by the localStorage version of the app', () => {
    const storage = new FakeStorage();
    const applications = [{ id: crypto.randomUUID() }];
    const drafts = [{ id: crypto.randomUUID() }];
    const stages = [crypto.randomUUID()];
    const profile = { name: crypto.randomUUID() };
    storage.setItem('resume-applications', JSON.stringify(applications));
    storage.setItem('resume-application-drafts', JSON.stringify(drafts));
    storage.setItem('resume-stages', JSON.stringify(stages));
    storage.setItem('resume-identity-attributes', JSON.stringify(profile));

    expect(readLocalState(storage)).toEqual({ applications, drafts, stages, profile });
  });

  it('leaves out stores that were never saved', () => {
    const storage = new FakeStorage();
    const stages = [crypto.randomUUID()];
    storage.setItem('resume-stages', JSON.stringify(stages));
    storage.setItem('resume-cover-letter', JSON.stringify({ body: crypto.randomUUID() }));

    expect(readLocalState(storage)).toEqual({ stages });
  });
});
