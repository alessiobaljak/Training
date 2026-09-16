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
  /**
   * Butta via la seduta di oggi e riparte da vuoto.
   *
   * Serve quando quello che è stato registrato non vale: una prova, un
   * esercizio sbagliato, un pomeriggio andato storto. Cancella solo la seduta
   * del giorno; test, misure e livelli restano.
   */
  readonly discard: () => Promise<void>;
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

      /*
       * Anche gli esercizi alternativi, non solo quelli dichiarati.
       *
       * Il riepilogo di fine seduta scarta i blocchi di cui non conosce lo
       * stato: senza il wall sit qui dentro, sceglierlo faceva sparire il C2
       * dal riepilogo senza dire niente.
       */
      const slugs = [
        ...new Set(
          program.blocks.flatMap((block) =>
            block.alternative === undefined
              ? [block.exercise]
              : [block.exercise, block.alternative.exercise],
          ),
        ),
      ];
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

      /*
       * Riprende la seduta di oggi, qualunque sia il suo stato.
       *
       * Prima cercava solo quelle aperte: riaprire una seduta già chiusa ne
       * creava una seconda, vuota, che restava aperta per sempre e il giorno
       * dopo compariva in Home come «seduta rimasta aperta». Chi premeva
       * «Riapri la seduta di oggi» si trovava davanti zero serie su ventuno e
       * si lasciava dietro un doppione.
       *
       * Una chiusa si riapre così com'è e resta chiusa: aggiungere una serie a
       * una seduta archiviata la corregge, non la rimette in corso.
       */
      const perOggi = history.filter((entry) => entry.date === today);
      const open =
        perOggi.find((entry) => entry.status === 'in-progress') ?? perOggi[0];
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

  const discard = useCallback(async (): Promise<void> => {
    const corrente = draft;
    if (corrente === null) return;

    await repository.deleteSession(corrente.id);

    const vuota = buildDraftSession({
      id: corrente.id,
      date: corrente.date,
      week: corrente.week,
      session: program,
      states,
      previous,
    });
    await repository.saveSession(vuota);
    setDraft(vuota);
  }, [draft, program, states, previous]);

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
    discard,
  };
}

/** Stato di partenza per un esercizio mai confermato. */
export function fallbackState(slug: ExerciseSlug): ExerciseState {
  return initialExerciseState(getExercise(slug));
}
