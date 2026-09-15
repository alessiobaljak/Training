import {
  LOAD_CALIBRATION,
  LOAD_START_BASELINE_REPS,
  LOAD_STEP_KG,
  LOAD_UNLOCK_WEEK,
  getLoadThreshold,
} from '../data/method.ts';
import type { Exercise, LoggedSet } from '../types/index.ts';

/**
 * Regole della zavorra.
 *
 * Due vincoli non negoziabili attraversano tutto il file: la zavorra non
 * esiste prima della settimana 3, e non esiste affatto sugli esercizi fuori
 * dalla whitelist del metodo. Su quelli il campo non va nemmeno renderizzato.
 *
 * «Bloccata» però vuol dire due cose diverse, e confonderle rendeva il diario
 * falso: il metodo vieta di *aggiungere* peso nelle prime due settimane, non
 * di *scrivere* il peso che si è usato. Chi fa il Bulgarian split squat con i
 * manubri in settimana 1 deve poterlo registrare, altrimenti il log dice che
 * l'ha fatto a corpo libero e la settimana 3 non ha un punto di partenza.
 * Da qui i due campi distinti: `allowed` è la leva, `recordable` è il campo.
 */

export type LoadBlockReason = 'forbidden-exercise' | 'locked-week' | null;

export interface LoadAvailability {
  /** La zavorra può essere usata come leva di sovraccarico. */
  readonly allowed: boolean;
  /** Il peso usato può essere scritto nel diario, anche se non è una leva. */
  readonly recordable: boolean;
  readonly reason: LoadBlockReason;
  /** Spiegazione da mostrare accanto al campo. `null` quando non serve. */
  readonly explanation: string | null;
}

export function getLoadAvailability(exercise: Exercise, week: number): LoadAvailability {
  if (exercise.loadPolicy === 'inherent') {
    // Il peso va scritto sempre: è l'esercizio, non un sovraccarico aggiunto.
    return { allowed: true, recordable: true, reason: null, explanation: null };
  }
  if (exercise.loadPolicy === 'forbidden') {
    return {
      allowed: false,
      recordable: false,
      reason: 'forbidden-exercise',
      explanation:
        'Su questo esercizio la zavorra non si usa mai. Il sovraccarico passa dal tempo, dalle pause e dalla variante.',
    };
  }
  if (week < LOAD_UNLOCK_WEEK) {
    return {
      allowed: false,
      recordable: true,
      reason: 'locked-week',
      explanation: `Scrivi pure il peso che usi: fino alla settimana ${String(LOAD_UNLOCK_WEEK)} però non è una leva, non si aumenta. Le prime due settimane servono a ricostruire lo schema motorio e a validare i massimali del test.`,
    };
  }
  return { allowed: true, recordable: true, reason: null, explanation: null };
}

/* -------------------------------------------------------------------------- */
/* Incrementi                                                                  */
/* -------------------------------------------------------------------------- */

/** Somma un passo di 2,5 kg. Non scende mai sotto zero. */
export function stepLoad(currentKg: number, direction: 1 | -1): number {
  const next = currentKg + direction * LOAD_STEP_KG;
  return Math.max(0, Math.round(next * 10) / 10);
}

/** `true` solo per i multipli esatti di 2,5 kg, zero compreso. */
export function isValidLoad(kg: number): boolean {
  if (!Number.isFinite(kg) || kg < 0) return false;
  return Math.abs(Math.round(kg / LOAD_STEP_KG) * LOAD_STEP_KG - kg) < 1e-9;
}

/**
 * Carico di partenza suggerito, dalla tabella del foglio Zavorra:
 * 2,5 × round((massimale − 10) / 2,5). Passa per tutte e tre le righe del
 * calcolatore originale, ma resta una proposta: da lì in poi comanda la
 * calibrazione sulle ripetizioni effettive.
 */
export function suggestStartingLoad(maxReps: number): number {
  if (!Number.isFinite(maxReps) || maxReps <= LOAD_START_BASELINE_REPS) return 0;
  const steps = Math.round((maxReps - LOAD_START_BASELINE_REPS) / LOAD_STEP_KG);
  return Math.max(0, steps * LOAD_STEP_KG);
}

/* -------------------------------------------------------------------------- */
/* Soglie                                                                      */
/* -------------------------------------------------------------------------- */

export type LoadNeed = 'mandatory' | 'discouraged' | 'optional' | 'unknown';

export interface LoadNeedAssessment {
  readonly need: LoadNeed;
  readonly message: string | null;
}

/**
 * Sopra 15 trazioni o 18 dip la zavorra è necessaria, non facoltativa.
 * Sotto 8 trazioni o 10 dip è sconsigliata: prima si sale di livello.
 * Sugli altri schemi motori la scheda non fissa soglie.
 */
export function assessLoadNeed(exercise: Exercise, maxReps: number): LoadNeedAssessment {
  // `inherent` come `forbidden`: le soglie del metodo parlano di zavorra su
  // trazioni e dip, non di quanto pesa un manubrio.
  if (exercise.loadPolicy !== 'allowed') {
    return { need: 'unknown', message: null };
  }
  const threshold = getLoadThreshold(exercise.pattern);
  if (threshold === null) return { need: 'unknown', message: null };

  if (maxReps > threshold.mandatoryAbove) {
    return {
      need: 'mandatory',
      message: `Sopra ${String(threshold.mandatoryAbove)} ripetizioni la zavorra è necessaria, non facoltativa: senza, stai allenando la resistenza.`,
    };
  }
  if (maxReps < threshold.discouragedBelow) {
    return {
      need: 'discouraged',
      message: `Sotto ${String(threshold.discouragedBelow)} ripetizioni la zavorra è sconsigliata: hai ancora margine tecnico, sali prima di livello nella scala.`,
    };
  }
  return { need: 'optional', message: null };
}

/* -------------------------------------------------------------------------- */
/* Calibrazione                                                                */
/* -------------------------------------------------------------------------- */

export type LoadAdjustment = 'increase' | 'decrease' | 'hold';

export interface LoadCalibration {
  readonly adjustment: LoadAdjustment;
  readonly currentKg: number;
  readonly suggestedKg: number;
  /** Media delle ripetizioni sulle serie dell'esercizio. */
  readonly meanReps: number;
  /** Media dei RIR registrati, `null` se non ne è stato registrato nessuno. */
  readonly meanRir: number | null;
  readonly message: string | null;
}

/**
 * La zavorra corretta riporta dentro 6-8 ripetizioni con RIR 1.
 * Dieci ripetizioni o più: +2,5 kg. Quattro o meno: −2,5 kg.
 *
 * La media si calcola su tutte le serie dell'esercizio, non sull'ultima: la
 * serie finale è la più affaticata e da sola sposterebbe la decisione verso il
 * basso a ogni allenamento.
 */
export function calibrateLoad(sets: readonly LoggedSet[], currentKg: number): LoadCalibration | null {
  if (sets.length === 0) return null;

  const meanReps = Math.round(sets.reduce((sum, set) => sum + set.value, 0) / sets.length);
  const rirs = sets.map((set) => set.rir).filter((rir): rir is number => rir !== null);
  const meanRir =
    rirs.length === 0 ? null : Math.round((rirs.reduce((sum, rir) => sum + rir, 0) / rirs.length) * 10) / 10;

  if (meanReps >= LOAD_CALIBRATION.increaseAtOrAbove) {
    return {
      adjustment: 'increase',
      currentKg,
      suggestedKg: stepLoad(currentKg, 1),
      meanReps,
      meanRir,
      message: `Media di ${String(meanReps)} ripetizioni: il carico è troppo leggero. Aggiungi ${String(LOAD_STEP_KG)} kg per tornare dentro ${String(LOAD_CALIBRATION.targetReps.min)}-${String(LOAD_CALIBRATION.targetReps.max)}.`,
    };
  }
  if (meanReps <= LOAD_CALIBRATION.decreaseAtOrBelow) {
    return {
      adjustment: 'decrease',
      currentKg,
      suggestedKg: stepLoad(currentKg, -1),
      meanReps,
      meanRir,
      message: `Media di ${String(meanReps)} ripetizioni: il carico è troppo pesante. Togli ${String(LOAD_STEP_KG)} kg.`,
    };
  }
  return { adjustment: 'hold', currentKg, suggestedKg: currentKg, meanReps, meanRir, message: null };
}
