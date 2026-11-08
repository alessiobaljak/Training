import { findExercise } from '../data/exercises.ts';
import { ALL_SESSIONS } from '../data/sessions.ts';
import { summarizeExercise } from './metrics.ts';
import type {
  ExerciseSlug,
  LevelIndex,
  LoggedSession,
  SessionId,
} from '../types/index.ts';

/**
 * Righe del log e storia di un esercizio.
 *
 * Un solo posto costruisce le righe: la tabella a schermo e l'export CSV
 * leggono da qui, così non possono divergere.
 */

const SESSION_NAMES: ReadonlyMap<SessionId, string> = new Map(
  ALL_SESSIONS.map((session) => [session.id, session.name]),
);

export interface LogRow {
  readonly sessionLogId: string;
  /** Data in formato YYYY-MM-DD. */
  readonly date: string;
  readonly week: number;
  readonly sessionId: SessionId;
  readonly sessionName: string;
  readonly blockCode: string;
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly variantLabel: string;
  readonly level: LevelIndex | null;
  readonly loadKg: number;
  /** Una voce per serie: "8" sui bilaterali, "8/7" su quelli per lato. */
  readonly setLabels: readonly string[];
  /** Valore di ogni serie, i due lati sommati. Serve ai grafici. */
  readonly setTotals: readonly number[];
  readonly meanRir: number | null;
  readonly total: number;
  readonly note: string | null;
}

export function logRows(sessions: readonly LoggedSession[]): LogRow[] {
  const ordered = [...sessions].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1,
  );

  return ordered.flatMap((session) =>
    session.exercises
      .filter((logged) => logged.sets.length > 0)
      .map<LogRow>((logged) => {
        const summary = summarizeExercise(logged);
        return {
          sessionLogId: session.id,
          date: session.date,
          week: session.week,
          sessionId: session.sessionId,
          sessionName: SESSION_NAMES.get(session.sessionId) ?? session.sessionId,
          blockCode: logged.blockCode,
          exercise: logged.exercise,
          exerciseName: findExercise(logged.exercise)?.name ?? logged.exercise,
          variantLabel: logged.variantLabel,
          level: logged.level,
          loadKg: summary.maxLoadKg,
          setLabels: summary.sets.map((entry) => entry.label),
          setTotals: summary.sets.map((entry) => entry.total),
          meanRir: summary.meanRir,
          total: summary.totalValue,
          note: logged.note,
        };
      }),
  );
}

export interface LogFilter {
  readonly exercise?: ExerciseSlug;
  readonly sessionId?: SessionId;
  /** Estremi inclusi, in formato YYYY-MM-DD. */
  readonly from?: string;
  readonly to?: string;
}

export function filterLogRows(rows: readonly LogRow[], filter: LogFilter): LogRow[] {
  return rows.filter(
    (row) =>
      (filter.exercise === undefined || row.exercise === filter.exercise) &&
      (filter.sessionId === undefined || row.sessionId === filter.sessionId) &&
      (filter.from === undefined || row.date >= filter.from) &&
      (filter.to === undefined || row.date <= filter.to),
  );
}

/* -------------------------------------------------------------------------- */
/* Storia di un esercizio                                                      */
/* -------------------------------------------------------------------------- */

export interface HistoryPoint extends LogRow {
  /**
   * Il livello è cambiato rispetto alla volta precedente.
   *
   * Serve ai marker verticali del grafico: senza, un salto di variante
   * sembrerebbe un crollo, quando invece è la prova che il carico è aumentato.
   */
  readonly levelChanged: boolean;
  /** La zavorra è cambiata rispetto alla volta precedente. */
  readonly loadChanged: boolean;
}

export function exerciseHistory(
  sessions: readonly LoggedSession[],
  exercise: ExerciseSlug,
): HistoryPoint[] {
  const rows = filterLogRows(logRows(sessions), { exercise });

  return rows.map((row, index) => {
    const before = index === 0 ? undefined : rows[index - 1];
    return {
      ...row,
      levelChanged: before !== undefined && before.level !== row.level,
      loadChanged: before !== undefined && before.loadKg !== row.loadKg,
    };
  });
}

/** Esercizi che compaiono nel log, in ordine alfabetico. */
export function loggedExerciseSlugs(sessions: readonly LoggedSession[]): ExerciseSlug[] {
  const slugs = new Set(logRows(sessions).map((row) => row.exercise));
  return [...slugs].sort((a, b) => {
    const nameA = findExercise(a)?.name ?? a;
    const nameB = findExercise(b)?.name ?? b;
    return nameA.localeCompare(nameB, 'it');
  });
}

/** Numero massimo di serie registrate in un insieme di righe. */
export function maxSetCount(rows: readonly LogRow[]): number {
  return rows.reduce((max, row) => Math.max(max, row.setLabels.length), 0);
}
