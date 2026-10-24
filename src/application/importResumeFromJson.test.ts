import { describe, expect, it } from 'vitest';
import { aResume } from '../testing/resumeFixture';
import { importResumeFromJson } from './importResumeFromJson';

describe('importResumeFromJson', () => {
  it('applies imported content while keeping locally stored sections', () => {
    const current = aResume();
    const imported = aResume();

    const result = importResumeFromJson(current, JSON.stringify(imported));

    expect(result.experiences).toEqual(imported.experiences);
    expect(result.personal).toEqual({ ...current.personal, title: imported.personal.title });
    expect(result.references).toEqual(current.references);
  });

  it('rejects invalid JSON', () => {
    expect(() => importResumeFromJson(aResume(), '{ not json')).toThrow(SyntaxError);
  });
});
