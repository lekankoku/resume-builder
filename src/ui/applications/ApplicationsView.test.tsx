// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { ApplicationDetails, JobApplication, createApplication } from '../../domain/application/JobApplication';
import { aResume } from '../../testing/resumeFixture';
import ApplicationsView from './ApplicationsView';

const uuid = () => crypto.randomUUID();

const anApplication = (overrides: Partial<ApplicationDetails> = {}, stage = uuid()) =>
  createApplication(
    { company: uuid(), role: uuid(), postingUrl: `https://${uuid()}.com`, appliedOn: '', notes: uuid(), ...overrides },
    { resume: aResume(), coverLetter: createCoverLetter(new Date()) },
    stage,
    new Date(),
    uuid(),
  );

const renderView = (applications: JobApplication[], path = '/applications') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ApplicationsView applications={applications} stages={[...new Set(applications.map((a) => a.stage))]} onChangeStage={vi.fn()} />
    </MemoryRouter>,
  );

describe('ApplicationsView search', () => {
  it.each([
    ['company', (a: JobApplication) => a.company],
    ['role', (a: JobApplication) => a.role],
    ['notes', (a: JobApplication) => a.notes],
    ['posting URL', (a: JobApplication) => a.postingUrl],
  ])('narrows the board to applications matching the %s', async (_, fieldOf) => {
    // Given
    const user = userEvent.setup();
    const match = anApplication();
    const other = anApplication();
    renderView([match, other]);

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Search applications' }), fieldOf(match));

    // Then
    expect(screen.getByText(match.company)).toBeVisible();
    expect(screen.queryByText(other.company)).not.toBeInTheDocument();
  });

  it('combines the search with the stage filter in the table', async () => {
    // Given
    const user = userEvent.setup();
    const company = uuid();
    const stage = uuid();
    const match = anApplication({ company }, stage);
    const sameCompanyOtherStage = anApplication({ company });
    const sameStageOtherCompany = anApplication({}, stage);
    renderView([match, sameCompanyOtherStage, sameStageOtherCompany], '/applications?view=table');

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Search applications' }), company);
    await user.selectOptions(screen.getByLabelText('Filter by stage'), stage);

    // Then
    const rows = within(screen.getByRole('table')).getAllByRole('link');
    expect(rows.map((row) => row.textContent)).toEqual([company]);
  });

  it('restores the search from the URL', () => {
    // Given
    const match = anApplication();
    const other = anApplication();

    // When
    renderView([match, other], `/applications?q=${match.company}`);

    // Then
    expect(screen.getByRole('searchbox', { name: 'Search applications' })).toHaveValue(match.company);
    expect(screen.queryByText(other.company)).not.toBeInTheDocument();
  });

  it('clears the search with Escape', async () => {
    // Given
    const user = userEvent.setup();
    const match = anApplication();
    const other = anApplication();
    renderView([match, other], `/applications?q=${match.company}`);

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Search applications' }), '{Escape}');

    // Then
    expect(screen.getByRole('searchbox', { name: 'Search applications' })).toHaveValue('');
    expect(screen.getByText(other.company)).toBeVisible();
  });

  it('says when nothing matches the search and clears it', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication();
    renderView([application], `/applications?q=${uuid()}`);
    expect(screen.getByText('No applications match your search.')).toBeVisible();

    // When
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    // Then
    expect(screen.getByText(application.company)).toBeVisible();
  });

  it('clears both the search and the stage filter in the table', async () => {
    // Given
    const user = userEvent.setup();
    const application = anApplication();
    renderView([application], `/applications?view=table&stage=${uuid()}&q=${application.company}`);

    // When
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    // Then
    expect(screen.getByRole('link', { name: application.company })).toBeVisible();
    expect(screen.getByRole('searchbox', { name: 'Search applications' })).toHaveValue('');
  });

  it('explains how to start when there are no applications', () => {
    // Given / When
    renderView([]);

    // Then
    expect(screen.getByText('No applications yet. Use New application to track your first one.')).toBeVisible();
  });
});
