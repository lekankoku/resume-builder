import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import { createApplication } from './JobApplication';
import { addStage, isActiveApplication, isStageInUse, removeStage } from './stages';

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

  describe('isActiveApplication', () => {
    it.each(['Rejected', 'Withdrawn'])('treats an application in %s as closed', (stage) => {
      expect(isActiveApplication(anApplicationIn(stage))).toBe(false);
    });

    it('treats an application in any other stage as active', () => {
      expect(isActiveApplication(anApplicationIn(uuid()))).toBe(true);
    });
  });
});
