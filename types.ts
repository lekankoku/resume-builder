
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
}

export interface Experience {
  company: string;
  location: string;
  role: string;
  period: string;
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
}

export interface Project {
  company: string;
  title: string;
  scope: string;
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
  linkedin: string;
}

export interface ResumeData {
  personal: PersonalInfo;
  experiences: Experience[];
  abilities: Ability[];
  education: Education[];
  projects: Project[];
  languages: { name: string; level: string }[];
  technicalProficiency: TechnicalProficiency[];
  references: Reference[];
  crossFunctional: { title: string; bullets: string[] };
}
