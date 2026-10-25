import { ApplicationDraft } from './ApplicationDraft';
import { JobApplication } from './JobApplication';
import { JobLead } from './JobLead';

export interface SearchResult {
  kind: 'application' | 'lead' | 'draft';
  id: string;
  title: string;
  subtitle: string;
}

export interface Searchable {
  applications: JobApplication[];
  leads: JobLead[];
  drafts: ApplicationDraft[];
}

interface Candidate extends SearchResult {
  text: string;
}

export const searchRecords = (query: string, { applications, leads, drafts }: Searchable, limit: number): SearchResult[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const candidates: Candidate[] = [
    ...applications.map((a) => ({
      kind: 'application' as const,
      id: a.id,
      title: a.company || 'Untitled company',
      subtitle: [a.role, a.stage].filter(Boolean).join(' · '),
      text: [a.company, a.role, a.stage, a.notes, a.postingUrl].join(' '),
    })),
    ...leads.map((l) => ({
      kind: 'lead' as const,
      id: l.id,
      title: l.company || 'Untitled company',
      subtitle: [l.role, 'To apply'].filter(Boolean).join(' · '),
      text: [l.company, l.role, l.postingUrl].join(' '),
    })),
    ...drafts.map((d) => ({
      kind: 'draft' as const,
      id: d.id,
      title: d.details.company || 'Untitled company',
      subtitle: [d.details.role, 'Draft'].filter(Boolean).join(' · '),
      text: [d.details.company, d.details.role, d.details.notes, d.details.postingUrl].join(' '),
    })),
  ];

  return candidates
    .filter((candidate) => {
      const text = candidate.text.toLowerCase();
      return terms.every((term) => text.includes(term));
    })
    .slice(0, limit)
    .map(({ text: _text, ...result }) => result);
};
