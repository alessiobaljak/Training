import type { LevelIndex, LoadPolicy, MeasurementKind, MotorPattern, MuscleGroup } from './core.ts';

/** Identificatore stabile di un esercizio. Non cambia mai: è la chiave dello storico. */
export type ExerciseSlug = string;

/**
 * La seconda variante che la scheda offre nella stessa riga.
 *
 * Righe come «Dip tra due panche **o** diamond push-up» sono due esercizi, non
 * uno con un nome lungo. Finché l'app ne conosceva solo il primo, la seconda
 * metà della riga non esisteva: niente cue, niente disegno, niente da
 * scegliere. È il difetto che l'utente ha trovato sul blocco C2 del lunedì.
 */
export interface ExerciseAlternative {
  readonly name: string;
  readonly cues: readonly string[];
  readonly videoQuery: string;
}

/**
 * Anagrafica di un esercizio. È dato statico: nessun valore qui dipende
 * dall'utente. Livello attuale, video personale e storico stanno in IndexedDB.
 *
 * Nota: se un esercizio si registra per lato lo dice il blocco del programma
 * (colonna "Rip" della scheda), non l'anagrafica. Una sola fonte di verità.
 */
export interface Exercise {
  readonly slug: ExerciseSlug;
  /** Nome mostrato in UI, in italiano, identico alla scheda. */
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
  /**
   * La seconda variante della stessa riga, quando la scheda ne offre due.
   * `null` quando l'esercizio è uno solo. Un test verifica che ogni nome con
   * due varianti la dichiari.
   */
  readonly alternative: ExerciseAlternative | null;
}
