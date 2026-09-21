import type { LevelIndex, LoadPolicy, MeasurementKind, MotorPattern, MuscleGroup } from './core.ts';

/** Identificatore stabile di un esercizio. Non cambia mai: è la chiave dello storico. */
export type ExerciseSlug = string;

/**
 * Anagrafica di un esercizio. È dato statico: nessun valore qui dipende
 * dall'utente. Livello attuale, video personale e storico stanno in IndexedDB.
 *
 * Nota: se un esercizio si registra per lato lo dice il blocco del programma
 * (colonna "Rip" della scheda), non l'anagrafica. Una sola fonte di verità.
 */
export interface Exercise {
  readonly slug: ExerciseSlug;
  /**
   * Nome mostrato in UI, in italiano.
   *
   * **Un titolo, un esercizio.** Righe come «Dip tra due panche o diamond
   * push-up» sono due esercizi, non uno con un nome lungo: il titolo non dice
   * quale stai facendo, i cue valgono per metà, il disegno ne mostra uno solo
   * e lo storico li somma. Chi legge il titolo deve sapere cosa fare.
   *
   * Le varianti stanno in due posti, nessuno dei quali è il nome: i gradini
   * più facili e più difficili nella scala dello schema motorio, gli esercizi
   * diversi ammessi dalla stessa riga in `ProgramBlock.alternatives`. Un test
   * rifiuta qualunque nome che ne contenga due.
   */
  readonly name: string;
  /** Schema motorio di appartenenza, `null` per gli accessori fuori scala. */
  readonly pattern: MotorPattern | null;
  /**
   * Posizione di *default* nella scala del proprio schema motorio: il punto di
   * partenza suggerito, non lo stato dell'utente.
   * `null` quando l'esercizio non appartiene ad alcuna scala.
   */
  readonly defaultLevel: LevelIndex | null;
  /**
   * Gruppi muscolari su cui la serie conta per intero (volume diretto).
   * Può essere vuoto: il dead hang, per esempio, è lavoro di presa e non
   * costituisce volume diretto per nessun gruppo.
   */
  readonly primaryMuscles: readonly MuscleGroup[];
  /**
   * Gruppi muscolari su cui la serie conta a metà (volume indiretto).
   * Senza questa distinzione una trazione conterrebbe come una serie piena di
   * bicipiti e il conteggio settimanale diventerebbe inservibile.
   */
  readonly secondaryMuscles: readonly MuscleGroup[];
  /** Come si registra una serie: ripetizioni, secondi o minuti. */
  readonly measurement: MeasurementKind;
  /** Se `forbidden`, il campo zavorra non viene proprio renderizzato. */
  readonly loadPolicy: LoadPolicy;
  /**
   * Da 3 a 5 cue di esecuzione: setup, cosa fa il corpo, errore tipico,
   * criterio di ripetizione valida.
   */
  readonly cues: readonly string[];
  /**
   * Query di ricerca in inglese usata per aprire YouTube.
   * NON è un URL: l'app compone `youtube.com/results?search_query=<query>`.
   * Nel codebase non esiste alcun URL di video hardcodato.
   */
  readonly videoQuery: string;
}
