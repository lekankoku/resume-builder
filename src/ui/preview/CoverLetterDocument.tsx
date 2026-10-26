import React from 'react';
import { FileText, Mail, MapPin, Phone } from 'lucide-react';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { displayUrl } from '../../domain/resume/contactFormat';
import { Resume } from '../../domain/resume/Resume';

const CoverLetterDocument: React.FC<{ resume: Resume; coverLetter: CoverLetter; targetCompany: string }> = ({
  resume,
  coverLetter,
  targetCompany,
}) => (
  <article className="resume-container flex flex-col text-slate-900">
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

    {coverLetter.subject && <p className="mb-6 text-[14px] font-bold text-slate-900">{coverLetter.subject}</p>}

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

  </article>
);

export default CoverLetterDocument;
