import React, { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router';
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
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const matches = searchRecords(query, records, Infinity);
  const results = matches.slice(0, MAX_RESULTS);
  const expanded = focused && !!query.trim();
  const optionId = (index: number) => `${listId}-${index}`;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== '/' || target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!input.current?.offsetParent) return;
      e.preventDefault();
      input.current.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const open = (result: SearchResult) => {
    setQuery('');
    input.current?.blur();
    navigate(pathOf(result, records));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length);
    }
    if (e.key === 'Enter' && results[active]) open(results[active]);
    if (e.key === 'Escape') setQuery('');
  };

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-label="Search applications, saved jobs and drafts"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && results[active] ? optionId(active) : undefined}
        placeholder="Search…  /"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
      />
      {expanded && (
        <div className="absolute z-30 mt-1 w-full min-w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <ul id={listId} role="listbox" aria-label="Search results">
            {results.map((result, index) => (
              <li
                key={`${result.kind}-${result.id}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => open(result)}
                onMouseEnter={() => setActive(index)}
                className={`px-3 py-2 cursor-pointer ${index === active ? 'bg-accent/10' : ''}`}
              >
                <span className="block text-sm font-medium text-slate-900 truncate">{result.title}</span>
                {result.subtitle && <span className="block text-xs text-slate-500 truncate">{result.subtitle}</span>}
              </li>
            ))}
          </ul>
          {results.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No matches</p>}
          {matches.length > results.length && (
            <p className="px-3 py-2 text-xs text-slate-500 border-t border-slate-100">
              Showing {results.length} of {matches.length}. Keep typing to narrow it down.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
