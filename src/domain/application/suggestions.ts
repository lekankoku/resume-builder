import { CoverLetter } from '../coverLetter/CoverLetter';
import { ListSection, Resume } from '../resume/Resume';
import { itemTemplates } from '../resume/resumeOperations';
import { GenerationUsage } from './cvGeneration';

export type SuggestionSection = ListSection | 'personal' | 'leadership' | 'coverLetter';

export interface Suggestion {
  action: 'add' | 'remove' | 'replace';
  section: SuggestionSection;
  item: string;
  field: string;
  before: string;
  after: string;
  newItem: { fields: { name: string; value: string }[]; bullets: string[] };
  reason: string;
  source: string;
}

export interface SuggestionItem extends Suggestion {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface SuggestionsResponse {
  summary: string;
  gaps: string[];
  questions: string[];
  suggestions: Suggestion[];
  usage: GenerationUsage;
}

export interface SuggestionSet {
  createdAt: string;
  summary: string;
  gaps: string[];
  questions: string[];
  usage: GenerationUsage;
  items: SuggestionItem[];
}

export interface Cv {
  resume: Resume;
  coverLetter: CoverLetter;
}

export const createSuggestionSet = (response: SuggestionsResponse, now: Date, newId: () => string): SuggestionSet => ({
  createdAt: now.toISOString(),
  summary: response.summary,
  gaps: response.gaps,
  questions: response.questions,
  usage: response.usage,
  items: response.suggestions.map((suggestion) => ({ ...suggestion, id: newId(), status: 'pending' })),
});

export const setSuggestionStatus = (set: SuggestionSet, id: string, status: SuggestionItem['status']): SuggestionSet => ({
  ...set,
  items: set.items.map((item) => (item.id === id ? { ...item, status } : item)),
});

export const suggestionBlocker = (jobDescription: string | undefined, jobBank: string): string | null => {
  if (!jobBank.trim()) return 'Add your job bank in Settings first.';
  if (!jobDescription?.trim()) return 'Add the job description in Overview first.';
  return null;
};

const IDENTIFYING_FIELD: Record<ListSection, string> = {
  experiences: 'company',
  projects: 'title',
  volunteering: 'organization',
  abilities: 'title',
  technicalProficiency: 'category',
  education: 'institution',
  languages: 'name',
  references: 'name',
};

const PERSONAL_FIELDS = ['title', 'currentRole', 'currentCompany'];
const COVER_LETTER_FIELDS = ['subject', 'recipientName', 'recipientTitle', 'companyAddress'];

const same = (a: string, b: string) => a.trim() === b.trim();

export const applySuggestion = (cv: Cv, s: Suggestion): Cv | null => {
  switch (s.section) {
    case 'personal': {
      if (!PERSONAL_FIELDS.includes(s.field) || s.action === 'remove') return null;
      const personal = cv.resume.personal as unknown as Record<string, string>;
      return same(personal[s.field], s.before)
        ? { ...cv, resume: { ...cv.resume, personal: { ...cv.resume.personal, [s.field]: s.after } } }
        : null;
    }
    case 'leadership': {
      const { crossFunctional } = cv.resume;
      if (s.field === 'title') {
        return s.action !== 'remove' && same(crossFunctional.title, s.before)
          ? { ...cv, resume: { ...cv.resume, crossFunctional: { ...crossFunctional, title: s.after } } }
          : null;
      }
      const bullets = s.field === 'bullets' ? changeList(crossFunctional.bullets, s) : null;
      return bullets && { ...cv, resume: { ...cv.resume, crossFunctional: { ...crossFunctional, bullets } } };
    }
    case 'coverLetter':
      return applyToCoverLetter(cv, s);
    default:
      return applyToList(cv, s.section, s);
  }
};

const applyToCoverLetter = (cv: Cv, s: Suggestion): Cv | null => {
  const letter = cv.coverLetter;
  if (s.field === 'body') {
    const paragraphs = changeList(paragraphsOf(letter.body), s);
    return paragraphs && { ...cv, coverLetter: { ...letter, body: paragraphs.join('\n\n') } };
  }
  if (!COVER_LETTER_FIELDS.includes(s.field) || s.action === 'remove') return null;
  const fields = letter as unknown as Record<string, string>;
  return same(fields[s.field], s.before) ? { ...cv, coverLetter: { ...letter, [s.field]: s.after } } : null;
};

const applyToList = (cv: Cv, section: ListSection, s: Suggestion): Cv | null => {
  const items = cv.resume[section] as unknown as Record<string, unknown>[];
  const withItems = (next: Record<string, unknown>[]): Cv => ({ ...cv, resume: { ...cv.resume, [section]: next } });

  if (!s.field && s.action === 'add') return withItems([...items, newEntry(section, s)]);

  const index = items.findIndex((item) => typeof item[IDENTIFYING_FIELD[section]] === 'string' && same(item[IDENTIFYING_FIELD[section]] as string, s.item));
  if (index === -1) return null;
  const entry = items[index];

  if (!s.field) return s.action === 'remove' ? withItems(items.filter((_, i) => i !== index)) : null;

  if (s.field === 'bullets') {
    const bullets = Array.isArray(entry.bullets) ? changeList(entry.bullets as string[], s) : null;
    return bullets && withItems(items.map((item, i) => (i === index ? { ...item, bullets } : item)));
  }

  const current = entry[s.field];
  if (typeof current !== 'string' || s.action === 'remove' || !same(current, s.before)) return null;
  return withItems(items.map((item, i) => (i === index ? { ...item, [s.field]: s.after } : item)));
};

const newEntry = (section: ListSection, s: Suggestion): Record<string, unknown> => {
  const entry = itemTemplates[section]() as unknown as Record<string, unknown>;
  for (const { name, value } of s.newItem.fields) if (typeof entry[name] === 'string') entry[name] = value;
  if (Array.isArray(entry.bullets)) entry.bullets = s.newItem.bullets;
  return entry;
};

const changeList = (list: string[], s: Suggestion): string[] | null => {
  if (s.action === 'add') {
    if (!s.before.trim()) return [...list, s.after];
    const after = list.findIndex((text) => same(text, s.before));
    return after === -1 ? null : [...list.slice(0, after + 1), s.after, ...list.slice(after + 1)];
  }
  const index = list.findIndex((text) => same(text, s.before));
  if (index === -1) return null;
  return s.action === 'remove' ? list.filter((_, i) => i !== index) : list.map((text, i) => (i === index ? s.after : text));
};

const paragraphsOf = (body: string): string[] =>
  body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
