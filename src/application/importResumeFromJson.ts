import { Resume } from '../domain/resume/Resume';
import { mergeImportedResume } from '../domain/resume/resumeOperations';

export const importResumeFromJson = (current: Resume, json: string): Resume =>
  mergeImportedResume(current, JSON.parse(json));
