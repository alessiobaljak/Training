import { describe, expect, it } from 'vitest';
import { TEST_REST_SECONDS, WEEK_ZERO_TESTS, getTest } from './tests.ts';
import { getExercise } from './exercises.ts';
import { applicaDeviazione } from './deviations.ts';

/** Seconda trascrizione, indipendente, della tabella dei test della Settimana 0. */
const EXPECTED: ReadonlyArray<
  readonly [label: string, plannedSets: number, measurement: 'reps' | 'seconds', perSide: boolean]
> = [
  ['Trazioni prona (pull-up)', 4, 'reps', false],
  ['Dip alle parallele o anelli', 4, 'reps', false],
  ['Piegamenti (push-up)', 4, 'reps', false],
  ['Rematore inverso TRX', 3, 'reps', false],
  ['Pike push-up piedi rialzati', 3, 'reps', false],
  ['Bulgarian split squat (per gamba)', 4, 'reps', true],
  ['Nordic curl — negative controllate', 4, 'reps', false],
  ['Hollow hold', 3, 'seconds', false],
  ['Dead hang', 2, 'seconds', false],
];

describe('tests.ts — i 9 test della Settimana 0', () => {
  it('sono nove, nell’ordine della scheda', () => {
    expect(WEEK_ZERO_TESTS).toHaveLength(9);
    expect(WEEK_ZERO_TESTS.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('corrisponde riga per riga alla tabella', () => {
    const actual = WEEK_ZERO_TESTS.map(
      (t) => [t.label, t.plannedSets, t.measurement, t.perSide] as const,
    );
    /* Un'etichetta cambiata rispetto alla scheda passa solo da una deviazione dichiarata (T-37). */
    expect(actual).toEqual(EXPECTED.map(([label, ...resto]) => [applicaDeviazione(label), ...resto]));
  });

  it('ha id unici e punta a esercizi esistenti', () => {
    const ids = WEEK_ZERO_TESTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const test of WEEK_ZERO_TESTS) {
      expect(() => getExercise(test.exercise), test.id).not.toThrow();
    }
  });

  it('misura in secondi hollow hold e dead hang, e solo quelli', () => {
    const isometrics = WEEK_ZERO_TESTS.filter((t) => t.measurement === 'seconds').map((t) => t.id);
    expect(isometrics).toEqual(['hollow-hold', 'dead-hang']);
  });

  it('coerenza fra misurazione del test e misurazione dell’esercizio', () => {
    for (const test of WEEK_ZERO_TESTS) {
      expect(getExercise(test.exercise).measurement, test.id).toBe(test.measurement);
    }
  });

  it('è per lato solo il bulgarian split squat', () => {
    const perSide = WEEK_ZERO_TESTS.filter((t) => t.perSide).map((t) => t.id);
    expect(perSide).toEqual(['bulgarian-split-squat']);
  });

  it('prevede 4-5 minuti di recupero tra un test e l’altro', () => {
    expect(TEST_REST_SECONDS).toEqual({ min: 240, max: 300 });
  });

  it('solleva su un test sconosciuto', () => {
    // @ts-expect-error: il tipo lo impedisce, il runtime deve comunque difendersi.
    expect(() => getTest('test-inventato')).toThrow(/sconosciuto/i);
  });
});
