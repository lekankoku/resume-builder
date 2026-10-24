import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './ui/App';
import { createLocalStorageRepositories } from './infrastructure/persistence/localStorageRepositories';
import { resumeData } from './infrastructure/seed/defaultResume';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const repositories = createLocalStorageRepositories(localStorage, resumeData);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App repositories={repositories} />
    </BrowserRouter>
  </React.StrictMode>
);
