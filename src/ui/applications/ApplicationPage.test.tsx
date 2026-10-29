// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { createBlankCv, createApplication, JobApplication } from '../../domain/application/JobApplication';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { aResume } from '../../testing/resumeFixture';
import { ApplicationActions } from '../hooks/useApplications';
import ApplicationPage, { OverviewTab } from './ApplicationPage';

const uuid = () => crypto.randomUUID();

const anApplication = (withCv: boolean) =>
  createApplication(
    { company: uuid(), role: uuid(), postingUrl: '', appliedOn: '2026-10-29', notes: '' },
    withCv ? { resume: aResume(), coverLetter: createCoverLetter(new Date()) } : null,
    'Interviewing',
    new Date(),
    uuid(),
  );

const renderPage = (applications: JobApplication[], path: string) => {
  const actions = { attachCv: vi.fn(), changeStage: vi.fn(), updateField: vi.fn() } as unknown as ApplicationActions;
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="applications/:id"
          element={
            <ApplicationPage
              applications={applications}
              actions={actions}
              profile={createBlankCv(new Date()).resume.personal}
              stages={['Interviewing']}
              ai={{ suggest: vi.fn(), usage: vi.fn() }}
              jobBank=""
              onRememberAnswers={vi.fn()}
            />
          }
        >
          <Route path="overview" element={<OverviewTab />} />
          <Route path="cv/:section" element={<p>CV editor</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return actions;
};

describe('ApplicationPage without a CV', () => {
  it('shows the overview as usual but no print buttons', () => {
    // Given
    const application = anApplication(false);

    // When
    renderPage([application], `/applications/${application.id}/overview`);

    // Then
    expect(screen.getByLabelText('Stage')).toHaveValue('Interviewing');
    expect(screen.queryByRole('link', { name: /Print CV/ })).toBeNull();
  });

  it('offers to add a CV instead of the CV editor', () => {
    // Given
    const application = anApplication(false);

    // When
    renderPage([application], `/applications/${application.id}/cv/personal`);

    // Then
    expect(screen.getByRole('heading', { name: 'No CV for this application yet' })).toBeVisible();
    expect(screen.queryByText('CV editor')).toBeNull();
  });

  it('adds a copy of another application CV', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication(false);
    const source = anApplication(true);
    const actions = renderPage([application, source, anApplication(false)], `/applications/${application.id}/cv/personal`);

    // When
    await user.selectOptions(screen.getByLabelText('Start from'), `Copy of ${source.company} — ${source.role}`);
    await user.click(screen.getByRole('button', { name: /Add CV/ }));

    // Then
    expect(within(screen.getByLabelText('Start from')).getAllByRole('option')).toHaveLength(2);
    expect(actions.attachCv).toHaveBeenCalledWith(application.id, { resume: source.resume, coverLetter: source.coverLetter });
  });

  it('adds an empty CV by default', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication(false);
    const actions = renderPage([application], `/applications/${application.id}/cv/personal`);

    // When
    await user.click(screen.getByRole('button', { name: /Add CV/ }));

    // Then
    expect(actions.attachCv).toHaveBeenCalledWith(application.id, expect.objectContaining({ resume: createBlankCv(new Date()).resume }));
  });

  it('shows the CV editor once the application has a CV', () => {
    // Given
    const application = anApplication(true);

    // When
    renderPage([application], `/applications/${application.id}/cv/personal`);

    // Then
    expect(screen.getByText('CV editor')).toBeVisible();
    expect(screen.getByRole('link', { name: /Print CV/ })).toBeVisible();
  });
});
