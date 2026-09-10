import { useEffect, useState } from 'react';
import { repository } from '../../db/repository.ts';

/**
 * Legge dal magazzino e rilegge a ogni cambiamento.
 *
 * Restituisce `undefined` finché la prima lettura non è finita: è la
 * differenza tra «sto caricando» e «non c'è nulla», e i componenti devono
 * distinguerle o mostreranno un lampo di schermata sbagliata al primo avvio.
 *
 * I cambiamenti arrivano sia dalle scritture locali sia dalla
 * sincronizzazione: se registri una serie sul telefono, l'iPad aperto sulla
 * stessa pagina si aggiorna da solo.
 */
export function useStoreQuery<T>(run: () => Promise<T>, deps: readonly unknown[]): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    let alive = true;

    const load = (): void => {
      void run()
        .then((next) => {
          if (alive) setValue(next);
        })
        .catch(() => {
          // Una lettura fallita non azzera quello che c'è già a schermo.
        });
    };

    load();
    const stop = repository.subscribe(load);
    return () => {
      alive = false;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
