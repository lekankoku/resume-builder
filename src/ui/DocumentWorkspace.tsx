import React, { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { CoverLetter, updateCoverLetterField } from '../domain/coverLetter/CoverLetter';
import { Resume } from '../domain/resume/Resume';
import { applyProfile } from '../domain/resume/resumeOperations';
import { useApplicationContext } from './applications/ApplicationPage';
import SuggestionsPanel, { SuggestionScope } from './applications/SuggestionsPanel';
import EditorView, { CV_EDITOR_SECTIONS, EditorSection } from './editor/EditorView';
import { createResumeActions } from './hooks/useResume';
import { useJsonSource } from './hooks/useJsonSource';
import CoverLetterDocument from './preview/CoverLetterDocument';
import LivePreview from './preview/LivePreview';
import ResumeDocument from './preview/ResumeDocument';

const SidePanel: React.FC<{ scope: SuggestionScope; preview: React.ReactNode }> = ({ scope, preview }) => {
  const { application, actions, ai, jobBank, onRememberAnswers } = useApplicationContext();
  const [view, setView] = useState<'preview' | 'suggestions'>('preview');
  const pending =
    application.suggestions?.items.filter((item) => item.status === 'pending' && (scope === 'coverLetter') === (item.section === 'coverLetter'))
      .length ?? 0;
  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm ${active ? 'bg-accent text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button aria-pressed={view === 'preview'} onClick={() => setView('preview')} className={tabClass(view === 'preview')}>
          Preview
        </button>
        <button aria-pressed={view === 'suggestions'} onClick={() => setView('suggestions')} className={tabClass(view === 'suggestions')}>
          AI suggestions{pending > 0 ? ` (${pending})` : ''}
        </button>
      </div>
      {view === 'preview' ? (
        preview
      ) : (
        <SuggestionsPanel
          application={application}
          scope={scope}
          ai={ai}
          jobBank={jobBank}
          onUpdate={(change) => actions.update(application.id, change)}
          onRememberAnswers={onRememberAnswers}
        />
      )}
    </div>
  );
};

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
      <div className="hidden xl:block min-w-0">
        <SidePanel
          scope="coverLetter"
          preview={
            <LivePreview title="Cover letter preview" printViewHref={`/applications/${application.id}/preview/cover-letter`}>
              <CoverLetterDocument resume={resume} coverLetter={application.coverLetter} targetCompany={application.company} />
            </LivePreview>
          }
        />
      </div>
    </div>
  );
};
