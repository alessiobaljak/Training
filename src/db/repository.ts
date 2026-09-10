import { getExercise } from '../data/exercises.ts';
import { initialExerciseState } from '../engine/progression.ts';
import { latestCompleteRound, latestTestResults, openRound, testRounds } from '../engine/ranges.ts';
import type { TestRound } from '../engine/ranges.ts';
import { isIsoDate } from '../engine/dates.ts';
import { normalizeVideoUrl } from '../engine/media.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedSession,
  SessionId,
  TestId,
  TestResult,
  WaistEntry,
  WeightEntry,
} from '../types/index.ts';
import {
  DATA_VERSION,
  SETTINGS_ID,
  ShadowDatabase,
  db,
  testResultId,
  type AppSettings,
  type ExerciseMedia,
  type StoredTestResult,
  type SuggestionRecord,
} from './db.ts';

/**
 * Unico punto di accesso ai dati dell'utente.
 *
 * La UI non parla mai con Dexie direttamente: passa da qui, così le
 * validazioni non si possono aggirare per distrazione.
 */

function now(): string {
  return new Date().toISOString();
}

/** Valori di partenza, usati finché la riga delle impostazioni non esiste. */
const DEFAULT_SETTINGS: AppSettings = Object.freeze({
  id: SETTINGS_ID,
  programStartDate: null,
  dataVersion: DATA_VERSION,
  lastBackupAt: null,
  createdAt: '',
  updatedAt: '',
});

function requireIsoDate(value: string, field: string): string {
  if (!isIsoDate(value)) {
    throw new Error(`${field}: data non valida (${value}). Formato atteso YYYY-MM-DD.`);
  }
  return value;
}

export class ShadowRepository {
  readonly db: ShadowDatabase;

  constructor(database: ShadowDatabase = db) {
    this.db = database;
  }

  /* ---------------------------------------------------------------------- */
  /* Impostazioni                                                            */
  /* ---------------------------------------------------------------------- */

  /**
   * Lettura pura, senza scrivere nulla.
   *
   * Serve alla UI: `useLiveQuery` esegue le query dentro una transazione di
   * sola lettura, e una scrittura lì dentro fa fallire l'intera schermata.
   * Quando la riga non esiste ancora restituisce i valori di partenza.
   */
  async readSettings(): Promise<AppSettings> {
    return (await this.db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS;
  }

  /** Come `readSettings`, ma crea la riga se manca. Solo dai percorsi di scrittura. */
  async getSettings(): Promise<AppSettings> {
    const existing = await this.db.settings.get(SETTINGS_ID);
    if (existing !== undefined) return existing;
    const created: AppSettings = { ...DEFAULT_SETTINGS, createdAt: now(), updatedAt: now() };
    await this.db.settings.put(created);
    return created;
  }

  /** `null` finché la Settimana 0 non è chiusa. */
  async getProgramStartDate(): Promise<string | null> {
    return (await this.readSettings()).programStartDate;
  }

  async setProgramStartDate(date: string | null): Promise<AppSettings> {
    if (date !== null) requireIsoDate(date, 'programStartDate');
    const settings = await this.getSettings();
    const updated: AppSettings = { ...settings, programStartDate: date, updatedAt: now() };
    await this.db.settings.put(updated);
    return updated;
  }

  /**
   * L'app è utilizzabile solo quando esiste un giro di test completo, cioè
   * tutti e nove nello stesso giorno. Con tre test su nove i range degli altri
   * sei sarebbero inventati, e la Home deve restare bloccata.
   */
  async isOnboarded(): Promise<boolean> {
    return latestCompleteRound(await this.db.testResults.toArray()) !== null;
  }

  /** Giri di test, dal più vecchio al più recente. Serve allo storico. */
  async listTestRounds(): Promise<TestRound[]> {
    return testRounds(await this.db.testResults.toArray());
  }

  async getLatestCompleteRound(): Promise<TestRound | null> {
    return latestCompleteRound(await this.db.testResults.toArray());
  }

  /** Giro lasciato a metà, da riprendere. */
  async getOpenRound(): Promise<TestRound | null> {
    return openRound(await this.db.testResults.toArray());
  }

  /** Registra che il backup è stato scaricato. Lo chiama la UI dopo il salvataggio. */
  async markBackupTaken(when: string = now()): Promise<AppSettings> {
    const settings = await this.getSettings();
    const updated: AppSettings = { ...settings, lastBackupAt: when, updatedAt: now() };
    await this.db.settings.put(updated);
    return updated;
  }

  /* ---------------------------------------------------------------------- */
  /* Sedute                                                                  */
  /* ---------------------------------------------------------------------- */

  async saveSession(session: LoggedSession): Promise<LoggedSession> {
    requireIsoDate(session.date, 'session.date');
    if (session.id.trim() === '') throw new Error('La seduta deve avere un id.');
    await this.db.sessions.put(session);
    return session;
  }

  async getSession(id: string): Promise<LoggedSession | null> {
    return (await this.db.sessions.get(id)) ?? null;
  }

  /**
   * Seduta interrotta e riprendibile. Se ne trova più di una, restituisce la
   * più recente: le altre restano nel log e si possono chiudere a mano.
   */
  async getActiveSession(): Promise<LoggedSession | null> {
    const open = await this.db.sessions.where('status').equals('in-progress').toArray();
    if (open.length === 0) return null;
    return [...open].sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null;
  }

  async listSessions(
    filter: { from?: string; to?: string; sessionId?: SessionId } = {},
  ): Promise<LoggedSession[]> {
    const all = await this.db.sessions.toArray();
    return all
      .filter((session) => (filter.from === undefined ? true : session.date >= filter.from))
      .filter((session) => (filter.to === undefined ? true : session.date <= filter.to))
      .filter((session) =>
        filter.sessionId === undefined ? true : session.sessionId === filter.sessionId,
      )
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.sessions.delete(id);
  }

  /* ---------------------------------------------------------------------- */
  /* Test                                                                    */
  /* ---------------------------------------------------------------------- */

  async saveTestResult(result: TestResult): Promise<StoredTestResult> {
    requireIsoDate(result.date, 'testResult.date');
    if (result.value < 0) throw new Error('Il massimale non può essere negativo.');
    const stored: StoredTestResult = { ...result, id: testResultId(result.testId, result.date) };
    await this.db.testResults.put(stored);
    return stored;
  }

  async saveTestResults(results: readonly TestResult[]): Promise<StoredTestResult[]> {
    const stored = results.map<StoredTestResult>((result) => {
      requireIsoDate(result.date, 'testResult.date');
      return { ...result, id: testResultId(result.testId, result.date) };
    });
    await this.db.testResults.bulkPut(stored);
    return stored;
  }

  async listTestResults(testId?: TestId): Promise<StoredTestResult[]> {
    const all = await this.db.testResults.toArray();
    return all
      .filter((result) => (testId === undefined ? true : result.testId === testId))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  /** Ultimo massimale per ogni test: è la base di tutti i range di lavoro. */
  async latestTests(): Promise<ReadonlyMap<TestId, TestResult>> {
    return latestTestResults(await this.db.testResults.toArray());
  }

  /* ---------------------------------------------------------------------- */
  /* Stato di avanzamento                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Stato di un esercizio. Se non è mai stato salvato, parte dal livello che
   * il programma prescrive, come stabilito da `STARTING_LEVEL_POLICY`.
   */
  async getExerciseState(slug: ExerciseSlug): Promise<ExerciseState> {
    const stored = await this.db.exerciseStates.get(slug);
    return stored ?? initialExerciseState(getExercise(slug));
  }

  async saveExerciseState(state: ExerciseState): Promise<ExerciseState> {
    getExercise(state.exercise);
    await this.db.exerciseStates.put(state);
    return state;
  }

  async listExerciseStates(): Promise<ExerciseState[]> {
    return this.db.exerciseStates.toArray();
  }

  /**
   * `true` quando l'utente ha già confermato variante e livello di questo
   * esercizio almeno una volta. Il player usa questo dato per fermarsi prima
   * della prima serie: il livello di partenza viene dal programma, non da cosa
   * l'utente sa fare davvero, e va corretto con l'attrezzo in mano.
   */
  async hasConfirmedState(slug: ExerciseSlug): Promise<boolean> {
    return (await this.db.exerciseStates.get(slug)) !== undefined;
  }

  async getConfirmedStates(slugs: readonly ExerciseSlug[]): Promise<ReadonlySet<ExerciseSlug>> {
    const rows = await this.db.exerciseStates.bulkGet([...slugs]);
    return new Set(rows.filter((row) => row !== undefined).map((row) => row.exercise));
  }

  /* ---------------------------------------------------------------------- */
  /* Video personali                                                         */
  /* ---------------------------------------------------------------------- */

  async getExerciseVideo(slug: ExerciseSlug): Promise<string | null> {
    return (await this.db.exerciseMedia.get(slug))?.videoUrl ?? null;
  }

  /**
   * Salva il link scelto dall'utente. Rifiuta tutto ciò che non è http o
   * https: l'URL finisce in un href e uno schema `javascript:` sarebbe codice.
   */
  async setExerciseVideo(slug: ExerciseSlug, url: string): Promise<ExerciseMedia> {
    getExercise(slug);
    const normalized = normalizeVideoUrl(url);
    if (normalized === null) {
      throw new Error('Link non valido: incolla un indirizzo che inizia con http:// o https://.');
    }
    const media: ExerciseMedia = { exercise: slug, videoUrl: normalized, updatedAt: now() };
    await this.db.exerciseMedia.put(media);
    return media;
  }

  async clearExerciseVideo(slug: ExerciseSlug): Promise<void> {
    await this.db.exerciseMedia.delete(slug);
  }

  async listExerciseVideos(): Promise<ExerciseMedia[]> {
    return this.db.exerciseMedia.toArray();
  }

  /* ---------------------------------------------------------------------- */
  /* Misure                                                                  */
  /* ---------------------------------------------------------------------- */

  async saveWeight(entry: WeightEntry): Promise<WeightEntry> {
    requireIsoDate(entry.date, 'weight.date');
    if (entry.kg <= 0) throw new Error('Il peso deve essere maggiore di zero.');
    await this.db.weights.put(entry);
    return entry;
  }

  async deleteWeight(date: string): Promise<void> {
    await this.db.weights.delete(date);
  }

  async listWeights(): Promise<WeightEntry[]> {
    const all = await this.db.weights.toArray();
    return all.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async saveWaist(entry: WaistEntry): Promise<WaistEntry> {
    requireIsoDate(entry.date, 'waist.date');
    if (entry.cm <= 0) throw new Error('Il girovita deve essere maggiore di zero.');
    await this.db.waists.put(entry);
    return entry;
  }

  async deleteWaist(date: string): Promise<void> {
    await this.db.waists.delete(date);
  }

  async listWaists(): Promise<WaistEntry[]> {
    const all = await this.db.waists.toArray();
    return all.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  /* ---------------------------------------------------------------------- */
  /* Suggerimenti di avanzamento                                             */
  /* ---------------------------------------------------------------------- */

  async recordSuggestion(record: SuggestionRecord): Promise<SuggestionRecord> {
    requireIsoDate(record.date, 'suggestion.date');
    await this.db.suggestions.put(record);
    return record;
  }

  async listSuggestions(slug?: ExerciseSlug): Promise<SuggestionRecord[]> {
    const all = await this.db.suggestions.toArray();
    return all
      .filter((record) => (slug === undefined ? true : record.exercise === slug))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  /* ---------------------------------------------------------------------- */
  /* Manutenzione                                                            */
  /* ---------------------------------------------------------------------- */

  /** Svuota tutte le tabelle. La usa l'import in modalità sostituzione. */
  async clearAll(): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.settings,
        this.db.sessions,
        this.db.testResults,
        this.db.exerciseStates,
        this.db.exerciseMedia,
        this.db.weights,
        this.db.waists,
        this.db.suggestions,
      ],
      async () => {
        await Promise.all([
          this.db.settings.clear(),
          this.db.sessions.clear(),
          this.db.testResults.clear(),
          this.db.exerciseStates.clear(),
          this.db.exerciseMedia.clear(),
          this.db.weights.clear(),
          this.db.waists.clear(),
          this.db.suggestions.clear(),
        ]);
      },
    );
  }
}

export const repository = new ShadowRepository(db);
