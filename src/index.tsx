import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { migrateLocalState } from './application/migrateLocalState';
import App from './ui/App';
import { createHttpStateClient } from './infrastructure/http/httpStateClient';
import { readLocalState } from './infrastructure/persistence/readLocalState';
import { createRemoteRepositories } from './infrastructure/persistence/remoteRepositories';
import { resumeData } from './infrastructure/seed/defaultResume';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const client = createHttpStateClient();
const { title, ...defaultProfile } = resumeData.personal;

const start = async () => {
  root.render(<p className="p-10 text-sm text-slate-500 font-sans">Loading…</p>);
  try {
    const state = await migrateLocalState(await client.load(), readLocalState(localStorage), client);
    const remote = createRemoteRepositories(state, client, defaultProfile);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') remote.flush({ keepalive: true });
    });
    window.addEventListener('beforeunload', (event) => {
      if (remote.status.get() !== 'saved') event.preventDefault();
    });

    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App repositories={remote.repositories} saveStatus={remote.status} onRetrySave={remote.retry} />
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch {
    root.render(
      <div className="p-10 space-y-4 font-sans">
        <p className="text-sm text-slate-700">Couldn't load your data from the server.</p>
        <button onClick={start} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">
          Retry
        </button>
      </div>
    );
  }
};

start();
