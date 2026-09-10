import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App.tsx';
import { ErrorBoundary } from './ui/ErrorBoundary.tsx';
import { startPwa } from './pwa/platform.ts';

/**
 * Avvio dell'app.
 *
 * Tutto è dentro un try: un errore qui, prima che React disegni, lascerebbe
 * una pagina bianca senza una riga che spieghi cosa è successo. La pagina
 * bianca è il modo peggiore di fallire, perché non dà niente su cui lavorare
 * né a chi la usa né a chi deve ripararla.
 */
function showFatalError(cause: unknown): void {
  const message = cause instanceof Error ? cause.message : String(cause);
  document.body.innerHTML = '';

  const box = document.createElement('div');
  box.style.cssText =
    'padding:24px;font:14px/1.6 system-ui;color:#eef3f8;background:#0b0f14;min-height:100vh';
  box.innerHTML =
    '<p style="font-size:20px;font-weight:600;margin:0 0 12px">L’app non è partita</p>' +
    '<p style="color:#9fb0c0;margin:0 0 16px">Ricaricare di solito basta. Se torna, questo è il motivo:</p>';

  const detail = document.createElement('pre');
  detail.style.cssText =
    'white-space:pre-wrap;word-break:break-word;background:#151b23;border:1px solid #2c3846;border-radius:12px;padding:12px;color:#ff6b6b;font-size:12px';
  detail.textContent = message;
  box.appendChild(detail);
  document.body.appendChild(box);
}

try {
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
} catch (cause) {
  showFatalError(cause);
}
