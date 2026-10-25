import React, { useSyncExternalStore } from 'react';
import { ClipboardList, FileText, Files, LayoutDashboard, ListTodo, Plus, Settings2 } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { SaveStatusSource } from '../../application/ports/repositories';
import { Searchable } from '../../domain/application/search';
import GlobalSearch from './GlobalSearch';

interface Props {
  saveStatus: SaveStatusSource;
  onRetrySave: () => void;
  records: Searchable;
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Applications', icon: ClipboardList, end: false },
  { to: '/to-apply', label: 'To apply', icon: ListTodo, end: false },
  { to: '/cvs', label: 'CVs', icon: Files, end: false },
  { to: '/settings', label: 'Settings', icon: Settings2, end: false },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
    isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-slate-600 hover:bg-slate-50'
  }`;

const AppShell: React.FC<Props> = ({ saveStatus, onRetrySave, records }) => (
  <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
    <header className="no-print md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 pt-3 pb-2 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 text-slate-900">
          <span className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <FileText size={14} />
          </span>
          <span className="font-display text-base">Resume Builder</span>
        </Link>
        <SaveIndicator saveStatus={saveStatus} onRetry={onRetrySave} />
      </div>
      <GlobalSearch records={records} />
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto -mx-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
    </header>

    <aside className="no-print hidden md:flex w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex-col p-4 gap-6">
      <Link to="/" className="flex items-center gap-2 px-2 pt-2 text-slate-900">
        <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
          <FileText size={16} />
        </span>
        <span className="font-display text-lg">Resume Builder</span>
      </Link>

      <Link
        to="/applications/new"
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-all"
      >
        <Plus size={16} /> New application
      </Link>

      <GlobalSearch records={records} />

      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <SaveIndicator saveStatus={saveStatus} onRetry={onRetrySave} />
      </div>
    </aside>

    <main className="flex-1 min-w-0 px-4 py-6 md:px-10 md:py-8">
      <Outlet />
    </main>
  </div>
);

const SaveIndicator: React.FC<{ saveStatus: SaveStatusSource; onRetry: () => void }> = ({ saveStatus, onRetry }) => {
  const status = useSyncExternalStore(saveStatus.subscribe, saveStatus.get);

  if (status === 'error') {
    return (
      <div role="alert" className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">
        Couldn't save
        <button onClick={onRetry} className="font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <p role="status" className="flex items-center gap-2 px-3 text-xs text-slate-500">
      <span className={`w-2 h-2 rounded-full ${status === 'saving' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
      {status === 'saving' ? 'Saving…' : 'All changes saved'}
    </p>
  );
};

export default AppShell;
