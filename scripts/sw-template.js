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

  // Fuori dall'app non tocchiamo niente: il pulsante "Cerca un video" apre
  // YouTube in un'altra scheda e quella richiesta non deve passare da qui.
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(serve(request));
});

async function serve(request) {
  const cache = await caches.open(CACHE);

  // Qualunque indirizzo dell'app apre la stessa pagina: le schermate sono
  // nell'hash, non nel percorso.
  const key = request.mode === 'navigate' ? SHELL : request;

  const hit = await cache.match(key);
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
