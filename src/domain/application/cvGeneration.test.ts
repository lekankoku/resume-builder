import { describe, expect, it } from 'vitest';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import { coverLetterFromGenerated, formatUsd, GeneratedCoverLetter, GeneratedCv, generationBlocker, resumeFromGeneratedCv } from './cvGeneration';
import { ApplicationDetails } from './JobApplication';

const details = (jobDescription?: string): ApplicationDetails => ({
  company: crypto.randomUUID(),
  role: crypto.randomUUID(),
  postingUrl: '',
  appliedOn: '2026-10-25',
  notes: '',
  jobDescription,
});

describe('cvGeneration', () => {
  describe('generationBlocker', () => {
    it('allows generation with a job bank and a job description', () => {
      expect(generationBlocker(details(crypto.randomUUID()), crypto.randomUUID())).toBeNull();
    });

    it('asks for the job bank first when it is blank', () => {
      expect(generationBlocker(details(crypto.randomUUID()), '  ')).toBe('Add your job bank in Settings first.');
    });

    it.each([undefined, '', ' \n '])('asks for the job description when it is %j', (jobDescription) => {
      expect(generationBlocker(details(jobDescription), crypto.randomUUID())).toBe('Add the job description in the Details step first.');
    });
  });

  describe('resumeFromGeneratedCv', () => {
    const uuid = () => crypto.randomUUID();
    const aGeneratedCv = (): GeneratedCv => ({
      layout: 'education-first',
      header: { title: uuid(), currentRole: uuid(), currentCompany: uuid() },
      abilities: [{ title: uuid(), bullets: [uuid()] }],
      leadership: { title: uuid(), bullets: [uuid()] },
      languages: [{ name: uuid(), level: uuid() }],
      technicalProficiency: [{ category: uuid(), skills: uuid() }],
      references: [{ name: uuid(), role: uuid(), company: uuid(), contact: uuid(), linkedin: uuid() }],
      experiences: [
        {
          company: uuid(),
          location: uuid(),
          positions: [
            { role: uuid(), period: uuid() },
            { role: uuid(), period: uuid() },
          ],
          bullets: [uuid()],
        },
      ],
      education: [{ institution: uuid(), location: uuid(), degree: uuid(), period: uuid(), bullets: [uuid()] }],
      projects: [{ company: uuid(), title: uuid(), scope: uuid(), period: uuid(), bullets: [uuid()] }],
      volunteering: [{ organization: uuid(), location: uuid(), role: uuid(), period: uuid(), bullets: [uuid()] }],
    });

    it('shows the latest position of a company as its role and lists the others as earlier positions', () => {
      const cv = aGeneratedCv();
      const [latest, earlier] = cv.experiences[0].positions;

      const [experience] = resumeFromGeneratedCv(cv).experiences;

      expect(experience).toEqual({
        company: cv.experiences[0].company,
        location: cv.experiences[0].location,
        role: latest.role,
        period: latest.period,
        earlierPositions: [earlier],
        bullets: cv.experiences[0].bullets,
      });
    });

    it('leaves the role empty for a company without positions', () => {
      const cv = aGeneratedCv();
      cv.experiences[0].positions = [];

      expect(resumeFromGeneratedCv(cv).experiences[0]).toEqual(expect.objectContaining({ role: '', period: '', earlierPositions: [] }));
    });

    it('takes the header, layout, leadership and other sections from the generated CV', () => {
      const cv = aGeneratedCv();

      const resume = resumeFromGeneratedCv(cv);

      expect(resume.personal).toEqual(expect.objectContaining({ ...cv.header, name: '', email: '' }));
      expect(resume.layout).toBe(cv.layout);
      expect(resume.crossFunctional).toEqual(cv.leadership);
      expect(resume).toEqual(
        expect.objectContaining({
          abilities: cv.abilities,
          education: cv.education,
          projects: cv.projects,
          volunteering: cv.volunteering,
          languages: cv.languages,
          technicalProficiency: cv.technicalProficiency,
          references: cv.references,
        }),
      );
    });
  });

  describe('coverLetterFromGenerated', () => {
    const aGeneratedLetter = (): GeneratedCoverLetter => ({
      letter: {
        subject: crypto.randomUUID(),
        recipientName: crypto.randomUUID(),
        recipientTitle: crypto.randomUUID(),
        companyName: crypto.randomUUID(),
        companyAddress: crypto.randomUUID(),
        greeting: crypto.randomUUID(),
        paragraphs: [crypto.randomUUID(), crypto.randomUUID()],
        closing: crypto.randomUUID(),
        signature: crypto.randomUUID(),
      },
      review: { claimsToCheck: [], keywordsUsed: [], questions: [] },
    });

    it('joins the greeting, paragraphs and sign-off into the body and keeps the date', () => {
      const generated = aGeneratedLetter();
      const { letter } = generated;
      const base = createCoverLetter(new Date());

      const result = coverLetterFromGenerated(generated, base);

      expect(result).toEqual({
        date: base.date,
        subject: letter.subject,
        recipientName: letter.recipientName,
        recipientTitle: letter.recipientTitle,
        companyAddress: letter.companyAddress,
        body: `${letter.greeting}\n\n${letter.paragraphs[0]}\n\n${letter.paragraphs[1]}\n\n${letter.closing}\n${letter.signature}`,
      });
    });

    it('leaves out empty parts of the letter', () => {
      const generated = aGeneratedLetter();
      generated.letter = { ...generated.letter, greeting: '', signature: '', paragraphs: [generated.letter.paragraphs[0]] };

      const result = coverLetterFromGenerated(generated, createCoverLetter(new Date()));

      expect(result.body).toBe(`${generated.letter.paragraphs[0]}\n\n${generated.letter.closing}`);
    });
  });

  describe('formatUsd', () => {
    it.each([
      [0, '$0.00'],
      [0.004, '<$0.01'],
      [0.153, '$0.15'],
      [12.5, '$12.50'],
    ])('formats %d as %s', (usd, text) => {
      expect(formatUsd(usd)).toBe(text);
    });
  });
});
