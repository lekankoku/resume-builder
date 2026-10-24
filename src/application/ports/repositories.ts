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

export interface Repositories {
  resume: ResumeRepository;
  coverLetter: CoverLetterRepository;
  targetCompany: TargetCompanyRepository;
}
