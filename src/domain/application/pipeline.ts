import { JobApplication } from './JobApplication';

export interface StageColumn {
  stage: string;
  applications: JobApplication[];
}

export const stageColumns = (applications: JobApplication[], stages: string[]): StageColumn[] => {
  const unlisted = [...new Set(applications.map((a) => a.stage))].filter((stage) => !stages.includes(stage));
  return [...stages, ...unlisted].map((stage) => ({ stage, applications: applications.filter((a) => a.stage === stage) }));
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const appliedWithin = (applications: JobApplication[], days: number, now: Date): number =>
  applications.filter((a) => {
    const appliedOn = Date.parse(a.appliedOn);
    return !Number.isNaN(appliedOn) && appliedOn <= now.getTime() && now.getTime() - appliedOn <= days * DAY_MS;
  }).length;

export const newestAppliedFirst = (applications: JobApplication[]): JobApplication[] =>
  [...applications].sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));

export interface StageActivity {
  application: JobApplication;
  stage: string;
  changedAt: string;
}

export const recentActivity = (applications: JobApplication[], limit: number): StageActivity[] =>
  applications
    .flatMap((application) => application.stageHistory.map((change) => ({ application, ...change })))
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
    .slice(0, limit);
