import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App.tsx';
import { ErrorBoundary } from './ui/ErrorBoundary.tsx';
import { startPwa } from './pwa/platform.ts';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Elemento #root non trovato');
}

startPwa();

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
