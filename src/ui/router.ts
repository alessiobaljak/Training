import { useEffect, useState } from 'react';
import { PROGRAM_SESSIONS } from '../data/program.ts';
import type { SessionId } from '../types/index.ts';

/**
 * Router minimo basato sull'hash.
 *
 * Nessuna libreria: l'hash non richiede configurazione del server, funziona
 * identico da file locale e da service worker, e il tasto indietro di Android
 * continua a fare quello che l'utente si aspetta.
 */

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'onboarding' }
  | { readonly name: 'session'; readonly sessionId: SessionId }
  | { readonly name: 'log' }
  | { readonly name: 'progress' }
  | { readonly name: 'measures' }
  | { readonly name: 'library' }
  | { readonly name: 'exercise'; readonly slug: string }
  /** Revisione di fine settimana: `week` è la settimana appena chiusa. */
  | { readonly name: 'review'; readonly week: number }
  | { readonly name: 'settings' };

export const HOME: Route = { name: 'home' };

const SESSION_IDS: readonly string[] = PROGRAM_SESSIONS.map((session) => session.id);

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'onboarding':
      return '#/test';
    case 'session':
      return `#/seduta/${route.sessionId}`;
    case 'log':
      return '#/log';
    case 'progress':
      return '#/progressi';
    case 'measures':
      return '#/misure';
    case 'library':
      return '#/esercizi';
    case 'exercise':
      return `#/esercizi/${route.slug}`;
    case 'review':
      return `#/revisione/${String(route.week)}`;
    case 'settings':
      return '#/impostazioni';
  }
}

/** Una rotta sconosciuta riporta alla Home invece di mostrare una pagina vuota. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  const [first, second] = path.split('/');

  switch (first) {
    case '':
    case undefined:
      return HOME;
    case 'test':
      return { name: 'onboarding' };
    case 'seduta':
      if (second !== undefined && SESSION_IDS.includes(second)) {
        return { name: 'session', sessionId: second as SessionId };
      }
      return HOME;
    case 'log':
      return { name: 'log' };
    case 'progressi':
      return { name: 'progress' };
    case 'misure':
      return { name: 'measures' };
    case 'esercizi':
      return second === undefined || second === ''
        ? { name: 'library' }
        : { name: 'exercise', slug: second };
    case 'revisione': {
      const week = Number.parseInt(second ?? '', 10);
      return Number.isInteger(week) && week > 0 ? { name: 'review', week } : HOME;
    }
    case 'impostazioni':
      return { name: 'settings' };
    default:
      return HOME;
  }
}

export function navigate(route: Route): void {
  window.location.hash = routeToHash(route);
}

/** Sostituisce la voce corrente invece di aggiungerne una: per i redirect. */
export function replaceRoute(route: Route): void {
  window.history.replaceState(null, '', routeToHash(route));
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = (): void => {
      setRoute(parseRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  return route;
}
