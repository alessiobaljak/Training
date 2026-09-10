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

  await page.getByRole('button', { name: 'Parti questa settimana' }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Conferma e vai alla Home' }).click();
  await page.waitForTimeout(900);

  const startButton = page.getByRole('button', { name: 'Inizia', exact: true });
  check(
    (await startButton.count()) > 0,
    'Con il giro di test completo la Home deve proporre la seduta del giorno.',
  );

  /* ---------------------------- Player ---------------------------------- */

  if ((await startButton.count()) > 0) {
    await startButton.click();
    await page.waitForTimeout(1000);

    const order = [];
    let planTotal = 0;

    for (let guard = 0; guard < 60; guard += 1) {
      const confirm = page.getByRole('button', { name: 'Confermo, è questo' });
      if ((await confirm.count()) > 0) {
        await confirm.click();
        await page.waitForTimeout(220);
      }

      const commit = page.getByRole('button', { name: 'Serie fatta' });
      if ((await commit.count()) === 0) break;

      const heading = await page.locator('h1').first().innerText();
      const code = heading.split('·').pop()?.trim() ?? '';

      const inputs = page.locator('input[type=number]');
      const count = await inputs.count();
      for (let k = 0; k < count; k += 1) await inputs.nth(k).fill('10');
      await page.waitForTimeout(120);

      if (await commit.isDisabled()) {
        failures.push(`Serie non registrabile sul blocco ${code}: il pulsante resta disabilitato.`);
        break;
      }

      await commit.click();
      await page.waitForTimeout(240);
      order.push(code);

      const progress = await page.locator('header p').first().innerText();
      const match = /^(\d+) di (\d+)/.exec(progress);
      if (match?.[2] !== undefined) planTotal = Number(match[2]);
      if (match?.[1] === match?.[2]) break;

      /* A metà seduta ricarica la pagina: i dati devono essere già salvati. */
      if (order.length === 5) {
        await page.reload({ waitUntil: 'load' });
        await page.waitForTimeout(1200);
        const resumed = await page.locator('header p').first().innerText();
        check(
          resumed.startsWith('5 di '),
          `Dopo il ricaricamento la seduta deve riprendere da 5 serie, non da "${resumed}".`,
        );
      }
    }

    check(
      order.length === planTotal && planTotal > 0,
      `Registrate ${String(order.length)} serie su ${String(planTotal)} previste.`,
    );
    check(
      order.slice(0, 4).join(' ') === 'A1 A2 A1 A2',
      `La superserie deve alternare A1 e A2, ordine visto: ${order.slice(0, 4).join(' ')}.`,
    );

    const close = page.getByRole('button', { name: 'Chiudi la seduta' });
    if ((await close.count()) > 0) {
      await close.click();
      await page.waitForTimeout(900);
      check(
        (await page.getByText('Hai tenuto il tempo prescritto').count()) > 0,
        'Chiudendo il massimo del range il riepilogo deve chiedere se il tempo è stato rispettato.',
      );
      check(
        (await page.getByText('Leva successiva').count()) > 0,
        'Chiudendo il massimo del range il riepilogo deve proporre la leva successiva.',
      );
    }
  }

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
