import { BulletSection, ListSection, ListSectionItem, PersonalInfo, Profile, Resume } from './Resume';

const itemTemplates: { [S in ListSection]: () => ListSectionItem<S> } = {
  experiences: () => ({ role: '', company: '', location: '', period: '', bullets: [''] }),
  projects: () => ({ title: '', company: '', scope: '', bullets: [''] }),
  education: () => ({ degree: '', institution: '', location: '', period: '' }),
  abilities: () => ({ title: '', bullets: [''] }),
  languages: () => ({ name: '', level: '' }),
  technicalProficiency: () => ({ category: '', skills: '' }),
  references: () => ({ name: '', role: '', company: '', linkedin: '' }),
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

export const applyProfile = (resume: Resume, profile: Profile): Resume => ({
  ...resume,
  personal: { ...profile, title: resume.personal.title },
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

const withBullets = (
  resume: Resume,
  section: BulletSection,
  index: number,
  transform: (bullets: string[]) => string[],
): Resume =>
  withItems(resume, section, (items) =>
    items.map((item, i) => (i === index ? { ...item, bullets: transform((item as { bullets: string[] }).bullets) } : item)),
  );
