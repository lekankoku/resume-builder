
export interface PersonalInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  residence: string;
  nationality: string;
  website: string;
  linkedin: string;
  github: string;
  photoUrl: string;
  currentRole: string;
  currentCompany: string;
}

export type Profile = Omit<PersonalInfo, 'title' | 'currentRole' | 'currentCompany'>;

export interface Position {
  role: string;
  period: string;
}

export interface Experience {
  company: string;
  location: string;
  role: string;
  period: string;
  employmentType?: string;
  earlierPositions: Position[];
  bullets: string[];
}

export interface Ability {
  title: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  location: string;
  degree: string;
  period: string;
  bullets: string[];
}

export interface Project {
  company: string;
  title: string;
  scope: string;
  period: string;
  bullets: string[];
}

export interface Volunteering {
  organization: string;
  location: string;
  role: string;
  period: string;
  bullets: string[];
}

export interface TechnicalProficiency {
  category: string;
  skills: string;
}

export interface Reference {
  name: string;
  role: string;
  company: string;
  contact: string;
  linkedin: string;
}

export type Layout = 'experience-first' | 'education-first';

export interface Resume {
  personal: PersonalInfo;
  layout: Layout;
  experiences: Experience[];
  abilities: Ability[];
  education: Education[];
  projects: Project[];
  volunteering: Volunteering[];
  languages: { name: string; level: string }[];
  technicalProficiency: TechnicalProficiency[];
  references: Reference[];
  crossFunctional: { title: string; bullets: string[] };
}

export type ListSection =
  | 'experiences'
  | 'abilities'
  | 'education'
  | 'projects'
  | 'volunteering'
  | 'languages'
  | 'technicalProficiency'
  | 'references';

export type BulletSection = 'experiences' | 'abilities' | 'projects' | 'education' | 'volunteering';

export type ListSectionItem<S extends ListSection> = Resume[S][number];
