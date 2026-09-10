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
import { chromium } from 'playwright';
import { launchOptions } from './chromium.mjs';
import { completeOnboarding } from './onboarding.mjs';

const PORT = 4181;
const BASE = `http://localhost:${String(PORT)}`;

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

  browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  check(
    (await page.getByRole('button', { name: 'Vai ai test' }).count()) === 1,
    'Senza test la Home deve restare bloccata e portare ai test.',
  );

  await completeOnboarding(page, BASE, {
    onRange: (shown, testCase, index) => {
      check(
        shown === testCase.range,
        `Test ${String(index + 1)}: atteso range ${testCase.range}, mostrato "${shown}".`,
      );
    },
  });

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

  /* ------------------------- Log e Progressi ---------------------------- */

  await page.goto(`${BASE}/#/log`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const logRowCount = await page.locator('tbody tr').count();
  check(logRowCount > 0, 'Dopo una seduta il log deve contenere almeno una riga.');
  check(
    (await page.locator('thead th').count()) === 13,
    'La tabella del log deve avere le tredici colonne del foglio originale.',
  );

  await page.goto(`${BASE}/#/progressi`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  check(
    (await page.locator('svg[role="img"]').count()) > 0,
    'La schermata Progressi deve mostrare il grafico dell’esercizio scelto.',
  );
  check(
    (await page.getByText('Vedi i numeri in tabella').count()) > 0,
    'Ogni grafico deve avere la sua tabella equivalente.',
  );
  const adherence = await page.locator('main p').first().innerText();
  check(/%$/.test(adherence.trim()), `L’aderenza deve essere una percentuale, letto "${adherence}".`);

  /* ------------------------------ Misure -------------------------------- */

  await page.goto(`${BASE}/#/misure`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  check(
    (await page.getByText('Media a 7 giorni').count()) > 0,
    'La schermata Misure deve mettere in grande la media, non il peso del giorno.',
  );

  /*
   * Due pesi diversi su due giorni: la media (81) deve differire dal peso del
   * giorno (80), altrimenti il controllo non distingue i due numeri.
   */
  const days = page.getByTestId('week-strip').locator('button:not([disabled])');
  const dayCount = await days.count();
  check(dayCount >= 2, 'La striscia della settimana deve permettere di scegliere il giorno.');

  const weightField = page.locator('input[type=number]').first();
  await days.nth(dayCount - 2).click();
  await page.waitForTimeout(200);
  await weightField.fill('');
  await weightField.pressSequentially('82', { delay: 60 });
  await weightField.blur();
  await page.waitForTimeout(400);

  await days.nth(dayCount - 1).click();
  await page.waitForTimeout(200);
  /*
   * Cifra per cifra, non in blocco: con il minimo applicato a ogni tasto il
   * campo correggerebbe "8" al minimo e il numero resterebbe impossibile da
   * scrivere. È un difetto che `fill` non fa emergere.
   */
  await weightField.fill('');
  await weightField.pressSequentially('80', { delay: 60 });
  await weightField.blur();
  await page.waitForTimeout(600);

  check(
    (await weightField.inputValue()) === '80',
    `Digitando "80" il campo deve contenere 80, non ${await weightField.inputValue()}.`,
  );

  const hero = (await page.locator('main p').nth(1).innerText()).trim();
  check(
    hero.startsWith('81'),
    `Il numero grande deve essere la media dei due giorni, 81, non il peso di oggi. Letto "${hero}".`,
  );
  check(
    (await page.locator('svg[role="img"]').count()) > 0,
    'Le misure devono mostrare l’andamento del peso.',
  );

  /* --------------------------- Libreria --------------------------------- */

  await page.goto(`${BASE}/#/esercizi`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  check(
    (await page.locator('main button').count()) > 20,
    'La libreria deve elencare tutti gli esercizi dell’anagrafica.',
  );

  await page.goto(`${BASE}/#/esercizi/trazioni-prona-presa-media`, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  check(
    (await page.locator('figure svg').count()) === 1,
    'La scheda dell’esercizio deve mostrare l’illustrazione.',
  );
  check(
    (await page.locator('main li').count()) >= 11,
    'La scheda deve mostrare i sei gradini della scala e i cue di esecuzione.',
  );

  const searchHref = await page.getByRole('link', { name: 'Cerca un video' }).getAttribute('href');
  check(
    searchHref?.startsWith('https://www.youtube.com/results?search_query=') === true,
    `Il pulsante video deve aprire una ricerca, non un video. Letto "${String(searchHref)}".`,
  );

  const videoField = page.locator('input[type=url]');
  await videoField.fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Salva il link' }).click();
  await page.waitForTimeout(500);
  check(
    (await page.getByRole('link', { name: 'Cerca un video' }).count()) === 1,
    'Un link con schema pericoloso non deve sostituire la ricerca.',
  );

  await videoField.fill('https://example.com/il-mio-video');
  await page.getByRole('button', { name: 'Salva il link' }).click();
  await page.waitForTimeout(600);
  const custom = await page.getByRole('link', { name: 'Apri il mio video' }).getAttribute('href');
  check(
    custom === 'https://example.com/il-mio-video',
    `Salvando un link valido il pulsante deve aprirlo. Letto "${String(custom)}".`,
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
