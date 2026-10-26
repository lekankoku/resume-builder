import { CoverLetter, withCoverLetterDefaults } from '../coverLetter/CoverLetter';
import { Resume } from '../resume/Resume';
import { withResumeDefaults } from '../resume/resumeOperations';
import { Generation } from './cvGeneration';
import { ApplicationDetails } from './JobApplication';

export type CvStart = 'new' | 'reuse' | 'json' | 'generate';

export interface ApplicationDraft {
  id: string;
  updatedAt: string;
  stepId: string;
  details: ApplicationDetails;
  cvStart: CvStart;
  sourceId: string;
  jsonInput: string;
  cvKey: string | null;
  resume: Resume;
  coverLetter: CoverLetter;
  verifiedSections: string[];
  generated?: Generation | null;
}

export const withDraftDefaults = (draft: ApplicationDraft): ApplicationDraft => ({
  ...draft,
  resume: withResumeDefaults(draft.resume),
  coverLetter: withCoverLetterDefaults(draft.coverLetter),
  generated: draft.generated?.analysis ? draft.generated : null,
});

export const upsertDraft = (drafts: ApplicationDraft[], draft: ApplicationDraft): ApplicationDraft[] =>
  drafts.some((d) => d.id === draft.id) ? drafts.map((d) => (d.id === draft.id ? draft : d)) : [...drafts, draft];

export const WIZARD_STEPS = ['details', 'cv', 'review', 'confirm'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export const isWizardStep = (stepId: string): stepId is WizardStep => (WIZARD_STEPS as readonly string[]).includes(stepId);

export const draftStep = (stepId: string): WizardStep =>
  isWizardStep(stepId) ? stepId : stepId === 'cv-start' ? 'cv' : 'review';
