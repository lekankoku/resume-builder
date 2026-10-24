import React from 'react';
import {
  Briefcase,
  ClipboardList,
  Code,
  Eye,
  FileJson,
  FileText,
  GraduationCap,
  Languages,
  Settings2,
  Terminal,
  User,
  Users,
} from 'lucide-react';
import { CoverLetter } from '../../domain/coverLetter/CoverLetter';
import { Resume } from '../../domain/resume/Resume';
import { ResumeActions } from '../hooks/useResume';
import AbilitiesTab from './tabs/AbilitiesTab';
import CoverLetterTab from './tabs/CoverLetterTab';
import EducationTab from './tabs/EducationTab';
import ExperienceTab from './tabs/ExperienceTab';
import IdentityTab from './tabs/IdentityTab';
import JsonTab from './tabs/JsonTab';
import LanguagesTab from './tabs/LanguagesTab';
import ProjectsTab from './tabs/ProjectsTab';
import ReferencesTab from './tabs/ReferencesTab';
import TechStackTab from './tabs/TechStackTab';

const TABS = [
  { id: 'json', label: 'Raw JSON', icon: FileJson },
  { id: 'personal', label: 'Identity', icon: User },
  { id: 'experiences', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: Terminal },
  { id: 'abilities', label: 'Job related abilities', icon: Code },
  { id: 'technicalProficiency', label: 'Tech Stack', icon: Code },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'references', label: 'References', icon: Users },
  { id: 'coverLetter', label: 'Cover Letter', icon: FileText },
];

interface Props {
  resume: Resume;
  actions: ResumeActions;
  coverLetter: CoverLetter;
  onCoverLetterFieldChange: (field: keyof CoverLetter, value: string) => void;
  targetCompany: string;
  onTargetCompanyChange: (value: string) => void;
  jsonInput: string;
  jsonError: string | null;
  onJsonChange: (value: string) => void;
  onApplyJson: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPreviewResume: () => void;
  onPreviewCoverLetter: () => void;
  contextLabel: string;
  onOpenApplications: () => void;
}

const EditorView: React.FC<Props> = ({
  resume,
  actions,
  coverLetter,
  onCoverLetterFieldChange,
  targetCompany,
  onTargetCompanyChange,
  jsonInput,
  jsonError,
  onJsonChange,
  onApplyJson,
  activeTab,
  onTabChange,
  onPreviewResume,
  onPreviewCoverLetter,
  contextLabel,
  onOpenApplications,
}) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-6 font-sans">
    <header className="max-w-6xl w-full mb-8 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
          <Settings2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-display text-slate-900 leading-tight">Resume Editor</h1>
          <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">A4 High-Fidelity Standard</p>
          <p className="text-accent text-[10px] font-mono font-bold uppercase tracking-widest">Editing: {contextLabel}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onOpenApplications}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
        >
          Applications <ClipboardList size={14} />
        </button>
        <button
          onClick={onPreviewResume}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all uppercase tracking-widest text-[10px]"
        >
          Preview Resume <Eye size={14} />
        </button>
        <button
          onClick={onPreviewCoverLetter}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-xl shadow-lg hover:bg-accent/90 transition-all uppercase tracking-widest text-[10px]"
        >
          Preview Cover Letter <FileText size={14} />
        </button>
      </div>
    </header>

    <main className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
      <aside className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 h-fit space-y-1">
        <p className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest px-3 mb-2">Editor Sections</p>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === tab.id ? 'bg-accent text-white font-bold' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </aside>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[600px]">
        {activeTab === 'json' && (
          <JsonTab jsonInput={jsonInput} jsonError={jsonError} onChange={onJsonChange} onApply={onApplyJson} />
        )}
        {activeTab === 'personal' && (
          <IdentityTab resume={resume} actions={actions} targetCompany={targetCompany} onTargetCompanyChange={onTargetCompanyChange} />
        )}
        {activeTab === 'experiences' && <ExperienceTab resume={resume} actions={actions} />}
        {activeTab === 'projects' && <ProjectsTab resume={resume} actions={actions} />}
        {activeTab === 'education' && <EducationTab resume={resume} actions={actions} />}
        {activeTab === 'abilities' && <AbilitiesTab resume={resume} actions={actions} />}
        {activeTab === 'languages' && <LanguagesTab resume={resume} actions={actions} />}
        {activeTab === 'technicalProficiency' && <TechStackTab resume={resume} actions={actions} />}
        {activeTab === 'references' && <ReferencesTab resume={resume} actions={actions} />}
        {activeTab === 'coverLetter' && (
          <CoverLetterTab
            coverLetter={coverLetter}
            onFieldChange={onCoverLetterFieldChange}
            targetCompany={targetCompany}
            onTargetCompanyChange={onTargetCompanyChange}
          />
        )}
      </section>
    </main>
  </div>
);

export default EditorView;
