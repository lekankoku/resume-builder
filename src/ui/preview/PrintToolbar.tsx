import React from 'react';
import { ChevronLeft, Download } from 'lucide-react';

interface Props {
  active: 'resume' | 'cover-letter';
  onBack: () => void;
  onShowResume: () => void;
  onShowCoverLetter: () => void;
  downloadUrl: string | null;
  fileName: string;
}

const segment = (isActive: boolean) =>
  `px-4 py-1.5 rounded-lg text-sm transition-all ${isActive ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-900'}`;

const PrintToolbar: React.FC<Props> = ({
  active,
  onBack,
  onShowResume,
  onShowCoverLetter,
  downloadUrl,
  fileName,
}) => (
  <nav className="no-print sticky top-0 z-50 w-full flex justify-center py-3 bg-white/95 backdrop-blur-md border-b border-slate-200">
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

      </div>

      <a
        href={downloadUrl ?? undefined}
        download={`${fileName}.pdf`}
        aria-disabled={!downloadUrl}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-all aria-disabled:opacity-50"
      >
        <Download size={16} /> Download PDF
      </a>
    </div>
  </nav>
);

export default PrintToolbar;
