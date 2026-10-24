import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
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

export default SettingsView;
