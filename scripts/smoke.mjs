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
import { buildForTests, signInForTests, startEmulators, stopGroup } from './testenv.mjs';

const PORT = 4181;
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

buildForTests();
const emulators = await startEmulators();

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: true,
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
    (await page.getByRole('button', { name: 'Continua con Google' }).count()) === 1,
    'Senza account l’app deve mostrare la schermata di accesso.',
  );

  await signInForTests(page);

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
    /*
     * Si entra in una seduta scelta, non in quella di oggi.
     *
     * Solo il lunedì e il giovedì hanno superserie, e il controllo qui sotto
     * verifica proprio che A1 e A2 si alternino. Partendo da «oggi», lo stesso
     * test cambiava significato a seconda del giorno in cui girava: verde il
     * giovedì, rosso il venerdì, senza che niente fosse cambiato nel codice.
     */
    await page.goto(`${BASE}/#/seduta/upper-a`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);

    /*
     * La prima serie si deve poter registrare senza confermare niente.
     *
     * Prima il player chiedeva di confermare variante e livello prima della
     * prima serie di ogni esercizio. Il livello esce dai nove test della
     * settimana 0: chiederne conferma era un passaggio in più che non
     * aggiungeva informazione, e in palestra un passaggio in più è un
     * ostacolo.
     */
    check(
      (await page.getByRole('button', { name: 'Confermo, è questo' }).count()) === 0,
      'La prima serie non deve chiedere di confermare l’esercizio.',
    );
    const primiCampi = page.locator('input[type=number]');
    for (let k = 0; k < (await primiCampi.count()); k += 1) await primiCampi.nth(k).fill('8');
    await page.waitForTimeout(200);
    const primoCommit = page.getByRole('button', { name: 'Serie fatta' });
    check(
      (await primoCommit.count()) > 0 && !(await primoCommit.isDisabled()),
      'Scritte le ripetizioni, "Serie fatta" deve essere attivo senza altri passaggi.',
    );

    const order = [];
    const riposi = [];
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

      /*
       * Il recupero deve ripartire da capo a ogni serie.
       *
       * React riusa lo stesso componente quando cambiano solo le proprietà,
       * quindi senza una chiave diversa il cronometro prosegue da quello
       * precedente: 0:15, poi 0:11, poi 0:07, finché nasce a zero e sembra non
       * partire. Nessun unit test lo vede, succede solo montando davvero.
       *
       * Il confronto è con `data-total`, cioè la durata che l'app stessa
       * prescrive, non con un numero scritto qui.
       */
      const barra = page.getByTestId('rest-bar');
      if ((await barra.count()) > 0) {
        const previsti = Number(await barra.getAttribute('data-total'));
        const letto = /(\d+):(\d{2})/.exec(await barra.innerText());
        if (letto !== null && Number.isFinite(previsti)) {
          riposi.push({
            serie: order.length,
            code,
            mostrati: Number(letto[1]) * 60 + Number(letto[2]),
            previsti,
          });
        }
      }

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
      riposi.length > 2,
      `Il recupero deve comparire dopo le serie: letto ${String(riposi.length)} volte su ${String(order.length)}.`,
    );
    // Tre secondi di tolleranza per il tempo tra il clic e la lettura.
    const corti = riposi.filter((riposo) => riposo.mostrati < riposo.previsti - 3);
    check(
      corti.length === 0,
      `Ogni recupero deve ripartire da capo. Partiti corti: ${corti
        .map(
          (r) => `serie ${String(r.serie)} ${r.code}: ${String(r.mostrati)}s invece di ${String(r.previsti)}s`,
        )
        .join(', ')}.`,
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

      /*
       * Chiusa la seduta, la Home deve dirlo.
       *
       * Prima il riepilogo veniva aperto e mai salvato: la seduta restava
       * «in-progress» e nessun controllo si accorgeva che la Home continuava a
       * proporre «Inizia» a lavoro finito.
       */
      const salva = page.getByRole('button', { name: 'Salva e chiudi' });
      if ((await salva.count()) > 0) {
        await salva.click();
        await page.waitForTimeout(1200);

        await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
        await page.waitForTimeout(1200);

        /* innerText applica il CSS: quel titolo è in maiuscolo, il confronto no. */
        const home = (await page.locator('main').innerText()).toLowerCase();
        check(
          home.includes('è finita'),
          `A seduta chiusa la Home deve dire che è finita, invece mostra: ${home.slice(0, 220)}`,
        );
        check(
          home.includes('prossimo allenamento'),
          'A seduta chiusa la Home deve dire quando è il prossimo allenamento.',
        );
        check(
          (await page.getByRole('button', { name: 'Inizia', exact: true }).count()) === 0,
          'A seduta chiusa la Home non deve più proporre «Inizia».',
        );
      }
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
   * Quanti giorni siano scegliibili dipende dal giorno in cui gira la prova:
   * di lunedì ce n'è uno solo. Il test si adatta invece di pretendere una
   * settimana già avanzata, altrimenti sarebbe verde il venerdì e rosso il
   * lunedì senza che nel codice sia cambiato niente.
   */
  const days = page.getByTestId('week-strip').locator('button:not([disabled])');
  const dayCount = await days.count();
  check(dayCount >= 1, 'La striscia della settimana deve permettere di scegliere almeno oggi.');

  const weightField = page.locator('input[type=number]').first();

  async function scriviPeso(indiceGiorno, valore) {
    await days.nth(indiceGiorno).click();
    await page.waitForTimeout(200);
    await weightField.fill('');
    /*
     * Cifra per cifra, non in blocco: con il minimo applicato a ogni tasto il
     * campo correggerebbe "8" al minimo e il numero resterebbe impossibile da
     * scrivere. È un difetto che `fill` non fa emergere.
     */
    await weightField.pressSequentially(valore, { delay: 60 });
    await weightField.blur();
    await page.waitForTimeout(500);
  }

  let mediaAttesa = '80';
  if (dayCount >= 2) {
    // Due pesi diversi: la media (81) deve differire dal peso del giorno (80).
    await scriviPeso(dayCount - 2, '82');
    mediaAttesa = '81';
  }
  await scriviPeso(dayCount - 1, '80');

  check(
    (await weightField.inputValue()) === '80',
    `Digitando "80" il campo deve contenere 80, non ${await weightField.inputValue()}.`,
  );

  const hero = (await page.locator('main p').nth(1).innerText()).trim();
  check(
    hero.startsWith(mediaAttesa),
    `Il numero grande deve essere la media a sette giorni (${mediaAttesa}), non il peso del giorno. Letto "${hero}".`,
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

  /*
   * Due fonti possibili: l'illustrazione RepDB, che è un'immagine, o la figura
   * schematica, che è un SVG. Si controlla che ci sia una delle due e che
   * l'immagine sia caricata davvero, non solo presente nel markup.
   */
  const illustrata = await page.evaluate(() => {
    const immagini = [...document.querySelectorAll('figure img')];
    if (immagini.length > 0) return immagini.every((img) => img.naturalWidth > 0);
    return document.querySelectorAll('figure svg').length === 1;
  });
  check(
    illustrata,
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
  stopGroup(server);
  stopGroup(emulators);
}

if (failures.length > 0) {
  console.error(`Prova di fumo fallita, ${String(failures.length)} controlli:\n`);
  console.error(failures.map((message) => `  - ${message}`).join('\n'));
  process.exit(1);
}

console.log('Prova di fumo superata: onboarding completo e range corretti.');
