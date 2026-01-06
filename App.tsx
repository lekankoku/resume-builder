
import React, { useState, useEffect } from 'react';
import { resumeData as initialData } from './resumeData';
import { ResumeData } from './types';
import { 
  User, 
  Briefcase, 
  Terminal, 
  Code, 
  GraduationCap, 
  Languages, 
  Users, 
  Eye, 
  FileJson,
  Printer,
  ChevronLeft,
  Settings2,
  Globe,
  Linkedin,
  Github,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ResumeData>(initialData);
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify(initialData, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    setJsonInput(JSON.stringify(data, null, 2));
  }, [data]);

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setData(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const updateField = (section: keyof ResumeData | 'personal', field: string, value: any, index?: number) => {
    const newData = { ...data };
    if (section === 'personal') {
      (newData.personal as any)[field] = value;
    } else if (Array.isArray(newData[section as keyof ResumeData]) && typeof index === 'number') {
      const array = [...(newData[section as keyof ResumeData] as any[])];
      if (typeof array[index] === 'object') {
        array[index] = { ...array[index], [field]: value };
      } else {
        array[index] = value;
      }
      (newData as any)[section] = array;
    }
    setData(newData);
  };

  const cleanUrl = (url: string) => {
    if (!url) return '';
    return url.replace(/\[.*?\]\((.*?)\)/g, '$1').trim();
  };

  const cleanPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  };

  const displayUrl = (url: string) => {
    if (!url) return '';
    const cleaned = cleanUrl(url);
    return cleaned.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-6 font-sans">
        <header className="max-w-6xl w-full mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Settings2 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-display text-slate-900 leading-tight">Resume Editor</h1>
              <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">A4 High-Fidelity Standard</p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all uppercase tracking-widest text-[10px]"
          >
            Preview Document <Eye size={14} />
          </button>
        </header>

        <main className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 h-fit space-y-1">
            <p className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest px-3 mb-2">Editor Sections</p>
            {[
              { id: 'json', label: 'Raw JSON', icon: FileJson },
              { id: 'personal', label: 'Identity', icon: User },
              { id: 'experiences', label: 'Experience', icon: Briefcase },
              { id: 'projects', label: 'Projects', icon: Terminal },
              { id: 'abilities', label: 'Job related abilities', icon: Code },
              { id: 'education', label: 'Education', icon: GraduationCap },
              { id: 'languages', label: 'Languages', icon: Languages },
              { id: 'references', label: 'References', icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-display text-slate-900">Source Interface</h2>
                  <button onClick={handleApplyJson} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">Update Data</button>
                </div>
                {jsonError && <div className="mb-4 text-red-500 text-xs font-mono bg-red-50 p-3 rounded-lg border border-red-100">{jsonError}</div>}
                <textarea 
                  className="flex-1 w-full p-4 bg-slate-50 text-slate-800 font-mono text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent outline-none min-h-[500px]"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-xl font-display text-slate-900 border-b pb-4">Identity Attributes</h2>
                <div className="grid grid-cols-2 gap-6">
                  {Object.keys(data.personal).map(key => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-mono font-black uppercase text-slate-400">{key}</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                        value={(data.personal as any)[key]} 
                        onChange={(e) => updateField('personal', key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['experiences', 'projects', 'education', 'abilities', 'languages', 'references'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-40">
                <Settings2 size={48} className="text-slate-200 mb-4" />
                <h3 className="text-lg font-display text-slate-900 mb-2">{activeTab.toUpperCase()} Data</h3>
                <p className="max-w-xs text-sm text-slate-500 mb-6 leading-relaxed">Please use the <button onClick={() => setActiveTab('json')} className="text-accent font-bold hover:underline">Raw JSON</button> tab to directly modify this section. Form-based editing for this module is coming soon.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // Preview Mode
  return (
    <div className="flex flex-col items-center min-h-screen pb-20 print:pb-0 bg-slate-100/30 font-sans">
      <nav className="no-print sticky top-0 z-50 w-full flex justify-center py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 mb-10">
        <div className="max-w-6xl w-full flex justify-between px-6">
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]"
          >
            <ChevronLeft size={14} /> Back to Editor
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-8 py-2.5 bg-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all uppercase tracking-widest text-[10px]"
          >
            Print to PDF <Printer size={14} />
          </button>
        </div>
      </nav>

      <div className="resume-viewport">
        <article className="resume-container flex flex-col text-slate-900">
          {/* Main Header Block */}
          <header className="mb-10 pb-10 border-b-2 border-slate-900">
            <div className="flex justify-between items-start mb-8">
              <div className="pt-2">
                <h1 className="text-6xl font-display text-slate-900 leading-tight mb-2 uppercase tracking-tighter">
                  {data.personal.name}
                </h1>
                <p className="text-2xl font-bold uppercase tracking-[0.2em] text-accent">{data.personal.title}</p>
              </div>
              
              {data.personal.photoUrl && (
                <div className="no-print">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm">
                    <img src={cleanUrl(data.personal.photoUrl)} alt="" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-12">
              <div className="space-y-1.5">
                <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
                  <Mail size={12} className="text-accent" /> <a href={`mailto:${cleanUrl(data.personal.email)}`} className="underline hover:text-accent decoration-accent/30">{displayUrl(data.personal.email)}</a>
                </p>
                <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
                  <Phone size={12} className="text-accent" /> <a href={`tel:${cleanPhone(data.personal.phone)}`} className="underline hover:text-accent decoration-accent/30">{data.personal.phone}</a>
                </p>
                <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
                  <MapPin size={12} className="text-accent" /> {data.personal.residence}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
                  <Globe size={12} className="text-accent" /> <a href={cleanUrl(data.personal.website)} target="_blank" rel="noopener" className="underline hover:text-accent decoration-accent/30">{displayUrl(data.personal.website)}</a>
                </p>
                <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
                  <Linkedin size={12} className="text-accent" /> <a href={cleanUrl(data.personal.linkedin)} target="_blank" rel="noopener" className="underline hover:text-accent decoration-accent/30">{displayUrl(data.personal.linkedin)}</a>
                </p>
                <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
                  <Github size={12} className="text-accent" /> <a href={cleanUrl(data.personal.github)} target="_blank" rel="noopener" className="underline hover:text-accent decoration-accent/30">{displayUrl(data.personal.github)}</a>
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-10 flex-1">
            {/* Main Content Column */}
            <main className="col-span-8 space-y-10">
              
              {/* Experience Section */}
              <section>
                <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-6 flex items-center gap-4">
                  Experience <div className="flex-1 h-[2px] bg-slate-900" />
                </h2>
                <div className="space-y-8">
                  {data.experiences.map((exp, idx) => (
                    <div key={idx} className="avoid-break">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-lg font-display text-slate-900 uppercase tracking-tight">{exp.company}</h3>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{exp.period}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-slate-600">{exp.role}</span>
                        <span className="text-slate-200">|</span>
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{exp.location}</span>
                      </div>
                      <ul className="list-disc ml-4 space-y-1.5 text-[13px] leading-relaxed text-slate-600 marker:text-accent">
                        {exp.bullets.map((b, bi) => <li key={bi} className="pl-1">{b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Projects Section */}
              <section className="avoid-break">
                <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-6 flex items-center gap-4">
                  Key Projects <div className="flex-1 h-[2px] bg-slate-900" />
                </h2>
                <div className="space-y-6">
                  {data.projects.map((proj, idx) => (
                    <div key={idx} className="p-5 border border-slate-100 rounded-xl bg-slate-50/20">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-md font-display text-slate-900 uppercase">{proj.title}</h3>
                        <span className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-widest">{proj.company}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 italic mb-3 opacity-80">{proj.scope}</p>
                      <ul className="space-y-1.5 text-[12.5px] text-slate-600">
                        {proj.bullets.map((b, bi) => <li key={bi} className="flex gap-2 leading-tight"><span className="text-accent font-black">›</span> {b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education (Academic) - Main Column as requested */}
              <section className="avoid-break">
                <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-6 flex items-center gap-4">
                  Academic <div className="flex-1 h-[2px] bg-slate-900" />
                </h2>
                <div className="space-y-6">
                  {data.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start group">
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-display text-slate-900 leading-tight uppercase tracking-tight">{edu.degree}</h3>
                        <p className="text-sm font-bold text-accent uppercase tracking-wide">{edu.institution}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{edu.period}</span>
                        <span className="text-[10px] text-slate-300 uppercase font-mono font-black">{edu.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>

            {/* Sidebar Column */}
            <aside className="col-span-4 space-y-10 border-l border-slate-50 pl-8">
              
              <section>
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-6 uppercase tracking-[0.1em]">Job related abilities</h2>
                <div className="space-y-8">
                  {data.abilities.map((ability, idx) => (
                    <div key={idx} className="avoid-break">
                      <h3 className="text-[11px] font-mono font-black text-slate-900 uppercase border-b border-slate-900/5 pb-2 mb-3 tracking-tighter">{ability.title}</h3>
                      <ul className="space-y-2 text-[12px] text-slate-500 italic font-medium leading-snug">
                        {ability.bullets.map((b, bi) => <li key={bi} className="flex gap-2"><span className="text-accent font-black">•</span> {b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className="avoid-break">
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-6">Tech Stack</h2>
                <div className="space-y-5">
                  {data.technicalProficiency.map((tp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <h4 className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">{tp.category}</h4>
                      <p className="text-[12px] font-bold text-slate-700 leading-tight tracking-tight">{tp.skills}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="avoid-break">
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-6">Languages</h2>
                <div className="space-y-2.5">
                  {data.languages.map((lang, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[12px] border-b border-slate-50 pb-1">
                      <span className="font-bold text-slate-800 uppercase tracking-tighter">{lang.name}</span>
                      <span className="text-accent text-[9px] font-mono font-bold uppercase">{lang.level}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="avoid-break">
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-6">References</h2>
                <div className="space-y-6">
                  {data.references.map((ref, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="text-[13px] font-bold text-slate-900 leading-none">{ref.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight">{ref.role}</p>
                      <p className="text-[10px] font-black text-accent uppercase tracking-tighter">{ref.company}</p>
                      <a href={cleanUrl(ref.linkedin)} target="_blank" rel="noopener" className="underline text-slate-400 text-[9px] hover:text-accent decoration-slate-200 uppercase font-mono font-bold">LinkedIn Profile</a>
                    </div>
                  ))}
                </div>
              </section>

            </aside>
          </div>

          {/* New Fixed Print Footer */}
          <div className="print-footer hidden flex justify-between items-end">
            <a 
              href={cleanUrl(data.personal.website)} 
              target="_blank" 
              rel="noopener" 
              className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400 underline decoration-slate-200"
            >
              {displayUrl(data.personal.website)}
            </a>
            <span className="page-counter text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400"></span>
          </div>
        </article>
      </div>
    </div>
  );
};

export default App;
