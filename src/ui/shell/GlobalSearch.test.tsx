// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createJobLead, JobLead } from '../../domain/application/JobLead';
import GlobalSearch from './GlobalSearch';

const uuid = () => crypto.randomUUID();

const aLead = (company: string) => createJobLead({ postingUrl: `https://${uuid()}.com`, company, role: '' }, new Date(), uuid());

const Location = () => <p>At {useLocation().pathname + useLocation().search}</p>;

const renderSearch = (leads: JobLead[]) =>
  render(
    <MemoryRouter>
      <GlobalSearch records={{ applications: [], leads, drafts: [] }} />
      <button>Elsewhere</button>
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );

describe('GlobalSearch', () => {
  it('moves through results with the arrow keys and opens the active one with Enter', async () => {
    // Given
    const user = userEvent.setup();
    const prefix = uuid();
    const leads = [aLead(`${prefix} a`), aLead(`${prefix} b`)];
    renderSearch(leads);

    // When
    await user.type(screen.getByRole('combobox'), prefix);
    await user.keyboard('{ArrowDown}');

    // Then
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByText(`At /applications/new?lead=${leads[1].id}`)).toBeVisible();
  });

  it('closes the results when focus leaves the search', async () => {
    // Given
    const user = userEvent.setup();
    const company = uuid();
    renderSearch([aLead(company)]);
    await user.type(screen.getByRole('combobox'), company);
    expect(screen.getByRole('listbox')).toBeVisible();

    // When
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));

    // Then
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens a result when clicked', async () => {
    // Given
    const user = userEvent.setup();
    const lead = aLead(uuid());
    renderSearch([lead]);
    await user.type(screen.getByRole('combobox'), lead.company);

    // When
    await user.click(screen.getByRole('option', { name: new RegExp(lead.company) }));

    // Then
    expect(screen.getByText(`At /applications/new?lead=${lead.id}`)).toBeVisible();
  });

  it('says how many matches are hidden beyond the first eight', async () => {
    // Given
    const user = userEvent.setup();
    const prefix = uuid();
    renderSearch(Array.from({ length: 10 }, (_, i) => aLead(`${prefix} ${i}`)));

    // When
    await user.type(screen.getByRole('combobox'), prefix);

    // Then
    expect(screen.getAllByRole('option')).toHaveLength(8);
    expect(screen.getByText('Showing 8 of 10. Keep typing to narrow it down.')).toBeVisible();
  });
});
