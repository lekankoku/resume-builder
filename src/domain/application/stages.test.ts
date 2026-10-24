import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import { createApplication } from './JobApplication';
import { addStage, initialStage, isActiveApplication, isStageInUse, removeStage, stageOptions } from './stages';

const uuid = () => crypto.randomUUID();

const anApplicationIn = (stage: string) =>
  createApplication(
    { company: uuid(), role: uuid(), postingUrl: '', appliedOn: '', notes: '' },
    { resume: aResume(), coverLetter: createCoverLetter(new Date()) },
    stage,
    new Date(),
    uuid(),
  );

describe('stages', () => {
  describe('stageOptions', () => {
    it('keeps the stages as they are when the current stage is listed', () => {
      const stages = [uuid(), uuid()];

      expect(stageOptions(stages, stages[1])).toBe(stages);
    });

    it('puts an unlisted current stage first', () => {
      const stages = [uuid()];
      const current = uuid();

      expect(stageOptions(stages, current)).toEqual([current, ...stages]);
    });
  });

  describe('addStage', () => {
    it('appends a trimmed new stage', () => {
      const stages = [uuid()];
      const stage = uuid();

      expect(addStage(stages, `  ${stage} `)).toEqual([...stages, stage]);
    });

    it.each([['blank', '   '], ['duplicate', 'Applied']])('ignores a %s name', (_, name) => {
      const stages = ['Applied'];

      expect(addStage(stages, name)).toBe(stages);
    });
  });

  describe('removeStage', () => {
    it('removes a stage no application is in', () => {
      const [kept, removed] = [uuid(), uuid()];

      expect(removeStage([kept, removed], removed, [anApplicationIn(kept)])).toEqual([kept]);
    });

    it('keeps a stage an application is currently in', () => {
      const stage = uuid();
      const stages = [stage];

      expect(removeStage(stages, stage, [anApplicationIn(stage)])).toBe(stages);
    });
  });

  describe('isStageInUse', () => {
    it('tells whether any application is in the stage', () => {
      const stage = uuid();
      const applications = [anApplicationIn(stage)];

      expect(isStageInUse(stage, applications)).toBe(true);
      expect(isStageInUse(uuid(), applications)).toBe(false);
    });
  });

  describe('initialStage', () => {
    it('puts new applications in Applied when that stage exists', () => {
      expect(initialStage([uuid(), 'Applied', uuid()])).toBe('Applied');
    });

    it('falls back to the first stage when Applied was removed', () => {
      const first = uuid();

      expect(initialStage([first, uuid()])).toBe(first);
    });

    it('uses Applied when there are no stages at all', () => {
      expect(initialStage([])).toBe('Applied');
    });
  });

  describe('isActiveApplication', () => {
    it.each(['Rejected', 'Withdrawn'])('treats an application in %s as closed', (stage) => {
      expect(isActiveApplication(anApplicationIn(stage))).toBe(false);
    });

    it('treats an application in any other stage as active', () => {
      expect(isActiveApplication(anApplicationIn(uuid()))).toBe(true);
    });
  });
});
