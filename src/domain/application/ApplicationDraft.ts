import { CoverLetter } from '../coverLetter/CoverLetter';
import { Resume } from '../resume/Resume';
import { ApplicationDetails } from './JobApplication';

export type CvStart = 'new' | 'reuse' | 'json';

export interface ApplicationDraft {
  id: string;
  updatedAt: string;
  stepId: string;
  details: ApplicationDetails;
  stage: string;
  cvStart: CvStart;
  sourceId: string;
  jsonInput: string;
  cvKey: string | null;
  resume: Resume;
  coverLetter: CoverLetter;
  verifiedSections: string[];
}

export const upsertDraft = (drafts: ApplicationDraft[], draft: ApplicationDraft): ApplicationDraft[] =>
  drafts.some((d) => d.id === draft.id) ? drafts.map((d) => (d.id === draft.id ? draft : d)) : [...drafts, draft];

export const WIZARD_STEPS = ['details', 'cv', 'review', 'confirm'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export const isWizardStep = (stepId: string): stepId is WizardStep => (WIZARD_STEPS as readonly string[]).includes(stepId);

export const draftStep = (stepId: string): WizardStep =>
  isWizardStep(stepId) ? stepId : stepId === 'cv-start' ? 'cv' : 'review';
