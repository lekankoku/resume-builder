import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { ApplicationDetails, JobApplication } from '../../domain/application/JobApplication';
import { CLOSED_STAGES } from '../../domain/application/stages';
import PageHeader from '../shell/PageHeader';

interface Props {
  applications: JobApplication[];
  stages: string[];
}

export const inputClass =
  'w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none';
export const labelClass = 'text-[10px] font-mono font-black uppercase text-slate-400';
export const buttonClass =
  'flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]';
export const primaryButtonClass =
  'flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all uppercase tracking-widest text-[10px]';

const ApplicationsView: React.FC<Props> = ({ applications, stages }) => {
  const [stageFilter, setStageFilter] = useState('');
  const visible = stageFilter ? applications.filter((a) => a.stage === stageFilter) : applications;

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Applications"
        subtitle={`${applications.length} tracked`}
        actions={
          <Link to="/applications/new" className={primaryButtonClass}>
            New application <Plus size={14} />
          </Link>
        }
      />

      <div className="mb-4 max-w-xs space-y-1">
        <label htmlFor="stage-filter" className={labelClass}>Filter by stage</label>
        <select id="stage-filter" className={inputClass} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>

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
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{application.stage}</span>
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

export default ApplicationsView;
