// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { JobLead, createJobLead } from '../../domain/application/JobLead';
import LeadsView from './LeadsView';

const uuid = () => crypto.randomUUID();

const aLead = () => createJobLead({ company: uuid(), role: uuid(), postingUrl: `https://${uuid()}.com` }, new Date(), uuid());

const renderView = (leads: JobLead[]) =>
  render(
    <MemoryRouter>
      <LeadsView leads={leads} onAdd={vi.fn()} onRemove={vi.fn()} />
    </MemoryRouter>,
  );

describe('LeadsView search', () => {
  it.each([
    ['company', (l: JobLead) => l.company],
    ['role', (l: JobLead) => l.role],
    ['posting URL', (l: JobLead) => l.postingUrl],
  ])('shows only the saved jobs matching the %s', async (_, fieldOf) => {
    // Given
    const user = userEvent.setup();
    const match = aLead();
    const other = aLead();
    renderView([match, other]);

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Search saved jobs' }), fieldOf(match));

    // Then
    expect(screen.getByRole('link', { name: `Start application for ${match.company}` })).toBeVisible();
    expect(screen.queryByRole('link', { name: `Start application for ${other.company}` })).not.toBeInTheDocument();
  });

  it('says so when no saved job matches', async () => {
    // Given
    const user = userEvent.setup();
    renderView([aLead()]);

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Search saved jobs' }), uuid());

    // Then
    expect(screen.getByText('No saved jobs match your search.')).toBeVisible();
  });
});
