/**
 * Sblocco con Face ID (o Touch ID, o l'impronta su Android).
 *
 * Da chiarire subito, perché il nome inganna: **Face ID non è un metodo di
 * accesso sul web.** Nessun sito può chiedere «entra con Face ID». Quello che
 * si può fare è WebAuthn con l'autenticatore di piattaforma, che su iPhone
 * fa comparire proprio Face ID, e usarlo come lucchetto sopra una sessione
 * Firebase già aperta.
 *
 * Cosa protegge davvero: che chi prende in mano il tuo telefono sbloccato non
 * apra l'app e legga il tuo storico. È una tenda, non una cassaforte: senza
 * un server che verifichi la firma, chi sa usare gli strumenti da sviluppatore
 * la scavalca. Per quel livello servirebbe un backend, e qui non c'è.
 *
 * L'accesso vero resta Google o Apple. Questo è il giro dal secondo avvio in
 * poi, quando la sessione c'è già.
 */

const STORAGE_PREFIX = 'shadow.biometric.';

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

export function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/*
 * Le API WebAuthn vogliono un `BufferSource` appoggiato a un ArrayBuffer vero.
 * TypeScript distingue un Uint8Array su ArrayBuffer da uno su memoria condivisa,
 * quindi qui si restituisce sempre l'ArrayBuffer e non la vista sopra.
 */
export function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return buffer;
}

function toBuffer(source: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(source.byteLength);
  new Uint8Array(buffer).set(source);
  return buffer;
}

function randomChallenge(): ArrayBuffer {
  const buffer = new ArrayBuffer(32);
  crypto.getRandomValues(new Uint8Array(buffer));
  return buffer;
}

/** Il browser espone WebAuthn e il telefono ha un sensore biometrico. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('PublicKeyCredential' in window)) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** L'utente ha già registrato il volto o l'impronta su questo dispositivo. */
export function isBiometricEnrolled(uid: string): boolean {
  try {
    return localStorage.getItem(storageKey(uid)) !== null;
  } catch {
    return false;
  }
}

export function forgetBiometric(uid: string): void {
  try {
    localStorage.removeItem(storageKey(uid));
  } catch {
    /* niente storage, niente da dimenticare */
  }
}

/**
 * Registra il volto o l'impronta per questo account su questo dispositivo.
 * Va rifatta su ogni telefono: la chiave non lascia il dispositivo.
 */
export async function enrollBiometric(uid: string, label: string): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;

  const created = await navigator.credentials
    .create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: 'Shadow' },
        user: { id: toBuffer(new TextEncoder().encode(uid)), name: label, displayName: label },
        // ES256 e RS256: coprono l'autenticatore di piattaforma di iOS e Android.
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
        attestation: 'none',
      },
    })
    .catch(() => null);

  if (created === null) return false;

  try {
    localStorage.setItem(storageKey(uid), toBase64Url((created as PublicKeyCredential).rawId));
  } catch {
    return false;
  }
  return true;
}

/** Chiede il volto o l'impronta. `false` se l'utente annulla o fallisce. */
export async function unlockWithBiometric(uid: string): Promise<boolean> {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(storageKey(uid));
  } catch {
    return false;
  }
  if (stored === null) return false;

  const assertion = await navigator.credentials
    .get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(stored) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    })
    .catch(() => null);

  return assertion !== null;
}
