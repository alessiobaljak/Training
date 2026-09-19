/**
 * Tipi di dominio trasversali.
 *
 * Regola generale del progetto: nessun `any` nei tipi di dominio.
 * Le notazioni testuali (TUT, RIR) sono modellate come union di stringhe
 * letterali, così la trascrizione della scheda resta letterale ma un refuso
 * diventa un errore di compilazione.
 */

/** Giorni della settimana, indice ISO (1 = lunedì … 7 = domenica). */
export type WeekdayIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAY_LABELS: Readonly<Record<WeekdayIndex, string>> = Object.freeze({
  1: 'Lunedì',
  2: 'Martedì',
  3: 'Mercoledì',
  4: 'Giovedì',
  5: 'Venerdì',
  6: 'Sabato',
  7: 'Domenica',
});

/* -------------------------------------------------------------------------- */
/* Schemi motori                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Gli schemi motori su cui è costruita la scala di progressione a 6 livelli.
 *
 * I primi otto vengono dal foglio Scale_Progressioni. Gli altri cinque sono
 * stati aggiunti dopo: il foglio prescriveva sei esercizi direttamente nella
 * loro forma avanzata — hip thrust monopodalico, single-leg RDL, i due calf a
 * una gamba, step-up su box alto, sissy squat libero — senza nessun gradino
 * più facile da cui partire. Chi non ha mai fatto la versione a due gambe non
 * aveva niente da cui salire, e nemmeno un livello da abbassare. Le cinque
 * scale nuove sono dichiarate in `SCALE_AGGIUNTE`.
 *
 * Gli accessori dove il carico è l'esercizio (manubri, elastici) restano fuori
 * da ogni schema: la loro progressione è il peso, e usano `null`.
 */
export type MotorPattern =
  | 'vertical-pull'
  | 'horizontal-pull'
  | 'horizontal-push'
  | 'vertical-push'
  | 'dip'
  | 'single-leg-squat'
  | 'posterior-chain'
  | 'core'
  | 'hip-thrust'
  | 'hip-hinge'
  | 'calf'
  | 'step-up'
  | 'sissy-squat'
  | 'handstand'
  | 'wall-sit'
  | 'hang';

export const MOTOR_PATTERNS: readonly MotorPattern[] = Object.freeze([
  'vertical-pull',
  'horizontal-pull',
  'horizontal-push',
  'vertical-push',
  'dip',
  'single-leg-squat',
  'posterior-chain',
  'core',
  'hip-thrust',
  'hip-hinge',
  'calf',
  'step-up',
  'sissy-squat',
  'handstand',
  'wall-sit',
  'hang',
] as const);

export const MOTOR_PATTERN_LABELS: Readonly<Record<MotorPattern, string>> = Object.freeze({
  'vertical-pull': 'Trazione verticale (dorsali)',
  'horizontal-pull': 'Trazione orizzontale (spessore)',
  'horizontal-push': 'Spinta orizzontale (petto)',
  'vertical-push': 'Spinta verticale (spalle)',
  dip: 'Dip (petto/tricipiti)',
  'single-leg-squat': 'Squat monopodalico (quadricipiti)',
  'posterior-chain': 'Catena posteriore (femorali)',
  core: 'Core',
  'hip-thrust': 'Estensione d’anca (glutei)',
  'hip-hinge': 'Hip hinge (femorali)',
  calf: 'Polpaccio',
  'step-up': 'Step-up (quadricipiti)',
  'sissy-squat': 'Sissy squat (quadricipiti)',
  handstand: 'Verticale (spalle)',
  'wall-sit': 'Wall sit (quadricipiti)',
  hang: 'Sospensione (presa)',
});

/** Livello nella scala di progressione. Sempre 1..6. */
export type LevelIndex = 1 | 2 | 3 | 4 | 5 | 6;

export const LEVEL_INDEXES: readonly LevelIndex[] = Object.freeze([1, 2, 3, 4, 5, 6] as const);

/* -------------------------------------------------------------------------- */
/* Gruppi muscolari (per il volume settimanale)                                */
/* -------------------------------------------------------------------------- */

/**
 * Raggruppamento usato solo per il conteggio del volume settimanale
 * (riferimento del metodo: 16-20 serie a settimana per gruppo).
 */
export type MuscleGroup =
  | 'dorsali'
  | 'petto'
  | 'spalle'
  | 'braccia'
  | 'quadricipiti'
  | 'femorali-glutei'
  | 'polpacci'
  | 'core';

export const MUSCLE_GROUPS: readonly MuscleGroup[] = Object.freeze([
  'dorsali',
  'petto',
  'spalle',
  'braccia',
  'quadricipiti',
  'femorali-glutei',
  'polpacci',
  'core',
] as const);

export const MUSCLE_GROUP_LABELS: Readonly<Record<MuscleGroup, string>> = Object.freeze({
  dorsali: 'Dorsali',
  petto: 'Petto',
  spalle: 'Spalle',
  braccia: 'Braccia',
  quadricipiti: 'Quadricipiti',
  'femorali-glutei': 'Femorali e glutei',
  polpacci: 'Polpacci',
  core: 'Core',
});

/** Riferimento del metodo per il volume settimanale per gruppo muscolare. */
export const WEEKLY_SET_TARGET: Readonly<{ min: number; max: number }> = Object.freeze({
  min: 16,
  max: 20,
});

/**
 * Peso di una serie sul gruppo muscolare secondario.
 * Una trazione è una serie piena di dorsali e mezza serie di bicipiti.
 */
export const SECONDARY_SET_WEIGHT = 0.5;

/* -------------------------------------------------------------------------- */
/* TUT — tempo sotto tensione                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Notazione TUT: eccentrica - pausa in basso - concentrica - pausa in alto,
 * in secondi. `X` = esplosivo.
 */
export type TempoDigit = '0' | '1' | '2' | '3' | '4' | '5' | 'X';

export type TempoNotation = `${TempoDigit}-${TempoDigit}-${TempoDigit}-${TempoDigit}`;

/** Valore della colonna TUT così come compare nella scheda. */
export type TutNotation = TempoNotation | 'controllato' | 'isometrico' | '—';

/** Durata di una fase del tempo: secondi, oppure esplosiva. */
export type TempoPhase = number | 'X';

export interface TempoBreakdown {
  readonly kind: 'tempo';
  /** Fase eccentrica (discesa/allungamento). */
  readonly eccentric: TempoPhase;
  /** Pausa nel punto di massimo allungamento. */
  readonly bottomPause: TempoPhase;
  /** Fase concentrica (risalita/accorciamento). */
  readonly concentric: TempoPhase;
  /** Pausa nel punto di massimo accorciamento. */
  readonly topPause: TempoPhase;
}

export type Tut =
  | TempoBreakdown
  | { readonly kind: 'controlled' }
  | { readonly kind: 'isometric' }
  | { readonly kind: 'none' };

/* -------------------------------------------------------------------------- */
/* RIR — repetitions in reserve                                                */
/* -------------------------------------------------------------------------- */

export type RirNotation = '0' | '1' | '2' | '0-1' | '1-2' | '—';

export interface RirTarget {
  readonly min: number;
  readonly max: number;
}

/* -------------------------------------------------------------------------- */
/* Misurazione e zavorra                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Come si registra una serie di questo esercizio.
 * - `reps`     → contatore di ripetizioni
 * - `seconds`  → cronometro (isometrie: hollow hold, dead hang, skill)
 * - `duration` → attività a durata in minuti (zona 2, mobilità, warm-up)
 */
export type MeasurementKind = 'reps' | 'seconds' | 'duration';

/**
 * Politica zavorra. Il metodo elenca in modo esplicito su quali esercizi la
 * zavorra è consentita; su tutto il resto il campo non deve nemmeno esistere.
 */
/**
 * Come sta il carico esterno su un esercizio.
 *
 * - `allowed`: esercizio a corpo libero su cui la zavorra è la quinta leva
 *   del sovraccarico, con i passi da 2,5 kg e le soglie del metodo.
 * - `forbidden`: a corpo libero e basta. Il sovraccarico passa da tempo,
 *   pause e variante.
 * - `inherent`: il peso è l'esercizio, non una leva. Un manubrio in mano si
 *   registra sempre, ma non è zavorra: non segue i passi da 2,5 kg e non
 *   entra nell'ordine delle leve. Senza questo terzo stato un'alzata laterale
 *   con i manubri costringeva a scegliere tra non poter scrivere il peso e
 *   far entrare la leva zavorra dove il metodo non la prevede.
 */
export type LoadPolicy = 'allowed' | 'forbidden' | 'inherent';

/** Incremento unico ammesso dal metodo. Lo stepper non propone altri valori. */
export const LOAD_STEP_KG = 2.5;
