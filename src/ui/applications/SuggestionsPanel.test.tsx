// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AiClient } from '../../application/ports/repositories';
import { createApplication, JobApplication } from '../../domain/application/JobApplication';
import { Suggestion, SuggestionsResponse } from '../../domain/application/suggestions';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { aResume } from '../../testing/resumeFixture';
import { PreviewWithSuggestions, SuggestionScope } from './SuggestionsPanel';

const uuid = () => crypto.randomUUID();

const anApplication = (overrides: Partial<JobApplication> = {}): JobApplication => ({
  ...createApplication(
    { company: uuid(), role: uuid(), postingUrl: '', appliedOn: '2026-10-26', notes: '', jobDescription: uuid() },
    { resume: aResume(), coverLetter: { ...createCoverLetter(new Date()), body: uuid() } },
    'Applied',
    new Date(),
    uuid(),
  ),
  suggestions: null,
  ...overrides,
});

const aSuggestion = (overrides: Partial<Suggestion>): Suggestion => ({
  action: 'replace',
  section: 'experiences',
  item: '',
  field: '',
  before: '',
  after: uuid(),
  newItem: { fields: [], bullets: [] },
  reason: uuid(),
  source: '',
  ...overrides,
});

const aResponse = (suggestions: Suggestion[]): SuggestionsResponse => ({
  summary: uuid(),
  gaps: [uuid()],
  questions: [uuid()],
  suggestions,
  usage: { inputTokens: 1000, cachedInputTokens: 0, outputTokens: 500, costUsd: 0.07 },
});

const renderPanel = ({
  application = anApplication(),
  scope = 'cv' as SuggestionScope,
  jobBank = uuid() as string,
  suggest = vi.fn<AiClient['suggest']>(),
} = {}) => {
  const onRememberAnswers = vi.fn();
  const latest = { current: application };
  const Harness = () => {
    const [state, setState] = useState(application);
    latest.current = state;
    return (
      <PreviewWithSuggestions
        preview={<p>CV preview content</p>}
        job={state}
        state={{ resume: state.resume, coverLetter: state.coverLetter, suggestions: state.suggestions ?? null }}
        scope={scope}
        ai={{ suggest, usage: vi.fn() }}
        jobBank={jobBank}
        jobDescriptionAt={{ label: 'Overview', to: '/overview' }}
        onUpdate={(change) =>
          setState((current) => ({
            ...current,
            ...change({ resume: current.resume, coverLetter: current.coverLetter, suggestions: current.suggestions ?? null }),
          }))
        }
        onRememberAnswers={onRememberAnswers}
      />
    );
  };
  render(
    <MemoryRouter>
      <Harness />
    </MemoryRouter>,
  );
  return { latest, suggest, onRememberAnswers };
};

const openSuggestions = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /AI suggestions/ }));
};

describe('SuggestionsPanel', () => {
  it('sends the CV without contact details and the job, then lists the suggestions with summary, gaps and cost', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication();
    const experience = application.resume.experiences[0];
    const suggestion = aSuggestion({ item: experience.company, field: 'bullets', before: experience.bullets[0] });
    const response = aResponse([suggestion]);
    const { suggest } = renderPanel({ application, suggest: vi.fn(async () => response) });
    expect(screen.getByText('CV preview content')).toBeVisible();

    // When
    await openSuggestions(user);
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));

    // Then
    const { title, currentRole, currentCompany } = application.resume.personal;
    expect(suggest).toHaveBeenCalledWith({
      company: application.company,
      role: application.role,
      jobDescription: application.jobDescription,
      resume: { ...application.resume, personal: { title, currentRole, currentCompany } },
      coverLetter: application.coverLetter,
    });
    expect(await screen.findByText(response.summary)).toBeVisible();
    expect(screen.getByText(response.gaps[0])).toBeVisible();
    expect(screen.getByText(/estimated cost \$0\.07/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeVisible();
    expect(screen.getByRole('article', { name: `Refine: ${suggestion.reason}` })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Refresh suggestions' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'AI suggestions (1)' })).toBeVisible();
  });

  it('applies an accepted suggestion to the CV and removes it from the list', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication();
    const experience = application.resume.experiences[0];
    const suggestion = aSuggestion({ item: experience.company, field: 'bullets', before: experience.bullets[0] });
    const { latest } = renderPanel({ application, suggest: vi.fn(async () => aResponse([suggestion])) });
    await openSuggestions(user);
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));
    const card = await screen.findByRole('article', { name: `Refine: ${suggestion.reason}` });

    // When
    await user.click(within(card).getByRole('button', { name: 'Accept' }));

    // Then
    expect(latest.current.resume.experiences[0].bullets).toEqual([suggestion.after, experience.bullets[1]]);
    expect(latest.current.suggestions!.items[0].status).toBe('accepted');
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.getByText(/1 accepted, 0 declined/)).toBeVisible();
  });

  it('declines a suggestion without changing the CV', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication();
    const suggestion = aSuggestion({ section: 'personal', field: 'title', before: application.resume.personal.title });
    const { latest } = renderPanel({ application, suggest: vi.fn(async () => aResponse([suggestion])) });
    await openSuggestions(user);
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));

    // When
    await user.click(within(await screen.findByRole('article')).getByRole('button', { name: 'Decline' }));

    // Then
    expect(latest.current.resume).toEqual(application.resume);
    expect(latest.current.suggestions!.items[0].status).toBe('declined');
  });

  it('cannot accept a suggestion that no longer matches the CV', async () => {
    // Given
    const user = userEvent.setup();
    const suggestion = aSuggestion({ item: uuid(), field: 'bullets', before: uuid() });

    // When
    renderPanel({ suggest: vi.fn(async () => aResponse([suggestion])) });
    await openSuggestions(user);
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));

    // Then
    const card = await screen.findByRole('article');
    expect(within(card).getByText("Your CV changed since this suggestion, so it can't be applied.")).toBeVisible();
    expect(within(card).getByRole('button', { name: 'Accept' })).toBeDisabled();
  });

  it('shows only cover letter suggestions on the cover letter tab', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication();
    const letter = aSuggestion({ action: 'add', section: 'coverLetter', field: 'body' });
    const cv = aSuggestion({ section: 'personal', field: 'title', before: application.resume.personal.title });

    // When
    renderPanel({ application, scope: 'coverLetter', suggest: vi.fn(async () => aResponse([letter, cv])) });
    await openSuggestions(user);
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));

    // Then
    expect(await screen.findByRole('article', { name: `Add: ${letter.reason}` })).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('saves an answered question to CV facts', async () => {
    // Given
    const user = userEvent.setup();
    const response = aResponse([]);
    const { onRememberAnswers } = renderPanel({ suggest: vi.fn(async () => response) });
    await openSuggestions(user);
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));
    const [question] = response.questions;
    const answer = uuid();

    // When
    await user.type(await screen.findByRole('textbox', { name: question }), answer);
    await user.click(screen.getByRole('button', { name: `Save the answer to "${question}" to CV facts` }));

    // Then
    expect(onRememberAnswers).toHaveBeenCalledWith([{ question, answer }]);
    expect(screen.getByText('Saved to CV facts. Refresh suggestions to use it.')).toBeVisible();
  });

  it('shows the error when suggestions fail', async () => {
    // Given
    const user = userEvent.setup();
    const message = uuid();

    // When
    renderPanel({ suggest: vi.fn(async () => Promise.reject(new Error(message))) });
    await openSuggestions(user);
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it.each([
    ['no job bank', { jobBank: ' ' }, 'Add your job bank in Settings first.', 'Open job bank settings'],
    ['no job description', { application: anApplication({ jobDescription: '' }) }, 'Add the job description in Overview first.', 'Open Overview'],
  ])('disables suggestions with %s and links to where to fix it', async (_, options, message, link) => {
    // Given
    const user = userEvent.setup();
    renderPanel(options);

    // When
    await openSuggestions(user);

    // Then
    expect(screen.getByRole('button', { name: 'Get suggestions' })).toBeDisabled();
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.getByRole('link', { name: link })).toBeVisible();
  });

  it('shows placeholder cards while the first suggestions are on their way', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication();
    const suggestion = aSuggestion({ before: application.resume.personal.title });
    let resolve: (response: ReturnType<typeof aResponse>) => void = () => {};
    renderPanel({ application, suggest: vi.fn(() => new Promise<ReturnType<typeof aResponse>>((r) => (resolve = r))) });
    await openSuggestions(user);

    // When
    await user.click(screen.getByRole('button', { name: 'Get suggestions' }));

    // Then
    expect(screen.getByRole('status', { name: 'Loading suggestions' })).toBeVisible();
    resolve(aResponse([suggestion]));
    expect(await screen.findByRole('article')).toBeVisible();
    expect(screen.queryByRole('status', { name: 'Loading suggestions' })).not.toBeInTheDocument();
  });
});
