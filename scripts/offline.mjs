#!/usr/bin/env node
/**
 * La prova che conta: l'app in modalità aereo.
 *
 * Un service worker corretto da leggere e rotto all'uso è la norma, non
 * l'eccezione. Qui si carica l'app una volta con la rete, poi si spegne la
 * rete davvero e si verifica che tutto continui: schermate, scrittura di un
 * dato nuovo, riavvio. Alla fine si spegne anche il server, perché in
 * palestra non c'è nessun server da nessuna parte.
 *
 *   npm run offline
 *
 * Richiede Chromium. Fuori da `npm run verify`, che deve girare ovunque.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { launchOptions } from './chromium.mjs';
import { completeOnboarding } from './onboarding.mjs';
import { buildForTests, signInForTests, startEmulators, stopGroup } from './testenv.mjs';

const PORT = 4182;
const BASE = `http://localhost:${String(PORT)}`;

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {
      /* non ancora su */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Il server di anteprima non è partito.');
}

const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
}

/**
 * Carica una schermata e dice se ci è riuscita.
 *
 * Senza rete e senza cache la navigazione non fallisce piano: solleva
 * ERR_INTERNET_DISCONNECTED. Va raccolto, altrimenti la prova muore prima di
 * dire quale controllo è saltato.
 */
async function open(page, url) {
  try {
    await page.goto(url, { waitUntil: 'load' });
    return true;
  } catch (cause) {
    failures.push(`Non si apre senza rete: ${url} (${String(cause)})`);
    return false;
  }
}

/** Attende che il service worker sia installato e abbia preso il comando. */
async function waitForController(page, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const controlled = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      await navigator.serviceWorker.ready;
      return navigator.serviceWorker.controller !== null;
    });
    if (controlled) return true;
    await page.waitForTimeout(300);
  }
  return false;
}

buildForTests();
const emulators = await startEmulators();

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: true,
});
let serverStopped = false;
function stopServer() {
  if (serverStopped) return;
  serverStopped = true;
  stopGroup(server);
}

let browser;
try {
  await waitForServer();

  browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  /*
   * Ogni richiesta uscita dal browser, per poter dire con un controllo e non
   * con una promessa che l'app non parla con nessuno.
   */
  const requested = [];
  page.on('request', (request) => requested.push(request.url()));

  /*
   * Una risposta di errore che arriva dal service worker significa un file che
   * doveva essere in cache e non c'era. È così che l'app si apre bianca: la
   * pagina c'è, il codice no.
   */
  const notCached = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && response.fromServiceWorker()) {
      notCached.push(`${String(response.status())} ${new URL(response.url()).pathname}`);
    }
  });

  /* ----------------------- Primo avvio, con rete ------------------------ */

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  check(await waitForController(page), 'Il service worker deve prendere il comando al primo avvio.');

  // L'accesso ha bisogno di rete, una volta sola: si fa adesso, con la rete
  // ancora accesa, e da qui in poi la sessione resta valida anche in aereo.
  await signInForTests(page);

  const precached = await page.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find((key) => key.startsWith('shadow-'));
    if (name === undefined) return null;
    const cache = await caches.open(name);
    const keys = await cache.keys();
    return { name, urls: keys.map((request) => new URL(request.url).pathname) };
  });

  check(precached !== null, 'Il service worker deve creare una cache "shadow-...".');

  if (precached !== null) {
    for (const required of ['/index.html', '/manifest.webmanifest', '/icons/icon-512.png']) {
      check(
        precached.urls.includes(required),
        `${required} deve essere in cache: senza, l'installazione offline non è completa.`,
      );
    }
    check(
      precached.urls.some((path) => path.endsWith('.js')),
      'Il codice dell’app deve essere in cache.',
    );
    check(
      precached.urls.some((path) => path.endsWith('.css')),
      'Il foglio di stile deve essere in cache.',
    );
  }

  await completeOnboarding(page, BASE);

  /*
   * Da quando i dati stanno su Firebase, «nessuna chiamata di rete» non è più
   * vero e non ha senso pretenderlo. Quello che resta vero, e che questo
   * controllo difende, è che l'app parli solo con sé stessa e con Firebase:
   * nessuna CDN, nessuna analitica, nessun terzo comparso per sbaglio.
   *
   * Nelle prove Firebase è l'emulatore, quindi tutto deve essere locale.
   */
  const foreign = [...new Set(requested)].filter((url) => {
    const host = new URL(url).hostname;
    return host !== 'localhost' && host !== '127.0.0.1';
  });
  check(
    foreign.length === 0,
    `L’app deve parlare solo con sé stessa e con Firebase. Contattati anche: ${foreign.join(', ')}`,
  );

  /* --------------------------- Modalità aereo --------------------------- */

  await context.setOffline(true);

  const reopened = await open(page, BASE);
  await page.waitForTimeout(1500);

  check(
    reopened && (await page.locator('#root').innerText().catch(() => '')).trim() !== '',
    'Senza rete l’app deve aprirsi, non restare bianca.',
  );
  check(
    (await page.getByRole('navigation').count()) > 0,
    'Senza rete la barra di navigazione deve esserci.',
  );

  const startButton = page.getByRole('button', { name: 'Inizia', exact: true });
  check(
    (await startButton.count()) > 0,
    'Senza rete la Home deve proporre la seduta del giorno, con i dati già salvati.',
  );

  /* Le schermate pesanti: grafici, illustrazioni, scala di progressione. */

  await open(page, `${BASE}/#/esercizi`);
  await page.waitForTimeout(900);
  check(
    (await page.getByText('36 schede').count()) > 0,
    'Senza rete la libreria deve elencare tutti gli esercizi.',
  );

  // Rotta profonda, non un clic: senza rete deve funzionare anche riaprendo
  // l'app direttamente su una schermata interna.
  await open(page, `${BASE}/#/esercizi/trazioni-prona-presa-media`);
  await page.waitForTimeout(900);
  check(
    (await page.locator('svg').count()) > 0,
    'Senza rete l’illustrazione dell’esercizio deve comparire: è dentro il codice, non su un server.',
  );
  check(
    (await page.getByRole('link', { name: 'Cerca un video' }).count()) > 0,
    'Il pulsante di ricerca video deve esserci anche offline: è un link, si aprirà quando ci sarà rete.',
  );

  /* ------------------- Scrittura di un dato, senza rete ------------------ */

  await open(page, `${BASE}/#/misure`);
  await page.waitForTimeout(1200);

  // Il campo del peso appare per il giorno scelto: prima si sceglie il giorno.
  const days = page.getByTestId('week-strip').locator('button:not([disabled])');
  const dayCount = await days.count();
  check(dayCount > 0, 'Senza rete la striscia della settimana deve comparire.');
  if (dayCount > 0) {
    await days.nth(dayCount - 1).click();
    await page.waitForTimeout(400);
  }

  const weightField = page.locator('input[type=number]').first();
  const canWrite = (await weightField.count()) > 0;
  check(canWrite, 'Senza rete la schermata Misure deve mostrare il campo del peso.');

  if (canWrite) {
    await weightField.fill('');
    await weightField.pressSequentially('79', { delay: 60 });
    await weightField.blur();
    await page.waitForTimeout(700);

    check(
      (await weightField.inputValue()) === '79',
      'Senza rete deve essere possibile scrivere una misura.',
    );
  }

  /* --------------- Riavvio senza rete e senza server vivo --------------- */

  stopServer();
  await page.waitForTimeout(600);

  await open(page, `${BASE}/#/misure`);
  await page.waitForTimeout(1400);

  const reread = page.locator('input[type=number]').first();
  check(
    (await reread.count()) > 0 && (await reread.inputValue()) === '79',
    'Riaprendo l’app senza rete la misura scritta offline deve essere ancora lì.',
  );

  /*
   * Ultimo giro: rete "accesa" ma server spento, che è il caso del wifi della
   * palestra che risponde e non porta da nessuna parte.
   */
  await context.setOffline(false);
  await open(page, BASE);
  await page.waitForTimeout(1400);

  check(
    (await page.getByRole('navigation').count()) > 0,
    'Con il server irraggiungibile l’app deve aprirsi lo stesso dalla cache.',
  );

  check(
    notCached.length === 0,
    `File chiesti senza rete e non trovati in cache: ${[...new Set(notCached)].join(', ')}`,
  );
  check(errors.length === 0, `Errori JavaScript durante la prova: ${errors.join(' | ')}`);
} finally {
  if (browser !== undefined) await browser.close();
  stopServer();
  stopGroup(emulators);
}

if (failures.length > 0) {
  console.error('Prova offline fallita:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('Prova offline superata: l’app funziona in modalità aereo e con il server spento.');
