import React from 'react';
import { CoverLetter } from '../../../domain/coverLetter/CoverLetter';
import TextField from '../components/TextField';

interface Props {
  coverLetter: CoverLetter;
  onFieldChange: (field: keyof CoverLetter, value: string) => void;
  targetCompany: string;
  onTargetCompanyChange: (value: string) => void;
}

const CoverLetterTab: React.FC<Props> = ({ coverLetter, onFieldChange, targetCompany, onTargetCompanyChange }) => (
  <div className="space-y-6">
    <div className="border-b pb-4">
      <h2 className="text-xl font-display text-slate-900">Cover Letter</h2>
      <p className="text-sm text-slate-500 mt-2">Create a professional cover letter to accompany your resume.</p>
    </div>
    <div className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="cover-letter-date" className="text-[10px] font-mono font-black uppercase text-slate-400">Date</label>
        <input
          id="cover-letter-date"
          type="text"
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
          value={coverLetter.date}
          onChange={(e) => onFieldChange('date', e.target.value)}
          placeholder="January 6, 2026"
        />
      </div>

      <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recipient Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="cover-letter-recipient-name" className="text-[10px] font-mono font-black uppercase text-slate-400">Recipient Name</label>
            <input
              id="cover-letter-recipient-name"
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
              value={coverLetter.recipientName}
              onChange={(e) => onFieldChange('recipientName', e.target.value)}
              placeholder="Hiring Manager or Name"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cover-letter-recipient-title" className="text-[10px] font-mono font-black uppercase text-slate-400">Recipient Title</label>
            <input
              id="cover-letter-recipient-title"
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
              value={coverLetter.recipientTitle}
              onChange={(e) => onFieldChange('recipientTitle', e.target.value)}
              placeholder="Senior Hiring Manager"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <label htmlFor="cover-letter-company" className="text-[10px] font-mono font-black uppercase text-slate-400">Company Name</label>
            <input
              id="cover-letter-company"
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
              value={targetCompany}
              onChange={(e) => onTargetCompanyChange(e.target.value)}
              placeholder="Company Inc."
            />
            <p className="text-[10px] text-slate-400 mt-1">
              💡 This is shared with your resume. Set it once in the Identity tab.
            </p>
          </div>
          <div className="space-y-1 col-span-2">
            <label htmlFor="cover-letter-address" className="text-[10px] font-mono font-black uppercase text-slate-400">Company Address</label>
            <input
              id="cover-letter-address"
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
              value={coverLetter.companyAddress}
              onChange={(e) => onFieldChange('companyAddress', e.target.value)}
              placeholder="City, Country"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="cover-letter-body" className="text-[10px] font-mono font-black uppercase text-slate-400">Letter Body</label>
        <p className="text-xs text-slate-500 mb-2">Paste or write your cover letter content here.</p>
        <textarea
          id="cover-letter-body"
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none min-h-[400px] leading-relaxed"
          value={coverLetter.body}
          onChange={(e) => onFieldChange('body', e.target.value)}
          placeholder="Dear [Recipient Name],&#10;&#10;I am writing to express my strong interest in the [Position] role at [Company]. With [X] years of experience in [field], I am confident that my skills and background make me an excellent fit for this position.&#10;&#10;Throughout my career, I have...&#10;&#10;I am excited about the opportunity to contribute to [Company]'s mission and would welcome the chance to discuss how my experience aligns with your team's needs.&#10;&#10;Thank you for your consideration.&#10;&#10;Sincerely,&#10;[Your Name]"
        />
      </div>
    </div>
  </div>
);

export default CoverLetterTab;
