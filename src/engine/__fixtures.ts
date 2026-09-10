import type {
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  Side,
} from '../types/index.ts';

/** Costruttori usati solo dai test del motore. */

export function set(
  setIndex: number,
  value: number,
  options: { rir?: number | null; loadKg?: number; side?: Side | null } = {},
): LoggedSet {
  return {
    setIndex,
    side: options.side ?? null,
    value,
    rir: options.rir ?? null,
    loadKg: options.loadKg ?? 0,
    heartRate: null,
    note: null,
  };
}

/** Serie bilaterali con i valori indicati, una per elemento. */
export function sets(values: readonly number[], loadKg = 0): LoggedSet[] {
  return values.map((value, index) => set(index + 1, value, { loadKg }));
}

/** Serie per lato: una riga sinistra e una destra per ogni serie programmata. */
export function perSideSets(pairs: readonly (readonly [number, number])[]): LoggedSet[] {
  return pairs.flatMap(([left, right], index) => [
    set(index + 1, left, { side: 'left' }),
    set(index + 1, right, { side: 'right' }),
  ]);
}

export function loggedExercise(
  exercise: string,
  loggedSets: readonly LoggedSet[],
  options: { blockCode?: string; tempoRespected?: boolean; variantLabel?: string } = {},
): LoggedExercise {
  return {
    blockCode: options.blockCode ?? 'A1',
    exercise,
    variantLabel: options.variantLabel ?? 'Livello 3',
    level: 3,
    tempoRespected: options.tempoRespected ?? true,
    sets: [...loggedSets],
    note: null,
  };
}

export function loggedSession(
  date: string,
  week: number,
  exercises: readonly LoggedExercise[],
  status: LoggedSession['status'] = 'completed',
): LoggedSession {
  return {
    id: `${date}-${String(week)}`,
    date,
    week,
    sessionId: 'upper-a',
    status,
    exercises: [...exercises],
    note: null,
  };
}
