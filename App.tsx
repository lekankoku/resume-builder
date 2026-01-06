
import React, { useState, useEffect } from 'react';
import { resumeData as initialData } from './resumeData';
import { ResumeData, PersonalInfo } from './types';
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
  Phone,
  GripVertical,
  Plus,
  Trash2,
  Edit,
  FileText
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Default personal info (excluding title which comes from JSON)
const getDefaultPersonalInfo = (): Omit<PersonalInfo, 'title'> => {
  const { title, ...rest } = initialData.personal;
  return rest;
};

const STORAGE_KEY = 'resume-identity-attributes';
const STORAGE_KEY_REFERENCES = 'resume-references';
const STORAGE_KEY_LANGUAGES = 'resume-languages';
const STORAGE_KEY_EDUCATION = 'resume-education';
const STORAGE_KEY_COVER_LETTER = 'resume-cover-letter';
const STORAGE_KEY_TARGET_COMPANY = 'resume-target-company';

// Sortable Item Component
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute left-0 top-0 bottom-0 flex items-start pt-4 -ml-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
        >
          <GripVertical size={16} />
        </button>
      </div>
      {children}
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<ResumeData>(() => {
    // Load personal info from localStorage (except title)
    // If no localStorage exists, use data from resumeData.ts as defaults
    const stored = localStorage.getItem(STORAGE_KEY);
    const personalData = stored ? JSON.parse(stored) : getDefaultPersonalInfo();
    
    // Load references from localStorage
    const storedReferences = localStorage.getItem(STORAGE_KEY_REFERENCES);
    const referencesData = storedReferences ? JSON.parse(storedReferences) : initialData.references;
    
    // Load languages from localStorage
    const storedLanguages = localStorage.getItem(STORAGE_KEY_LANGUAGES);
    const languagesData = storedLanguages ? JSON.parse(storedLanguages) : initialData.languages;
    
    // Load education from localStorage
    const storedEducation = localStorage.getItem(STORAGE_KEY_EDUCATION);
    const educationData = storedEducation ? JSON.parse(storedEducation) : initialData.education;
    
    return {
      ...initialData,
      personal: {
        ...personalData,
        title: initialData.personal.title // Title always comes from JSON
      },
      references: referencesData,
      languages: languagesData,
      education: educationData
    };
  });
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify(initialData, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [printVariant, setPrintVariant] = useState<'strict-2-page' | 'continuous'>('continuous');
  const [viewMode, setViewMode] = useState<'resume' | 'cover-letter'>('resume');
  const [targetCompany, setTargetCompany] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_TARGET_COMPANY);
    return stored || '';
  });
  const [coverLetter, setCoverLetter] = useState<{
    recipientName: string;
    recipientTitle: string;
    companyAddress: string;
    date: string;
    body: string;
  }>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_COVER_LETTER);
    return stored ? JSON.parse(stored) : {
      recipientName: '',
      recipientTitle: '',
      companyAddress: '',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      body: ''
    };
  });

  // Save personal info to localStorage whenever it changes (except title)
  useEffect(() => {
    const { title, ...personalWithoutTitle } = data.personal;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personalWithoutTitle));
  }, [data.personal]);

  // Save references to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REFERENCES, JSON.stringify(data.references));
  }, [data.references]);

  // Save languages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANGUAGES, JSON.stringify(data.languages));
  }, [data.languages]);

  // Save education to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EDUCATION, JSON.stringify(data.education));
  }, [data.education]);

  // Save cover letter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COVER_LETTER, JSON.stringify(coverLetter));
  }, [coverLetter]);

  // Save target company to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TARGET_COMPANY, targetCompany);
  }, [targetCompany]);

  useEffect(() => {
    setJsonInput(JSON.stringify(data, null, 2));
  }, [data]);

  // Update document title for print filename
  useEffect(() => {
    const companyPart = targetCompany ? ` (${targetCompany})` : '';
    if (viewMode === 'resume') {
      document.title = `${data.personal.name} (${data.personal.title})${companyPart}`;
    } else {
      document.title = `${data.personal.name} - Cover Letter${companyPart}`;
    }
  }, [data.personal.name, data.personal.title, viewMode, targetCompany]);

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      // Only update title from JSON, keep other personal fields, references, languages, and education from local storage
      setData({
        ...parsed,
        personal: {
          ...data.personal, // Keep existing personal data from local storage
          title: parsed.personal?.title || data.personal.title // Only update title from JSON
        },
        references: data.references, // Keep references from local storage
        languages: data.languages, // Keep languages from local storage
        education: data.education // Keep education from local storage
      });
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const updateCoverLetterField = (field: keyof typeof coverLetter, value: string) => {
    setCoverLetter(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (section: keyof ResumeData, index: number, field: string, value: any) => {
    const newData = { ...data };
    const array = [...(newData[section] as any[])];
    array[index] = { ...array[index], [field]: value };
    (newData as any)[section] = array;
    setData(newData);
  };

  const updateNestedArrayField = (section: keyof ResumeData, index: number, field: string, itemIndex: number, value: any) => {
    const newData = { ...data };
    const array = [...(newData[section] as any[])];
    const item = { ...array[index] };
    const nestedArray = [...item[field]];
    nestedArray[itemIndex] = value;
    item[field] = nestedArray;
    array[index] = item;
    (newData as any)[section] = array;
    setData(newData);
  };

  const addArrayItem = (section: keyof ResumeData, template: any) => {
    const newData = { ...data };
    const array = [...(newData[section] as any[])];
    array.push(template);
    (newData as any)[section] = array;
    setData(newData);
  };

  const removeArrayItem = (section: keyof ResumeData, index: number) => {
    const newData = { ...data };
    const array = [...(newData[section] as any[])];
    array.splice(index, 1);
    (newData as any)[section] = array;
    setData(newData);
  };

  const addNestedArrayItem = (section: keyof ResumeData, index: number, field: string, value: string) => {
    const newData = { ...data };
    const array = [...(newData[section] as any[])];
    const item = { ...array[index] };
    item[field] = [...item[field], value];
    array[index] = item;
    (newData as any)[section] = array;
    setData(newData);
  };

  const removeNestedArrayItem = (section: keyof ResumeData, index: number, field: string, itemIndex: number) => {
    const newData = { ...data };
    const array = [...(newData[section] as any[])];
    const item = { ...array[index] };
    const nestedArray = [...item[field]];
    nestedArray.splice(itemIndex, 1);
    item[field] = nestedArray;
    array[index] = item;
    (newData as any)[section] = array;
    setData(newData);
  };

  const handleDragEnd = (section: keyof ResumeData) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newData = { ...data };
      const array = newData[section] as any[];
      const oldIndex = array.findIndex((_, idx) => `${section}-${idx}` === active.id);
      const newIndex = array.findIndex((_, idx) => `${section}-${idx}` === over.id);
      (newData as any)[section] = arrayMove(array, oldIndex, newIndex);
      setData(newData);
    }
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
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setViewMode('resume');
              setIsEditing(false);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all uppercase tracking-widest text-[10px]"
          >
            Preview Resume <Eye size={14} />
          </button>
          <button 
            onClick={() => {
              setViewMode('cover-letter');
              setIsEditing(false);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-xl shadow-lg hover:bg-accent/90 transition-all uppercase tracking-widest text-[10px]"
          >
            Preview Cover Letter <FileText size={14} />
          </button>
        </div>
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
              { id: 'technicalProficiency', label: 'Tech Stack', icon: Code },
              { id: 'education', label: 'Education', icon: GraduationCap },
              { id: 'languages', label: 'Languages', icon: Languages },
              { id: 'references', label: 'References', icon: Users },
              { id: 'coverLetter', label: 'Cover Letter', icon: FileText },
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
                
                {/* Target Company Field */}
                <div className="p-6 bg-accent/5 border-2 border-accent/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-accent" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Target Company</h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Enter the company you're applying to. This will be added to the filename when you print your resume or cover letter.
                  </p>
                  <input 
                    className="w-full p-4 bg-white border-2 border-accent/30 rounded-lg text-base font-bold focus:ring-2 focus:ring-accent outline-none"
                    value={targetCompany} 
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g., Google, Microsoft, Apple..."
                  />
                  {targetCompany && (
                    <div className="text-xs text-slate-500 space-y-1 pt-2">
                      <p className="font-mono">📄 Resume: <span className="font-bold text-accent">{data.personal.name} ({data.personal.title}) ({targetCompany})</span></p>
                      <p className="font-mono">📝 Cover Letter: <span className="font-bold text-accent">{data.personal.name} - Cover Letter ({targetCompany})</span></p>
                    </div>
                  )}
                </div>

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

            {activeTab === 'experiences' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Experience History</h2>
                  <button
                    onClick={() => addArrayItem('experiences', { role: '', company: '', location: '', period: '', bullets: [''] })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Experience
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('experiences')}>
                  <SortableContext items={data.experiences.map((_, idx) => `experiences-${idx}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {data.experiences.map((exp, idx) => (
                        <SortableItem key={`experiences-${idx}`} id={`experiences-${idx}`}>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Experience #{idx + 1}</h3>
                              <button
                                onClick={() => removeArrayItem('experiences', idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Role</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={exp.role}
                                  onChange={(e) => updateArrayField('experiences', idx, 'role', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Company</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={exp.company}
                                  onChange={(e) => updateArrayField('experiences', idx, 'company', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Location</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={exp.location}
                                  onChange={(e) => updateArrayField('experiences', idx, 'location', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Period</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={exp.period}
                                  onChange={(e) => updateArrayField('experiences', idx, 'period', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Highlights</label>
                                <button
                                  onClick={() => addNestedArrayItem('experiences', idx, 'bullets', '')}
                                  className="text-[10px] font-bold text-accent hover:text-accent/80 uppercase tracking-wider"
                                >
                                  + Add Bullet
                                </button>
                              </div>
                              {exp.bullets.map((bullet, bIdx) => (
                                <div key={bIdx} className="flex gap-2">
                                  <textarea
                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none min-h-[60px]"
                                    value={bullet}
                                    onChange={(e) => updateNestedArrayField('experiences', idx, 'bullets', bIdx, e.target.value)}
                                  />
                                  <button
                                    onClick={() => removeNestedArrayItem('experiences', idx, 'bullets', bIdx)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Key Projects</h2>
                  <button
                    onClick={() => addArrayItem('projects', { title: '', company: '', scope: '', bullets: [''] })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Project
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('projects')}>
                  <SortableContext items={data.projects.map((_, idx) => `projects-${idx}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {data.projects.map((proj, idx) => (
                        <SortableItem key={`projects-${idx}`} id={`projects-${idx}`}>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Project #{idx + 1}</h3>
                              <button
                                onClick={() => removeArrayItem('projects', idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Title</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={proj.title}
                                  onChange={(e) => updateArrayField('projects', idx, 'title', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Company</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={proj.company}
                                  onChange={(e) => updateArrayField('projects', idx, 'company', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-black uppercase text-slate-400">Scope</label>
                              <input
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                value={proj.scope}
                                onChange={(e) => updateArrayField('projects', idx, 'scope', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Details</label>
                                <button
                                  onClick={() => addNestedArrayItem('projects', idx, 'bullets', '')}
                                  className="text-[10px] font-bold text-accent hover:text-accent/80 uppercase tracking-wider"
                                >
                                  + Add Detail
                                </button>
                              </div>
                              {proj.bullets.map((bullet, bIdx) => (
                                <div key={bIdx} className="flex gap-2">
                                  <textarea
                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none min-h-[60px]"
                                    value={bullet}
                                    onChange={(e) => updateNestedArrayField('projects', idx, 'bullets', bIdx, e.target.value)}
                                  />
                                  <button
                                    onClick={() => removeNestedArrayItem('projects', idx, 'bullets', bIdx)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Academic Background</h2>
                  <button
                    onClick={() => addArrayItem('education', { degree: '', institution: '', location: '', period: '' })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Education
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('education')}>
                  <SortableContext items={data.education.map((_, idx) => `education-${idx}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {data.education.map((edu, idx) => (
                        <SortableItem key={`education-${idx}`} id={`education-${idx}`}>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Education #{idx + 1}</h3>
                              <button
                                onClick={() => removeArrayItem('education', idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Degree</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={edu.degree}
                                  onChange={(e) => updateArrayField('education', idx, 'degree', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Institution</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={edu.institution}
                                  onChange={(e) => updateArrayField('education', idx, 'institution', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Location</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={edu.location}
                                  onChange={(e) => updateArrayField('education', idx, 'location', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Period</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={edu.period}
                                  onChange={(e) => updateArrayField('education', idx, 'period', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'abilities' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Job Related Abilities</h2>
                  <button
                    onClick={() => addArrayItem('abilities', { title: '', bullets: [''] })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Ability
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('abilities')}>
                  <SortableContext items={data.abilities.map((_, idx) => `abilities-${idx}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {data.abilities.map((ability, idx) => (
                        <SortableItem key={`abilities-${idx}`} id={`abilities-${idx}`}>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Ability #{idx + 1}</h3>
                              <button
                                onClick={() => removeArrayItem('abilities', idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono font-black uppercase text-slate-400">Title</label>
                              <input
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                value={ability.title}
                                onChange={(e) => updateArrayField('abilities', idx, 'title', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Points</label>
                                <button
                                  onClick={() => addNestedArrayItem('abilities', idx, 'bullets', '')}
                                  className="text-[10px] font-bold text-accent hover:text-accent/80 uppercase tracking-wider"
                                >
                                  + Add Point
                                </button>
                              </div>
                              {ability.bullets.map((bullet, bIdx) => (
                                <div key={bIdx} className="flex gap-2">
                                  <input
                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                    value={bullet}
                                    onChange={(e) => updateNestedArrayField('abilities', idx, 'bullets', bIdx, e.target.value)}
                                  />
                                  <button
                                    onClick={() => removeNestedArrayItem('abilities', idx, 'bullets', bIdx)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'languages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Language Proficiency</h2>
                  <button
                    onClick={() => addArrayItem('languages', { name: '', level: '' })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Language
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('languages')}>
                  <SortableContext items={data.languages.map((_, idx) => `languages-${idx}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {data.languages.map((lang, idx) => (
                        <SortableItem key={`languages-${idx}`} id={`languages-${idx}`}>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Language #{idx + 1}</h3>
                              <button
                                onClick={() => removeArrayItem('languages', idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Name</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={lang.name}
                                  onChange={(e) => updateArrayField('languages', idx, 'name', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Level</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={lang.level}
                                  onChange={(e) => updateArrayField('languages', idx, 'level', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'technicalProficiency' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Technical Proficiency</h2>
                  <button
                    onClick={() => addArrayItem('technicalProficiency', { category: '', skills: '' })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Category
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('technicalProficiency')}>
                  <SortableContext items={data.technicalProficiency.map((_, idx) => `technicalProficiency-${idx}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {data.technicalProficiency.map((tech, idx) => (
                        <SortableItem key={`technicalProficiency-${idx}`} id={`technicalProficiency-${idx}`}>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Category #{idx + 1}</h3>
                              <button
                                onClick={() => removeArrayItem('technicalProficiency', idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Category</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={tech.category}
                                  onChange={(e) => updateArrayField('technicalProficiency', idx, 'category', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Skills</label>
                                <textarea
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none min-h-[80px]"
                                  value={tech.skills}
                                  onChange={(e) => updateArrayField('technicalProficiency', idx, 'skills', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'references' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Professional References</h2>
                  <button
                    onClick={() => addArrayItem('references', { name: '', role: '', company: '', linkedin: '' })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Reference
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('references')}>
                  <SortableContext items={data.references.map((_, idx) => `references-${idx}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                      {data.references.map((ref, idx) => (
                        <SortableItem key={`references-${idx}`} id={`references-${idx}`}>
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Reference #{idx + 1}</h3>
                              <button
                                onClick={() => removeArrayItem('references', idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Name</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={ref.name}
                                  onChange={(e) => updateArrayField('references', idx, 'name', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Role</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={ref.role}
                                  onChange={(e) => updateArrayField('references', idx, 'role', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">Company</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={ref.company}
                                  onChange={(e) => updateArrayField('references', idx, 'company', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-black uppercase text-slate-400">LinkedIn</label>
                                <input
                                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                  value={ref.linkedin}
                                  onChange={(e) => updateArrayField('references', idx, 'linkedin', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {activeTab === 'coverLetter' && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-display text-slate-900">Cover Letter</h2>
                  <p className="text-sm text-slate-500 mt-2">Create a professional cover letter to accompany your resume.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-black uppercase text-slate-400">Date</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                      value={coverLetter.date}
                      onChange={(e) => updateCoverLetterField('date', e.target.value)}
                      placeholder="January 6, 2026"
                    />
                  </div>

                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recipient Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-black uppercase text-slate-400">Recipient Name</label>
                        <input
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                          value={coverLetter.recipientName}
                          onChange={(e) => updateCoverLetterField('recipientName', e.target.value)}
                          placeholder="Hiring Manager or Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-black uppercase text-slate-400">Recipient Title</label>
                        <input
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                          value={coverLetter.recipientTitle}
                          onChange={(e) => updateCoverLetterField('recipientTitle', e.target.value)}
                          placeholder="Senior Hiring Manager"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-mono font-black uppercase text-slate-400">Company Name</label>
                        <input
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                          value={targetCompany}
                          onChange={(e) => setTargetCompany(e.target.value)}
                          placeholder="Company Inc."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          💡 This is shared with your resume. Set it once in the Identity tab.
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-mono font-black uppercase text-slate-400">Company Address</label>
                        <input
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                          value={coverLetter.companyAddress}
                          onChange={(e) => updateCoverLetterField('companyAddress', e.target.value)}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-black uppercase text-slate-400">Letter Body</label>
                    <p className="text-xs text-slate-500 mb-2">Paste or write your cover letter content here.</p>
                    <textarea
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none min-h-[400px] leading-relaxed"
                      value={coverLetter.body}
                      onChange={(e) => updateCoverLetterField('body', e.target.value)}
                      placeholder="Dear [Recipient Name],&#10;&#10;I am writing to express my strong interest in the [Position] role at [Company]. With [X] years of experience in [field], I am confident that my skills and background make me an excellent fit for this position.&#10;&#10;Throughout my career, I have...&#10;&#10;I am excited about the opportunity to contribute to [Company]'s mission and would welcome the chance to discuss how my experience aligns with your team's needs.&#10;&#10;Thank you for your consideration.&#10;&#10;Sincerely,&#10;[Your Name]"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // Preview Mode - Cover Letter
  if (!isEditing && viewMode === 'cover-letter') {
    return (
      <div className="flex flex-col items-center min-h-screen pb-20 print:pb-0 bg-slate-100/30 font-sans">
        <nav className="no-print sticky top-0 z-50 w-full flex justify-center py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 mb-10">
          <div className="max-w-6xl w-full flex justify-between items-center px-6">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]"
            >
              <ChevronLeft size={14} /> Back to Editor
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('resume')}
                className="px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all bg-white text-slate-500 hover:text-slate-900"
              >
                View Resume
              </button>
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">|</span>
              <span className="px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-accent text-white shadow-md">
                Cover Letter
              </span>
            </div>

            <button 
              onClick={() => {
                const companyPart = targetCompany ? ` (${targetCompany})` : '';
                document.title = `${data.personal.name} - Cover Letter${companyPart}`;
                window.print();
              }}
              className="flex items-center gap-2 px-8 py-2.5 bg-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all uppercase tracking-widest text-[10px]"
            >
              Print to PDF <Printer size={14} />
            </button>
          </div>
        </nav>

        <div className="resume-viewport">
          <article className="resume-container continuous flex flex-col text-slate-900">
            {/* Header with Contact Info */}
            <header className="mb-10">
              <h1 className="text-4xl font-display text-slate-900 leading-tight mb-1 uppercase tracking-tighter">
                {data.personal.name}
              </h1>
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 mb-6">
                <span className="flex items-center gap-1.5">
                  <Mail size={11} className="text-accent" /> {displayUrl(data.personal.email)}
                </span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1.5">
                  <Phone size={11} className="text-accent" /> {data.personal.phone}
                </span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-accent" /> {data.personal.residence}
                </span>
              </div>
              <div className="h-[2px] bg-slate-900 w-full"></div>
            </header>

            {/* Date and Recipient Info */}
            <div className="mb-10 space-y-6">
              <p className="text-sm text-slate-700 font-medium">{coverLetter.date}</p>
              
              {(coverLetter.recipientName || coverLetter.recipientTitle || targetCompany || coverLetter.companyAddress) && (
                <div className="text-sm text-slate-700 space-y-0.5">
                  {coverLetter.recipientName && <p className="font-bold">{coverLetter.recipientName}</p>}
                  {coverLetter.recipientTitle && <p>{coverLetter.recipientTitle}</p>}
                  {targetCompany && <p className="font-bold text-accent">{targetCompany}</p>}
                  {coverLetter.companyAddress && <p>{coverLetter.companyAddress}</p>}
                </div>
              )}
            </div>

            {/* Letter Body */}
            <div className="flex-1 space-y-4 text-[14px] leading-relaxed text-slate-700">
              {coverLetter.body ? (
                coverLetter.body.split('\n').map((paragraph, idx) => (
                  paragraph.trim() ? (
                    <p key={idx} className="text-justify">{paragraph}</p>
                  ) : (
                    <div key={idx} className="h-4"></div>
                  )
                ))
              ) : (
                <div className="text-slate-400 italic text-center py-20">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No cover letter content yet.</p>
                  <p className="text-sm mt-2">Go back to the editor to add your cover letter.</p>
                </div>
              )}
            </div>

            {/* Footer with Website */}
            <div className="print-footer hidden mt-10 pt-6 border-t border-slate-100 flex justify-between items-end">
              <a 
                href={cleanUrl(data.personal.website)} 
                target="_blank" 
                rel="noopener" 
                className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400 underline decoration-slate-200"
              >
                {displayUrl(data.personal.website)}
              </a>
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Preview Mode - Resume
  return (
    <div className="flex flex-col items-center min-h-screen pb-20 print:pb-0 bg-slate-100/30 font-sans">
      <nav className="no-print sticky top-0 z-50 w-full flex justify-center py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 mb-10">
        <div className="max-w-6xl w-full flex justify-between items-center px-6">
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]"
          >
            <ChevronLeft size={14} /> Back to Editor
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-accent text-white shadow-md">
                Resume
              </span>
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">|</span>
              <button
                onClick={() => setViewMode('cover-letter')}
                className="px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all bg-white text-slate-500 hover:text-slate-900"
              >
                View Cover Letter
              </button>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest px-2">Print Mode:</span>
              <button
                onClick={() => setPrintVariant('continuous')}
                className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                  printVariant === 'continuous' 
                    ? 'bg-accent text-white shadow-md' 
                    : 'bg-white text-slate-500 hover:text-slate-900'
                }`}
              >
                Continuous Flow
              </button>
              <button
                onClick={() => setPrintVariant('strict-2-page')}
                className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                  printVariant === 'strict-2-page' 
                    ? 'bg-accent text-white shadow-md' 
                    : 'bg-white text-slate-500 hover:text-slate-900'
                }`}
              >
                Strict 2 Pages
              </button>
            </div>
          </div>

          <button 
            onClick={() => {
              const companyPart = targetCompany ? ` (${targetCompany})` : '';
              document.title = `${data.personal.name} (${data.personal.title})${companyPart}`;
              window.print();
            }}
            className="flex items-center gap-2 px-8 py-2.5 bg-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all uppercase tracking-widest text-[10px]"
          >
            Print to PDF <Printer size={14} />
          </button>
        </div>
      </nav>

      <div className="resume-viewport">
        <article className={`resume-container ${printVariant} flex flex-col text-slate-900`}>
          {/* Main Header Block */}
          <header className="mb-7 pb-6 border-b-2 border-slate-900">
            <div className="flex justify-between items-start mb-5">
              <div className="pt-2">
                <h1 className="text-6xl font-display text-slate-900 leading-tight mb-2 uppercase tracking-tighter">
                  {data.personal.name}
                </h1>
                <p className="text-2xl font-bold uppercase tracking-[0.2em] text-accent">{data.personal.title}</p>
              </div>
              
              {data.personal.photoUrl && (
                <div>
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-50 shadow-sm">
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

          <div className="grid grid-cols-12 gap-8 flex-1">
            {/* Main Content Column */}
            <main className="col-span-8 space-y-7">
              
              {/* Experience Section */}
              <section>
                <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-4">
                  Experience <div className="flex-1 h-[2px] bg-slate-900" />
                </h2>
                <div className="space-y-5">
                  {data.experiences.map((exp, idx) => (
                    <div key={idx} className="avoid-break">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-lg font-display text-slate-900 uppercase tracking-tight">{exp.role}</h3>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{exp.period}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{exp.company}</span>
                        <span className="text-slate-200">|</span>
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{exp.location}</span>
                      </div>
                      <ul className="list-disc ml-4 space-y-1 text-[13px] leading-snug text-slate-600 marker:text-accent">
                        {exp.bullets.map((b, bi) => <li key={bi} className="pl-1">{b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Projects Section */}
              <section>
                <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-4">
                  Key Projects <div className="flex-1 h-[2px] bg-slate-900" />
                </h2>
                <div className="space-y-4">
                  {data.projects.map((proj, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-md font-display text-slate-900 uppercase">{proj.title}</h3>
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{proj.company}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 italic mb-2">{proj.scope}</p>
                      <ul className="space-y-1 text-[12.5px] text-slate-600">
                        {proj.bullets.map((b, bi) => <li key={bi} className="flex gap-2 leading-tight"><span className="text-accent font-black">›</span> {b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education (Academic) - Main Column as requested */}
              <section>
                <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-4">
                  Academic <div className="flex-1 h-[2px] bg-slate-900" />
                </h2>
                <div className="space-y-3">
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
            <aside className="col-span-4 space-y-6 border-l border-slate-50 pl-8">
              
              <section>
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 uppercase tracking-[0.1em]">Job related abilities</h2>
                <div className="space-y-5">
                  {data.abilities.map((ability, idx) => (
                    <div key={idx} className="avoid-break">
                      <h3 className="text-[11px] font-mono font-black text-slate-900 uppercase border-b border-slate-900/5 pb-1.5 mb-2 tracking-tighter">{ability.title}</h3>
                      <ul className="space-y-1.5 text-[12px] text-slate-500 italic font-medium leading-snug">
                        {ability.bullets.map((b, bi) => <li key={bi} className="flex gap-2"><span className="text-accent font-black">•</span> {b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4">Tech Stack</h2>
                <div className="space-y-3">
                  {data.technicalProficiency.map((tp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <h4 className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">{tp.category}</h4>
                      <p className="text-[12px] font-bold text-slate-700 leading-tight tracking-tight">{tp.skills}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4">Languages</h2>
                <div className="space-y-2">
                  {data.languages.map((lang, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[12px] border-b border-slate-50 pb-1">
                      <span className="font-bold text-slate-800 uppercase tracking-tighter">{lang.name}</span>
                      <span className="text-accent text-[9px] font-mono font-bold uppercase">{lang.level}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4">References</h2>
                <div className="space-y-4">
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
