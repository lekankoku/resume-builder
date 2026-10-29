import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { migrateLocalState } from './application/migrateLocalState';
import App from './ui/App';
import { primaryButtonClass } from './ui/applications/ApplicationsView';
import { createHttpAiClient } from './infrastructure/http/httpAiClient';
import { createHttpDocumentClient } from './infrastructure/http/httpDocumentClient';
import { createHttpStateClient } from './infrastructure/http/httpStateClient';
import { readLocalState } from './infrastructure/persistence/readLocalState';
import { createRemoteRepositories } from './infrastructure/persistence/remoteRepositories';
import { resumeData } from './infrastructure/seed/defaultResume';
import { AppSkeleton } from './ui/shell/Skeleton';
import { ToastProvider } from './ui/shell/Toast';
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
          <ToastProvider>
            <App repositories={remote.repositories} documents={documents} ai={ai} saveStatus={remote.status} onRetrySave={remote.retry} />
          </ToastProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch {
    root.render(
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
        <div role="alert" className="max-w-sm bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-center">
          <h1 className="text-base font-semibold text-slate-900">Couldn't load your data</h1>
          <p className="text-sm text-slate-600">The server didn't respond. Check your connection, then try again.</p>
          <button onClick={start} className={primaryButtonClass}>
            Try again
          </button>
        </div>
      </div>
    );
  }
};

start();
