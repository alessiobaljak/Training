/*
 * Service worker di Shadow.
 *
 * Regola dell'app: zero chiamate di rete a runtime. Qui è dove quella regola
 * diventa vera o falsa, quindi la strategia è una sola e non negoziabile:
 * al primo avvio si mette in cache tutto il necessario, e da lì in poi si
 * serve solo dalla cache. La rete è un ripiego per un file che manca, non la
 * strada normale.
 *
 * Il file non si scrive a mano: lo emette il plugin in vite.config.ts, che
 * sostituisce VERSION e PRECACHE con i nomi reali dei file compilati.
 * Modificare dist/sw.js non serve a niente: il prossimo build lo riscrive.
 */

const VERSION = '__VERSION__';
const CACHE = `shadow-${VERSION}`;

/** Tutti i file dell'app, con i nomi che portano già l'hash del contenuto. */
const PRECACHE = __PRECACHE__;

/** La pagina che risponde a qualunque navigazione: l'app è una sola schermata. */
const SHELL = './index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // Un build nuovo deve prendere il posto del vecchio subito: l'app non ha
      // code splitting, quindi non esistono pezzi vecchi da richiedere dopo.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('shadow-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Fuori dall'app non tocchiamo niente: il pulsante "Cerca un video" apre
  // YouTube in un'altra scheda e quella richiesta non deve passare da qui.
  if (url.origin !== self.location.origin) return;

  /*
   * `/__/auth/...` non è nostro: è la pagina di accesso di Firebase, che
   * arriva qui perché Vercel la devia sul nostro dominio.
   *
   * Senza questa riga il service worker se la mangia e risponde con
   * l'index.html dell'app. Il risultato è una pagina bianca: l'app viene
   * caricata da un percorso profondo, e siccome i suoi indirizzi sono
   * relativi va a cercare il proprio codice sotto /__/auth/, dove non c'è
   * niente. E la deviazione, che serviva proprio a far funzionare l'accesso,
   * non viene mai raggiunta.
   */
  if (url.pathname.startsWith('/__/')) return;

  event.respondWith(serve(request));
});

async function serve(request) {
  const cache = await caches.open(CACHE);

  // Qualunque indirizzo dell'app apre la stessa pagina: le schermate sono
  // nell'hash, non nel percorso.
  const key = request.mode === 'navigate' ? SHELL : request;

  /*
   * `ignoreVary` non è un dettaglio: senza, l'app si apre bianca senza rete.
   * Molti server statici rispondono con `Vary: Origin` (o `Accept-Encoding`),
   * e il browser chiede il bundle con l'header Origin mentre il precache lo
   * ha salvato senza. Stessa risorsa, richieste diverse, cache mancata.
   * Qui i nomi dei file portano l'hash del contenuto: l'indirizzo identifica
   * già i byte, quindi confrontare gli header non aggiunge niente.
   */
  const hit = await cache.match(key, { ignoreVary: true });
  if (hit !== undefined) return hit;

  // Da qui in poi siamo già fuori dal caso normale: un file che non era nel
  // precache. Proviamo la rete, ma senza rimanere appesi se non c'è.
  try {
    return await fetch(request);
  } catch {
    return new Response('Risorsa non disponibile offline.', {
      status: 504,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
