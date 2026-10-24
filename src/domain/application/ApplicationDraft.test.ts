import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import { ApplicationDraft, upsertDraft } from './ApplicationDraft';

const uuid = () => crypto.randomUUID();

const aDraft = (id: string = uuid()): ApplicationDraft => ({
  id,
  updatedAt: new Date().toISOString(),
  stepId: uuid(),
  details: { company: uuid(), role: uuid(), postingUrl: '', appliedOn: '', notes: '' },
  stage: uuid(),
  cvStart: 'new',
  sourceId: '',
  jsonInput: '',
  cvKey: null,
  resume: aResume(),
  coverLetter: createCoverLetter(new Date()),
  verifiedSections: [],
});

describe('ApplicationDraft', () => {
  describe('upsertDraft', () => {
    it('appends a draft that is not stored yet', () => {
      const existing = aDraft();
      const draft = aDraft();

      expect(upsertDraft([existing], draft)).toEqual([existing, draft]);
    });

    it('replaces the stored draft with the same id in place', () => {
      const [first, stored, last] = [aDraft(), aDraft(), aDraft()];
      const updated = aDraft(stored.id);

      expect(upsertDraft([first, stored, last], updated)).toEqual([first, updated, last]);
    });
  });
});
