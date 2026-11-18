export const PAGE_BUDGET = 2;

// Text sizes and spacing the PDF may shrink to, largest first: body text 9pt, 8.55pt, 8.1pt.
// The CV is only shrunk when that brings it within the page budget; below 90% it gets hard to read.
export const DENSITIES = [1, 0.95, 0.9] as const;

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
