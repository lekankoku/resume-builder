// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationDraft, WizardStep } from '../../domain/application/ApplicationDraft';
import { AiClient } from '../../application/ports/repositories';
import { createApplication, createBlankCv, JobApplication } from '../../domain/application/JobApplication';
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
  ...overrides,
});

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
  applications = [] as JobApplication[],
} = {}) => {
  const onSaveDraft = vi.fn();
  const onCreate = vi.fn();
  const onStepChange = vi.fn();
  render(
    <MemoryRouter>
      <NewApplicationWizard
        applications={applications}
        stages={['Applied']}
        profile={createBlankCv(new Date()).resume.personal}
        jobBank={crypto.randomUUID()}
        ai={{ suggest, usage: vi.fn() }}
        draft={draft}
        stepId={stepId}
        onStepChange={onStepChange}
        onSaveDraft={onSaveDraft}
        onRememberAnswers={vi.fn()}
        onCreate={onCreate}
        onCancel={vi.fn()}
      />
    </MemoryRouter>,
  );
  return { onSaveDraft, onCreate, onStepChange, suggest, draft };
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
    const draft = aDraft({ stepId: 'confirm', cvKey: 'new', suggestions });
    const { onCreate } = renderWizard({ draft, stepId: 'confirm' });

    // When
    await user.click(screen.getByRole('button', { name: /Create application/ }));

    // Then
    expect(onCreate).toHaveBeenCalledWith(draft.details, expect.objectContaining({ suggestions }), draft.id);
  });

  it('lets you move on from Review and create from Confirm without ticking anything', () => {
    // Given / When
    renderWizard({ draft: aDraft({ stepId: 'review', cvKey: 'new' }), stepId: 'review' });

    // Then
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled();
  });

  it('shows the details to confirm without checkboxes and enables Create', () => {
    // Given
    const draft = aDraft({ stepId: 'confirm', cvKey: 'new' });

    // When
    renderWizard({ draft, stepId: 'confirm' });

    // Then
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByText(draft.details.company)).toBeVisible();
    expect(screen.getByRole('button', { name: /Create application/ })).toBeEnabled();
  });

  describe('without a CV', () => {
    it('skips Review and goes straight to Confirm', async () => {
      // Given
      const user = userEvent.setup();
      const { onStepChange, draft } = renderWizard();

      // When
      await user.click(screen.getByRole('radio', { name: /No CV yet/ }));
      await user.click(screen.getByRole('button', { name: /Next/ }));

      // Then
      expect(onStepChange).toHaveBeenCalledWith(draft.id, 'confirm');
      expect(screen.queryByRole('button', { name: /Review/ })).toBeNull();
    });

    it('creates the application without a CV', async () => {
      // Given
      const user = userEvent.setup();
      const draft = aDraft({ stepId: 'confirm', cvStart: 'none', cvKey: 'none' });
      const { onCreate } = renderWizard({ draft, stepId: 'confirm' });

      // When
      await user.click(screen.getByRole('button', { name: /Create application/ }));

      // Then
      expect(screen.getByText('No CV yet')).toBeVisible();
      expect(onCreate).toHaveBeenCalledWith(draft.details, null, draft.id);
    });

    it('cannot be reused as the CV for another application', async () => {
      // Given
      const user = userEvent.setup();
      const withCv = createApplication(aDraft().details, createBlankCv(new Date()), 'Applied', new Date(), crypto.randomUUID());
      const withoutCv = createApplication(aDraft().details, null, 'Applied', new Date(), crypto.randomUUID());
      renderWizard({ applications: [withoutCv, withCv] });

      // When
      await user.click(screen.getByRole('radio', { name: /Reuse a CV from an application/ }));

      // Then
      const options = within(screen.getByRole('combobox', { name: 'Application to reuse CV from' })).getAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual([`${withCv.company} — ${withCv.role}`]);
    });
  });

  describe('details validation', () => {
    it('shows no errors before you try to continue', () => {
      // Given / When
      renderWizard({ draft: aDraft({ stepId: 'details', details: { company: '', role: '', postingUrl: '', appliedOn: '', notes: '' } }), stepId: 'details' });

      // Then
      expect(screen.queryByText('Company is required')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled();
    });

    it('shows each error next to its field and focuses the first one when you try to continue', async () => {
      // Given
      const user = userEvent.setup();
      const { onStepChange } = renderWizard({
        draft: aDraft({ stepId: 'details', details: { company: '', role: crypto.randomUUID(), postingUrl: 'not a url', appliedOn: '2026-10-29', notes: '' } }),
        stepId: 'details',
      });

      // When
      await user.click(screen.getByRole('button', { name: /Next/ }));

      // Then
      const company = screen.getByRole('textbox', { name: 'Company' });
      expect(company).toHaveFocus();
      expect(company).toHaveAccessibleDescription('Company is required');
      expect(screen.getByRole('textbox', { name: 'Job posting URL' })).toHaveAccessibleDescription('Job posting URL must start with http:// or https://');
      expect(screen.getByRole('textbox', { name: 'Role' })).not.toHaveAttribute('aria-invalid');
      expect(onStepChange).not.toHaveBeenCalled();
    });

    it('moves focus to the step heading so screen readers announce the new step', () => {
      // Given / When
      renderWizard({ draft: aDraft({ stepId: 'cv' }), stepId: 'cv' });

      // Then
      expect(screen.getByRole('heading', { name: 'Step 2: CV' })).toHaveFocus();
    });
  });
});
