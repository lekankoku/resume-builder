import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { migrateLocalState } from './application/migrateLocalState';
import App from './ui/App';
import { createHttpAiClient } from './infrastructure/http/httpAiClient';
import { createHttpDocumentClient } from './infrastructure/http/httpDocumentClient';
import { createHttpStateClient } from './infrastructure/http/httpStateClient';
import { readLocalState } from './infrastructure/persistence/readLocalState';
import { createRemoteRepositories } from './infrastructure/persistence/remoteRepositories';
import { resumeData } from './infrastructure/seed/defaultResume';
import { AppSkeleton } from './ui/shell/Skeleton';
import { shouldReloadForNewVersion } from './ui/staleBuild';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const client = createHttpStateClient();
const documents = createHttpDocumentClient();
const ai = createHttpAiClient();
const { title, ...defaultProfile } = resumeData.personal;

const start = async () => {
  root.render(<AppSkeleton />);
  try {
    const state = await migrateLocalState(await client.load(), readLocalState(localStorage), client);
    const remote = createRemoteRepositories(state, client, defaultProfile);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') remote.flush({ keepalive: true });
    });
    window.addEventListener('beforeunload', (event) => {
      if (remote.status.get() !== 'saved') event.preventDefault();
    });
    window.addEventListener('vite:preloadError', (event) => {
      if (!shouldReloadForNewVersion(sessionStorage, Date.now())) return;
      event.preventDefault();
      remote.flush().finally(() => window.location.reload());
    });

    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App repositories={remote.repositories} documents={documents} ai={ai} saveStatus={remote.status} onRetrySave={remote.retry} />
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
