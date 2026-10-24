import React, { useEffect, useState } from 'react';
import { CoverLetterRepository, ResumeRepository, TargetCompanyRepository } from '../application/ports/repositories';
import { coverLetterDocumentTitle, resumeDocumentTitle } from '../domain/resume/documentTitle';
import { Profile } from '../domain/resume/Resume';
import { applyProfile } from '../domain/resume/resumeOperations';
import EditorView from './editor/EditorView';
import { useCoverLetter } from './hooks/useCoverLetter';
import { useJsonSource } from './hooks/useJsonSource';
import { useResume } from './hooks/useResume';
import { useTargetCompany } from './hooks/useTargetCompany';
import CoverLetterPreview from './preview/CoverLetterPreview';
import ResumePreview, { PrintVariant } from './preview/ResumePreview';

interface Props {
  repositories: {
    resume: ResumeRepository;
    coverLetter: CoverLetterRepository;
    targetCompany: TargetCompanyRepository;
  };
  profile: Profile;
  contextLabel: string;
  onOpenApplications: () => void;
}

const DocumentWorkspace: React.FC<Props> = ({ repositories, profile, contextLabel, onOpenApplications }) => {
  const { resume: draft, setResume, actions } = useResume(repositories.resume);
  const resume = applyProfile(draft, profile);
  const { coverLetter, updateField: updateCoverLetterField } = useCoverLetter(repositories.coverLetter);
  const { targetCompany, setTargetCompany } = useTargetCompany(repositories.targetCompany);
  const { jsonInput, setJsonInput, jsonError, applyJson } = useJsonSource(draft, setResume);

  const [isEditing, setIsEditing] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [printVariant, setPrintVariant] = useState<PrintVariant>('continuous');
  const [viewMode, setViewMode] = useState<'resume' | 'cover-letter'>('resume');

  useEffect(() => {
    document.title =
      viewMode === 'resume'
        ? resumeDocumentTitle(resume.personal, targetCompany)
        : coverLetterDocumentTitle(resume.personal, targetCompany);
  }, [resume.personal.name, resume.personal.title, viewMode, targetCompany]);

  if (isEditing) {
    return (
      <EditorView
        resume={resume}
        actions={actions}
        coverLetter={coverLetter}
        onCoverLetterFieldChange={updateCoverLetterField}
        targetCompany={targetCompany}
        onTargetCompanyChange={setTargetCompany}
        jsonInput={jsonInput}
        jsonError={jsonError}
        onJsonChange={setJsonInput}
        onApplyJson={applyJson}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        contextLabel={contextLabel}
        onOpenApplications={onOpenApplications}
        onPreviewResume={() => {
          setViewMode('resume');
          setIsEditing(false);
        }}
        onPreviewCoverLetter={() => {
          setViewMode('cover-letter');
          setIsEditing(false);
        }}
      />
    );
  }

  if (viewMode === 'cover-letter') {
    return (
      <CoverLetterPreview
        resume={resume}
        coverLetter={coverLetter}
        targetCompany={targetCompany}
        onBackToEditor={() => setIsEditing(true)}
        onShowResume={() => setViewMode('resume')}
      />
    );
  }

  return (
    <ResumePreview
      resume={resume}
      targetCompany={targetCompany}
      printVariant={printVariant}
      onPrintVariantChange={setPrintVariant}
      onBackToEditor={() => setIsEditing(true)}
      onShowCoverLetter={() => setViewMode('cover-letter')}
    />
  );
};

export default DocumentWorkspace;
