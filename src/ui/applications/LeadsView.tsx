import React, { useState } from 'react';
import { ExternalLink, Play, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { isWebUrl } from '../../domain/application/JobApplication';
import { JobLead, LeadDetails } from '../../domain/application/JobLead';
import PageHeader from '../shell/PageHeader';
import { buttonClass, inputClass, labelClass, primaryButtonClass } from './ApplicationsView';

interface Props {
  leads: JobLead[];
  onAdd: (details: LeadDetails) => void;
  onRemove: (id: string) => void;
}

const emptyLead = (): LeadDetails => ({ postingUrl: '', company: '', role: '' });

const LeadsView: React.FC<Props> = ({ leads, onAdd, onRemove }) => {
  const [lead, setLead] = useState(emptyLead);
  const [error, setError] = useState('');

  const update = (field: keyof LeadDetails, value: string) => setLead((current) => ({ ...current, [field]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWebUrl(lead.postingUrl)) {
      setError('Job posting URL must start with http:// or https://');
      return;
    }
    onAdd(lead);
    setLead(emptyLead());
    setError('');
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="To apply" subtitle={`${leads.length} saved jobs`} />

      <form onSubmit={submit} aria-label="Add a job to apply to" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
          <div className="space-y-1">
            <label htmlFor="lead-url" className={labelClass}>Job posting URL</label>
            <input id="lead-url" type="url" className={inputClass} value={lead.postingUrl} onChange={(e) => update('postingUrl', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="lead-company" className={labelClass}>Company</label>
            <input id="lead-company" className={inputClass} value={lead.company} onChange={(e) => update('company', e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="lead-role" className={labelClass}>Role</label>
            <input id="lead-role" className={inputClass} value={lead.role} onChange={(e) => update('role', e.target.value)} />
          </div>
          <button type="submit" className={primaryButtonClass}>
            <Plus size={14} /> Add
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>

      {leads.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing saved yet. Paste a job link above to keep it for later.</p>
      ) : (
        <ul className="space-y-2">
          {leads.map((saved) => {
            const company = saved.company || 'Untitled company';
            return (
              <li key={saved.id} className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
                <div className="basis-full sm:basis-0 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {company}
                    {saved.role && <span className="font-normal text-slate-600"> — {saved.role}</span>}
                  </p>
                  {isWebUrl(saved.postingUrl) && (
                    <a
                      href={saved.postingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent underline min-w-0"
                    >
                      <span className="truncate">{saved.postingUrl}</span> <ExternalLink size={12} className="shrink-0" />
                    </a>
                  )}
                </div>
                <Link to={`/applications/new?lead=${saved.id}`} aria-label={`Start application for ${company}`} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
                  <Play size={14} /> Start application
                </Link>
                <button onClick={() => onRemove(saved.id)} aria-label={`Remove ${company}`} className={buttonClass}>
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LeadsView;
