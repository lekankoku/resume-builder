export type WorkAuthorization = 'unknown' | 'eu-citizen' | 'needs-visa' | 'has-permit';

export type LanguageBasis = '' | 'mother tongue' | 'certificate' | 'schooling' | 'residence' | 'self-assessed';

export interface LanguageFact {
  name: string;
  level: string;
  basis: LanguageBasis;
}

export interface ReferenceFact {
  name: string;
  role: string;
  company: string;
  contact: string;
  linkedin: string;
  consented: boolean;
  isCurrentManager: boolean;
}

export interface EducationFact {
  institution: string;
  location: string;
  degree: string;
  period: string;
  completed: boolean;
  details: string;
}

export interface RememberedAnswer {
  question: string;
  answer: string;
}

export interface CandidateFacts {
  workAuthorization: WorkAuthorization;
  permit: string;
  languages: LanguageFact[];
  references: ReferenceFact[];
  education: EducationFact[];
  answers: RememberedAnswer[];
}

export type FactList = 'languages' | 'references' | 'education' | 'answers';

type FactItem<L extends FactList> = CandidateFacts[L][number];

const templates: { [L in Exclude<FactList, 'answers'>]: () => FactItem<L> } = {
  languages: () => ({ name: '', level: '', basis: '' }),
  references: () => ({ name: '', role: '', company: '', contact: '', linkedin: '', consented: false, isCurrentManager: false }),
  education: () => ({ institution: '', location: '', degree: '', period: '', completed: true, details: '' }),
};

export const createCandidateFacts = (): CandidateFacts => ({
  workAuthorization: 'unknown',
  permit: '',
  languages: [],
  references: [],
  education: [],
  answers: [],
});

export const withFactsDefaults = (facts: Partial<CandidateFacts>): CandidateFacts => ({ ...createCandidateFacts(), ...facts });

export const addFact = (facts: CandidateFacts, list: Exclude<FactList, 'answers'>): CandidateFacts => ({
  ...facts,
  [list]: [...facts[list], templates[list]()],
});

export const updateFact = <L extends FactList>(
  facts: CandidateFacts,
  list: L,
  index: number,
  field: keyof FactItem<L>,
  value: string | boolean,
): CandidateFacts => ({
  ...facts,
  [list]: (facts[list] as FactItem<L>[]).map((item, i) => (i === index ? { ...item, [field]: value } : item)),
});

export const removeFact = (facts: CandidateFacts, list: FactList, index: number): CandidateFacts => ({
  ...facts,
  [list]: facts[list].filter((_, i) => i !== index),
});

export const rememberAnswers = (facts: CandidateFacts, answers: RememberedAnswer[]): CandidateFacts => ({
  ...facts,
  answers: [...facts.answers.filter((saved) => !answers.some((a) => a.question === saved.question)), ...answers],
});
