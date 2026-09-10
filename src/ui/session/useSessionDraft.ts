import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from '../../data/program.ts';
import { getExercise } from '../../data/exercises.ts';
import { repository } from '../../db/repository.ts';
import {
  buildDraftSession,
  lastLoggedByBlock,
} from '../../engine/draft.ts';
import { initialExerciseState } from '../../engine/progression.ts';
import { buildSessionPlan } from '../../engine/rest.ts';
import { programWeek } from '../../engine/schedule.ts';
import { todayIso } from '../../engine/dates.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedExercise,
  LoggedSession,
  ProgramSession,
  SessionId,
  TestId,
  TestResult,
} from '../../types/index.ts';
import type { SessionStep } from '../../engine/rest.ts';

/**
 * Bozza della seduta in corso.
 *
 * La bozza locale è la fonte di verità durante l'allenamento e viene riscritta
 * nel database a ogni modifica. Non passa da `useLiveQuery` apposta: rileggere
 * dal database dopo ogni tap farebbe sfarfallare i campi mentre si registra
 * una serie.
 */

export interface SessionDraft {
  readonly loading: boolean;
  readonly program: ProgramSession;
  readonly draft: LoggedSession | null;
  readonly plan: readonly SessionStep[];
  readonly week: number;
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  /** Esercizi di cui l'utente ha già confermato variante e livello. */
  readonly confirmed: ReadonlySet<ExerciseSlug>;
  /** Ultima registrazione per blocco, per proporre zavorra e valori. */
  readonly previous: ReadonlyMap<string, LoggedExercise>;
  readonly tests: ReadonlyMap<TestId, TestResult>;
  readonly update: (change: (session: LoggedSession) => LoggedSession) => void;
  readonly confirmExercise: (state: ExerciseState) => void;
}

export function useSessionDraft(sessionId: SessionId): SessionDraft {
  const program = useMemo(() => getSession(sessionId), [sessionId]);

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<LoggedSession | null>(null);
  const [week, setWeek] = useState(1);
  const [states, setStates] = useState<ReadonlyMap<ExerciseSlug, ExerciseState>>(new Map());
  const [confirmed, setConfirmed] = useState<ReadonlySet<ExerciseSlug>>(new Set());
  const [previous, setPrevious] = useState<ReadonlyMap<string, LoggedExercise>>(new Map());
  const [tests, setTests] = useState<ReadonlyMap<TestId, TestResult>>(new Map());
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const load = async (): Promise<void> => {
      const today = todayIso();
      const settings = await repository.readSettings();
      const currentWeek =
        settings.programStartDate === null
          ? 1
          : Math.max(1, programWeek(settings.programStartDate, today));

      const slugs = program.blocks.map((block) => block.exercise);
      const stateEntries = await Promise.all(
        slugs.map(async (slug): Promise<readonly [ExerciseSlug, ExerciseState]> => [
          slug,
          await repository.getExerciseState(slug),
        ]),
      );

      const [confirmedSlugs, latestTests, history] = await Promise.all([
        repository.getConfirmedStates(slugs),
        repository.latestTests(),
        repository.listSessions({ sessionId }),
      ]);

      /* Riprende la seduta aperta di oggi, altrimenti ne apre una nuova. */
      const open = history.find(
        (entry) => entry.status === 'in-progress' && entry.date === today,
      );
      const id = open?.id ?? `${sessionId}-${today}-${String(Date.now())}`;
      const previousByBlock = lastLoggedByBlock(history, sessionId, id);

      const session =
        open ??
        buildDraftSession({
          id,
          date: today,
          week: currentWeek,
          session: program,
          states: new Map(stateEntries),
          previous: previousByBlock,
        });

      if (open === undefined) await repository.saveSession(session);

      setWeek(currentWeek);
      setStates(new Map(stateEntries));
      setConfirmed(confirmedSlugs);
      setPrevious(previousByBlock);
      setTests(latestTests);
      setDraft(session);
      setLoading(false);
    };

    void load();
  }, [program, sessionId]);

  const plan = useMemo(() => buildSessionPlan(program, week), [program, week]);

  const update = useCallback((change: (session: LoggedSession) => LoggedSession) => {
    setDraft((current) => {
      if (current === null) return current;
      const next = change(current);
      void repository.saveSession(next);
      return next;
    });
  }, []);

  const confirmExercise = useCallback((state: ExerciseState) => {
    getExercise(state.exercise);
    setStates((current) => new Map(current).set(state.exercise, state));
    setConfirmed((current) => new Set(current).add(state.exercise));
    void repository.saveExerciseState(state);
  }, []);

  return {
    loading,
    program,
    draft,
    plan,
    week,
    states,
    confirmed,
    previous,
    tests,
    update,
    confirmExercise,
  };
}

/** Stato di partenza per un esercizio mai confermato. */
export function fallbackState(slug: ExerciseSlug): ExerciseState {
  return initialExerciseState(getExercise(slug));
}
