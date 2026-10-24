import React from 'react';
import { resumeDocumentTitle } from '../../domain/resume/documentTitle';
import { Resume } from '../../domain/resume/Resume';
import PdfFrame from '../pdf/PdfFrame';
import ResumePdf from '../pdf/ResumePdf';

interface Props {
  resume: Resume;
  targetCompany: string;
  onBackToEditor: () => void;
  onShowCoverLetter: () => void;
}

const ResumePreview: React.FC<Props> = ({ resume, targetCompany, onBackToEditor, onShowCoverLetter }) => (
  <PdfFrame
    document={<ResumePdf resume={resume} targetCompany={targetCompany} />}
    fileName={resumeDocumentTitle(resume.personal, targetCompany)}
    active="resume"
    onBack={onBackToEditor}
    onShowResume={() => {}}
    onShowCoverLetter={onShowCoverLetter}
  />
);

export default ResumePreview;
