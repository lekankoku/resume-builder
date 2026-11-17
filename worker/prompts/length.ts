export interface LengthRequest {
  pages?: number | null;
  budget?: number;
}

const DEFAULT_BUDGET = 2;

// Measured: about 34 two-line bullets over 7 roles fill 2 pages at full size. 15 a page leaves room
// for entry headings, project scopes and education.
const BULLETS_PER_PAGE = 15;

type Entry = { bullets?: unknown };

const entriesOf = (resume: unknown, section: string): Entry[] => {
  const value = (resume as Record<string, unknown> | null)?.[section];
  return Array.isArray(value) ? (value as Entry[]) : [];
};

const bulletCount = (entry: Entry) => (Array.isArray(entry.bullets) ? entry.bullets.length : 0);

const labelOf = (entry: Record<string, unknown>, field: string) => String(entry[field] ?? '').trim() || '(untitled)';

const describeEntries = (resume: unknown, section: string, field: string): string[] =>
  entriesOf(resume, section).map((entry) => `${section} "${labelOf(entry as Record<string, unknown>, field)}": ${bulletCount(entry)} bullets`);

// A plain summary of how long the CV is, measured by the app, so the model can plan cuts.
export const lengthReport = (resume: unknown, length: LengthRequest | undefined): string => {
  const budget = length?.budget && length.budget > 0 ? length.budget : DEFAULT_BUDGET;
  const pages = typeof length?.pages === 'number' && length.pages > 0 ? length.pages : null;
  const mainSections = ['experiences', 'projects', 'volunteering', 'education'];
  const totalBullets = mainSections.flatMap((section) => entriesOf(resume, section)).reduce((sum, entry) => sum + bulletCount(entry), 0);
  const bulletBudget = budget * BULLETS_PER_PAGE;

  const status =
    pages === null ? 'not measured' : pages > budget ? `${pages - budget} page(s) over budget` : pages === budget ? 'at budget, no room to grow' : 'under budget';

  return [
    `page_budget: ${budget}`,
    `current_pages: ${pages ?? 'unknown'}`,
    `status: ${status}`,
    `bullets_in_left_column: ${totalBullets} (budget about ${bulletBudget})`,
    ...describeEntries(resume, 'experiences', 'company'),
    ...describeEntries(resume, 'projects', 'title'),
    ...describeEntries(resume, 'volunteering', 'organization'),
    ...describeEntries(resume, 'education', 'institution'),
    ...describeEntries(resume, 'abilities', 'title'),
  ].join('\n');
};
