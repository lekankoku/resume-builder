import { CoverLetterRepository, Repositories, ResumeRepository, TargetCompanyRepository } from '../../application/ports/repositories';
import { CoverLetter, createCoverLetter } from '../../domain/coverLetter/CoverLetter';
import { Resume } from '../../domain/resume/Resume';

const STORAGE_KEY_PERSONAL = 'resume-identity-attributes';
const STORAGE_KEY_REFERENCES = 'resume-references';
const STORAGE_KEY_LANGUAGES = 'resume-languages';
const STORAGE_KEY_EDUCATION = 'resume-education';
const STORAGE_KEY_COVER_LETTER = 'resume-cover-letter';
const STORAGE_KEY_TARGET_COMPANY = 'resume-target-company';

const readJson = <T>(storage: Storage, key: string, fallback: T): T => {
  const stored = storage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
};

class LocalStorageResumeRepository implements ResumeRepository {
  constructor(
    private readonly storage: Storage,
    private readonly defaults: Resume,
  ) {}

  load(): Resume {
    const { title, ...defaultPersonal } = this.defaults.personal;
    return {
      ...this.defaults,
      personal: { ...readJson(this.storage, STORAGE_KEY_PERSONAL, defaultPersonal), title },
      references: readJson(this.storage, STORAGE_KEY_REFERENCES, this.defaults.references),
      languages: readJson(this.storage, STORAGE_KEY_LANGUAGES, this.defaults.languages),
      education: readJson(this.storage, STORAGE_KEY_EDUCATION, this.defaults.education),
    };
  }

  save(resume: Resume): void {
    const { title, ...personal } = resume.personal;
    this.storage.setItem(STORAGE_KEY_PERSONAL, JSON.stringify(personal));
    this.storage.setItem(STORAGE_KEY_REFERENCES, JSON.stringify(resume.references));
    this.storage.setItem(STORAGE_KEY_LANGUAGES, JSON.stringify(resume.languages));
    this.storage.setItem(STORAGE_KEY_EDUCATION, JSON.stringify(resume.education));
  }
}

class LocalStorageCoverLetterRepository implements CoverLetterRepository {
  constructor(
    private readonly storage: Storage,
    private readonly now: () => Date,
  ) {}

  load(): CoverLetter {
    return readJson(this.storage, STORAGE_KEY_COVER_LETTER, createCoverLetter(this.now()));
  }

  save(letter: CoverLetter): void {
    this.storage.setItem(STORAGE_KEY_COVER_LETTER, JSON.stringify(letter));
  }
}

class LocalStorageTargetCompanyRepository implements TargetCompanyRepository {
  constructor(private readonly storage: Storage) {}

  load(): string {
    return this.storage.getItem(STORAGE_KEY_TARGET_COMPANY) ?? '';
  }

  save(targetCompany: string): void {
    this.storage.setItem(STORAGE_KEY_TARGET_COMPANY, targetCompany);
  }
}

export const createLocalStorageRepositories = (
  storage: Storage,
  defaultResume: Resume,
  now: () => Date = () => new Date(),
): Repositories => ({
  resume: new LocalStorageResumeRepository(storage, defaultResume),
  coverLetter: new LocalStorageCoverLetterRepository(storage, now),
  targetCompany: new LocalStorageTargetCompanyRepository(storage),
});
