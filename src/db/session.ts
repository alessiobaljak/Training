import { getFirebase } from '../firebase/app.ts';
import { DexieStore } from './dexie-store.ts';
import { FirestoreStore } from './firestore-store.ts';
import { migrateLocalData, type MigrationReport } from './migrate.ts';
import { takeSnapshotIfDue } from './snapshots.ts';
import { todayIso } from '../engine/dates.ts';
import { repository } from './repository.ts';
import { MemoryStore } from './store.ts';
import { clearWriteError } from './write-errors.ts';

/**
 * Collega e scollega il magazzino dell'utente.
 *
 * Fuori dall'account il repository punta a un magazzino in memoria e vuoto:
 * non c'è nessuna schermata che lo legga, ma così una lettura fuori tempo
 * restituisce «niente» invece di esplodere.
 */

let attached: FirestoreStore | null = null;

export async function attachUser(uid: string): Promise<MigrationReport | null> {
  const firebase = getFirebase();
  if (firebase === null) return null;

  attached?.dispose();
  clearWriteError();
  const store = new FirestoreStore(firebase.firestore, uid);
  attached = store;
  repository.use(store);

  // I dati di chi usava l'app prima che ci fosse un account. Se non ce ne
  // sono, o se questo account ha già uno storico, non tocca niente.
  const report = await migrateLocalData(new DexieStore(), store).catch(() => null);

  /*
   * La copia del giorno, una sola, al primo avvio. Non si aspetta e non si
   * lascia fallire l'accesso per colpa sua: se non riesce, l'app parte lo
   * stesso e ci riprova domani.
   */
  void takeSnapshotIfDue(repository, todayIso()).catch(() => undefined);

  void fissaStatiUnaVolta(uid);

  return report;
}

/*
 * R9c (B16): gli esercizi già fatti e mai salvati ricevono lo stato che l'app
 * mostra oggi, così un ritest migliore non ne alza il gradino da solo. Una
 * volta per account su ogni dispositivo, dopo l'eventuale migrazione dei dati
 * locali. Senza rete non scrive niente e ci riprova all'apertura dopo.
 */
const CHIAVE_STATI_FISSATI = 'shadow.r9c.stati-fissati.';

async function fissaStatiUnaVolta(uid: string): Promise<void> {
  const chiave = CHIAVE_STATI_FISSATI + uid;
  try {
    if (localStorage.getItem(chiave) === '1') return;
  } catch {
    /* Senza localStorage si rifà a ogni apertura: è idempotente. */
  }
  try {
    await repository.fissaStatiMancanti();
  } catch {
    return;
  }
  try {
    localStorage.setItem(chiave, '1');
  } catch {
    /* Come sopra. */
  }
}

export function detachUser(): void {
  attached?.dispose();
  attached = null;
  repository.use(new MemoryStore());
}
