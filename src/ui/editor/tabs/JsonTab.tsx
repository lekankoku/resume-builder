import React from 'react';

interface Props {
  jsonInput: string;
  jsonError: string | null;
  onChange: (value: string) => void;
  onApply: () => void;
}

const JsonTab: React.FC<Props> = ({ jsonInput, jsonError, onChange, onApply }) => (
  <div className="h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-display text-slate-900">Raw JSON</h2>
      <button onClick={onApply} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-all">Apply JSON</button>
    </div>
    {jsonError && <div role="alert" className="mb-4 text-red-600 text-xs font-mono bg-red-50 p-3 rounded-lg border border-red-100">{jsonError}</div>}
    <textarea
      aria-label="Resume JSON"
      className="flex-1 w-full p-4 bg-slate-50 text-slate-800 font-mono text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent outline-none min-h-[500px]"
      value={jsonInput}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  </div>
);

export default JsonTab;
