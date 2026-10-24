import { JobApplication } from './JobApplication';

export const DEFAULT_STAGES = ['Wishlist', 'Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];

export const CLOSED_STAGES = ['Rejected', 'Withdrawn'];

export const isActiveApplication = (application: JobApplication): boolean => !CLOSED_STAGES.includes(application.stage);

export const addStage =(stages: string[], name: string): string[] => {
  const stage = name.trim();
  return !stage || stages.includes(stage) ? stages : [...stages, stage];
};

export const isStageInUse = (stage: string, applications: JobApplication[]): boolean =>
  applications.some((application) => application.stage === stage);

export const removeStage = (stages: string[], name: string, applications: JobApplication[]): string[] =>
  isStageInUse(name, applications) ? stages : stages.filter((stage) => stage !== name);
