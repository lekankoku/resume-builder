import React, { useEffect, useState } from 'react';
import { Eye, History, Printer, RotateCcw, Save } from 'lucide-react';
import { Link, Navigate, NavLink, Outlet, useOutletContext, useParams } from 'react-router';
import { isWebUrl, JobApplication } from '../../domain/application/JobApplication';
import { resumeDocumentTitle } from '../../domain/resume/documentTitle';
import { Profile } from '../../domain/resume/Resume';
import { applyProfile } from '../../domain/resume/resumeOperations';
import { ApplicationActions } from '../hooks/useApplications';
import PageHeader from '../shell/PageHeader';
import { buttonClass, DetailFields, inputClass, labelClass, primaryButtonClass } from './ApplicationsView';

export interface ApplicationContext {
  application: JobApplication;
  actions: ApplicationActions;
  profile: Profile;
  stages: string[];
}

export const useApplicationContext = () => useOutletContext<ApplicationContext>();

const TABS = [
  { to: 'overview', label: 'Overview' },
  { to: 'cv', label: 'CV' },
  { to: 'cover-letter', label: 'Cover letter' },
  { to: 'versions', label: 'Versions' },
];

const formatTimestamp = (iso: string) => new Date(iso).toLocaleString();

const ApplicationPage: React.FC<Omit<ApplicationContext, 'application'> & { applications: JobApplication[] }> = ({
  applications,
  actions,
  profile,
  stages,
}) => {
  const { id } = useParams();
  const application = applications.find((a) => a.id === id);

  useEffect(() => {
    if (application) document.title = resumeDocumentTitle(applyProfile(application.resume, profile).personal, application.company);
  }, [application?.resume.personal.title, application?.company, profile.name]);

  if (!application) return <Navigate to="/applications" replace />;

  return (
    <div className="max-w-[1600px]">
      <PageHeader
        breadcrumbs={[{ label: 'Applications', to: '/applications' }]}
        title={application.company || 'Untitled company'}
        subtitle={
          <span className="flex items-center gap-3">
            {application.role}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{application.stage}</span>
            {isWebUrl(application.postingUrl) && (
              <a href={application.postingUrl.trim()} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                Job posting
              </a>
            )}
          </span>
        }
        actions={
          <>
            <Link to={`/applications/${application.id}/preview/resume`} className={buttonClass}>
              Print CV <Printer size={14} />
            </Link>
            <Link to={`/applications/${application.id}/preview/cover-letter`} className={buttonClass}>
              Print cover letter <Printer size={14} />
            </Link>
          </>
        }
      />

      <nav aria-label="Application" className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `px-4 py-2 -mb-px text-sm border-b-2 transition-all ${
                isActive ? 'border-accent text-accent font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ application, actions, profile, stages } satisfies ApplicationContext} />
    </div>
  );
};

export const OverviewTab: React.FC = () => {
  const { application, actions, stages } = useApplicationContext();
  const stageOptions = stages.includes(application.stage) ? stages : [application.stage, ...stages];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <DetailFields details={application} onChange={(field, value) => actions.updateField(application.id, field, value)} />
      </section>

      <aside className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 h-fit">
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
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 pt-3">
          <History size={14} /> Stage history
        </h2>
        <ol className="space-y-1 text-xs text-slate-600">
          {[...application.stageHistory].reverse().map((change) => (
            <li key={change.changedAt + change.stage}>
              {formatTimestamp(change.changedAt)} — <span className="font-semibold">{change.stage}</span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
};

export const VersionsTab: React.FC = () => {
  const { application, actions } = useApplicationContext();
  const [versionNote, setVersionNote] = useState('');

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex gap-3">
        <input
          aria-label="Version note"
          className={inputClass}
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
          <li key={version.id} className="flex justify-between items-center rounded-lg px-4 py-3 border border-slate-200">
            <div>
              <p className="text-xs text-slate-500">{formatTimestamp(version.savedAt)}</p>
              <p className="text-sm text-slate-900">{version.note || 'No note'}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/applications/${application.id}/versions/${version.id}/preview/resume`} className={buttonClass}>
                Preview <Eye size={14} />
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Replace the current CV with this version? Changes since then will be lost.')) {
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
        {application.versions.length === 0 && <li className="text-sm text-slate-500">No versions saved yet.</li>}
      </ol>
    </section>
  );
};

export default ApplicationPage;
