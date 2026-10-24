import React, { useId } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  minHeightClass?: string;
  className?: string;
}

const inputClass =
  'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none';

const TextField: React.FC<TextFieldProps> = ({ label, value, onChange, multiline, minHeightClass = '', className = '' }) => {
  const id = useId();
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      {multiline ? (
        <textarea id={id} className={`${inputClass} ${minHeightClass}`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
};

export default TextField;
