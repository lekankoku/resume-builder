import {
  BulletSection,
  Education,
  Experience,
  Layout,
  ListSection,
  ListSectionItem,
  PersonalInfo,
  Position,
  Profile,
  Project,
  Reference,
  Resume,
  Volunteering,
} from './Resume';

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type StoredResume = Omit<Resume, 'personal' | 'layout' | 'experiences' | 'education' | 'projects' | 'volunteering' | 'references'> & {
  personal: WithOptional<PersonalInfo, 'currentRole' | 'currentCompany'>;
  layout?: Layout;
  experiences: WithOptional<Experience, 'earlierPositions'>[];
  education: WithOptional<Education, 'bullets'>[];
  projects: WithOptional<Project, 'period'>[];
  volunteering?: Volunteering[];
  references: WithOptional<Reference, 'contact'>[];
};

export const itemTemplates: { [S in ListSection]: () => ListSectionItem<S> } = {
  experiences: () => ({ role: '', company: '', location: '', period: '', earlierPositions: [], bullets: [''] }),
  projects: () => ({ title: '', company: '', scope: '', period: '', bullets: [''] }),
  education: () => ({ degree: '', institution: '', location: '', period: '', bullets: [] }),
  volunteering: () => ({ organization: '', role: '', location: '', period: '', bullets: [''] }),
  abilities: () => ({ title: '', bullets: [''] }),
  languages: () => ({ name: '', level: '' }),
  technicalProficiency: () => ({ category: '', skills: '' }),
  references: () => ({ name: '', role: '', company: '', contact: '', linkedin: '' }),
};

export const updatePersonalField = (resume: Resume, field: keyof PersonalInfo, value: string): Resume => ({
  ...resume,
  personal: { ...resume.personal, [field]: value },
});

export const addItem = <S extends ListSection>(resume: Resume, section: S): Resume =>
  withItems(resume, section, (items) => [...items, itemTemplates[section]()]);

export const removeItem = <S extends ListSection>(resume: Resume, section: S, index: number): Resume =>
  withItems(resume, section, (items) => items.filter((_, i) => i !== index));

export const moveItem = <S extends ListSection>(resume: Resume, section: S, from: number, to: number): Resume =>
  withItems(resume, section, (items) => {
    const moved = [...items];
    const [item] = moved.splice(from, 1);
    moved.splice(to, 0, item);
    return moved;
  });

export const updateItemField = <S extends ListSection>(
  resume: Resume,
  section: S,
  index: number,
  field: keyof ListSectionItem<S>,
  value: string,
): Resume => withItems(resume, section, (items) => items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

export const addBullet = (resume: Resume, section: BulletSection, index: number): Resume =>
  withBullets(resume, section, index, (bullets) => [...bullets, '']);

export const updateBullet = (resume: Resume, section: BulletSection, index: number, bulletIndex: number, value: string): Resume =>
  withBullets(resume, section, index, (bullets) => bullets.map((bullet, i) => (i === bulletIndex ? value : bullet)));

export const removeBullet = (resume: Resume, section: BulletSection, index: number, bulletIndex: number): Resume =>
  withBullets(resume, section, index, (bullets) => bullets.filter((_, i) => i !== bulletIndex));

export const updateLayout = (resume: Resume, layout: Layout): Resume => ({ ...resume, layout });

export const addEarlierPosition = (resume: Resume, index: number): Resume =>
  withEarlierPositions(resume, index, (positions) => [...positions, { role: '', period: '' }]);

export const updateEarlierPosition = (
  resume: Resume,
  index: number,
  positionIndex: number,
  field: keyof Position,
  value: string,
): Resume =>
  withEarlierPositions(resume, index, (positions) =>
    positions.map((position, i) => (i === positionIndex ? { ...position, [field]: value } : position)),
  );

export const removeEarlierPosition = (resume: Resume, index: number, positionIndex: number): Resume =>
  withEarlierPositions(resume, index, (positions) => positions.filter((_, i) => i !== positionIndex));

export const updateCrossFunctionalTitle = (resume: Resume, title: string): Resume => ({
  ...resume,
  crossFunctional: { ...resume.crossFunctional, title },
});

export const addCrossFunctionalBullet = (resume: Resume): Resume => withCrossFunctionalBullets(resume, (bullets) => [...bullets, '']);

export const updateCrossFunctionalBullet = (resume: Resume, bulletIndex: number, value: string): Resume =>
  withCrossFunctionalBullets(resume, (bullets) => bullets.map((bullet, i) => (i === bulletIndex ? value : bullet)));

export const removeCrossFunctionalBullet = (resume: Resume, bulletIndex: number): Resume =>
  withCrossFunctionalBullets(resume, (bullets) => bullets.filter((_, i) => i !== bulletIndex));

export const applyProfile = (resume: Resume, profile: Profile): Resume => ({
  ...resume,
  personal: { ...profile, title: resume.personal.title, currentRole: resume.personal.currentRole, currentCompany: resume.personal.currentCompany },
});

export const withResumeDefaults = (resume: StoredResume): Resume => ({
  ...resume,
  personal: { currentRole: '', currentCompany: '', ...resume.personal },
  layout: resume.layout ?? 'experience-first',
  experiences: resume.experiences.map((experience) => ({ earlierPositions: [], ...experience })),
  education: resume.education.map((education) => ({ bullets: [], ...education })),
  projects: resume.projects.map((project) => ({ period: '', ...project })),
  volunteering: resume.volunteering ?? [],
  references: resume.references.map((reference) => ({ contact: '', ...reference })),
});

export const mergeImportedResume = (current: Resume, imported: Resume): Resume => ({
  ...imported,
  personal: {
    ...current.personal,
    title: imported.personal?.title || current.personal.title,
  },
  references: current.references,
  languages: current.languages,
  education: current.education,
});

const withItems = <S extends ListSection>(
  resume: Resume,
  section: S,
  transform: (items: ListSectionItem<S>[]) => ListSectionItem<S>[],
): Resume => ({ ...resume, [section]: transform(resume[section] as ListSectionItem<S>[]) });

const withEarlierPositions = (resume: Resume, index: number, transform: (positions: Position[]) => Position[]): Resume =>
  withItems(resume, 'experiences', (items) =>
    items.map((item, i) => (i === index ? { ...item, earlierPositions: transform(item.earlierPositions) } : item)),
  );

const withCrossFunctionalBullets = (resume: Resume, transform: (bullets: string[]) => string[]): Resume => ({
  ...resume,
  crossFunctional: { ...resume.crossFunctional, bullets: transform(resume.crossFunctional.bullets) },
});

const withBullets = (
  resume: Resume,
  section: BulletSection,
  index: number,
  transform: (bullets: string[]) => string[],
): Resume =>
  withItems(resume, section, (items) =>
    items.map((item, i) => (i === index ? { ...item, bullets: transform((item as { bullets: string[] }).bullets) } : item)),
  );
