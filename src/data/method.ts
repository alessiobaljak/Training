import type { MotorPattern } from '../types/index.ts';

/**
 * Regole del metodo, trascritte dai fogli Istruzioni e Zavorra della scheda.
 *
 * Stanno qui e non nel motore perché sono dati della scheda: se la scheda
 * cambia si tocca questo file, non la logica.
 */

/* -------------------------------------------------------------------------- */
/* Range di lavoro                                                             */
/* -------------------------------------------------------------------------- */

/** Range minimo = 55% delle ripetizioni massime. */
export const REP_RANGE_MIN_FACTOR = 0.55;

/** Range massimo = 75% delle ripetizioni massime. */
export const REP_RANGE_MAX_FACTOR = 0.75;

/**
 * Oltre questa soglia di ripetizioni si allena la resistenza, non l'ipertrofia.
 * Serve all'avviso che accompagna la leva 1 quando resta ferma troppo a lungo.
 */
export const ENDURANCE_REP_THRESHOLD: Readonly<{ min: number; max: number }> = Object.freeze({
  min: 25,
  max: 30,
});

/* -------------------------------------------------------------------------- */
/* Avanzamento                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * La scheda usa due formulazioni per la stessa regola: "chiudi il massimo del
 * range" nei fogli Test_Livelli e Progressioni, "superi il massimo del range"
 * nei fogli Istruzioni e Zavorra.
 *
 * Il motore adotta "chiudi", cioè `ripetizioni >= massimo del range` su tutte
 * le serie: è la lettura del documento di specifica e la più conservativa,
 * perché "superi" richiederebbe di uscire dal range prescritto per avanzare.
 */
export const ADVANCEMENT_REQUIRES_REACHING_MAX = true;

/* -------------------------------------------------------------------------- */
/* Livello di partenza                                                         */
/* -------------------------------------------------------------------------- */

export type StartingLevelPolicy = 'program-default';

/**
 * Da dove viene il livello iniziale di ogni esercizio.
 *
 * La scheda ha una colonna "Livello di partenza calcolato", ma è testo scritto
 * a mano e in quattro righe su nove il numero dichiarato non è quello della
 * variante descritta sulla propria scala. Non è una regola utilizzabile e non
 * esiste alcuna formula da cui ricavarla.
 *
 * Scelta adottata: l'onboarding non calcola nulla e non chiede nulla in più.
 * Ogni esercizio parte dal proprio `defaultLevel` in exercises.ts, cioè dal
 * livello della variante che il programma prescrive. L'utente lo corregge a
 * mano dalla schermata dell'esercizio, e la correzione finisce nel log come
 * campo Variante/Livello.
 */
export const STARTING_LEVEL_POLICY: StartingLevelPolicy = 'program-default';

/* -------------------------------------------------------------------------- */
/* Riscaldamento e orari                                                       */
/* -------------------------------------------------------------------------- */

/** Riscaldamento: 4' generali + 4' di avvicinamento. */
export const WARMUP_MINUTES: Readonly<{ general: number; ramp: number }> = Object.freeze({
  general: 4,
  ramp: 4,
});

/** Serie di avvicinamento con la variante più facile, prima della prima serie di lavoro. */
export const WARMUP_RAMP_SETS = 2;

/**
 * Almeno 40 minuti tra la sveglia e il primo lavoro intenso su spalle e catena
 * posteriore. Vale solo per l'allenamento mattutino.
 */
export const MORNING_DELAY_MINUTES = 40;

/* -------------------------------------------------------------------------- */
/* Zavorra                                                                     */
/* -------------------------------------------------------------------------- */

/** Settimane 1-2: nessuna zavorra, l'app la blocca. Sbloccata dalla settimana 3. */
export const LOAD_UNLOCK_WEEK = 3;

/**
 * Gli esercizi a manubri su cui il manubrio successivo è la leva 5 (R10c-1,
 * D-19 deciso da Alessio il 2026-11-16).
 *
 * Solo i manubri del circuito: le kettlebell salgono di 4 kg, oltre il tetto
 * di +2,5 kg a settimana (S2). Goblet squat, stacco rumeno ed estensione dei
 * tricipiti restano fuori finché Alessio non dice se li fa con i manubri o
 * con la kettlebell.
 */
export const LEVA_MANUBRIO: ReadonlySet<string> = new Set([
  'curl-martello-manubri',
  'curl-manubri-supino',
  'curl-panca-inclinata',
  'military-press-manubri',
  'rematore-manubrio-un-braccio',
]);

export { LOAD_STEP_KG } from '../types/core.ts';

export interface LoadThreshold {
  /** Sopra questo numero di ripetizioni la zavorra è necessaria, non facoltativa. */
  readonly mandatoryAbove: number;
  /** Sotto questo numero la zavorra è sconsigliata: prima si sale di livello. */
  readonly discouragedBelow: number;
}

const THRESHOLDS: ReadonlyMap<MotorPattern, LoadThreshold> = new Map([
  ['vertical-pull', { mandatoryAbove: 15, discouragedBelow: 8 }],
  ['dip', { mandatoryAbove: 18, discouragedBelow: 10 }],
]);

/** `null` sugli schemi motori per cui la scheda non fissa soglie. */
export function getLoadThreshold(pattern: MotorPattern | null): LoadThreshold | null {
  if (pattern === null) return null;
  return THRESHOLDS.get(pattern) ?? null;
}

/**
 * Calibrazione della zavorra: il carico corretto riporta dentro 6-8 ripetizioni
 * con RIR 1. Sopra `increaseAtOrAbove` si aggiungono 2,5 kg, sotto
 * `decreaseAtOrBelow` se ne tolgono 2,5.
 */
export const LOAD_CALIBRATION = Object.freeze({
  targetReps: Object.freeze({ min: 6, max: 8 }),
  targetRir: 1,
  increaseAtOrAbove: 10,
  decreaseAtOrBelow: 4,
});

export interface LoadStartRow {
  /** Etichetta del foglio Zavorra, non uno slug: la tabella è generica. */
  readonly label: string;
  readonly maxReps: number;
  readonly suggestedKg: number;
}

/**
 * Tabella "Calcolatore - carico di partenza consigliato" del foglio Zavorra.
 * Tre righe scritte a mano, senza formula nel file originale.
 */
export const LOAD_START_TABLE: readonly LoadStartRow[] = Object.freeze([
  { label: 'Trazioni', maxReps: 15, suggestedKg: 5 },
  { label: 'Chin-up', maxReps: 17, suggestedKg: 7.5 },
  { label: 'Dip', maxReps: 18, suggestedKg: 7.5 },
]);

/**
 * Formula ricavata dalle tre righe della tabella: passa esattamente per tutte e
 * tre. Tre punti sono pochi per chiamarla legge, quindi il motore la usa solo
 * come *proposta* di partenza; da lì in poi comanda `LOAD_CALIBRATION`.
 *
 *     kg = 2,5 × round((massimale − 10) / 2,5)
 */
export const LOAD_START_BASELINE_REPS = 10;

/* -------------------------------------------------------------------------- */
/* Deltoide laterale                                                           */
/* -------------------------------------------------------------------------- */

/**
 * "Il deltoide laterale non esiste a corpo libero: gli elastici non sono
 * opzionali." Serve al testo che spiega perché le alzate laterali compaiono
 * tre volte a settimana e non si saltano.
 */
export const LATERAL_DELT_NOTE =
  'Il deltoide laterale non si allena a corpo libero. Le alzate con elastico non sono un accessorio opzionale: sono il solo lavoro diretto su quel muscolo in tutta la settimana.';
