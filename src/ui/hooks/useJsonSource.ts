import { useEffect, useState } from 'react';
import { importResumeFromJson } from '../../application/importResumeFromJson';
import { Resume } from '../../domain/resume/Resume';
import { useToast } from '../shell/Toast';

export const useJsonSource = (resume: Resume, setResume: (resume: Resume) => void) => {
  const [jsonInput, setJsonInput] = useState<string>(() => JSON.stringify(resume, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const notify = useToast();

  useEffect(() => {
    if (!edited) setJsonInput(JSON.stringify(resume, null, 2));
  }, [resume]);

  const editJson = (value: string) => {
    setJsonInput(value);
    setEdited(true);
  };

  const applyJson = () => {
    try {
      setResume(importResumeFromJson(resume, jsonInput));
      setJsonError(null);
      setEdited(false);
      notify('JSON applied', () => setResume(resume));
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  return { jsonInput, setJsonInput: editJson, jsonError, applyJson };
};
