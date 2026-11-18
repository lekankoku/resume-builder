import { describe, expect, it } from 'vitest';
import { lengthReport } from './length';

const bullets = (n: number) => Array.from({ length: n }, () => crypto.randomUUID());

describe('lengthReport', () => {
  const resume = {
    experiences: [
      { company: 'Acme', bullets: bullets(8) },
      { company: '', bullets: bullets(3) },
    ],
    projects: [{ title: 'Search', bullets: bullets(2) }],
    volunteering: [],
    education: [{ institution: 'TU Berlin', bullets: bullets(1) }],
    abilities: [{ title: 'Communication', bullets: bullets(1) }],
  };

  it('reports pages against the budget and the bullets of each entry', () => {
    expect(lengthReport(resume, { pages: 3, budget: 2 })).toBe(
      [
        'page_budget: 2',
        'current_pages: 3',
        'status: 1 page(s) over budget',
        'bullets_in_left_column: 14 (budget about 30)',
        'experiences "Acme": 8 bullets',
        'experiences "(untitled)": 3 bullets',
        'projects "Search": 2 bullets',
        'education "TU Berlin": 1 bullets',
        'abilities "Communication": 1 bullets',
      ].join('\n'),
    );
  });

  it.each([
    [2, 'status: at budget, no room to grow'],
    [1, 'status: under budget'],
  ])('describes a CV of %i page(s) within a 2-page budget', (pages, status) => {
    expect(lengthReport(resume, { pages, budget: 2 })).toContain(status);
  });

  it('falls back to a 2-page budget and an unknown page count', () => {
    const report = lengthReport({ personal: {} }, undefined);

    expect(report).toContain('page_budget: 2\ncurrent_pages: unknown\nstatus: not measured\nbullets_in_left_column: 0');
  });
});
