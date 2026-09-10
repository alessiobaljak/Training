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

/**
 * Errori che significano «il popup non è praticabile qui».
 *
 * L'elenco è corto apposta. Prima conteneva anche `popup-closed-by-user` e
 * `cancelled-popup-request`, che vogliono dire tutt'altro: l'utente ha chiuso
 * la finestra, o ne ha aperta una seconda. Trattarli come «popup non
 * disponibile» faceva partire il redirect a sorpresa dopo un annullamento, e
 * il redirect, su Safari, finisce nell'errore «missing initial state».
 */
const POPUP_UNAVAILABLE = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

function errorCode(cause: unknown): string {
  return typeof cause === 'object' && cause !== null && 'code' in cause
    ? String((cause as { code: unknown }).code)
    : '';
}

/** Messaggi in italiano, e soprattutto che dicano cosa fare. */
export function describeAuthError(cause: unknown): string {
  const code = errorCode(cause);
  const text = cause instanceof Error ? cause.message : String(cause);

  if (
    code === 'auth/missing-initial-state' ||
    text.includes('missing initial state') ||
    code === 'auth/web-storage-unsupported'
  ) {
    return (
      'Il browser ha isolato la memoria della pagina di accesso di Google, e il giro non è potuto tornare indietro. ' +
      'Non è colpa di come hai configurato Firebase: serve la deviazione di /__/auth su Vercel, in docs/configurazione.md.'
    );
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'Questo indirizzo è già collegato all’altro accesso. Usa quello con cui sei entrato la prima volta.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Nessuna rete. L’accesso ha bisogno di connessione, una volta sola.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Questo indirizzo non è tra i domini autorizzati nella console Firebase: Authentication, Settings, Domini autorizzati.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Hai chiuso la finestra di accesso. Riprova quando vuoi.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Questo tipo di accesso non è attivo nella console Firebase: Authentication, Sign-in method.';
  }
  return cause instanceof Error ? cause.message : 'Accesso non riuscito.';
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

export interface RedirectOutcome {
  readonly account: AccountInfo | null;
  /** Errore del giro di redirect, già tradotto. `null` se è andato bene. */
  readonly error: string | null;
}

/**
 * Raccoglie l'esito di un accesso via redirect. Va chiamata all'avvio, prima
 * di decidere se mostrare la schermata di login.
 *
 * L'errore non si butta via: se il redirect fallisce e nessuno lo dice,
 * l'utente rivede la schermata di accesso senza capire perché.
 */
export async function consumeRedirectResult(): Promise<RedirectOutcome> {
  const firebase = getFirebase();
  if (firebase === null) return { account: null, error: null };
  try {
    const credential = await getRedirectResult(firebase.auth);
    return {
      account: credential === null ? null : toAccountInfo(credential.user),
      error: null,
    };
  } catch (cause) {
    return { account: null, error: describeAuthError(cause) };
  }
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
