import React from 'react';
import { Briefcase, ClipboardList, Pencil, Play, Plus, Settings2, Trash2 } from 'lucide-react';
import { ApplicationDraft } from '../../domain/application/ApplicationDraft';
import { isWebUrl, JobApplication } from '../../domain/application/JobApplication';
import { isActiveApplication } from '../../domain/application/stages';
import { buttonClass, primaryButtonClass } from './ApplicationsView';
import { STEPS } from './NewApplicationWizard';

interface Props {
  applications: JobApplication[];
  drafts: ApplicationDraft[];
  onOpenDraft: (id: string) => void;
  onDiscardDraft: (id: string) => void;
  onNewApplication: () => void;
  onOpenSettings: () => void;
  onOpenApplication: (id: string) => void;
  onEditApplicationCv: (id: string) => void;
  onOpenAllApplications: () => void;
}

const HomeView: React.FC<Props> = ({
  applications,
  drafts,
  onOpenDraft,
  onDiscardDraft,
  onNewApplication,
  onOpenSettings,
  onOpenApplication,
  onEditApplicationCv,
  onOpenAllApplications,
}) => {
  const active = applications.filter(isActiveApplication);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-6 font-sans">
      <header className="max-w-6xl w-full mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="text-xl font-display text-slate-900 leading-tight">Active Applications</h1>
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
              {active.length} active of {applications.length} tracked
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onOpenSettings} className={buttonClass}>
            Settings <Settings2 size={14} />
          </button>
          <button onClick={onOpenAllApplications} className={buttonClass}>
            All Applications <ClipboardList size={14} />
          </button>
          <button onClick={onNewApplication} className={primaryButtonClass}>
            New Application <Plus size={14} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full space-y-8">
        {drafts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Drafts</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map((draft) => (
                <li key={draft.id} className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-300 p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{draft.details.company || 'Untitled company'}</h3>
                    <p className="text-sm text-slate-600">{draft.details.role}</p>
                  </div>
                  <p className="text-xs font-mono text-slate-500">
                    At {STEPS.find((s) => s.id === draft.stepId)?.label ?? draft.stepId} · saved {new Date(draft.updatedAt).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => onOpenDraft(draft.id)} className={primaryButtonClass}>
                      Continue <Play size={14} />
                    </button>
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
        {active.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center space-y-4">
            <p className="text-sm text-slate-400">No active applications.</p>
            <button onClick={onNewApplication} className={`${primaryButtonClass} mx-auto`}>
              New Application <Plus size={14} />
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((application) => (
              <li key={application.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{application.company || 'Untitled company'}</h2>
                    <p className="text-sm text-slate-600">{application.role}</p>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900/10 whitespace-nowrap">
                    {application.stage}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500">Applied {application.appliedOn || '—'}</p>
                <div className="flex gap-2 items-center">
                  <button onClick={() => onOpenApplication(application.id)} className={buttonClass}>
                    Details
                  </button>
                  <button onClick={() => onEditApplicationCv(application.id)} className={buttonClass}>
                    Edit CV <Pencil size={14} />
                  </button>
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
      </main>
    </div>
  );
};

export default HomeView;
