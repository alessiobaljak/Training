import { describe, expect, it } from 'vitest';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise } from '../data/exercises.ts';
import { initialExerciseState, startingLevel } from './progression.ts';
import { reviewWeek } from './review.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedSession,
  TestId,
  TestResult,
} from '../types/index.ts';

/**
 * Le tre correzioni, verificate sul comportamento.
 *
 * Il difetto che le ha rese necessarie non era un errore di logica: era un
 * test che guardava la cosa sbagliata. `excludeFromReview` aveva una verifica
 * che controllava che il flag **fosse dichiarato** sui blocchi giusti, e
 * nessuna che controllasse che il motore lo **leggesse**. Il flag c'era, il
 * comportamento no, e la copertura diceva verde.
 *
 * Qui si parte sempre dall'uscita: cosa dice l'app all'atleta.
 */

const massimale = (testId: TestId, value: number): readonly [TestId, TestResult] => [
  testId,
  { testId, date: '2026-01-05', week: 0, value, left: null, right: null },
];

function seduta(
  sessionId: LoggedSession['sessionId'],
  esercizi: LoggedSession['exercises'],
  date = '2026-01-05',
  week = 1,
): LoggedSession {
  return {
    id: `${sessionId}-${date}`,
    date,
    week,
    sessionId,
    status: 'completed',
    exercises: esercizi,
    note: null,
  };
}

/*
 * R8: la revisione giudica le ultime due sedute di un esercizio nei 14 giorni
 * fino alla fine della settimana. Qui la stessa seduta lunedì 5 e lunedì 12
 * gennaio, e la revisione della settimana 2 aperta il lunedì dopo.
 */
const dueSettimane = (log: LoggedSession): LoggedSession[] => [
  log,
  { ...log, id: `${log.id}-bis`, date: '2026-01-12', week: 2 },
];
const FINESTRA = { week: 2, weekEnd: '2026-01-18', today: '2026-01-19' } as const;

describe('la finitura metabolica non riceve verdetti', () => {
  const circuito1 = CIRCUIT_SESSIONS[0];
  if (circuito1 === undefined) throw new Error('Seduta mancante.');
  const finitura = circuito1.blocks.find((block) => block.code === 'F3');
  if (finitura === undefined) throw new Error('Blocco F3 mancante.');

  const statiDi = (slug: ExerciseSlug): ReadonlyMap<ExerciseSlug, ExerciseState> =>
    new Map([[slug, initialExerciseState(getExercise(slug))]]);

  it('chiudere il massimo del range su una stazione di finitura non propone niente', () => {
    /*
     * Venti swing su tutte le serie producevano «passa al manubrio
     * successivo»: +2,5 kg su un balistico, deciso su numeri che dipendono da
     * quanto era dura la seduta fin lì — e su un kettlebell, che manubrio non
     * è.
     */
    const log = seduta('circuito-1', [
      {
        blockCode: 'F3',
        exercise: finitura.exercise,
        variantLabel: getExercise(finitura.exercise).name,
        level: null,
        tempoRespected: true,
        sets: [1, 2].map((setIndex) => ({
          setIndex,
          side: null,
          value: 20,
          rir: null,
          loadKg: 16,
          heartRate: null,
          note: null,
        })),
        note: null,
      },
    ]);

    const esito = reviewWeek({
      ...FINESTRA,
      sessions: dueSettimane(log),
      states: statiDi(finitura.exercise),
      tests: new Map(),
    });

    expect(esito.verdicts.map((v) => v.exercise)).not.toContain(finitura.exercise);
    expect(esito.alMassimo.map((voce) => voce.exercise)).not.toContain(finitura.exercise);
    expect(esito.pocheProve).toHaveLength(0);
    expect(esito.setsCounted).toBe(0);
  });

  it('fermarsi sotto il tempo su una stazione a durata fissa non propone niente', () => {
    /*
     * Le stazioni 30"-30" si chiudono a 28" quando il cue dice di fermarsi —
     * «la serie finisce quando la linea del corpo si rompe». Produceva
     * «range-da-rifare», il cui testo afferma che sei al gradino più basso
     * della scala: falso, quella scala non esiste.
     */
    const corda = circuito1.blocks.find((block) => block.code === 'F1');
    if (corda === undefined) throw new Error('Blocco F1 mancante.');
    const log = seduta('circuito-1', [
      {
        blockCode: 'F1',
        exercise: corda.exercise,
        variantLabel: getExercise(corda.exercise).name,
        level: null,
        tempoRespected: true,
        sets: [1, 2].map((setIndex) => ({
          setIndex,
          side: null,
          value: 28,
          rir: null,
          loadKg: 0,
          heartRate: null,
          note: null,
        })),
        note: null,
      },
    ]);

    const esito = reviewWeek({
      ...FINESTRA,
      sessions: dueSettimane(log),
      states: statiDi(corda.exercise),
      tests: new Map(),
    });
    expect(esito.verdicts).toHaveLength(0);
  });

  it('i blocchi di lavoro invece un verdetto lo ricevono', () => {
    /*
     * Il controspecchio: senza questo, disattivare la revisione per intero
     * passerebbe i due test qui sopra.
     */
    const lavoro = circuito1.blocks.find((block) => block.code === 'B3');
    if (lavoro === undefined) throw new Error('Blocco B3 mancante.');
    const log = seduta('circuito-1', [
      {
        blockCode: 'B3',
        exercise: lavoro.exercise,
        variantLabel: getExercise(lavoro.exercise).name,
        /* Allo stato su cui si giudica: numeri a un altro gradino non contano (R8). */
        level: initialExerciseState(getExercise(lavoro.exercise)).level,
        tempoRespected: true,
        sets: [1, 2, 3].map((setIndex) => ({
          setIndex,
          side: null,
          value: 25,
          rir: null,
          loadKg: 0,
          heartRate: null,
          note: null,
        })),
        note: null,
      },
    ]);

    const esito = reviewWeek({
      ...FINESTRA,
      sessions: dueSettimane(log),
      states: statiDi(lavoro.exercise),
      tests: new Map(),
    });
    expect(esito.setsCounted).toBe(6);
    expect(esito.pocheProve).toHaveLength(0);
    const giudicato = [
      ...esito.verdicts.map((voce) => voce.exercise),
      ...esito.alMassimo.map((voce) => voce.exercise),
      ...esito.inAttesa.map((voce) => voce.exercise),
      ...esito.fermi.map((voce) => voce.exercise),
    ];
    expect(giudicato).toContain(lavoro.exercise);
  });
});

describe('il gradino di partenza legge il risultato del test', () => {
  it('zero ripetizioni misurate vuol dire gradino 1', () => {
    /*
     * Il tetto era il gradino *dell'esercizio del test*, identico per
     * chiunque: chi chiudeva la Settimana 0 con zero trazioni, zero dip e
     * zero nordic si vedeva assegnare il gradino 3 — trazioni complete, dip
     * completi alle parallele, nordic eccentrico 5" — e gli servivano due
     * settimane di serie da zero ripetizioni per scendere.
     */
    const aZero = new Map([massimale('pull-up', 0), massimale('dip', 0)]);
    expect(startingLevel(getExercise('trazioni-prona-presa-media'), aZero)).toBe(1);
    expect(startingLevel(getExercise('dip-parallele-anelli'), aZero)).toBe(1);
    expect(initialExerciseState(getExercise('trazioni-prona-presa-media'), aZero).level).toBe(1);
  });

  it('un risultato sopra lo zero lascia il tetto del test', () => {
    /*
     * La mappatura completa valore → gradino è una regola di metodo e non è
     * stata scritta: qui c'è solo la parte inarguibile. Sopra lo zero il
     * comportamento resta quello di prima, e questo test lo fissa per far
     * fallire chi lo cambia senza passare dal metodo.
     */
    const conQuattro = new Map([massimale('pull-up', 4)]);
    const tetto = startingLevel(getExercise('trazioni-prona-presa-media'), new Map());
    expect(startingLevel(getExercise('trazioni-prona-presa-media'), conQuattro)).toBe(tetto);
  });

  it('senza massimali non inventa niente', () => {
    const senza = startingLevel(getExercise('trazioni-prona-presa-media'), new Map());
    expect(senza).not.toBeNull();
    expect(senza).toBeGreaterThan(0);
  });
});
