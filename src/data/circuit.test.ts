import { describe, expect, it } from 'vitest';
import { CIRCUIT_ORDER, CIRCUIT_SESSIONS, findCircuitSession, isCircuitSessionId } from './circuit.ts';
import { findExercise, getExercise } from './exercises.ts';
import { WEEK_ZERO_TESTS } from './tests.ts';
import { DEVIAZIONI_NOTA, applicaDeviazioneNota } from './deviations.ts';
import { buildGuidedPlan, clockOffsets, estimatedSeconds } from '../engine/circuit.ts';
import { variantNoteAt } from '../engine/draft.ts';
import { plannedVolumeByGroup } from '../engine/metrics.ts';
import type { MuscleGroup } from '../types/index.ts';

/** Il tetto dichiarato: quaranta minuti, finitura compresa. */
const TETTO_SECONDI = 40 * 60;

describe('circuit.ts — il programma attivo', () => {
  it('ha quattro sedute, nell’ordine della rotazione', () => {
    expect(CIRCUIT_SESSIONS).toHaveLength(4);
    expect(CIRCUIT_SESSIONS.map((session) => session.id)).toEqual([...CIRCUIT_ORDER]);
    for (const id of CIRCUIT_ORDER) expect(isCircuitSessionId(id)).toBe(true);
    expect(isCircuitSessionId('upper-a')).toBe(false);
  });

  it('non assegna nessun giorno della settimana', () => {
    /*
     * È il vincolo che il programma attivo non ha. Se un giorno ricomparisse
     * qui, la Home tornerebbe a chiedersi «è il giorno giusto?» e tutta la
     * macchina degli spostamenti tornerebbe necessaria.
     */
    for (const session of CIRCUIT_SESSIONS) {
      expect(session.weekday, session.id).toBeNull();
      expect(session.kind, session.id).toBe('circuit');
    }
  });

  it('sta dentro i quaranta minuti dichiarati, finitura compresa', () => {
    for (const session of CIRCUIT_SESSIONS) {
      const secondi = estimatedSeconds(buildGuidedPlan(session, 1));
      expect(secondi, `${session.id} dura ${String(Math.round(secondi / 60))} minuti`)
        .toBeLessThanOrEqual(TETTO_SECONDI);
      /* E nemmeno troppo corta: sotto i 30 vuol dire che manca del lavoro. */
      expect(secondi, session.id).toBeGreaterThan(30 * 60);
    }
  });

  it('ogni blocco punta a un esercizio esistente, alternative comprese', () => {
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        expect(findExercise(block.exercise), `${session.id}/${block.code}`).toBeDefined();
        for (const alt of block.alternatives ?? []) {
          expect(findExercise(alt.exercise), `${session.id}/${block.code}/alt`).toBeDefined();
        }
      }
    }
  });

  it('ogni passo di riscaldamento cita un esercizio vero e dice quanto dura', () => {
    for (const session of CIRCUIT_SESSIONS) {
      const passi = session.warmupSteps ?? [];
      expect(passi.length, session.id).toBeGreaterThan(3);
      for (const passo of passi) {
        /*
         * Ogni passo ha una durata, sempre. Le ripetizioni sono un bersaglio
         * dentro quella finestra, non un conto aperto: è la differenza tra un
         * passo che a zero va avanti e uno che a zero resta fermo scrivendo
         * «Fatto».
         */
        expect(passo.seconds, `${session.id}/${passo.label}`).toBeGreaterThan(0);
        if (passo.reps !== null) {
          expect(passo.reps, `${session.id}/${passo.label}`).toBeGreaterThan(0);
        }
        if (passo.exercise !== undefined) {
          expect(findExercise(passo.exercise), passo.exercise).toBeDefined();
        }
      }
    }
  });

  it('chiude il riscaldamento con un giro di prova del primo blocco', () => {
    /*
     * `rampGroup` non è un'etichetta: il player lo apre in un passo per ogni
     * esercizio del blocco. Scritto come riga unica chiedeva «un giro del
     * Tri-set A» senza nominare nessuno dei tre esercizi, con quarantacinque
     * secondi di conto alla rovescia che non bastavano nemmeno a provarne uno.
     */
    for (const session of CIRCUIT_SESSIONS) {
      const passi = session.warmupSteps ?? [];
      const ultimo = passi.at(-1);
      expect(ultimo?.rampGroup, session.id).toBe('A');
      expect(
        session.blocks.some((block) => block.group === 'A'),
        session.id,
      ).toBe(true);
    }
  });

  it('non deriva nessun range dal test dei massimali', () => {
    /*
     * È la correzione che ha fatto nascere questa scheda. Con un massimale di
     * 4 trazioni, un range calcolato dal test prescrive numeri ineseguibili:
     * qui il range è fisso ed è il *gradino* a doversi spostare perché il
     * massimo tecnico ci caschi dentro.
     */
    const idTest = new Set(WEEK_ZERO_TESTS.map((test) => test.id));
    expect(idTest.size).toBeGreaterThan(0);
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        expect(block.prescription.kind, `${session.id}/${block.code}`).not.toBe('reps-from-test');
      }
    }
  });

  it('usa l’unità di misura che l’esercizio dichiara', () => {
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        const measurement = getExercise(block.exercise).measurement;
        const key = `${session.id}/${block.code}`;
        if (block.prescription.kind === 'seconds') expect(measurement, key).toBe('seconds');
        if (block.prescription.kind === 'reps') expect(measurement, key).toBe('reps');
      }
    }
  });

  it('esclude dalla revisione la finitura e la decompressione, e nient’altro', () => {
    /*
     * La finitura va a massime ripetizioni su un tempo fissato: il numero
     * dipende da quanto era dura la seduta fin lì, non dal gradino. Lasciarla
     * dentro farebbe proporre «scendi di livello» su esercizi sani.
     *
     * La decompressione è fuori per un motivo diverso: non è lavoro. Trenta
     * secondi appesi e un minuto di apertura d'anca non hanno un gradino da
     * salire, e una sospensione tenuta venti secondi invece di trenta non è
     * un segnale di regressione — è una seduta andata lunga.
     *
     * I due blocchi veri, A e B, devono restare dentro: il flag che li
     * escludesse per sbaglio spegnerebbe metà della revisione in silenzio.
     */
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        expect(block.excludeFromReview ?? false, `${session.id}/${block.code}`).toBe(
          block.group === 'F' || block.group === 'Z',
        );
      }
    }
  });

  it('ha la stessa struttura in tutte e quattro: A, B, finitura, decompressione', () => {
    /*
     * Quattro blocchi con quattro ruoli, identici in tutte e quattro le
     * sedute. La versione precedente di questo file ne aveva quattro di
     * lavoro invece di due tri-set, una finitura da tre stazioni e nessuna
     * decompressione: la struttura è la cosa che si è rotta per prima, e
     * questo test è quello che l'avrebbe fermata.
     */
    for (const session of CIRCUIT_SESSIONS) {
      const conta = (group: string): number =>
        session.blocks.filter((block) => block.group === group).length;
      expect(conta('A'), `${session.id}/A`).toBe(3);
      expect(conta('B'), `${session.id}/B`).toBe(3);
      expect(conta('F'), `${session.id}/F`).toBe(4);
      expect(conta('Z'), `${session.id}/Z`).toBe(3);
      expect([...new Set(session.blocks.map((block) => block.group))], session.id).toEqual([
        'A',
        'B',
        'F',
        'Z',
      ]);
    }
  });

  it('dà alle braccia due stazioni per seduta, nel Tri-set 2', () => {
    /*
     * La priorità dichiarata è «braccia più grosse». Un gruppo prioritario che
     * compare una volta a settimana prende tre serie e un segnale di
     * progressione così rumoroso che una giornata storta costa una settimana
     * di dati. Qui il Tri-set 2 ne ha due per seduta più una di vita: otto
     * stazioni di braccia a settimana, con un esercizio diverso ogni volta.
     */
    const stazioniBraccia = CIRCUIT_SESSIONS.flatMap((session) => {
      const braccia = session.blocks.filter(
        (block) =>
          block.group === 'B' && getExercise(block.exercise).primaryMuscles.includes('braccia'),
      );
      expect(braccia.length, session.id).toBe(2);
      return braccia.map((block) => block.exercise);
    });
    /* Otto stazioni di braccia: almeno sei esercizi diversi. */
    expect(new Set(stazioniBraccia).size).toBeGreaterThanOrEqual(6);

    /* E una di vita per seduta, che è l'altro mezzo nome del blocco. */
    for (const session of CIRCUIT_SESSIONS) {
      const vita = session.blocks.filter(
        (block) =>
          block.group === 'B' && getExercise(block.exercise).primaryMuscles.includes('core'),
      );
      expect(vita.length, session.id).toBe(1);
    }
  });

  it('non mette due stazioni di presa una dopo l’altra dentro un giro', () => {
    /*
     * Due stazioni appese una dopo l'altra trasformano il circuito in un test
     * di avambracci: la seconda viene interrotta dalla presa, cioè da qualcosa
     * che non è il muscolo che si vuole allenare.
     */
    const dipendeDallaPresa = (slug: string): boolean =>
      slug.startsWith('trazioni') ||
      slug.startsWith('chin-up') ||
      slug.startsWith('rematore-inverso') ||
      slug.startsWith('rematore-trx') ||
      slug === 'hanging-leg-raise' ||
      slug === 'dead-hang';

    for (const session of CIRCUIT_SESSIONS) {
      const gruppi = [...new Set(session.blocks.map((block) => block.group))];
      for (const group of gruppi) {
        const blocchi = session.blocks.filter((block) => block.group === group);
        for (let i = 0; i < blocchi.length - 1; i += 1) {
          const uno = blocchi[i];
          const due = blocchi[i + 1];
          if (uno === undefined || due === undefined) continue;
          expect(
            dipendeDallaPresa(uno.exercise) && dipendeDallaPresa(due.exercise),
            `${session.id}/${uno.code}→${due.code}`,
          ).toBe(false);
        }
      }
    }
  });

  it('ha gli esercizi della scheda originale, nell’ordine della scheda', () => {
    /*
     * L'impronta della trascrizione.
     *
     * Questo test esiste per un motivo preciso: una volta queste quattro
     * sedute sono state riscritte a memoria, perché le tabelle non erano più
     * sotto gli occhi, e ne è uscita una scheda con metà degli esercizi
     * diversi — pull-over al TRX dove la scheda dice dip, quattro blocchi
     * dove dice due tri-set. Nessun test se ne accorse: controllavano tutti
     * proprietà (gli slug esistono, l'unità di misura torna, l'orologio sta
     * nei quaranta minuti), e una scheda inventata le rispetta tutte.
     *
     * Qui non c'è nessuna proprietà: c'è la lista. Se cambia, fallisce, e chi
     * la cambia deve dire perché.
     */
    const impronta = (id: string): readonly string[] =>
      (findCircuitSession(id)?.blocks ?? []).map((block) => `${block.code} ${block.exercise}`);

    expect(impronta('circuito-1')).toEqual([
      'A1 trazioni-prona-presa-media',
      'A2 bulgarian-split-squat',
      'A3 dip-parallele-anelli',
      'B1 curl-martello-manubri',
      'B2 estensione-tricipiti-sopra-testa',
      'B3 suitcase-carry',
      'F1 kb-swing',
      'F2 corda-battaglia-onde-alternate',
      'F3 step-rapidi-box',
      'F4 corda-battaglia-slam',
      'Z1 dead-hang',
      'Z2 apertura-anche',
      'Z3 respirazione-360',
    ]);

    expect(impronta('circuito-2')).toEqual([
      'A1 pike-pushup-piedi-rialzati',
      'A2 stacco-rumeno-manubri',
      'A3 rematore-inverso-trx',
      'B1 curl-manubri-supino',
      'B2 dip-panche-o-diamond-pushup',
      'B3 pallof-press-elastico',
      'F1 burpee',
      'F2 corda-per-saltare',
      'F3 affondi-rapidi-alternati',
      'F4 corda-battaglia-onde-doppie',
      'Z1 dead-hang',
      'Z2 apertura-anche',
      'Z3 respirazione-360',
    ]);

    expect(impronta('circuito-3')).toEqual([
      'A1 goblet-squat',
      'A2 push-up',
      'A3 pull-over-trx',
      'B1 curl-trx',
      'B2 estensione-tricipiti-trx',
      'B3 hollow-hold',
      'F1 kb-swing',
      'F2 mountain-climber',
      'F3 corda-battaglia-cerchi',
      'F4 step-rapidi-box',
      'Z1 dead-hang',
      'Z2 apertura-anche',
      'Z3 respirazione-360',
    ]);

    expect(impronta('circuito-4')).toEqual([
      'A1 hip-thrust-panca-bilaterale',
      'A2 rematore-manubrio-un-braccio',
      'A3 military-press-manubri',
      'B1 curl-panca-inclinata',
      'B2 dip-panche-piedi-rialzati',
      'B3 plank-trascinamento-kb',
      'F1 corda-battaglia-slam',
      'F2 jumping-jack',
      'F3 kb-swing',
      'F4 plank-tocco-spalla',
      'Z1 dead-hang',
      'Z2 apertura-anche',
      'Z3 respirazione-360',
    ]);
  });

  it('ha lo stesso riscaldamento in tutte e quattro', () => {
    /*
     * La scheda lo dice così: «come Seduta 1, con il giro di prova sul Tri-set
     * 1 di questa seduta». L'unica cosa che cambia è il contenuto del giro di
     * prova, e lo cambia `rampGroup` da sé. Prima qui c'erano quattro
     * riscaldamenti diversi, con lo swing tecnico e le scapole che
     * scomparivano da due sedute su quattro: era una variazione inventata.
     */
    const atteso = [
      'Corda da battaglia, onde alternate leggere',
      'Scapular pull-up',
      'Circonduzioni di spalla',
      'Swing con kettlebell 16 kg, tecnici',
      'Affondo con rotazione',
      'Giro di prova del Tri-set A',
    ];
    for (const session of CIRCUIT_SESSIONS) {
      expect((session.warmupSteps ?? []).map((passo) => passo.label), session.id).toEqual(atteso);
    }
  });

  it('tiene l’orologio della scheda, giro per giro', () => {
    /*
     * La scheda dà un orologio al minuto, e i giri sono la parte che non può
     * scostarsi: un giro del Tri-set A della Seduta 1 dura 4'35" perché è la
     * somma di 30" + 35" + 100" + 35" + 30" + 45", e se quella somma cambia
     * è cambiato un numero della scheda.
     *
     * È il test che ha trovato due errori veri: il raddoppio di `workSeconds`
     * sugli esercizi per lato (il bulgaro chiedeva 200 secondi invece di 100)
     * e i 90 secondi di pausa di blocco messi anche tra il Tri-set 2 e la
     * finitura, dove l'orologio originale non ha nessuna pausa.
     */
    const giri: Readonly<Record<string, readonly [number, number]>> = {
      /* [durata di un giro del Tri-set A, durata di un giro del Tri-set B] */
      'circuito-1': [275, 230],
      'circuito-2': [240, 230],
      'circuito-3': [255, 200],
      'circuito-4': [295, 230],
    };

    for (const [id, [attesoA, attesoB]] of Object.entries(giri)) {
      const session = findCircuitSession(id);
      expect(session, id).toBeDefined();
      if (session === undefined) continue;
      const plan = buildGuidedPlan(session, 1);
      const offsets = clockOffsets(plan);

      const inizioGiro = (group: string, giro: number): number => {
        const i = plan.findIndex(
          (step) => step.kind === 'work' && step.group === group && step.step.setIndex === giro,
        );
        return offsets[i] ?? -1;
      };

      expect(inizioGiro('A', 2) - inizioGiro('A', 1), `${id}/A`).toBe(attesoA);
      expect(inizioGiro('A', 3) - inizioGiro('A', 2), `${id}/A`).toBe(attesoA);
      expect(inizioGiro('B', 2) - inizioGiro('B', 1), `${id}/B`).toBe(attesoB);
      expect(inizioGiro('B', 3) - inizioGiro('B', 2), `${id}/B`).toBe(attesoB);

      /* 90" tra i due tri-set nelle sedute di forza, 60" in quelle di volume. */
      const pausaDiBlocco = inizioGiro('B', 1) - (inizioGiro('A', 3) + attesoA - 45);
      expect(pausaDiBlocco, `${id}/pausa di blocco`).toBeGreaterThan(0);

      /*
       * Tra il Tri-set 2 e la finitura, la transizione della finitura: 15".
       *
       * È l'unico punto in cui l'app si scosta dall'orologio scritto della
       * scheda, che lì non ha nessun passo (PROGRAM_RULES R2). Nella Seduta 3
       * voleva dire passare da un hollow hold a cedimento a uno swing nello
       * stesso istante. Non una pausa di blocco: quindici secondi, gli stessi
       * che la finitura dà fra tutte le sue stazioni.
       */
      const ultimoB = plan.reduce(
        (acc, step, i) => (step.kind === 'work' && step.group === 'B' ? i : acc),
        -1,
      );
      const giunzione = plan[ultimoB + 1];
      expect(giunzione?.kind, `${id}/verso la finitura`).toBe('rest');
      expect(giunzione?.kind === 'rest' ? giunzione.tier : null, id).toBe('transizione');
      expect(giunzione?.kind === 'rest' ? giunzione.seconds : null, id).toBe(15);
      const dopo = plan[ultimoB + 2];
      expect(dopo?.kind === 'work' ? dopo.group : null, id).toBe('F');
    }
  });

  it('trova le sedute per id e non quelle archiviate', () => {
    expect(findCircuitSession('circuito-3')?.name).toBe('Seduta 3');
    expect(findCircuitSession('upper-a')).toBeUndefined();
  });
});

describe('volume settimanale del circuito per gruppo muscolare', () => {
  /**
   * Fotografia, non giudizio: serie primarie a peso pieno, secondarie a metà,
   * sulle quattro sedute di una settimana. Serve a far fallire il test quando
   * una modifica sposta il volume, così lo scostamento si vede subito invece
   * di scoprirlo dopo un mesociclo.
   */
  /*
   * La stessa funzione che usa la schermata Progressi. Prima qui c'era un
   * conteggio scritto a mano che escludeva la finitura, e `metrics.ts` ne
   * aveva un altro che la includeva: quadricipiti 6 nel test, 14 nell'app.
   */
  const volume = (): Record<MuscleGroup, number> =>
    Object.fromEntries(
      plannedVolumeByGroup(CIRCUIT_SESSIONS).map((entry) => [entry.group, entry.sets]),
    ) as Record<MuscleGroup, number>;

  it('corrisponde ai totali attesi', () => {
    /*
     * Questi numeri sono quelli della scheda originale, non quelli di una
     * scheda disegnata per starci dentro. Vanno letti come una misura, e due
     * di loro sono fuori dalla fascia di riferimento del metodo (16-20 serie
     * a settimana per gruppo) in modo che va deciso, non nascosto:
     *
     * - **Braccia 34,5**: molto sopra la fascia, ed e' voluto. E' la priorita'
     *   dichiarata, e un gruppo prioritario si allena sopra il mantenimento o
     *   non e' una priorita'. Sono otto stazioni dirette a settimana.
     * - **Core 16,5**: dentro la fascia. Una stazione di vita per seduta nel
     *   Tri-set 2, piu' il lavoro indiretto del goblet e del military press.
     * - **Dorsali 15**: appena sotto. Una stazione di tirata per seduta.
     * - **Spalle 13,5**: sotto, quasi tutto indiretto. Il deltoide laterale ha
     *   molta leva sulla silhouette e qui non ha nessuna stazione sua: le
     *   alzate laterali sono le due serie opzionali nel margine della Seduta 2.
     * - **Petto 9**: sotto. Dip nella prima seduta, push-up nella terza.
     * - **Femorali-glutei 9**: sotto. Stacco rumeno e hip thrust, uno a testa.
     * - **Quadricipiti 6**: il numero piu' basso, e il piu' discutibile. Due
     *   stazioni in tutta la settimana, il bulgaro e il goblet squat.
     *
     * Petto, femorali e quadricipiti sotto la fascia sono una conseguenza
     * della struttura: due tri-set da tre stazioni fanno sei stazioni di
     * lavoro per seduta, e tre delle sei vanno al blocco braccia-e-vita. Se la
     * priorita' resta quella dichiarata il prezzo e' questo; e' una domanda
     * per `training-designer`, aperta in `docs/SESSION_STATE.md`, non qualcosa
     * da correggere cambiando la scheda di nascosto.
     */
    expect(volume()).toEqual({
      braccia: 34.5,
      core: 16.5,
      dorsali: 15,
      spalle: 13.5,
      petto: 9,
      'femorali-glutei': 9,
      quadricipiti: 6,
      polpacci: 0,
    });
  });

  it('dichiara quali gruppi restano senza volume diretto', () => {
    /*
     * I polpacci sono a zero, e non per distrazione.
     *
     * Il calf monopodalico a 12-18 ripetizioni per lato costava sei minuti di
     * lavoro per seduta — in una scheda da quaranta minuti, un sesto del tempo
     * sul gruppo con meno leva sull'obiettivo dichiarato, che è vita e
     * braccia. Quei minuti sono andati ai quadricipiti, che lo Shadow lasciava
     * a 13 serie.
     *
     * Quello che resta ai polpacci è lavoro meccanico vero ma non contato come
     * volume: gli step rapidi al box e i jumping jack stanno nella finitura di
     * tutte e quattro le sedute. Non è mantenimento pieno, ed è una scelta da
     * rivedere se la misura del polpaccio scende.
     *
     * Questo test non è un permesso: è una dichiarazione. Un gruppo che
     * finisse a zero per sbaglio continua a far fallire la riga qui sotto.
     */
    const senzaVolumeDiretto: readonly MuscleGroup[] = ['polpacci'];
    for (const [gruppo, totale] of Object.entries(volume())) {
      if (senzaVolumeDiretto.includes(gruppo as MuscleGroup)) {
        expect(totale, gruppo).toBe(0);
        continue;
      }
      expect(totale, gruppo).toBeGreaterThan(0);
    }
  });
});

describe('note della variante legate al gradino', () => {
  it('la nota del box compare solo al gradino del box, quella dei declinati solo ai declinati', () => {
    const s1a1 = findCircuitSession('circuito-1')?.blocks.find((block) => block.code === 'A1');
    const s3a2 = findCircuitSession('circuito-3')?.blocks.find((block) => block.code === 'A2');
    if (s1a1 === undefined || s3a2 === undefined) throw new Error('blocchi mancanti');
    expect(variantNoteAt(s1a1, 1)).toMatch(/box/);
    expect(variantNoteAt(s1a1, 3)).toBeUndefined();
    expect(variantNoteAt(s3a2, 3)).toMatch(/Declinati/);
    expect(variantNoteAt(s3a2, 2)).toBeUndefined();
  });

  it('una nota senza gradino vale sempre', () => {
    const s1a2 = findCircuitSession('circuito-1')?.blocks.find((block) => block.code === 'A2');
    if (s1a2 === undefined) throw new Error('blocco mancante');
    expect(variantNoteAt(s1a2, 1)).toMatch(/racked/);
    expect(variantNoteAt(s1a2, null)).toMatch(/racked/);
  });
});

/*
 * L26: le note delle sedute contro la scheda.
 *
 * Il testo originale del circuito non è nel repository. Queste sono le note
 * della prima trascrizione (`f63c9f1`, 2026-11-09), copiate da lì e non
 * ricostruite: non sono una seconda trascrizione indipendente, quindi il
 * controllo contro il testo originale resta NON COPERTO finché non si
 * trascrive di nuovo dalla fonte.
 */
const NOTE_SCHEDA: Readonly<Record<string, string | null>> = {
  'circuito-1': 'A fine terzo giro del Tri-set A, dentro la pausa di blocco: 2 trazioni negative da 5" di eccentrica.',
  'circuito-2':
    'È la più corta delle quattro. I minuti di margine sono il posto giusto per 2 serie opzionali di alzate laterali (12-18, RIR 0-1, 30" tra le due), in coda al Tri-set B.',
  'circuito-3': null,
  'circuito-4':
    'È la più lunga delle quattro, per le due stazioni unilaterali del Tri-set A. Se sfori i 40 minuti togli 2 ripetizioni al rematore, non il recupero.',
};

describe('L26 · le note delle sedute', () => {
  it('1 · ogni nota è quella della scheda, salvo una deviazione dichiarata', () => {
    for (const session of CIRCUIT_SESSIONS) {
      expect(session.note ?? null, session.id).toBe(applicaDeviazioneNota(session.id, NOTE_SCHEDA[session.id] ?? null));
    }
  });

  it('2 · nessuna deviazione orfana', () => {
    for (const deviazione of DEVIAZIONI_NOTA) {
      expect(deviazione.scheda, deviazione.sessione).toBe(NOTE_SCHEDA[deviazione.sessione]);
    }
  });

  it('L26.4 · la seduta più corta è la 3, non la 2', () => {
    const durate = CIRCUIT_SESSIONS.map((s) => ({ id: s.id, secondi: estimatedSeconds(buildGuidedPlan(s, 1)) }));
    const corta = [...durate].sort((a, b) => a.secondi - b.secondi)[0];
    expect(corta?.id).toBe('circuito-3');
    expect(findCircuitSession('circuito-2')?.note ?? '').not.toContain('più corta');
  });

  it('21.13 · `recordActual` solo su Z1, e solo dove la regola lo ammette', () => {
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        const id = `${session.id}/${block.code}`;
        expect(block.recordActual === true, id).toBe(block.code === 'Z1');
        if (block.recordActual !== true) continue;
        expect(block.prescription.kind, id).toBe('seconds');
        if (block.prescription.kind === 'seconds') expect(block.prescription.min, id).toBe(block.prescription.max);
        expect(block.excludeFromReview, id).toBe(true);
        expect(block.perSide, id).toBe(false);
        expect(block.exercise, id).toBe('dead-hang');
      }
    }
  });

  it('20.9 · il motivo della deviazione del circuito 2 dice le durate vere, transizione fra i giri compresa', () => {
    /* Prima diceva 36:03 contro 36:40: R20 le ha allungate di 15″, e un numero scritto a mano resta indietro. */
    const mmss = (secondi: number): string =>
      `${String(Math.floor(secondi / 60))}:${String(secondi % 60).padStart(2, '0')}`;
    const durata = (id: string): number => {
      const sessione = findCircuitSession(id);
      if (sessione === undefined) throw new Error(id);
      return estimatedSeconds(buildGuidedPlan(sessione, 1));
    };
    const motivo = DEVIAZIONI_NOTA.find((d) => d.sessione === 'circuito-2')?.motivo ?? '';
    expect(motivo).toContain(`${mmss(durata('circuito-3'))} contro ${mmss(durata('circuito-2'))}`);
    expect(motivo).toContain('36:18 contro 36:55');
  });
});
