import { findExercise } from '../data/exercises.ts';
import { PROGRAM_SESSIONS } from '../data/program.ts';
import { WEEK_ZERO_TESTS } from '../data/tests.ts';
import { isIsoDate } from '../engine/dates.ts';
import { OVERLOAD_LEVERS } from '../types/index.ts';
import type {
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  OverloadLever,
  SessionId,
  SessionStatus,
  Side,
  TestId,
  WaistEntry,
  WeightEntry,
} from '../types/index.ts';
import {
  DATA_VERSION,
  TABLE_NAMES,
  type AppSettings,
  type ExerciseMedia,
  type StoredTestResult,
  type SuggestionDecision,
  type SuggestionRecord,
  type TableName,
} from './db.ts';
import type { ShadowRepository } from './repository.ts';

/**
 * Backup manuale: un solo file JSON con tutto.
 *
 * Regola di sicurezza del modulo: l'import valida l'intero file **prima** di
 * scrivere una sola riga, e poi scrive dentro una transazione unica. Un file
 * rotto deve fallire senza aver toccato nulla, non a metà strada.
 */

export const BACKUP_FORMAT = 'shadow-calisthenics-backup';

export interface BackupData {
  readonly settings: readonly AppSettings[];
  readonly sessions: readonly LoggedSession[];
  readonly testResults: readonly StoredTestResult[];
  readonly exerciseStates: readonly ExerciseState[];
  readonly exerciseMedia: readonly ExerciseMedia[];
  readonly weights: readonly WeightEntry[];
  readonly waists: readonly WaistEntry[];
  readonly suggestions: readonly SuggestionRecord[];
}

export interface BackupFile {
  readonly format: typeof BACKUP_FORMAT;
  readonly version: number;
  readonly exportedAt: string;
  readonly data: BackupData;
}

export class BackupError extends Error {
  readonly path: string;

  constructor(message: string, path = '') {
    super(path === '' ? message : `${path}: ${message}`);
    this.name = 'BackupError';
    this.path = path;
  }
}

/* -------------------------------------------------------------------------- */
/* Lettori con controllo di tipo                                               */
/* -------------------------------------------------------------------------- */

function expectRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BackupError('atteso un oggetto', path);
  }
  return value as Record<string, unknown>;
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new BackupError('attesa una lista', path);
  return value;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new BackupError('attesa una stringa', path);
  return value;
}

function expectNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BackupError('atteso un numero', path);
  }
  return value;
}

function expectBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new BackupError('atteso vero o falso', path);
  return value;
}

function expectNullableString(value: unknown, path: string): string | null {
  return value === null ? null : expectString(value, path);
}

function expectNullableNumber(value: unknown, path: string): number | null {
  return value === null ? null : expectNumber(value, path);
}

function expectIsoDate(value: unknown, path: string): string {
  const text = expectString(value, path);
  if (!isIsoDate(text)) throw new BackupError(`data non valida (${text})`, path);
  return text;
}

function expectOneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  const text = expectString(value, path);
  const match = allowed.find((candidate) => candidate === text);
  if (match === undefined) {
    throw new BackupError(`valore non ammesso (${text}); attesi: ${allowed.join(', ')}`, path);
  }
  return match;
}

function expectNonNegative(value: unknown, path: string): number {
  const number = expectNumber(value, path);
  if (number < 0) throw new BackupError('atteso un numero non negativo', path);
  return number;
}

const LEVELS: readonly LevelIndex[] = [1, 2, 3, 4, 5, 6];

function expectNullableLevel(value: unknown, path: string): LevelIndex | null {
  if (value === null) return null;
  const number = expectNumber(value, path);
  const level = LEVELS.find((candidate) => candidate === number);
  if (level === undefined) throw new BackupError(`livello fuori scala (${String(number)})`, path);
  return level;
}

/* -------------------------------------------------------------------------- */
/* Insiemi noti                                                                */
/* -------------------------------------------------------------------------- */

const SESSION_IDS: readonly SessionId[] = PROGRAM_SESSIONS.map((session) => session.id);
const SESSION_STATUSES: readonly SessionStatus[] = ['in-progress', 'completed', 'abandoned'];
const SIDES: readonly Side[] = ['left', 'right'];
const TEST_IDS: readonly TestId[] = WEEK_ZERO_TESTS.map((test) => test.id);
const DECISIONS: readonly SuggestionDecision[] = ['accepted', 'postponed'];

/* -------------------------------------------------------------------------- */
/* Validatori di riga                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Gli slug sconosciuti non fanno fallire l'import: un backup fatto con una
 * versione precedente dei dati va comunque ripristinato. Finiscono negli
 * avvisi del rapporto.
 */
function noteUnknownExercise(slug: string, path: string, warnings: string[]): void {
  if (findExercise(slug) === undefined) {
    warnings.push(`${path}: esercizio sconosciuto "${slug}", riga conservata così com’è.`);
  }
}

function readSet(value: unknown, path: string): LoggedSet {
  const row = expectRecord(value, path);
  return {
    setIndex: expectNonNegative(row['setIndex'], `${path}.setIndex`),
    side: row['side'] === null ? null : expectOneOf(row['side'], SIDES, `${path}.side`),
    value: expectNonNegative(row['value'], `${path}.value`),
    rir: expectNullableNumber(row['rir'], `${path}.rir`),
    loadKg: expectNonNegative(row['loadKg'], `${path}.loadKg`),
    // Assente nei backup fatti prima che questo campo esistesse.
    heartRate:
      row['heartRate'] === undefined ? null : expectNullableNumber(row['heartRate'], `${path}.heartRate`),
    note: expectNullableString(row['note'], `${path}.note`),
  };
}

function readExercise(value: unknown, path: string, warnings: string[]): LoggedExercise {
  const row = expectRecord(value, path);
  const slug = expectString(row['exercise'], `${path}.exercise`);
  noteUnknownExercise(slug, path, warnings);
  return {
    blockCode: expectString(row['blockCode'], `${path}.blockCode`),
    exercise: slug,
    variantLabel: expectString(row['variantLabel'], `${path}.variantLabel`),
    level: expectNullableLevel(row['level'], `${path}.level`),
    tempoRespected: expectBoolean(row['tempoRespected'], `${path}.tempoRespected`),
    sets: expectArray(row['sets'], `${path}.sets`).map((entry, index) =>
      readSet(entry, `${path}.sets[${String(index)}]`),
    ),
    note: expectNullableString(row['note'], `${path}.note`),
  };
}

function readSession(value: unknown, path: string, warnings: string[]): LoggedSession {
  const row = expectRecord(value, path);
  return {
    id: expectString(row['id'], `${path}.id`),
    date: expectIsoDate(row['date'], `${path}.date`),
    week: expectNonNegative(row['week'], `${path}.week`),
    sessionId: expectOneOf(row['sessionId'], SESSION_IDS, `${path}.sessionId`),
    status: expectOneOf(row['status'], SESSION_STATUSES, `${path}.status`),
    exercises: expectArray(row['exercises'], `${path}.exercises`).map((entry, index) =>
      readExercise(entry, `${path}.exercises[${String(index)}]`, warnings),
    ),
    note: expectNullableString(row['note'], `${path}.note`),
  };
}

function readSettings(value: unknown, path: string): AppSettings {
  const row = expectRecord(value, path);
  const startDate = row['programStartDate'];
  return {
    id: 'app',
    programStartDate: startDate === null ? null : expectIsoDate(startDate, `${path}.programStartDate`),
    dataVersion: expectNonNegative(row['dataVersion'], `${path}.dataVersion`),
    // Assente nei backup fatti prima che questo campo esistesse.
    lastBackupAt:
      row['lastBackupAt'] === undefined || row['lastBackupAt'] === null
        ? null
        : expectString(row['lastBackupAt'], `${path}.lastBackupAt`),
    createdAt: expectString(row['createdAt'], `${path}.createdAt`),
    updatedAt: expectString(row['updatedAt'], `${path}.updatedAt`),
  };
}

function readTestResult(value: unknown, path: string): StoredTestResult {
  const row = expectRecord(value, path);
  const testId = expectOneOf(row['testId'], TEST_IDS, `${path}.testId`);
  const date = expectIsoDate(row['date'], `${path}.date`);
  return {
    id: typeof row['id'] === 'string' ? row['id'] : `${testId}@${date}`,
    testId,
    date,
    week: expectNonNegative(row['week'], `${path}.week`),
    value: expectNonNegative(row['value'], `${path}.value`),
    left: expectNullableNumber(row['left'], `${path}.left`),
    right: expectNullableNumber(row['right'], `${path}.right`),
  };
}

function readExerciseState(value: unknown, path: string, warnings: string[]): ExerciseState {
  const row = expectRecord(value, path);
  const slug = expectString(row['exercise'], `${path}.exercise`);
  noteUnknownExercise(slug, path, warnings);
  return {
    exercise: slug,
    level: expectNullableLevel(row['level'], `${path}.level`),
    eccentricBonusSeconds: expectNonNegative(row['eccentricBonusSeconds'], `${path}.eccentricBonusSeconds`),
    bottomPauseBonusSeconds: expectNonNegative(row['bottomPauseBonusSeconds'], `${path}.bottomPauseBonusSeconds`),
    loadKg: expectNonNegative(row['loadKg'], `${path}.loadKg`),
  };
}

function readMedia(value: unknown, path: string, warnings: string[]): ExerciseMedia {
  const row = expectRecord(value, path);
  const slug = expectString(row['exercise'], `${path}.exercise`);
  noteUnknownExercise(slug, path, warnings);
  const url = expectString(row['videoUrl'], `${path}.videoUrl`);
  if (!/^https?:\/\//i.test(url)) {
    throw new BackupError('sono ammessi solo link http e https', `${path}.videoUrl`);
  }
  return {
    exercise: slug,
    videoUrl: url,
    updatedAt: expectString(row['updatedAt'], `${path}.updatedAt`),
  };
}

function readWeight(value: unknown, path: string): WeightEntry {
  const row = expectRecord(value, path);
  return {
    date: expectIsoDate(row['date'], `${path}.date`),
    kg: expectNonNegative(row['kg'], `${path}.kg`),
  };
}

function readWaist(value: unknown, path: string): WaistEntry {
  const row = expectRecord(value, path);
  return {
    date: expectIsoDate(row['date'], `${path}.date`),
    cm: expectNonNegative(row['cm'], `${path}.cm`),
  };
}

function readSuggestion(value: unknown, path: string, warnings: string[]): SuggestionRecord {
  const row = expectRecord(value, path);
  const slug = expectString(row['exercise'], `${path}.exercise`);
  noteUnknownExercise(slug, path, warnings);
  return {
    id: expectString(row['id'], `${path}.id`),
    date: expectIsoDate(row['date'], `${path}.date`),
    sessionLogId: expectString(row['sessionLogId'], `${path}.sessionLogId`),
    exercise: slug,
    blockCode: expectString(row['blockCode'], `${path}.blockCode`),
    lever: expectOneOf<OverloadLever>(row['lever'], OVERLOAD_LEVERS, `${path}.lever`),
    decision: expectOneOf(row['decision'], DECISIONS, `${path}.decision`),
    stateBefore: readExerciseState(row['stateBefore'], `${path}.stateBefore`, warnings),
    stateAfter: readExerciseState(row['stateAfter'], `${path}.stateAfter`, warnings),
  };
}

/* -------------------------------------------------------------------------- */
/* Validazione del file                                                        */
/* -------------------------------------------------------------------------- */

export interface ValidatedBackup {
  readonly backup: BackupFile;
  readonly warnings: readonly string[];
}

function readList<T>(
  source: Record<string, unknown>,
  key: TableName,
  read: (value: unknown, path: string) => T,
): T[] {
  const raw = source[key];
  if (raw === undefined) return [];
  return expectArray(raw, `data.${key}`).map((entry, index) =>
    read(entry, `data.${key}[${String(index)}]`),
  );
}

export function validateBackup(value: unknown): ValidatedBackup {
  const root = expectRecord(value, '');
  const format = expectString(root['format'], 'format');
  if (format !== BACKUP_FORMAT) {
    throw new BackupError(
      `questo non è un backup di Shadow (formato "${format}")`,
      'format',
    );
  }
  const version = expectNonNegative(root['version'], 'version');
  if (version > DATA_VERSION) {
    throw new BackupError(
      `il file è stato creato da una versione più recente dell’app (${String(version)} contro ${String(DATA_VERSION)}). Aggiorna l’app prima di importarlo.`,
      'version',
    );
  }

  const data = expectRecord(root['data'], 'data');
  const warnings: string[] = [];

  const backup: BackupFile = {
    format: BACKUP_FORMAT,
    version,
    exportedAt: expectString(root['exportedAt'], 'exportedAt'),
    data: {
      settings: readList(data, 'settings', readSettings),
      sessions: readList(data, 'sessions', (entry, path) => readSession(entry, path, warnings)),
      testResults: readList(data, 'testResults', readTestResult),
      exerciseStates: readList(data, 'exerciseStates', (entry, path) =>
        readExerciseState(entry, path, warnings),
      ),
      exerciseMedia: readList(data, 'exerciseMedia', (entry, path) =>
        readMedia(entry, path, warnings),
      ),
      weights: readList(data, 'weights', readWeight),
      waists: readList(data, 'waists', readWaist),
      suggestions: readList(data, 'suggestions', (entry, path) =>
        readSuggestion(entry, path, warnings),
      ),
    },
  };

  return { backup, warnings };
}

export function parseBackup(json: string): ValidatedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BackupError('il file non è JSON valido.');
  }
  return validateBackup(parsed);
}

/* -------------------------------------------------------------------------- */
/* Export                                                                      */
/* -------------------------------------------------------------------------- */

export async function exportBackup(repo: ShadowRepository): Promise<BackupFile> {
  const [settings, sessions, testResults, exerciseStates, exerciseMedia, weights, waists, suggestions] =
    await Promise.all([
      repo.db.settings.toArray(),
      repo.db.sessions.toArray(),
      repo.db.testResults.toArray(),
      repo.db.exerciseStates.toArray(),
      repo.db.exerciseMedia.toArray(),
      repo.db.weights.toArray(),
      repo.db.waists.toArray(),
      repo.db.suggestions.toArray(),
    ]);

  return {
    format: BACKUP_FORMAT,
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { settings, sessions, testResults, exerciseStates, exerciseMedia, weights, waists, suggestions },
  };
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(today: string): string {
  return `shadow-backup-${today}.json`;
}

/* -------------------------------------------------------------------------- */
/* Import                                                                      */
/* -------------------------------------------------------------------------- */

export type ImportMode = 'replace' | 'merge';

export interface ImportReport {
  readonly mode: ImportMode;
  readonly counts: Readonly<Record<TableName, number>>;
  readonly warnings: readonly string[];
}

/**
 * Scrive il backup in una transazione unica.
 *
 * `replace` svuota tutto e riscrive: è il ripristino di un telefono nuovo.
 * `merge` sovrascrive solo le righe presenti nel file e lascia le altre.
 */
export async function importBackup(
  repo: ShadowRepository,
  validated: ValidatedBackup,
  mode: ImportMode = 'replace',
): Promise<ImportReport> {
  const { backup, warnings } = validated;
  const { data } = backup;
  const database = repo.db;

  const tables = [
    database.settings,
    database.sessions,
    database.testResults,
    database.exerciseStates,
    database.exerciseMedia,
    database.weights,
    database.waists,
    database.suggestions,
  ];

  await database.transaction('rw', tables, async () => {
    if (mode === 'replace') {
      for (const table of tables) await table.clear();
    }
    await database.settings.bulkPut([...data.settings]);
    await database.sessions.bulkPut([...data.sessions]);
    await database.testResults.bulkPut([...data.testResults]);
    await database.exerciseStates.bulkPut([...data.exerciseStates]);
    await database.exerciseMedia.bulkPut([...data.exerciseMedia]);
    await database.weights.bulkPut([...data.weights]);
    await database.waists.bulkPut([...data.waists]);
    await database.suggestions.bulkPut([...data.suggestions]);
  });

  const counts = Object.fromEntries(
    TABLE_NAMES.map((name) => [name, data[name].length]),
  ) as Record<TableName, number>;

  return { mode, counts, warnings };
}
