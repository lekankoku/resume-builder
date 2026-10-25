export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PRESENT = 'Present';

export interface PeriodDraft {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
}

export const EMPTY_PERIOD: PeriodDraft = { startMonth: '', startYear: '', endMonth: '', endYear: '', current: false };

const parseMonthYear = (text: string): { month: string; year: string } | null => {
  const match = /^([a-z]+) (\d{4})$/i.exec(text.trim());
  if (!match) return null;
  const name = match[1].toLowerCase();
  const month = MONTHS.find((m) => m.toLowerCase() === name || (name.length === 3 && m.toLowerCase().startsWith(name)));
  return month ? { month, year: match[2] } : null;
};

export const parsePeriod = (period: string): PeriodDraft => {
  const [startText, endText, ...rest] = period.split(/\s+[-–—]\s+/);
  const start = parseMonthYear(startText);
  if (!start || endText === undefined || rest.length > 0) return EMPTY_PERIOD;
  if (endText.trim().toLowerCase() === PRESENT.toLowerCase()) {
    return { ...EMPTY_PERIOD, startMonth: start.month, startYear: start.year, current: true };
  }
  const end = parseMonthYear(endText);
  if (!end) return EMPTY_PERIOD;
  return { startMonth: start.month, startYear: start.year, endMonth: end.month, endYear: end.year, current: false };
};

export const formatPeriod = (draft: PeriodDraft): string => {
  const end = draft.current ? PRESENT : `${draft.endMonth} ${draft.endYear}`;
  return `${draft.startMonth} ${draft.startYear} – ${end}`;
};

export const isEmptyPeriod = (draft: PeriodDraft): boolean =>
  !draft.startMonth && !draft.startYear && !draft.endMonth && !draft.endYear && !draft.current;

const toIndex = (month: string, year: string): number | null =>
  MONTHS.includes(month) && /^\d{4}$/.test(year) ? Number(year) * 12 + MONTHS.indexOf(month) : null;

export const periodError = (draft: PeriodDraft, today: Date = new Date()): string | null => {
  const start = toIndex(draft.startMonth, draft.startYear);
  if (start === null) return 'Enter a valid start month and year';
  if (start > today.getFullYear() * 12 + today.getMonth()) return 'Start date cannot be in the future';
  if (draft.current) return null;
  const end = toIndex(draft.endMonth, draft.endYear);
  if (end === null) return 'Enter a valid end month and year, or tick present';
  if (end < start) return 'End date cannot be before start date';
  return null;
};
