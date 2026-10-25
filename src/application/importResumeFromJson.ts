import { createBlankCv } from '../domain/application/JobApplication';
import { Resume } from '../domain/resume/Resume';
import { mergeImportedResume, withResumeDefaults } from '../domain/resume/resumeOperations';

export const importResumeFromJson = (current: Resume, json: string): Resume =>
  mergeImportedResume(current, resumeFromJson(json));

export const resumeFromJson = (json: string): Resume => {
  const imported = JSON.parse(json);
  if (typeof imported !== 'object' || imported === null || Array.isArray(imported)) {
    throw new Error('CV JSON must be an object');
  }
  const blank = createBlankCv(new Date()).resume;
  return withResumeDefaults({ ...blank, ...imported, personal: { ...blank.personal, ...imported.personal } });
};
