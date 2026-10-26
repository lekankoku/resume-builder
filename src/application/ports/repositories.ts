import { ApplicationDraft } from '../../domain/application/ApplicationDraft';
import { AnalysedJob, Job, UsageReport, WriteCvRequest, WrittenCv } from '../../domain/application/cvGeneration';
import { JobApplication } from '../../domain/application/JobApplication';
import { JobLead } from '../../domain/application/JobLead';
import { Profile, Resume } from '../../domain/resume/Resume';

export interface ResumeRepository {
  load(): Resume;
  save(resume: Resume): void;
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

export interface LeadRepository {
  load(): JobLead[];
  save(leads: JobLead[]): void;
}

export interface ProfileRepository {
  load(): Profile;
  save(profile: Profile): void;
}

export interface JobBankRepository {
  load(): string;
  save(jobBank: string): void;
}

export interface CvGuideRepository {
  load(): StoredDocument | null;
  save(guide: StoredDocument): void;
}

export interface Repositories {
  applications: ApplicationRepository;
  stages: StageRepository;
  drafts: DraftRepository;
  leads: LeadRepository;
  profile: ProfileRepository;
  jobBank: JobBankRepository;
  cvGuide: CvGuideRepository;
}

export interface RemoteState {
  applications?: JobApplication[];
  drafts?: ApplicationDraft[];
  leads?: JobLead[];
  stages?: string[];
  profile?: Profile;
  jobBank?: string;
  cvGuide?: StoredDocument;
}

export type StateKey = keyof RemoteState;

export interface StateClient {
  load(): Promise<RemoteState>;
  save<K extends StateKey>(key: K, value: RemoteState[K], options?: { keepalive?: boolean }): Promise<void>;
}

export interface StoredDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export interface DocumentClient {
  list(): Promise<StoredDocument[]>;
  upload(file: File): Promise<StoredDocument>;
  remove(id: string): Promise<void>;
  urlOf(id: string): string;
}

export interface AiClient {
  analyseJob(job: Job): Promise<AnalysedJob>;
  writeCv(request: WriteCvRequest): Promise<WrittenCv>;
  usage(): Promise<UsageReport>;
}

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface SaveStatusSource {
  get(): SaveStatus;
  subscribe(listener: () => void): () => void;
}
