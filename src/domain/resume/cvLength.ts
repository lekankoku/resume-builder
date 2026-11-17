export const PAGE_BUDGET = 2;

// Text sizes and spacing the PDF may shrink to, largest first: body text 11pt, 10.75pt, 10.5pt.
// The CV is only shrunk when that brings it within the page budget, and never below 10.5pt.
export const DENSITIES = [1, 0.977, 0.955] as const;

export interface CvFit {
  density: number;
  pages: number;
  naturalPages: number;
}

export const fitToBudget = async (countPages: (density: number) => Promise<number>, budget = PAGE_BUDGET): Promise<CvFit> => {
  const naturalPages = await countPages(DENSITIES[0]);
  const natural = { density: DENSITIES[0], pages: naturalPages, naturalPages };
  // Shrinking saves lines, not pages: only try it when the CV spills onto one extra page.
  if (naturalPages !== budget + 1) return natural;

  for (const density of DENSITIES.slice(1)) {
    const pages = await countPages(density);
    if (pages <= budget) return { density, pages, naturalPages };
  }
  return natural;
};
