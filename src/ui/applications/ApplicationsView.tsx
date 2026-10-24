import React from 'react';
import { Columns3, GripVertical, Plus, Rows3 } from 'lucide-react';
import { Announcements, DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Link, useSearchParams } from 'react-router';
import { ApplicationDetails, JobApplication } from '../../domain/application/JobApplication';
import { StageColumn, stageColumns } from '../../domain/application/pipeline';
import { CLOSED_STAGES, stageOptions } from '../../domain/application/stages';
import PageHeader from '../shell/PageHeader';

interface Props {
  applications: JobApplication[];
  stages: string[];
  onChangeStage: (id: string, stage: string) => void;
}

export const inputClass =
  'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none';
export const labelClass = 'block text-sm font-medium text-slate-700';
export const buttonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all';
export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-all';

const ApplicationsView: React.FC<Props> = ({ applications, stages, onChangeStage }) => {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'table' ? 'table' : 'board';
  const stageFilter = params.get('stage') ?? '';
  const visible = stageFilter ? applications.filter((a) => a.stage === stageFilter) : applications;

  const setParam = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  return (
    <div className="max-w-[1600px]">
      <PageHeader
        title="Applications"
        subtitle={`${applications.length} tracked`}
        actions={
          <Link to="/applications/new" className={primaryButtonClass}>
            New application <Plus size={14} />
          </Link>
        }
      />

      <div className="mb-6 flex items-end justify-between gap-4">
        <div role="group" aria-label="View" className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {(['board', 'table'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setParam('view', option === 'board' ? '' : option)}
              aria-pressed={view === option}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                view === option ? 'bg-white text-slate-900 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {option === 'board' ? <Columns3 size={14} /> : <Rows3 size={14} />}
              {option === 'board' ? 'Board' : 'Table'}
            </button>
          ))}
        </div>
        {view === 'table' && (
          <div className="w-64 space-y-1">
            <label htmlFor="stage-filter" className={labelClass}>Filter by stage</label>
            <select id="stage-filter" className={inputClass} value={stageFilter} onChange={(e) => setParam('stage', e.target.value)}>
              <option value="">All stages</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {view === 'board' ? (
        <StageBoard applications={applications} stages={stages} onChangeStage={onChangeStage} />
      ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((application) => (
                  <tr key={application.id} className={`border-t border-slate-100 hover:bg-slate-50 ${CLOSED_STAGES.includes(application.stage) ? 'text-slate-400' : 'text-slate-900'}`}>
                    <td className="px-5 py-3 font-semibold">
                      <Link to={`/applications/${application.id}`} className="hover:underline">
                        {application.company || 'Untitled company'}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{application.role}</td>
                    <td className="px-5 py-3">
                      <StageSelect application={application} stages={stages} onChangeStage={onChangeStage} />
                    </td>
                    <td className="px-5 py-3">{application.appliedOn || '—'}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">No applications</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      )}
    </div>
  );
};

const StageBoard: React.FC<Props> = ({ applications, stages, onChangeStage }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const columns = stageColumns(applications, stages);
  const companyOf = (id: string | number) => applications.find((a) => a.id === id)?.company || 'Application';

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${companyOf(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${companyOf(active.id)} is over ${over.id}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `${companyOf(active.id)} moved to ${over.id}.` : `${companyOf(active.id)} was not moved.`),
    onDragCancel: ({ active }) => `Moving ${companyOf(active.id)} was cancelled.`,
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over) onChangeStage(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} accessibility={{ announcements }}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <StageLane
            key={column.stage}
            column={column}
            stages={columns.map((c) => c.stage)}
            onChangeStage={onChangeStage}
          />
        ))}
      </div>
    </DndContext>
  );
};

const StageLane: React.FC<{
  column: StageColumn;
  stages: string[];
  onChangeStage: (id: string, stage: string) => void;
}> = ({ column, stages, onChangeStage }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage });
  const closed = CLOSED_STAGES.includes(column.stage);

  return (
    <section
      ref={setNodeRef}
      aria-label={`${column.stage} column`}
      className={`w-72 shrink-0 rounded-2xl p-3 space-y-3 transition-colors ${
        isOver ? 'bg-accent/10 ring-2 ring-accent/40' : closed ? 'bg-slate-100/60' : 'bg-slate-100'
      }`}
    >
      <h2 className="flex justify-between items-center px-1 text-sm font-semibold text-slate-700">
        {column.stage}
        <span className="text-xs font-normal text-slate-500">{column.applications.length}</span>
      </h2>
      <ul className="space-y-2 min-h-16">
        {column.applications.map((application) => (
          <BoardCard
            key={application.id}
            application={application}
            stages={stages}
            muted={closed}
            onChangeStage={(stage) => onChangeStage(application.id, stage)}
          />
        ))}
      </ul>
    </section>
  );
};

const BoardCard: React.FC<{
  application: JobApplication;
  stages: string[];
  muted: boolean;
  onChangeStage: (stage: string) => void;
}> = ({ application, stages, muted, onChangeStage }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: application.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`flex items-start gap-2 bg-white rounded-xl border border-slate-200 p-3 shadow-sm ${
        isDragging ? 'relative z-10 shadow-lg opacity-90' : ''
      } ${muted ? 'opacity-70' : ''}`}
    >
      <span
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-hidden="true"
        title="Drag to another stage"
        className="mt-0.5 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </span>
      <div className="flex-1 min-w-0">
        <Link to={`/applications/${application.id}`} className="block group">
          <p className="text-sm font-semibold text-slate-900 truncate group-hover:underline">{application.company || 'Untitled company'}</p>
          <p className="text-xs text-slate-600 truncate">{application.role}</p>
          <p className="text-xs text-slate-400 mt-1">Applied {application.appliedOn || '—'}</p>
        </Link>
        <select
          aria-label={`Move ${application.company || 'application'} to stage`}
          value={application.stage}
          onChange={(e) => onChangeStage(e.target.value)}
          className="mt-2 w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600"
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>
    </li>
  );
};

export const StageSelect: React.FC<{
  application: JobApplication;
  stages: string[];
  onChangeStage: (id: string, stage: string) => void;
}> = ({ application, stages, onChangeStage }) => (
  <select
    aria-label={`Stage of ${application.company || 'application'}`}
    value={application.stage}
    onChange={(e) => onChangeStage(application.id, e.target.value)}
    className="text-xs pl-2 pr-1 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-transparent hover:border-slate-300 cursor-pointer"
  >
    {stageOptions(stages, application.stage).map((stage) => (
      <option key={stage} value={stage}>{stage}</option>
    ))}
  </select>
);

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

export default ApplicationsView;
