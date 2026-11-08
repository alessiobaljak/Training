import { useEffect } from 'react';

/**
 * Tiene lo schermo acceso mentre la seduta guidata è aperta.
 *
 * Senza, il telefono si spegne dopo trenta secondi di recupero e il player
 * diventa inutilizzabile proprio nel momento in cui serve: quello in cui non
 * lo stai toccando. Il cronometro continuerebbe a contare — è calcolato dagli
 * istanti e non dai tick — ma non lo vedresti, e il segnale di fine recupero
 * arriverebbe a schermo nero.
 *
 * Tre cose che questa API fa e che vanno gestite:
 *
 * 1. Non esiste ovunque. Safari la supporta dalla 16.4, e dove manca l'unica
 *    risposta onesta è lasciare che lo schermo si spenga: nessun errore.
 * 2. Si rilascia da sola quando la pagina va in secondo piano, e **non** si
 *    riprende da sola quando torna. Senza il riaggancio su `visibilitychange`
 *    basta una notifica per perderla per il resto della seduta.
 * 3. La richiesta può fallire — batteria quasi scarica, risparmio energetico —
 *    e non è un errore da mostrare.
 */

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

function wakeLockApi(): WakeLockLike | null {
  if (typeof navigator === 'undefined') return null;
  const candidate = (navigator as { wakeLock?: WakeLockLike }).wakeLock;
  return candidate ?? null;
}

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const api = wakeLockApi();
    if (api === null) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let annullato = false;

    const acquire = async (): Promise<void> => {
      if (annullato || document.visibilityState !== 'visible') return;
      try {
        sentinel = await api.request('screen');
        if (annullato) {
          void sentinel.release();
          sentinel = null;
          return;
        }
        sentinel.addEventListener('release', () => {
          sentinel = null;
        });
      } catch {
        /* Un blocco negato non deve fermare la seduta. */
      }
    };

    const onVisibility = (): void => {
      if (document.visibilityState === 'visible' && sentinel === null) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      annullato = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel !== null) {
        void sentinel.release();
        sentinel = null;
      }
    };
  }, [active]);
}
