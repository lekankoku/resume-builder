import React from 'react';
import { CvFit, PAGE_BUDGET } from '../../domain/resume/cvLength';

const pagesLabel = (pages: number) => `${pages} ${pages === 1 ? 'page' : 'pages'}`;

const PageCount: React.FC<{ fit: CvFit | null; budget?: number }> = ({ fit, budget = PAGE_BUDGET }) => {
  if (!fit) return null;

  if (fit.pages > budget) {
    return (
      <span role="status" className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800" title="Remove or shorten bullets, or ask AI suggestions to shorten it">
        {pagesLabel(fit.pages)} · over the {budget}-page limit
      </span>
    );
  }

  const shrunk = fit.density < 1;
  return (
    <span
      role="status"
      className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
      title={shrunk ? `It would take ${pagesLabel(fit.naturalPages)} at full size, so the PDF prints slightly smaller` : undefined}
    >
      {pagesLabel(fit.pages)}
      {shrunk ? ` · ${Math.round(fit.density * 100)}% size` : ''}
    </span>
  );
};

export default PageCount;
