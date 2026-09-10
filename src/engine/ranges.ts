import { REP_RANGE_MAX_FACTOR, REP_RANGE_MIN_FACTOR } from '../data/method.ts';
import { WEEK_ZERO_TESTS } from '../data/tests.ts';
import type { Exercise, ProgramBlock, TestId, TestResult } from '../types/index.ts';

/**
 * Calcolo del range di lavoro.
 *
 *     rangeMin = round(massimale × 0,55)
 *     rangeMax = round(massimale × 0,75)
 *
 * L'arrotondamento è a metà per eccesso, come nella scheda: 10 massime danno
 * 6-8, non 5-8. `Math.round` in JavaScript si comporta già così sui positivi.
 */

export interface WorkRange {
  readonly min: number;
  readonly max: number;
}

export type RangeUnit = 'reps' | 'seconds';

export type RangePosition = 'under' | 'in' | 'over';

export type RangeResolution =
  | {
      readonly kind: 'range';
      readonly range: WorkRange;
      readonly unit: RangeUnit;
      /** `test` quando deriva da un massimale, `fixed` quando la scheda lo scrive. */
      readonly source: 'test' | 'fixed';
      readonly testId: TestId | null;
    }
  /** Il blocco dipende da un test che non è ancora stato eseguito. */
  | { readonly kind: 'missing-test'; readonly testId: TestId }
  /** Il blocco non ha un range: cedimento, cluster o attività a durata. */
  | { readonly kind: 'not-applicable'; readonly reason: string };

/**
 * Range vuoto. Un massimale di 0 non produce un range utilizzabile: significa
 * che a quel livello non si esegue nemmeno una ripetizione valida, e la
 * risposta corretta è scendere di livello, non allenarsi a zero.
 */
export const EMPTY_RANGE: WorkRange = Object.freeze({ min: 0, max: 0 });

export function computeWorkRange(maxValue: number): WorkRange {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return EMPTY_RANGE;
  const min = Math.max(1, Math.round(maxValue * REP_RANGE_MIN_FACTOR));
  const max = Math.max(min, Math.round(maxValue * REP_RANGE_MAX_FACTOR));
  return { min, max };
}

export function isUsableRange(range: WorkRange): boolean {
  return range.min >= 1 && range.max >= range.min;
}

/**
 * Sposta entrambi gli estremi del range, come fa la scheda con "range test −2".
 * Non scende mai sotto una ripetizione: un range negativo non vuol dire nulla.
 */
export function shiftRange(range: WorkRange, offset: number): WorkRange {
  if (!isUsableRange(range)) return range;
  if (offset === 0) return range;
  const min = Math.max(1, range.min + offset);
  const max = Math.max(min, range.max + offset);
  return { min, max };
}

export function classifyValue(value: number, range: WorkRange): RangePosition {
  if (value < range.min) return 'under';
  if (value > range.max) return 'over';
  return 'in';
}

export function formatRange(range: WorkRange, unit: RangeUnit): string {
  const suffix = unit === 'seconds' ? '"' : '';
  return range.min === range.max
    ? `${String(range.min)}${suffix}`
    : `${String(range.min)}-${String(range.max)}${suffix}`;
}

/* -------------------------------------------------------------------------- */
/* Risultati dei test                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Costruisce il risultato di un test per lato.
 *
 * Il massimale usato per il range è quello del lato **più debole**: si
 * programma sul lato che regge meno, così il lato forte resta appena sotto il
 * proprio range invece che il lato debole sopra il proprio.
 */
export function testResultPerSide(
  testId: TestId,
  date: string,
  week: number,
  left: number,
  right: number,
): TestResult {
  return { testId, date, week, value: Math.min(left, right), left, right };
}

export function testResultSingle(
  testId: TestId,
  date: string,
  week: number,
  value: number,
): TestResult {
  return { testId, date, week, value, left: null, right: null };
}

/** Ultimo risultato per ogni test: il più recente per data, poi per settimana. */
export function latestTestResults(
  results: readonly TestResult[],
): ReadonlyMap<TestId, TestResult> {
  const latest = new Map<TestId, TestResult>();
  for (const result of results) {
    const current = latest.get(result.testId);
    if (
      current === undefined ||
      result.date > current.date ||
      (result.date === current.date && result.week > current.week)
    ) {
      latest.set(result.testId, result);
    }
  }
  return latest;
}

/* -------------------------------------------------------------------------- */
/* Giri di test                                                                */
/* -------------------------------------------------------------------------- */

/**
 * I test svolti nello stesso giorno formano un giro.
 * Un giro è completo quando contiene tutti e nove i test: è la condizione che
 * sblocca il programma. Un test saltato si registra con valore 0, così il giro
 * resta completo e il range di quell'esercizio risulta inutilizzabile, che è
 * l'informazione corretta.
 */
export interface TestRound {
  readonly date: string;
  readonly week: number;
  readonly results: readonly TestResult[];
  readonly complete: boolean;
  readonly missing: readonly TestId[];
}

const ALL_TEST_IDS: readonly TestId[] = WEEK_ZERO_TESTS.map((test) => test.id);

export function testRounds(results: readonly TestResult[]): TestRound[] {
  const byDate = new Map<string, TestResult[]>();
  for (const result of results) {
    const bucket = byDate.get(result.date);
    if (bucket === undefined) byDate.set(result.date, [result]);
    else bucket.push(result);
  }

  return [...byDate.entries()]
    .map(([date, bucket]) => {
      const present = new Set(bucket.map((result) => result.testId));
      const missing = ALL_TEST_IDS.filter((id) => !present.has(id));
      return {
        date,
        week: Math.min(...bucket.map((result) => result.week)),
        results: [...bucket].sort(
          (a, b) => ALL_TEST_IDS.indexOf(a.testId) - ALL_TEST_IDS.indexOf(b.testId),
        ),
        complete: missing.length === 0,
        missing,
      };
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Ultimo giro completo. `null` finché la Settimana 0 non è chiusa. */
export function latestCompleteRound(results: readonly TestResult[]): TestRound | null {
  const complete = testRounds(results).filter((round) => round.complete);
  return complete.at(-1) ?? null;
}

/** Giro ancora aperto, da riprendere dove è stato lasciato. */
export function openRound(results: readonly TestResult[]): TestRound | null {
  const open = testRounds(results).filter((round) => !round.complete);
  return open.at(-1) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Risoluzione del range di un blocco                                          */
/* -------------------------------------------------------------------------- */

export function resolveBlockRange(
  block: ProgramBlock,
  exercise: Exercise,
  tests: ReadonlyMap<TestId, TestResult>,
): RangeResolution {
  const prescription = block.prescription;
  switch (prescription.kind) {
    case 'reps':
      return {
        kind: 'range',
        range: { min: prescription.min, max: prescription.max },
        unit: 'reps',
        source: 'fixed',
        testId: null,
      };
    case 'seconds':
      return {
        kind: 'range',
        range: { min: prescription.min, max: prescription.max },
        unit: 'seconds',
        source: 'fixed',
        testId: null,
      };
    case 'reps-from-test': {
      const result = tests.get(prescription.testId);
      if (result === undefined) return { kind: 'missing-test', testId: prescription.testId };
      const unit: RangeUnit = exercise.measurement === 'seconds' ? 'seconds' : 'reps';
      return {
        kind: 'range',
        range: shiftRange(computeWorkRange(result.value), prescription.offset),
        unit,
        source: 'test',
        testId: prescription.testId,
      };
    }
    case 'max':
      return { kind: 'not-applicable', reason: 'Serie a cedimento: non c’è un massimo da rispettare.' };
    case 'myo-reps':
      return {
        kind: 'not-applicable',
        reason: 'Cluster myo-reps: il conteggio è fissato dalla scheda, non da un range.',
      };
    case 'duration':
      return { kind: 'not-applicable', reason: 'Attività a durata: si misura in minuti.' };
  }
}
