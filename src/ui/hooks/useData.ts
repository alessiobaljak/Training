import { useLiveQuery } from 'dexie-react-hooks';
import { repository } from '../../db/repository.ts';
import type { AppSettings } from '../../db/db.ts';
import type { TestRound } from '../../engine/ranges.ts';
import type { ExerciseState, LoggedSession, TestId, TestResult } from '../../types/index.ts';

/**
 * Letture reattive dal database.
 *
 * `useLiveQuery` restituisce `undefined` finché la lettura non è finita: è la
 * differenza tra "sto caricando" e "non c'è nulla", e i componenti devono
 * distinguerle o mostreranno un lampo di schermata sbagliata al primo avvio.
 */

export function useSettings(): AppSettings | undefined {
  // `readSettings` e non `getSettings`: la seconda scrive quando la riga manca,
  // e una scrittura dentro useLiveQuery fa fallire la schermata.
  return useLiveQuery(() => repository.readSettings(), []);
}

export function useIsOnboarded(): boolean | undefined {
  return useLiveQuery(() => repository.isOnboarded(), []);
}

export function useTestRounds(): TestRound[] | undefined {
  return useLiveQuery(() => repository.listTestRounds(), []);
}

export function useOpenRound(): TestRound | null | undefined {
  return useLiveQuery(() => repository.getOpenRound(), []);
}

export function useLatestCompleteRound(): TestRound | null | undefined {
  return useLiveQuery(() => repository.getLatestCompleteRound(), []);
}

export function useLatestTests(): ReadonlyMap<TestId, TestResult> | undefined {
  return useLiveQuery(() => repository.latestTests(), []);
}

export function useActiveSession(): LoggedSession | null | undefined {
  return useLiveQuery(() => repository.getActiveSession(), []);
}

export function useSessions(): LoggedSession[] | undefined {
  return useLiveQuery(() => repository.listSessions(), []);
}

export function useExerciseStates(): ExerciseState[] | undefined {
  return useLiveQuery(() => repository.listExerciseStates(), []);
}
