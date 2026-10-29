import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { AiClient, DocumentClient, StoredDocument } from '../../application/ports/repositories';
import { formatUsd, UsageReport } from '../../domain/application/cvGeneration';
import { JobApplication } from '../../domain/application/JobApplication';
import {
  addFact,
  CandidateFacts,
  FactList,
  LanguageBasis,
  removeFact,
  updateFact,
  WorkAuthorization,
} from '../../domain/candidate/CandidateFacts';
import { isStageInUse } from '../../domain/application/stages';
import { Profile } from '../../domain/resume/Resume';
import { inputClass, labelClass, primaryButtonClass } from '../applications/ApplicationsView';
import PageHeader from '../shell/PageHeader';
import { Loading, Skeleton } from '../shell/Skeleton';

const PROFILE_LABELS: Record<keyof Profile, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  residence: 'Residence',
  nationality: 'Nationality',
  website: 'Website',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  photoUrl: 'Photo URL',
};

const SECTIONS = [
  { to: 'profile', label: 'Profile' },
  { to: 'stages', label: 'Stages' },
  { to: 'job-bank', label: 'Job bank' },
  { to: 'cv-facts', label: 'CV facts' },
  { to: 'cv-guide', label: 'CV guide' },
  { to: 'ai-usage', label: 'AI usage' },
];

const SettingsView: React.FC = () => (
  <div className="max-w-3xl">
    <PageHeader title="Settings" />
    <nav aria-label="Settings" className="flex gap-1 border-b border-slate-200 mb-6">
      {SECTIONS.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          className={({ isActive }) =>
            `px-4 py-2 -mb-px text-sm border-b-2 transition-all ${
              isActive ? 'border-accent text-accent font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`
          }
        >
          {section.label}
        </NavLink>
      ))}
    </nav>
    <Outlet />
  </div>
);

export const ProfileSettings: React.FC<{
  profile: Profile;
  onChange: (field: keyof Profile, value: string) => void;
}> = ({ profile, onChange }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
    <p className="text-sm text-slate-500">Used on every CV and cover letter. Each application only sets its own title.</p>
    <div className="grid grid-cols-2 gap-6">
      {(Object.keys(PROFILE_LABELS) as (keyof Profile)[]).map((key) => (
        <div key={key} className="space-y-1">
          <label htmlFor={`profile-${key}`} className={labelClass}>{PROFILE_LABELS[key]}</label>
          <input id={`profile-${key}`} className={inputClass} value={profile[key] ?? ''} onChange={(e) => onChange(key, e.target.value)} />
        </div>
      ))}
    </div>
  </section>
);

export const StageSettings: React.FC<{
  stages: string[];
  applications: JobApplication[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}> = ({ stages, applications, onAdd, onRemove }) => {
  const [name, setName] = useState('');

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <p className="text-sm text-slate-500">Stages in use by an application can't be removed.</p>
      <ul className="divide-y divide-slate-100">
        {stages.map((stage) => (
          <li key={stage} className="flex justify-between items-center text-sm py-2">
            {stage}
            <button
              aria-label={`Remove stage ${stage}`}
              disabled={isStageInUse(stage, applications)}
              title={isStageInUse(stage, applications) ? 'In use by an application' : undefined}
              onClick={() => onRemove(stage)}
              className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(name);
          setName('');
        }}
      >
        <input aria-label="New stage name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="New stage" />
        <button type="submit" aria-label="Add stage" className={primaryButtonClass}>
          <Plus size={14} />
        </button>
      </form>
    </section>
  );
};

export const JobBankSettings: React.FC<{
  jobBank: string;
  onChange: (jobBank: string) => void;
}> = ({ jobBank, onChange }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
    <p className="text-sm text-slate-500">
      Your full work history: roles, dates, projects, achievements, metrics and skills. It is the only source of facts when a CV is
      generated for an application.
    </p>
    <div className="space-y-1">
      <label htmlFor="job-bank" className={labelClass}>Job bank</label>
      <textarea
        id="job-bank"
        className={`${inputClass} min-h-[480px] font-mono text-xs leading-relaxed`}
        value={jobBank}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
    <p className="text-xs text-slate-500">{jobBank.length.toLocaleString()} characters</p>
  </section>
);

const WORK_AUTHORIZATIONS: [WorkAuthorization, string][] = [
  ['unknown', 'Not specified'],
  ['eu-citizen', 'EU citizen, no visa needed'],
  ['needs-visa', 'Needs a visa'],
  ['has-permit', 'Holds a work permit'],
];

export const WorkAuthorizationSettings: React.FC<{
  facts: CandidateFacts;
  onChange: (facts: CandidateFacts) => void;
}> = ({ facts, onChange }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 mt-6">
    <p className="text-sm text-slate-500">Sent to the AI with your profile, so it doesn't ask again and the cover letter can mention it when it helps.</p>
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-1">
        <label htmlFor="work-authorization" className={labelClass}>Work authorisation</label>
        <select
          id="work-authorization"
          className={inputClass}
          value={facts.workAuthorization}
          onChange={(e) => onChange({ ...facts, workAuthorization: e.target.value as WorkAuthorization })}
        >
          {WORK_AUTHORIZATIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      {facts.workAuthorization === 'has-permit' && (
        <div className="space-y-1">
          <label htmlFor="work-permit" className={labelClass}>Permit</label>
          <input
            id="work-permit"
            className={inputClass}
            value={facts.permit}
            placeholder="e.g. EU Blue Card, valid until 2028"
            onChange={(e) => onChange({ ...facts, permit: e.target.value })}
          />
        </div>
      )}
    </div>
  </section>
);

const LANGUAGE_BASES: [LanguageBasis, string][] = [
  ['', 'Not specified'],
  ['mother tongue', 'Mother tongue'],
  ['certificate', 'Certificate'],
  ['schooling', 'Schooling'],
  ['residence', 'Living there'],
  ['self-assessed', 'Self-assessed'],
];

const FactText: React.FC<{ label: string; value: string; onChange: (value: string) => void; multiline?: boolean }> = ({
  label,
  value,
  onChange,
  multiline,
}) => (
  <label className="block space-y-1">
    <span className={labelClass}>{label}</span>
    {multiline ? (
      <textarea className={inputClass} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </label>
);

const FactCheckbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm text-slate-700">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>
);

const FactSection: React.FC<{
  title: string;
  description: string;
  addLabel?: string;
  onAdd?: () => void;
  children: React.ReactNode;
}> = ({ title, description, addLabel, onAdd, children }) => (
  <section aria-label={title} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
    <div className="flex justify-between items-start gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {onAdd && (
        <button onClick={onAdd} className="text-sm font-medium text-accent hover:underline shrink-0">
          + {addLabel}
        </button>
      )}
    </div>
    {children}
  </section>
);

const FactItem: React.FC<{ label: string; onRemove: () => void; children: React.ReactNode }> = ({ label, onRemove, children }) => (
  <div className="p-4 bg-slate-50 rounded-xl space-y-3">
    <div className="grid grid-cols-2 gap-4">{children}</div>
    <button aria-label={`Remove ${label}`} onClick={onRemove} className="flex items-center gap-1 text-sm text-red-500 hover:underline">
      <Trash2 size={14} /> Remove
    </button>
  </div>
);

export const CvFactsSettings: React.FC<{
  facts: CandidateFacts;
  onChange: (facts: CandidateFacts) => void;
}> = ({ facts, onChange }) => {
  const set = <L extends FactList>(list: L, index: number, field: keyof CandidateFacts[L][number], value: string | boolean) =>
    onChange(updateFact(facts, list, index, field, value));
  const remove = (list: FactList, index: number) => onChange(removeFact(facts, list, index));

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Sent to the AI with every generation and trusted over the job bank, so it doesn't have to ask for these again.
      </p>

      <FactSection
        title="Languages"
        description="Only B2 and above appear on a CV."
        addLabel="Add language"
        onAdd={() => onChange(addFact(facts, 'languages'))}
      >
        {facts.languages.map((language, i) => (
          <FactItem key={i} label={`language ${i + 1}`} onRemove={() => remove('languages', i)}>
            <FactText label={`Language ${i + 1}`} value={language.name} onChange={(v) => set('languages', i, 'name', v)} />
            <FactText label={`Level ${i + 1} (A1–C2 or Native)`} value={language.level} onChange={(v) => set('languages', i, 'level', v)} />
            <label className="block space-y-1">
              <span className={labelClass}>How you got level {i + 1}</span>
              <select className={inputClass} value={language.basis} onChange={(e) => set('languages', i, 'basis', e.target.value)}>
                {LANGUAGE_BASES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </FactItem>
        ))}
      </FactSection>

      <FactSection
        title="References"
        description="Only references who agreed and aren't your current manager are listed."
        addLabel="Add reference"
        onAdd={() => onChange(addFact(facts, 'references'))}
      >
        {facts.references.map((reference, i) => (
          <FactItem key={i} label={`reference ${i + 1}`} onRemove={() => remove('references', i)}>
            <FactText label={`Reference ${i + 1} name`} value={reference.name} onChange={(v) => set('references', i, 'name', v)} />
            <FactText label={`Reference ${i + 1} role`} value={reference.role} onChange={(v) => set('references', i, 'role', v)} />
            <FactText label={`Reference ${i + 1} company`} value={reference.company} onChange={(v) => set('references', i, 'company', v)} />
            <FactText label={`Reference ${i + 1} email or phone`} value={reference.contact} onChange={(v) => set('references', i, 'contact', v)} />
            <FactText label={`Reference ${i + 1} LinkedIn`} value={reference.linkedin} onChange={(v) => set('references', i, 'linkedin', v)} />
            <div className="space-y-2 self-end">
              <FactCheckbox label={`Reference ${i + 1} agreed to be listed`} checked={reference.consented} onChange={(v) => set('references', i, 'consented', v)} />
              <FactCheckbox label={`Reference ${i + 1} is my current manager`} checked={reference.isCurrentManager} onChange={(v) => set('references', i, 'isCurrentManager', v)} />
            </div>
          </FactItem>
        ))}
      </FactSection>

      <FactSection
        title="Education"
        description="Degrees and schools. Put grades, scholarships, awards and your thesis in the details."
        addLabel="Add education"
        onAdd={() => onChange(addFact(facts, 'education'))}
      >
        {facts.education.map((education, i) => (
          <FactItem key={i} label={`education ${i + 1}`} onRemove={() => remove('education', i)}>
            <FactText label={`Degree ${i + 1}`} value={education.degree} onChange={(v) => set('education', i, 'degree', v)} />
            <FactText label={`Institution ${i + 1}`} value={education.institution} onChange={(v) => set('education', i, 'institution', v)} />
            <FactText label={`Location ${i + 1}`} value={education.location} onChange={(v) => set('education', i, 'location', v)} />
            <FactText label={`Period ${i + 1} (e.g. October 2018 – November 2022)`} value={education.period} onChange={(v) => set('education', i, 'period', v)} />
            <FactCheckbox label={`Degree ${i + 1} completed`} checked={education.completed} onChange={(v) => set('education', i, 'completed', v)} />
            <div className="col-span-2">
              <FactText label={`Details ${i + 1}`} value={education.details} multiline onChange={(v) => set('education', i, 'details', v)} />
            </div>
          </FactItem>
        ))}
      </FactSection>

      <FactSection title="Saved answers" description="Answers you chose to remember while generating a CV. They are treated as facts.">
        {facts.answers.length === 0 && <p className="text-sm text-slate-500">No saved answers yet.</p>}
        {facts.answers.map((saved, i) => (
          <div key={saved.question} className="p-4 bg-slate-50 rounded-xl space-y-2">
            <FactText label={saved.question} value={saved.answer} multiline onChange={(v) => set('answers', i, 'answer', v)} />
            <button
              aria-label={`Remove saved answer ${i + 1}`}
              onClick={() => remove('answers', i)}
              className="flex items-center gap-1 text-sm text-red-500 hover:underline"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        ))}
      </FactSection>
    </div>
  );
};

export const CvGuideSettings: React.FC<{
  cvGuide: StoredDocument | null;
  documents: DocumentClient;
  onChange: (guide: StoredDocument) => void;
}> = ({ cvGuide, documents, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      onChange(await documents.upload(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <p className="text-sm text-slate-500">
        Keep the CV guide PDF here for reference. Its lessons are built into the generation prompts, so it is no longer attached to
        generations. It is stored privately in Documents.
      </p>
      {cvGuide ? (
        <p className="text-sm text-slate-900">
          Current guide:{' '}
          <a href={documents.urlOf(cvGuide.id)} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">
            {cvGuide.name}
          </a>{' '}
          <span className="text-slate-500">uploaded {new Date(cvGuide.uploadedAt).toLocaleDateString()}</span>
        </p>
      ) : (
        <p className="text-sm text-slate-900">No guide uploaded yet.</p>
      )}
      <div className="space-y-1">
        <label htmlFor="cv-guide-upload" className={labelClass}>{cvGuide ? 'Replace guide PDF' : 'Upload guide PDF'}</label>
        <input
          id="cv-guide-upload"
          type="file"
          accept=".pdf"
          disabled={uploading}
          className="block text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = '';
          }}
        />
      </div>
      {uploading && <p className="text-sm text-slate-500">Uploading…</p>}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </section>
  );
};

export const AiUsageSettings: React.FC<{ client: AiClient }> = ({ client }) => {
  const [report, setReport] = useState<UsageReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.usage().then(setReport, (e: Error) => setError(e.message));
  }, [client]);

  if (error) return <p role="alert" className="text-sm text-red-500">{error}</p>;
  if (!report) {
    return (
      <Loading label="Loading AI usage" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <Skeleton className="h-4 w-2/3" />
        <div className="grid grid-cols-2 gap-6">
          {[0, 1].map((total) => (
            <div key={total} className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-4" />
          ))}
        </div>
      </Loading>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <p className="text-sm text-slate-500">Estimated from token counts and the configured prices. Your provider's billing page is authoritative.</p>
      <dl className="grid grid-cols-2 gap-6">
        <div>
          <dt className={labelClass}>This month</dt>
          <dd className="text-2xl font-semibold text-slate-900">{formatUsd(report.monthUsd)}</dd>
        </div>
        <div>
          <dt className={labelClass}>All time</dt>
          <dd className="text-2xl font-semibold text-slate-900">{formatUsd(report.totalUsd)}</dd>
        </div>
      </dl>
      {report.entries.length === 0 ? (
        <p className="text-sm text-slate-500">No CVs generated yet.</p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">Recent generations</caption>
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Application</th>
              <th className="py-2 font-medium">Model</th>
              <th className="py-2 font-medium text-right">Tokens in / cached / out</th>
              <th className="py-2 font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.entries.map((entry) => (
              <tr key={entry.id}>
                <td className="py-2">{new Date(entry.createdAt).toLocaleString()}</td>
                <td className="py-2">{[entry.company, entry.role].filter(Boolean).join(' — ')}</td>
                <td className="py-2">{entry.model}</td>
                <td className="py-2 text-right tabular-nums">
                  {entry.inputTokens.toLocaleString()} / {entry.cachedInputTokens.toLocaleString()} / {entry.outputTokens.toLocaleString()}
                </td>
                <td className="py-2 text-right tabular-nums">{formatUsd(entry.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default SettingsView;
