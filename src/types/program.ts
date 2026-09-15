import type { RirNotation, TutNotation, WeekdayIndex } from './core.ts';
import type { ExerciseSlug } from './exercise.ts';
import type { TestId } from './test.ts';

/** Le 6 sedute settimanali. La domenica non ha seduta. */
export type SessionId = 'upper-a' | 'lower-a' | 'zona-2' | 'upper-b' | 'lower-b' | 'shadow';

/**
 * `strength` usa il player a serie/ripetizioni.
 * `cardio` usa un player diverso: cronometro, durata effettiva, FC media.
 */
export type SessionKind = 'strength' | 'cardio';

/**
 * `superset` = blocchi accoppiati (A1/A2, B1/B2…): 15-20" per spostarsi tra i
 * due esercizi, poi il recupero lungo prima di ricominciare il giro.
 * `single` = lettera singola: il tempo indicato è tra le serie.
 */
export type BlockPairing = 'superset' | 'single';

/* -------------------------------------------------------------------------- */
/* Prescrizione del carico di lavoro                                           */
/* -------------------------------------------------------------------------- */

export type Prescription =
  /** Range di ripetizioni fissato dalla scheda, es. 15-20. */
  | { readonly kind: 'reps'; readonly min: number; readonly max: number }
  /**
   * Range calcolato dal massimale di un test.
   * `offset` sposta entrambi gli estremi del range (es. "range test −2").
   */
  | { readonly kind: 'reps-from-test'; readonly testId: TestId; readonly offset: number }
  /** Range in secondi, es. 30-45" della skill del sabato. */
  | { readonly kind: 'seconds'; readonly min: number; readonly max: number }
  /** "max": a cedimento. L'unità la decide il `measurement` dell'esercizio. */
  | { readonly kind: 'max' }
  /** Cluster myo-reps: serie di attivazione, poi mini-serie. */
  | {
      readonly kind: 'myo-reps';
      readonly activationReps: number;
      readonly miniSets: number;
      readonly miniSetReps: number;
    }
  /** Attività a durata: zona 2, warm-up, mobilità. */
  | { readonly kind: 'duration'; readonly minMinutes: number; readonly maxMinutes: number };

/* -------------------------------------------------------------------------- */
/* Recupero                                                                    */
/* -------------------------------------------------------------------------- */

export type RestPrescription =
  /**
   * Blocco accoppiato: `transition*` è il tempo per passare all'altro
   * esercizio, `roundRestSec` è il recupero prima di ricominciare il giro.
   */
  | {
      readonly kind: 'superset';
      readonly transitionMinSec: number;
      readonly transitionMaxSec: number;
      readonly roundRestSec: number;
    }
  /** Esercizio isolato: il tempo indicato è tra le serie. */
  | { readonly kind: 'straight'; readonly restSec: number }
  /** Cluster: pausa tra le mini-serie. */
  | { readonly kind: 'cluster'; readonly restSec: number }
  /** Nessun recupero previsto dalla scheda. */
  | { readonly kind: 'none' };

/* -------------------------------------------------------------------------- */
/* Blocchi e sedute                                                            */
/* -------------------------------------------------------------------------- */

/**
 * La seconda scelta prevista dalla scheda per lo stesso blocco.
 *
 * Non è una variante di difficoltà — quella passa da `ExerciseState.level` —
 * ma un esercizio diverso, con la sua misura e la sua prescrizione. Serve
 * dove la scheda scrive «X o Y» e i due si registrano in modo diverso: il
 * C2 del Lower A offre sissy squat a ripetizioni oppure wall sit a secondi,
 * e un solo `measurement` non poteva descriverli entrambi.
 */
export interface BlockAlternative {
  readonly exercise: ExerciseSlug;
  readonly prescription: Prescription;
}

export interface ProgramBlock {
  /** Codice come in scheda: 'A1', 'A2', 'B1', 'A', 'W', 'F'… */
  readonly code: string;
  /** Lettera del blocco, chiave di accoppiamento delle superserie. */
  readonly group: string;
  readonly pairing: BlockPairing;
  readonly exercise: ExerciseSlug;
  /** Serie previste in settimana normale. Il deload le dimezza. */
  readonly sets: number;
  readonly prescription: Prescription;
  /** Colonna "Riferimento" della scheda, testuale. */
  readonly reference: string;
  readonly tut: TutNotation;
  readonly rir: RirNotation;
  readonly rest: RestPrescription;
  /** `true` quando la scheda scrive "per gamba" / "per lato" nella colonna Rip. */
  readonly perSide: boolean;
  /** Precisazione della scheda sulla variante da usare in questo blocco. */
  readonly variantNote?: string;
  /** L'altro esercizio che la scheda ammette qui, quando ce n'è uno. */
  readonly alternative?: BlockAlternative;
}

export interface ProgramSession {
  readonly id: SessionId;
  readonly weekday: WeekdayIndex;
  /** Nome breve, es. "Upper A". */
  readonly name: string;
  /** Sottotitolo, es. "spinta dominante". */
  readonly focus: string;
  readonly kind: SessionKind;
  /** Durata stimata in minuti, dalla scheda. */
  readonly estimatedMinutes: number;
  readonly warmup: readonly string[];
  readonly note?: string;
  readonly blocks: readonly ProgramBlock[];
}
