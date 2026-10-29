import React from 'react';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { ApplicationDraft, draftStep } from '../../domain/application/ApplicationDraft';
import { isWebUrl, JobApplication } from '../../domain/application/JobApplication';
import { JobLead } from '../../domain/application/JobLead';
import {
  appliedWithin,
  daysInStage,
  recentActivity,
  stageColumns,
  stageReach,
  staleApplications,
  weeklyApplied,
} from '../../domain/application/pipeline';
import { CLOSED_STAGES, isActiveApplication } from '../../domain/application/stages';
import PageHeader from '../shell/PageHeader';
import { buttonClass, primaryButtonClass } from './ApplicationsView';
import { STEPS } from './NewApplicationWizard';

interface Props {
  applications: JobApplication[];
  stages: string[];
  drafts: ApplicationDraft[];
  leads: JobLead[];
  onDiscardDraft: (id: string) => void;
}

const STALE_DAYS = 14;

const HomeView: React.FC<Props> = ({ applications, stages, drafts, leads, onDiscardDraft }) => {
  const now = new Date();
  const active = applications.filter(isActiveApplication);
  const stale = staleApplications(applications, STALE_DAYS, now);
  const activity = recentActivity(applications, 6);
  const oldestLeads = [...leads].sort((a, b) => a.addedAt.localeCompare(b.addedAt)).slice(0, 3);
  const stats = [
    { label: 'Active', value: active.length, to: '/applications' },
    { label: 'Need attention', value: stale.length },
    { label: 'Applied in the last 30 days', value: appliedWithin(applications, 30, now) },
    { label: 'To apply', value: leads.length, to: '/to-apply' },
    { label: 'Drafts', value: drafts.length },
  ];

  return (
    <div className="max-w-6xl space-y-10">
      <PageHeader title="Dashboard" subtitle={`${active.length} active of ${applications.length} applications`} />

      <section aria-label="Statistics" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const content = (
            <>
              <p className="text-3xl font-semibold text-slate-900 tabular-nums">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </>
          );
          return stat.to ? (
            <Link key={stat.label} to={stat.to} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300">
              {content}
            </Link>
          ) : (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              {content}
            </div>
          );
        })}
      </section>

      {stale.length > 0 && (
        <section aria-labelledby="needs-attention" className="bg-white rounded-2xl border border-amber-200 p-5 space-y-4">
          <div>
            <h2 id="needs-attention" className="text-base font-semibold text-slate-900">Needs attention</h2>
            <p className="text-sm text-slate-500">No movement in {STALE_DAYS}+ days. Follow up or update the stage.</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {stale.map((application) => (
              <li key={application.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link to={`/applications/${application.id}`} className="min-w-0 truncate hover:underline">
                  <span className="font-medium text-slate-900">{application.company || 'Untitled company'}</span>
                  {application.role && <span className="text-slate-600"> — {application.role}</span>}
                </Link>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {daysInStage(application, now)} days in {application.stage}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {drafts.length > 0 && <DraftList drafts={drafts} onDiscardDraft={onDiscardDraft} />}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <WeeklyChart weeks={weeklyApplied(applications, 8, now)} />

        <section aria-labelledby="to-apply" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 id="to-apply" className="text-base font-semibold text-slate-900">To apply</h2>
            <Link to="/to-apply" className="text-xs text-accent underline">See all</Link>
          </div>
          {oldestLeads.length === 0 ? (
            <p className="text-sm text-slate-500">No saved jobs.</p>
          ) : (
            <ul className="space-y-3">
              {oldestLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{lead.company || 'Untitled company'}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {lead.role && `${lead.role} · `}saved {new Date(lead.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/applications/new?lead=${lead.id}`}
                    aria-label={`Start application for ${lead.company || 'Untitled company'}`}
                    className={buttonClass}
                  >
                    Start <Play size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <section aria-labelledby="furthest-stage" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div>
            <h2 id="furthest-stage" className="text-base font-semibold text-slate-900">How far applications got</h2>
            <p className="text-xs text-slate-500">Including ones since rejected or withdrawn</p>
          </div>
          <ul className="space-y-2">
            {stageReach(applications, stages).map(({ stage, reached }) => (
              <li key={stage} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-slate-700">{stage}</span>
                <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: applications.length ? `${(reached / applications.length) * 100}%` : 0 }}
                  />
                </span>
                <span className="w-16 text-right tabular-nums text-slate-500">
                  {reached} · {applications.length ? Math.round((reached / applications.length) * 100) : 0}%
                </span>
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
                <p className="text-xs text-slate-500">
                  Applied {application.appliedOn || '—'} · {daysInStage(application, now)} days in stage
                </p>
                <div className="flex gap-2 items-center">
                  <Link to={`/applications/${application.id}/cv`} className={buttonClass}>
                    {application.hasCv ? (
                      <>
                        Edit CV <Pencil size={14} />
                      </>
                    ) : (
                      <>
                        Add CV <Plus size={14} />
                      </>
                    )}
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

const WeeklyChart: React.FC<{ weeks: { weekEnding: string; count: number }[] }> = ({ weeks }) => {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const total = weeks.reduce((sum, w) => sum + w.count, 0);
  return (
    <section aria-labelledby="weekly-applications" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div>
        <h2 id="weekly-applications" className="text-base font-semibold text-slate-900">Applications per week</h2>
        <p className="text-xs text-slate-500">{total} in the last {weeks.length} weeks</p>
      </div>
      <ol className="flex items-end gap-0.5 h-32 border-b border-slate-200">
        {weeks.map((week) => (
          <li key={week.weekEnding} className="group relative flex-1 h-full flex items-end">
            <span className="sr-only">
              Week ending {week.weekEnding}: {week.count}
            </span>
            <span aria-hidden="true" className="block w-full rounded-t bg-accent" style={{ height: `${(week.count / max) * 100}%` }} />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
            >
              {week.count} · week ending {week.weekEnding}
            </span>
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="flex justify-between text-xs text-slate-400">
        <span>{weeks[0].weekEnding}</span>
        <span>{weeks[weeks.length - 1].weekEnding}</span>
      </div>
    </section>
  );
};

const DraftList: React.FC<{ drafts: ApplicationDraft[]; onDiscardDraft: (id: string) => void }> = ({ drafts, onDiscardDraft }) => (
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
);

export default HomeView;
