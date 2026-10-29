import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { buttonClass } from '../applications/ApplicationsView';

const PreviewPane: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-0">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${buttonClass} w-full xl:hidden`}>
        {open ? <EyeOff size={14} /> : <Eye size={14} />} {open ? 'Hide' : 'Show'} preview and suggestions
      </button>
      <div className={`${open ? 'mt-4' : 'hidden'} xl:block xl:mt-0`}>{children}</div>
    </div>
  );
};

export default PreviewPane;
