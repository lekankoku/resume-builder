import React from 'react';
import { ChevronLeft, Printer } from 'lucide-react';
import { PrintVariant } from './ResumePreview';

interface Props {
  active: 'resume' | 'cover-letter';
  onBack: () => void;
  onShowResume: () => void;
  onShowCoverLetter: () => void;
  onPrint: () => void;
  printVariant?: PrintVariant;
  onPrintVariantChange?: (variant: PrintVariant) => void;
}

const segment = (isActive: boolean) =>
  `px-4 py-1.5 rounded-lg text-sm transition-all ${isActive ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-900'}`;

const PrintToolbar: React.FC<Props> = ({
  active,
  onBack,
  onShowResume,
  onShowCoverLetter,
  onPrint,
  printVariant,
  onPrintVariantChange,
}) => (
  <nav className="no-print sticky top-0 z-50 w-full flex justify-center py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 mb-10">
    <div className="max-w-6xl w-full flex justify-between items-center gap-6 px-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-4">
        <div role="group" aria-label="Document" className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <button onClick={onShowResume} aria-pressed={active === 'resume'} className={segment(active === 'resume')}>
            CV
          </button>
          <button onClick={onShowCoverLetter} aria-pressed={active === 'cover-letter'} className={segment(active === 'cover-letter')}>
            Cover letter
          </button>
        </div>

        {printVariant && onPrintVariantChange && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Layout
            <select
              value={printVariant}
              onChange={(e) => onPrintVariantChange(e.target.value as PrintVariant)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
            >
              <option value="continuous">Continuous flow</option>
              <option value="strict-2-page">Strict 2 pages</option>
            </select>
          </label>
        )}
      </div>

      <button
        onClick={onPrint}
        className="flex items-center gap-2 px-5 py-2 bg-accent text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-accent/90 transition-all"
      >
        <Printer size={16} /> Print / Save as PDF
      </button>
    </div>
  </nav>
);

export default PrintToolbar;
