import React from 'react';
import { Briefcase } from 'lucide-react';
import { coverLetterDocumentTitle, resumeDocumentTitle } from '../../../domain/resume/documentTitle';
import { Resume } from '../../../domain/resume/Resume';
import { ResumeActions } from '../../hooks/useResume';

interface Props {
  resume: Resume;
  actions: ResumeActions;
  targetCompany: string;
  onTargetCompanyChange: (value: string) => void;
}

const IdentityTab: React.FC<Props> = ({ resume, actions, targetCompany, onTargetCompanyChange }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-display text-slate-900 border-b pb-4">Identity Attributes</h2>

    <div className="p-6 bg-accent/5 border-2 border-accent/30 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase size={16} className="text-accent" />
        <h3 className="text-sm font-semibold text-slate-900">Target company</h3>
      </div>
      <p className="text-xs text-slate-600">
        Enter the company you're applying to. This will be added to the filename when you print your resume or cover letter.
      </p>
      <input
        aria-label="Target Company"
        className="w-full p-4 bg-white border-2 border-accent/30 rounded-lg text-base font-bold focus:ring-2 focus:ring-accent outline-none"
        value={targetCompany}
        onChange={(e) => onTargetCompanyChange(e.target.value)}
        placeholder="e.g., Google, Microsoft, Apple..."
      />
      {targetCompany && (
        <div className="text-xs text-slate-500 space-y-1 pt-2">
          <p>CV file name: <span className="font-medium text-accent">{resumeDocumentTitle(resume.personal, targetCompany)}</span></p>
          <p>Cover letter file name: <span className="font-medium text-accent">{coverLetterDocumentTitle(resume.personal, targetCompany)}</span></p>
        </div>
      )}
    </div>

    <div className="space-y-1">
      <label htmlFor="personal-title" className="text-sm font-medium text-slate-700">Title</label>
      <input
        id="personal-title"
        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
        value={resume.personal.title}
        onChange={(e) => actions.updatePersonal('title', e.target.value)}
        placeholder="e.g., Senior Backend Engineer"
      />
      <p className="text-xs text-slate-500">Your name and contact details are set once in Settings.</p>
    </div>
  </div>
);

export default IdentityTab;
