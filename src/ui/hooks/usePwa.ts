import { useCallback, useEffect, useState } from 'react';
import {
  onInstallStateChange,
  promptInstall,
  readInstallInput,
  readOfflineState,
  readStorageState,
  requestPersistence,
} from '../../pwa/platform.ts';
import { installState, offlineAdvice, storageAdvice } from '../../pwa/offline.ts';
import type { Advice, InstallState, StorageState } from '../../pwa/offline.ts';

export interface PwaStatus {
  readonly offline: Advice;
  readonly install: InstallState;
  readonly storage: StorageState | null;
  readonly storageAdvice: Advice | null;
  /** Apre il prompt nativo di installazione, dove il browser lo permette. */
  readonly askToInstall: () => void;
  /** Chiede di non cancellare i dati per fare spazio. */
  readonly askForPersistence: () => void;
}

/**
 * Stato della copia offline, dell'installazione e dello spazio.
 *
 * Sono tutte informazioni che cambiano fuori da React: il service worker
 * prende il comando dopo il primo avvio, il prompt di installazione arriva
 * quando decide il browser. Qui le si rilegge e basta.
 */
export function usePwaStatus(): PwaStatus {
  const [install, setInstall] = useState<InstallState>(() => installState(readInstallInput()));
  const [offline, setOffline] = useState<Advice>(() => offlineAdvice(readOfflineState()));
  const [storage, setStorage] = useState<StorageState | null>(null);

  const refreshStorage = useCallback((): void => {
    void readStorageState().then(setStorage);
  }, []);

  useEffect(() => {
    refreshStorage();

    const sync = (): void => {
      setInstall(installState(readInstallInput()));
      setOffline(offlineAdvice(readOfflineState()));
    };
    sync();

    const stop = onInstallStateChange(sync);
    if (!('serviceWorker' in navigator)) return stop;

    // Al primo avvio il service worker prende il comando dopo il caricamento:
    // senza questo l'avviso resterebbe giallo fino al riavvio successivo.
    navigator.serviceWorker.addEventListener('controllerchange', sync);
    return () => {
      stop();
      navigator.serviceWorker.removeEventListener('controllerchange', sync);
    };
  }, [refreshStorage]);

  const askToInstall = useCallback((): void => {
    void promptInstall().then(() => {
      setInstall(installState(readInstallInput()));
    });
  }, []);

  const askForPersistence = useCallback((): void => {
    void requestPersistence().then(refreshStorage);
  }, [refreshStorage]);

  return {
    offline,
    install,
    storage,
    storageAdvice: storage === null ? null : storageAdvice(storage),
    askToInstall,
    askForPersistence,
  };
}
