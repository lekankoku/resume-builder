// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AiClient } from '../../application/ports/repositories';
import { ApplicationDraft, WizardStep } from '../../domain/application/ApplicationDraft';
import {
  CvAnalysis,
  GeneratedCoverLetter,
  Generation,
  resumeFromGeneratedCv,
  WrittenCv,
} from '../../domain/application/cvGeneration';
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

const uuid = () => crypto.randomUUID();
const usage = (costUsd: number) => ({ inputTokens: 8000, cachedInputTokens: 0, outputTokens: 4000, costUsd });

const anAnalysis = (): CvAnalysis => ({
  skills: [
    {
      skill: uuid(),
      origin: 'posting',
      keywords: [{ term: uuid(), original: uuid() }],
      priority: 1,
      status: 'strong',
      evidence: [{ source: uuid(), quote: uuid() }],
    },
  ],
  currentPosition: { source: uuid(), company: uuid(), title: uuid() },
  roles: [{ company: uuid(), sources: [uuid()], relevance: 'primary', bulletBudget: 8, reason: uuid() }],
  layout: 'experience-first',
  tagline: uuid(),
  titleAdjustments: [{ source: uuid(), original: uuid(), proposed: uuid(), quote: uuid() }],
  extras: { projects: [], volunteering: [], leadershipCategory: '', leadershipItems: [] },
  questions: [
    { field: uuid(), question: uuid() },
    { field: uuid(), question: uuid() },
  ],
});

const aWrittenCv = (coverLetter: GeneratedCoverLetter | null = null): WrittenCv => ({
  cv: {
    layout: 'experience-first',
    header: { title: uuid(), currentRole: uuid(), currentCompany: uuid() },
    abilities: [{ title: uuid(), bullets: [uuid()] }],
    leadership: { title: '', bullets: [] },
    languages: [],
    technicalProficiency: [],
    references: [],
    experiences: [{ company: uuid(), location: uuid(), positions: [{ role: uuid(), period: uuid() }], bullets: [uuid()] }],
    education: [],
    projects: [],
    volunteering: [],
  },
  review: {
    gaps: [uuid()],
    adjustedTitles: [{ original: uuid(), used: uuid() }],
    claimsToCheck: [{ claim: uuid(), source: uuid() }],
    keywordCoverage: { used: [], unused: [{ term: uuid(), reason: 'gap' }] },
    timelineGaps: [{ from: uuid(), to: uuid(), cause: 'omitted', detail: uuid() }],
    questions: [{ field: uuid(), question: uuid() }],
  },
  coverLetter,
  usage: usage(0.31),
});

const aGeneratedCoverLetter = (): GeneratedCoverLetter => ({
  letter: {
    subject: uuid(),
    recipientName: uuid(),
    recipientTitle: '',
    companyName: uuid(),
    companyAddress: '',
    greeting: uuid(),
    paragraphs: [uuid()],
    closing: uuid(),
    signature: uuid(),
  },
  review: { claimsToCheck: [{ claim: uuid(), source: uuid() }], keywordsUsed: [], questions: [{ field: uuid(), question: uuid() }] },
});

const aGeneration = (overrides: Partial<Generation> = {}): Generation => {
  const analysis = anAnalysis();
  return {
    analysis,
    analysisUsage: usage(0.12),
    analysedAt: new Date().toISOString(),
    answers: analysis.questions.map(({ field }) => ({ field, answer: '' })),
    coverLetterRequested: false,
    motivation: '',
    written: null,
    ...overrides,
  };
};

const anAi = (overrides: Partial<AiClient> = {}): AiClient => ({ analyseJob: vi.fn(), writeCv: vi.fn(), usage: vi.fn(), ...overrides });

const renderWizard = ({
  draft = aDraft(),
  jobBank = crypto.randomUUID() as string,
  ai = anAi(),
  stepId = 'cv' as WizardStep,
} = {}) => {
  const onSaveDraft = vi.fn();
  render(
    <MemoryRouter>
      <NewApplicationWizard
        applications={[]}
        stages={['Applied']}
        profile={createBlankCv(new Date()).resume.personal}
        jobBank={jobBank}
        ai={ai}
        draft={draft}
        stepId={stepId}
        onStepChange={vi.fn()}
        onSaveDraft={onSaveDraft}
        onCreate={vi.fn()}
        onCancel={vi.fn()}
      />
    </MemoryRouter>,
  );
  return { onSaveDraft, ai, draft };
};

describe('NewApplicationWizard — generate from job bank', () => {
  it('disables generation and links to settings when no job bank is saved', () => {
    // Given / When
    renderWizard({ jobBank: ' ' });

    // Then
    expect(screen.getByRole('radio', { name: /Generate from job bank/ })).toBeDisabled();
    expect(screen.getByText('Add your job bank in Settings first.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open job bank settings' })).toHaveAttribute('href', '/settings/job-bank');
  });

  it('disables generation when the application has no job description', () => {
    // Given / When
    renderWizard({ draft: aDraft({ details: { ...aDraft().details, jobDescription: '' } }) });

    // Then
    expect(screen.getByRole('radio', { name: /Generate from job bank/ })).toBeDisabled();
    expect(screen.getByText('Add the job description in the Details step first.')).toBeVisible();
  });

  it('analyses the job, shows the analysis with its questions and saves it on the draft', async () => {
    // Given
    const user = userEvent.setup();
    const analysis = anAnalysis();
    const ai = anAi({ analyseJob: vi.fn(async () => ({ analysis, usage: usage(0.12) })) });
    const { onSaveDraft, draft } = renderWizard({ ai });

    // When
    await user.click(screen.getByRole('radio', { name: /Generate from job bank/ }));
    await user.click(screen.getByRole('button', { name: 'Analyse job' }));

    // Then
    expect(ai.analyseJob).toHaveBeenCalledWith({
      company: draft.details.company,
      role: draft.details.role,
      jobDescription: draft.details.jobDescription,
    });
    const panel = await screen.findByRole('region', { name: 'Job analysis' });
    expect(within(panel).getByText(analysis.tagline)).toBeVisible();
    expect(within(panel).getByText(/estimated cost \$0\.12/)).toBeVisible();
    expect(within(panel).getByRole('textbox', { name: analysis.questions[0].question })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Analyse again' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    expect(onSaveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({ cvStart: 'generate', generated: expect.objectContaining({ analysis, written: null }) }),
    );
  });

  it('writes the CV with the answered questions only and no cover letter by default', async () => {
    // Given
    const user = userEvent.setup();
    const generated = aGeneration();
    const written = aWrittenCv();
    const ai = anAi({ writeCv: vi.fn(async () => written) });
    const { draft } = renderWizard({ ai, draft: aDraft({ cvStart: 'generate', generated }) });
    const answer = uuid();

    // When
    await user.type(screen.getByRole('textbox', { name: generated.analysis.questions[1].question }), answer);
    await user.click(screen.getByRole('button', { name: 'Write CV' }));

    // Then
    expect(ai.writeCv).toHaveBeenCalledWith({
      company: draft.details.company,
      role: draft.details.role,
      jobDescription: draft.details.jobDescription,
      analysis: generated.analysis,
      answers: [{ field: generated.analysis.questions[1].field, answer }],
      coverLetter: false,
      motivation: '',
    });
    expect(await screen.findByText(/estimated cost \$0\.31/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Write again' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled();
  });

  it('uses the written CV and leaves the cover letter blank when moving on to Review without one', async () => {
    // Given
    const user = userEvent.setup();
    const written = aWrittenCv();
    const ai = anAi({ writeCv: vi.fn(async () => written) });
    const { onSaveDraft } = renderWizard({ ai, draft: aDraft({ cvStart: 'generate', generated: aGeneration() }) });
    await user.click(screen.getByRole('button', { name: 'Write CV' }));
    await screen.findByRole('button', { name: 'Write again' });

    // When
    await user.click(screen.getByRole('button', { name: /Next/ }));

    // Then
    expect(onSaveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({
        resume: resumeFromGeneratedCv(written.cv),
        coverLetter: expect.objectContaining({ subject: '', body: '' }),
        cvKey: expect.stringMatching(/^generate:/),
      }),
    );
  });

  it('writes a cover letter with the motivation when asked for one and uses it in Review', async () => {
    // Given
    const user = userEvent.setup();
    const coverLetter = aGeneratedCoverLetter();
    const ai = anAi({ writeCv: vi.fn(async () => aWrittenCv(coverLetter)) });
    const { onSaveDraft } = renderWizard({ ai, draft: aDraft({ cvStart: 'generate', generated: aGeneration() }) });
    const motivation = uuid();

    // When
    await user.click(screen.getByRole('checkbox', { name: 'Also write a cover letter' }));
    await user.type(screen.getByRole('textbox', { name: 'Why this company and role (optional)' }), motivation);
    await user.click(screen.getByRole('button', { name: 'Write CV and cover letter' }));
    await screen.findByText(/with cover letter/);
    await user.click(screen.getByRole('button', { name: /Next/ }));

    // Then
    expect(ai.writeCv).toHaveBeenCalledWith(expect.objectContaining({ coverLetter: true, motivation }));
    expect(onSaveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({
        coverLetter: expect.objectContaining({
          subject: coverLetter.letter.subject,
          recipientName: coverLetter.letter.recipientName,
          body: expect.stringContaining(coverLetter.letter.paragraphs[0]),
        }),
      }),
    );
  });

  it('shows the error and keeps Next disabled when the analysis fails', async () => {
    // Given
    const user = userEvent.setup();
    const message = uuid();
    const ai = anAi({ analyseJob: vi.fn(async () => Promise.reject(new Error(message))) });
    renderWizard({ ai });

    // When
    await user.click(screen.getByRole('radio', { name: /Generate from job bank/ }));
    await user.click(screen.getByRole('button', { name: 'Analyse job' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  });

  it('shows the CV and cover letter review in the Review step for a generated CV', () => {
    // Given
    const coverLetter = aGeneratedCoverLetter();
    const written = { ...aWrittenCv(coverLetter), writtenAt: new Date().toISOString() };
    const { review } = written;
    const draft = aDraft({
      stepId: 'review',
      cvStart: 'generate',
      generated: aGeneration({ written }),
      cvKey: `generate:${written.writtenAt}`,
      resume: resumeFromGeneratedCv(written.cv),
    });

    // When
    renderWizard({ draft, stepId: 'review' });

    // Then
    expect(screen.getByText('Check before sending')).toBeVisible();
    expect(screen.getByText(review.gaps[0])).toBeVisible();
    expect(screen.getByText(review.claimsToCheck[0].claim)).toBeVisible();
    expect(screen.getByText(`Source: ${review.claimsToCheck[0].source}`)).toBeVisible();
    expect(screen.getByText(coverLetter.review.claimsToCheck[0].claim)).toBeVisible();
    expect(screen.getByText(`${review.adjustedTitles[0].original} → ${review.adjustedTitles[0].used}`)).toBeVisible();
    expect(screen.getByText(review.keywordCoverage.unused[0].term)).toBeVisible();
    expect(screen.getByText(`Left out: ${review.timelineGaps[0].detail}`)).toBeVisible();
    expect(screen.getByText(review.questions[0].question)).toBeVisible();
    expect(screen.getByText(coverLetter.review.questions[0].question)).toBeVisible();
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

  it('does not show the audit for a CV that was not generated', () => {
    // Given / When
    renderWizard({ draft: aDraft({ stepId: 'review', cvKey: 'new' }), stepId: 'review' });

    // Then
    expect(screen.queryByText('Check before sending')).toBeNull();
  });
});
