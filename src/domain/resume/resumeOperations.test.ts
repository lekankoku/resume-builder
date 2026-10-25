import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import {
  addBullet,
  addCrossFunctionalBullet,
  addEarlierPosition,
  addItem,
  applyProfile,
  mergeImportedResume,
  moveItem,
  removeBullet,
  removeCrossFunctionalBullet,
  removeEarlierPosition,
  removeItem,
  StoredResume,
  updateBullet,
  updateCrossFunctionalBullet,
  updateCrossFunctionalTitle,
  updateEarlierPosition,
  updateItemField,
  updateLayout,
  updatePersonalField,
  withResumeDefaults,
} from './resumeOperations';

describe('resumeOperations', () => {
  describe('updatePersonalField', () => {
    it('replaces only the given personal field without mutating the original', () => {
      const resume = aResume();
      const original = structuredClone(resume);
      const email = crypto.randomUUID();

      const updated = updatePersonalField(resume, 'email', email);

      expect(updated.personal).toEqual({ ...original.personal, email });
      expect(resume).toEqual(original);
    });
  });

  describe('addItem', () => {
    it.each([
      ['experiences', { role: '', company: '', location: '', period: '', earlierPositions: [], bullets: [''] }],
      ['projects', { title: '', company: '', scope: '', period: '', bullets: [''] }],
      ['education', { degree: '', institution: '', location: '', period: '', bullets: [] }],
      ['volunteering', { organization: '', role: '', location: '', period: '', bullets: [''] }],
      ['abilities', { title: '', bullets: [''] }],
      ['languages', { name: '', level: '' }],
      ['technicalProficiency', { category: '', skills: '' }],
      ['references', { name: '', role: '', company: '', contact: '', linkedin: '' }],
    ] as const)('appends an empty %s item', (section, template) => {
      const resume = aResume();

      const updated = addItem(resume, section);

      expect(updated[section]).toHaveLength(resume[section].length + 1);
      expect(updated[section].at(-1)).toEqual(template);
    });

    it('gives each added item its own bullets array', () => {
      const once = addItem(aResume(), 'experiences');
      const twice = addItem(once, 'experiences');

      expect(twice.experiences.at(-1)!.bullets).not.toBe(twice.experiences.at(-2)!.bullets);
    });
  });

  describe('removeItem', () => {
    it('removes the item at the given index and keeps the order of the rest', () => {
      const resume = aResume();

      const updated = removeItem(resume, 'experiences', 1);

      expect(updated.experiences).toEqual([resume.experiences[0], resume.experiences[2]]);
    });
  });

  describe('moveItem', () => {
    it('moves an item forward', () => {
      const [a, b, c] = aResume().experiences;

      const updated = moveItem(aResume({ experiences: [a, b, c] }), 'experiences', 0, 2);

      expect(updated.experiences).toEqual([b, c, a]);
    });

    it('moves an item backward', () => {
      const [a, b, c] = aResume().experiences;

      const updated = moveItem(aResume({ experiences: [a, b, c] }), 'experiences', 2, 0);

      expect(updated.experiences).toEqual([c, a, b]);
    });
  });

  describe('updateItemField', () => {
    it('updates the field on the targeted item only', () => {
      const resume = aResume();
      const role = crypto.randomUUID();

      const updated = updateItemField(resume, 'experiences', 1, 'role', role);

      expect(updated.experiences[1]).toEqual({ ...resume.experiences[1], role });
      expect(updated.experiences[0]).toBe(resume.experiences[0]);
      expect(updated.experiences[2]).toBe(resume.experiences[2]);
    });
  });

  describe('bullets', () => {
    it('adds an empty bullet to the targeted item', () => {
      const resume = aResume();

      const updated = addBullet(resume, 'experiences', 0);

      expect(updated.experiences[0].bullets).toEqual([...resume.experiences[0].bullets, '']);
      expect(updated.experiences[1]).toBe(resume.experiences[1]);
    });

    it('updates the bullet at the given position', () => {
      const resume = aResume();
      const text = crypto.randomUUID();

      const updated = updateBullet(resume, 'experiences', 0, 1, text);

      expect(updated.experiences[0].bullets).toEqual([resume.experiences[0].bullets[0], text]);
    });

    it('removes the bullet at the given position', () => {
      const resume = aResume();

      const updated = removeBullet(resume, 'experiences', 0, 0);

      expect(updated.experiences[0].bullets).toEqual([resume.experiences[0].bullets[1]]);
    });

    it('works for the other sections that have bullets', () => {
      const resume = aResume();

      expect(addBullet(resume, 'projects', 0).projects[0].bullets).toHaveLength(2);
      expect(addBullet(resume, 'abilities', 0).abilities[0].bullets).toHaveLength(2);
    });
  });

  describe('applyProfile', () => {
    it('replaces the personal details with the profile but keeps the application title, current position and other sections', () => {
      const resume = aResume();
      const { title, currentRole, currentCompany, ...profile } = aResume().personal;

      const result = applyProfile(resume, profile);

      expect(result.personal).toEqual({
        ...profile,
        title: resume.personal.title,
        currentRole: resume.personal.currentRole,
        currentCompany: resume.personal.currentCompany,
      });
      expect(result.experiences).toEqual(resume.experiences);
    });
  });

  describe('updateLayout', () => {
    it('sets the layout', () => {
      expect(updateLayout(aResume(), 'education-first').layout).toBe('education-first');
    });
  });

  describe('earlier positions', () => {
    it('adds an empty earlier position to the given experience only', () => {
      const resume = aResume();

      const updated = addEarlierPosition(resume, 1);

      expect(updated.experiences[1].earlierPositions).toEqual([...resume.experiences[1].earlierPositions, { role: '', period: '' }]);
      expect(updated.experiences[0]).toEqual(resume.experiences[0]);
    });

    it('updates one field of the given earlier position', () => {
      const resume = aResume();
      const role = crypto.randomUUID();

      const updated = updateEarlierPosition(resume, 1, 0, 'role', role);

      expect(updated.experiences[1].earlierPositions[0]).toEqual({ ...resume.experiences[1].earlierPositions[0], role });
    });

    it('removes the given earlier position', () => {
      expect(removeEarlierPosition(aResume(), 1, 0).experiences[1].earlierPositions).toEqual([]);
    });
  });

  describe('cross functional', () => {
    it('updates the title and keeps the bullets', () => {
      const resume = aResume();
      const title = crypto.randomUUID();

      expect(updateCrossFunctionalTitle(resume, title).crossFunctional).toEqual({ ...resume.crossFunctional, title });
    });

    it('adds, updates and removes bullets', () => {
      const resume = aResume();
      const bullet = crypto.randomUUID();

      const added = addCrossFunctionalBullet(resume);
      const updated = updateCrossFunctionalBullet(added, 1, bullet);
      const removed = removeCrossFunctionalBullet(updated, 0);

      expect(added.crossFunctional.bullets).toEqual([...resume.crossFunctional.bullets, '']);
      expect(updated.crossFunctional.bullets).toEqual([...resume.crossFunctional.bullets, bullet]);
      expect(removed.crossFunctional.bullets).toEqual([bullet]);
    });
  });

  describe('withResumeDefaults', () => {
    it('fills the fields an older stored resume does not have', () => {
      const { currentRole, currentCompany, ...personal } = aResume().personal;
      const resume = aResume();
      const stored: StoredResume = {
        ...resume,
        personal,
        layout: undefined,
        volunteering: undefined,
        experiences: resume.experiences.map(({ earlierPositions, ...experience }) => experience),
        education: resume.education.map(({ bullets, ...education }) => education),
        projects: resume.projects.map(({ period, ...project }) => project),
        references: resume.references.map(({ contact, ...reference }) => reference),
      };

      const result = withResumeDefaults(stored);

      expect(result.personal).toEqual({ ...personal, currentRole: '', currentCompany: '' });
      expect(result.layout).toBe('experience-first');
      expect(result.volunteering).toEqual([]);
      expect(result.experiences.map((e) => e.earlierPositions)).toEqual(resume.experiences.map(() => []));
      expect(result.education.map((e) => e.bullets)).toEqual(resume.education.map(() => []));
      expect(result.projects.map((p) => p.period)).toEqual(resume.projects.map(() => ''));
      expect(result.references.map((r) => r.contact)).toEqual(resume.references.map(() => ''));
    });

    it('keeps the values of a current resume', () => {
      const resume = aResume({ layout: 'education-first' });

      expect(withResumeDefaults(resume)).toEqual(resume);
    });
  });

  describe('mergeImportedResume', () => {
    it('takes content from the import but keeps locally stored identity, references, languages and education', () => {
      const current = aResume();
      const imported = aResume();

      const merged = mergeImportedResume(current, imported);

      expect(merged.experiences).toEqual(imported.experiences);
      expect(merged.projects).toEqual(imported.projects);
      expect(merged.personal).toEqual({ ...current.personal, title: imported.personal.title });
      expect(merged.references).toEqual(current.references);
      expect(merged.languages).toEqual(current.languages);
      expect(merged.education).toEqual(current.education);
    });

    it('keeps the current title when the import has none', () => {
      const current = aResume();
      const imported = { ...aResume(), personal: undefined } as never;

      const merged = mergeImportedResume(current, imported);

      expect(merged.personal).toEqual(current.personal);
    });
  });
});
