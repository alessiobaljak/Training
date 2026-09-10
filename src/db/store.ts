import { TABLE_NAMES, type TableName } from './db.ts';

/**
 * Il magazzino dei documenti, visto dal repository.
 *
 * Otto tabelle, ognuna con una chiave sola di tipo stringa: è tutto quello di
 * cui l'app ha bisogno. Tenere questa interfaccia stretta è ciò che permette
 * di cambiare dove stanno i dati, da IndexedDB a Firestore, senza toccare né
 * il repository né una riga di interfaccia.
 */
export interface DocumentStore {
  get<T>(table: TableName, id: string): Promise<T | undefined>;
  getMany<T>(table: TableName, ids: readonly string[]): Promise<(T | undefined)[]>;
  all<T>(table: TableName): Promise<T[]>;
  put<T>(table: TableName, doc: T): Promise<void>;
  putMany<T>(table: TableName, docs: readonly T[]): Promise<void>;
  remove(table: TableName, id: string): Promise<void>;
  clear(table: TableName): Promise<void>;
  /** Svuota tutto. La usa l'import in modalità sostituzione. */
  clearAll(): Promise<void>;
  /**
   * Avvisa a ogni cambiamento, da qualunque origine: una scrittura locale
   * oppure una sincronizzazione arrivata da un altro dispositivo.
   *
   * È volutamente grossolano, senza dire cosa è cambiato: i dati di un utente
   * sono poche centinaia di righe, e rileggerle costa meno del codice che
   * servirebbe per essere precisi.
   */
  subscribe(listener: () => void): () => void;
}

/** Il campo che fa da chiave, tabella per tabella. */
export const KEY_FIELD = {
  settings: 'id',
  sessions: 'id',
  testResults: 'id',
  exerciseStates: 'exercise',
  exerciseMedia: 'exercise',
  weights: 'date',
  waists: 'date',
  suggestions: 'id',
} as const satisfies Record<TableName, string>;

export function keyOf(table: TableName, doc: unknown): string {
  const field = KEY_FIELD[table];
  if (typeof doc !== 'object' || doc === null || !(field in doc)) {
    throw new Error(`${table}: manca il campo chiave "${field}".`);
  }
  const value = (doc as Record<string, unknown>)[field];
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${table}: il campo chiave "${field}" deve essere una stringa non vuota.`);
  }
  return value;
}

/**
 * Magazzino in memoria. Lo usano i test: stesso contratto, nessun database
 * da avviare, nessun emulatore, millisecondi invece di secondi.
 */
export class MemoryStore implements DocumentStore {
  private readonly tables = new Map<TableName, Map<string, unknown>>();
  private readonly listeners = new Set<() => void>();

  constructor() {
    for (const table of TABLE_NAMES) this.tables.set(table, new Map());
  }

  private table(name: TableName): Map<string, unknown> {
    const found = this.tables.get(name);
    if (found === undefined) throw new Error(`Tabella sconosciuta: ${name}`);
    return found;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  get<T>(table: TableName, id: string): Promise<T | undefined> {
    return Promise.resolve(this.table(table).get(id) as T | undefined);
  }

  getMany<T>(table: TableName, ids: readonly string[]): Promise<(T | undefined)[]> {
    const rows = this.table(table);
    return Promise.resolve(ids.map((id) => rows.get(id) as T | undefined));
  }

  all<T>(table: TableName): Promise<T[]> {
    return Promise.resolve([...this.table(table).values()] as T[]);
  }

  put<T>(table: TableName, doc: T): Promise<void> {
    this.table(table).set(keyOf(table, doc), doc);
    this.notify();
    return Promise.resolve();
  }

  putMany<T>(table: TableName, docs: readonly T[]): Promise<void> {
    const rows = this.table(table);
    for (const doc of docs) rows.set(keyOf(table, doc), doc);
    this.notify();
    return Promise.resolve();
  }

  remove(table: TableName, id: string): Promise<void> {
    this.table(table).delete(id);
    this.notify();
    return Promise.resolve();
  }

  clear(table: TableName): Promise<void> {
    this.table(table).clear();
    this.notify();
    return Promise.resolve();
  }

  clearAll(): Promise<void> {
    for (const table of TABLE_NAMES) this.table(table).clear();
    this.notify();
    return Promise.resolve();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
