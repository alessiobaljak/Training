import { TABLE_NAMES, ShadowDatabase, db, type TableName } from './db.ts';
import { keyOf, type DocumentStore } from './store.ts';

/**
 * Il vecchio magazzino locale su IndexedDB.
 *
 * Non è più dove l'app scrive: serve solo a leggere i dati di chi usava
 * l'app prima che ci fosse un account, per portarli dentro Firestore al primo
 * accesso. Vedi `migrateLocalData`.
 */
export class DexieStore implements DocumentStore {
  private readonly database: ShadowDatabase;
  private readonly listeners = new Set<() => void>();

  constructor(database: ShadowDatabase = db) {
    this.database = database;
  }

  private table(name: TableName) {
    return this.database.table(name);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  async get<T>(table: TableName, id: string): Promise<T | undefined> {
    return (await this.table(table).get(id)) as T | undefined;
  }

  async getMany<T>(table: TableName, ids: readonly string[]): Promise<(T | undefined)[]> {
    return (await this.table(table).bulkGet([...ids])) as (T | undefined)[];
  }

  async all<T>(table: TableName): Promise<T[]> {
    return (await this.table(table).toArray()) as T[];
  }

  async put<T>(table: TableName, document: T): Promise<void> {
    keyOf(table, document);
    await this.table(table).put(document);
    this.notify();
  }

  async putMany<T>(table: TableName, documents: readonly T[]): Promise<void> {
    for (const document of documents) keyOf(table, document);
    await this.table(table).bulkPut([...documents]);
    this.notify();
  }

  async remove(table: TableName, id: string): Promise<void> {
    await this.table(table).delete(id);
    this.notify();
  }

  async clear(table: TableName): Promise<void> {
    await this.table(table).clear();
    this.notify();
  }

  async clearAll(): Promise<void> {
    for (const table of TABLE_NAMES) await this.table(table).clear();
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
