import { CoverLetter, createCoverLetter } from '../coverLetter/CoverLetter';
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

export const createBlankCv = (now: Date): CvSource => ({
  resume: {
    personal: {
      name: '',
      title: '',
      phone: '',
      email: '',
      residence: '',
      nationality: '',
      website: '',
      linkedin: '',
      github: '',
      photoUrl: '',
    },
    experiences: [],
    abilities: [],
    education: [],
    projects: [],
    languages: [],
    technicalProficiency: [],
    references: [],
    crossFunctional: { title: '', bullets: [] },
  },
  coverLetter: createCoverLetter(now),
});

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

export const validateDetails = (details: ApplicationDetails): string[] => [
  ...(details.company.trim() ? [] : ['Company is required']),
  ...(details.role.trim() ? [] : ['Role is required']),
  ...(details.appliedOn ? [] : ['Date applied is required']),
  ...(!details.postingUrl.trim() || isWebUrl(details.postingUrl) ? [] : ['Job posting URL must start with http:// or https://']),
];

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
