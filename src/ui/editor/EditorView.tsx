import React from 'react';
import { Briefcase, Code, FileJson, FileText, GraduationCap, Languages, Terminal, User, Users } from 'lucide-react';
import { NavLink } from 'react-router';
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

export const TABS = [
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
  activeSection: string;
  preview?: React.ReactNode;
}

export const CV_EDITOR_SECTIONS = TABS.filter((tab) => tab.id !== 'coverLetter');

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
  activeSection,
  preview,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
    <nav aria-label="CV sections" className="bg-white rounded-2xl p-3 border border-slate-200 h-fit space-y-1">
      {CV_EDITOR_SECTIONS.map((tab) => (
        <NavLink
          key={tab.id}
          to={`../${tab.id}`}
          relative="path"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`
          }
        >
          <tab.icon size={14} /> {tab.label}
        </NavLink>
      ))}
    </nav>

    <section className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[600px] min-w-0">
      {activeSection === 'json' ? (
        <JsonTab jsonInput={jsonInput} jsonError={jsonError} onChange={onJsonChange} onApply={onApplyJson} />
      ) : (
        <EditorSection
          section={activeSection}
          resume={resume}
          actions={actions}
          coverLetter={coverLetter}
          onCoverLetterFieldChange={onCoverLetterFieldChange}
          targetCompany={targetCompany}
          onTargetCompanyChange={onTargetCompanyChange}
        />
      )}
    </section>

    {preview && <div className="hidden xl:block min-w-0">{preview}</div>}
  </div>
);

export const EditorSection: React.FC<{
  section: string;
  resume: Resume;
  actions: ResumeActions;
  coverLetter: CoverLetter;
  onCoverLetterFieldChange: (field: keyof CoverLetter, value: string) => void;
  targetCompany: string;
  onTargetCompanyChange: (value: string) => void;
}> = ({ section, resume, actions, coverLetter, onCoverLetterFieldChange, targetCompany, onTargetCompanyChange }) => (
  <>
    {section === 'personal' && (
      <IdentityTab resume={resume} actions={actions} targetCompany={targetCompany} onTargetCompanyChange={onTargetCompanyChange} />
    )}
    {section === 'experiences' && <ExperienceTab resume={resume} actions={actions} />}
    {section === 'projects' && <ProjectsTab resume={resume} actions={actions} />}
    {section === 'education' && <EducationTab resume={resume} actions={actions} />}
    {section === 'abilities' && <AbilitiesTab resume={resume} actions={actions} />}
    {section === 'languages' && <LanguagesTab resume={resume} actions={actions} />}
    {section === 'technicalProficiency' && <TechStackTab resume={resume} actions={actions} />}
    {section === 'references' && <ReferencesTab resume={resume} actions={actions} />}
    {section === 'coverLetter' && (
      <CoverLetterTab
        coverLetter={coverLetter}
        onFieldChange={onCoverLetterFieldChange}
        targetCompany={targetCompany}
        onTargetCompanyChange={onTargetCompanyChange}
      />
    )}
  </>
);

export default EditorView;
