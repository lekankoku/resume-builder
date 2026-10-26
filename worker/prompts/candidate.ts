import { tagged } from './schema';

export interface StoredProfile {
  name?: string;
  residence?: string;
  nationality?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface StoredFacts {
  workAuthorization?: string;
  permit?: string;
  languages?: unknown[];
  references?: unknown[];
  education?: unknown[];
  answers?: unknown[];
}

export const candidateData = (jobBank: string, profile: StoredProfile | null, facts: StoredFacts | null): string => {
  const { name, residence, nationality, website, linkedin, github } = profile ?? {};
  return [
    tagged('profile', JSON.stringify({ name, residence, nationality, website, linkedin, github })),
    tagged('work_authorization', JSON.stringify({ status: facts?.workAuthorization ?? 'unknown', permit: facts?.permit ?? '' })),
    tagged('languages', JSON.stringify(facts?.languages ?? [])),
    tagged('references', JSON.stringify(facts?.references ?? [])),
    tagged('education', JSON.stringify(facts?.education ?? [])),
    tagged('remembered_answers', JSON.stringify(facts?.answers ?? [])),
    tagged('job_bank', jobBank),
  ].join('\n');
};
