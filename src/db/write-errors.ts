/**
 * L'ultimo errore di scrittura, per non perderlo in silenzio.
 *
 * Da quando i dati stanno su Firestore, una scrittura non aspetta più il
 * server: viene applicata subito in locale e sincronizzata dopo. È quello che
 * permette di registrare una serie in palestra senza campo. Il prezzo è che
 * un rifiuto del server arriva tardi, quando chi ha premuto il pulsante è già
 * andato avanti.
 *
 * Qui quel rifiuto viene tenuto e mostrato. Un dato di allenamento che sparisce
 * senza dire niente è il difetto peggiore che questa app possa avere.
 */

let lastError: string | null = null;
const listeners = new Set<() => void>();

export function describeWriteError(cause: unknown): string {
  const code =
    typeof cause === 'object' && cause !== null && 'code' in cause
      ? String((cause as { code: unknown }).code)
      : '';

  if (code === 'permission-denied') {
    return (
      'Firestore ha rifiutato la scrittura. Quasi sempre significa che le regole di sicurezza ' +
      'non sono state pubblicate: un database creato in modalità produzione nasce chiuso a ' +
      'tutti. Si pubblicano dalla console Firebase, Firestore Database, scheda Regole. ' +
      'Il testo da incollare è in firestore.rules, e il passo 5 di docs/configurazione.md ' +
      'spiega come.'
    );
  }
  if (code === 'unauthenticated') {
    return 'La sessione è scaduta. Esci e rientra.';
  }
  if (code === 'resource-exhausted') {
    return 'Il progetto Firebase ha superato le sue quote gratuite.';
  }
  return cause instanceof Error ? cause.message : 'Una modifica non è stata salvata sul server.';
}

export function reportWriteError(cause: unknown): void {
  lastError = describeWriteError(cause);
  for (const listener of listeners) listener();
}

export function clearWriteError(): void {
  if (lastError === null) return;
  lastError = null;
  for (const listener of listeners) listener();
}

export function getWriteError(): string | null {
  return lastError;
}

export function subscribeWriteErrors(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
