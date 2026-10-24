import { Resume } from '../domain/resume/Resume';

const uuid = () => crypto.randomUUID();

export const aResume = (overrides: Partial<Resume> = {}): Resume => ({
  personal: {
    name: uuid(),
    title: uuid(),
    phone: uuid(),
    email: uuid(),
    residence: uuid(),
    nationality: uuid(),
    website: uuid(),
    linkedin: uuid(),
    github: uuid(),
    photoUrl: uuid(),
  },
  experiences: [
    { company: uuid(), location: uuid(), role: uuid(), period: uuid(), bullets: [uuid(), uuid()] },
    { company: uuid(), location: uuid(), role: uuid(), period: uuid(), bullets: [uuid()] },
    { company: uuid(), location: uuid(), role: uuid(), period: uuid(), bullets: [] },
  ],
  abilities: [{ title: uuid(), bullets: [uuid()] }],
  education: [{ institution: uuid(), location: uuid(), degree: uuid(), period: uuid() }],
  projects: [{ company: uuid(), title: uuid(), scope: uuid(), bullets: [uuid()] }],
  languages: [{ name: uuid(), level: uuid() }],
  technicalProficiency: [{ category: uuid(), skills: uuid() }],
  references: [{ name: uuid(), role: uuid(), company: uuid(), linkedin: uuid() }],
  crossFunctional: { title: uuid(), bullets: [uuid()] },
  ...overrides,
});
