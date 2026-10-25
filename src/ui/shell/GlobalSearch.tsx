import React, { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { draftStep } from '../../domain/application/ApplicationDraft';
import { Searchable, SearchResult, searchRecords } from '../../domain/application/search';

const MAX_RESULTS = 8;

const pathOf = (result: SearchResult, records: Searchable): string => {
  if (result.kind === 'application') return `/applications/${result.id}`;
  if (result.kind === 'lead') return `/applications/new?lead=${result.id}`;
  const draft = records.drafts.find((d) => d.id === result.id);
  return `/drafts/${result.id}/${draftStep(draft?.stepId ?? '')}`;
};

const GlobalSearch: React.FC<{ records: Searchable }> = ({ records }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const listId = useId();
  const results = searchRecords(query, records, MAX_RESULTS);

  const open = (result: SearchResult) => {
    setQuery('');
    navigate(pathOf(result, records));
  };

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="search"
        aria-label="Search applications, saved jobs and drafts"
        aria-controls={listId}
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) open(results[0]);
          if (e.key === 'Escape') setQuery('');
        }}
        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
      />
      {query.trim() && (
        <ul
          id={listId}
          aria-label="Search results"
          className="absolute z-30 mt-1 w-full min-w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
          ) : (
            results.map((result) => (
              <li key={`${result.kind}-${result.id}`}>
                <Link
                  to={pathOf(result, records)}
                  onClick={() => setQuery('')}
                  className="block px-3 py-2 hover:bg-slate-50 focus:bg-slate-50 outline-none"
                >
                  <span className="block text-sm font-medium text-slate-900 truncate">{result.title}</span>
                  {result.subtitle && <span className="block text-xs text-slate-500 truncate">{result.subtitle}</span>}
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default GlobalSearch;
