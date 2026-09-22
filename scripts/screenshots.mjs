#!/usr/bin/env node
/**
 * Fotografie delle schermate, nei due temi.
 *
 * Una modifica ai colori non si verifica leggendo il diff: si verifica
 * guardandola. Questo script porta l'app fino a dopo l'onboarding e fotografa
 * le schermate principali, prima in chiaro e poi in scuro, così le due
 * versioni si possono mettere una accanto all'altra.
 *
 *   npm run shots
 *
 * Le immagini finiscono in `.screenshots/`, che non è versionata.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { chromium } from 'playwright';
import { launchOptions } from './chromium.mjs';
import { completeOnboarding } from './onboarding.mjs';
import { buildForTests, signInForTests, startEmulators, stopGroup } from './testenv.mjs';

const PORT = 4183;
const BASE = `http://localhost:${String(PORT)}`;
const OUT = '.screenshots';

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

/** Le schermate che vale la pena guardare: sono quelle con più colore sopra. */
const PAGINE = [
  ['home', '#/'],
  ['seduta', '#/seduta/upper-a'],
  ['esercizio', '#/esercizi/trazioni-prona-presa-media'],
  ['progressi', '#/progressi'],
  ['impostazioni', '#/impostazioni'],
];

buildForTests();
const emulators = await startEmulators();
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: true,
});

let browser;
try {
  await waitForServer();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await signInForTests(page);
  await completeOnboarding(page, BASE);

  for (const tema of ['chiaro', 'scuro']) {
    await page.evaluate((scelta) => {
      window.localStorage.setItem('shadow:tema', scelta);
    }, tema);

    for (const [nome, rotta] of PAGINE) {
      /*
       * `goto` verso un indirizzo che cambia solo nell'hash non ricarica
       * niente: resta la pagina di prima, con la sua posizione di scorrimento
       * e il tema già applicato. Le prime fotografie del tema scuro sono
       * uscite chiare proprio così. Un ricaricamento vero per ogni schermata.
       */
      await page.goto(`${BASE}/${rotta}`, { waitUntil: 'load' });
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(1700);
      await page.screenshot({ path: `${OUT}/${tema}-${nome}.png` });
    }
  }

  console.log(`Fotografie in ${OUT}/`);
} finally {
  await browser?.close();
  stopGroup(server);
  stopGroup(emulators);
}
