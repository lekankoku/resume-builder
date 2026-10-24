import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Copy, Eye, FilePlus, FileText, Plus, X } from 'lucide-react';
import { ResumeRepository } from '../../application/ports/repositories';
import {
  ApplicationDetails,
  CvSource,
  createBlankCv,
  JobApplication,
  validateDetails,
} from '../../domain/application/JobApplication';
import { CoverLetter, updateCoverLetterField } from '../../domain/coverLetter/CoverLetter';
import { EditorSection, TABS } from '../editor/EditorView';
import { useResume } from '../hooks/useResume';
import CoverLetterPreview from '../preview/CoverLetterPreview';
import ResumePreview, { PrintVariant } from '../preview/ResumePreview';
import { buttonClass, DetailFields, inputClass, labelClass, primaryButtonClass } from './ApplicationsView';

interface Props {
  applications: JobApplication[];
  stages: string[];
  onCreate: (details: ApplicationDetails, cv: CvSource, stage: string) => void;
  onCancel: () => void;
}

type CvStart = 'new' | 'reuse';

const CV_SECTIONS = TABS.filter((tab) => tab.id !== 'json');
const STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'cv-start', label: 'CV' },
  ...CV_SECTIONS,
  { id: 'review', label: 'Review' },
];

const draftRepository: ResumeRepository = { load: () => createBlankCv(new Date()).resume, save: () => {} };

const emptyDetails = (): ApplicationDetails => ({
  company: '',
  role: '',
  postingUrl: '',
  appliedOn: new Date().toISOString().slice(0, 10),
  notes: '',
});

const applicationLabel = (application: JobApplication) =>
  [application.company, application.role].filter(Boolean).join(' — ');

const NewApplicationWizard: React.FC<Props> = ({ applications, stages, onCreate, onCancel }) => {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(emptyDetails);
  const [stage, setStage] = useState(stages[0] ?? '');
  const [cvStart, setCvStart] = useState<CvStart>('new');
  const [sourceId, setSourceId] = useState(applications[0]?.id ?? '');
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const { resume, setResume, actions } = useResume(draftRepository);
  const [coverLetter, setCoverLetter] = useState<CoverLetter>(() => createBlankCv(new Date()).coverLetter);
  const [verifiedSections, setVerifiedSections] = useState<string[]>([]);
  const [reviewChecks, setReviewChecks] = useState<string[]>([]);
  const [viewed, setViewed] = useState({ resume: false, coverLetter: false });
  const [previewing, setPreviewing] = useState<'resume' | 'cover-letter' | null>(null);
  const [printVariant, setPrintVariant] = useState<PrintVariant>('continuous');

  const current = STEPS[step];
  const sourceApplication = applications.find((a) => a.id === sourceId);
  const cvLabel = cvStart === 'reuse' && sourceApplication ? `Copy of ${applicationLabel(sourceApplication)}` : 'New CV';
  const problems = validateDetails(details);
  const isCvSection = CV_SECTIONS.some((section) => section.id === current.id);

  const canAdvance =
    (current.id === 'details' && problems.length === 0) ||
    (current.id === 'cv-start' && stage !== '' && (cvStart === 'new' || !!sourceApplication)) ||
    (isCvSection && verifiedSections.includes(current.id));

  const startDraft = () => {
    const key = cvStart === 'reuse' ? sourceId : 'new';
    if (key === draftKey) return;
    const cv = cvStart === 'reuse' && sourceApplication ? sourceApplication : createBlankCv(new Date());
    setResume(structuredClone(cv.resume));
    setCoverLetter(structuredClone(cv.coverLetter));
    setVerifiedSections([]);
    setDraftKey(key);
  };

  const next = () => {
    if (current.id === 'cv-start') startDraft();
    setStep((s) => s + 1);
  };

  const back = () => {
    if (current.id === 'review') {
      setReviewChecks([]);
      setViewed({ resume: false, coverLetter: false });
    }
    setStep((s) => s - 1);
  };

  const toggle = (list: string[], item: string, on: boolean) => (on ? [...list, item] : list.filter((i) => i !== item));

  const preview = (mode: 'resume' | 'cover-letter') => {
    setViewed((v) => (mode === 'resume' ? { ...v, resume: true } : { ...v, coverLetter: true }));
    setPreviewing(mode);
  };

  if (previewing === 'resume') {
    return (
      <ResumePreview
        resume={resume}
        targetCompany={details.company}
        printVariant={printVariant}
        onPrintVariantChange={setPrintVariant}
        onBackToEditor={() => setPreviewing(null)}
        onShowCoverLetter={() => preview('cover-letter')}
      />
    );
  }

  if (previewing === 'cover-letter') {
    return (
      <CoverLetterPreview
        resume={resume}
        coverLetter={coverLetter}
        targetCompany={details.company}
        onBackToEditor={() => setPreviewing(null)}
        onShowResume={() => preview('resume')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-6 font-sans">
      <header className="max-w-6xl w-full mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-display text-slate-900 leading-tight">New Application</h1>
          <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
            Step {step + 1} of {STEPS.length} — {current.label}
          </p>
        </div>
        <button onClick={onCancel} className={buttonClass}>
          Cancel <X size={14} />
        </button>
      </header>

      <ol className="max-w-6xl w-full mb-6 flex flex-wrap gap-2">
        {STEPS.map((s, index) => (
          <li
            key={s.id}
            aria-current={index === step ? 'step' : undefined}
            className={`text-[10px] font-mono uppercase tracking-widest px-3 py-2 rounded-lg ${
              index === step ? 'bg-accent text-white' : index < step ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200'
            }`}
          >
            {s.label}
          </li>
        ))}
      </ol>

      <main className="max-w-6xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        {current.id === 'details' && (
          <>
            <DetailFields details={details} onChange={(field, value) => setDetails((d) => ({ ...d, [field]: value }))} />
            {problems.length > 0 && (
              <ul className="text-xs text-red-500 space-y-1">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            )}
          </>
        )}

        {current.id === 'cv-start' && (
          <div className="space-y-6">
            <div className="space-y-1 max-w-sm">
              <label htmlFor="new-stage" className={labelClass}>Stage</label>
              <select id="new-stage" className={inputClass} value={stage} onChange={(e) => setStage(e.target.value)}>
                {stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <legend className={`${labelClass} mb-2`}>CV for this application</legend>
              <CvStartOption
                checked={cvStart === 'new'}
                onSelect={() => setCvStart('new')}
                icon={<FilePlus size={18} />}
                title="Start a new CV"
                description="Begin with an empty CV and cover letter and fill in each section."
              />
              <CvStartOption
                checked={cvStart === 'reuse'}
                disabled={applications.length === 0}
                onSelect={() => setCvStart('reuse')}
                icon={<Copy size={18} />}
                title="Reuse a CV from an application"
                description={
                  applications.length === 0
                    ? 'No applications yet to reuse a CV from.'
                    : 'Start from a copy. The original application is not changed.'
                }
              >
                {cvStart === 'reuse' && (
                  <select
                    aria-label="Application to reuse CV from"
                    className={`${inputClass} mt-3`}
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                  >
                    {applications.map((a) => (
                      <option key={a.id} value={a.id}>{applicationLabel(a)}</option>
                    ))}
                  </select>
                )}
              </CvStartOption>
            </fieldset>
            {draftKey !== null && (
              <p className="text-xs text-slate-500">Choosing a different CV discards the edits and checks you made in the CV steps.</p>
            )}
          </div>
        )}

        {isCvSection && (
          <>
            <EditorSection
              section={current.id}
              resume={resume}
              actions={actions}
              coverLetter={coverLetter}
              onCoverLetterFieldChange={(field, value) => setCoverLetter((letter) => updateCoverLetterField(letter, field, value))}
              targetCompany={details.company}
              onTargetCompanyChange={(company) => setDetails((d) => ({ ...d, company }))}
            />
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-sm font-bold text-slate-900">
              <input
                type="checkbox"
                checked={verifiedSections.includes(current.id)}
                onChange={(e) => setVerifiedSections((v) => toggle(v, current.id, e.target.checked))}
              />
              I have checked that this {current.label} section is correct
            </label>
          </>
        )}

        {current.id === 'review' && (
          <ReviewStep
            items={[
              ['Company', details.company],
              ['Role', details.role],
              ['Job posting URL', details.postingUrl.trim() || 'None'],
              ['Date applied', details.appliedOn],
              ['Notes', details.notes.trim() || 'None'],
              ['Stage', stage],
              ['CV', cvLabel],
            ]}
            problems={problems}
            checked={reviewChecks}
            onCheck={(label, on) => setReviewChecks((c) => toggle(c, label, on))}
            viewed={viewed}
            onPreview={preview}
            onCreate={() => onCreate(details, { resume, coverLetter }, stage)}
          />
        )}

        <div className="flex justify-between border-t pt-6">
          <button onClick={back} disabled={step === 0} className={`${buttonClass} disabled:opacity-40`}>
            <ChevronLeft size={14} /> Back
          </button>
          {current.id !== 'review' && (
            <button onClick={next} disabled={!canAdvance} className={`${primaryButtonClass} disabled:opacity-40`}>
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

const CvStartOption: React.FC<{
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ checked, disabled, onSelect, icon, title, description, children }) => (
  <div
    className={`p-5 rounded-xl border-2 transition-all ${
      checked ? 'border-accent bg-accent/5' : 'border-slate-200'
    } ${disabled ? 'opacity-50' : ''}`}
  >
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="radio" name="cv-start" className="mt-1" checked={checked} disabled={disabled} onChange={onSelect} />
      <span>
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
          {icon} {title}
        </span>
        <span className="block text-xs text-slate-500 mt-1">{description}</span>
      </span>
    </label>
    {children}
  </div>
);

const ReviewStep: React.FC<{
  items: [string, string][];
  problems: string[];
  checked: string[];
  onCheck: (label: string, checked: boolean) => void;
  viewed: { resume: boolean; coverLetter: boolean };
  onPreview: (mode: 'resume' | 'cover-letter') => void;
  onCreate: () => void;
}> = ({ items, problems, checked, onCheck, viewed, onPreview, onCreate }) => {
  const canCreate =
    viewed.resume && viewed.coverLetter && problems.length === 0 && items.every(([label]) => checked.includes(label));

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">Open both finished documents and tick each detail once you have checked it.</p>
      <div className="flex gap-3">
        <button onClick={() => onPreview('resume')} className={buttonClass}>
          Preview CV {viewed.resume ? <Check size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={() => onPreview('cover-letter')} className={buttonClass}>
          Preview cover letter {viewed.coverLetter ? <Check size={14} /> : <FileText size={14} />}
        </button>
      </div>
      <ul className="space-y-2">
        {items.map(([label, value]) => (
          <li key={label}>
            <label className="flex items-start gap-3 px-4 py-3 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                className="mt-1"
                checked={checked.includes(label)}
                onChange={(e) => onCheck(label, e.target.checked)}
              />
              <span>
                <span className={`block ${labelClass}`}>{label}</span>
                <span className="block text-sm text-slate-900 whitespace-pre-wrap">{value}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {problems.length > 0 && (
        <ul className="text-xs text-red-500 space-y-1">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      <button onClick={onCreate} disabled={!canCreate} className={`${primaryButtonClass} disabled:opacity-40`}>
        Create Application <Plus size={14} />
      </button>
    </div>
  );
};

export default NewApplicationWizard;
