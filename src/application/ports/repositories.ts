import { JobApplication } from '../../domain/application/JobApplication';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { Resume } from '../../domain/resume/Resume';

export interface ResumeRepository {
  load(): Resume;
  save(resume: Resume): void;
}

export interface CoverLetterRepository {
  load(): CoverLetter;
  save(letter: CoverLetter): void;
}

export interface TargetCompanyRepository {
  load(): string;
  save(targetCompany: string): void;
}

export interface ApplicationRepository {
  load(): JobApplication[];
  save(applications: JobApplication[]): void;
}

export interface StageRepository {
  load(): string[];
  save(stages: string[]): void;
}

export interface Repositories {
  resume: ResumeRepository;
  coverLetter: CoverLetterRepository;
  targetCompany: TargetCompanyRepository;
  applications: ApplicationRepository;
  stages: StageRepository;
}
