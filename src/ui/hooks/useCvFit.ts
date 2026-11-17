import { useEffect, useState } from 'react';
import { CvFit } from '../../domain/resume/cvLength';
import { Resume } from '../../domain/resume/Resume';

export interface CvFitState {
  fit: CvFit | null;
  // False until the first measurement finished, whether or not it succeeded.
  settled: boolean;
}

// Renders the CV as a PDF in the background once edits settle, to learn how many pages it takes
// and how small it has to be printed to fit the page budget.
export const useCvFit = (resume: Resume, targetCompany: string, settleMs = 800): CvFitState => {
  const [state, setState] = useState<CvFitState>({ fit: null, settled: false });
  // Callers rebuild the resume object on every render; only a change in content needs a new measurement.
  const content = JSON.stringify(resume);

  useEffect(() => {
    let current = true;
    const timer = setTimeout(async () => {
      let fit: CvFit | null = null;
      try {
        const { measureResume } = await import('../pdf/measureResume');
        fit = await measureResume(resume, targetCompany);
      } catch {
        // Measuring is best effort: without it the CV still renders at full size.
      }
      if (current) setState({ fit, settled: true });
    }, settleMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [content, targetCompany, settleMs]);

  return state;
};
