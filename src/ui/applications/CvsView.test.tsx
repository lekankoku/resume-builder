// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { JobApplication, createApplication } from '../../domain/application/JobApplication';
import { aResume } from '../../testing/resumeFixture';
import CvsView from './CvsView';

const uuid = () => crypto.randomUUID();

const anApplication = () =>
  createApplication(
    { company: uuid(), role: uuid(), postingUrl: `https://${uuid()}.com`, appliedOn: '', notes: uuid() },
    { resume: aResume(), coverLetter: createCoverLetter(new Date()) },
    uuid(),
    new Date(),
    uuid(),
  );

const renderView = (applications: JobApplication[]) =>
  render(
    <MemoryRouter>
      <CvsView applications={applications} />
    </MemoryRouter>,
  );

describe('CvsView search', () => {
  it.each([
    ['company', (a: JobApplication) => a.company],
    ['role', (a: JobApplication) => a.role],
    ['CV title', (a: JobApplication) => a.resume.personal.title],
  ])('shows only the CVs matching the %s', async (_, fieldOf) => {
    // Given
    const user = userEvent.setup();
    const match = anApplication();
    const other = anApplication();
    renderView([match, other]);

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Search CVs' }), fieldOf(match));

    // Then
    expect(screen.getByRole('link', { name: match.company })).toBeVisible();
    expect(screen.queryByRole('link', { name: other.company })).not.toBeInTheDocument();
  });

  it('says so when no CV matches', async () => {
    // Given
    const user = userEvent.setup();
    renderView([anApplication()]);

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Search CVs' }), uuid());

    // Then
    expect(screen.getByText('No CVs match your search.')).toBeVisible();
  });

  it('offers no search when there are no CVs', () => {
    // Given / When
    renderView([]);

    // Then
    expect(screen.queryByRole('searchbox', { name: 'Search CVs' })).not.toBeInTheDocument();
  });
});
