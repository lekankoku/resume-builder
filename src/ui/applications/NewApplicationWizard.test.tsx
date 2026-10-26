// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationDraft, WizardStep } from '../../domain/application/ApplicationDraft';
import { createBlankCv } from '../../domain/application/JobApplication';
import NewApplicationWizard from './NewApplicationWizard';

const aDraft = (overrides: Partial<ApplicationDraft> = {}): ApplicationDraft => ({
  id: crypto.randomUUID(),
  updatedAt: new Date().toISOString(),
  stepId: 'cv',
  details: {
    company: crypto.randomUUID(),
    role: crypto.randomUUID(),
    postingUrl: '',
    appliedOn: '2026-10-25',
    notes: '',
    jobDescription: crypto.randomUUID(),
  },
  cvStart: 'new',
  sourceId: '',
  jsonInput: '',
  cvKey: null,
  ...createBlankCv(new Date()),
  verifiedSections: [],
  ...overrides,
});

const renderWizard = ({ draft = aDraft(), stepId = 'cv' as WizardStep } = {}) => {
  const onSaveDraft = vi.fn();
  render(
    <MemoryRouter>
      <NewApplicationWizard
        applications={[]}
        stages={['Applied']}
        profile={createBlankCv(new Date()).resume.personal}
        draft={draft}
        stepId={stepId}
        onStepChange={vi.fn()}
        onSaveDraft={onSaveDraft}
        onCreate={vi.fn()}
        onCancel={vi.fn()}
      />
    </MemoryRouter>,
  );
  return { onSaveDraft, draft };
};

describe('NewApplicationWizard', () => {
  it('offers new, reuse and JSON import as ways to start the CV, without AI generation', () => {
    // Given / When
    renderWizard();

    // Then
    expect(screen.getByRole('radio', { name: /Start a new CV/ })).toBeVisible();
    expect(screen.getByRole('radio', { name: /Reuse a CV from an application/ })).toBeVisible();
    expect(screen.getByRole('radio', { name: /Import CV from JSON/ })).toBeVisible();
    expect(screen.queryByRole('radio', { name: /Generate from job bank/ })).toBeNull();
  });

  it('lets Review finish without checking the optional Volunteering and Leadership sections', () => {
    // Given
    const required = ['personal', 'experiences', 'projects', 'abilities', 'technicalProficiency', 'education', 'languages', 'references', 'coverLetter'];
    const draft = aDraft({ stepId: 'review', cvKey: 'new', verifiedSections: required });

    // When
    renderWizard({ draft, stepId: 'review' });

    // Then
    expect(screen.getByText(/9 of 9 required/)).toBeVisible();
    expect(screen.getAllByText('Optional')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled();
  });
});
