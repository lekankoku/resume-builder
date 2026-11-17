import React from 'react';
import { resumeDocumentTitle } from '../../domain/resume/documentTitle';
import { Resume } from '../../domain/resume/Resume';
import { useCvFit } from '../hooks/useCvFit';
import PdfFrame from '../pdf/PdfFrame';
import ResumePdf from '../pdf/ResumePdf';
import PageCount from './PageCount';

interface Props {
  resume: Resume;
  targetCompany: string;
  onBackToEditor: () => void;
  onShowCoverLetter: () => void;
}

const ResumePreview: React.FC<Props> = ({ resume, targetCompany, onBackToEditor, onShowCoverLetter }) => {
  const { fit, settled } = useCvFit(resume, targetCompany, 0);
  return (
    <PdfFrame
      document={settled ? <ResumePdf resume={resume} targetCompany={targetCompany} density={fit?.density ?? 1} /> : null}
      status={<PageCount fit={fit} />}
      fileName={resumeDocumentTitle(resume.personal, targetCompany)}
      active="resume"
      onBack={onBackToEditor}
      onShowResume={() => {}}
      onShowCoverLetter={onShowCoverLetter}
    />
  );
};

export default ResumePreview;
