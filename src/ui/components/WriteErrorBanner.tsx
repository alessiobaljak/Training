import { useEffect, useState } from 'react';
import {
  clearWriteError,
  getWriteError,
  subscribeWriteErrors,
} from '../../db/write-errors.ts';

/**
 * Avviso quando il server rifiuta una scrittura.
 *
 * Le scritture non aspettano il server: si applicano in locale e partono, così
 * in palestra il pulsante risponde anche senza campo. Il rifiuto, se arriva,
 * arriva dopo. Senza questo avviso arriverebbe e basta, e un allenamento
 * registrato sparirebbe senza che nessuno lo veda.
 */
export function WriteErrorBanner() {
  const [message, setMessage] = useState<string | null>(getWriteError);

  useEffect(() => subscribeWriteErrors(() => { setMessage(getWriteError()); }), []);

  if (message === null) return null;

  return (
    <div className="shrink-0 border-b border-danger/40 bg-danger/15 px-4 py-3 text-sm text-ink">
      <p className="font-semibold">Una modifica non è stata salvata</p>
      <p className="mt-1 leading-relaxed">{message}</p>
      <button
        type="button"
        className="mt-2 min-h-10 text-xs font-semibold text-dim underline"
        onClick={clearWriteError}
      >
        Ho capito
      </button>
    </div>
  );
}
