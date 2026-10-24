import { ApplicationDraft } from '../../domain/application/ApplicationDraft';
import { JobApplication } from '../../domain/application/JobApplication';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { Profile, Resume } from '../../domain/resume/Resume';

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

export interface DraftRepository {
  load(): ApplicationDraft[];
  save(drafts: ApplicationDraft[]): void;
}

export interface ProfileRepository {
  load(): Profile;
  save(profile: Profile): void;
}

export interface Repositories {
  applications: ApplicationRepository;
  stages: StageRepository;
  drafts: DraftRepository;
  profile: ProfileRepository;
}

export interface RemoteState {
  applications?: JobApplication[];
  drafts?: ApplicationDraft[];
  stages?: string[];
  profile?: Profile;
}

export type StateKey = keyof RemoteState;

export interface StateClient {
  load(): Promise<RemoteState>;
  save<K extends StateKey>(key: K, value: RemoteState[K], options?: { keepalive?: boolean }): Promise<void>;
}

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface SaveStatusSource {
  get(): SaveStatus;
  subscribe(listener: () => void): () => void;
}
