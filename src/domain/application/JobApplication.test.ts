import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import {
  ApplicationDetails,
  changeStage,
  createApplication,
  isWebUrl,
  JobApplication,
  restoreVersion,
  saveVersion,
  updateApplicationField,
} from './JobApplication';

const uuid = () => crypto.randomUUID();

const someDetails = (): ApplicationDetails => ({
  company: uuid(),
  role: uuid(),
  postingUrl: uuid(),
  appliedOn: uuid(),
  notes: uuid(),
});

const aCoverLetter = () => ({ ...createCoverLetter(new Date(2026, 0, 6)), body: uuid() });

const anApplication = (): JobApplication =>
  createApplication(someDetails(), { resume: aResume(), coverLetter: aCoverLetter() }, uuid(), new Date(2026, 0, 1), uuid());

describe('JobApplication', () => {
  describe('createApplication', () => {
    it('starts in the given stage with one history entry and no versions', () => {
      const details = someDetails();
      const stage = uuid();
      const id = uuid();
      const now = new Date(2026, 2, 3);

      const application = createApplication(details, { resume: aResume(), coverLetter: aCoverLetter() }, stage, now, id);

      expect(application).toMatchObject({ ...details, id, stage, versions: [] });
      expect(application.stageHistory).toEqual([{ stage, changedAt: now.toISOString() }]);
    });

    it('copies the source CV so later edits to the source do not leak in', () => {
      const source = { resume: aResume(), coverLetter: aCoverLetter() };
      const original = structuredClone(source);

      const application = createApplication(someDetails(), source, uuid(), new Date(), uuid());
      source.resume.experiences[0].bullets[0] = uuid();
      source.coverLetter.body = uuid();

      expect(application.resume).toEqual(original.resume);
      expect(application.coverLetter).toEqual(original.coverLetter);
    });
  });

  describe('updateApplicationField', () => {
    it('replaces only the given field', () => {
      const application = anApplication();
      const notes = uuid();

      const updated = updateApplicationField(application, 'notes', notes);

      expect(updated).toEqual({ ...application, notes });
    });
  });

  describe('isWebUrl', () => {
    it.each(['https://jobs.example.com/1', 'http://example.com', ' HTTPS://example.com '])('accepts %s', (url) => {
      expect(isWebUrl(url)).toBe(true);
    });

    it.each(['javascript:alert(1)', 'data:text/html,x', 'example.com', ''])('rejects %s', (url) => {
      expect(isWebUrl(url)).toBe(false);
    });
  });

  describe('changeStage', () => {
    it('sets the stage and appends a timestamped history entry', () => {
      const application = anApplication();
      const stage = uuid();
      const now = new Date(2026, 4, 5);

      const updated = changeStage(application, stage, now);

      expect(updated.stage).toBe(stage);
      expect(updated.stageHistory).toEqual([...application.stageHistory, { stage, changedAt: now.toISOString() }]);
    });

    it('leaves the history untouched when the stage does not change', () => {
      const application = anApplication();

      const updated = changeStage(application, application.stage, new Date());

      expect(updated).toBe(application);
    });
  });

  describe('saveVersion', () => {
    it('snapshots the current CV with a note and timestamp', () => {
      const application = anApplication();
      const note = uuid();
      const id = uuid();
      const now = new Date(2026, 5, 6);

      const updated = saveVersion(application, note, now, id);

      expect(updated.versions).toEqual([
        { id, note, savedAt: now.toISOString(), resume: application.resume, coverLetter: application.coverLetter },
      ]);
    });

    it('keeps the snapshot unchanged when the draft is edited afterwards', () => {
      const application = saveVersion(anApplication(), uuid(), new Date(), uuid());
      const snapshot = structuredClone(application.versions[0]);

      application.resume.personal.name = uuid();
      application.coverLetter.body = uuid();

      expect(application.versions[0]).toEqual(snapshot);
    });
  });

  describe('restoreVersion', () => {
    it('copies the version into the draft and keeps all versions', () => {
      const versioned = saveVersion(anApplication(), uuid(), new Date(), uuid());
      const edited = { ...versioned, resume: aResume(), coverLetter: aCoverLetter() };

      const restored = restoreVersion(edited, versioned.versions[0].id);

      expect(restored.resume).toEqual(versioned.versions[0].resume);
      expect(restored.coverLetter).toEqual(versioned.versions[0].coverLetter);
      expect(restored.versions).toEqual(versioned.versions);
    });

    it('does not share objects between the draft and the restored version', () => {
      const versioned = saveVersion(anApplication(), uuid(), new Date(), uuid());

      const restored = restoreVersion(versioned, versioned.versions[0].id);
      restored.resume.personal.name = uuid();

      expect(restored.versions[0].resume.personal.name).toBe(versioned.resume.personal.name);
    });

    it('leaves the application unchanged for an unknown version', () => {
      const application = anApplication();

      expect(restoreVersion(application, uuid())).toBe(application);
    });
  });
});
