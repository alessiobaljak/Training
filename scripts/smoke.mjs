#!/usr/bin/env node
/**
 * Prova di fumo su un browser vero.
 *
 * Il motore ha i suoi unit test, ma nessuno di quelli si accorge se la Home
 * resta nera perché una query scrive dentro una transazione di sola lettura.
 * Questo script percorre l'onboarding dei nove test e verifica che i range
 * mostrati a schermo siano quelli della scheda.
 *
 *   npm run smoke
 *
 * Richiede Chromium. Non gira dentro `npm run verify`, che deve restare
 * eseguibile ovunque senza browser.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 4181;
const BASE = `http://localhost:${String(PORT)}`;

/** Valori di esempio del foglio Test_Livelli e range che la scheda scrive. */
const CASES = [
  { value: 10, range: '6-8' },
  { value: 12, range: '7-9' },
  { value: 30, range: '17-23' },
  { value: 18, range: '10-14' },
  { value: 8, range: '4-6' },
  { value: 15, range: '8-11' },
  // Nordic curl: la scheda scrive 3-5, la formula dà 2-3. Vince la formula.
  { value: 4, range: '2-3' },
  { value: 45, range: '25-34"' },
  { value: 60, range: '33-45"' },
];

function findChromium() {
  const candidates = [
    process.env['CHROMIUM_PATH'],
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium/chrome-linux/chrome',
  ].filter((path) => typeof path === 'string' && path !== '');
  return candidates.find((path) => existsSync(path));
}

async function waitForServer(timeoutMs = 20_000) {
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

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
});

let browser;
try {
  await waitForServer();

  const executablePath = findChromium();
  browser = await chromium.launch(executablePath === undefined ? {} : { executablePath });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  check(
    (await page.getByRole('button', { name: 'Vai ai test' }).count()) === 1,
    'Senza test la Home deve restare bloccata e portare ai test.',
  );

  await page.goto(`${BASE}/#/test`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Inizia i test' }).click();
  await page.waitForTimeout(400);

  for (const [index, testCase] of CASES.entries()) {
    const inputs = page.locator('input[type=number]');
    const count = await inputs.count();
    for (let k = 0; k < count; k += 1) await inputs.nth(k).fill(String(testCase.value));
    await page.waitForTimeout(200);

    const shown = (await page.getByTestId('range').innerText()).trim();
    check(
      shown === testCase.range,
      `Test ${String(index + 1)}: atteso range ${testCase.range}, mostrato "${shown}".`,
    );

    await page.getByRole('button', { name: 'Salva e continua' }).click();
    await page.waitForTimeout(400);
    const skip = page.getByRole('button', { name: 'Salta il recupero' });
    if ((await skip.count()) > 0) {
      await skip.click();
      await page.waitForTimeout(300);
    }
  }

  await page.getByRole('button', { name: 'Conferma e vai alla Home' }).click();
  await page.waitForTimeout(900);

  check(
    (await page.getByRole('button', { name: /Inizia/ }).count()) > 0,
    'Con il giro di test completo la Home deve proporre la seduta del giorno.',
  );
  check(errors.length === 0, `Errori JavaScript in pagina: ${errors.join(' | ')}`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

if (failures.length > 0) {
  console.error(`Prova di fumo fallita, ${String(failures.length)} controlli:\n`);
  console.error(failures.map((message) => `  - ${message}`).join('\n'));
  process.exit(1);
}

console.log('Prova di fumo superata: onboarding completo e range corretti.');
