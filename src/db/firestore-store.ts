import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  setDoc,
  writeBatch,
  type CollectionReference,
  type Firestore,
} from 'firebase/firestore';
import { TABLE_NAMES, type TableName } from './db.ts';
import { keyOf, type DocumentStore, type StoreEntry } from './store.ts';
import { reportWriteError } from './write-errors.ts';

/**
 * I dati dell'utente su Firestore, sotto `users/{uid}`.
 *
 * Nessun documento sta fuori da quel ramo: è quello che permette alle regole
 * di sicurezza di essere una riga sola, e a un utente di non poter nemmeno
 * chiedere i dati di un altro.
 *
 * L'offline non si perde: Firestore tiene una copia persistente su IndexedDB
 * (vedi `initializeFirestore` in src/firebase/app.ts), serve le letture da lì
 * quando non c'è rete, mette in coda le scritture e le manda quando torna.
 */

/** Firestore accetta al massimo 500 operazioni per lotto. */
const BATCH_LIMIT = 500;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

export class FirestoreStore implements DocumentStore {
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribers: (() => void)[] = [];

  /*
   * Copia locale di ogni collezione, tenuta aggiornata da onSnapshot.
   *
   * Le letture non chiedono mai un documento singolo al server, e non per
   * risparmiare: senza rete una lettura puntuale su un documento che la cache
   * non ha ancora visto resta appesa, e la schermata resta ferma su «carico».
   * È esattamente il difetto che la prova in modalità aereo ha trovato, sul
   * pulsante del video di un esercizio senza link salvato.
   *
   * onSnapshot invece consegna subito quello che c'è in cache, anche in
   * aereo, e poi riconsegna quando la rete torna. Da qui in poi ogni lettura è
   * sincrona sulla copia locale, e l'unica attesa è la prima.
   */
  private readonly mirror = new Map<TableName, Map<string, unknown>>();
  private readonly priming = new Map<TableName, Promise<void>>();

  private readonly firestore: Firestore;
  private readonly uid: string;

  constructor(firestore: Firestore, uid: string) {
    this.firestore = firestore;
    this.uid = uid;
  }

  private ref(table: TableName): CollectionReference {
    return collection(this.firestore, 'users', this.uid, table);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  /** Attacca l'ascolto e aspetta il primo risultato, una volta per tabella. */
  private prime(table: TableName): Promise<void> {
    const existing = this.priming.get(table);
    if (existing !== undefined) return existing;

    const started = new Promise<void>((resolve) => {
      let first = true;
      const stop = onSnapshot(
        this.ref(table),
        (snapshot) => {
          const rows = new Map<string, unknown>();
          for (const entry of snapshot.docs) rows.set(entry.id, entry.data());
          this.mirror.set(table, rows);
          if (first) {
            first = false;
            resolve();
          } else {
            this.notify();
          }
        },
        () => {
          // Un ascolto che cade non deve bloccare l'app: si continua con
          // l'ultima copia buona, o con una vuota se non ce n'è ancora.
          if (!this.mirror.has(table)) this.mirror.set(table, new Map());
          if (first) {
            first = false;
            resolve();
          }
        },
      );
      this.unsubscribers.push(stop);
    });

    this.priming.set(table, started);
    return started;
  }

  private async rows(table: TableName): Promise<Map<string, unknown>> {
    await this.prime(table);
    return this.mirror.get(table) ?? new Map();
  }

  async get<T>(table: TableName, id: string): Promise<T | undefined> {
    return (await this.rows(table)).get(id) as T | undefined;
  }

  async getMany<T>(table: TableName, ids: readonly string[]): Promise<(T | undefined)[]> {
    const rows = await this.rows(table);
    return ids.map((id) => rows.get(id) as T | undefined);
  }

  async all<T>(table: TableName): Promise<T[]> {
    return [...(await this.rows(table)).values()] as T[];
  }

  /** Senza rete fallisce: chi la usa non scrive niente e riprova dopo. */
  async allFromServer<T>(table: TableName): Promise<T[]> {
    const snapshot = await getDocsFromServer(this.ref(table));
    return snapshot.docs.map((entry) => entry.data()) as T[];
  }

  /*
   * Le scritture non aspettano il server.
   *
   * La promessa che Firestore restituisce si risolve quando il server ha
   * confermato, non quando il dato è stato scritto in locale. Aspettarla
   * significa lasciare un pulsante morto ogni volta che la rete è lenta, e in
   * palestra la rete è sempre lenta. Era il difetto del pulsante «Salva e
   * continua»: la seduta non andava avanti finché Google non rispondeva.
   *
   * Qui si aggiorna subito la copia locale, si lascia partire la scrittura e
   * si va avanti. Firestore la manda quando può, anche dopo giorni. Se il
   * server la rifiuta, l'errore non si perde: finisce in `reportWriteError` e
   * l'app lo mostra.
   */
  private track(promise: Promise<unknown>): void {
    promise.catch((cause: unknown) => {
      reportWriteError(cause);
    });
  }

  /** Applica subito alla copia locale, così una rilettura immediata la vede. */
  private touch(table: TableName, apply: (rows: Map<string, unknown>) => void): void {
    const rows = this.mirror.get(table);
    if (rows !== undefined) {
      apply(rows);
      for (const listener of this.listeners) listener();
    }
  }

  put<T>(table: TableName, document: T): Promise<void> {
    const id = keyOf(table, document);
    this.touch(table, (rows) => rows.set(id, document));
    this.track(setDoc(doc(this.ref(table), id), document as object));
    return Promise.resolve();
  }

  putMany<T>(table: TableName, documents: readonly T[]): Promise<void> {
    this.touch(table, (rows) => {
      for (const document of documents) rows.set(keyOf(table, document), document);
    });
    for (const group of chunk(documents, BATCH_LIMIT)) {
      const batch = writeBatch(this.firestore);
      for (const document of group) {
        batch.set(doc(this.ref(table), keyOf(table, document)), document as object);
      }
      this.track(batch.commit());
    }
    return Promise.resolve();
  }

  putTogether(entries: readonly StoreEntry[]): Promise<void> {
    /* Una sola scrittura in blocco: Firestore la applica tutta o niente. */
    const keyed = entries.map((entry) => ({ ...entry, id: keyOf(entry.table, entry.doc) }));
    for (const entry of keyed) this.touch(entry.table, (rows) => rows.set(entry.id, entry.doc));
    const batch = writeBatch(this.firestore);
    for (const entry of keyed) batch.set(doc(this.ref(entry.table), entry.id), entry.doc as object);
    this.track(batch.commit());
    return Promise.resolve();
  }

  remove(table: TableName, id: string): Promise<void> {
    this.touch(table, (rows) => rows.delete(id));
    this.track(deleteDoc(doc(this.ref(table), id)));
    return Promise.resolve();
  }

  async clear(table: TableName): Promise<void> {
    // Qui la lettura serve davvero: per cancellare bisogna sapere cosa c'è.
    const snapshot = await getDocs(this.ref(table));
    this.touch(table, (rows) => rows.clear());
    for (const group of chunk(snapshot.docs, BATCH_LIMIT)) {
      const batch = writeBatch(this.firestore);
      for (const entry of group) batch.delete(entry.ref);
      this.track(batch.commit());
    }
  }

  /**
   * Svuota tutto, tabella per tabella.
   *
   * Non è una transazione unica: Firestore non ne offre una che copra
   * centinaia di documenti su otto collezioni. Chi la chiama, cioè l'import in
   * modalità sostituzione, valida l'intero file prima di arrivare qui, quindi
   * l'unico scenario che resta è perdere la rete a metà. Se succede, il
   * ripristino va rifatto: non è un dato corrotto, è un dato incompleto che il
   * prossimo import sistema.
   */
  async clearAll(): Promise<void> {
    for (const table of TABLE_NAMES) await this.clear(table);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    // Tutte le tabelle sotto ascolto: è così che un cambiamento fatto su un
    // altro dispositivo arriva qui senza che nessuno lo chieda.
    for (const table of TABLE_NAMES) void this.prime(table);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Chiude tutti gli ascolti. Si chiama all'uscita dall'account. */
  dispose(): void {
    for (const stop of this.unsubscribers) stop();
    this.unsubscribers.length = 0;
    this.listeners.clear();
    this.mirror.clear();
    this.priming.clear();
  }
}
