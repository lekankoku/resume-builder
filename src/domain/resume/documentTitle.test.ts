import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { coverLetterDocumentTitle, resumeDocumentTitle } from './documentTitle';

describe('documentTitle', () => {
  const { personal } = aResume();
  const company = crypto.randomUUID();

  it('names the resume after the person, title and target company', () => {
    expect(resumeDocumentTitle(personal, company)).toBe(`${personal.name} (${personal.title}) (${company})`);
  });

  it('omits the company suffix from the resume title when there is no target company', () => {
    expect(resumeDocumentTitle(personal, '')).toBe(`${personal.name} (${personal.title})`);
  });

  it('names the cover letter after the person and target company', () => {
    expect(coverLetterDocumentTitle(personal, company)).toBe(`${personal.name} - Cover Letter (${company})`);
  });

  it('omits the company suffix from the cover letter title when there is no target company', () => {
    expect(coverLetterDocumentTitle(personal, '')).toBe(`${personal.name} - Cover Letter`);
  });
});
