import React from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router';

export const useViewQuery = (): [string, (query: string) => void] => {
  const [params, setParams] = useSearchParams();
  const setQuery = (query: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (query) next.set('q', query);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  return [params.get('q') ?? '', setQuery];
};

const ViewSearch: React.FC<{ label: string; query: string; onChange: (query: string) => void }> = ({ label, query, onChange }) => (
  <div className="relative w-full max-w-sm">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    <input
      type="search"
      aria-label={label}
      placeholder="Search…"
      value={query}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Escape' && onChange('')}
      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
    />
  </div>
);

export default ViewSearch;
