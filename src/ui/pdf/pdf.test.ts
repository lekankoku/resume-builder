import path from 'path';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { Resume } from '../../domain/resume/Resume';
import { aResume } from '../../testing/resumeFixture';
import CoverLetterPdf from './CoverLetterPdf';
import { registerPdfFonts } from './fonts';
import ResumePdf from './ResumePdf';

const pageCount = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type \/Page\n/g) ?? []).length;

const renderResume = (resume: Resume, company = 'Acme') =>
  renderToBuffer(createElement(ResumePdf, { resume, targetCompany: company }));

const aLongResume = () => {
  const base = aResume({ personal: { ...aResume().personal, photoUrl: '' } });
  const experience = { ...base.experiences[0], bullets: Array.from({ length: 6 }, () => 'Delivered a measurable improvement '.repeat(4)) };
  return { ...base, experiences: Array.from({ length: 12 }, () => experience) };
};

beforeAll(() => registerPdfFonts((file) => path.resolve('public/fonts', file)));

describe('ResumePdf', () => {
  it('fits a short resume on a single A4 page', async () => {
    const resume = aResume({ personal: { ...aResume().personal, photoUrl: '' } });

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

  it('renders an empty letter', async () => {
    expect(pageCount(await render(''))).toBe(1);
  });
});
