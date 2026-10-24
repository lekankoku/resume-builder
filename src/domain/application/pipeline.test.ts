import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import { changeStage, createApplication, JobApplication } from './JobApplication';
import { appliedWithin, newestAppliedFirst, recentActivity, stageColumns } from './pipeline';

const uuid = () => crypto.randomUUID();

const anApplication = (stage: string, appliedOn = '', createdAt = new Date()): JobApplication =>
  createApplication(
    { company: uuid(), role: uuid(), postingUrl: '', appliedOn, notes: '' },
    { resume: aResume(), coverLetter: createCoverLetter(createdAt) },
    stage,
    createdAt,
    uuid(),
  );

describe('pipeline', () => {
  describe('stageColumns', () => {
    it('groups applications by stage in the configured stage order, including empty stages', () => {
      const [first, second, empty] = [uuid(), uuid(), uuid()];
      const a = anApplication(second);
      const b = anApplication(first);
      const c = anApplication(second);

      expect(stageColumns([a, b, c], [first, second, empty])).toEqual([
        { stage: first, applications: [b] },
        { stage: second, applications: [a, c] },
        { stage: empty, applications: [] },
      ]);
    });

    it('adds a column for a stage that is no longer configured but still used', () => {
      const listed = uuid();
      const removed = uuid();
      const application = anApplication(removed);

      expect(stageColumns([application], [listed]).map((column) => column.stage)).toEqual([listed, removed]);
    });
  });

  describe('appliedWithin', () => {
    it('counts applications applied on or after the cut-off day and not in the future', () => {
      const now = new Date('2026-10-24T12:00:00Z');
      const applications = [
        anApplication(uuid(), '2026-10-24'),
        anApplication(uuid(), '2026-09-25'),
        anApplication(uuid(), '2026-09-20'),
        anApplication(uuid(), '2026-11-01'),
        anApplication(uuid(), ''),
      ];

      expect(appliedWithin(applications, 30, now)).toBe(2);
    });
  });

  describe('newestAppliedFirst', () => {
    it('orders applications by applied date, newest first, with undated ones last', () => {
      const older = anApplication(uuid(), '2026-09-01');
      const undated = anApplication(uuid());
      const newer = anApplication(uuid(), '2026-10-01');

      expect(newestAppliedFirst([older, undated, newer])).toEqual([newer, older, undated]);
    });
  });

  describe('recentActivity', () => {
    it('lists the latest stage changes across applications, newest first, up to the limit', () => {
      const first = anApplication(uuid(), '', new Date('2026-10-01T00:00:00Z'));
      const second = changeStage(anApplication(uuid(), '', new Date('2026-10-02T00:00:00Z')), uuid(), new Date('2026-10-05T00:00:00Z'));

      const activity = recentActivity([first, second], 2);

      expect(activity.map((a) => [a.application.id, a.stage, a.changedAt])).toEqual([
        [second.id, second.stage, '2026-10-05T00:00:00.000Z'],
        [second.id, second.stageHistory[0].stage, '2026-10-02T00:00:00.000Z'],
      ]);
    });
  });
});
