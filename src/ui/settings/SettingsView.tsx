import React from 'react';
import { ChevronLeft, Settings2 } from 'lucide-react';
import { Profile } from '../../domain/resume/Resume';
import { buttonClass, inputClass, labelClass } from '../applications/ApplicationsView';

interface Props {
  profile: Profile;
  onChange: (field: keyof Profile, value: string) => void;
  onBack: () => void;
}

const SettingsView: React.FC<Props> = ({ profile, onChange, onBack }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-6 font-sans">
    <header className="max-w-3xl w-full mb-8 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
          <Settings2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-display text-slate-900 leading-tight">Settings</h1>
          <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">Used on every CV and cover letter</p>
        </div>
      </div>
      <button onClick={onBack} className={buttonClass}>
        <ChevronLeft size={14} /> Back
      </button>
    </header>

    <main className="max-w-3xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
      <h2 className="text-xl font-display text-slate-900 border-b pb-4">Identity Attributes</h2>
      <div className="grid grid-cols-2 gap-6">
        {(Object.keys(profile) as (keyof Profile)[]).map((key) => (
          <div key={key} className="space-y-1">
            <label htmlFor={`profile-${key}`} className={labelClass}>{key}</label>
            <input id={`profile-${key}`} className={inputClass} value={profile[key]} onChange={(e) => onChange(key, e.target.value)} />
          </div>
        ))}
      </div>
    </main>
  </div>
);

export default SettingsView;
