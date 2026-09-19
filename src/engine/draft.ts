import { getProgressionStep } from '../data/progressions.ts';
import type {
  Exercise,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  ProgramBlock,
  ProgramSession,
  Side,
} from '../types/index.ts';
import { findExercise, getExercise } from '../data/exercises.ts';
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
      tempoRespected: null,
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

/**
 * Il blocco con dentro l'esercizio davvero scelto.
 *
 * Dove la scheda ammette due esercizi con misure diverse — il C2 del Lower A:
 * sissy squat a ripetizioni, wall sit a secondi — la scelta cambia anche la
 * prescrizione. Sta qui e non nella UI perché il primo tentativo l'aveva
 * risolto solo nel player: il riepilogo di fine seduta continuava a leggere il
 * blocco dichiarato e analizzava i secondi del wall sit come se fossero
 * ripetizioni di sissy squat. Una volta sola, per tutti.
 */
export function effectiveBlock(block: ProgramBlock, session: LoggedSession): ProgramBlock {
  const chosen = findLoggedExercise(session, block.code)?.exercise;
  if (chosen === undefined || chosen === block.exercise) return block;
  const alternative = (block.alternatives ?? []).find((entry) => entry.exercise === chosen);
  if (alternative === undefined) return block;
  return { ...block, exercise: alternative.exercise, prescription: alternative.prescription };
}

/**
 * Cambia quale dei due esercizi ammessi dal blocco si sta facendo.
 *
 * Non è un cambio di variante: sissy squat e wall sit sono esercizi diversi,
 * con misure diverse. Le serie già registrate se ne vanno insieme
 * all'esercizio, perché ripetizioni e secondi non si sommano e tenerle
 * significherebbe archiviare secondi sotto la voce delle ripetizioni.
 */
export function setBlockExercise(
  session: LoggedSession,
  blockCode: string,
  exercise: ExerciseSlug,
  variantLabel: string,
): LoggedSession {
  return replaceExercise(session, blockCode, (entry) =>
    entry.exercise === exercise
      ? entry
      : { ...entry, exercise, variantLabel, level: null, sets: [] },
  );
}

export function setTempoRespected(
  session: LoggedSession,
  blockCode: string,
  tempoRespected: boolean | null,
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

/* -------------------------------------------------------------------------- */
/* Quello che scrivi torna nello stato                                         */
/* -------------------------------------------------------------------------- */

/**
 * Stati aggiornati con quello che la seduta ha davvero registrato.
 *
 * `ExerciseState` era scritto solo accettando un suggerimento, e il carico non
 * lo leggeva nessuno: il player precompilava i kg dall'ultima riga di log, non
 * dallo stato. Accettare «aggiungi zavorra» cambiava quindi un numero che
 * nessuno guardava, e la volta dopo ricompariva il peso vecchio.
 *
 * Qui lo stato diventa quello che è sempre dovuto essere: il carico e il
 * gradino attuali. Si sincronizza alla chiusura della seduta, così una
 * correzione fatta a mano nel player — due kg in più di manubrio, un livello
 * sceso perché oggi non ne usciva una — vale come una decisione presa, senza
 * doverla ripetere in un'altra schermata.
 *
 * Restituisce solo gli stati cambiati: chi chiama li salva, e una seduta che
 * non ha spostato niente non riscrive niente.
 */
export function syncStatesFromLog(
  session: LoggedSession,
  states: ReadonlyMap<ExerciseSlug, ExerciseState>,
): ExerciseState[] {
  const changed: ExerciseState[] = [];

  for (const logged of session.exercises) {
    if (logged.sets.length === 0) continue;

    /*
     * Una bozza aperta prima di un cambio di anagrafica può contenere uno slug
     * che non esiste più — è successo davvero, spezzando «sissy squat o wall
     * sit» in due esercizi a metà settimana. `getExercise` lancia: farlo qui
     * vorrebbe dire una seduta che non si chiude più.
     */
    const exercise = findExercise(logged.exercise);
    if (exercise === undefined) continue;

    const before = states.get(logged.exercise) ?? {
      exercise: logged.exercise,
      level: logged.level,
      eccentricBonusSeconds: 0,
      bottomPauseBonusSeconds: 0,
      loadKg: 0,
    };

    /*
     * Il carico si prende dal massimo registrato, non dall'ultima serie: chi
     * cala all'ultima serie perché era finita non ha cambiato manubrio.
     * Dove il peso non è registrabile resta quello che c'era: uno zero scritto
     * in un campo che non esiste cancellerebbe una zavorra vera.
     */
    const maxLoad = logged.sets.reduce((max, set) => Math.max(max, set.loadKg), 0);
    const loadKg = exercise.loadPolicy === 'forbidden' ? before.loadKg : maxLoad;
    const level = logged.level ?? before.level;

    if (level === before.level && loadKg === before.loadKg) continue;
    changed.push({ ...before, level, loadKg });
  }

  return changed;
}
