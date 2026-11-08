import { CIRCUIT_ORDER, CIRCUIT_SESSIONS, isCircuitSessionId } from './circuit.ts';
import { PROGRAM_SESSIONS } from './program.ts';
import type { CircuitSessionId, ProgramSession, SessionId } from '../types/index.ts';

/**
 * Tutte le sedute: quelle attive e quelle archiviate, in un posto solo.
 *
 * Serve perché il diario non distingue. Una riga di log del 14 ottobre cita
 * `upper-b`, una del 9 novembre cita `circuito-2`, e la schermata Log le deve
 * mostrare entrambe con il loro nome. Chi parte da un `sessionId` letto dal
 * database passa da qui; chi deve proporre cosa allenare parte da
 * `ACTIVE_SESSIONS`, che contiene solo i quattro circuiti.
 */

/** Il programma attivo. È questo che l'app propone. */
export const ACTIVE_SESSIONS: readonly ProgramSession[] = CIRCUIT_SESSIONS;

/** Lo Shadow. Si legge nello storico, non si fa più. */
export const ARCHIVED_SESSIONS: readonly ProgramSession[] = PROGRAM_SESSIONS;

export const ALL_SESSIONS: readonly ProgramSession[] = Object.freeze([
  ...ACTIVE_SESSIONS,
  ...ARCHIVED_SESSIONS,
]);

export const ALL_SESSION_IDS: readonly string[] = ALL_SESSIONS.map((session) => session.id);

const BY_ID: ReadonlyMap<string, ProgramSession> = new Map(
  ALL_SESSIONS.map((session) => [session.id, session]),
);

export function findAnySession(id: string): ProgramSession | undefined {
  return BY_ID.get(id);
}

/**
 * Come `findAnySession`, ma solleva: uno slug sconosciuto è un bug del seed.
 *
 * Attenzione a non chiamarla su un id che arriva dal database senza averlo
 * prima verificato con `findAnySession`: un log salvato da una versione futura
 * non deve far cadere la schermata.
 */
export function getAnySession(id: SessionId): ProgramSession {
  const session = BY_ID.get(id);
  if (session === undefined) {
    throw new Error(`Seduta sconosciuta: ${id}`);
  }
  return session;
}

/** `true` quando quella seduta fa parte del programma attivo. */
export function isActiveSession(id: string): id is CircuitSessionId {
  return isCircuitSessionId(id);
}

export { CIRCUIT_ORDER };
