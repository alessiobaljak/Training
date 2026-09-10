import { getProgressionStep } from '../data/progressions.ts';
import type {
  Exercise,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  ProgramSession,
  Side,
} from '../types/index.ts';
import { getExercise } from '../data/exercises.ts';
import { effectiveSets } from './schedule.ts';
import type { SessionStep } from './rest.ts';

/**
 * Bozza di seduta: la struttura che il player riempie serie dopo serie.
 *
 * Tutte le funzioni qui sono pure e restituiscono un oggetto nuovo. La bozza
 * viene riscritta nel database a ogni modifica, ed è quello che permette di
 * chiudere l'app a metà seduta e riprenderla dove era rimasta.
 */

/** Etichetta di partenza del campo Variante/Livello, come nel foglio Log. */
export function variantLabelFor(exercise: Exercise, state: ExerciseState): string {
  if (exercise.pattern === null || state.level === null) return exercise.name;
  const step = getProgressionStep(exercise.pattern, state.level);
  return `Liv. ${String(state.level)} · ${step.name}`;
}

export interface DraftParams {
  readonly id: string;
  readonly date: string;
  readonly week: number;
  readonly session: ProgramSession;
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  /** Ultima registrazione per blocco, da cui precompilare zavorra e variante. */
  readonly previous: ReadonlyMap<string, LoggedExercise>;
}

/**
 * Crea la bozza con una riga per blocco e nessuna serie.
 *
 * Le serie nascono solo quando l'utente conferma "serie fatta": una riga
 * precompilata e mai confermata registrerebbe i numeri della settimana scorsa
 * come se fossero di oggi.
 */
export function buildDraftSession(params: DraftParams): LoggedSession {
  const { id, date, week, session, states, previous } = params;

  const exercises = session.blocks.map<LoggedExercise>((block) => {
    const exercise = getExercise(block.exercise);
    const state = states.get(block.exercise);
    const past = previous.get(block.code);
    return {
      blockCode: block.code,
      exercise: block.exercise,
      variantLabel: past?.variantLabel ?? (state === undefined ? exercise.name : variantLabelFor(exercise, state)),
      level: state?.level ?? exercise.defaultLevel,
      tempoRespected: true,
      sets: [],
      note: null,
    };
  });

  return { id, date, week, sessionId: session.id, status: 'in-progress', exercises, note: null };
}

export function findLoggedExercise(
  session: LoggedSession,
  blockCode: string,
): LoggedExercise | undefined {
  return session.exercises.find((entry) => entry.blockCode === blockCode);
}

function replaceExercise(
  session: LoggedSession,
  blockCode: string,
  update: (entry: LoggedExercise) => LoggedExercise,
): LoggedSession {
  return {
    ...session,
    exercises: session.exercises.map((entry) =>
      entry.blockCode === blockCode ? update(entry) : entry,
    ),
  };
}

/** Inserisce o sostituisce una serie. La chiave è indice più lato. */
export function upsertLoggedSet(
  session: LoggedSession,
  blockCode: string,
  set: LoggedSet,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => {
    const others = entry.sets.filter(
      (existing) => !(existing.setIndex === set.setIndex && existing.side === set.side),
    );
    return {
      ...entry,
      sets: [...others, set].sort(
        (a, b) => a.setIndex - b.setIndex || (a.side ?? '').localeCompare(b.side ?? ''),
      ),
    };
  });
}

export function removeLoggedSet(
  session: LoggedSession,
  blockCode: string,
  setIndex: number,
  side: Side | null,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({
    ...entry,
    sets: entry.sets.filter((set) => !(set.setIndex === setIndex && set.side === side)),
  }));
}

export function setVariant(
  session: LoggedSession,
  blockCode: string,
  variantLabel: string,
  level: LevelIndex | null,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({ ...entry, variantLabel, level }));
}

export function setTempoRespected(
  session: LoggedSession,
  blockCode: string,
  tempoRespected: boolean,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({ ...entry, tempoRespected }));
}

export function setExerciseNote(
  session: LoggedSession,
  blockCode: string,
  note: string | null,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) => ({ ...entry, note }));
}

export function setSessionNote(session: LoggedSession, note: string | null): LoggedSession {
  return { ...session, note };
}

export function closeSession(session: LoggedSession): LoggedSession {
  return { ...session, status: 'completed' };
}

/* -------------------------------------------------------------------------- */
/* Avanzamento nel piano                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Una serie è fatta quando esiste il dato che la scheda chiede.
 * Sugli esercizi per lato servono entrambi i lati: mezza serie registrata non
 * è una serie.
 */
export function isStepLogged(session: LoggedSession, step: SessionStep): boolean {
  const entry = findLoggedExercise(session, step.blockCode);
  if (entry === undefined) return false;
  const rows = entry.sets.filter((set) => set.setIndex === step.setIndex);
  if (step.perSide) {
    return rows.some((set) => set.side === 'left') && rows.some((set) => set.side === 'right');
  }
  return rows.some((set) => set.side === null);
}

export interface SessionProgress {
  readonly done: number;
  readonly total: number;
  readonly complete: boolean;
}

export function sessionProgress(
  session: LoggedSession,
  plan: readonly SessionStep[],
): SessionProgress {
  const done = plan.filter((step) => isStepLogged(session, step)).length;
  return { done, total: plan.length, complete: done === plan.length && plan.length > 0 };
}

/** Indice del primo passo non ancora registrato. `-1` quando è tutto fatto. */
export function firstPendingIndex(
  session: LoggedSession,
  plan: readonly SessionStep[],
): number {
  return plan.findIndex((step) => !isStepLogged(session, step));
}

/* -------------------------------------------------------------------------- */
/* Precompilazione dalla volta scorsa                                          */
/* -------------------------------------------------------------------------- */

/**
 * Ultima registrazione di un blocco, dalla seduta più recente che lo contiene
 * con almeno una serie. Serve a proporre zavorra e variante già impostate.
 */
export function lastLoggedByBlock(
  sessions: readonly LoggedSession[],
  sessionId: LoggedSession['sessionId'],
  excludeId: string,
): ReadonlyMap<string, LoggedExercise> {
  const relevant = [...sessions]
    .filter((entry) => entry.sessionId === sessionId && entry.id !== excludeId)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const byBlock = new Map<string, LoggedExercise>();
  for (const session of relevant) {
    for (const logged of session.exercises) {
      if (logged.sets.length === 0) continue;
      byBlock.set(logged.blockCode, logged);
    }
  }
  return byBlock;
}

/** Valore proposto per una serie, dalla stessa serie della volta scorsa. */
export function suggestedSetValue(
  previous: LoggedExercise | undefined,
  setIndex: number,
  side: Side | null,
): LoggedSet | undefined {
  if (previous === undefined) return undefined;
  return (
    previous.sets.find((set) => set.setIndex === setIndex && set.side === side) ??
    previous.sets.find((set) => set.side === side) ??
    previous.sets[0]
  );
}

/** Serie previste per un blocco nella settimana indicata, scarico compreso. */
export function plannedSets(session: ProgramSession, blockCode: string, week: number): number {
  const block = session.blocks.find((entry) => entry.code === blockCode);
  return block === undefined ? 0 : effectiveSets(block.sets, week);
}
