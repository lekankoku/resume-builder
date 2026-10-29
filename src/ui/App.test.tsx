// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Repositories } from '../application/ports/repositories';
import { ApplicationDraft } from '../domain/application/ApplicationDraft';
import { createApplication, createBlankCv, JobApplication, saveVersion } from '../domain/application/JobApplication';
import { createJobLead, JobLead } from '../domain/application/JobLead';
import { createCandidateFacts } from '../domain/candidate/CandidateFacts';
import { createCoverLetter } from '../domain/coverLetter/CoverLetter';
import { aResume } from '../testing/resumeFixture';
import App from './App';
import { ToastProvider } from './shell/Toast';

const uuid = () => crypto.randomUUID();

const memory = <T,>(value: T) => ({ load: () => value, save: vi.fn() });

const anApplication = (stage: string) =>
  createApplication(
    { company: uuid(), role: uuid(), postingUrl: '', appliedOn: '2026-10-29', notes: '' },
    { resume: aResume(), coverLetter: createCoverLetter(new Date()) },
    stage,
    new Date(),
    uuid(),
  );

const aDraft = (): ApplicationDraft => ({
  id: uuid(),
  updatedAt: new Date().toISOString(),
  stepId: 'details',
  details: { company: uuid(), role: uuid(), postingUrl: '', appliedOn: '2026-10-29', notes: '' },
  cvStart: 'new',
  sourceId: '',
  jsonInput: '',
  cvKey: null,
  ...createBlankCv(new Date()),
});

const renderApp = (
  path: string,
  { applications = [], stages = [], leads = [], drafts = [] }: { applications?: JobApplication[]; stages?: string[]; leads?: JobLead[]; drafts?: ApplicationDraft[] },
) => {
  const repositories: Repositories = {
    applications: memory(applications),
    stages: memory(stages),
    drafts: memory(drafts),
    leads: memory(leads),
    profile: memory(createBlankCv(new Date()).resume.personal),
    jobBank: memory(''),
    facts: memory(createCandidateFacts()),
    cvGuide: memory(null),
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <App
          repositories={repositories}
          documents={{ list: async () => [], upload: vi.fn(), rename: vi.fn(), remove: vi.fn(), urlOf: () => '' }}
          ai={{ suggest: vi.fn(), usage: vi.fn() }}
          saveStatus={{ get: () => 'saved', subscribe: () => () => {} }}
          onRetrySave={vi.fn()}
        />
      </ToastProvider>
    </MemoryRouter>,
  );
};

describe('App undo', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  it('undoes a stage change, including its history entry', async () => {
    // Given
    const user = userEvent.setup();
    const [from, to] = [uuid(), uuid()];
    const application = anApplication(from);
    renderApp('/applications?view=table', { applications: [application], stages: [from, to] });

    // When
    await user.selectOptions(screen.getByRole('combobox', { name: `Stage of ${application.company}` }), to);
    expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent(`${application.company} moved to ${to}`);
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    expect(screen.getByRole('combobox', { name: `Stage of ${application.company}` })).toHaveValue(from);
  });

  it('deletes an application from its overview and brings it back on undo', async () => {
    // Given
    const user = userEvent.setup();
    const stage = uuid();
    const [kept, deleted] = [anApplication(stage), anApplication(stage)];
    renderApp(`/applications/${deleted.id}/overview`, { applications: [kept, deleted], stages: [stage] });

    // When
    await user.click(screen.getByRole('button', { name: /Delete application/ }));

    // Then
    expect(screen.queryByText(deleted.company)).not.toBeInTheDocument();
    expect(screen.getByText(kept.company)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText(deleted.company)).toBeVisible();
  });

  it('brings back a removed saved job in its place', async () => {
    // Given
    const user = userEvent.setup();
    const leads = [0, 1, 2].map(() => createJobLead({ postingUrl: `https://${uuid()}.com`, company: uuid(), role: '' }, new Date(), uuid()));
    renderApp('/to-apply', { leads });

    // When
    await user.click(screen.getByRole('button', { name: `Remove ${leads[1].company}` }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    const starts = screen.getAllByRole('link', { name: /Start application for/ });
    expect(starts.map((link) => link.getAttribute('aria-label'))).toEqual(leads.map((lead) => `Start application for ${lead.company}`));
  });

  it('discards a draft without asking and restores it on undo', async () => {
    // Given
    const user = userEvent.setup();
    const draft = aDraft();
    renderApp('/', { drafts: [draft] });

    // When
    await user.click(screen.getByRole('button', { name: /Discard/ }));

    // Then
    expect(screen.queryByRole('heading', { name: draft.details.company })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('heading', { name: draft.details.company })).toBeVisible();
  });

  it('restores a removed stage in its place', async () => {
    // Given
    const user = userEvent.setup();
    const stages = [uuid(), uuid(), uuid()];
    renderApp('/settings/stages', { stages });

    // When
    await user.click(screen.getByRole('button', { name: `Remove stage ${stages[1]}` }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    const removeButtons = screen.getAllByRole('button', { name: /Remove stage/ });
    expect(removeButtons.map((button) => button.getAttribute('aria-label'))).toEqual(stages.map((stage) => `Remove stage ${stage}`));
  });

  it('brings back a removed CV entry', async () => {
    // Given
    const user = userEvent.setup();
    const stage = uuid();
    const application = anApplication(stage);
    renderApp(`/applications/${application.id}/cv/experiences`, { applications: [application], stages: [stage] });
    const entries = () => screen.getAllByRole('button', { name: /^Remove Experience \d$/ });
    const count = entries().length;

    // When
    await user.click(entries()[0]);
    expect(entries()).toHaveLength(count - 1);
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    expect(entries()).toHaveLength(count);
  });

  it('restores a version without asking and can undo it', async () => {
    // Given
    const user = userEvent.setup();
    const stage = uuid();
    const saved = saveVersion(anApplication(stage), uuid(), new Date(), uuid());
    const application = { ...saved, resume: aResume() };
    renderApp(`/applications/${application.id}/versions`, { applications: [application], stages: [stage] });

    // When
    await user.click(screen.getByRole('button', { name: /Restore/ }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await user.click(screen.getByRole('link', { name: /Compare/ }));

    // Then
    expect(screen.queryByText('The current CV matches this version.')).not.toBeInTheDocument();
  });

  it('restores a version so the CV matches it', async () => {
    // Given
    const user = userEvent.setup();
    const stage = uuid();
    const saved = saveVersion(anApplication(stage), uuid(), new Date(), uuid());
    const application = { ...saved, resume: aResume() };
    renderApp(`/applications/${application.id}/versions`, { applications: [application], stages: [stage] });

    // When
    await user.click(screen.getByRole('button', { name: /Restore/ }));
    await user.click(screen.getByRole('link', { name: /Compare/ }));

    // Then
    expect(screen.getByText('The current CV matches this version.')).toBeVisible();
  });

  it('brings back a removed CV fact', async () => {
    // Given
    const user = userEvent.setup();
    renderApp('/settings/cv-facts', {});
    await user.click(screen.getAllByRole('button', { name: /Add/ })[0]);
    const removes = () => screen.queryAllByRole('button', { name: /^Remove / });

    // When
    await user.click(removes()[0]);
    expect(removes()).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    // Then
    expect(removes()).toHaveLength(1);
  });
});

describe('App shell', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  it('lets keyboard users skip the navigation to the page content', async () => {
    // Given
    const user = userEvent.setup();
    renderApp('/to-apply', {});

    // When
    await user.tab();

    // Then
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });
});
