import React, { useState } from 'react';
import { ClipboardList, Eye, History, Pencil, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { ApplicationDetails, CvVersion, isWebUrl, JobApplication } from '../../domain/application/JobApplication';
import { isStageInUse } from '../../domain/application/stages';
import { Profile } from '../../domain/resume/Resume';
import { applyProfile } from '../../domain/resume/resumeOperations';
import { ApplicationActions } from '../hooks/useApplications';
import CoverLetterPreview from '../preview/CoverLetterPreview';
import ResumePreview, { PrintVariant } from '../preview/ResumePreview';

interface Props {
  applications: JobApplication[];
  actions: ApplicationActions;
  stages: string[];
  profile: Profile;
  initialSelectedId?: string;
  onAddStage: (name: string) => void;
  onRemoveStage: (name: string) => void;
  onNewApplication: () => void;
  onEditApplication: (id: string) => void;
}

export const inputClass =
  'w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none';
export const labelClass = 'text-[10px] font-mono font-black uppercase text-slate-400';
export const buttonClass =
  'flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]';
export const primaryButtonClass =
  'flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all uppercase tracking-widest text-[10px]';

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString();

const ApplicationsView: React.FC<Props> = ({
  applications,
  actions,
  stages,
  profile,
  initialSelectedId,
  onAddStage,
  onRemoveStage,
  onNewApplication,
  onEditApplication,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? applications[0]?.id ?? null);
  const [stageFilter, setStageFilter] = useState('');
  const [previewing, setPreviewing] = useState<{ application: JobApplication; version: CvVersion } | null>(null);

  const selected = applications.find((a) => a.id === selectedId);
  const visible = stageFilter ? applications.filter((a) => a.stage === stageFilter) : applications;

  if (previewing) {
    return <VersionPreview {...previewing} profile={profile} onBack={() => setPreviewing(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-6 font-sans">
      <header className="max-w-6xl w-full mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-xl font-display text-slate-900 leading-tight">Applications</h1>
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">{applications.length} tracked</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onNewApplication} className={primaryButtonClass}>
            New Application <Plus size={14} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <label htmlFor="stage-filter" className={labelClass}>Filter by stage</label>
            <select id="stage-filter" className={inputClass} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <ul className="space-y-1">
              {visible.map((application) => (
                <li key={application.id}>
                  <button
                    onClick={() => setSelectedId(application.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      application.id === selectedId ? 'bg-accent text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-bold">{application.company || 'Untitled company'}</span>
                    <span className="block text-xs opacity-80">{application.role}</span>
                    <span className="inline-block mt-1 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900/10">
                      {application.stage}
                    </span>
                  </button>
                </li>
              ))}
              {visible.length === 0 && <li className="text-xs text-slate-400 px-4 py-3">No applications</li>}
            </ul>
          </div>

          <StageManager stages={stages} applications={applications} onAdd={onAddStage} onRemove={onRemoveStage} />
        </aside>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[600px]">
          {selected && (
            <ApplicationDetail
              application={selected}
              actions={actions}
              stages={stages}
              onEditCv={() => onEditApplication(selected.id)}
              onPreviewVersion={(version) => setPreviewing({ application: selected, version })}
            />
          )}
          {!selected && <p className="text-sm text-slate-400">Select an application.</p>}
        </section>
      </main>
    </div>
  );
};

export const DetailFields: React.FC<{
  details: ApplicationDetails;
  onChange: (field: keyof ApplicationDetails, value: string) => void;
}> = ({ details, onChange }) => (
  <div className="grid grid-cols-2 gap-6">
    <div className="space-y-1">
      <label htmlFor="application-company" className={labelClass}>Company</label>
      <input id="application-company" className={inputClass} value={details.company} onChange={(e) => onChange('company', e.target.value)} />
    </div>
    <div className="space-y-1">
      <label htmlFor="application-role" className={labelClass}>Role</label>
      <input id="application-role" className={inputClass} value={details.role} onChange={(e) => onChange('role', e.target.value)} />
    </div>
    <div className="space-y-1">
      <label htmlFor="application-url" className={labelClass}>Job posting URL</label>
      <input
        id="application-url"
        type="url"
        className={inputClass}
        value={details.postingUrl}
        onChange={(e) => onChange('postingUrl', e.target.value)}
      />
    </div>
    <div className="space-y-1">
      <label htmlFor="application-applied-on" className={labelClass}>Date applied</label>
      <input
        id="application-applied-on"
        type="date"
        className={inputClass}
        value={details.appliedOn}
        onChange={(e) => onChange('appliedOn', e.target.value)}
      />
    </div>
    <div className="space-y-1 col-span-2">
      <label htmlFor="application-notes" className={labelClass}>Notes</label>
      <textarea
        id="application-notes"
        className={`${inputClass} min-h-[160px] leading-relaxed`}
        value={details.notes}
        onChange={(e) => onChange('notes', e.target.value)}
      />
    </div>
  </div>
);

const ApplicationDetail: React.FC<{
  application: JobApplication;
  actions: ApplicationActions;
  stages: string[];
  onEditCv: () => void;
  onPreviewVersion: (version: CvVersion) => void;
}> = ({ application, actions, stages, onEditCv, onPreviewVersion }) => {
  const [versionNote, setVersionNote] = useState('');
  const stageOptions = stages.includes(application.stage) ? stages : [application.stage, ...stages];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-display text-slate-900">{application.company || 'Untitled company'}</h2>
        <div className="flex gap-3 items-center">
          {isWebUrl(application.postingUrl) && (
            <a href={application.postingUrl.trim()} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline">
              Job posting
            </a>
          )}
          <button onClick={onEditCv} className={primaryButtonClass}>
            Edit CV <Pencil size={14} />
          </button>
        </div>
      </div>

      <DetailFields details={application} onChange={(field, value) => actions.updateField(application.id, field, value)} />

      <div className="space-y-3">
        <label htmlFor="application-stage" className={labelClass}>Stage</label>
        <select
          id="application-stage"
          className={inputClass}
          value={application.stage}
          onChange={(e) => actions.changeStage(application.id, e.target.value)}
        >
          {stageOptions.map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide pt-2">
          <History size={14} /> Stage history
        </h3>
        <ol className="space-y-1 text-xs text-slate-600">
          {[...application.stageHistory].reverse().map((change) => (
            <li key={change.changedAt + change.stage} className="font-mono">
              {formatTimestamp(change.changedAt)} — <span className="font-bold">{change.stage}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">CV versions</h3>
        <div className="flex gap-3">
          <input
            aria-label="Version note"
            className={`${inputClass} bg-white`}
            value={versionNote}
            onChange={(e) => setVersionNote(e.target.value)}
            placeholder="What changed? e.g. tailored summary for platform role"
          />
          <button
            onClick={() => {
              actions.saveVersion(application.id, versionNote.trim());
              setVersionNote('');
            }}
            className={`${primaryButtonClass} whitespace-nowrap`}
          >
            Save version <Save size={14} />
          </button>
        </div>
        <ol className="space-y-2">
          {[...application.versions].reverse().map((version) => (
            <li key={version.id} className="flex justify-between items-center bg-white rounded-lg px-4 py-3 border border-slate-200">
              <div>
                <p className="text-xs font-mono text-slate-500">{formatTimestamp(version.savedAt)}</p>
                <p className="text-sm text-slate-900">{version.note || 'No note'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onPreviewVersion(version)} className={buttonClass}>
                  Preview <Eye size={14} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Replace the current CV draft with this version? Unsaved draft changes will be lost.')) {
                      actions.restoreVersion(application.id, version.id);
                    }
                  }}
                  className={buttonClass}
                >
                  Restore <RotateCcw size={14} />
                </button>
              </div>
            </li>
          ))}
          {application.versions.length === 0 && <li className="text-xs text-slate-400">No versions saved yet.</li>}
        </ol>
      </div>
    </div>
  );
};

const StageManager: React.FC<{
  stages: string[];
  applications: JobApplication[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}> = ({ stages, applications, onAdd, onRemove }) => {
  const [name, setName] = useState('');

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
      <p className={labelClass}>Manage stages</p>
      <ul className="space-y-1">
        {stages.map((stage) => (
          <li key={stage} className="flex justify-between items-center text-sm px-2 py-1">
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
    </div>
  );
};

const VersionPreview: React.FC<{ application: JobApplication; version: CvVersion; profile: Profile; onBack: () => void }> = ({
  application,
  version,
  profile,
  onBack,
}) => {
  const resume = applyProfile(version.resume, profile);
  const [mode, setMode] = useState<'resume' | 'cover-letter'>('resume');
  const [printVariant, setPrintVariant] = useState<PrintVariant>('continuous');

  return mode === 'resume' ? (
    <ResumePreview
      resume={resume}
      targetCompany={application.company}
      printVariant={printVariant}
      onPrintVariantChange={setPrintVariant}
      onBackToEditor={onBack}
      onShowCoverLetter={() => setMode('cover-letter')}
    />
  ) : (
    <CoverLetterPreview
      resume={resume}
      coverLetter={version.coverLetter}
      targetCompany={application.company}
      onBackToEditor={onBack}
      onShowResume={() => setMode('resume')}
    />
  );
};

export default ApplicationsView;
