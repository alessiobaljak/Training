/**
 * Il confine con il browser: service worker, installazione, spazio su disco.
 *
 * Tutto quello che qui dentro può fallire fallisce in silenzio e restituisce
 * uno stato leggibile. Un browser che non supporta una di queste API non deve
 * impedire di registrare una serie.
 */
import type { InstallInput, OfflineState, StorageState } from './offline.ts';

/**
 * Evento non standard di Chrome: non è nelle definizioni del DOM, quindi lo
 * dichiariamo qui invece di allargare un tipo con `any`.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  return 'prompt' in event && typeof (event as InstallPromptEvent).prompt === 'function';
}

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Si iscrive ai cambi di stato dell'installazione (pulsante Installa). */
export function onInstallStateChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Registra il service worker e cattura l'evento di installazione.
 *
 * Solo nel build di produzione: in sviluppo una cache dell'app renderebbe
 * invisibile ogni modifica.
 */
export function startPwa(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Senza questo Chrome mostra la sua barra, che qui non serve: il pulsante
    // sta nella schermata Dati, insieme al backup.
    event.preventDefault();
    if (isInstallPromptEvent(event)) {
      deferredPrompt = event;
      notify();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });

  // Quando l'app è già installata la richiesta di archiviazione persistente
  // non apre nessuna finestra: la facciamo da soli. Da browser invece Firefox
  // chiederebbe un permesso a freddo, quindi lì resta il pulsante nei Dati.
  if (isStandalone()) void requestPersistence();

  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  /*
   * Quando un service worker nuovo prende il comando, la pagina aperta sta
   * ancora usando il codice vecchio: `clients.claim()` cambia chi risponde
   * alle richieste, non quello che è già stato caricato. Senza questo giro,
   * una correzione pubblicata richiede due ricaricamenti per farsi vedere, e
   * chi ne fa uno solo pensa che non sia stata pubblicata.
   *
   * Si ricarica solo se un service worker c'era già: alla primissima
   * installazione non c'è niente di vecchio da sostituire.
   */
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller !== null) {
    let ricaricando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (ricaricando) return;
      ricaricando = true;
      window.location.reload();
    });
  }

  window.addEventListener('load', () => {
    // `updateViaCache: 'none'` impedisce al browser di servire un sw.js vecchio
    // dalla sua cache HTTP: è l'unico file che deve poter cambiare.
    void navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {
      // Un service worker che non parte non è un errore fatale: l'app funziona
      // lo stesso finché c'è rete.
    });
  });
}

export function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS non implementa display-mode: espone questa proprietà su navigator.
  const legacy: unknown = (navigator as { standalone?: unknown }).standalone;
  return legacy === true;
}

export function readInstallInput(): InstallInput {
  return { standalone: isStandalone(), promptAvailable: deferredPrompt !== null };
}

/** Mostra il prompt nativo. Restituisce true se l'utente ha accettato. */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt;
  if (event === null) return false;
  deferredPrompt = null;
  notify();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === 'accepted';
}

export function readOfflineState(): OfflineState {
  const supported = 'serviceWorker' in navigator;
  return {
    supported,
    controlled: supported && navigator.serviceWorker.controller !== null,
  };
}

export async function readStorageState(): Promise<StorageState> {
  if (!('storage' in navigator)) {
    return { persisted: false, usageBytes: null, quotaBytes: null };
  }

  const persisted = await navigator.storage.persisted().catch(() => false);
  const estimate = await navigator.storage.estimate().catch(() => null);

  return {
    persisted,
    usageBytes: estimate?.usage ?? null,
    quotaBytes: estimate?.quota ?? null,
  };
}

/**
 * Chiede al browser di non cancellare i dati per fare spazio.
 *
 * Chrome la concede da solo quando l'app è installata; Safari la lega
 * all'aggiunta alla schermata Home. Un rifiuto non è un errore.
 */
export async function requestPersistence(): Promise<boolean> {
  if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') return false;
  return navigator.storage.persist().catch(() => false);
}
