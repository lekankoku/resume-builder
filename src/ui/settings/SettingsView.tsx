import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { AiClient, DocumentClient, StoredDocument } from '../../application/ports/repositories';
import { formatUsd, UsageReport } from '../../domain/application/cvGeneration';
import { JobApplication } from '../../domain/application/JobApplication';
import { isStageInUse } from '../../domain/application/stages';
import { Profile } from '../../domain/resume/Resume';
import { inputClass, labelClass, primaryButtonClass } from '../applications/ApplicationsView';
import PageHeader from '../shell/PageHeader';

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
  if (!report) return <p className="text-sm text-slate-500">Loading…</p>;

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
