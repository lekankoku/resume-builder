export interface CoverLetter {
  subject: string;
  recipientName: string;
  recipientTitle: string;
  companyAddress: string;
  date: string;
  body: string;
}

export type StoredCoverLetter = Omit<CoverLetter, 'subject'> & { subject?: string };

export const createCoverLetter = (now: Date): CoverLetter => ({
  subject: '',
  recipientName: '',
  recipientTitle: '',
  companyAddress: '',
  date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  body: '',
});

export const updateCoverLetterField = (letter: CoverLetter, field: keyof CoverLetter, value: string): CoverLetter => ({
  ...letter,
  [field]: value,
});

export const withCoverLetterDefaults = (letter: StoredCoverLetter): CoverLetter => ({ subject: '', ...letter });
