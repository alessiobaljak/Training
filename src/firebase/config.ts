/**
 * Configurazione Firebase, presa dalle variabili d'ambiente.
 *
 * Questi valori NON sono segreti: finiscono nel bundle e chiunque apra
 * l'app può leggerli. È il funzionamento previsto di Firebase sul web. Quello
 * che protegge i dati sono le regole di Firestore, che vivono in
 * `firestore.rules` e girano sul server: senza un utente autenticato non si
 * legge e non si scrive niente.
 *
 * Stanno comunque in variabili d'ambiente per poter cambiare progetto senza
 * toccare il codice.
 */

export interface FirebaseConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
}

const KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export type ConfigKey = (typeof KEYS)[number];

/** Le variabili mancanti, in modo che la UI possa dire quali invece di «errore». */
export function missingConfigKeys(
  env: Record<string, string | undefined> = import.meta.env as unknown as Record<
    string,
    string | undefined
  >,
): ConfigKey[] {
  return KEYS.filter((key) => {
    const value = env[key];
    return value === undefined || value.trim() === '';
  });
}

export function readConfig(
  env: Record<string, string | undefined> = import.meta.env as unknown as Record<
    string,
    string | undefined
  >,
): FirebaseConfig | null {
  if (missingConfigKeys(env).length > 0) return null;
  return {
    apiKey: env['VITE_FIREBASE_API_KEY'] ?? '',
    authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'] ?? '',
    projectId: env['VITE_FIREBASE_PROJECT_ID'] ?? '',
    storageBucket: env['VITE_FIREBASE_STORAGE_BUCKET'] ?? '',
    messagingSenderId: env['VITE_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    appId: env['VITE_FIREBASE_APP_ID'] ?? '',
  };
}

/**
 * Host degli emulatori, per i test e per lo sviluppo senza toccare i dati veri.
 * Con questa variabile impostata l'app non parla mai con Google.
 */
export function emulatorHost(
  env: Record<string, string | undefined> = import.meta.env as unknown as Record<
    string,
    string | undefined
  >,
): string | null {
  const value = env['VITE_FIREBASE_EMULATOR_HOST'];
  return value === undefined || value.trim() === '' ? null : value.trim();
}
