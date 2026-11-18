export const colors = {
  ink: '#0F172A',
  body: '#475569',
  muted: '#94A3B8',
  rule: '#E2E8F0',
  accent: '#0052FF',
};

export const A4_HEIGHT = 841.89;

export const documentDate = new Date(0);

// 0.5in (36pt) margins; the bottom one is a little deeper to hold the footer.
export const MARGIN = 36;

export const page = {
  paddingTop: MARGIN,
  paddingBottom: MARGIN + 10,
  paddingHorizontal: MARGIN,
  fontFamily: 'Inter',
  fontSize: 9,
  lineHeight: 1.35,
  color: colors.body,
} as const;
