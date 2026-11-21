#!/usr/bin/env node
/*
 * 20 — R-16 nel browser: un ritest con la data di inizio impostata la riscrive?
 *
 * Esegue l'app vera (build, emulatori, anteprima, Chromium) e misura dal
 * database, non dal codice:
 *   1. primo giro completo con «Parti questa settimana»: la data si scrive;
 *   2. data spostata indietro di 6 settimane (settimana 6 o 7 del programma);
 *   3. ritest completo tranne l'ultimo test (saltato): cosa mostra il
 *      riepilogo, quale pulsante, attivo o no;
 *   4. chiusura dal riepilogo: la data nel database dopo;
 *   5. «Cancella tutti i dati»: la data torna nulla e il giro dei test chiede
 *      di nuovo quando parte il programma.
 *
 * Uso, dalla radice di un `git archive` COMPLETO del commit da misurare, con
 * `node_modules` collegato e le porte 8080/9099 libere (mai in parallelo con
 * smoke o offline):  node quality/scripts/20-ritest-r16.mjs
 * Stampa una riga per misura e un JSON finale.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { launchOptions } from '../../scripts/chromium.mjs';
import { CASES, completeOnboarding } from '../../scripts/onboarding.mjs';
import {
  buildForTests,
  readFromEmulator,
  signInForTests,
  startEmulators,
  stopGroup,
  updateInEmulator,
} from '../../scripts/testenv.mjs';

const PORT = 4195;
const BASE = `http://localhost:${String(PORT)}`;
const out = {};
const log = (k, v) => {
  out[k] = v;
  console.log(`${k}: ${JSON.stringify(v)}`);
};

async function startDate() {
  const righe = await readFromEmulator('settings');
  const f = righe[0]?.fields?.programStartDate;
  return { name: righe[0]?.name, value: f?.stringValue ?? (f?.nullValue === undefined ? undefined : null) };
}

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      /* non ancora */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('anteprima non partita');
}

async function riepilogo(page) {
  const testo = await page.locator('main').innerText().catch(() => '');
  const pulsanti = {};
  for (const nome of ['Salva e torna alla Home', 'Conferma e vai alla Home', 'Parti questa settimana', 'Parti la settimana prossima']) {
    const b = page.getByRole('button', { name: nome });
    const n = await b.count();
    pulsanti[nome] = n === 0 ? 'assente' : (await b.first().isDisabled()) ? 'disattivo' : 'attivo';
  }
  const mancano = page.getByRole('button', { name: /^Mancano \d+ test$/ });
  pulsanti['Mancano N test'] = (await mancano.count()) === 0 ? 'assente' : `${await mancano.first().innerText()} (${(await mancano.first().isDisabled()) ? 'disattivo' : 'attivo'})`;
  /* innerText applica text-transform: i titoli di sezione escono in maiuscolo. */
  return { quandoParte: /quando parte il programma/i.test(testo), pulsanti };
}

buildForTests();
const emulators = await startEmulators();
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
let browser;
try {
  await waitForServer();
  browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await signInForTests(page);

  /* 1. primo giro, come lo fa la prova di fumo */
  await completeOnboarding(page, BASE);
  await page.waitForTimeout(800);
  const d1 = await startDate();
  log('1 data dopo il primo giro', d1.value);

  /* 2. data indietro di 6 settimane */
  const indietro = new Date(`${d1.value}T00:00:00Z`);
  indietro.setUTCDate(indietro.getUTCDate() - 42);
  const d2 = indietro.toISOString().slice(0, 10);
  await updateInEmulator(d1.name, { programStartDate: { stringValue: d2 } });
  await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  log('2 data impostata (settimana 6-7)', (await startDate()).value);
  const home = await page.locator('main').innerText().catch(() => '');
  log('2 home: settimana', (home.match(/settimana\s+\d+/i) ?? ['?'])[0]);

  /* 3. ritest: tutti i test tranne l'ultimo, che si salta */
  await page.goto(`${BASE}/#/test`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Inizia i test' }).click();
  await page.waitForTimeout(400);
  for (const [i, c] of CASES.entries()) {
    if (i === CASES.length - 1) {
      await page.getByRole('button', { name: 'Salta questo test' }).click();
    } else {
      const inputs = page.locator('input[type=number]');
      const n = await inputs.count();
      for (let k = 0; k < n; k += 1) await inputs.nth(k).fill(String(c.value));
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: 'Salva e continua' }).click();
    }
    await page.waitForTimeout(400);
    const skip = page.getByRole('button', { name: 'Salta il recupero' });
    if ((await skip.count()) > 0) {
      await skip.click();
      await page.waitForTimeout(300);
    }
  }
  await page.waitForTimeout(600);
  log('3 riepilogo del ritest', await riepilogo(page));

  /* 4. chiusura dal riepilogo, col pulsante che c'è */
  const salva = page.getByRole('button', { name: 'Salva e torna alla Home' });
  const conferma = page.getByRole('button', { name: 'Conferma e vai alla Home' });
  if ((await salva.count()) > 0 && !(await salva.isDisabled())) {
    await salva.click();
    log('4 pulsante premuto', 'Salva e torna alla Home');
  } else {
    /* produzione: il pulsante è disattivo con un test mancante; si completa il giro rifacendo l'ultimo test */
    if ((await conferma.count()) === 0) {
      const mancante = page.getByRole('button', { name: /^Mancano \d+ test$/ });
      log('4 pulsante disattivo', (await mancante.count()) > 0 ? await mancante.innerText() : '?');
      await page.goto(`${BASE}/#/test`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const inputs = page.locator('input[type=number]');
      const n = await inputs.count();
      for (let k = 0; k < n; k += 1) await inputs.nth(k).fill(String(CASES.at(-1).value));
      await page.getByRole('button', { name: 'Salva e continua' }).click();
      await page.waitForTimeout(800);
      log('4b riepilogo col giro completo', await riepilogo(page));
    }
    await page.getByRole('button', { name: 'Conferma e vai alla Home' }).click();
    log('4 pulsante premuto', 'Conferma e vai alla Home');
  }
  await page.waitForTimeout(1200);
  log('4 hash dopo', new URL(page.url()).hash);
  const d4 = await startDate();
  log('4 data dopo la chiusura', d4.value);
  log('4 data riscritta', d4.value !== d2);

  /* 5. azzeramento: torna il primo giro */
  await page.goto(`${BASE}/#/impostazioni`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Cancella tutti i dati' }).click();
  await page.getByLabel('Scrivi CANCELLA per confermare').fill('CANCELLA');
  await page.getByRole('button', { name: 'Sì, cancella tutto' }).click();
  await page.waitForTimeout(3000);
  const d5 = await startDate();
  log('5 data dopo l’azzeramento', d5.value ?? null);
  await page.goto(`${BASE}/#/test`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Inizia i test' }).click();
  await page.waitForTimeout(300);
  for (let i = 0; i < CASES.length; i += 1) {
    await page.getByRole('button', { name: 'Salta questo test' }).click();
    await page.waitForTimeout(300);
    const skip = page.getByRole('button', { name: 'Salta il recupero' });
    if ((await skip.count()) > 0) await skip.click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(600);
  log('5 riepilogo del primo giro dopo l’azzeramento', await riepilogo(page));
  log('errori della pagina', errori);
} finally {
  await browser?.close();
  stopGroup(server);
  stopGroup(emulators);
}
console.log(JSON.stringify(out));
