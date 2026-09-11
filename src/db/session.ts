import { getFirebase } from '../firebase/app.ts';
import { DexieStore } from './dexie-store.ts';
import { FirestoreStore } from './firestore-store.ts';
import { migrateLocalData, type MigrationReport } from './migrate.ts';
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
  return migrateLocalData(new DexieStore(), store).catch(() => null);
}

export function detachUser(): void {
  attached?.dispose();
  attached = null;
  repository.use(new MemoryStore());
}
