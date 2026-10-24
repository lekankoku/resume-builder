import { useEffect, useState } from 'react';
import { importResumeFromJson } from '../../application/importResumeFromJson';
import { Resume } from '../../domain/resume/Resume';

export const useJsonSource = (resume: Resume, setResume: (resume: Resume) => void) => {
  const [jsonInput, setJsonInput] = useState<string>(() => JSON.stringify(resume, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonInput(JSON.stringify(resume, null, 2));
  }, [resume]);

  const applyJson = () => {
    try {
      setResume(importResumeFromJson(resume, jsonInput));
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  return { jsonInput, setJsonInput, jsonError, applyJson };
};
