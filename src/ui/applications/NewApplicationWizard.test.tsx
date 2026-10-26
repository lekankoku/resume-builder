// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationDraft, WizardStep } from '../../domain/application/ApplicationDraft';
import { AiClient } from '../../application/ports/repositories';
import { createBlankCv } from '../../domain/application/JobApplication';
import { createSuggestionSet, Suggestion } from '../../domain/application/suggestions';
import { aResume } from '../../testing/resumeFixture';
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

const REQUIRED = ['personal', 'experiences', 'projects', 'abilities', 'technicalProficiency', 'education', 'languages', 'references', 'coverLetter'];

const aSuggestion = (overrides: Partial<Suggestion>): Suggestion => ({
  action: 'replace',
  section: 'personal',
  item: '',
  field: 'title',
  before: '',
  after: crypto.randomUUID(),
  newItem: { fields: [], bullets: [] },
  reason: crypto.randomUUID(),
  source: '',
  ...overrides,
});

const renderWizard = ({
  draft = aDraft(),
  stepId = 'cv' as WizardStep,
  suggest = vi.fn<AiClient['suggest']>(),
} = {}) => {
  const onSaveDraft = vi.fn();
  const onCreate = vi.fn();
  render(
    <MemoryRouter>
      <NewApplicationWizard
        applications={[]}
        stages={['Applied']}
        profile={createBlankCv(new Date()).resume.personal}
        jobBank={crypto.randomUUID()}
        ai={{ suggest, usage: vi.fn() }}
        draft={draft}
        stepId={stepId}
        onStepChange={vi.fn()}
        onSaveDraft={onSaveDraft}
        onRememberAnswers={vi.fn()}
        onCreate={onCreate}
        onCancel={vi.fn()}
      />
    </MemoryRouter>,
  );
  return { onSaveDraft, onCreate, suggest, draft };
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

  it('gets AI suggestions for the CV in the Review step and applies an accepted one to the draft', async () => {
    // Given
    const user = userEvent.setup();
    const resume = aResume();
    const suggestion = aSuggestion({ before: resume.personal.title });
    const suggest = vi.fn(async () => ({
      summary: crypto.randomUUID(),
      gaps: [],
      questions: [],
      suggestions: [suggestion],
      usage: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1, costUsd: 0.05 },
    }));
    const draft = aDraft({ stepId: 'review', cvKey: 'new', resume });
    const { onSaveDraft } = renderWizard({ draft, stepId: 'review', suggest });

    // When
    await user.click(screen.getByRole('button', { name: /AI suggestions/ }));
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));
    await user.click(within(await screen.findByRole('article')).getByRole('button', { name: 'Accept' }));

    // Then
    expect(suggest).toHaveBeenCalledWith(
      expect.objectContaining({ company: draft.details.company, role: draft.details.role, jobDescription: draft.details.jobDescription }),
    );
    const saved = onSaveDraft.mock.lastCall![0] as ApplicationDraft;
    expect(saved.resume.personal.title).toBe(suggestion.after);
    expect(saved.suggestions!.items.map((item) => item.status)).toEqual(['accepted']);
  });

  it('carries the draft suggestions over to the created application', async () => {
    // Given
    const user = userEvent.setup();
    const suggestions = createSuggestionSet(
      { summary: '', gaps: [], questions: [], suggestions: [aSuggestion({})], usage: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, costUsd: 0 } },
      new Date(),
      () => crypto.randomUUID(),
    );
    const draft = aDraft({ stepId: 'confirm', cvKey: 'new', verifiedSections: REQUIRED, suggestions });
    const { onCreate } = renderWizard({ draft, stepId: 'confirm' });

    // When
    for (const checkbox of screen.getAllByRole('checkbox')) await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: /Create application/ }));

    // Then
    expect(onCreate).toHaveBeenCalledWith(draft.details, expect.objectContaining({ suggestions }), draft.id);
  });

  it('lets Review finish without checking the optional Volunteering and Leadership sections', () => {
    // Given
    const draft = aDraft({ stepId: 'review', cvKey: 'new', verifiedSections: REQUIRED });

    // When
    renderWizard({ draft, stepId: 'review' });

    // Then
    expect(screen.getByText(/9 of 9 required/)).toBeVisible();
    expect(screen.getAllByText('Optional')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled();
  });
});
