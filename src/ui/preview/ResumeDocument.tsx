import React from 'react';
import { Flag, Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { cleanPhone, cleanUrl, displayUrl } from '../../domain/resume/contactFormat';
import { Resume } from '../../domain/resume/Resume';
import { sidebarBullets, sidebarTechStack } from '../../domain/resume/sidebar';

const ResumeDocument: React.FC<{ resume: Resume }> = ({ resume }) => {
  const experience = resume.experiences.length > 0 && (
    <section key="experience">
      <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-4">
        Experience <div className="flex-1 h-[2px] bg-slate-900" />
      </h2>
      <div className="space-y-5">
        {resume.experiences.map((exp, idx) => (
          <div key={idx} className="avoid-break">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-lg font-sans font-bold text-slate-900 uppercase tracking-tight">{exp.role}</h3>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{exp.period}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{exp.company}</span>
              <span className="text-slate-200">|</span>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{exp.location}</span>
              {exp.employmentType && (
                <>
                  <span className="text-slate-200">|</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{exp.employmentType}</span>
                </>
              )}
            </div>
            {exp.earlierPositions.map((position, pi) => (
              <div key={pi} className="flex justify-between items-baseline mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{position.role}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{position.period}</span>
              </div>
            ))}
            <ul className="list-disc ml-4 space-y-1 text-[13px] leading-snug text-slate-600 marker:text-accent">
              {exp.bullets.map((b, bi) => <li key={bi} className="pl-1">{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );

  const projects = resume.projects.length > 0 && (
    <section key="projects">
      <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-4">
        Key Projects <div className="flex-1 h-[2px] bg-slate-900" />
      </h2>
      <div className="space-y-4">
        {resume.projects.map((proj, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-md font-sans font-bold text-slate-900 uppercase">{proj.title}</h3>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                {[proj.company, proj.period].filter(Boolean).join(' · ')}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 italic mb-2">{proj.scope}</p>
            <ul className="space-y-1 text-[12.5px] text-slate-600">
              {proj.bullets.map((b, bi) => <li key={bi} className="flex gap-2 leading-tight"><span className="text-accent font-black">›</span> {b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );

  const volunteering = resume.volunteering.length > 0 && (
    <section key="volunteering">
      <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-4">
        Volunteering <div className="flex-1 h-[2px] bg-slate-900" />
      </h2>
      <div className="space-y-4">
        {resume.volunteering.map((item, idx) => (
          <div key={idx} className="avoid-break">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-md font-sans font-bold text-slate-900 uppercase tracking-tight">{item.role}</h3>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{item.period}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{item.organization}</span>
              {item.location && (
                <>
                  <span className="text-slate-200">|</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{item.location}</span>
                </>
              )}
            </div>
            <ul className="list-disc ml-4 space-y-1 text-[13px] leading-snug text-slate-600 marker:text-accent">
              {item.bullets.map((b, bi) => <li key={bi} className="pl-1">{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );

  const education = resume.education.length > 0 && (
    <section key="education">
      <h2 className="text-[12px] font-mono font-black uppercase tracking-[0.3em] text-slate-900 mb-4 flex items-center gap-4">
        Education <div className="flex-1 h-[2px] bg-slate-900" />
      </h2>
      <div className="space-y-3">
        {resume.education.map((edu, idx) => (
          <div key={idx} className="avoid-break">
            <div className="flex justify-between items-start group">
              <div className="space-y-0.5">
                <h3 className="text-lg font-sans font-bold text-slate-900 leading-tight uppercase tracking-tight">{edu.degree}</h3>
                <p className="text-sm font-bold text-accent uppercase tracking-wide">{edu.institution}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{edu.period}</span>
                <span className="text-[10px] text-slate-300 uppercase font-mono font-black">{edu.location}</span>
              </div>
            </div>
            {edu.bullets.length > 0 && (
              <ul className="list-disc ml-4 mt-2 space-y-1 text-[13px] leading-snug text-slate-600 marker:text-accent">
                {edu.bullets.map((b, bi) => <li key={bi} className="pl-1">{b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <article className="resume-container flex flex-col text-slate-900">
      {/* Main Header Block */}
      <header className="mb-7 pb-6 border-b-2 border-slate-900">
        <div className="flex justify-between items-start mb-5">
          <div className="pt-2">
            <h1 className="text-6xl font-sans font-bold text-slate-900 leading-tight mb-2 uppercase tracking-tighter">
              {resume.personal.name}
            </h1>
            <p className="text-2xl font-bold uppercase tracking-[0.2em] text-accent">{resume.personal.title}</p>
            {resume.personal.currentRole && (
              <p className="text-sm font-bold uppercase tracking-wide text-slate-600 mt-1">
                {[resume.personal.currentRole, resume.personal.currentCompany].filter(Boolean).join(' · ')}
              </p>
            )}
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
            {resume.personal.nationality && (
              <p className="flex items-center gap-2.5 text-[11px] font-medium text-slate-600">
                <Flag size={12} className="text-accent" /> {resume.personal.nationality}
              </p>
            )}
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
        
          {resume.layout === 'education-first'
            ? [education, experience, projects, volunteering]
            : [experience, projects, volunteering, education]}
        </main>

        {/* Sidebar Column: one plain font and size for every item */}
        <aside className="col-span-4 space-y-3 border-l border-slate-50 pl-8 font-sans text-[11px] leading-snug text-slate-600">
        
          <section>
            <h2 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-900 mb-1.5">Job related abilities</h2>
            <div className="space-y-1.5">
              {resume.abilities.map((ability, idx) => (
                <div key={idx} className="avoid-break">
                  <h3 className="text-[10px] font-bold text-slate-900">{ability.title}</h3>
                  <ul className="space-y-0.5">
                    {sidebarBullets(ability.bullets).map((b, bi) => <li key={bi} className="flex gap-1.5"><span className="text-accent font-bold">•</span> {b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {(resume.crossFunctional.title || resume.crossFunctional.bullets.length > 0) && (
            <section>
              <h2 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                {resume.crossFunctional.title || 'Leadership'}
              </h2>
              <ul className="space-y-0.5">
                {sidebarBullets(resume.crossFunctional.bullets).map((b, bi) => <li key={bi} className="flex gap-1.5"><span className="text-accent font-bold">•</span> {b}</li>)}
              </ul>
            </section>
          )}

          {resume.technicalProficiency.length > 0 && (
            <section>
              <h2 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-900 mb-1.5">Tech Stack</h2>
              <div className="space-y-1">
                {sidebarTechStack(resume.technicalProficiency).map((tp, idx) => (
                  <div key={idx}>
                    {tp.category && <h4 className="font-bold text-slate-900">{tp.category}</h4>}
                    <p>{tp.skills}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-900 mb-1.5">Languages</h2>
            <div className="space-y-0.5">
              {resume.languages.map((lang, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{lang.name}</span>
                  <span>{lang.level}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-900 mb-1.5">References</h2>
            <div className="space-y-2">
              {resume.references.map((ref, idx) => (
                <div key={idx}>
                  <p className="font-bold text-slate-900">{ref.name}</p>
                  <p>{ref.role}</p>
                  <p>{ref.company}</p>
                  {ref.contact && <p>{ref.contact}</p>}
                  {ref.linkedin && (
                    <a href={cleanUrl(ref.linkedin)} target="_blank" rel="noopener" className="underline hover:text-accent">LinkedIn Profile</a>
                  )}
                </div>
              ))}
            </div>
          </section>

        </aside>
      </div>

    </article>
  );
};

export default ResumeDocument;
