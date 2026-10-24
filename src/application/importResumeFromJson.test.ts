import { describe, expect, it } from 'vitest';
import { aResume } from '../testing/resumeFixture';
import { createBlankCv } from '../domain/application/JobApplication';
import { importResumeFromJson, resumeFromJson } from './importResumeFromJson';

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

describe('resumeFromJson', () => {
  it('takes every section from a complete CV', () => {
    const imported = aResume();

    expect(resumeFromJson(JSON.stringify(imported))).toEqual(imported);
  });

  it('fills sections and personal fields missing from the JSON with blanks', () => {
    const name = crypto.randomUUID();

    const result = resumeFromJson(JSON.stringify({ personal: { name } }));

    expect(result.personal).toEqual({ ...createBlankCv(new Date()).resume.personal, name });
    expect(result.experiences).toEqual([]);
    expect(result.crossFunctional).toEqual({ title: '', bullets: [] });
  });

  it.each(['[]', 'null', '42'])('rejects %s because it is not an object', (json) => {
    expect(() => resumeFromJson(json)).toThrow('CV JSON must be an object');
  });

  it('rejects invalid JSON', () => {
    expect(() => resumeFromJson('{ not json')).toThrow(SyntaxError);
  });
});
