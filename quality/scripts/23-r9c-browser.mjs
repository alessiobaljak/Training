#!/usr/bin/env node
/*
 * 23 — R9c (B16) nel browser: l'app vera (build, emulatori, anteprima, Chromium), misure dal database.
 *
 *   A. Chiusura dal player guidato: primo giro con push-up 10 (gradino 1); Seduta 3 aperta, due serie di
 *      push-up scritte nella bozza, poi «Esci dalla seduta» → «Chiudi la seduta» → «Salva e chiudi».
 *      Atteso dal 704dbfa: stato push-up salvato al gradino 1 (R9c punto 1).
 *   B. «Archivia» dalla Home: una seduta di ieri rimasta aperta con due serie di bulgaro, archiviata.
 *      Atteso da R9c punto 1: stato salvato. Misura il residuo (4n del nucleo).
 *   C. Ritest di settimana 6 (data di inizio indietro di 42 giorni) con valori alti: push-up 16, bulgaro 15.
 *      Atteso: push-up resta 1 (A); bulgaro, se non salvato in B, sale (residuo). Livelli letti anche dalla
 *      panoramica della seduta, cioè da quello che l'app mostra.
 *   D. Migrazione: «Cancella tutti i dati», primo giro di nuovo, una seduta chiusa con push-up scritta nel
 *      database senza stato, chiave `shadow.r9c.stati-fissati.<uid>` tolta, pagina ricaricata (attachUser).
 *      Atteso: stato push-up salvato al gradino 1 (R9c punto 2, ramo Firestore con getDocsFromServer).
 *      Poi ritest alto: resta 1.
 *
 * Uso, dalla radice di un `git archive` COMPLETO, `node_modules` collegato, porte 8080/9099 libere (mai in
 * parallelo con smoke o offline):  node quality/scripts/23-r9c-browser.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { launchOptions } from '../../scripts/chromium.mjs';
import { CASES } from '../../scripts/onboarding.mjs';
import {
  buildForTests, readFromEmulator, signInForTests, startEmulators, stopGroup, updateInEmulator, writeToEmulator,
} from '../../scripts/testenv.mjs';

const PORT = 4196;
const BASE = `http://localhost:${String(PORT)}`;
const out = {};
const log = (k, v) => { out[k] = v; console.log(`${k}: ${JSON.stringify(v)}`); };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

/* pull, dip, push, row, pike, bulgaro, nordic, hollow, dead hang (ordine di CASES) */
const BASSI = [5, 5, 10, 5, 5, 5, 4, 12, 60];
const ALTI = [10, 12, 16, 18, 8, 15, 4, 45, 60];

const daFs = (v) => {
  if (v === undefined || 'nullValue' in v) return null;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(daFs);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, daFs(x)]));
  return JSON.stringify(v);
};
const aFs = (x) => {
  if (x === null || x === undefined) return { nullValue: null };
  if (typeof x === 'boolean') return { booleanValue: x };
  if (typeof x === 'number') return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (typeof x === 'string') return { stringValue: x };
  if (Array.isArray(x)) return { arrayValue: { values: x.map(aFs) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, v]) => [k, aFs(v)])) } };
};
const doc = (d) => ({ name: d.name, ...daFs({ mapValue: { fields: d.fields ?? {} } }) });
async function stati() {
  return Object.fromEntries((await readFromEmulator('exerciseStates')).map(doc).map((s) => [s.exercise, [s.level, s.eccentricBonusSeconds, s.bottomPauseBonusSeconds, s.loadKg]]));
}
async function radice() {
  const s = (await readFromEmulator('settings'))[0];
  return { settings: s, parent: s.name.slice(0, s.name.indexOf('/settings/')), uid: s.name.split('/users/')[1].split('/')[0] };
}
const serie = (v, side = null) => v.map((x, i) => ({ setIndex: i + 1, side, value: x, rir: 2, loadKg: 0, heartRate: null, note: null }));
const oggi = () => new Date().toISOString().slice(0, 10);
const giorni = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* non ancora */ }
    await pausa(250);
  }
  throw new Error('anteprima non partita');
}

async function giroDeiTest(page, valori, primo) {
  await page.goto(`${BASE}/#/test`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const inizia = page.getByRole('button', { name: 'Inizia i test' });
  await inizia.waitFor({ state: 'visible', timeout: 30_000 });
  await inizia.click();
  await page.waitForTimeout(400);
  for (let i = 0; i < CASES.length; i += 1) {
    const inputs = page.locator('input[type=number]');
    const n = await inputs.count();
    for (let k = 0; k < n; k += 1) await inputs.nth(k).fill(String(valori[i]));
    await page.waitForTimeout(150);
    await page.getByRole('button', { name: 'Salva e continua' }).click();
    await page.waitForTimeout(400);
    const skip = page.getByRole('button', { name: 'Salta il recupero' });
    if ((await skip.count()) > 0) { await skip.click(); await page.waitForTimeout(300); }
  }
  await page.waitForTimeout(600);
  if (primo) {
    await page.getByRole('button', { name: 'Parti questa settimana' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'Conferma e vai alla Home' }).click();
  } else {
    await page.getByRole('button', { name: 'Salva e torna alla Home' }).click();
  }
  await page.waitForTimeout(1200);
}

async function indietroDi42(page) {
  const { settings } = await radice();
  const d = daFs(settings.fields.programStartDate);
  const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() - 42);
  await updateInEmulator(settings.name, { programStartDate: { stringValue: x.toISOString().slice(0, 10) } });
  await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  return x.toISOString().slice(0, 10);
}

async function panoramica(page, sid, chiavi) {
  await page.goto(`${BASE}/#/scheda/${sid}`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const testo = await page.locator('main').innerText().catch(() => '');
  return testo.split('\n').map((r) => r.trim()).filter((r) => chiavi.some((k) => k.test(r))).slice(0, 6);
}
const PUSH = [/push-up/i, /piegamenti/i];
const t0 = Date.now();
async function chiave(page, tag) {
  const v = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('shadow.r9c')).map((k) => [k.slice(-6), localStorage.getItem(k)])));
  log(`${tag} chiave R9c a ${String(Math.round((Date.now() - t0) / 1000))} s`, v);
}
const BULG = [/split squat/i, /bulgarian/i];

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
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errori.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
  let caricamenti = 0;
  page.on('load', () => { caricamenti += 1; });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await signInForTests(page);

  /* A */
  await giroDeiTest(page, BASSI, true);
  log('A0 stati dopo il primo giro', await stati());
  await chiave(page, 'A0');
  await page.goto(`${BASE}/#/seduta/circuito-3`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const bozza = (await readFromEmulator('sessions')).map((d) => ({ d, s: doc(d) })).find(({ s }) => s.sessionId === 'circuito-3' && s.status === 'in-progress');
  if (bozza === undefined) throw new Error('bozza della Seduta 3 non trovata');
  const voci = bozza.s.exercises;
  const iPush = voci.findIndex((v) => v.exercise === 'push-up');
  log('A1 voce push-up nella bozza', { indice: iPush, level: voci[iPush]?.level, blockCode: voci[iPush]?.blockCode });
  voci[iPush] = { ...voci[iPush], sets: serie([12, 12]) };
  await updateInEmulator(bozza.d.name, { exercises: aFs(voci) });
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/#/seduta/circuito-3`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Esci dalla seduta' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Chiudi la seduta', exact: true }).click();
  await page.waitForTimeout(1500);
  const salva = page.getByRole('button', { name: 'Salva e chiudi' });
  log('A2 «Salva e chiudi»', (await salva.count()) === 0 ? 'assente' : (await salva.first().isDisabled()) ? 'disattivo' : 'attivo');
  if ((await salva.count()) > 0 && !(await salva.first().isDisabled())) await salva.first().click();
  else log('A2 riepilogo', (await page.locator('main').innerText().catch(() => '')).slice(0, 600));
  await page.waitForTimeout(2000);
  log('A3 hash dopo la chiusura', new URL(page.url()).hash);
  const chiusa = (await readFromEmulator('sessions')).map(doc).find((s) => s.sessionId === 'circuito-3');
  log('A3 seduta 3 nel database', { status: chiusa?.status, pushSerie: chiusa?.exercises.find((v) => v.exercise === 'push-up')?.sets.length });
  log('A4 stati dopo la chiusura (level, ecc, pausa, kg)', await stati());
  await chiave(page, 'A4');

  /* B */
  const { parent } = await radice();
  const ieri = giorni(-1);
  await writeToEmulator(parent, 'sessions', `circuito-1-${ieri}-1`, aFs({
    id: `circuito-1-${ieri}-1`, date: ieri, week: 1, sessionId: 'circuito-1', status: 'in-progress', note: null,
    exercises: [{ blockCode: 'A2', exercise: 'bulgarian-split-squat', variantLabel: 'Split squat a terra', level: 1, tempoRespected: null, note: null,
      sets: [...serie([9], 'left'), ...serie([9], 'right')] }],
  }).mapValue.fields);
  await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const archivia = page.getByRole('button', { name: 'Archivia' });
  log('B1 «Archivia» in Home', await archivia.count());
  if ((await archivia.count()) > 0) await archivia.first().click();
  await page.waitForTimeout(2000);
  const arch = (await readFromEmulator('sessions')).map(doc).find((s) => s.sessionId === 'circuito-1');
  log('B2 seduta archiviata', { status: arch?.status, serie: arch?.exercises[0]?.sets.length });
  log('B3 stati dopo «Archivia»', await stati());
  await chiave(page, 'B3');
  log('B3 caricamenti di pagina finora', caricamenti);

  /* C */
  log('C0 panoramica Seduta 3 prima del ritest', await panoramica(page, 'circuito-3', PUSH));
  log('C0 panoramica Seduta 1 prima del ritest', await panoramica(page, 'circuito-1', BULG));
  log('C1 data di inizio indietro', await indietroDi42(page));
  await giroDeiTest(page, ALTI, false);
  log('C2 stati dopo il ritest', await stati());
  await chiave(page, 'C2');
  log('C2 caricamenti di pagina finora', caricamenti);
  log('C3 panoramica Seduta 3 dopo il ritest', await panoramica(page, 'circuito-3', PUSH));
  log('C3 panoramica Seduta 1 dopo il ritest', await panoramica(page, 'circuito-1', BULG));

  /* D */
  await page.goto(`${BASE}/#/impostazioni`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Cancella tutti i dati' }).click();
  await page.getByLabel('Scrivi CANCELLA per confermare').fill('CANCELLA');
  await page.getByRole('button', { name: 'Sì, cancella tutto' }).click();
  await page.waitForTimeout(3000);
  log('D0 chiavi R9c in localStorage dopo l’azzeramento', await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('shadow.r9c'))));
  await giroDeiTest(page, BASSI, true);
  const r = await radice();
  const tre = giorni(-3);
  await writeToEmulator(r.parent, 'sessions', `circuito-3-${tre}-1`, aFs({
    id: `circuito-3-${tre}-1`, date: tre, week: 1, sessionId: 'circuito-3', status: 'completed', note: null, completedAt: `${tre}T18:00:00.000Z`,
    exercises: [{ blockCode: 'A2', exercise: 'push-up', variantLabel: 'Push-up su rialzo', level: 1, tempoRespected: null, note: null, sets: serie([12, 12]) }],
  }).mapValue.fields);
  log('D1 stati con la storia scritta, prima della migrazione', await stati());
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('shadow.r9c')) localStorage.removeItem(k); });
  await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(5000);
  log('D2 stati dopo la riapertura (migrazione)', await stati());
  log('D2 chiave R9c', await page.evaluate((uid) => localStorage.getItem(`shadow.r9c.stati-fissati.${uid}`), r.uid));
  await indietroDi42(page);
  await giroDeiTest(page, ALTI, false);
  log('D3 stati dopo il ritest', await stati());
  log('D3 panoramica Seduta 3 dopo il ritest', await panoramica(page, 'circuito-3', PUSH));
  log('errori della pagina', errori);
} catch (e) {
  log('ERRORE', String(e?.stack ?? e).slice(0, 800));
} finally {
  await browser?.close();
  stopGroup(server);
  stopGroup(emulators);
}
console.log(JSON.stringify(out));
