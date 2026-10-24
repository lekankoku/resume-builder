import React from 'react';
import { Trash2 } from 'lucide-react';

interface BulletListProps {
  label: string;
  addLabel: string;
  bullets: string[];
  multiline?: boolean;
  onAdd: () => void;
  onChange: (bulletIndex: number, value: string) => void;
  onRemove: (bulletIndex: number) => void;
}

const fieldClass = 'flex-1 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none';

const BulletList: React.FC<BulletListProps> = ({ label, addLabel, bullets, multiline, onAdd, onChange, onRemove }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-mono font-black uppercase text-slate-400">{label}</span>
      <button onClick={onAdd} className="text-[10px] font-bold text-accent hover:text-accent/80 uppercase tracking-wider">
        + {addLabel}
      </button>
    </div>
    {bullets.map((bullet, bIdx) => (
      <div key={bIdx} className="flex gap-2">
        {multiline ? (
          <textarea
            aria-label={`${label} ${bIdx + 1}`}
            className={`${fieldClass} min-h-[60px]`}
            value={bullet}
            onChange={(e) => onChange(bIdx, e.target.value)}
          />
        ) : (
          <input
            aria-label={`${label} ${bIdx + 1}`}
            className={fieldClass}
            value={bullet}
            onChange={(e) => onChange(bIdx, e.target.value)}
          />
        )}
        <button
          aria-label={`Remove ${label} ${bIdx + 1}`}
          onClick={() => onRemove(bIdx)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit"
        >
          <Trash2 size={14} />
        </button>
      </div>
    ))}
  </div>
);

export default BulletList;
