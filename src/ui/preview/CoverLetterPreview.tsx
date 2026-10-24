import React from 'react';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { coverLetterDocumentTitle } from '../../domain/resume/documentTitle';
import { Resume } from '../../domain/resume/Resume';
import CoverLetterPdf from '../pdf/CoverLetterPdf';
import PdfFrame from '../pdf/PdfFrame';

interface Props {
  resume: Resume;
  coverLetter: CoverLetter;
  targetCompany: string;
  onBackToEditor: () => void;
  onShowResume: () => void;
}

const CoverLetterPreview: React.FC<Props> = ({ resume, coverLetter, targetCompany, onBackToEditor, onShowResume }) => (
  <PdfFrame
    document={<CoverLetterPdf resume={resume} coverLetter={coverLetter} targetCompany={targetCompany} />}
    fileName={coverLetterDocumentTitle(resume.personal, targetCompany)}
    active="cover-letter"
    onBack={onBackToEditor}
    onShowResume={onShowResume}
    onShowCoverLetter={() => {}}
  />
);

export default CoverLetterPreview;
