import React from 'react';
import { FileText, Mail, MapPin, Phone } from 'lucide-react';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { cleanUrl, displayUrl } from '../../domain/resume/contactFormat';
import { coverLetterDocumentTitle } from '../../domain/resume/documentTitle';
import { Resume } from '../../domain/resume/Resume';
import PrintToolbar from './PrintToolbar';

interface Props {
  resume: Resume;
  coverLetter: CoverLetter;
  targetCompany: string;
  onBackToEditor: () => void;
  onShowResume: () => void;
}

const CoverLetterPreview: React.FC<Props> = ({ resume, coverLetter, targetCompany, onBackToEditor, onShowResume }) => (
  <div className="flex flex-col items-center min-h-screen pb-20 print:pb-0 bg-slate-100/30 font-sans">
    <PrintToolbar
      active="cover-letter"
      onBack={onBackToEditor}
      onShowResume={onShowResume}
      onShowCoverLetter={() => {}}
      onPrint={() => {
        document.title = coverLetterDocumentTitle(resume.personal, targetCompany);
        window.print();
      }}
    />

    <div className="resume-viewport">
      <CoverLetterDocument resume={resume} coverLetter={coverLetter} targetCompany={targetCompany} />
    </div>
  </div>
);

export const CoverLetterDocument: React.FC<{ resume: Resume; coverLetter: CoverLetter; targetCompany: string }> = ({
  resume,
  coverLetter,
  targetCompany,
}) => (
  <article className="resume-container continuous flex flex-col text-slate-900">
    {/* Header with Contact Info */}
    <header className="mb-10">
      <h1 className="text-4xl font-display text-slate-900 leading-tight mb-1 uppercase tracking-tighter">
        {resume.personal.name}
      </h1>
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 mb-6">
        <span className="flex items-center gap-1.5">
          <Mail size={11} className="text-accent" /> {displayUrl(resume.personal.email)}
        </span>
        <span className="text-slate-200">|</span>
        <span className="flex items-center gap-1.5">
          <Phone size={11} className="text-accent" /> {resume.personal.phone}
        </span>
        <span className="text-slate-200">|</span>
        <span className="flex items-center gap-1.5">
          <MapPin size={11} className="text-accent" /> {resume.personal.residence}
        </span>
      </div>
      <div className="h-[2px] bg-slate-900 w-full"></div>
    </header>

    {/* Date and Recipient Info */}
    <div className="mb-10 space-y-6">
      <p className="text-sm text-slate-700 font-medium">{coverLetter.date}</p>
      
      {(coverLetter.recipientName || coverLetter.recipientTitle || targetCompany || coverLetter.companyAddress) && (
        <div className="text-sm text-slate-700 space-y-0.5">
          {coverLetter.recipientName && <p className="font-bold">{coverLetter.recipientName}</p>}
          {coverLetter.recipientTitle && <p>{coverLetter.recipientTitle}</p>}
          {targetCompany && <p className="font-bold text-accent">{targetCompany}</p>}
          {coverLetter.companyAddress && <p>{coverLetter.companyAddress}</p>}
        </div>
      )}
    </div>

    {/* Letter Body */}
    <div className="flex-1 space-y-4 text-[14px] leading-relaxed text-slate-700">
      {coverLetter.body ? (
        coverLetter.body.split('\n').map((paragraph, idx) => (
          paragraph.trim() ? (
            <p key={idx} className="text-justify">{paragraph}</p>
          ) : (
            <div key={idx} className="h-4"></div>
          )
        ))
      ) : (
        <div className="text-slate-400 italic text-center py-20">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p>No cover letter content yet.</p>
          <p className="text-sm mt-2">Write it in the Cover letter tab.</p>
        </div>
      )}
    </div>

    {/* Footer with Website */}
    <div className="print-footer hidden mt-10 pt-6 border-t border-slate-100 flex justify-between items-end">
      <a 
        href={cleanUrl(resume.personal.website)} 
        target="_blank" 
        rel="noopener" 
        className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400 underline decoration-slate-200"
      >
        {displayUrl(resume.personal.website)}
      </a>
    </div>
  </article>
);

export default CoverLetterPreview;
