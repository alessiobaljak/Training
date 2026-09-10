import { useCallback, useEffect, useState } from 'react';
import { missingConfigKeys, type ConfigKey } from '../../firebase/config.ts';
import {
  consumeRedirectResult,
  observeAccount,
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  type AccountInfo,
  type ProviderId,
} from '../../firebase/auth.ts';
import { attachUser, detachUser } from '../../db/session.ts';
import {
  enrollBiometric,
  forgetBiometric,
  isBiometricAvailable,
  isBiometricEnrolled,
  unlockWithBiometric,
} from '../../pwa/biometric.ts';

/**
 * Gli stati in cui l'app può trovarsi prima di mostrare un allenamento.
 *
 * `locked` esiste solo se hai registrato il volto su questo dispositivo: la
 * sessione Firebase c'è già, manca il tuo consenso ad aprirla.
 */
export type AuthState = 'loading' | 'config-missing' | 'signed-out' | 'locked' | 'ready';

export interface AuthStatus {
  readonly state: AuthState;
  readonly account: AccountInfo | null;
  readonly missingKeys: readonly ConfigKey[];
  readonly error: string | null;
  readonly biometricAvailable: boolean;
  readonly biometricEnrolled: boolean;
  readonly signIn: (provider: ProviderId) => void;
  readonly signOut: () => void;
  readonly unlock: () => void;
  readonly enableBiometric: () => void;
  readonly disableBiometric: () => void;
}

function describe(cause: unknown): string {
  if (typeof cause === 'object' && cause !== null && 'code' in cause) {
    const code = String((cause as { code: unknown }).code);
    if (code === 'auth/account-exists-with-different-credential') {
      return 'Questo indirizzo è già collegato all’altro accesso. Usa quello con cui sei entrato la prima volta.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Nessuna rete. L’accesso ha bisogno di connessione, una volta sola.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Questo indirizzo non è tra i domini autorizzati nella console Firebase.';
    }
  }
  return cause instanceof Error ? cause.message : 'Accesso non riuscito.';
}

export function useAuthStatus(): AuthStatus {
  const missingKeys = missingConfigKeys();
  const configured = missingKeys.length === 0;

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [resolved, setResolved] = useState(!configured);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);

  useEffect(() => {
    if (!configured) return;

    void isBiometricAvailable().then(setBiometricAvailable);

    // Un accesso via redirect torna qui: va raccolto prima di decidere se
    // mostrare la schermata di login, altrimenti l'utente la rivede e basta.
    void consumeRedirectResult().catch(() => null);

    return observeAccount((next) => {
      setAccount(next);
      setResolved(true);
      if (next === null) {
        detachUser();
        setUnlocked(false);
        setBiometricEnrolled(false);
        return;
      }
      // Da qui in poi il repository legge e scrive nello spazio di questo
      // utente su Firestore, e non più in un magazzino vuoto.
      void attachUser(next.uid);
      const enrolled = isBiometricEnrolled(next.uid);
      setBiometricEnrolled(enrolled);
      setUnlocked(!enrolled);
    });
  }, [configured]);

  const signIn = useCallback((provider: ProviderId): void => {
    setError(null);
    void firebaseSignIn(provider).catch((cause: unknown) => {
      setError(describe(cause));
    });
  }, []);

  const signOut = useCallback((): void => {
    setError(null);
    void firebaseSignOut();
  }, []);

  const unlock = useCallback((): void => {
    if (account === null) return;
    setError(null);
    void unlockWithBiometric(account.uid).then((ok) => {
      if (ok) setUnlocked(true);
      else setError('Sblocco non riuscito.');
    });
  }, [account]);

  const enableBiometric = useCallback((): void => {
    if (account === null) return;
    setError(null);
    const label = account.email ?? account.displayName ?? 'Shadow';
    void enrollBiometric(account.uid, label).then((ok) => {
      setBiometricEnrolled(ok);
      if (!ok) setError('Registrazione biometrica non riuscita.');
    });
  }, [account]);

  const disableBiometric = useCallback((): void => {
    if (account === null) return;
    forgetBiometric(account.uid);
    setBiometricEnrolled(false);
    setUnlocked(true);
  }, [account]);

  const state: AuthState = !configured
    ? 'config-missing'
    : !resolved
      ? 'loading'
      : account === null
        ? 'signed-out'
        : unlocked
          ? 'ready'
          : 'locked';

  return {
    state,
    account,
    missingKeys,
    error,
    biometricAvailable,
    biometricEnrolled,
    signIn,
    signOut,
    unlock,
    enableBiometric,
    disableBiometric,
  };
}
