import { describe, expect, it } from 'vitest';
import { aResume } from '../../testing/resumeFixture';
import { createCoverLetter } from '../coverLetter/CoverLetter';
import { compareCv, diffLines } from './cvDiff';

const uuid = () => crypto.randomUUID();

describe('cvDiff', () => {
  describe('diffLines', () => {
    it('marks kept, added and removed lines in order', () => {
      const [kept, removed, added, last] = [uuid(), uuid(), uuid(), uuid()];

      expect(diffLines([kept, removed, last], [kept, added, last])).toEqual([
        { type: 'same', text: kept },
        { type: 'added', text: added },
        { type: 'removed', text: removed },
        { type: 'same', text: last },
      ]);
    });

    it('handles lines only on one side', () => {
      const [a, b] = [uuid(), uuid()];

      expect(diffLines([], [a])).toEqual([{ type: 'added', text: a }]);
      expect(diffLines([b], [])).toEqual([{ type: 'removed', text: b }]);
      expect(diffLines([], [])).toEqual([]);
    });

    it('keeps the longest common run of lines when lines move', () => {
      const [a, b, c] = [uuid(), uuid(), uuid()];

      const diff = diffLines([a, b, c], [b, c, a]);

      expect(diff.filter((line) => line.type === 'same').map((line) => line.text)).toEqual([b, c]);
    });
  });

  describe('compareCv', () => {
    const aCv = () => ({ resume: aResume(), coverLetter: { ...createCoverLetter(new Date()), body: uuid() } });

    it('reports no changes for an identical CV', () => {
      const cv = aCv();

      const sections = compareCv(cv, structuredClone(cv));

      expect(sections.every((section) => !section.changed)).toBe(true);
      expect(sections.map((section) => section.id)).toEqual([
        'personal',
        'experiences',
        'projects',
        'abilities',
        'technicalProficiency',
        'education',
        'languages',
        'references',
        'coverLetter',
      ]);
    });

    it('shows a changed experience bullet and a changed cover letter as removed and added lines', () => {
      const before = aCv();
      const after = structuredClone(before);
      const bullet = uuid();
      const body = uuid();
      after.resume.experiences[0].bullets[0] = bullet;
      after.coverLetter.body = body;

      const sections = compareCv(before, after);
      const changedLines = (id: string) =>
        sections.find((s) => s.id === id)!.lines.filter((line) => line.type !== 'same');

      expect(sections.filter((s) => s.changed).map((s) => s.id)).toEqual(['experiences', 'coverLetter']);
      expect(changedLines('experiences')).toEqual([
        { type: 'added', text: `• ${bullet}` },
        { type: 'removed', text: `• ${before.resume.experiences[0].bullets[0]}` },
      ]);
      expect(changedLines('coverLetter')).toEqual([
        { type: 'added', text: body },
        { type: 'removed', text: before.coverLetter.body },
      ]);
    });

    it('ignores profile details because they are shared by every application', () => {
      const before = aCv();
      const after = structuredClone(before);
      after.resume.personal.name = uuid();
      after.resume.personal.email = uuid();

      expect(compareCv(before, after).some((section) => section.changed)).toBe(false);
    });
  });
});
