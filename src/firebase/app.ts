/**
 * Inizializzazione di Firebase, una volta sola e su richiesta.
 *
 * Su richiesta e non all'avvio del modulo, perché se la configurazione manca
 * l'app deve poter mostrare una schermata che dice quali variabili mancano,
 * invece di morire con un errore illeggibile prima ancora di disegnare.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { emulatorHost, readConfig } from './config.ts';

export interface FirebaseServices {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly firestore: Firestore;
}

let services: FirebaseServices | null = null;

/** `null` se la configurazione non c'è: chi chiama decide cosa mostrare. */
export function getFirebase(): FirebaseServices | null {
  if (services !== null) return services;

  const config = readConfig();
  if (config === null) return null;

  const app = initializeApp(config);
  const auth = getAuth(app);

  /*
   * La cache persistente è quella che tiene in piedi la palestra senza campo:
   * Firestore legge e scrive su IndexedDB e risincronizza da solo quando la
   * rete torna. `persistentMultipleTabManager` evita che due schede aperte si
   * contendano il lock e lascino l'app bloccata.
   */
  const firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  const host = emulatorHost();
  if (host !== null) {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(firestore, host, 8080);
  }

  services = { app, auth, firestore };
  return services;
}

/** Solo per i test: dimentica l'istanza per poterne creare un'altra. */
export function resetFirebaseForTests(): void {
  services = null;
}
