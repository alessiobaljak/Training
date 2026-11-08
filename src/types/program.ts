import type { RirNotation, TutNotation, WeekdayIndex } from './core.ts';
import type { ExerciseSlug } from './exercise.ts';
import type { TestId } from './test.ts';

/**
 * Le sedute, attive e archiviate.
 *
 * I primi quattro id sono il programma attivo: quattro circuiti che non hanno
 * un giorno assegnato. I sei successivi sono lo Shadow, archiviato — le loro
 * definizioni restano perche' il diario le cita e senza di loro lo storico di
 * sei settimane diventerebbe illeggibile.
 */
export type CircuitSessionId = 'circuito-1' | 'circuito-2' | 'circuito-3' | 'circuito-4';

export type ArchivedSessionId =
  | 'upper-a'
  | 'lower-a'
  | 'zona-2'
  | 'upper-b'
  | 'lower-b'
  | 'shadow';

export type SessionId = CircuitSessionId | ArchivedSessionId;

/**
 * `strength` usa il player a serie/ripetizioni.
 * `cardio` usa un player diverso: cronometro, durata effettiva, FC media.
 * `circuit` usa il player guidato: una sequenza sola dal riscaldamento alla
 * fine, con il countdown di esecuzione e quello di recupero che si alternano.
 */
export type SessionKind = 'strength' | 'cardio' | 'circuit';

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
      /**
       * Pausa di blocco: il recupero dopo l'ultimo giro, prima di passare al
       * blocco successivo.
       *
       * Nella scheda Shadow non esisteva — il recupero di giro serviva anche
       * da passaggio tra un blocco e l'altro. Nel circuito sono due cose
       * diverse e di durata diversa: 45" tra due giri dello stesso tri-set,
       * 90" tra due tri-set, perche' il secondo riparte da capo su muscoli
       * nuovi. Assente vuol dire «usa il recupero di giro», che e' il
       * comportamento di prima.
       */
      readonly blockRestSec?: number;
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
  /**
   * Durata **minima** della serie, in secondi.
   *
   * Non e' un tetto: e' il monito che la serie deve almeno durare quel tempo.
   * Su una stazione a tempo (30" di corda) coincide con la prescrizione. Su
   * una a ripetizioni e' il tempo che quelle ripetizioni richiedono se il TUT
   * viene rispettato — 8 ripetizioni a 3-0-1-0 sono 32 secondi, e chiuderle
   * in 18 vuol dire che il tempo non c'era. Assente, il motore lo calcola dal
   * TUT e dal minimo del range; dichiararlo serve dove il conto non torna o
   * dove la scheda fissa un tempo suo.
   */
  readonly workSeconds?: number;
  /**
   * Il blocco non entra nella revisione di fine settimana.
   *
   * Serve alla finitura metabolica, dove si va a massime ripetizioni su un
   * tempo fissato: li' il numero scritto dipende da quanto era dura la seduta
   * fin li', non dal gradino. La revisione lo leggerebbe come «sotto il range
   * su tutte le serie» e proporrebbe di scendere di livello su un esercizio
   * che non ha nessun problema.
   */
  readonly excludeFromReview?: boolean;
  /** `true` quando la scheda scrive "per gamba" / "per lato" nella colonna Rip. */
  readonly perSide: boolean;
  /** Precisazione della scheda sulla variante da usare in questo blocco. */
  readonly variantNote?: string;
  /**
   * Gli altri esercizi che la scheda ammette qui.
   *
   * Erano uno solo, poi la riga «Skill: hollow hold / L-sit / verticale al
   * muro» ne ha chiesti due: un titolo che nomina tre esercizi non dice quale
   * stai facendo, e ognuno dei tre ha il proprio storico.
   */
  readonly alternatives?: readonly BlockAlternative[];
}

/**
 * Un passo del riscaldamento.
 *
 * Nello Shadow il riscaldamento era testo libero: quattro righe da leggere e
 * spuntare a occhio. Nel circuito entra nella sequenza cronometrata come tutto
 * il resto, quindi ogni riga deve dire quanto dura o quante ripetizioni vuole.
 */
export interface WarmupStep {
  readonly label: string;
  /**
   * L'esercizio dell'anagrafica, quando il passo ne è uno.
   *
   * Senza, il player potrebbe solo scrivere l'etichetta: niente figura, niente
   * cue, niente scheda da aprire. Per un gesto come l'affondo con rotazione —
   * che si sbaglia in un modo preciso — è la differenza tra un riscaldamento e
   * una riga di testo.
   */
  readonly exercise?: ExerciseSlug;
  /** Durata della stazione. `null` quando il passo e' a ripetizioni. */
  readonly seconds: number | null;
  /** Ripetizioni del passo. `null` quando il passo e' a tempo. */
  readonly reps: number | null;
  /** `true` quando le ripetizioni sono per lato. */
  readonly perSide: boolean;
  /** Cosa guardare mentre lo si fa. */
  readonly hint: string;
}

export interface ProgramSession {
  readonly id: SessionId;
  /**
   * Giorno della settimana assegnato dal calendario.
   *
   * `null` nel programma attivo: i quattro circuiti si fanno quando si vuole,
   * nell'ordine in cui stanno, e la Home legge l'ultima seduta nel diario
   * invece del giorno di oggi. Resta valorizzato sulle sedute archiviate,
   * perche' lo Shadow era un calendario e il suo storico va letto come tale.
   */
  readonly weekday: WeekdayIndex | null;
  /** Nome breve, es. "Upper A". */
  readonly name: string;
  /** Sottotitolo, es. "spinta dominante". */
  readonly focus: string;
  readonly kind: SessionKind;
  /** Durata stimata in minuti, dalla scheda. */
  readonly estimatedMinutes: number;
  /** Riscaldamento come testo, nelle sedute archiviate. */
  readonly warmup: readonly string[];
  /** Riscaldamento come passi cronometrati, nelle sedute a circuito. */
  readonly warmupSteps?: readonly WarmupStep[];
  readonly note?: string;
  readonly blocks: readonly ProgramBlock[];
}
