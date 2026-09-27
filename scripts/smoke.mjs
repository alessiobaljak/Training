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
import {
  buildForTests,
  readFromEmulator,
  signInForTests,
  startEmulators,
  stopGroup,
  updateInEmulator,
  writeToEmulator,
} from './testenv.mjs';

const PORT = 4181;

/*
 * La seduta che il calendario prescrive oggi.
 *
 * La prova entra sempre nelle stesse sedute, scelte apposta, e quelle
 * coincidono con quella del giorno solo una volta a settimana. Senza questo
 * conto i controlli sulla Home sarebbero verdi il lunedì e rossi il mercoledì
 * senza che il codice sia cambiato.
 */
const SEDUTE_PER_GIORNO = ['upper-a', 'lower-a', 'zona-2', 'upper-b', 'lower-b', 'shadow'];
const isoOggi = ((new Date().getDay() + 6) % 7) + 1;
/*
 * Non è una costante: la domenica il programma non prescrive niente, e la
 * prova si porta qui una seduta con lo strumento che esiste apposta. Da quel
 * momento la seduta di oggi è quella, e tutti i controlli che dipendono da
 * «cosa prescrive oggi» devono leggere questa.
 */
let SESSIONE_DI_OGGI = SEDUTE_PER_GIORNO[isoOggi - 1] ?? null;

/** Dal nome mostrato all'identificativo, per rileggere la seduta spostata. */
const ID_PER_NOME = {
  'Upper A': 'upper-a',
  'Lower A': 'lower-a',
  'Zona 2': 'zona-2',
  'Upper B': 'upper-b',
  'Lower B': 'lower-b',
  Shadow: 'shadow',
};
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

  /* --------------------- Spostare una seduta di giorno ------------------ */

  /*
   * «Oggi sabato non posso, la faccio domani.»
   *
   * Il calendario dava una seduta a ogni giorno e basta. L'unica strada era
   * aprire la seduta del sabato di domenica e ritrovarsela segnata come «fuori
   * posto», cioè come un errore. Lo spostamento è uno scambio: quello che c'è
   * oggi va nel giorno scelto e quello che c'è lì torna oggi.
   *
   * Si prova qui, prima che la seduta di oggi venga chiusa: una seduta già
   * fatta non ha senso spostarla, e infatti il pulsante non compare.
   */
  const sposta = page.getByRole('button', { name: /sposta la seduta|Porta qui una seduta/ });
  check((await sposta.count()) === 1, 'La Home deve permettere di spostare la seduta di giorno.');

  if ((await sposta.count()) === 1) {
    const oggiAllena = (await sposta.innerText()).includes('sposta la seduta');
    await sposta.click();
    await page.waitForTimeout(600);

    const giorni = page.locator('main ul li > button').filter({ hasText: /\d\d-\d\d/ });
    check(
      (await giorni.count()) === 7,
      `Il pannello deve offrire i sette giorni seguenti: trovati ${String(await giorni.count())}.`,
    );

    /*
     * Chi si allena oggi sposta sul giorno libero, che è quello di riposo;
     * chi oggi riposa tira qui una seduta da un giorno che ce l'ha. In tutti e
     * due i casi è lo stesso scambio.
     */
    const bersaglio = oggiAllena
      ? giorni.filter({ hasText: 'libero' }).first()
      : giorni.filter({ hasNotText: 'libero' }).first();
    check((await bersaglio.count()) > 0, 'Il pannello deve avere un giorno su cui scambiare.');

    if ((await bersaglio.count()) > 0) {
      if (oggiAllena) {
        check(
          (await bersaglio.innerText()).includes('giorni di allenamento di fila'),
          `Spostare nel giorno di riposo deve dire che il riposo sparisce. Legge ${JSON.stringify(await bersaglio.innerText())}.`,
        );
      }

      await bersaglio.click();
      await page.waitForTimeout(1800);

      const righe = await readFromEmulator('sessionMoves');
      check(
        righe.length === 2,
        `Uno scambio scrive due righe, una per giorno toccato: trovate ${String(righe.length)}.`,
      );

      const dopoLoSpostamento = await page.locator('main').innerText();
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(2000);
      check(
        (await page.locator('main').innerText()) === dopoLoSpostamento,
        'Riaperta l’app, lo spostamento deve essere ancora lì: sta nel database, non a schermo.',
      );

      /*
       * E si annulla rifacendolo: è uno scambio, e uno scambio fatto due volte
       * è l'identità. Senza, «annullare» sarebbe un'operazione a parte, che è
       * il modo in cui nascono i calendari che non tornano più indietro.
       */
      const rifai = page.getByRole('button', { name: /sposta la seduta|Porta qui una seduta/ });
      if ((await rifai.count()) === 1) {
        await rifai.click();
        await page.waitForTimeout(600);
        const indietro = page
          .locator('main ul li > button')
          .filter({ hasText: /\d\d-\d\d/ })
          .first();
        await indietro.click();
        await page.waitForTimeout(1800);
        check(
          (await readFromEmulator('sessionMoves')).length === 0,
          'Annullato lo spostamento, non deve restare nessuna riga nel database.',
        );
      }
    }
  }

  /*
   * La domenica il programma non prescrive niente, e fino a oggi questa prova
   * non ci aveva mai girato: si fermava al primo controllo, perché dava per
   * scontato che ogni giorno avesse la sua seduta. Adesso quel giorno si
   * riempie con lo strumento che esiste apposta — la prova usa la funzione che
   * sta verificando, e da qui in poi vale qualunque giorno della settimana.
   */
  if ((await page.getByRole('button', { name: 'Inizia', exact: true }).count()) === 0) {
    const porta = page.getByRole('button', { name: 'Porta qui una seduta' });
    check((await porta.count()) === 1, 'Un giorno di riposo deve poter ospitare una seduta.');
    if ((await porta.count()) === 1) {
      await porta.click();
      await page.waitForTimeout(600);
      const riga = page
        .locator('main ul li > button')
        .filter({ hasText: /\d\d-\d\d/ })
        .filter({ hasNotText: 'libero' })
        .first();
      const nome = (await riga.innerText()).split('\n').at(-1)?.trim() ?? '';
      await riga.click();
      await page.waitForTimeout(1800);

      SESSIONE_DI_OGGI = ID_PER_NOME[nome] ?? SESSIONE_DI_OGGI;
      check(
        SESSIONE_DI_OGGI !== null,
        `Portata qui una seduta, la prova deve sapere quale: letto "${nome}".`,
      );
    }
  }

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

        if (SESSIONE_DI_OGGI === 'upper-a') {
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
        } else {
          /*
           * Upper A chiusa in un giorno che non è il suo non è la seduta di
           * oggi. Prima bastava una seduta qualunque registrata oggi perché la
           * Home dicesse «è finita» e facesse sparire quella del giorno: chi
           * chiudeva una Lower A di mercoledì si vedeva «Lower A è finita,
           * domani Upper B» e la corsa del mercoledì da nessuna parte.
           */
          check(
            !home.includes('è finita'),
            'Una seduta chiusa fuori dal suo giorno non è la seduta di oggi: la Home non deve darla per fatta.',
          );
          check(
            home.includes('fuori posto'),
            'Una seduta registrata fuori dal suo giorno deve comparire tra quelle fuori posto.',
          );
          check(
            (await page.getByRole('button', { name: 'Inizia', exact: true }).count()) > 0,
            'La seduta di oggi deve restare proponibile anche se se ne è chiusa un’altra.',
          );
        }
      }
    }
  }

  /* --------------------- Zavorra e serie non perse ----------------------- */

  /*
   * Tre guasti trovati insieme sul Bulgarian split squat, tutti invisibili ai
   * test di allora: il campo della zavorra non esisteva nelle prime due
   * settimane, spostarsi di serie buttava via le ripetizioni appena scritte, e
   * i due pulsanti in fondo non dicevano dove portavano, quindi premerli
   * sembrava non fare niente.
   */
  await page.goto(`${BASE}/#/seduta/lower-a`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const schermata = await page.locator('main').innerText();
  check(
    schermata.includes('Zavorra'),
    'In settimana 1 il peso usato si deve poter scrivere lo stesso: il campo Zavorra deve esserci.',
  );
  check(
    schermata.includes('non si aumenta'),
    'Accanto al campo deve restare scritto che fino alla settimana 3 la zavorra non è una leva.',
  );

  const campi = () => page.locator('input[type=number]');
  const valoriCampi = () =>
    page.locator('input[type=number]').evaluateAll((els) => els.map((el) => el.value));

  for (let k = 0; k < (await campi().count()); k += 1) await campi().nth(k).fill('15');
  await page.waitForTimeout(250);

  check(
    (await page.getByText('non è ancora registrata').count()) > 0,
    'Scritte le ripetizioni e non registrate, la seduta deve avvisare prima che ci si sposti.',
  );

  const avanti = page.getByRole('button', { name: /serie \d+ ›$/ });
  check(
    (await avanti.count()) > 0,
    'Il pulsante di avanzamento deve dire in quale serie porta, altrimenti premerlo sembra non fare niente.',
  );

  if ((await avanti.count()) > 0) {
    const etichettaAvanti = (await avanti.innerText()).trim();
    await avanti.click();
    await page.waitForTimeout(500);
    const indietro = page.getByRole('button', { name: /^‹ / });
    check(
      (await indietro.count()) > 0 && (await indietro.innerText()).trim() !== etichettaAvanti,
      'Cambiata serie, i due pulsanti devono nominare serie diverse da prima.',
    );
    if ((await indietro.count()) > 0) {
      await indietro.click();
      await page.waitForTimeout(500);
      check(
        (await valoriCampi()).includes('15'),
        `Tornando sulla serie, le ripetizioni scritte devono essere ancora lì: trovato ${JSON.stringify(await valoriCampi())}.`,
      );
    }
  }

  const commitLower = page.getByRole('button', { name: 'Serie fatta' });
  if ((await commitLower.count()) > 0 && !(await commitLower.isDisabled())) {
    await commitLower.click();
    await page.waitForTimeout(600);
    check(
      (await page.getByText('15 kg').count()) > 0,
      'Registrata la serie, il peso usato deve comparire nello storico accanto alle ripetizioni.',
    );
  }

  /* ------------------ Sissy squat oppure wall sit ------------------------ */

  /*
   * La scheda scrive «Sissy squat o wall sit isometrico 45"» su una riga
   * sola, ma sono due esercizi con due misure. Finché erano un esercizio solo
   * l'app ne imponeva una, le ripetizioni, e i secondi del wall sit non
   * avevano dove finire.
   */
  /* Il C2 arriva a metà piano: il limite copre l'intera seduta, non un tratto. */
  for (let i = 0; i < 24; i += 1) {
    if ((await page.locator('h1').first().innerText()).includes('C2')) break;
    const avantiC2 = page.getByRole('button', { name: /serie \d+ ›$/ });
    if ((await avantiC2.count()) === 0) break;
    await avantiC2.click();
    await page.waitForTimeout(300);
  }

  const suC2 = (await page.locator('h1').first().innerText()).includes('C2');
  check(suC2, 'La navigazione tra le serie deve arrivare al blocco C2 del Lower A.');

  if (suC2) {
    const scelta = await page.locator('main').innerText();
    check(
      scelta.includes('Sissy squat') && scelta.includes('Wall sit'),
      'Il C2 deve far scegliere tra sissy squat e wall sit, che sono due esercizi diversi.',
    );
    check(
      scelta.includes('Target 12-15'),
      `Sul sissy squat il target deve essere in ripetizioni: letto ${JSON.stringify((/Target [^\n]+/.exec(scelta) ?? ['(nessuno)'])[0])}.`,
    );

    await page.getByRole('button', { name: /Wall sit/ }).click();
    await page.waitForTimeout(800);

    const dopoScelta = await page.locator('main').innerText();
    check(
      dopoScelta.includes('Cronometro'),
      'Scelto il wall sit, la serie si deve registrare col cronometro: è un’isometria, non ripetizioni.',
    );
    check(
      dopoScelta.includes('Target 45"'),
      `Sul wall sit il target deve essere in secondi: letto ${JSON.stringify((/Target [^\n]+/.exec(dopoScelta) ?? ['(nessuno)'])[0])}.`,
    );

    const secondi = page.locator('input[type=number]');
    for (let k = 0; k < (await secondi.count()); k += 1) await secondi.nth(k).fill('45');
    await page.waitForTimeout(200);
    const registra = page.getByRole('button', { name: 'Serie fatta' });
    if ((await registra.count()) > 0 && !(await registra.isDisabled())) {
      await registra.click();
      await page.waitForTimeout(700);
    }

    /* ------------------- Il riepilogo di fine seduta -------------------- */

    /*
     * Due guasti visti solo qui dentro, e solo da chi aveva scelto il wall
     * sit: il riepilogo leggeva il blocco dichiarato, quindi analizzava
     * «Sissy squat» con i secondi contati come ripetizioni; e la domanda sul
     * tempo arrivava già con «Sì» acceso, quindi premerlo non faceva niente.
     */
    const chiudiLower = page.getByRole('button', { name: /Chiudi la seduta|Chiudi in anticipo/ });
    if ((await chiudiLower.count()) > 0) {
      await chiudiLower.first().click();
      await page.waitForTimeout(1200);

      const riepilogo = await page.locator('main').innerText();
      const indice = riepilogo.indexOf('C2');
      const schedaC2 = indice === -1 ? '' : riepilogo.slice(indice, indice + 700);

      check(
        indice !== -1,
        'Scegliendo il wall sit il blocco C2 deve restare nel riepilogo, non sparire.',
      );
      check(
        schedaC2.includes('Wall sit'),
        `Il riepilogo deve analizzare l’esercizio fatto davvero: letto ${JSON.stringify(schedaC2.slice(0, 120))}.`,
      );
      check(
        !schedaC2.includes('Sissy squat'),
        'Il riepilogo non deve attribuire al sissy squat una seduta fatta di wall sit.',
      );
      check(
        !schedaC2.includes('ripetizioni stai allenando la resistenza'),
        'L’avviso sulla resistenza è in ripetizioni: non deve comparire su un’isometria a secondi.',
      );

      const siTempo = page.getByRole('button', { name: /^Sì, / }).first();
      if ((await siTempo.count()) > 0) {
        check(
          (await siTempo.getAttribute('aria-pressed')) === 'false',
          'La domanda sul tempo deve arrivare senza risposta: nessuno dei due pulsanti acceso.',
        );
        check(
          !riepilogo.includes('Leva successiva'),
          'Senza risposta sul tempo l’app non deve ancora proporre la leva successiva.',
        );

        await siTempo.click();
        await page.waitForTimeout(900);

        check(
          (await siTempo.getAttribute('aria-pressed')) === 'true',
          'Premere «Sì» deve cambiare qualcosa: prima non succedeva niente perché era già la risposta.',
        );
        const dopoRisposta = await page.locator('main').innerText();
        check(
          dopoRisposta.includes('Leva successiva'),
          'Risposto sì sul tempo chiuso il range, la leva successiva deve comparire.',
        );
      }

      const salvaLower = page.getByRole('button', { name: 'Salva e chiudi' });
      if ((await salvaLower.count()) > 0) {
        await salvaLower.click();
        await page.waitForTimeout(1200);
      }
    }
  }

  /* --------------------------- Upper B ---------------------------------- */

  /*
   * Tre guasti dello stesso giovedì.
   *
   * Il B1 prescrive il rematore monobraccio: scendendo al rematore a 45°, che
   * è a due braccia, l'app continuava a chiedere sinistra e destra perché
   * `perSide` stava sul blocco e non sul gradino della scala.
   *
   * Il C1 teneva croci e push-up a presa larga su un esercizio solo, con una
   * politica del carico per entrambi: vinceva «niente carico», e chi faceva
   * le croci con i manubri non aveva dove scriverli.
   */
  await page.goto(`${BASE}/#/seduta/upper-b`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);

  const vaiAlBlocco = async (codice) => {
    for (let i = 0; i < 30; i += 1) {
      if ((await page.locator('h1').first().innerText()).includes(`· ${codice}`)) return true;
      const avanti = page.getByRole('button', { name: /serie \d+ ›$/ });
      if ((await avanti.count()) === 0) return false;
      await avanti.click();
      await page.waitForTimeout(200);
    }
    return false;
  };

  /*
   * Il livello di partenza esce dal test, non dalla scheda.
   *
   * Il test dei push-up si fa a terra, gradino 2 della spinta orizzontale. Il
   * giovedì partiva dagli archer push-up, gradino 5, col range calcolato sui
   * push-up a terra: ventiquattro push-up a terra non dicono niente sugli
   * archer, che hanno una tecnica diversa. Ora la scheda resta l'obiettivo e
   * il gradino è quello misurato.
   */
  if (await vaiAlBlocco('A2')) {
    const a2 = await page.locator('main').innerText();
    check(
      a2.includes('Push-up archer'),
      'Il blocco deve continuare a dire cosa prescrive la scheda.',
    );

    /*
     * Il titolo è il gradino, non il nome della riga.
     *
     * L'intestazione diceva «Push-up archer» in grande e «Liv. 3 · Push-up
     * declinati» in piccolo sotto: gli archer erano la meta, i declinati
     * l'esercizio da fare, e il titolo diceva l'altro.
     */
    const titoloA2 = await page.locator('main p.text-xl').first().innerText();
    check(
      titoloA2.startsWith('Liv.') && !titoloA2.includes('archer'),
      `Il titolo deve dire il gradino che stai facendo. Legge "${titoloA2}".`,
    );
    check(
      a2.includes('Nella scheda:'),
      'La riga della scheda non deve sparire: scende, non se ne va.',
    );

    /*
     * E la figura segue il titolo. Il disegno seguiva l'esercizio: al gradino
     * 3 mostrava ancora gli archer push-up, cioè un altro movimento.
     */
    const figuraA2 = await page.evaluate(() => {
      const nodo = document.querySelector('main figure img, main figure svg');
      if (nodo === null) return '';
      return nodo.tagName === 'IMG'
        ? (nodo.getAttribute('src') ?? '')
        : (nodo.querySelector('title')?.textContent ?? '');
    });
    check(
      figuraA2 !== '' && !/archer/i.test(figuraA2),
      `Al gradino 3 la figura non deve mostrare gli archer. Mostra "${figuraA2}".`,
    );
    check(
      a2.includes('Liv. 2 · Push-up a terra'),
      `Il gradino di partenza è quello del test, non quello della scheda: letto ${JSON.stringify((/Liv\. \d+ · [^\n]+/.exec(a2) ?? ['(nessuno)'])[0])}.`,
    );
    check(
      a2.includes('Nella scheda: Push-up archer (liv. 5)'),
      'Partendo più in basso la seduta deve dire a quale gradino la scheda vuole arrivare.',
    );
    check(
      a2.includes('Target 17-23'),
      `Il range esce dal test dei push-up e ora è coerente col gradino: letto ${JSON.stringify((/Target [^\n]+/.exec(a2) ?? ['?'])[0])}.`,
    );
  }

  if (await vaiAlBlocco('B1')) {
    /*
     * Il B1 prescrive il rematore monobraccio, gradino 5, ma il test misura il
     * rematore a 45°, gradino 2: si parte da lì, a due braccia. Salendo a mano
     * al monobraccio la seduta deve tornare a chiedere due lati — `perSide`
     * segue il gradino, non la riga della scheda.
     */
    check(
      (await page.locator('input[type=number]').count()) === 1,
      'Al gradino del test il rematore è a due braccia: un campo solo.',
    );

    const matita = page.locator('main button').filter({ hasText: '✎' }).first();
    if ((await matita.count()) > 0) {
      await matita.click();
      await page.waitForTimeout(600);
      const mono = page.getByRole('button', { name: /Rematore monobraccio TRX/ }).first();
      if ((await mono.count()) > 0) {
        await mono.click();
        await page.waitForTimeout(1200);
        check(
          (await page.getByText('Sinistra').count()) > 0,
          'Salito al monobraccio, la seduta deve chiedere sinistra e destra.',
        );
        check(
          (await page.locator('input[type=number]').count()) === 2,
          `Un gesto a un braccio ha due campi: trovati ${String(await page.locator('input[type=number]').count())}.`,
        );
      }
    }
  }

  if (await vaiAlBlocco('C1')) {
    const c1 = await page.locator('main').innerText();

    /*
     * Il C1 è solo croci, e non è un'omissione.
     *
     * La scheda scrive «Croci con elastico o push-up presa larga lenta». Il
     * push-up a presa larga qui è la terza spinta orizzontale della seduta,
     * dopo quattro serie al blocco A2 e tre di negative di HSPU al B2, tutte a
     * RIR 0-1: a quel punto aggiunge fatica ai tricipiti, non stimolo al
     * petto. Le croci restano perché sono l'unico movimento della settimana
     * che carica il petto in allungamento senza passare dai tricipiti.
     */
    check(
      c1.includes('Croci con manubri'),
      'Il C1 deve essere le croci con manubri.',
    );
    check(
      !c1.includes('Push-up presa larga'),
      'Il push-up a presa larga non deve più comparire: era la terza spinta della seduta.',
    );
    check(
      c1.includes('Zavorra'),
      'Sulle croci il peso è l’esercizio: ci deve essere dove scriverlo.',
    );
  }

  /*
   * E il blocco D non c'è più: era il terzo giorno di alzate laterali della
   * settimana, su una spalla che il conteggio del volume dava già sopra la
   * fascia del metodo.
   */
  check(
    !(await vaiAlBlocco('D')),
    'L’Upper B non deve più avere il blocco D delle alzate laterali.',
  );

  /* --------- Gli esercizi che non avevano un gradino da cui partire ------ */

  /*
   * Il foglio prescriveva sei esercizi già nella loro forma avanzata.
   *
   * L'hip thrust monopodalico senza che esistesse quello a due gambe, il
   * single-leg RDL, i due calf a una gamba, lo step-up su box alto, il sissy
   * squat libero: niente scala, niente livello, nessun gradino più facile.
   * Chi non aveva mai fatto la versione standard non aveva da dove partire e
   * nemmeno un livello da abbassare.
   */
  await page.goto(`${BASE}/#/seduta/lower-b`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);

  for (let i = 0; i < 30; i += 1) {
    if ((await page.locator('h1').first().innerText()).includes('· B1')) break;
    const avantiB1 = page.getByRole('button', { name: /serie \d+ ›$/ });
    if ((await avantiB1.count()) === 0) break;
    await avantiB1.click();
    await page.waitForTimeout(190);
  }

  if ((await page.locator('h1').first().innerText()).includes('· B1')) {
    const b1 = await page.locator('main').innerText();
    check(
      b1.includes('Hip thrust monopodalico, spalle su panca'),
      'Il blocco deve continuare a dire cosa prescrive la scheda.',
    );
    check(
      b1.includes('Liv. 1 · Glute bridge a terra, due gambe'),
      `Senza un test sulla scala si parte dal primo gradino: letto ${JSON.stringify((/Liv\. \d+ · [^\n]+/.exec(b1) ?? ['(nessuno)'])[0])}.`,
    );
    check(
      b1.includes('Nella scheda: Hip thrust monopodalico'),
      'L’obiettivo della scheda deve restare scritto, altrimenti un gradino più basso sembra un errore.',
    );
    check(
      (await page.getByText('Sinistra').count()) === 0,
      'Il glute bridge a due gambe non si registra per lato, anche se la scheda dichiara il blocco «per gamba».',
    );

    /* La scala intera deve essere raggiungibile dal selettore. */
    const matitaB1 = page.locator('main button').filter({ hasText: '✎' }).first();
    if ((await matitaB1.count()) > 0) {
      await matitaB1.click();
      await page.waitForTimeout(600);
      const scala = await page.locator('main').innerText();
      for (const gradino of [
        'Glute bridge a terra, due gambe',
        'Hip thrust spalle su panca, due gambe',
        'Glute bridge monopodalico a terra',
        'Hip thrust monopodalico con pausa 2"',
      ]) {
        check(scala.includes(gradino), `Il selettore deve offrire il gradino «${gradino}».`);
      }
    }
  }

  /* ------------------ Il blocco a durata del sabato ---------------------- */

  /*
   * La zona 2 conclusiva dello Shadow si misura in minuti.
   *
   * `measurement: 'duration'` cadeva nel ramo delle ripetizioni: il blocco
   * chiedeva «Ripetizioni» con l'unità «rip» per mezz'ora di corsa, e non
   * c'era dove scrivere né i minuti né la frequenza cardiaca. Si è visto solo
   * allungando il blocco da 15 a 30 minuti.
   */
  await page.goto(`${BASE}/#/seduta/shadow`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);

  for (let i = 0; i < 30; i += 1) {
    if ((await page.locator('h1').first().innerText()).includes('· F')) break;
    const avantiF = page.getByRole('button', { name: /serie \d+ ›$/ });
    if ((await avantiF.count()) === 0) break;
    await avantiF.click();
    await page.waitForTimeout(220);
  }

  const suF = (await page.locator('h1').first().innerText()).includes('· F');
  check(
    suF,
    `La navigazione deve arrivare al blocco F dello Shadow, invece è su ${JSON.stringify(await page.locator('h1').first().innerText())}.`,
  );


  if (suF) {
    const bloccoF = await page.locator('main').innerText();
    check(
      bloccoF.includes('Durata effettiva'),
      'Un blocco a durata si registra in minuti: deve chiedere la durata effettiva.',
    );
    check(
      !bloccoF.includes('Ripetizioni'),
      'Un blocco a durata non ha ripetizioni: non deve chiederle né mostrarle.',
    );
    check(
      bloccoF.includes('30′'),
      `Il blocco F del sabato è stato allungato a 30 minuti: la scheda deve dirlo. Letto: ${JSON.stringify(bloccoF.slice(bloccoF.indexOf('Durata'), bloccoF.indexOf('Durata') + 40))}`,
    );
    check(
      bloccoF.includes('Frequenza cardiaca'),
      'La zona 2 si guida con la frequenza cardiaca: ci deve essere dove scriverla.',
    );

    const campiF = page.locator('input[type=number]');
    if ((await campiF.count()) >= 2) {
      await campiF.nth(0).fill('30');
      await campiF.nth(1).fill('130');
      await page.waitForTimeout(200);
      const registraF = page.getByRole('button', { name: 'Serie fatta' });
      check(
        (await registraF.count()) > 0 && !(await registraF.isDisabled()),
        'Scritti minuti e frequenza, la registrazione del blocco a durata deve essere possibile.',
      );
    }
  }

  /*
   * Passare da una seduta all'altra deve ripartire dalla prima serie.
   *
   * Il router cambia solo la proprietà `sessionId`, quindi React riusava lo
   * stesso componente e la serie corrente restava quella della seduta di
   * prima: arrivando da una seduta più lunga si finiva su «Piano della seduta
   * vuoto», perché quell'indice nell'altro piano non esiste.
   */
  await page.goto(`${BASE}/#/seduta/lower-b`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  for (let i = 0; i < 30; i += 1) {
    const avanti = page.getByRole('button', { name: /serie \d+ ›$/ });
    if ((await avanti.count()) === 0) break;
    await avanti.click();
    await page.waitForTimeout(140);
  }
  const finePiano = await page.locator('header p').first().innerText();
  await page.goto(`${BASE}/#/seduta/zona-2`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  const dopoIlCambio = await page.locator('main').innerText();
  check(
    !dopoIlCambio.includes('Piano della seduta vuoto'),
    `Cambiando seduta il player non deve finire fuori dal piano (veniva da ${JSON.stringify(finePiano)}).`,
  );

  /* ------------------ Un titolo, un esercizio (tutti) ------------------- */

  /*
   * Il primo giro ne aveva sistemati tre, quelli che l'utente aveva visto.
   * Ne restavano sei: «Dip alle parallele o agli anelli», «Push-up archer o
   * pseudo-planche», «Negative di HSPU al muro o pike push-up», «Shrimp squat
   * o skater squat», «Ab wheel o rollout TRX» e il C2 del lunedì, «Diamond
   * push-up o dip tra due panche». Un titolo che ne nomina due non dice quale
   * stai facendo.
   *
   * Il controllo sta sull'elenco e non su una riga sola: è l'unico modo
   * perché il prossimo nome a due teste venga trovato senza che qualcuno lo
   * vada a cercare.
   */
  await page.goto(`${BASE}/#/esercizi`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  const nomi = await page.evaluate(() =>
    [...document.querySelectorAll('main button')].map((nodo) => nodo.innerText.split('\n')[0] ?? ''),
  );
  check(nomi.length > 20, `L’elenco deve mostrare tutti gli esercizi: trovati ${String(nomi.length)}.`);
  const dueTeste = nomi.filter((nome) => / o | oppure | \/ /i.test(nome));
  check(
    dueTeste.length === 0,
    `Nessun titolo deve nominare due esercizi. Trovati: ${JSON.stringify(dueTeste)}.`,
  );

  /* E la seconda metà non deve essere sparita: ha una scheda sua. */
  await page.goto(`${BASE}/#/esercizi/dip-panche`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  check(
    (await page.locator('header h1').first().innerText()).toLowerCase().includes('dip tra due panche'),
    'Il dip tra due panche deve avere una scheda sua, non essere sparito insieme al titolo.',
  );

  /* La serie spaiata della superserie va spiegata, non subita. */
  await page.goto(`${BASE}/#/seduta/lower-b`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);

  let spiegata = false;
  for (let giro = 0; giro < 30; giro += 1) {
    if ((await page.locator('main').innerText()).includes('Ultimo giro da solo')) {
      spiegata = true;
      break;
    }
    const avanti = page.getByRole('button', { name: /serie \d+ ›$/ });
    if ((await avanti.count()) === 0) break;
    await avanti.click();
    await page.waitForTimeout(160);
  }
  check(
    spiegata,
    'Nel Lower B il blocco B è 4 serie di hip thrust e 3 di shrimp squat: la serie rimasta sola deve dire perché.',
  );

  /* ------------------ La scala si tocca, non si guarda ------------------- */

  /*
   * Nella scheda di un esercizio i gradini erano righe morte: si vedeva a che
   * livello si è e non si poteva toccare nient'altro, mentre la cosa che si
   * vuole fare guardando una scala è capire cosa c'è prima e cosa c'è dopo, e
   * spostarsi senza dover aprire una seduta.
   */
  await page.goto(`${BASE}/#/esercizi/trazioni-presa-larga`, { waitUntil: 'load' });
  await page.waitForTimeout(1400);

  /*
   * Niente filtro sul nome: il gradino 5 della trazione verticale si chiama
   * «Archer / L-sit pull-up» e un filtro su «Trazioni» ne trovava cinque su
   * sei. Nella pagina l'unica lista di pulsanti è la scala.
   */
  const gradini = page.locator('main ul li > button');
  check(
    (await gradini.count()) === 6,
    `I sei gradini della scala devono essere pulsanti, non righe da guardare. Trovati ${String(await gradini.count())}.`,
  );

  if ((await gradini.count()) === 6) {
    /* Il gradino attuale porta il badge "Ora": se ne tocca un altro. */
    const indiceAttuale = await page.evaluate(() =>
      [...document.querySelectorAll('main ul li > button')].findIndex((nodo) =>
        nodo.innerText.includes('Ora'),
      ),
    );
    check(indiceAttuale >= 0, 'La scala deve dire su quale gradino sei ora.');

    const altro = indiceAttuale === 0 ? 1 : 0;
    const nomeAltro = (await gradini.nth(altro).innerText()).split('\n')[1] ?? '';
    await gradini.nth(altro).click();
    await page.waitForTimeout(400);

    const aperto = await page.locator('main').innerText();
    check(
      aperto.includes('più facile di dove sei') || aperto.includes('più difficile di dove sei'),
      `Toccando un gradino si deve capire com'è rispetto a dove sei. Letto: ${JSON.stringify(aperto.slice(0, 400))}`,
    );

    const passa = page.getByRole('button', { name: 'Passa a questo livello' });
    check(
      (await passa.count()) === 1,
      'Da un gradino diverso dal proprio si deve poter passare a quel livello.',
    );

    if ((await passa.count()) === 1) {
      await passa.click();
      await page.waitForTimeout(1500);
      const dopoIlSalto = await page.evaluate(() => {
        const nodo = [...document.querySelectorAll('main ul li > button')].find((b) =>
          b.innerText.includes('Ora'),
        );
        return nodo === undefined ? '' : nodo.innerText;
      });
      check(
        dopoIlSalto.includes(nomeAltro) && nomeAltro !== '',
        `Cambiato livello dalla scheda, la scala deve mostrare "${nomeAltro}" come gradino attuale. Legge "${dopoIlSalto.replace(/\n/g, ' ')}".`,
      );
    }
  }

  /* ------------------ Un titolo, un esercizio --------------------------- */

  /*
   * La riga della scheda dice «Skill: hollow hold / L-sit / verticale al
   * muro»: tre esercizi in un titolo solo, che non dice quale stai facendo.
   * Ora sono tre skill separate e si sceglie quale.
   *
   * E scegliere un'alternativa a mano non passa dal tetto del test: il tetto
   * serve dove è la scheda ad assegnare un gradino, non dove scegli tu. Chi
   * sceglie il L-sit vuole il L-sit, non l'hollow hold che è il gradino a cui
   * il test lo ha misurato.
   */
  await page.goto(`${BASE}/#/seduta/shadow`, { waitUntil: 'load' });
  await page.waitForTimeout(1700);

  const testaBloccoA = async () => (await page.locator('main').innerText()).split('\nA\n\n')[1] ?? '';

  /*
   * Un esercizio solo nel titolo, al posto di «Skill: hollow hold / L-sit /
   * verticale al muro». Qui l'hollow hold è al proprio gradino, quindi il
   * titolo è il nome dell'esercizio; sotto il proprio gradino sarebbe il nome
   * del gradino, che pure ne nomina uno solo.
   */
  const testaA = await testaBloccoA();
  check(
    /^(Liv\. \d+ · )?Hollow hold/.test(testaA),
    `Il titolo deve nominare un esercizio solo: letto ${JSON.stringify(testaA.split('\n')[0])}.`,
  );
  check(
    !(await page.locator('main').innerText()).includes('Skill: hollow hold / L-sit'),
    'Il titolo con tre esercizi in uno non deve più comparire.',
  );
  for (const skill of ['Hollow hold', 'L-sit', 'Verticale al muro']) {
    check(
      (await page.getByRole('button', { name: new RegExp(`^${skill}`) }).count()) > 0,
      `Il blocco A deve offrire ${skill} come scelta.`,
    );
  }

  const sceltaLSit = page.getByRole('button', { name: /^L-sit/ }).first();
  if ((await sceltaLSit.count()) > 0) {
    await sceltaLSit.click();
    await page.waitForTimeout(1100);
    check(
      (await testaBloccoA()).includes('L-sit'),
      'Scelto il L-sit, il blocco deve dire che stai facendo il L-sit.',
    );

    const matitaA = page.locator('main button').filter({ hasText: '✎' }).first();
    if ((await matitaA.count()) > 0) {
      await matitaA.click();
      await page.waitForTimeout(700);
      const gradino = await page
        .locator('main li button[aria-pressed="true"]')
        .first()
        .innerText()
        .catch(() => '');
      /*
       * Il 5 è il gradino dell'L-sit nella scala dell'L-sit, che ora esiste:
       * prima stava sul 6 del core, cioè sull'ab wheel, e il gradino più
       * facile che l'app sapeva offrirgli era un plank.
       */
      check(
        gradino.startsWith('5'),
        `Scegliendo un’alternativa a mano si va al suo gradino, non a quello del tetto: selezionato ${JSON.stringify(gradino.replace(/\n/g, ' '))}.`,
      );
    }
  }

  /*
   * Dove non c'è una scala, la seduta deve dire come si progredisce: sui
   * manubri è il peso, e sei gradini inventati sarebbero rumore.
   */
  await page.goto(`${BASE}/#/seduta/upper-b`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  for (let i = 0; i < 30; i += 1) {
    if ((await page.locator('h1').first().innerText()).includes('· C2')) break;
    const avantiC2 = page.getByRole('button', { name: /serie \d+ ›$/ });
    if ((await avantiC2.count()) === 0) break;
    await avantiC2.click();
    await page.waitForTimeout(170);
  }
  const matitaCurl = page.locator('main button').filter({ hasText: '✎' }).first();
  if ((await matitaCurl.count()) > 0) {
    await matitaCurl.click();
    await page.waitForTimeout(700);
    check(
      (await page.getByText('la progressione è il peso').count()) > 0,
      'Un esercizio senza scala deve dire qual è la sua progressione, non lasciare un campo vuoto.',
    );
  }

  /* -------- Recupero tra i blocchi e ritorno sulla serie giusta ---------- */

  /*
   * Due cose viste nello stesso sabato.
   *
   * L'ultima serie di ogni blocco nasceva senza recupero: si passava
   * dall'ultima serie di un esercizio alla prima del successivo senza nessuna
   * pausa, su tutti i blocchi di tutte le sedute.
   *
   * E le lettere dei blocchi riportavano sempre alla serie 1: chi andava a
   * sbirciare un altro esercizio e tornava si ritrovava all'inizio del
   * proprio, con le serie già registrate da riattraversare a una a una.
   */
  await page.goto(`${BASE}/#/seduta/shadow`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);

  const serieMostrata = async () =>
    (/Serie\n\n(\d+\/\d+)/.exec(await page.locator('main').innerText()))?.[1] ?? '?';

  /* Le tre serie del blocco A: anche l'ultima deve avere un recupero. */
  const recuperiA = [];
  for (let k = 0; k < 3; k += 1) {
    const campiA = page.locator('input[type=number]');
    for (let j = 0; j < (await campiA.count()); j += 1) await campiA.nth(j).fill('35');
    await page.waitForTimeout(140);
    const fattaA = page.getByRole('button', { name: 'Serie fatta' });
    if ((await fattaA.count()) === 0 || (await fattaA.isDisabled())) break;
    const quale = await serieMostrata();
    await fattaA.click();
    await page.waitForTimeout(400);
    const barra = page.getByTestId('rest-bar');
    recuperiA.push(`${quale}:${(await barra.count()) > 0 ? String(await barra.getAttribute('data-total')) : 'nessuno'}`);
    const saltaA = page.getByRole('button', { name: /Salta/ }).first();
    if ((await saltaA.count()) > 0) { await saltaA.click(); await page.waitForTimeout(150); }
  }
  check(
    recuperiA.length === 3 && !recuperiA.some((riga) => riga.endsWith('nessuno')),
    `Anche l’ultima serie di un blocco deve avere un recupero: ${recuperiA.join(', ')}.`,
  );

  /* Registro due serie di B, ne scrivo una terza, esco e torno. */
  await page.getByRole('button', { name: 'B', exact: true }).click();
  await page.waitForTimeout(500);
  for (let k = 0; k < 2; k += 1) {
    const campiB = page.locator('input[type=number]');
    for (let j = 0; j < (await campiB.count()); j += 1) await campiB.nth(j).fill('18');
    await page.waitForTimeout(140);
    await page.getByRole('button', { name: 'Serie fatta' }).click();
    await page.waitForTimeout(380);
    const saltaB = page.getByRole('button', { name: /Salta/ }).first();
    if ((await saltaB.count()) > 0) { await saltaB.click(); await page.waitForTimeout(150); }
  }

  const serieAperta = await serieMostrata();
  const campiTerza = page.locator('input[type=number]');
  for (let j = 0; j < (await campiTerza.count()); j += 1) await campiTerza.nth(j).fill('16');
  await page.waitForTimeout(200);

  await page.getByRole('button', { name: 'D', exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'B', exact: true }).click();
  await page.waitForTimeout(700);

  check(
    (await serieMostrata()) === serieAperta,
    `Tornando su un blocco si riprende dalla serie da fare (${serieAperta}), non dalla prima: trovata ${await serieMostrata()}.`,
  );
  check(
    (await page.locator('input[type=number]').evaluateAll((els) => els.map((el) => el.value))).includes('16'),
    'Tornando sul blocco i valori scritti e non registrati devono essere ancora lì.',
  );

  /* ---------------- Sedute doppie e sedute fantasma ---------------------- */

  /*
   * Riaprire una seduta chiusa non deve crearne una seconda.
   *
   * Cercava solo le sedute aperte di oggi: riaprendone una già chiusa ne
   * nasceva una nuova e vuota, che restava «in corso» per sempre e il giorno
   * dopo compariva in Home come «seduta rimasta aperta». Chi la riapriva
   * vedeva zero serie su ventuno al posto del proprio lavoro.
   */
  const sedutePrima = (await readFromEmulator('sessions')).length;

  await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  const riapri = page.getByRole('button', { name: /Riapri la seduta di oggi/ });
  if ((await riapri.count()) > 0) {
    await riapri.click();
    await page.waitForTimeout(1800);

    check(
      (await page.locator('main').innerText()).includes('SERIE REGISTRATE') ||
        (await page.getByText('Serie registrate').count()) > 0,
      'Riaprendo una seduta chiusa si devono rivedere le serie registrate, non una seduta vuota.',
    );

    const seduteDopo = (await readFromEmulator('sessions')).length;
    check(
      seduteDopo === sedutePrima,
      `Riaprire una seduta non deve crearne un’altra: erano ${String(sedutePrima)}, ora ${String(seduteDopo)}.`,
    );
  }

  /*
   * Una seduta fuori posto si deve poter togliere, e la riga giusta.
   *
   * Prima la Home aveva un pulsante «Riprendi» che apriva la seduta *di oggi*
   * con quel nome invece di quella vecchia: premerlo su una Lower A di ieri ne
   * creava una di oggi, e la Home finiva per dire «Lower A è finita» in un
   * giorno di corsa.
   */
  const esistenti = await readFromEmulator('sessions');
  if (esistenti.length > 0 && esistenti[0] !== undefined) {
    const modello = esistenti[0];
    const parent = modello.name.split('/sessions/')[0];
    const fantasmaId = 'fantasma-di-ieri';
    await writeToEmulator(parent, 'sessions', fantasmaId, {
      ...modello.fields,
      id: { stringValue: fantasmaId },
      date: { stringValue: '2020-01-02' },
      status: { stringValue: 'in-progress' },
      exercises: { arrayValue: { values: [] } },
    });

    await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    check(
      (await page.getByText('fuori posto').count()) > 0,
      'Una seduta aperta in un giorno passato deve comparire tra quelle fuori posto.',
    );
    /* `exact` apposta: «Riprendi la seduta» è il pulsante di oggi, non è quello. */
    check(
      (await page.getByRole('button', { name: 'Riprendi', exact: true }).count()) === 0,
      'La Home non deve più offrire di riprendere una seduta vecchia: apriva quella di oggi, non quella.',
    );

    /* La riga della seduta seminata, non una qualunque delle tre. */
    const riga = page.getByRole('listitem').filter({ hasText: '2020-01-02' });
    check(
      (await riga.count()) === 1,
      `La seduta del 2020-01-02 deve avere la sua riga: trovate ${String(await riga.count())}.`,
    );

    if ((await riga.count()) === 1) {
      check(
        (await riga.innerText()).includes('nessuna serie'),
        'La riga deve dire quante serie contiene, così si sa cosa si sta eliminando.',
      );

      await riga.getByRole('button', { name: 'Elimina' }).click();
      await page.waitForTimeout(500);
      check(
        (await page.getByText('eliminarla non perde niente').count()) > 0,
        'Eliminare una seduta vuota deve dire che non si perde niente.',
      );
      await page.getByRole('button', { name: 'Sì, eliminala' }).click();
      await page.waitForTimeout(2000);

      check(
        (await page.getByRole('listitem').filter({ hasText: '2020-01-02' }).count()) === 0,
        'Eliminata la seduta, la Home non deve più mostrarla.',
      );
      const rimaste = await readFromEmulator('sessions');
      check(
        !rimaste.some((row) => row.name.endsWith(fantasmaId)),
        'La seduta eliminata deve sparire davvero dal database, non solo dallo schermo.',
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

  const righeLog = await page.locator('tbody tr').allInnerTexts();
  check(
    righeLog.some((riga) => riga.includes('Wall sit')),
    'Il wall sit deve finire nel log col proprio nome, non sotto quello del sissy squat.',
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

  /* ------------------ La settimana chiusa si rivede --------------------- */

  /*
   * Finita la settimana 1, la settimana 2 era identica alla settimana 1.
   *
   * Il motore delle leve proponeva solo a fine seduta, una volta, e solo se si
   * rispondeva alla domanda sul tempo: chi chiudeva l'app prima del riepilogo
   * si rifaceva sette giorni uguali. La revisione guarda i numeri di tutta la
   * settimana e resta lì finché non è stata guardata.
   *
   * Qui si sposta indietro di sette giorni la data di inizio: la seduta
   * registrata sopra resta quella che è, con la sua settimana 1 scritta
   * dentro, e oggi diventa settimana 2.
   */
  const impostazioni = await readFromEmulator('settings');
  const riga = impostazioni[0];
  if (riga !== undefined) {
    const lunedi = new Date();
    lunedi.setDate(lunedi.getDate() - (((lunedi.getDay() + 6) % 7) + 7));
    const inizio = lunedi.toISOString().slice(0, 10);
    await updateInEmulator(riga.name, { programStartDate: { stringValue: inizio } });

    await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    const homeRevisione = await page.locator('main').innerText();

    check(
      homeRevisione.includes('Settimana 1 chiusa'),
      `Chiusa la settimana, la Home deve proporre di rivederla. Legge: ${JSON.stringify(homeRevisione.slice(0, 300))}`,
    );

    const apri = page.getByRole('button', { name: 'Rivedi la settimana' });
    if ((await apri.count()) === 1) {
      await apri.click();
      await page.waitForTimeout(1800);
      const revisione = await page.locator('main').innerText();

      /* Il conteggio sta nel sottotitolo, che vive nell'intestazione. */
      check(
        (await page.locator('header').innerText()).includes('serie lette'),
        'La revisione deve dire su quante serie si regge.',
      );
      /*
       * Il giudizio senza i numeri non si può contestare: la pagina deve
       * citare le serie e il range su cui si basa.
       */
      check(
        revisione.includes('su un range di'),
        `Ogni verdetto deve citare i numeri su cui si regge. Legge: ${JSON.stringify(revisione.slice(0, 400))}`,
      );

      const applica = page.getByRole('button', { name: 'Applica' });
      const quanti = await applica.count();
      check(quanti > 0, 'La settimana registrata fuori range deve produrre almeno un verdetto.');

      if (quanti > 0) {
        /*
         * L'esercizio, non il titolo del verdetto: applicando si cambia il
         * livello, e con il livello cambia anche il titolo che la revisione
         * scriverebbe la volta dopo. Il nome dell'esercizio invece resta.
         */
        const primoEsercizio = await page.locator('main span.rounded-full').first().innerText();
        await applica.first().click();
        await page.waitForTimeout(1500);

        check(
          (await page.getByRole('button', { name: 'Applica' }).count()) === quanti - 1,
          'Deciso un verdetto, quello deve sparire dalla lista.',
        );

        /* E non deve tornare al prossimo giro: la decisione è registrata. */
        await page.reload({ waitUntil: 'load' });
        await page.waitForTimeout(2200);
        const dopoIlRicarico = await page.locator('main').innerText();
        check(
          (await page.getByRole('button', { name: 'Applica' }).count()) === quanti - 1,
          'Ricaricata la pagina, un verdetto già deciso non deve ripresentarsi.',
        );
        check(
          !dopoIlRicarico.includes(primoEsercizio),
          `L’esercizio già deciso non deve tornare nella lista. Torna "${primoEsercizio}".`,
        );

        /* La decisione è finita nello stato, non solo nello schermo. */
        const stati = await readFromEmulator('exerciseStates');
        check(
          stati.length > 0,
          'Applicando un verdetto lo stato dell’esercizio deve essere scritto nel database.',
        );
      }
    }
  }

  /* ------------------------- Chiaro e scuro ---------------------------- */

  /*
   * Il tema chiaro è quello che l'app monta da sola, e la scelta deve
   * sopravvivere a un riavvio: un tema che torna indietro a ogni apertura è
   * peggio di non averlo.
   */
  const temaAttivo = async () =>
    page.evaluate(() => ({
      attributo: document.documentElement.dataset.theme ?? 'nessuno',
      fondo: getComputedStyle(document.body).backgroundColor,
      barra: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '',
    }));

  await page.goto(`${BASE}/#/impostazioni`, { waitUntil: 'load' });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1300);

  const diPartenza = await temaAttivo();
  check(
    diPartenza.attributo === 'nessuno',
    `Senza scelte l’app deve partire chiara, senza attributo di tema. Legge "${diPartenza.attributo}".`,
  );
  check(
    diPartenza.barra.toLowerCase() === '#f2f5f9',
    `La barra di stato deve seguire il fondo chiaro. Legge "${diPartenza.barra}".`,
  );

  const scuro = page.getByRole('button', { name: 'Scuro', exact: true });
  check((await scuro.count()) === 1, 'Le impostazioni devono far scegliere il tema.');

  if ((await scuro.count()) === 1) {
    await scuro.click();
    await page.waitForTimeout(600);
    const subito = await temaAttivo();
    check(
      subito.attributo === 'dark' && subito.fondo !== diPartenza.fondo,
      `Scelto lo scuro, lo schermo deve cambiare subito. Legge ${JSON.stringify(subito)}.`,
    );
    check(
      subito.barra.toLowerCase() === '#0b0f14',
      `Anche la barra di stato deve passare allo scuro. Legge "${subito.barra}".`,
    );

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1300);
    check(
      (await temaAttivo()).attributo === 'dark',
      'Riaperta l’app, il tema scelto deve essere ancora quello.',
    );

    await page.getByRole('button', { name: 'Chiaro', exact: true }).click();
    await page.waitForTimeout(600);
    const tornato = await temaAttivo();
    check(
      tornato.attributo === 'nessuno' && tornato.fondo === diPartenza.fondo,
      `Tornando al chiaro si deve tornare esattamente da dove si era partiti. Legge ${JSON.stringify(tornato)}.`,
    );
  }

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
