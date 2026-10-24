import React from 'react';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { ApplicationDraft } from '../../domain/application/ApplicationDraft';
import { isWebUrl, JobApplication } from '../../domain/application/JobApplication';
import { isActiveApplication } from '../../domain/application/stages';
import PageHeader from '../shell/PageHeader';
import { buttonClass, primaryButtonClass } from './ApplicationsView';
import { STEPS } from './NewApplicationWizard';

interface Props {
  applications: JobApplication[];
  drafts: ApplicationDraft[];
  onDiscardDraft: (id: string) => void;
}

const HomeView: React.FC<Props> = ({ applications, drafts, onDiscardDraft }) => {
  const active = applications.filter(isActiveApplication);

  return (
    <div className="max-w-6xl space-y-10">
      <PageHeader title="Dashboard" subtitle={`${active.length} active of ${applications.length} applications`} />

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
                    Draft at {STEPS.find((s) => s.id === draft.stepId)?.label ?? draft.stepId} · saved{' '}
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
