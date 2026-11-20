import type { LevelIndex } from './core.ts';
import type { ExerciseSlug } from './exercise.ts';
import type { SessionId } from './program.ts';
import type { TestId } from './test.ts';

/** Lato di un esercizio unilaterale. */
export type Side = 'left' | 'right';

/* -------------------------------------------------------------------------- */
/* Serie registrate                                                            */
/* -------------------------------------------------------------------------- */

export interface LoggedSet {
  /** Numero della serie, a partire da 1. */
  readonly setIndex: number;
  /** `null` quando il blocco non è per lato. */
  readonly side: Side | null;
  /**
   * Ripetizioni, oppure secondi per le isometrie.
   * L'unità la decide `Exercise.measurement`, non questo campo.
   */
  readonly value: number;
  readonly rir: number | null;
  /** Sempre presente, vale 0 quando non si usa zavorra. */
  readonly loadKg: number;
  /**
   * Frequenza cardiaca media, in battiti al minuto.
   * Riguarda solo le attività a durata: la zona 2 del mercoledì e quella
   * conclusiva del sabato si giudicano dalla FC, non dalle ripetizioni.
   */
  readonly heartRate: number | null;
  readonly note: string | null;
}

export interface LoggedExercise {
  readonly blockCode: string;
  readonly exercise: ExerciseSlug;
  /**
   * Campo "Variante / Livello" del foglio Log. Obbligatorio: senza, il
   * confronto tra settimane non ha significato.
   */
  readonly variantLabel: string;
  readonly level: LevelIndex | null;
  /**
   * Il tempo prescritto è stato rispettato su tutte le serie.
   *
   * La regola di avanzamento del metodo chiede di chiudere il massimo del
   * range "mantenendo il tempo prescritto": senza questo dato la condizione
   * non è valutabile. È l'unico campo che l'app aggiunge alla scheda.
   */
  readonly tempoRespected: boolean | null;
  readonly sets: readonly LoggedSet[];
  readonly note: string | null;
}

export type SessionStatus = 'in-progress' | 'completed' | 'abandoned';

export interface LoggedSession {
  readonly id: string;
  /** Data in formato YYYY-MM-DD. */
  readonly date: string;
  /** Settimana del mesociclo, a partire da 1. */
  readonly week: number;
  readonly sessionId: SessionId;
  readonly status: SessionStatus;
  readonly exercises: readonly LoggedExercise[];
  readonly note: string | null;
  /**
   * Quando la seduta e' cominciata e quando e' stata chiusa, come istanti ISO.
   *
   * Servono a due cose che la sola data non sa dire: quanto e' durata davvero
   * — la scheda da' un orologio al minuto, e senza la durata vera non c'e'
   * modo di sapere se lo si sta rispettando — e, durante la seduta, quanto si
   * e' avanti o indietro rispetto al piano. Opzionali: le sedute scritte prima
   * non li hanno, e una seduta senza durata resta una seduta.
   */
  readonly startedAt?: string | null;
  readonly completedAt?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Risultati dei test                                                          */
/* -------------------------------------------------------------------------- */

export interface TestResult {
  readonly testId: TestId;
  /** Data in formato YYYY-MM-DD. */
  readonly date: string;
  /** 0 per la Settimana 0, poi 6 e 12 per i ritest. */
  readonly week: number;
  /**
   * Massimale usato per calcolare il range.
   * Sui test per lato è il valore del lato **più debole**: si programma sul
   * lato che regge meno, così il lato forte resta appena sotto invece che il
   * lato debole sopra.
   */
  readonly value: number;
  /** Solo per i test per lato, altrimenti `null`. */
  readonly left: number | null;
  readonly right: number | null;
}

/* -------------------------------------------------------------------------- */
/* Stato di avanzamento per esercizio                                          */
/* -------------------------------------------------------------------------- */

/**
 * Stato delle leve del sovraccarico per un esercizio.
 *
 * Tempo e pause sono memorizzati come *bonus* rispetto a quanto prescrive il
 * blocco, non come valori assoluti: lo stesso esercizio compare in blocchi con
 * TUT diversi (le alzate laterali hanno 2-0-1-1 il lunedì e 2-0-1-0 il
 * giovedì) e un valore assoluto ne sovrascriverebbe uno dei due.
 */
export interface ExerciseState {
  readonly exercise: ExerciseSlug;
  /** Livello attuale nella scala, `null` fuori dalle scale. */
  readonly level: LevelIndex | null;
  /** Secondi aggiunti all'eccentrica prescritta. 0, 1 o 2. */
  readonly eccentricBonusSeconds: number;
  /** Secondi aggiunti alla pausa in basso prescritta. 0, 1 o 2. */
  readonly bottomPauseBonusSeconds: number;
  /** Zavorra attualmente in uso, in kg. */
  readonly loadKg: number;
}

/**
 * Una scelta registrata su una leva, a fine seduta o nella revisione.
 *
 * È il registro che R10b e R13 leggono: chi ha accettato cosa e quando. Una
 * `SuggestionRecord` del database lo soddisfa così com'è.
 */
export interface DecisioneRegistrata {
  readonly date: string;
  readonly exercise: ExerciseSlug;
  /** `lapsed`: una scelta accettata e non eseguita, tolta (R14). */
  readonly decision: 'accepted' | 'postponed' | 'lapsed';
  readonly stateBefore: ExerciseState;
  readonly stateAfter: ExerciseState;
  /** La seduta in cui è nata, o la chiave della revisione. */
  readonly sessionLogId?: string;
  readonly id?: string;
  /** Solo per `lapsed`: l'id della scelta tolta. */
  readonly ref?: string;
}

/* -------------------------------------------------------------------------- */
/* Misure                                                                      */
/* -------------------------------------------------------------------------- */

export interface WeightEntry {
  /** Data in formato YYYY-MM-DD. */
  readonly date: string;
  readonly kg: number;
}

export interface WaistEntry {
  /** Data in formato YYYY-MM-DD. */
  readonly date: string;
  readonly cm: number;
}
