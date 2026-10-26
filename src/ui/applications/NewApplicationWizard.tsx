import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, FileJson, FilePlus, Plus, X } from 'lucide-react';
import { Navigate } from 'react-router';
import { resumeFromJson } from '../../application/importResumeFromJson';
import { AiClient, ResumeRepository } from '../../application/ports/repositories';
import { ApplicationDraft, CvStart, WizardStep } from '../../domain/application/ApplicationDraft';
import { initialStage } from '../../domain/application/stages';
import { SuggestionSet } from '../../domain/application/suggestions';
import { RememberedAnswer } from '../../domain/candidate/CandidateFacts';
import {
  ApplicationDetails,
  CvSource,
  createBlankCv,
  JobApplication,
  validateDetails,
} from '../../domain/application/JobApplication';
import { CoverLetter, updateCoverLetterField } from '../../domain/coverLetter/CoverLetter';
import { Profile, Resume } from '../../domain/resume/Resume';
import { applyProfile } from '../../domain/resume/resumeOperations';
import { EditorSection, TABS } from '../editor/EditorView';
import { ResumeActions, useResume } from '../hooks/useResume';
import CoverLetterDocument from '../preview/CoverLetterDocument';
import LivePreview from '../preview/LivePreview';
import ResumeDocument from '../preview/ResumeDocument';
import PageHeader from '../shell/PageHeader';
import { buttonClass, DetailFields, inputClass, labelClass, primaryButtonClass } from './ApplicationsView';
import { PreviewWithSuggestions, SuggestionContext } from './SuggestionsPanel';

interface Props {
  applications: JobApplication[];
  stages: string[];
  profile: Profile;
  jobBank: string;
  ai: AiClient;
  draft?: ApplicationDraft;
  initialDetails?: Partial<ApplicationDetails>;
  stepId: WizardStep;
  onStepChange: (draftId: string, stepId: WizardStep) => void;
  onSaveDraft: (draft: ApplicationDraft) => void;
  onRememberAnswers: (answers: RememberedAnswer[]) => void;
  onCreate: (details: ApplicationDetails, cv: CvSource, draftId: string | null) => void;
  onCancel: () => void;
}

const CV_SECTIONS = TABS.filter((tab) => tab.id !== 'json');
export const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'cv', label: 'CV' },
  { id: 'review', label: 'Review' },
  { id: 'confirm', label: 'Confirm' },
];
const CV_STEP = STEPS.findIndex((s) => s.id === 'cv');

const emptyDetails = (): ApplicationDetails => ({
  company: '',
  role: '',
  postingUrl: '',
  appliedOn: new Date().toISOString().slice(0, 10),
  notes: '',
});

const applicationLabel = (application: JobApplication) =>
  [application.company, application.role].filter(Boolean).join(' — ');

const jsonErrorOf = (json: string): string | null => {
  try {
    resumeFromJson(json);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};

const NewApplicationWizard: React.FC<Props> = ({
  applications,
  stages,
  profile,
  jobBank,
  ai,
  draft,
  initialDetails,
  stepId,
  onStepChange,
  onSaveDraft,
  onRememberAnswers,
  onCreate,
  onCancel,
}) => {
  const [details, setDetails] = useState(() => draft?.details ?? { ...emptyDetails(), ...initialDetails });
  const [cvStart, setCvStart] = useState<CvStart>(draft?.cvStart ?? 'new');
  const [sourceId, setSourceId] = useState(draft?.sourceId ?? applications[0]?.id ?? '');
  const [jsonInput, setJsonInput] = useState(draft?.jsonInput ?? '');
  const [cvKey, setCvKey] = useState<string | null>(draft?.cvKey ?? null);
  const [resumeRepository] = useState<ResumeRepository>(() => ({
    load: () => draft?.resume ?? createBlankCv(new Date()).resume,
    save: () => {},
  }));
  const { resume, setResume, actions } = useResume(resumeRepository);
  const [coverLetter, setCoverLetter] = useState<CoverLetter>(() => draft?.coverLetter ?? createBlankCv(new Date()).coverLetter);
  const [suggestions, setSuggestions] = useState<SuggestionSet | null>(draft?.suggestions ?? null);

  const step = STEPS.findIndex((s) => s.id === stepId);
  const sourceApplication = applications.find((a) => a.id === sourceId);
  const cvLabel =
    cvStart === 'reuse' && sourceApplication
      ? `Copy of ${applicationLabel(sourceApplication)}`
      : cvStart === 'json'
        ? 'Imported from JSON'
        : 'New CV';
  const jsonError = cvStart === 'json' && jsonInput.trim() ? jsonErrorOf(jsonInput) : null;
  const cvChosen =
    cvStart === 'new' ||
    (cvStart === 'reuse' && !!sourceApplication) ||
    (cvStart === 'json' && !!jsonInput.trim() && !jsonError);
  const problems = validateDetails(details);
  const chosenKey =
    cvStart === 'reuse'
      ? sourceId
      : cvStart === 'json'
        ? `json:${jsonInput}`
        : 'new';

  const isDone = (id: WizardStep) =>
    (id === 'details' && problems.length === 0) ||
    (id === 'cv' && cvChosen) ||
    (id === 'review' && chosenKey === cvKey);
  const canReach = (index: number) => (draft || index <= CV_STEP) && STEPS.slice(0, index).every((s) => isDone(s.id));
  const firstOpenStep = STEPS.findIndex((s) => !isDone(s.id));

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!draft) return;
    onSaveDraft({
      id: draft.id,
      updatedAt: new Date().toISOString(),
      stepId,
      details,
      cvStart,
      sourceId,
      jsonInput,
      cvKey,
      resume,
      coverLetter,
      suggestions,
    });
  }, [stepId, details, cvStart, sourceId, jsonInput, cvKey, resume, coverLetter, suggestions]);

  if (draft && step > firstOpenStep) return <Navigate to={`/drafts/${draft.id}/${STEPS[firstOpenStep].id}`} replace />;

  const startDraft = () => {
    if (chosenKey === cvKey) return;
    const cv = cvStart === 'reuse' && sourceApplication ? sourceApplication : createBlankCv(new Date());
    setResume(cvStart === 'json' ? resumeFromJson(jsonInput) : structuredClone(cv.resume));
    setCoverLetter(structuredClone(cv.coverLetter));
    setSuggestions(null);
    setCvKey(chosenKey);
  };

  const goTo = (index: number) => {
    const target = STEPS[index].id;
    if (!draft) {
      const id = crypto.randomUUID();
      onSaveDraft({
        id,
        updatedAt: new Date().toISOString(),
        stepId: target,
        details,
        cvStart,
        sourceId,
        jsonInput,
        cvKey,
        resume,
        coverLetter,
        suggestions,
      });
      onStepChange(id, target);
      return;
    }
    if (index > CV_STEP) startDraft();
    onStepChange(draft.id, target);
  };

  const displayedResume = applyProfile(resume, profile);

  return (
    <div className="max-w-[1600px]">
      <PageHeader
        title="New application"
        subtitle={`Step ${step + 1} of ${STEPS.length} — ${STEPS[step].label}`}
        actions={
          <button onClick={onCancel} className={buttonClass}>
            {draft ? 'Save & exit' : 'Cancel'} <X size={14} />
          </button>
        }
      />

      <ol aria-label="Steps" className="flex gap-2 mb-6">
        {STEPS.map((s, index) => (
          <li key={s.id} className="flex-1">
            <button
              onClick={() => goTo(index)}
              disabled={index === step || !canReach(index)}
              aria-current={index === step ? 'step' : undefined}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all disabled:cursor-default ${
                index === step
                  ? 'bg-accent text-white font-semibold'
                  : isDone(s.id)
                    ? 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
                    : canReach(index)
                      ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'bg-white border border-slate-200 text-slate-300'
              }`}
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs ${
                  index === step ? 'bg-white/20' : isDone(s.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'
                }`}
              >
                {isDone(s.id) && index !== step ? <Check size={12} /> : index + 1}
              </span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      {stepId === 'details' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-4xl">
          <DetailFields details={details} onChange={(field, value) => setDetails((d) => ({ ...d, [field]: value }))} />
          {problems.length > 0 && (
            <ul className="text-xs text-red-500 space-y-1">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {stepId === 'cv' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 max-w-4xl">
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <legend className={`${labelClass} mb-2`}>CV for this application</legend>
            <CvStartOption
              checked={cvStart === 'new'}
              onSelect={() => setCvStart('new')}
              icon={<FilePlus size={18} />}
              title="Start a new CV"
              description="Begin with an empty CV and cover letter."
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
            <CvStartOption
              checked={cvStart === 'json'}
              onSelect={() => setCvStart('json')}
              icon={<FileJson size={18} />}
              title="Import CV from JSON"
              description="Paste CV JSON to fill the sections. The cover letter starts empty."
            />
          </fieldset>
          {cvStart === 'json' && (
            <div className="space-y-2">
              <textarea
                aria-label="CV JSON"
                className="w-full p-4 bg-slate-50 text-slate-800 font-mono text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent outline-none min-h-[300px]"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                spellCheck={false}
              />
              {jsonError && (
                <div className="text-red-500 text-xs font-mono bg-red-50 p-3 rounded-lg border border-red-100">{jsonError}</div>
              )}
            </div>
          )}
          {cvKey !== null && (
            <p className="text-xs text-slate-500">Choosing a different CV discards the edits and checks you made in Review.</p>
          )}
        </section>
      )}

      {stepId === 'review' && (
        <ReviewStep
          resume={displayedResume}
          actions={actions}
          coverLetter={coverLetter}
          onCoverLetterFieldChange={(field, value) => setCoverLetter((letter) => updateCoverLetterField(letter, field, value))}
          company={details.company}
          onCompanyChange={(company) => setDetails((d) => ({ ...d, company }))}
          suggestionContext={{
            job: details,
            state: { resume, coverLetter, suggestions },
            ai,
            jobBank,
            jobDescriptionAt: { label: 'the Details step', to: draft ? `/drafts/${draft.id}/details` : '.' },
            onUpdate: (change) => {
              const next = change({ resume, coverLetter, suggestions });
              setResume(next.resume);
              setCoverLetter(next.coverLetter);
              setSuggestions(next.suggestions);
            },
            onRememberAnswers,
          }}
        />
      )}

      {stepId === 'confirm' && (
        <ConfirmStep
          items={[
            ['Company', details.company],
            ['Role', details.role],
            ['Job posting URL', details.postingUrl.trim() || 'None'],
            ['Date applied', details.appliedOn],
            ['Notes', details.notes.trim() || 'None'],
            ['Job description', details.jobDescription?.trim() || 'None'],
            ['CV', cvLabel],
          ]}
          problems={problems}
          stage={initialStage(stages)}
          onCreate={() => onCreate(details, { resume, coverLetter, suggestions }, draft?.id ?? null)}
        />
      )}

      <div className="flex justify-between mt-6 max-w-4xl">
        <button onClick={() => goTo(step - 1)} disabled={step === 0} className={`${buttonClass} disabled:opacity-40`}>
          <ChevronLeft size={14} /> Back
        </button>
        {stepId !== 'confirm' && (
          <button onClick={() => goTo(step + 1)} disabled={!isDone(stepId)} className={`${primaryButtonClass} disabled:opacity-40`}>
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
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
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon} {title}
        </span>
        <span className="block text-xs text-slate-500 mt-1">{description}</span>
      </span>
    </label>
    {children}
  </div>
);

const ReviewStep: React.FC<{
  resume: Resume;
  actions: ResumeActions;
  coverLetter: CoverLetter;
  onCoverLetterFieldChange: (field: keyof CoverLetter, value: string) => void;
  company: string;
  onCompanyChange: (company: string) => void;
  suggestionContext: SuggestionContext;
}> = ({
  resume,
  actions,
  coverLetter,
  onCoverLetterFieldChange,
  company,
  onCompanyChange,
  suggestionContext,
}) => {
  const [open, setOpen] = useState<string | null>(CV_SECTIONS[0].id);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div className="space-y-3 min-w-0">
        <p className="text-sm text-slate-600">Open any section to change it. You can keep editing after the application is created.</p>
        {CV_SECTIONS.map((section) => {
          const isOpen = open === section.id;
          return (
            <section key={section.id} className="bg-white rounded-2xl border border-slate-200">
              <h2>
                <button
                  onClick={() => setOpen(isOpen ? null : section.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left"
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <section.icon size={12} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-900">{section.label}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </h2>
              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                  <EditorSection
                    section={section.id}
                    resume={resume}
                    actions={actions}
                    coverLetter={coverLetter}
                    onCoverLetterFieldChange={onCoverLetterFieldChange}
                    targetCompany={company}
                    onTargetCompanyChange={onCompanyChange}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="hidden xl:block min-w-0">
        <PreviewWithSuggestions
          {...suggestionContext}
          scope={open === 'coverLetter' ? 'coverLetter' : 'cv'}
          preview={
            open === 'coverLetter' ? (
              <LivePreview title="Cover letter preview">
                <CoverLetterDocument resume={resume} coverLetter={coverLetter} targetCompany={company} />
              </LivePreview>
            ) : (
              <LivePreview title="CV preview">
                <ResumeDocument resume={resume} />
              </LivePreview>
            )
          }
        />
      </div>
    </div>
  );
};

const ConfirmStep: React.FC<{
  items: [string, string][];
  problems: string[];
  stage: string;
  onCreate: () => void;
}> = ({ items, problems, stage, onCreate }) => {
  const canCreate = problems.length === 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 max-w-4xl">
      <dl className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="px-4 py-3 rounded-lg border border-slate-200">
            <dt className={labelClass}>{label}</dt>
            <dd className="text-sm text-slate-900 whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>
      {problems.length > 0 && (
        <ul className="text-xs text-red-500 space-y-1">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      <p className="text-sm text-slate-600">
        The application will be added to <span className="font-semibold">{stage}</span>.
      </p>
      <button onClick={onCreate} disabled={!canCreate} className={`${primaryButtonClass} disabled:opacity-40`}>
        Create application <Plus size={14} />
      </button>
    </section>
  );
};

export default NewApplicationWizard;
