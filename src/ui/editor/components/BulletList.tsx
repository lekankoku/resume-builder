import React from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

interface BulletListProps {
  label: string;
  addLabel: string;
  bullets: string[];
  multiline?: boolean;
  onAdd: () => void;
  onChange: (bulletIndex: number, value: string) => void;
  onRemove: (bulletIndex: number) => void;
  onMove: (from: number, to: number) => void;
}

const fieldClass =
  'flex-1 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none';

const iconButtonClass = 'p-2 text-slate-500 hover:bg-slate-100 rounded-lg h-fit disabled:opacity-30 disabled:hover:bg-transparent';

const BulletList: React.FC<BulletListProps> = ({ label, addLabel, bullets, multiline, onAdd, onChange, onRemove, onMove }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button onClick={onAdd} className="text-sm font-medium text-accent hover:underline">
        + {addLabel}
      </button>
    </div>
    {bullets.map((bullet, bIdx) => (
      <div key={bIdx} className="flex gap-1">
        {multiline ? (
          <textarea
            aria-label={`${label} ${bIdx + 1}`}
            className={`${fieldClass} min-h-[60px] mr-1`}
            value={bullet}
            onChange={(e) => onChange(bIdx, e.target.value)}
          />
        ) : (
          <input
            aria-label={`${label} ${bIdx + 1}`}
            className={`${fieldClass} mr-1`}
            value={bullet}
            onChange={(e) => onChange(bIdx, e.target.value)}
          />
        )}
        <button aria-label={`Move ${label} ${bIdx + 1} up`} disabled={bIdx === 0} onClick={() => onMove(bIdx, bIdx - 1)} className={iconButtonClass}>
          <ArrowUp size={14} />
        </button>
        <button
          aria-label={`Move ${label} ${bIdx + 1} down`}
          disabled={bIdx === bullets.length - 1}
          onClick={() => onMove(bIdx, bIdx + 1)}
          className={iconButtonClass}
        >
          <ArrowDown size={14} />
        </button>
        <button
          aria-label={`Remove ${label} ${bIdx + 1}`}
          onClick={() => onRemove(bIdx)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg h-fit"
        >
          <Trash2 size={14} />
        </button>
      </div>
    ))}
  </div>
);

export default BulletList;
