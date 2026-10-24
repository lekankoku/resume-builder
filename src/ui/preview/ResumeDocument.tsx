import React from 'react';
import { Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { cleanPhone, cleanUrl, displayUrl } from '../../domain/resume/contactFormat';
import { Resume } from '../../domain/resume/Resume';

const ResumeDocument: React.FC<{ resume: Resume }> = ({ resume }) => (
  <article className="resume-container flex flex-col text-slate-900">
    {/* Main Header Block */}
    <header className="mb-7 pb-6 border-b-2 border-slate-900">
      <div className="flex justify-between items-start mb-5">
        <div className="pt-2">
          <h1 className="text-6xl font-display text-slate-900 leading-tight mb-2 uppercase tracking-tighter">
            {resume.personal.name}
          </h1>
          <p className="text-2xl font-bold uppercase tracking-[0.2em] text-accent">{resume.personal.title}</p>
        </div>
        
        {resume.personal.photoUrl && (
          <div>
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-50 shadow-sm">
              <img src={cleanUrl(resume.personal.photoUrl)} alt="" className="w-full h-full object-cover object-top" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-12">
        <div className="space-y-1.5">
          <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
            <Mail size={12} className="text-accent" /> <a href={`mailto:${cleanUrl(resume.personal.email)}`} className="underline hover:text-accent decoration-accent/30">{displayUrl(resume.personal.email)}</a>
          </p>
          <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
            <Phone size={12} className="text-accent" /> <a href={`tel:${cleanPhone(resume.personal.phone)}`} className="underline hover:text-accent decoration-accent/30">{resume.personal.phone}</a>
          </p>
          <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
            <MapPin size={12} className="text-accent" /> {resume.personal.residence}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
            <Globe size={12} className="text-accent" /> <a href={cleanUrl(resume.personal.website)} target="_blank" rel="noopener" className="underline hover:text-accent decoration-accent/30">{displayUrl(resume.personal.website)}</a>
          </p>
          <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
            <Linkedin size={12} className="text-accent" /> <a href={cleanUrl(resume.personal.linkedin)} target="_blank" rel="noopener" className="underline hover:text-accent decoration-accent/30">{displayUrl(resume.personal.linkedin)}</a>
          </p>
          <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
            <Github size={12} className="text-accent" /> <a href={cleanUrl(resume.personal.github)} target="_blank" rel="noopener" className="underline hover:text-accent decoration-accent/30">{displayUrl(resume.personal.github)}</a>
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
            {resume.experiences.map((exp, idx) => (
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
            {resume.projects.map((proj, idx) => (
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
            {resume.education.map((edu, idx) => (
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
            {resume.abilities.map((ability, idx) => (
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
            {resume.technicalProficiency.map((tp, idx) => (
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
            {resume.languages.map((lang, idx) => (
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
            {resume.references.map((ref, idx) => (
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

  </article>
);

export default ResumeDocument;
