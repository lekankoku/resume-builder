import { CoverLetter } from '../coverLetter/CoverLetter';
import { Ability, Education, Layout, Position, Project, Resume, TechnicalProficiency, Volunteering } from '../resume/Resume';
import { ApplicationDetails, createBlankCv } from './JobApplication';

export interface Evidence {
  source: string;
  quote: string;
}

export interface Question {
  field: string;
  question: string;
}

export interface Answer {
  field: string;
  answer: string;
}

export interface Claim {
  claim: string;
  source: string;
}

export interface CvAnalysis {
  skills: {
    skill: string;
    origin: 'posting' | 'candidate';
    keywords: { term: string; original: string }[];
    priority: number;
    status: 'strong' | 'partial' | 'gap';
    evidence: Evidence[];
  }[];
  currentPosition: { source: string; company: string; title: string };
  roles: { company: string; sources: string[]; relevance: 'primary' | 'secondary' | 'minor' | 'omit'; bulletBudget: number; reason: string }[];
  layout: Layout;
  tagline: string;
  titleAdjustments: { source: string; original: string; proposed: string; quote: string }[];
  extras: { projects: string[]; volunteering: string[]; leadershipCategory: string; leadershipItems: Evidence[] };
  questions: Question[];
}

export interface GeneratedCv {
  layout: Layout;
  header: { title: string; currentRole: string; currentCompany: string };
  abilities: Ability[];
  leadership: { title: string; bullets: string[] };
  languages: { name: string; level: string }[];
  technicalProficiency: TechnicalProficiency[];
  references: { name: string; role: string; company: string; contact: string; linkedin: string }[];
  experiences: { company: string; location: string; positions: Position[]; bullets: string[] }[];
  education: Education[];
  projects: Project[];
  volunteering: Volunteering[];
}

export interface CvReview {
  gaps: string[];
  adjustedTitles: { original: string; used: string }[];
  claimsToCheck: Claim[];
  keywordCoverage: { used: string[]; unused: { term: string; reason: 'gap' | 'no room' }[] };
  timelineGaps: { from: string; to: string; cause: 'omitted' | 'no data'; detail: string }[];
  questions: Question[];
}

export interface GeneratedCoverLetter {
  letter: {
    subject: string;
    recipientName: string;
    recipientTitle: string;
    companyName: string;
    companyAddress: string;
    greeting: string;
    paragraphs: string[];
    closing: string;
    signature: string;
  };
  review: { claimsToCheck: Claim[]; keywordsUsed: string[]; questions: Question[] };
}

export interface GenerationUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface AnalysedJob {
  analysis: CvAnalysis;
  usage: GenerationUsage;
}

export interface WrittenCv {
  cv: GeneratedCv;
  review: CvReview;
  coverLetter: GeneratedCoverLetter | null;
  usage: GenerationUsage;
}

export interface Job {
  company: string;
  role: string;
  jobDescription: string;
}

export interface WriteCvRequest extends Job {
  analysis: CvAnalysis;
  answers: Answer[];
  coverLetter: boolean;
  motivation: string;
}

export interface Generation {
  analysis: CvAnalysis;
  analysisUsage: GenerationUsage;
  analysedAt: string;
  answers: Answer[];
  coverLetterRequested: boolean;
  motivation: string;
  written: (WrittenCv & { writtenAt: string }) | null;
}

export interface UsageEntry extends GenerationUsage {
  id: string;
  createdAt: string;
  provider: string;
  model: string;
  company: string;
  role: string;
}

export interface UsageReport {
  entries: UsageEntry[];
  monthUsd: number;
  totalUsd: number;
}

export const generationBlocker = (details: ApplicationDetails, jobBank: string): string | null => {
  if (!jobBank.trim()) return 'Add your job bank in Settings first.';
  if (!details.jobDescription?.trim()) return 'Add the job description in the Details step first.';
  return null;
};

export const resumeFromGeneratedCv = (cv: GeneratedCv): Resume => ({
  ...createBlankCv(new Date()).resume,
  personal: { ...createBlankCv(new Date()).resume.personal, ...cv.header },
  layout: cv.layout,
  experiences: cv.experiences.map(({ company, location, positions: [latest, ...earlier], bullets }) => ({
    company,
    location,
    role: latest?.role ?? '',
    period: latest?.period ?? '',
    earlierPositions: earlier,
    bullets,
  })),
  abilities: cv.abilities,
  education: cv.education,
  projects: cv.projects,
  volunteering: cv.volunteering,
  languages: cv.languages,
  technicalProficiency: cv.technicalProficiency,
  references: cv.references,
  crossFunctional: cv.leadership,
});

export const coverLetterFromGenerated = ({ letter }: GeneratedCoverLetter, base: CoverLetter): CoverLetter => ({
  ...base,
  subject: letter.subject,
  recipientName: letter.recipientName,
  recipientTitle: letter.recipientTitle,
  companyAddress: letter.companyAddress,
  body: [letter.greeting, ...letter.paragraphs, [letter.closing, letter.signature].filter(Boolean).join('\n')].filter(Boolean).join('\n\n'),
});

export const formatUsd = (usd: number): string => (usd > 0 && usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`);
