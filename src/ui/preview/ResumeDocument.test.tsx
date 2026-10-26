// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import ResumeDocument from './ResumeDocument';

const isBefore = (first: HTMLElement, second: HTMLElement) =>
  !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('ResumeDocument', () => {
  it('puts experience before education by default', () => {
    // Given / When
    render(<ResumeDocument resume={aResume()} />);

    // Then
    expect(isBefore(screen.getByRole('heading', { name: 'Experience' }), screen.getByRole('heading', { name: 'Academic' }))).toBe(true);
  });

  it('puts education first for an education-first layout', () => {
    // Given / When
    render(<ResumeDocument resume={aResume({ layout: 'education-first' })} />);

    // Then
    expect(isBefore(screen.getByRole('heading', { name: 'Academic' }), screen.getByRole('heading', { name: 'Experience' }))).toBe(true);
  });

  it('shows the current position, earlier positions, education highlights, volunteering, leadership and reference contact', () => {
    // Given
    const resume = aResume();

    // When
    render(<ResumeDocument resume={resume} />);

    // Then
    expect(screen.getByText(`${resume.personal.currentRole} · ${resume.personal.currentCompany}`)).toBeVisible();
    expect(screen.getByText(resume.experiences[1].earlierPositions[0].role)).toBeVisible();
    expect(screen.getByText(resume.education[0].bullets[0])).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Volunteering' })).toBeVisible();
    expect(screen.getByText(resume.volunteering[0].role)).toBeVisible();
    expect(screen.getByRole('heading', { name: resume.crossFunctional.title })).toBeVisible();
    expect(screen.getByText(resume.crossFunctional.bullets[0])).toBeVisible();
    expect(screen.getByText(resume.references[0].contact)).toBeVisible();
  });

  it('hides empty sections, an empty leadership section and a missing reference LinkedIn', () => {
    // Given
    const resume = aResume({
      projects: [],
      volunteering: [],
      education: [],
      crossFunctional: { title: '', bullets: [] },
      references: [{ ...aResume().references[0], linkedin: '' }],
    });

    // When
    render(<ResumeDocument resume={resume} />);

    // Then
    expect(screen.queryByRole('heading', { name: 'Key Projects' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Volunteering' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Academic' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Leadership' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'LinkedIn Profile' })).toBeNull();
  });
});
