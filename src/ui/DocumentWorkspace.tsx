import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router';
import { CoverLetter, updateCoverLetterField } from '../domain/coverLetter/CoverLetter';
import { Resume } from '../domain/resume/Resume';
import { applyProfile } from '../domain/resume/resumeOperations';
import { useApplicationContext } from './applications/ApplicationPage';
import { PreviewWithSuggestions, SuggestionScope } from './applications/SuggestionsPanel';
import EditorView, { CV_EDITOR_SECTIONS, EditorSection } from './editor/EditorView';
import { createResumeActions, withRemovalUndo } from './hooks/useResume';
import { useJsonSource } from './hooks/useJsonSource';
import CoverLetterDocument from './preview/CoverLetterDocument';
import LivePreview from './preview/LivePreview';
import PreviewPane from './preview/PreviewPane';
import ResumeDocument from './preview/ResumeDocument';
import { useToast } from './shell/Toast';

const SidePanel: React.FC<{ scope: SuggestionScope; preview: React.ReactNode }> = ({ scope, preview }) => {
  const { application, actions, ai, jobBank, onRememberAnswers } = useApplicationContext();
  return (
    <PreviewWithSuggestions
      scope={scope}
      preview={preview}
      job={application}
      state={{ resume: application.resume, coverLetter: application.coverLetter, suggestions: application.suggestions ?? null }}
      ai={ai}
      jobBank={jobBank}
      jobDescriptionAt={{ label: 'Overview', to: `/applications/${application.id}/overview` }}
      onUpdate={(change) =>
        actions.update(application.id, (a) => ({
          ...a,
          ...change({ resume: a.resume, coverLetter: a.coverLetter, suggestions: a.suggestions ?? null }),
        }))
      }
      onRememberAnswers={onRememberAnswers}
    />
  );
};

const useApplicationDocuments = () => {
  const { application, actions, profile } = useApplicationContext();
  const notify = useToast();
  const { id } = application;
  const setResume = (resume: Resume) => actions.update(id, (a) => ({ ...a, resume }));

  const resumeActions = useMemo(
    () => createResumeActions((change) => actions.update(id, (a) => ({ ...a, resume: change(a.resume) }))),
    [id],
  );

  return {
    application,
    resume: applyProfile(application.resume, profile),
    resumeActions: withRemovalUndo(resumeActions, application.resume, setResume, notify),
    setResume,
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
      preview={
        <SidePanel
          scope="cv"
          preview={
            <LivePreview title="CV preview" printViewHref={`/applications/${application.id}/preview/resume`}>
              <ResumeDocument resume={resume} />
            </LivePreview>
          }
        />
      }
    />
  );
};

export const CoverLetterTab: React.FC = () => {
  const { application, resume, resumeActions, onCoverLetterFieldChange, onTargetCompanyChange } = useApplicationDocuments();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <section className="bg-white rounded-2xl border border-slate-200 p-6 min-w-0">
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
      <PreviewPane>
        <SidePanel
          scope="coverLetter"
          preview={
            <LivePreview title="Cover letter preview" printViewHref={`/applications/${application.id}/preview/cover-letter`}>
              <CoverLetterDocument resume={resume} coverLetter={application.coverLetter} targetCompany={application.company} />
            </LivePreview>
          }
        />
      </PreviewPane>
    </div>
  );
};
