import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router';
import { CoverLetter, updateCoverLetterField } from '../domain/coverLetter/CoverLetter';
import { Resume } from '../domain/resume/Resume';
import { applyProfile } from '../domain/resume/resumeOperations';
import { useApplicationContext } from './applications/ApplicationPage';
import EditorView, { CV_EDITOR_SECTIONS, EditorSection } from './editor/EditorView';
import { createResumeActions } from './hooks/useResume';
import { useJsonSource } from './hooks/useJsonSource';

const useApplicationDocuments = () => {
  const { application, actions, profile } = useApplicationContext();
  const { id } = application;

  const resumeActions = useMemo(
    () => createResumeActions((change) => actions.update(id, (a) => ({ ...a, resume: change(a.resume) }))),
    [id],
  );

  return {
    application,
    resume: applyProfile(application.resume, profile),
    resumeActions,
    setResume: (resume: Resume) => actions.update(id, (a) => ({ ...a, resume })),
    onCoverLetterFieldChange: (field: keyof CoverLetter, value: string) =>
      actions.update(id, (a) => ({ ...a, coverLetter: updateCoverLetterField(a.coverLetter, field, value) })),
    onTargetCompanyChange: (company: string) => actions.updateField(id, 'company', company),
  };
};

export const CvTab: React.FC = () => {
  const { section } = useParams();
  const { application, resume, resumeActions, setResume, onCoverLetterFieldChange, onTargetCompanyChange } =
    useApplicationDocuments();
  const { jsonInput, setJsonInput, jsonError, applyJson } = useJsonSource(application.resume, setResume);

  if (!CV_EDITOR_SECTIONS.some((s) => s.id === section)) return <Navigate to="../personal" relative="path" replace />;

  return (
    <EditorView
      resume={resume}
      actions={resumeActions}
      coverLetter={application.coverLetter}
      onCoverLetterFieldChange={onCoverLetterFieldChange}
      targetCompany={application.company}
      onTargetCompanyChange={onTargetCompanyChange}
      jsonInput={jsonInput}
      jsonError={jsonError}
      onJsonChange={setJsonInput}
      onApplyJson={applyJson}
      activeSection={section!}
    />
  );
};

export const CoverLetterTab: React.FC = () => {
  const { application, resume, resumeActions, onCoverLetterFieldChange, onTargetCompanyChange } = useApplicationDocuments();

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-8">
      <EditorSection
        section="coverLetter"
        resume={resume}
        actions={resumeActions}
        coverLetter={application.coverLetter}
        onCoverLetterFieldChange={onCoverLetterFieldChange}
        targetCompany={application.company}
        onTargetCompanyChange={onTargetCompanyChange}
      />
    </section>
  );
};
