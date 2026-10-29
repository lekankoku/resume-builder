import { JobApplication } from './JobApplication';
import { CLOSED_STAGES, isActiveApplication } from './stages';

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

export const daysInStage = (application: JobApplication, now: Date): number =>
  Math.floor((now.getTime() - Date.parse(application.stageHistory[application.stageHistory.length - 1].changedAt)) / DAY_MS);

export const staleApplications = (applications: JobApplication[], days: number, now: Date): JobApplication[] =>
  applications
    .filter((a) => isActiveApplication(a) && daysInStage(a, now) >= days)
    .sort((a, b) => daysInStage(b, now) - daysInStage(a, now));

export interface StageReach {
  stage: string;
  reached: number;
}

export const stageReach = (applications: JobApplication[], stages: string[]): StageReach[] => {
  const open = stages.filter((stage) => !CLOSED_STAGES.includes(stage));
  const furthest = applications.map((a) => Math.max(...a.stageHistory.map((change) => open.indexOf(change.stage))));
  return open.map((stage, index) => ({ stage, reached: furthest.filter((f) => f >= index).length }));
};

export interface WeeklyCount {
  weekEnding: string;
  count: number;
}

export const weeklyApplied = (applications: JobApplication[], weeks: number, now: Date): WeeklyCount[] => {
  const counts = new Array<number>(weeks).fill(0);
  applications.forEach((a) => {
    const appliedOn = Date.parse(a.appliedOn);
    if (Number.isNaN(appliedOn) || appliedOn > now.getTime()) return;
    const weeksAgo = Math.floor((now.getTime() - appliedOn) / (7 * DAY_MS));
    if (weeksAgo < weeks) counts[weeks - 1 - weeksAgo] += 1;
  });
  return counts.map((count, index) => ({
    weekEnding: new Date(now.getTime() - (weeks - 1 - index) * 7 * DAY_MS).toISOString().slice(0, 10),
    count,
  }));
};
