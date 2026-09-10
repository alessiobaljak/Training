/**
 * Accesso con Google e con Apple.
 *
 * Non c'è registrazione: il primo accesso crea l'utente. Non c'è password da
 * ricordare e non c'è nessuna email da confermare.
 *
 * Perché sia popup sia redirect: dentro un'app installata su iPhone il popup a
 * volte non torna indietro, e in quel caso l'unica strada è il redirect, che
 * però riporta l'utente sull'app da capo. Si prova prima il popup, che è più
 * pulito, e si ripiega sul redirect quando il browser lo rifiuta.
 */
import {
  GoogleAuthProvider,
  OAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebase } from './app.ts';
import { emulatorHost } from './config.ts';

export type ProviderId = 'google' | 'apple';

export interface AccountInfo {
  readonly uid: string;
  readonly displayName: string | null;
  readonly email: string | null;
  readonly photoUrl: string | null;
}

export function toAccountInfo(user: User): AccountInfo {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoUrl: user.photoURL,
  };
}

function buildProvider(id: ProviderId) {
  if (id === 'google') {
    const provider = new GoogleAuthProvider();
    // Chiede ogni volta quale account usare: chi ha due Google non si ritrova
    // dentro quello sbagliato senza capire perché lo storico è vuoto.
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return provider;
}

/** Errori che significano «il popup non è praticabile qui», non «accesso fallito». */
const POPUP_UNAVAILABLE = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
]);

function errorCode(cause: unknown): string {
  return typeof cause === 'object' && cause !== null && 'code' in cause
    ? String((cause as { code: unknown }).code)
    : '';
}

export class AuthUnavailableError extends Error {
  constructor() {
    super('Firebase non è configurato: mancano le variabili d’ambiente.');
    this.name = 'AuthUnavailableError';
  }
}

/**
 * Avvia l'accesso. Con il popup ritorna l'utente; con il redirect la pagina
 * se ne va e questa promessa non si risolve mai: chi chiama non deve contarci.
 */
export async function signIn(id: ProviderId): Promise<AccountInfo | null> {
  const firebase = getFirebase();
  if (firebase === null) throw new AuthUnavailableError();

  /*
   * Con gli emulatori non si passa da Google: si presenta un token non
   * firmato, che solo l'emulatore accetta. Serve alle prove sul browser, che
   * altrimenti dovrebbero pilotare la finestra di accesso di un provider
   * vero. In produzione, senza VITE_FIREBASE_EMULATOR_HOST, questo ramo non
   * esiste.
   */
  const emulator = emulatorHost();
  if (emulator !== null) {
    const claims = JSON.stringify({
      sub: `prova-${id}`,
      email: `prova-${id}@example.test`,
      email_verified: true,
    });
    const credential = await signInWithCredential(
      firebase.auth,
      GoogleAuthProvider.credential(claims),
    );
    return toAccountInfo(credential.user);
  }

  const provider = buildProvider(id);
  try {
    const credential = await signInWithPopup(firebase.auth, provider);
    return toAccountInfo(credential.user);
  } catch (cause) {
    if (!POPUP_UNAVAILABLE.has(errorCode(cause))) throw cause;
    await signInWithRedirect(firebase.auth, provider);
    return null;
  }
}

/**
 * Raccoglie l'esito di un accesso via redirect. Va chiamata all'avvio, prima
 * di decidere se mostrare la schermata di login.
 */
export async function consumeRedirectResult(): Promise<AccountInfo | null> {
  const firebase = getFirebase();
  if (firebase === null) return null;
  const credential = await getRedirectResult(firebase.auth).catch(() => null);
  return credential === null ? null : toAccountInfo(credential.user);
}

export async function signOut(): Promise<void> {
  const firebase = getFirebase();
  if (firebase === null) return;
  await firebaseSignOut(firebase.auth);
}

/**
 * Si iscrive ai cambi di sessione. Chiama il listener con `null` quando non
 * c'è nessuno collegato, e sempre almeno una volta.
 */
export function observeAccount(listener: (account: AccountInfo | null) => void): () => void {
  const firebase = getFirebase();
  if (firebase === null) {
    listener(null);
    return () => undefined;
  }
  return onAuthStateChanged(firebase.auth, (user) => {
    listener(user === null ? null : toAccountInfo(user));
  });
}
