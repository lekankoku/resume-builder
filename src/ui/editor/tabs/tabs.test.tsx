// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useMemo, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Resume } from '../../../domain/resume/Resume';
import { aResume } from '../../../testing/resumeFixture';
import { createResumeActions, ResumeActions } from '../../hooks/useResume';
import ExperienceTab from './ExperienceTab';
import IdentityTab from './IdentityTab';
import LeadershipTab from './LeadershipTab';
import VolunteeringTab from './VolunteeringTab';

type Tab = React.FC<{ resume: Resume; actions: ResumeActions }>;

const renderTab = (Tab: Tab, initial: Resume) => {
  const onChange = vi.fn<(resume: Resume) => void>();
  const Harness = () => {
    const [resume, setResume] = useState(initial);
    const actions = useMemo(
      () =>
        createResumeActions((change) =>
          setResume((current) => {
            const next = change(current);
            onChange(next);
            return next;
          }),
        ),
      [],
    );
    return <Tab resume={resume} actions={actions} />;
  };
  render(<Harness />);
  return { onChange, latest: () => onChange.mock.lastCall![0] };
};

describe('editor tabs', () => {
  describe('ExperienceTab', () => {
    it('adds an earlier position at the same company and edits its role', async () => {
      // Given
      const user = userEvent.setup();
      const resume = aResume({ experiences: [{ ...aResume().experiences[0], earlierPositions: [] }] });
      const { latest } = renderTab(ExperienceTab, resume);
      const role = crypto.randomUUID();

      // When
      await user.click(screen.getByRole('button', { name: '+ Add Earlier Position' }));
      await user.type(screen.getByRole('textbox', { name: 'Earlier role 1' }), role);

      // Then
      expect(latest().experiences[0].earlierPositions).toEqual([{ role, period: '' }]);
    });

    it('removes an earlier position', async () => {
      // Given
      const user = userEvent.setup();
      const { latest } = renderTab(ExperienceTab, aResume());

      // When
      await user.click(screen.getByRole('button', { name: 'Remove earlier role 1' }));

      // Then
      expect(latest().experiences[1].earlierPositions).toEqual([]);
    });
  });

  describe('VolunteeringTab', () => {
    it('adds a volunteering entry and fills in its role and highlight', async () => {
      // Given
      const user = userEvent.setup();
      const { latest } = renderTab(VolunteeringTab, aResume({ volunteering: [] }));
      const [role, highlight] = [crypto.randomUUID(), crypto.randomUUID()];

      // When
      await user.click(screen.getByRole('button', { name: /Add Volunteering/ }));
      await user.type(screen.getByRole('textbox', { name: 'Role' }), role);
      await user.type(screen.getByRole('textbox', { name: 'Highlights 1' }), highlight);

      // Then
      expect(latest().volunteering).toEqual([{ organization: '', location: '', role, period: '', bullets: [highlight] }]);
    });
  });

  describe('LeadershipTab', () => {
    it('edits the section title and adds and removes highlights', async () => {
      // Given
      const user = userEvent.setup();
      const resume = aResume({ crossFunctional: { title: '', bullets: [crypto.randomUUID()] } });
      const { latest } = renderTab(LeadershipTab, resume);
      const [title, highlight] = [crypto.randomUUID(), crypto.randomUUID()];

      // When
      await user.type(screen.getByRole('textbox', { name: 'Section title' }), title);
      await user.click(screen.getByRole('button', { name: '+ Add Highlight' }));
      await user.type(screen.getByRole('textbox', { name: 'Highlights 2' }), highlight);
      await user.click(screen.getByRole('button', { name: 'Remove Highlights 1' }));

      // Then
      expect(latest().crossFunctional).toEqual({ title, bullets: [highlight] });
    });
  });

  describe('IdentityTab', () => {
    const IdentityTabHarness: Tab = (props) => <IdentityTab {...props} targetCompany="" onTargetCompanyChange={vi.fn()} />;

    it('edits the current role and company and switches the section order', async () => {
      // Given
      const user = userEvent.setup();
      const resume = aResume();
      resume.personal = { ...resume.personal, currentRole: '', currentCompany: '' };
      const { latest } = renderTab(IdentityTabHarness, resume);
      const [role, company] = [crypto.randomUUID(), crypto.randomUUID()];

      // When
      await user.type(screen.getByRole('textbox', { name: 'Current role' }), role);
      await user.type(screen.getByRole('textbox', { name: 'Current company' }), company);
      await user.selectOptions(screen.getByRole('combobox', { name: 'Section order' }), 'education-first');

      // Then
      expect(latest().personal).toEqual(expect.objectContaining({ currentRole: role, currentCompany: company }));
      expect(latest().layout).toBe('education-first');
    });
  });
});
