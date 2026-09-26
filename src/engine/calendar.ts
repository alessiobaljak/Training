import { getSession, getSessionForWeekday, isRestDay } from '../data/program.ts';
import { getExercise } from '../data/exercises.ts';
import { addDays, isoWeekday } from './dates.ts';
import type { MuscleGroup, ProgramSession, SessionId, WeekdayIndex } from '../types/index.ts';

/**
 * Le sedute spostate di giorno.
 *
 * Il programma assegna una seduta a ogni giorno della settimana, e per sei
 * settimane è andata bene finché la vita non si è messa in mezzo: un sabato in
 * cui non si allena e una domenica in cui si allenerebbe volentieri. Senza un
 * modo di dirlo, l'unica strada era aprire la seduta del sabato di domenica e
 * ritrovarsela segnata come «fuori posto», cioè come un errore.
 *
 * Uno spostamento è una riga sola: in questa data si fa questa seduta. Il
 * calendario del programma resta quello che è e non viene mai riscritto —
 * quello che cambia è dove lo si legge.
 */

export interface SessionMove {
  /** Data in formato YYYY-MM-DD. */
  readonly date: string;
  /** La seduta da fare quel giorno. `null` quando quel giorno si riposa. */
  readonly sessionId: SessionId | null;
}

/** Lo spostamento che riguarda una data, se c'è. */
function moveFor(date: string, moves: readonly SessionMove[]): SessionMove | undefined {
  return moves.find((move) => move.date === date);
}

/** Cosa prescrive il calendario per quel giorno, senza guardare gli spostamenti. */
export function scheduledForDate(date: string): ProgramSession | null {
  return getSessionForWeekday(isoWeekday(date));
}

/**
 * Cosa si allena in quella data: prima lo spostamento, poi il calendario.
 *
 * `null` vuol dire riposo, e lo vuol dire in due casi che l'app tiene
 * distinti: il giorno di riposo del programma, e un giorno svuotato perché la
 * sua seduta è stata spostata altrove.
 */
export function sessionForDate(
  date: string,
  moves: readonly SessionMove[] = [],
): ProgramSession | null {
  const move = moveFor(date, moves);
  if (move !== undefined) return move.sessionId === null ? null : getSession(move.sessionId);
  return scheduledForDate(date);
}

/** `true` quando quella data non ha la seduta che il calendario le darebbe. */
export function isMoved(date: string, moves: readonly SessionMove[] = []): boolean {
  const move = moveFor(date, moves);
  if (move === undefined) return false;
  return move.sessionId !== (scheduledForDate(date)?.id ?? null);
}

/* -------------------------------------------------------------------------- */
/* Spostare                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Sposta quello che c'è in `from` dentro `to`, e viceversa.
 *
 * È uno scambio, non un trasloco, e non è un dettaglio: quando la data di
 * arrivo è libera — la domenica — lo scambio svuota il giorno di partenza, che
 * è esattamente «oggi non alleno, lo faccio domani». Quando invece è occupata,
 * le due sedute si scambiano di posto invece di sovrascriversi, che è l'unica
 * cosa che si può fare senza far sparire del lavoro.
 *
 * E siccome è uno scambio, farlo due volte riporta tutto com'era.
 *
 * Restituisce le righe da salvare: quelle che tornano a coincidere con il
 * calendario hanno `sessionId` uguale a quello del giorno, e chi salva le
 * cancella invece di scriverle.
 */
export function swapDays(
  from: string,
  to: string,
  moves: readonly SessionMove[] = [],
): SessionMove[] {
  if (from === to) return [];
  return [
    { date: from, sessionId: sessionForDate(to, moves)?.id ?? null },
    { date: to, sessionId: sessionForDate(from, moves)?.id ?? null },
  ];
}

/** Applica gli scambi a un elenco, togliendo le righe tornate uguali al calendario. */
export function applyMoves(
  moves: readonly SessionMove[],
  changes: readonly SessionMove[],
): SessionMove[] {
  const byDate = new Map(moves.map((move) => [move.date, move]));
  for (const change of changes) byDate.set(change.date, change);
  return [...byDate.values()]
    .filter((move) => move.sessionId !== (scheduledForDate(move.date)?.id ?? null))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/* -------------------------------------------------------------------------- */
/* Cosa comporta                                                               */
/* -------------------------------------------------------------------------- */

export interface NextTraining {
  /** Data del prossimo giorno con una seduta, YYYY-MM-DD. */
  readonly date: string;
  readonly weekday: WeekdayIndex;
  /** Quanti giorni mancano: 1 è domani. */
  readonly inDays: number;
}

/**
 * Il primo giorno di allenamento dopo `date`.
 *
 * Dire «finita» senza dire quando si torna lascia a metà. Guarda anche gli
 * spostamenti: dopo aver spostato il sabato alla domenica, il prossimo
 * allenamento è domenica, non lunedì.
 */
export function nextTrainingDay(
  date: string,
  moves: readonly SessionMove[] = [],
): NextTraining | null {
  for (let inDays = 1; inDays <= 14; inDays += 1) {
    const candidate = addDays(date, inDays);
    if (sessionForDate(candidate, moves) !== null) {
      return { date: candidate, weekday: isoWeekday(candidate), inDays };
    }
  }
  return null;
}

/**
 * Quanti giorni di allenamento di fila finiscono in `date`, quel giorno
 * compreso.
 *
 * Spostare una seduta nel giorno di riposo toglie il riposo, e quella è una
 * conseguenza che va detta prima, non scoperta il mercoledì dopo con le spalle
 * a pezzi.
 */
export function consecutiveTrainingDays(
  date: string,
  moves: readonly SessionMove[] = [],
): number {
  if (sessionForDate(date, moves) === null) return 0;
  let giorni = 1;
  for (let indietro = 1; indietro <= 30; indietro += 1) {
    if (sessionForDate(addDays(date, -indietro), moves) === null) break;
    giorni += 1;
  }
  for (let avanti = 1; avanti <= 30; avanti += 1) {
    if (sessionForDate(addDays(date, avanti), moves) === null) break;
    giorni += 1;
  }
  return giorni;
}

/** I gruppi muscolari che due sedute caricano tutti e due in via diretta. */
export function sharedMuscles(a: ProgramSession, b: ProgramSession): MuscleGroup[] {
  const gruppi = (session: ProgramSession): Set<MuscleGroup> =>
    new Set(session.blocks.flatMap((block) => getExercise(block.exercise).primaryMuscles));
  const primi = gruppi(a);
  return [...gruppi(b)].filter((gruppo) => primi.has(gruppo));
}

export interface MoveWarning {
  /** Giorni di allenamento di fila che lo spostamento produce. */
  readonly inARow: number;
  /** Gruppi condivisi con la seduta del giorno prima, se ce n'è una. */
  readonly backToBack: MuscleGroup[];
}

/**
 * Cosa comporta fare quella seduta in quella data. Sono conti, non opinioni:
 * quanti giorni di fila si allena e cosa si ripete rispetto al giorno prima.
 */
export function moveWarning(date: string, moves: readonly SessionMove[] = []): MoveWarning | null {
  const seduta = sessionForDate(date, moves);
  if (seduta === null) return null;
  const prima = sessionForDate(addDays(date, -1), moves);
  return {
    inARow: consecutiveTrainingDays(date, moves),
    backToBack: prima === null ? [] : sharedMuscles(prima, seduta),
  };
}

/** I giorni di riposo del programma, per spiegare dove si può spostare. */
export function isProgramRestDay(date: string): boolean {
  return isRestDay(isoWeekday(date));
}
