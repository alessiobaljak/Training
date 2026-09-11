import Dexie, { type Table } from 'dexie';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedSession,
  OverloadLever,
  TestResult,
  WaistEntry,
  WeightEntry,
} from '../types/index.ts';

/**
 * IndexedDB via Dexie. Tutto quello che l'utente produce vive qui, sul suo
 * telefono, e non esce mai dal dispositivo: nessuna chiamata di rete, nessun
 * account, nessun cloud. L'unica via d'uscita è il backup JSON, che parte da
 * un gesto esplicito.
 */

export const DATABASE_NAME = 'shadow-calisthenics';

/** Versione del formato dei dati. La usa l'import del backup. */
export const DATA_VERSION = 1;

/* -------------------------------------------------------------------------- */
/* Righe memorizzate                                                           */
/* -------------------------------------------------------------------------- */

export interface AppSettings {
  /** Riga unica. */
  readonly id: 'app';
  /**
   * Data di inizio del programma, YYYY-MM-DD.
   * `null` finché la Settimana 0 non è chiusa: senza test l'app non propone
   * un programma pieno di numeri finti.
   */
  readonly programStartDate: string | null;
  readonly dataVersion: number;
  /**
   * Quando è stato preso l'ultimo backup, in ISO.
   * La Home lo mostra come numero di giorni: senza quel promemoria il backup
   * manuale non lo fa nessuno, ed è l'unica rete di sicurezza che c'è.
   */
  readonly lastBackupAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const SETTINGS_ID = 'app';

/** Un risultato di test con la chiave primaria: un test per giorno. */
export interface StoredTestResult extends TestResult {
  /** `${testId}@${date}`. Rifare lo stesso test lo stesso giorno sovrascrive. */
  readonly id: string;
}

export function testResultId(testId: string, date: string): string {
  return `${testId}@${date}`;
}

/**
 * Il video scelto dall'utente per un esercizio.
 * L'URL arriva sempre da un incolla dell'utente: l'app non ne genera mai uno.
 */
export interface ExerciseMedia {
  readonly exercise: ExerciseSlug;
  readonly videoUrl: string;
  readonly updatedAt: string;
}

export type SuggestionDecision = 'accepted' | 'postponed';

/** Traccia della scelta fatta su un suggerimento di avanzamento. */
export interface SuggestionRecord {
  readonly id: string;
  readonly date: string;
  readonly sessionLogId: string;
  readonly exercise: ExerciseSlug;
  readonly blockCode: string;
  readonly lever: OverloadLever;
  readonly decision: SuggestionDecision;
  readonly stateBefore: ExerciseState;
  readonly stateAfter: ExerciseState;
}

/* -------------------------------------------------------------------------- */
/* Database                                                                    */
/* -------------------------------------------------------------------------- */

export class ShadowDatabase extends Dexie {
  constructor(name: string = DATABASE_NAME) {
    super(name);
    this.version(1).stores({
      settings: 'id',
      sessions: 'id, date, week, sessionId, status',
      testResults: 'id, testId, date, week',
      exerciseStates: 'exercise',
      exerciseMedia: 'exercise',
      weights: 'date',
      waists: 'date',
      suggestions: 'id, date, exercise, lever, decision',
    });
  }

  /*
   * Le tabelle sono getter e non campi di classe: con `useDefineForClassFields`
   * un campo dichiarato verrebbe definito a `undefined` dopo il costruttore di
   * Dexie, azzerando quello che Dexie ci ha appena messo dentro.
   */
  get settings(): Table<AppSettings, string> {
    return this.table('settings');
  }
  get sessions(): Table<LoggedSession, string> {
    return this.table('sessions');
  }
  get testResults(): Table<StoredTestResult, string> {
    return this.table('testResults');
  }
  get exerciseStates(): Table<ExerciseState, string> {
    return this.table('exerciseStates');
  }
  get exerciseMedia(): Table<ExerciseMedia, string> {
    return this.table('exerciseMedia');
  }
  get weights(): Table<WeightEntry, string> {
    return this.table('weights');
  }
  get waists(): Table<WaistEntry, string> {
    return this.table('waists');
  }
  get suggestions(): Table<SuggestionRecord, string> {
    return this.table('suggestions');
  }
}

/** Nomi delle tabelle, nell'ordine usato dal backup. */
export const TABLE_NAMES = [
  'settings',
  'sessions',
  'testResults',
  'exerciseStates',
  'exerciseMedia',
  'weights',
  'waists',
  'suggestions',
] as const;

/**
 * Le copie automatiche.
 *
 * Sta fuori da `TABLE_NAMES` di proposito, e per due motivi. Il backup non
 * deve contenere sé stesso, e un ripristino non deve cancellare la storia
 * delle copie: se ripristini una copia sbagliata, le altre devono essere
 * ancora lì.
 */
export const SNAPSHOTS_TABLE = 'snapshots';

export type TableName = (typeof TABLE_NAMES)[number] | typeof SNAPSHOTS_TABLE;

/** Una copia dell'intero archivio, presa dall'app e tenuta accanto ai dati. */
export interface SnapshotRecord {
  /** La data della copia, YYYY-MM-DD: una al giorno, la seconda sovrascrive. */
  readonly id: string;
  readonly takenAt: string;
  /** Il backup completo, serializzato. */
  readonly payload: string;
  readonly bytes: number;
}

/** Istanza condivisa dall'app. I test creano la propria, con un altro nome. */
export const db = new ShadowDatabase();
