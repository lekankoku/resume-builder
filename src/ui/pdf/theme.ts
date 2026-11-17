export const colors = {
  ink: '#0F172A',
  body: '#475569',
  muted: '#94A3B8',
  rule: '#E2E8F0',
  accent: '#0052FF',
};

export const A4_HEIGHT = 841.89;

export const documentDate = new Date(0);

// 0.75in (54pt) margins on every side; the footer sits inside the bottom margin.
export const MARGIN = 54;

export const page = {
  paddingTop: MARGIN,
  paddingBottom: MARGIN,
  paddingHorizontal: MARGIN,
  fontFamily: 'Inter',
  fontSize: 11,
  lineHeight: 1.4,
  color: colors.body,
} as const;
