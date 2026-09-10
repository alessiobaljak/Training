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
  testResultId,
  type AppSettings,
  type ExerciseMedia,
  type StoredTestResult,
  type SuggestionRecord,
} from './db.ts';
import { MemoryStore, type DocumentStore } from './store.ts';

/**
 * Unico punto di accesso ai dati dell'utente.
 *
 * La UI non parla mai con il magazzino direttamente: passa da qui, così le
 * validazioni non si possono aggirare per distrazione. E il repository, a sua
 * volta, non sa dove i dati stiano davvero: `DocumentStore` è l'unica cosa che
 * conosce, quindi passare da IndexedDB a Firestore non gli cambia una riga.
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
  private current: DocumentStore;
  private readonly listeners = new Set<() => void>();
  private detach: () => void = () => undefined;

  constructor(store: DocumentStore = new MemoryStore()) {
    this.current = store;
    this.use(store);
  }

  get store(): DocumentStore {
    return this.current;
  }

  /**
   * Cambia il magazzino sotto i piedi al repository.
   *
   * Succede all'accesso, quando si passa dal magazzino vuoto a quello
   * dell'utente su Firestore, e all'uscita, quando si torna indietro. Chi era
   * iscritto resta iscritto e viene avvisato: le schermate aperte si
   * ridisegnano con i dati nuovi invece di restare ferme su quelli di prima.
   */
  use(store: DocumentStore): void {
    this.detach();
    this.current = store;
    this.detach = store.subscribe(() => {
      this.notify();
    });
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  /** Avvisa a ogni cambiamento dei dati, compreso il cambio di magazzino. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
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
    return (await this.store.get<AppSettings>('settings', SETTINGS_ID)) ?? DEFAULT_SETTINGS;
  }

  /** Come `readSettings`, ma crea la riga se manca. Solo dai percorsi di scrittura. */
  async getSettings(): Promise<AppSettings> {
    const existing = await this.store.get<AppSettings>('settings', SETTINGS_ID);
    if (existing !== undefined) return existing;
    const created: AppSettings = { ...DEFAULT_SETTINGS, createdAt: now(), updatedAt: now() };
    await this.store.put('settings', created);
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
    await this.store.put('settings', updated);
    return updated;
  }

  /**
   * L'app è utilizzabile solo quando esiste un giro di test completo, cioè
   * tutti e nove nello stesso giorno. Con tre test su nove i range degli altri
   * sei sarebbero inventati, e la Home deve restare bloccata.
   */
  async isOnboarded(): Promise<boolean> {
    return latestCompleteRound(await this.store.all<StoredTestResult>('testResults')) !== null;
  }

  /** Giri di test, dal più vecchio al più recente. Serve allo storico. */
  async listTestRounds(): Promise<TestRound[]> {
    return testRounds(await this.store.all<StoredTestResult>('testResults'));
  }

  async getLatestCompleteRound(): Promise<TestRound | null> {
    return latestCompleteRound(await this.store.all<StoredTestResult>('testResults'));
  }

  /** Giro lasciato a metà, da riprendere. */
  async getOpenRound(): Promise<TestRound | null> {
    return openRound(await this.store.all<StoredTestResult>('testResults'));
  }

  /** Registra che il backup è stato scaricato. Lo chiama la UI dopo il salvataggio. */
  async markBackupTaken(when: string = now()): Promise<AppSettings> {
    const settings = await this.getSettings();
    const updated: AppSettings = { ...settings, lastBackupAt: when, updatedAt: now() };
    await this.store.put('settings', updated);
    return updated;
  }

  /* ---------------------------------------------------------------------- */
  /* Sedute                                                                  */
  /* ---------------------------------------------------------------------- */

  async saveSession(session: LoggedSession): Promise<LoggedSession> {
    requireIsoDate(session.date, 'session.date');
    if (session.id.trim() === '') throw new Error('La seduta deve avere un id.');
    await this.store.put('sessions', session);
    return session;
  }

  async getSession(id: string): Promise<LoggedSession | null> {
    return (await this.store.get<LoggedSession>('sessions', id)) ?? null;
  }

  /**
   * Seduta interrotta e riprendibile. Se ne trova più di una, restituisce la
   * più recente: le altre restano nel log e si possono chiudere a mano.
   */
  async getActiveSession(): Promise<LoggedSession | null> {
    const all = await this.store.all<LoggedSession>('sessions');
    const open = all.filter((session) => session.status === 'in-progress');
    if (open.length === 0) return null;
    return [...open].sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null;
  }

  async listSessions(
    filter: { from?: string; to?: string; sessionId?: SessionId } = {},
  ): Promise<LoggedSession[]> {
    const all = await this.store.all<LoggedSession>('sessions');
    return all
      .filter((session) => (filter.from === undefined ? true : session.date >= filter.from))
      .filter((session) => (filter.to === undefined ? true : session.date <= filter.to))
      .filter((session) =>
        filter.sessionId === undefined ? true : session.sessionId === filter.sessionId,
      )
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  }

  async deleteSession(id: string): Promise<void> {
    await this.store.remove('sessions', id);
  }

  /* ---------------------------------------------------------------------- */
  /* Test                                                                    */
  /* ---------------------------------------------------------------------- */

  async saveTestResult(result: TestResult): Promise<StoredTestResult> {
    requireIsoDate(result.date, 'testResult.date');
    if (result.value < 0) throw new Error('Il massimale non può essere negativo.');
    const stored: StoredTestResult = { ...result, id: testResultId(result.testId, result.date) };
    await this.store.put('testResults', stored);
    return stored;
  }

  async saveTestResults(results: readonly TestResult[]): Promise<StoredTestResult[]> {
    const stored = results.map<StoredTestResult>((result) => {
      requireIsoDate(result.date, 'testResult.date');
      return { ...result, id: testResultId(result.testId, result.date) };
    });
    await this.store.putMany('testResults', stored);
    return stored;
  }

  async listTestResults(testId?: TestId): Promise<StoredTestResult[]> {
    const all = await this.store.all<StoredTestResult>('testResults');
    return all
      .filter((result) => (testId === undefined ? true : result.testId === testId))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  /** Ultimo massimale per ogni test: è la base di tutti i range di lavoro. */
  async latestTests(): Promise<ReadonlyMap<TestId, TestResult>> {
    return latestTestResults(await this.store.all<StoredTestResult>('testResults'));
  }

  /* ---------------------------------------------------------------------- */
  /* Stato di avanzamento                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Stato di un esercizio. Se non è mai stato salvato, parte dal livello che
   * il programma prescrive, come stabilito da `STARTING_LEVEL_POLICY`.
   */
  async getExerciseState(slug: ExerciseSlug): Promise<ExerciseState> {
    const stored = await this.store.get<ExerciseState>('exerciseStates', slug);
    return stored ?? initialExerciseState(getExercise(slug));
  }

  async saveExerciseState(state: ExerciseState): Promise<ExerciseState> {
    getExercise(state.exercise);
    await this.store.put('exerciseStates', state);
    return state;
  }

  async listExerciseStates(): Promise<ExerciseState[]> {
    return this.store.all<ExerciseState>('exerciseStates');
  }

  /**
   * `true` quando l'utente ha già confermato variante e livello di questo
   * esercizio almeno una volta. Il player usa questo dato per fermarsi prima
   * della prima serie: il livello di partenza viene dal programma, non da cosa
   * l'utente sa fare davvero, e va corretto con l'attrezzo in mano.
   */
  async hasConfirmedState(slug: ExerciseSlug): Promise<boolean> {
    return (await this.store.get<ExerciseState>('exerciseStates', slug)) !== undefined;
  }

  async getConfirmedStates(slugs: readonly ExerciseSlug[]): Promise<ReadonlySet<ExerciseSlug>> {
    const rows = await this.store.getMany<ExerciseState>('exerciseStates', [...slugs]);
    return new Set(rows.filter((row) => row !== undefined).map((row) => row.exercise));
  }

  /* ---------------------------------------------------------------------- */
  /* Video personali                                                         */
  /* ---------------------------------------------------------------------- */

  async getExerciseVideo(slug: ExerciseSlug): Promise<string | null> {
    return (await this.store.get<ExerciseMedia>('exerciseMedia', slug))?.videoUrl ?? null;
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
    await this.store.put('exerciseMedia', media);
    return media;
  }

  async clearExerciseVideo(slug: ExerciseSlug): Promise<void> {
    await this.store.remove('exerciseMedia', slug);
  }

  async listExerciseVideos(): Promise<ExerciseMedia[]> {
    return this.store.all<ExerciseMedia>('exerciseMedia');
  }

  /* ---------------------------------------------------------------------- */
  /* Misure                                                                  */
  /* ---------------------------------------------------------------------- */

  async saveWeight(entry: WeightEntry): Promise<WeightEntry> {
    requireIsoDate(entry.date, 'weight.date');
    if (entry.kg <= 0) throw new Error('Il peso deve essere maggiore di zero.');
    await this.store.put('weights', entry);
    return entry;
  }

  async deleteWeight(date: string): Promise<void> {
    await this.store.remove('weights', date);
  }

  async listWeights(): Promise<WeightEntry[]> {
    const all = await this.store.all<WeightEntry>('weights');
    return all.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async saveWaist(entry: WaistEntry): Promise<WaistEntry> {
    requireIsoDate(entry.date, 'waist.date');
    if (entry.cm <= 0) throw new Error('Il girovita deve essere maggiore di zero.');
    await this.store.put('waists', entry);
    return entry;
  }

  async deleteWaist(date: string): Promise<void> {
    await this.store.remove('waists', date);
  }

  async listWaists(): Promise<WaistEntry[]> {
    const all = await this.store.all<WaistEntry>('waists');
    return all.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  /* ---------------------------------------------------------------------- */
  /* Suggerimenti di avanzamento                                             */
  /* ---------------------------------------------------------------------- */

  async recordSuggestion(record: SuggestionRecord): Promise<SuggestionRecord> {
    requireIsoDate(record.date, 'suggestion.date');
    await this.store.put('suggestions', record);
    return record;
  }

  async listSuggestions(slug?: ExerciseSlug): Promise<SuggestionRecord[]> {
    const all = await this.store.all<SuggestionRecord>('suggestions');
    return all
      .filter((record) => (slug === undefined ? true : record.exercise === slug))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  /* ---------------------------------------------------------------------- */
  /* Manutenzione                                                            */
  /* ---------------------------------------------------------------------- */

  /** Svuota tutte le tabelle. La usa l'import in modalità sostituzione. */
  async clearAll(): Promise<void> {
    await this.store.clearAll();
  }
}

export const repository = new ShadowRepository();
