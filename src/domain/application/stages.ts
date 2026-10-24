import { JobApplication } from './JobApplication';

export const DEFAULT_STAGES = ['Wishlist', 'Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];

export const CLOSED_STAGES = ['Rejected', 'Withdrawn'];

const APPLIED_STAGE = 'Applied';

export const initialStage = (stages: string[]): string => (stages.includes(APPLIED_STAGE) ? APPLIED_STAGE : stages[0] ?? APPLIED_STAGE);

export const stageOptions = (stages: string[], current: string): string[] =>
  stages.includes(current) ? stages : [current, ...stages];

export const isActiveApplication = (application: JobApplication): boolean => !CLOSED_STAGES.includes(application.stage);

export const addStage =(stages: string[], name: string): string[] => {
  const stage = name.trim();
  return !stage || stages.includes(stage) ? stages : [...stages, stage];
};

export const isStageInUse = (stage: string, applications: JobApplication[]): boolean =>
  applications.some((application) => application.stage === stage);

export const removeStage = (stages: string[], name: string, applications: JobApplication[]): string[] =>
  isStageInUse(name, applications) ? stages : stages.filter((stage) => stage !== name);
