import { CoverLetter } from '../coverLetter/CoverLetter';
import { Resume } from './Resume';

export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
}

export interface SectionDiff {
  id: string;
  label: string;
  lines: DiffLine[];
  changed: boolean;
}

interface Cv {
  resume: Resume;
  coverLetter: CoverLetter;
}

const bullets = (items: string[]) => items.map((b) => `• ${b}`);

const SECTIONS: { id: string; label: string; lines: (cv: Cv) => string[] }[] = [
  {
    id: 'personal',
    label: 'Title',
    lines: ({ resume }) => [resume.personal.title, `Current: ${resume.personal.currentRole} — ${resume.personal.currentCompany}`],
  },
  {
    id: 'experiences',
    label: 'Experience',
    lines: ({ resume }) =>
      resume.experiences.flatMap((e) => [
        `${e.role} — ${e.company}, ${e.location} (${e.period})`,
        ...e.earlierPositions.map((p) => `Earlier: ${p.role} (${p.period})`),
        ...bullets(e.bullets),
      ]),
  },
  {
    id: 'projects',
    label: 'Projects',
    lines: ({ resume }) => resume.projects.flatMap((p) => [`${p.title} — ${p.company} (${p.scope}) ${p.period}`, ...bullets(p.bullets)]),
  },
  {
    id: 'volunteering',
    label: 'Volunteering',
    lines: ({ resume }) =>
      resume.volunteering.flatMap((v) => [`${v.role} — ${v.organization}, ${v.location} (${v.period})`, ...bullets(v.bullets)]),
  },
  {
    id: 'abilities',
    label: 'Job related abilities',
    lines: ({ resume }) => resume.abilities.flatMap((a) => [a.title, ...bullets(a.bullets)]),
  },
  {
    id: 'leadership',
    label: 'Leadership',
    lines: ({ resume }) => [resume.crossFunctional.title, ...bullets(resume.crossFunctional.bullets)],
  },
  {
    id: 'technicalProficiency',
    label: 'Tech Stack',
    lines: ({ resume }) => resume.technicalProficiency.map((t) => `${t.category}: ${t.skills}`),
  },
  {
    id: 'education',
    label: 'Education',
    lines: ({ resume }) => resume.education.flatMap((e) => [`${e.degree} — ${e.institution}, ${e.location} (${e.period})`, ...bullets(e.bullets)]),
  },
  { id: 'languages', label: 'Languages', lines: ({ resume }) => resume.languages.map((l) => `${l.name}: ${l.level}`) },
  {
    id: 'references',
    label: 'References',
    lines: ({ resume }) => resume.references.map((r) => `${r.name} — ${r.role}, ${r.company} (${[r.contact, r.linkedin].filter(Boolean).join(', ')})`),
  },
  {
    id: 'coverLetter',
    label: 'Cover Letter',
    lines: ({ coverLetter }) => [
      `Date: ${coverLetter.date}`,
      `Subject: ${coverLetter.subject}`,
      `Recipient: ${coverLetter.recipientName}`,
      `Recipient title: ${coverLetter.recipientTitle}`,
      `Company address: ${coverLetter.companyAddress}`,
      ...coverLetter.body.split('\n').filter((line) => line.trim()),
    ],
  },
];

export const diffLines = (before: string[], after: string[]): DiffLine[] => {
  const lcs = before.map(() => after.map(() => 0));
  const length = (i: number, j: number) => (i < before.length && j < after.length ? lcs[i][j] : 0);
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      lcs[i][j] = before[i] === after[j] ? length(i + 1, j + 1) + 1 : Math.max(length(i + 1, j), length(i, j + 1));
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      lines.push({ type: 'same', text: before[i] });
      i++;
      j++;
    } else if (j < after.length && (i >= before.length || length(i, j + 1) >= length(i + 1, j))) {
      lines.push({ type: 'added', text: after[j] });
      j++;
    } else {
      lines.push({ type: 'removed', text: before[i] });
      i++;
    }
  }
  return lines;
};

export const compareCv = (before: Cv, after: Cv): SectionDiff[] =>
  SECTIONS.map(({ id, label, lines }) => {
    const diff = diffLines(lines(before), lines(after));
    return { id, label, lines: diff, changed: diff.some((line) => line.type !== 'same') };
  });
