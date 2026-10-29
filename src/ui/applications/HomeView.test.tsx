// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { changeStage, createApplication, JobApplication } from '../../domain/application/JobApplication';
import { createJobLead, JobLead } from '../../domain/application/JobLead';
import { aResume } from '../../testing/resumeFixture';
import HomeView from './HomeView';

const uuid = () => crypto.randomUUID();
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

const anApplication = (stage: string, createdAt = new Date(), appliedOn = '') =>
  createApplication(
    { company: uuid(), role: uuid(), postingUrl: '', appliedOn, notes: '' },
    { resume: aResume(), coverLetter: createCoverLetter(createdAt) },
    stage,
    createdAt,
    uuid(),
  );

const aLead = (addedAt: Date) => createJobLead({ postingUrl: `https://${uuid()}.com`, company: uuid(), role: uuid() }, addedAt, uuid());

const renderView = ({ applications = [], stages = [], leads = [] }: { applications?: JobApplication[]; stages?: string[]; leads?: JobLead[] }) =>
  render(
    <MemoryRouter>
      <HomeView applications={applications} stages={stages} drafts={[]} leads={leads} onDiscardDraft={vi.fn()} />
    </MemoryRouter>,
  );

describe('HomeView', () => {
  describe('needs attention', () => {
    it('lists active applications without movement for 14 days, stalest first', () => {
      // Given
      const stage = uuid();
      const stale = anApplication(stage, daysAgo(15));
      const stalest = anApplication(stage, daysAgo(40));
      const fresh = anApplication(stage, daysAgo(3));
      const closed = anApplication('Rejected', daysAgo(40));

      // When
      renderView({ applications: [stale, fresh, closed, stalest], stages: [stage] });

      // Then
      const items = within(screen.getByRole('region', { name: 'Needs attention' })).getAllByRole('listitem');
      expect(items.map((item) => within(item).getByRole('link').textContent)).toEqual([
        `${stalest.company} — ${stalest.role}`,
        `${stale.company} — ${stale.role}`,
      ]);
      expect(within(items[0]).getByText(`40 days in ${stage}`)).toBeVisible();
    });

    it('is hidden when every active application moved recently', () => {
      // Given
      const stage = uuid();

      // When
      renderView({ applications: [anApplication(stage, daysAgo(1))], stages: [stage] });

      // Then
      expect(screen.queryByRole('region', { name: 'Needs attention' })).not.toBeInTheDocument();
    });
  });

  describe('to apply', () => {
    it('shows the three oldest saved jobs with a link to start an application from each', () => {
      // Given
      const leads = [aLead(daysAgo(1)), aLead(daysAgo(9)), aLead(daysAgo(5)), aLead(daysAgo(7))];
      const [, oldest, , secondOldest] = leads;

      // When
      renderView({ leads });

      // Then
      const section = within(screen.getByRole('region', { name: 'To apply' }));
      const starts = section.getAllByRole('link', { name: /Start application for/ });
      expect(starts.map((link) => link.getAttribute('href'))).toEqual([
        `/applications/new?lead=${oldest.id}`,
        `/applications/new?lead=${secondOldest.id}`,
        `/applications/new?lead=${leads[2].id}`,
      ]);
      expect(section.queryByText(leads[0].company)).not.toBeInTheDocument();
    });

    it('says so when there are no saved jobs', () => {
      // When
      renderView({});

      // Then
      expect(within(screen.getByRole('region', { name: 'To apply' })).getByText('No saved jobs.')).toBeVisible();
    });
  });

  it('shows how far applications got, counting ones that were later rejected', () => {
    // Given
    const [applied, interviewing] = [uuid(), uuid()];
    const stillApplied = anApplication(applied);
    const rejectedAfterInterview = changeStage(changeStage(anApplication(applied), interviewing, new Date()), 'Rejected', new Date());

    // When
    renderView({ applications: [stillApplied, rejectedAfterInterview], stages: [applied, interviewing, 'Rejected'] });

    // Then
    const rows = within(screen.getByRole('region', { name: 'How far applications got' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([`${applied}2 · 100%`, `${interviewing}1 · 50%`]);
  });

  it('charts applications per week over the last 8 weeks', () => {
    // Given
    const thisWeek = anApplication(uuid(), new Date(), isoDay(new Date()));
    const lastWeek = anApplication(uuid(), new Date(), isoDay(daysAgo(8)));

    // When
    renderView({ applications: [thisWeek, lastWeek] });

    // Then
    const chart = within(screen.getByRole('region', { name: 'Applications per week' }));
    expect(chart.getByText('2 in the last 8 weeks')).toBeVisible();
    expect(chart.getAllByRole('listitem')).toHaveLength(8);
    expect(chart.getByText(`Week ending ${isoDay(new Date())}: 1`)).toBeVisible();
  });

  it('links the active and to apply tiles to their pages', () => {
    // When
    renderView({ applications: [anApplication(uuid())], leads: [aLead(new Date())] });

    // Then
    const stats = within(screen.getByRole('region', { name: 'Statistics' }));
    expect(stats.getByRole('link', { name: '1 Active' })).toHaveAttribute('href', '/applications');
    expect(stats.getByRole('link', { name: '1 To apply' })).toHaveAttribute('href', '/to-apply');
  });
});
