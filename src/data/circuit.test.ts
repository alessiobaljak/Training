import { describe, expect, it } from 'vitest';
import { CIRCUIT_ORDER, CIRCUIT_SESSIONS, findCircuitSession, isCircuitSessionId } from './circuit.ts';
import { findExercise, getExercise } from './exercises.ts';
import { WEEK_ZERO_TESTS } from './tests.ts';
import { buildGuidedPlan, estimatedSeconds } from '../engine/circuit.ts';
import { MUSCLE_GROUPS, SECONDARY_SET_WEIGHT } from '../types/index.ts';
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
        /* O secondi o ripetizioni, mai nessuno dei due e mai tutti e due. */
        expect(
          (passo.seconds === null) !== (passo.reps === null),
          `${session.id}/${passo.label}`,
        ).toBe(true);
        if (passo.exercise !== undefined) {
          expect(findExercise(passo.exercise), passo.exercise).toBeDefined();
        }
      }
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

  it('esclude dalla revisione solo la finitura metabolica', () => {
    /*
     * La finitura va a massime ripetizioni su un tempo fissato: il numero
     * dipende da quanto era dura la seduta fin lì, non dal gradino. Lasciarla
     * dentro farebbe proporre «scendi di livello» su esercizi sani.
     */
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        expect(block.excludeFromReview ?? false, `${session.id}/${block.code}`).toBe(
          block.group === 'F',
        );
      }
    }
  });

  it('dà alle braccia un blocco in tutte e quattro le sedute', () => {
    /*
     * La priorità dichiarata è «braccia più grosse». Un gruppo prioritario che
     * compare una volta a settimana prende tre serie e un segnale di
     * progressione così rumoroso che una giornata storta costa una settimana
     * di dati. Qui sono dodici serie dirette a settimana per bicipite e per
     * tricipite, con un esercizio diverso ogni volta.
     */
    for (const session of CIRCUIT_SESSIONS) {
      const braccia = session.blocks.filter((block) => block.group === 'C');
      expect(braccia.length, session.id).toBe(2);
    }
    const esercizi = CIRCUIT_SESSIONS.flatMap((session) =>
      session.blocks.filter((block) => block.group === 'C').map((block) => block.exercise),
    );
    /* Otto stazioni di braccia: almeno sei esercizi diversi. */
    expect(new Set(esercizi).size).toBeGreaterThanOrEqual(6);
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
  const volume = (): Record<MuscleGroup, number> => {
    const totali = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((gruppo) => [gruppo, 0]));
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        /* La finitura è lavoro metabolico: non è volume di allenamento. */
        if (block.excludeFromReview === true) continue;
        const exercise = getExercise(block.exercise);
        for (const gruppo of exercise.primaryMuscles) {
          totali.set(gruppo, (totali.get(gruppo) ?? 0) + block.sets);
        }
        for (const gruppo of exercise.secondaryMuscles) {
          totali.set(gruppo, (totali.get(gruppo) ?? 0) + block.sets * SECONDARY_SET_WEIGHT);
        }
      }
    }
    return Object.fromEntries(totali) as Record<MuscleGroup, number>;
  };

  it('corrisponde ai totali attesi', () => {
    /*
     * Lettura del risultato, rispetto al riferimento del metodo di 16-20 serie
     * a settimana per gruppo:
     *
     * - **Braccia 37,5**: quasi il doppio della fascia, ed è voluto. È la
     *   priorità dichiarata, e un gruppo prioritario si allena sopra la fascia
     *   di mantenimento o non è una priorità.
     * - **Dorsali 25,5**: sopra, per via del volume indiretto delle trazioni e
     *   dei rematori che portano anche le braccia.
     * - **Spalle 20**: in cima alla fascia. Il deltoide laterale è il muscolo
     *   con più leva sulla silhouette, e il rapporto spalla-vita è il numero
     *   che si legge come «vita sottile».
     * - **Petto 15 e femorali-glutei 15**: appena sotto, cioè mantenimento. È
     *   quello che la priorità chiedeva.
     * - **Quadricipiti 18**: dentro la fascia, e saliti rispetto allo Shadow,
     *   che li lasciava a 13.
     */
    expect(volume()).toEqual({
      braccia: 37.5,
      dorsali: 25.5,
      spalle: 20,
      quadricipiti: 18,
      petto: 15,
      'femorali-glutei': 15,
      core: 14,
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
