import { CIRCUIT_ORDER, findCircuitSession, isCircuitSessionId } from '../data/circuit.ts';
import { getExercise } from '../data/exercises.ts';
import { addDays, daysBetween } from './dates.ts';
import type {
  CircuitSessionId,
  LoggedSession,
  MuscleGroup,
  ProgramSession,
} from '../types/index.ts';

/**
 * Cosa allenare, senza calendario.
 *
 * Lo Shadow assegnava una seduta a ogni giorno della settimana, e quello
 * portava con sé un problema che non valeva la pena di avere: ogni volta che
 * la vita si metteva in mezzo bisognava *spostare* una seduta, cioè dire
 * all'app che oggi non è il giorno che il calendario crede. Tutta la macchina
 * degli spostamenti esisteva per rimediare a un vincolo che nessuno aveva
 * chiesto.
 *
 * Qui il vincolo non c'è. Le quattro sedute stanno in un ordine e si fanno in
 * quell'ordine, quando capita. «Prossima» non vuol dire «oggi»: vuol dire la
 * successiva a quella che hai chiuso per ultima, e aprirne un'altra non è un
 * errore e non viene segnalato come tale.
 *
 * Quello che il calendario proteggeva, però, resta da proteggere: allenarsi
 * cinque giorni di fila, o caricare gli stessi muscoli due giorni consecutivi,
 * sono cose che vale la pena di sapere **prima**. La differenza è che adesso
 * la risposta si legge nel diario invece che nel calendario — che è anche più
 * vero, perché il diario dice cosa hai fatto e il calendario diceva cosa
 * avresti dovuto fare.
 */

/* -------------------------------------------------------------------------- */
/* L'ultima seduta chiusa                                                      */
/* -------------------------------------------------------------------------- */

/**
 * L'ultima seduta del programma attivo portata a termine.
 *
 * `listSessions` ordina per data crescente e, a pari data, per id: l'ultima
 * della lista è la più recente. Le sedute archiviate dello Shadow non contano
 * — la rotazione è quella dei circuiti — e nemmeno quelle lasciate aperte.
 */
export function lastCompletedCircuit(
  sessions: readonly LoggedSession[],
): LoggedSession | null {
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    const session = sessions[index];
    if (session === undefined) continue;
    if (session.status !== 'completed') continue;
    if (!isCircuitSessionId(session.sessionId)) continue;
    return session;
  }
  return null;
}

/** La seduta che viene dopo quella indicata, girando in tondo. */
export function sessionAfter(id: CircuitSessionId): CircuitSessionId {
  const index = CIRCUIT_ORDER.indexOf(id);
  /* Un id fuori dalla rotazione riporta all'inizio invece di sparire. */
  if (index === -1) return CIRCUIT_ORDER[0] ?? 'circuito-1';
  return CIRCUIT_ORDER[(index + 1) % CIRCUIT_ORDER.length] ?? 'circuito-1';
}

/* -------------------------------------------------------------------------- */
/* Quello che il calendario proteggeva                                         */
/* -------------------------------------------------------------------------- */

/** I gruppi muscolari che due sedute caricano tutte e due in via diretta. */
export function sharedMuscles(a: ProgramSession, b: ProgramSession): MuscleGroup[] {
  const gruppi = (session: ProgramSession): Set<MuscleGroup> =>
    new Set(session.blocks.flatMap((block) => getExercise(block.exercise).primaryMuscles));
  const primi = gruppi(a);
  return [...gruppi(b)].filter((gruppo) => primi.has(gruppo));
}

/**
 * Giorni di allenamento consecutivi che finiscono in `date`, quel giorno
 * compreso.
 *
 * Letto dal diario: conta i giorni in cui *risulta* una seduta chiusa, non
 * quelli in cui il programma ne prevedeva una.
 */
export function trainingDaysInARow(
  date: string,
  sessions: readonly LoggedSession[],
): number {
  const chiuse = new Set(
    sessions.filter((session) => session.status === 'completed').map((session) => session.date),
  );
  if (!chiuse.has(date)) return 0;
  let giorni = 1;
  for (let indietro = 1; indietro <= 30; indietro += 1) {
    if (!chiuse.has(addDays(date, -indietro))) break;
    giorni += 1;
  }
  return giorni;
}

/* -------------------------------------------------------------------------- */
/* Lo stato della rotazione                                                    */
/* -------------------------------------------------------------------------- */

export interface RotationState {
  /** La seduta consigliata: la successiva all'ultima chiusa. */
  readonly next: CircuitSessionId;
  /** L'ultima seduta chiusa del programma attivo, se c'è. */
  readonly last: LoggedSession | null;
  /** Giorni passati dall'ultima seduta chiusa. `null` quando non ce n'è una. */
  readonly daysSince: number | null;
  /**
   * Gruppi muscolari che la prossima ripete rispetto all'ultima, quando
   * l'ultima è di ieri o di oggi. Vuoto quando è passato più tempo: a due
   * giorni di distanza non è più una sovrapposizione, è la settimana normale.
   */
  readonly repeatedMuscles: readonly MuscleGroup[];
  /** Giorni di allenamento di fila che finiscono oggi, oggi compreso. */
  readonly inARow: number;
}

/** Oltre questa distanza due sedute non si pestano più i piedi. */
export const OVERLAP_DAYS = 1;

/** Da qui in su vale la pena dirlo. */
export const IN_A_ROW_WARNING = 3;

/**
 * Dove sta la rotazione, visto da `today`.
 *
 * Non decide niente e non blocca niente: dice quale seduta viene dopo e cosa
 * c'è da sapere se la si fa adesso.
 */
export function rotationState(
  today: string,
  sessions: readonly LoggedSession[],
): RotationState {
  const last = lastCompletedCircuit(sessions);
  const next =
    last === null || !isCircuitSessionId(last.sessionId)
      ? (CIRCUIT_ORDER[0] ?? 'circuito-1')
      : sessionAfter(last.sessionId);

  const daysSince = last === null ? null : daysBetween(last.date, today);

  const prossima = findCircuitSession(next);
  const precedente = last === null ? undefined : findCircuitSession(last.sessionId);
  const repeatedMuscles =
    prossima === undefined ||
    precedente === undefined ||
    daysSince === null ||
    daysSince > OVERLAP_DAYS
      ? []
      : sharedMuscles(precedente, prossima);

  return {
    next,
    last,
    daysSince,
    repeatedMuscles,
    inARow: trainingDaysInARow(today, sessions),
  };
}
