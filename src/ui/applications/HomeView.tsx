import React from 'react';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { ApplicationDraft, draftStep } from '../../domain/application/ApplicationDraft';
import { isWebUrl, JobApplication } from '../../domain/application/JobApplication';
import { appliedWithin, recentActivity, stageColumns } from '../../domain/application/pipeline';
import { CLOSED_STAGES, isActiveApplication } from '../../domain/application/stages';
import PageHeader from '../shell/PageHeader';
import { buttonClass, primaryButtonClass } from './ApplicationsView';
import { STEPS } from './NewApplicationWizard';

interface Props {
  applications: JobApplication[];
  stages: string[];
  drafts: ApplicationDraft[];
  onDiscardDraft: (id: string) => void;
}

const HomeView: React.FC<Props> = ({ applications, stages, drafts, onDiscardDraft }) => {
  const active = applications.filter(isActiveApplication);
  const activity = recentActivity(applications, 6);
  const stats = [
    { label: 'Active', value: active.length },
    { label: 'Applied in the last 30 days', value: appliedWithin(applications, 30, new Date()) },
    { label: 'Drafts', value: drafts.length },
    { label: 'Total', value: applications.length },
  ];

  return (
    <div className="max-w-6xl space-y-10">
      <PageHeader title="Dashboard" subtitle={`${active.length} active of ${applications.length} applications`} />

      <section aria-label="Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-3xl font-semibold text-slate-900 tabular-nums">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Pipeline</h2>
          <ul className="space-y-2">
            {stageColumns(applications, stages).map(({ stage, applications: inStage }) => (
              <li key={stage}>
                <Link
                  to={`/applications?view=table&stage=${encodeURIComponent(stage)}`}
                  className="flex items-center gap-3 text-sm group"
                >
                  <span className="w-32 shrink-0 text-slate-700 group-hover:underline">{stage}</span>
                  <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <span
                      className={`block h-full rounded-full ${CLOSED_STAGES.includes(stage) ? 'bg-slate-300' : 'bg-accent'}`}
                      style={{ width: applications.length ? `${(inStage.length / applications.length) * 100}%` : 0 }}
                    />
                  </span>
                  <span className="w-6 text-right tabular-nums text-slate-500">{inStage.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing yet.</p>
          ) : (
            <ol className="space-y-3">
              {activity.map(({ application, stage, changedAt }) => (
                <li key={application.id + changedAt + stage} className="text-sm">
                  <Link to={`/applications/${application.id}`} className="font-medium text-slate-900 hover:underline">
                    {application.company || 'Untitled company'}
                  </Link>{' '}
                  <span className="text-slate-600">
                    {application.stageHistory[0].changedAt === changedAt ? 'added in' : 'moved to'} {stage}
                  </span>
                  <p className="text-xs text-slate-400">{new Date(changedAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Continue where you left off</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {drafts.map((draft) => (
              <li key={draft.id} className="bg-white rounded-2xl border border-dashed border-slate-300 p-5 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{draft.details.company || 'Untitled company'}</h3>
                  <p className="text-sm text-slate-600">{draft.details.role}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Draft at {STEPS.find((s) => s.id === draftStep(draft.stepId))?.label} · saved{' '}
                    {new Date(draft.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/drafts/${draft.id}`} className={primaryButtonClass}>
                    Continue <Play size={14} />
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm('Discard this draft? Its details and CV edits will be lost.')) {
                        onDiscardDraft(draft.id);
                      }
                    }}
                    className={buttonClass}
                  >
                    Discard <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Active applications</h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <p className="text-sm text-slate-500">No active applications.</p>
            <Link to="/applications/new" className={`${primaryButtonClass} inline-flex`}>
              New application <Plus size={14} />
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((application) => (
              <li key={application.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-slate-300">
                <div className="flex justify-between items-start gap-3">
                  <Link to={`/applications/${application.id}`} className="group">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:underline">
                      {application.company || 'Untitled company'}
                    </h3>
                    <p className="text-sm text-slate-600">{application.role}</p>
                  </Link>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                    {application.stage}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Applied {application.appliedOn || '—'}</p>
                <div className="flex gap-2 items-center">
                  <Link to={`/applications/${application.id}/cv`} className={buttonClass}>
                    Edit CV <Pencil size={14} />
                  </Link>
                  {isWebUrl(application.postingUrl) && (
                    <a
                      href={application.postingUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline ml-auto"
                    >
                      Job posting
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default HomeView;
