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
  /* La scheda del circuito: tutto quello che si vede prima di iniziare. */
  ['scheda', '#/scheda/circuito-1'],
  /*
   * Il player guidato si apre sul primo passo di riscaldamento. Le altre due
   * facce — la stazione di lavoro con il countdown e il recupero — si
   * raggiungono avanzando, perché sono quelle che si guardano davvero durante
   * la seduta e sono le uniche in cui il cronometro è grande come deve essere.
   */
  ['guidata-riscaldamento', '#/seduta/circuito-1'],
  /* Il giro di prova: un passo per esercizio, con il suo nome e la sua figura. */
  ['guidata-rampa', '#/seduta/circuito-1', 10],
  ['guidata-lavoro', '#/seduta/circuito-1', 14],
  ['guidata-recupero', '#/seduta/circuito-1', 1],
  /*
   * Il player a serie delle sedute archiviate: non si usa più, ma deve
   * continuare a leggere lo storico senza cadere.
   */
  ['archivio-seduta', '#/seduta/upper-a'],
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

    for (const [nome, rotta, avanti = 0, apri = null] of PAGINE) {
      /*
       * `goto` verso un indirizzo che cambia solo nell'hash non ricarica
       * niente: resta la pagina di prima, con la sua posizione di scorrimento
       * e il tema già applicato. Le prime fotografie del tema scuro sono
       * uscite chiare proprio così. Un ricaricamento vero per ogni schermata.
       */
      await page.goto(`${BASE}/${rotta}`, { waitUntil: 'load' });
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(1700);

      if (apri !== null) {
        const pulsante = page.getByRole('button', { name: apri });
        if ((await pulsante.count()) > 0) {
          await pulsante.first().click();
          await page.waitForTimeout(700);
        }
      }

      for (let passo = 0; passo < avanti; passo += 1) {
        /*
         * Due player, due modi di avanzare. Quello a serie ha i pulsanti
         * «B1 · serie 2 ›»; quello guidato ha un passo alla volta e lo si
         * attraversa con «Avanti», «Salta il recupero» o «Via» + «Fatto».
         */
        const aSerie = page.getByRole('button', { name: /serie \d+ ›$/ });
        if ((await aSerie.count()) > 0) {
          await aSerie.click();
          await page.waitForTimeout(700);
          continue;
        }
        const guidato = page.getByRole('button', {
          name: /^(Avanti|Salta il recupero|Via|Fatto)$/,
        });
        if ((await guidato.count()) === 0) break;
        await guidato.first().click();
        await page.waitForTimeout(500);
      }

      /* Dopo un tocco su «avanti» la pagina resta dov'era: la foto deve
         partire dall'alto, altrimenti si fotografa il fondo della schermata. */
      await page.evaluate(() => {
        document.querySelector('main')?.closest('div.overflow-y-auto')?.scrollTo(0, 0);
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${tema}-${nome}.png` });
    }
  }

  console.log(`Fotografie in ${OUT}/`);
} finally {
  await browser?.close();
  stopGroup(server);
  stopGroup(emulators);
}
