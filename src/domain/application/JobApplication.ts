import { CoverLetter } from '../coverLetter/CoverLetter';
import { Resume } from '../resume/Resume';

export interface StageChange {
  stage: string;
  changedAt: string;
}

export interface CvVersion {
  id: string;
  savedAt: string;
  note: string;
  resume: Resume;
  coverLetter: CoverLetter;
}

export interface ApplicationDetails {
  company: string;
  role: string;
  postingUrl: string;
  appliedOn: string;
  notes: string;
}

export interface JobApplication extends ApplicationDetails {
  id: string;
  stage: string;
  stageHistory: StageChange[];
  resume: Resume;
  coverLetter: CoverLetter;
  versions: CvVersion[];
}

export interface CvSource {
  resume: Resume;
  coverLetter: CoverLetter;
}

export const createApplication = (
  details: ApplicationDetails,
  source: CvSource,
  stage: string,
  now: Date,
  id: string,
): JobApplication => ({
  ...details,
  id,
  stage,
  stageHistory: [{ stage, changedAt: now.toISOString() }],
  resume: structuredClone(source.resume),
  coverLetter: structuredClone(source.coverLetter),
  versions: [],
});

export const updateApplicationField = (
  application: JobApplication,
  field: keyof ApplicationDetails,
  value: string,
): JobApplication => ({ ...application, [field]: value });

export const isWebUrl = (url: string): boolean => /^https?:\/\//i.test(url.trim());

export const changeStage = (application: JobApplication, stage: string, now: Date): JobApplication =>
  application.stage === stage
    ? application
    : {
        ...application,
        stage,
        stageHistory: [...application.stageHistory, { stage, changedAt: now.toISOString() }],
      };

export const saveVersion = (application: JobApplication, note: string, now: Date, id: string): JobApplication => ({
  ...application,
  versions: [
    ...application.versions,
    {
      id,
      savedAt: now.toISOString(),
      note,
      resume: structuredClone(application.resume),
      coverLetter: structuredClone(application.coverLetter),
    },
  ],
});

export const restoreVersion = (application: JobApplication, versionId: string): JobApplication => {
  const version = application.versions.find((v) => v.id === versionId);
  if (!version) return application;
  return {
    ...application,
    resume: structuredClone(version.resume),
    coverLetter: structuredClone(version.coverLetter),
  };
};
