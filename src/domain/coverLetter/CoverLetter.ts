export interface CoverLetter {
  recipientName: string;
  recipientTitle: string;
  companyAddress: string;
  date: string;
  body: string;
}

export const createCoverLetter = (now: Date): CoverLetter => ({
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
