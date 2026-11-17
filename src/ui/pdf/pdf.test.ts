import path from 'path';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { Resume } from '../../domain/resume/Resume';
import { aResume } from '../../testing/resumeFixture';
import CoverLetterPdf from './CoverLetterPdf';
import { registerPdfFonts } from './fonts';
import { pageCountOf } from './pageCount';
import ResumePdf from './ResumePdf';

const pageCount = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type \/Page\n/g) ?? []).length;

const renderResume = (resume: Resume, company = 'Acme') =>
  renderToBuffer(createElement(ResumePdf, { resume, targetCompany: company }));

const aLongResume = () => {
  const base = aResume({ personal: { ...aResume().personal, photoUrl: '' } });
  const experience = { ...base.experiences[0], bullets: Array.from({ length: 6 }, () => 'Delivered a measurable improvement '.repeat(4)) };
  // react-pdf fails to lay out documents much past 5 pages, so stay below that.
  return { ...base, experiences: Array.from({ length: 5 }, () => experience) };
};

beforeAll(() => registerPdfFonts((file) => path.resolve('public/fonts', file)));

describe('ResumePdf', () => {
  it('fits a short resume on a single A4 page', async () => {
    const base = aResume({ personal: { ...aResume().personal, photoUrl: '' } });
    const resume = { ...base, experiences: base.experiences.slice(0, 1), projects: [], volunteering: [] };

    const pdf = await renderResume(resume);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(1);
    expect(pdf.toString('latin1')).toMatch(/\/MediaBox \[0 0 595\.28\d* 841\.89\d*\]/);
  });

  it('flows a long resume onto additional pages', async () => {
    const pdf = await renderResume(aLongResume());

    expect(pageCount(pdf)).toBeGreaterThan(1);
  });

  it('produces identical output for identical input', async () => {
    const resume = aLongResume();

    const [first, second] = [await renderResume(resume), await renderResume(resume)];

    expect(first.equals(second)).toBe(true);
  });

  it('renders an education-first resume with volunteering, leadership and earlier positions', async () => {
    const resume = aResume({ personal: { ...aResume().personal, photoUrl: '' }, layout: 'education-first' });

    const pdf = await renderResume(resume);

    expect(pageCount(pdf)).toBeGreaterThanOrEqual(1);
  });

  it('renders without optional collections', async () => {
    const resume = aResume({
      personal: { ...aResume().personal, photoUrl: '' },
      experiences: [],
      projects: [],
      education: [],
      abilities: [],
      technicalProficiency: [],
      languages: [],
      references: [],
      volunteering: [],
      crossFunctional: { title: '', bullets: [] },
    });

    const pdf = await renderResume(resume, '');

    expect(pageCount(pdf)).toBe(1);
  });
});

describe('CoverLetterPdf', () => {
  const render = (body: string) =>
    renderToBuffer(
      createElement(CoverLetterPdf, {
        resume: aResume(),
        coverLetter: { ...createCoverLetter(new Date()), body },
        targetCompany: 'Acme',
      }),
    );

  it('fits a short letter on one page', async () => {
    expect(pageCount(await render('Hello\n\nThanks'))).toBe(1);
  });

  it('flows a long letter onto additional pages', async () => {
    const body = Array.from({ length: 40 }, () => 'A paragraph of the letter. '.repeat(20)).join('\n');

    expect(pageCount(await render(body))).toBeGreaterThan(1);
  });

  it('renders a letter with a subject', async () => {
    const pdf = await renderToBuffer(
      createElement(CoverLetterPdf, {
        resume: aResume(),
        coverLetter: { ...createCoverLetter(new Date()), subject: 'Application for Engineer', body: 'Hello' },
        targetCompany: 'Acme',
      }),
    );

    expect(pageCount(pdf)).toBe(1);
  });

  it('renders an empty letter', async () => {
    expect(pageCount(await render(''))).toBe(1);
  });
});

describe('ResumePdf density', () => {
  it('fits more on a page when printed smaller', async () => {
    // Fixed text, so page breaks do not depend on random field values.
    const role = { company: 'Acme GmbH', location: 'Berlin', role: 'Software Engineer', period: '2020 – 2022', earlierPositions: [] };
    const bullets = Array.from({ length: 6 }, () => 'Cut checkout latency by 40% by moving payment validation to an async queue');
    const resume = aResume({
      personal: {
        ...aResume().personal,
        ...{ name: 'Alex Example', title: 'Engineer', currentRole: '', photoUrl: '' },
        ...{ email: 'a', phone: 'b', residence: 'c', website: 'd', linkedin: 'e', github: 'f' },
      },
      experiences: Array.from({ length: 5 }, () => ({ ...role, bullets })),
      abilities: [],
      projects: [],
      volunteering: [],
      education: [],
      technicalProficiency: [],
      languages: [],
      references: [],
      crossFunctional: { title: '', bullets: [] },
    });

    const full = pageCount(await renderToBuffer(createElement(ResumePdf, { resume, targetCompany: 'Acme' })));
    const small = pageCount(await renderToBuffer(createElement(ResumePdf, { resume, targetCompany: 'Acme', density: 0.955 })));

    expect(small).toBeLessThan(full);
  });

  it('counts pages the same way as the app', async () => {
    const pdf = await renderResume(aLongResume());

    expect(pageCountOf(new Uint8Array(pdf))).toBe(pageCount(pdf));
  });
});
