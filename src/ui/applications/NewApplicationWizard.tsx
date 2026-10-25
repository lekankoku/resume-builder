import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, FileJson, FilePlus, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { Link, Navigate } from 'react-router';
import { resumeFromJson } from '../../application/importResumeFromJson';
import { AiClient, ResumeRepository } from '../../application/ports/repositories';
import { ApplicationDraft, CvStart, WizardStep } from '../../domain/application/ApplicationDraft';
import {
  coverLetterFromGenerated,
  formatUsd,
  Generation,
  generationBlocker,
  resumeFromGeneratedCv,
  WrittenCv,
} from '../../domain/application/cvGeneration';
import { initialStage } from '../../domain/application/stages';
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
import { EditorSection, OPTIONAL_SECTIONS, TABS } from '../editor/EditorView';
import { ResumeActions, useResume } from '../hooks/useResume';
import CoverLetterDocument from '../preview/CoverLetterDocument';
import LivePreview from '../preview/LivePreview';
import ResumeDocument from '../preview/ResumeDocument';
import PageHeader from '../shell/PageHeader';
import { buttonClass, DetailFields, inputClass, labelClass, primaryButtonClass } from './ApplicationsView';

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
  onCreate: (details: ApplicationDetails, cv: CvSource, draftId: string | null) => void;
  onCancel: () => void;
}

const CV_SECTIONS = TABS.filter((tab) => tab.id !== 'json');
const REQUIRED_SECTIONS = CV_SECTIONS.filter((tab) => !OPTIONAL_SECTIONS.includes(tab.id));
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
  onCreate,
  onCancel,
}) => {
  const [details, setDetails] = useState(() => draft?.details ?? { ...emptyDetails(), ...initialDetails });
  const [cvStart, setCvStart] = useState<CvStart>(draft?.cvStart ?? 'new');
  const [sourceId, setSourceId] = useState(draft?.sourceId ?? applications[0]?.id ?? '');
  const [jsonInput, setJsonInput] = useState(draft?.jsonInput ?? '');
  const [cvKey, setCvKey] = useState<string | null>(draft?.cvKey ?? null);
  const [generated, setGenerated] = useState<Generation | null>(draft?.generated ?? null);
  const [generating, setGenerating] = useState<'analysing' | 'writing' | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [resumeRepository] = useState<ResumeRepository>(() => ({
    load: () => draft?.resume ?? createBlankCv(new Date()).resume,
    save: () => {},
  }));
  const { resume, setResume, actions } = useResume(resumeRepository);
  const [coverLetter, setCoverLetter] = useState<CoverLetter>(() => draft?.coverLetter ?? createBlankCv(new Date()).coverLetter);
  const [verifiedSections, setVerifiedSections] = useState<string[]>(draft?.verifiedSections ?? []);

  const step = STEPS.findIndex((s) => s.id === stepId);
  const sourceApplication = applications.find((a) => a.id === sourceId);
  const cvLabel =
    cvStart === 'reuse' && sourceApplication
      ? `Copy of ${applicationLabel(sourceApplication)}`
      : cvStart === 'json'
        ? 'Imported from JSON'
        : cvStart === 'generate'
          ? 'Generated from job bank'
          : 'New CV';
  const jsonError = cvStart === 'json' && jsonInput.trim() ? jsonErrorOf(jsonInput) : null;
  const cvChosen =
    cvStart === 'new' ||
    (cvStart === 'reuse' && !!sourceApplication) ||
    (cvStart === 'json' && !!jsonInput.trim() && !jsonError) ||
    (cvStart === 'generate' && !!generated?.written);
  const generateBlocker = generationBlocker(details, jobBank);
  const problems = validateDetails(details);
  const chosenKey =
    cvStart === 'reuse'
      ? sourceId
      : cvStart === 'json'
        ? `json:${jsonInput}`
        : cvStart === 'generate'
          ? `generate:${generated?.written?.writtenAt ?? ''}`
          : 'new';

  const isDone = (id: WizardStep) =>
    (id === 'details' && problems.length === 0) ||
    (id === 'cv' && cvChosen) ||
    (id === 'review' && chosenKey === cvKey && REQUIRED_SECTIONS.every((section) => verifiedSections.includes(section.id)));
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
      verifiedSections,
      generated,
    });
  }, [stepId, details, cvStart, sourceId, jsonInput, cvKey, resume, coverLetter, verifiedSections, generated]);

  if (draft && step > firstOpenStep) return <Navigate to={`/drafts/${draft.id}/${STEPS[firstOpenStep].id}`} replace />;

  const startDraft = () => {
    if (chosenKey === cvKey) return;
    const cv = cvStart === 'reuse' && sourceApplication ? sourceApplication : createBlankCv(new Date());
    const written = cvStart === 'generate' ? generated?.written : null;
    setResume(
      cvStart === 'json' ? resumeFromJson(jsonInput) : written ? resumeFromGeneratedCv(written.cv) : structuredClone(cv.resume),
    );
    setCoverLetter(
      written?.coverLetter ? coverLetterFromGenerated(written.coverLetter, cv.coverLetter) : structuredClone(cv.coverLetter),
    );
    setVerifiedSections([]);
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
        verifiedSections,
        generated,
      });
      onStepChange(id, target);
      return;
    }
    if (index > CV_STEP) startDraft();
    onStepChange(draft.id, target);
  };

  const job = { company: details.company, role: details.role, jobDescription: details.jobDescription ?? '' };

  const run = async (step: 'analysing' | 'writing', work: () => Promise<void>) => {
    setGenerating(step);
    setGenerateError(null);
    try {
      await work();
    } catch (e) {
      setGenerateError((e as Error).message);
    } finally {
      setGenerating(null);
    }
  };

  const analyse = () =>
    run('analysing', async () => {
      const { analysis, usage } = await ai.analyseJob(job);
      setGenerated({
        analysis,
        analysisUsage: usage,
        analysedAt: new Date().toISOString(),
        answers: analysis.questions.map(({ field }) => ({ field, answer: '' })),
        coverLetterRequested: generated?.coverLetterRequested ?? false,
        motivation: generated?.motivation ?? '',
        written: null,
      });
    });

  const write = (generation: Generation) =>
    run('writing', async () => {
      const written = await ai.writeCv({
        ...job,
        analysis: generation.analysis,
        answers: generation.answers.filter(({ answer }) => answer.trim()),
        coverLetter: generation.coverLetterRequested,
        motivation: generation.coverLetterRequested ? generation.motivation : '',
      });
      setGenerated({ ...generation, written: { ...written, writtenAt: new Date().toISOString() } });
    });

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
            <CvStartOption
              checked={cvStart === 'generate'}
              disabled={!!generateBlocker}
              onSelect={() => setCvStart('generate')}
              icon={<Sparkles size={18} />}
              title="Generate from job bank"
              description={
                generateBlocker ??
                'Analyse the job against your job bank, answer any open questions, then write a tailored CV and, if you ask for one, a cover letter.'
              }
            >
              {!jobBank.trim() && (
                <Link to="/settings/job-bank" className="inline-block mt-3 text-xs font-semibold text-accent hover:underline">
                  Open job bank settings
                </Link>
              )}
            </CvStartOption>
          </fieldset>
          {cvStart === 'generate' && !generateBlocker && (
            <div className="space-y-4">
              <button onClick={analyse} disabled={!!generating} className={`${generated ? buttonClass : primaryButtonClass} disabled:opacity-40`}>
                {generating === 'analysing' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generating === 'analysing' ? 'Analysing… this can take a minute' : generated ? 'Analyse again' : 'Analyse job'}
              </button>
              {generated && (
                <AnalysisPanel
                  generation={generated}
                  onChange={setGenerated}
                  onWrite={() => write(generated)}
                  writing={generating === 'writing'}
                  disabled={!!generating}
                />
              )}
              {generateError && (
                <p role="alert" className="text-red-500 text-xs bg-red-50 p-3 rounded-lg border border-red-100">{generateError}</p>
              )}
            </div>
          )}
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
          verifiedSections={verifiedSections}
          onVerifiedSectionsChange={setVerifiedSections}
          audit={cvKey?.startsWith('generate:') && generated?.written ? generated.written : null}
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
            ['CV', `${cvLabel} · all ${REQUIRED_SECTIONS.length} required sections checked`],
          ]}
          problems={problems}
          stage={initialStage(stages)}
          onCreate={() => onCreate(details, { resume, coverLetter }, draft?.id ?? null)}
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
  verifiedSections: string[];
  onVerifiedSectionsChange: (sections: string[]) => void;
  audit: WrittenCv | null;
}> = ({
  resume,
  actions,
  coverLetter,
  onCoverLetterFieldChange,
  company,
  onCompanyChange,
  verifiedSections,
  onVerifiedSectionsChange,
  audit,
}) => {
  const [open, setOpen] = useState<string | null>(
    () => REQUIRED_SECTIONS.find((section) => !verifiedSections.includes(section.id))?.id ?? null,
  );

  const verify = (id: string, verified: boolean) => {
    const next = verified ? [...verifiedSections, id] : verifiedSections.filter((s) => s !== id);
    onVerifiedSectionsChange(next);
    if (verified) setOpen(REQUIRED_SECTIONS.find((section) => !next.includes(section.id))?.id ?? null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div className="space-y-3 min-w-0">
        <p className="text-sm text-slate-600">
          {REQUIRED_SECTIONS.filter((section) => verifiedSections.includes(section.id)).length} of {REQUIRED_SECTIONS.length} required
          sections checked. Open each section, fix anything that's wrong and mark it as correct. Volunteering and Leadership are optional.
        </p>
        {audit && <AuditPanel audit={audit} />}
        {CV_SECTIONS.map((section) => {
          const isOpen = open === section.id;
          const isVerified = verifiedSections.includes(section.id);
          return (
            <section key={section.id} className="bg-white rounded-2xl border border-slate-200">
              <h2>
                <button
                  onClick={() => setOpen(isOpen ? null : section.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isVerified ? <Check size={12} /> : <section.icon size={12} />}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-900">{section.label}</span>
                  <span className="text-xs text-slate-500">
                    {isVerified ? 'Checked' : OPTIONAL_SECTIONS.includes(section.id) ? 'Optional' : 'To check'}
                  </span>
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
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-sm font-semibold text-slate-900">
                    <input type="checkbox" checked={isVerified} onChange={(e) => verify(section.id, e.target.checked)} />
                    This {section.label} section is correct
                  </label>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="hidden xl:block min-w-0">
        {open === 'coverLetter' ? (
          <LivePreview title="Cover letter preview">
            <CoverLetterDocument resume={resume} coverLetter={coverLetter} targetCompany={company} />
          </LivePreview>
        ) : (
          <LivePreview title="CV preview">
            <ResumeDocument resume={resume} />
          </LivePreview>
        )}
      </div>
    </div>
  );
};

const AnalysisPanel: React.FC<{
  generation: Generation;
  onChange: (generation: Generation) => void;
  onWrite: () => void;
  writing: boolean;
  disabled: boolean;
}> = ({ generation, onChange, onWrite, writing, disabled }) => {
  const { analysis, answers, written } = generation;
  const setAnswer = (field: string, answer: string) =>
    onChange({ ...generation, answers: answers.map((a) => (a.field === field ? { ...a, answer } : a)) });

  return (
    <section aria-label="Job analysis" className="space-y-5 rounded-xl border border-slate-200 p-5 text-sm text-slate-800">
      <p className="text-xs text-slate-500">
        Analysed {new Date(generation.analysedAt).toLocaleString()} · estimated cost {formatUsd(generation.analysisUsage.costUsd)}
      </p>
      <div>
        <h3 className={labelClass}>Tagline</h3>
        <p>{analysis.tagline}</p>
        <p className="text-xs text-slate-500 mt-1">
          Header: {analysis.currentPosition.title} at {analysis.currentPosition.company} ·{' '}
          {analysis.layout === 'education-first' ? 'Education first' : 'Experience first'}
        </p>
      </div>
      <div>
        <h3 className={labelClass}>Skills the job asks for</h3>
        <ul className="space-y-2 mt-1">
          {analysis.skills.map((skill) => (
            <li key={skill.skill}>
              <span className="font-semibold">{skill.skill}</span> · {skill.status}
              {skill.origin === 'candidate' && ' · from your job bank'}
              {skill.keywords.length > 0 && (
                <span className="block text-xs text-slate-500">Keywords: {skill.keywords.map((k) => k.term).join(', ')}</span>
              )}
              {skill.evidence.map((e) => (
                <span key={e.source + e.quote} className="block text-xs text-slate-500">
                  {e.source}: “{e.quote}”
                </span>
              ))}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className={labelClass}>Roles</h3>
        <ul className="space-y-1 mt-1">
          {analysis.roles.map((role) => (
            <li key={role.company}>
              <span className="font-semibold">{role.company}</span> · {role.relevance} · {role.bulletBudget} bullets
              <span className="block text-xs text-slate-500">{role.reason}</span>
            </li>
          ))}
        </ul>
      </div>
      {analysis.titleAdjustments.length > 0 && (
        <div>
          <h3 className={labelClass}>Title adjustments</h3>
          <ul className="space-y-1 mt-1">
            {analysis.titleAdjustments.map((t) => (
              <li key={t.source}>
                {t.original} → {t.proposed}
                <span className="block text-xs text-slate-500">“{t.quote}”</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.questions.length > 0 && (
        <fieldset className="space-y-3">
          <legend className={labelClass}>Questions — answers are used as facts, leave blank to skip</legend>
          {analysis.questions.map((q) => (
            <label key={q.field} className="block space-y-1">
              <span className="block">{q.question}</span>
              <textarea
                className={inputClass}
                rows={2}
                value={answers.find((a) => a.field === q.field)?.answer ?? ''}
                onChange={(e) => setAnswer(q.field, e.target.value)}
              />
            </label>
          ))}
        </fieldset>
      )}
      <div className="space-y-2">
        <label className="flex items-center gap-2 font-semibold text-slate-900">
          <input
            type="checkbox"
            checked={generation.coverLetterRequested}
            onChange={(e) => onChange({ ...generation, coverLetterRequested: e.target.checked })}
          />
          Also write a cover letter
        </label>
        {generation.coverLetterRequested && (
          <label className="block space-y-1">
            <span className={labelClass}>Why this company and role (optional)</span>
            <textarea
              className={inputClass}
              rows={3}
              value={generation.motivation}
              onChange={(e) => onChange({ ...generation, motivation: e.target.value })}
            />
          </label>
        )}
      </div>
      <button onClick={onWrite} disabled={disabled} className={`${primaryButtonClass} disabled:opacity-40`}>
        {writing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {writing ? 'Writing… this can take a minute' : written ? 'Write again' : generation.coverLetterRequested ? 'Write CV and cover letter' : 'Write CV'}
      </button>
      {written && !writing && (
        <p className="text-xs text-slate-500">
          Written {new Date(written.writtenAt).toLocaleString()} · estimated cost {formatUsd(written.usage.costUsd)}
          {written.coverLetter ? ' · with cover letter' : ''}
        </p>
      )}
    </section>
  );
};

const AuditList: React.FC<{ heading: string; empty: string; items: { key: string; text: string; detail?: string }[] }> = ({
  heading,
  empty,
  items,
}) => (
  <div>
    <h3 className={labelClass}>{heading}</h3>
    {items.length === 0 ? (
      <p className="text-slate-500">{empty}</p>
    ) : (
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            <span className="block">{item.text}</span>
            {item.detail && <span className="block text-xs text-slate-500">{item.detail}</span>}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const AuditPanel: React.FC<{ audit: WrittenCv }> = ({ audit: { review, coverLetter } }) => {
  const claims = [...review.claimsToCheck, ...(coverLetter?.review.claimsToCheck ?? [])];
  const questions = [...review.questions, ...(coverLetter?.review.questions ?? [])];
  return (
    <details open className="bg-amber-50 rounded-2xl border border-amber-200 px-5 py-4 text-sm text-slate-800">
      <summary className="font-semibold text-slate-900 cursor-pointer">Check before sending</summary>
      <div className="mt-3 space-y-4">
        <AuditList
          heading="Gaps — job requirements your job bank doesn't support"
          empty="None found."
          items={review.gaps.map((gap) => ({ key: gap, text: gap }))}
        />
        <AuditList
          heading="Claims to double-check"
          empty="None flagged."
          items={claims.map((c) => ({ key: c.claim, text: c.claim, detail: `Source: ${c.source}` }))}
        />
        <AuditList
          heading="Adjusted job titles"
          empty="None."
          items={review.adjustedTitles.map((t) => ({ key: t.original, text: `${t.original} → ${t.used}` }))}
        />
        <AuditList
          heading="Job keywords not used"
          empty="All keywords used."
          items={review.keywordCoverage.unused.map((k) => ({
            key: k.term,
            text: k.term,
            detail: k.reason === 'gap' ? 'No evidence in your job bank' : 'Evidence exists but did not fit',
          }))}
        />
        <AuditList
          heading="Timeline gaps to be ready to explain"
          empty="None."
          items={review.timelineGaps.map((g) => ({
            key: g.from + g.to,
            text: `${g.from} – ${g.to}`,
            detail: g.cause === 'omitted' ? `Left out: ${g.detail}` : g.detail || 'Nothing in your job bank',
          }))}
        />
        <AuditList
          heading="Open questions"
          empty="None."
          items={questions.map((q) => ({ key: q.field + q.question, text: q.question }))}
        />
      </div>
    </details>
  );
};

const ConfirmStep: React.FC<{
  items: [string, string][];
  problems: string[];
  stage: string;
  onCreate: () => void;
}> = ({ items, problems, stage, onCreate }) => {
  const [checked, setChecked] = useState<string[]>([]);
  const canCreate = problems.length === 0 && items.every(([label]) => checked.includes(label));

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 max-w-4xl">
      <p className="text-sm text-slate-600">Tick each detail once you have checked it.</p>
      <ul className="space-y-2">
        {items.map(([label, value]) => (
          <li key={label}>
            <label className="flex items-start gap-3 px-4 py-3 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                className="mt-1"
                checked={checked.includes(label)}
                onChange={(e) => setChecked((c) => (e.target.checked ? [...c, label] : c.filter((l) => l !== label)))}
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
