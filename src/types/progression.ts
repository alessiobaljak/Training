import type { LevelIndex, MotorPattern } from './core.ts';

/** Un gradino della scala di progressione di uno schema motorio. */
export interface ProgressionStep {
  readonly level: LevelIndex;
  /** Identificatore stabile del gradino, indipendente dal nome mostrato. */
  readonly slug: string;
  /** Nome del gradino, in italiano, identico alla scheda. */
  readonly name: string;
  /**
   * Il gradino si esegue un lato per volta.
   *
   * Sta sul gradino e non sul blocco perché dentro la stessa scala convivono
   * gesti a due braccia e a un braccio: la trazione orizzontale passa dal
   * rematore a due mani al monobraccio al gradino 5. Scendendo dal monobraccio
   * al rematore a 45° l'app continuava a chiedere sinistra e destra.
   */
  readonly perSide: boolean;
  /**
   * Il gradino ha solo la fase eccentrica: si scende piano, non si risale.
   *
   * Trazioni negative, dip negativi, HSPU negative, nordic eccentrici. Su un
   * range fisso a ripetizioni con un tempo a quattro fasi questi gradini non
   * si possono eseguire come la scheda chiede — non c'è una concentrica da
   * fare in un secondo — quindi la progressione li salta e la partenza non
   * li assegna (PROGRAM_RULES R1, PROGRESSION §5).
   */
  readonly eccentricOnly: boolean;
}

/**
 * La tupla di 6 elementi non è decorativa: rende impossibile compilare una
 * scala con un numero di livelli diverso da 6.
 */
export type ProgressionSteps = readonly [
  ProgressionStep,
  ProgressionStep,
  ProgressionStep,
  ProgressionStep,
  ProgressionStep,
  ProgressionStep,
];

export interface ProgressionScale {
  readonly pattern: MotorPattern;
  readonly label: string;
  readonly steps: ProgressionSteps;
}

/* -------------------------------------------------------------------------- */
/* Le 5 leve del sovraccarico                                                  */
/* -------------------------------------------------------------------------- */

/**
 * L'ordine di questa union non è alfabetico né casuale: è l'ordine obbligato
 * in cui il metodo impone di esaurire le leve. `OVERLOAD_LEVERS` lo fissa e i
 * test lo verificano.
 */
export type OverloadLever =
  /** 1. Più ripetizioni, dentro il range, stessa variante, stesso tempo. */
  | 'reps'
  /** 2. Tempo più lento: eccentrica 3" → 4" → 5". */
  | 'tempo'
  /** 3. Pause isometriche 1-2" nel punto di massimo allungamento. */
  | 'iso-pause'
  /** 4. Variante più difficile: si sale di livello nella scala. */
  | 'variant'
  /** 5. Zavorra. */
  | 'load';

export const OVERLOAD_LEVERS: readonly OverloadLever[] = Object.freeze([
  'reps',
  'tempo',
  'iso-pause',
  'variant',
  'load',
] as const);

export const OVERLOAD_LEVER_LABELS: Readonly<Record<OverloadLever, string>> = Object.freeze({
  reps: 'Più ripetizioni',
  tempo: 'Tempo più lento',
  'iso-pause': 'Pause isometriche',
  variant: 'Variante più difficile',
  load: 'Zavorra',
});

/** Scaletta della leva "tempo": eccentrica da 3" a 4" a 5". */
export const ECCENTRIC_TEMPO_LADDER: readonly number[] = Object.freeze([3, 4, 5] as const);

/** Scaletta della leva "pause isometriche": 1" poi 2" in massimo allungamento. */
export const ISO_PAUSE_LADDER: readonly number[] = Object.freeze([1, 2] as const);

/**
 * Salendo di variante è normale e corretto perdere il 30-40% delle ripetizioni
 * e ripartire dal minimo del range. Serve al testo dell'avviso, non a un calcolo.
 */
export const VARIANT_JUMP_REP_LOSS: Readonly<{ min: number; max: number }> = Object.freeze({
  min: 0.3,
  max: 0.4,
});
