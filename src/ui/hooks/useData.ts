import { repository } from '../../db/repository.ts';
import { useStoreQuery } from './useStoreQuery.ts';
import type { AppSettings } from '../../db/db.ts';
import type { TestRound } from '../../engine/ranges.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedSession,
  TestId,
  TestResult,
  WaistEntry,
  WeightEntry,
} from '../../types/index.ts';

/**
 * Letture reattive dai dati dell'utente.
 *
 * Ogni hook restituisce `undefined` finché la prima lettura non è finita, e si
 * riaggiorna da solo quando i dati cambiano, che il cambiamento venga da qui o
 * da un altro dispositivo collegato allo stesso account.
 */

export function useSettings(): AppSettings | undefined {
  // `readSettings` e non `getSettings`: la seconda scrive quando la riga
  // manca, e una lettura non deve mai scrivere.
  return useStoreQuery(() => repository.readSettings(), []);
}

export function useIsOnboarded(): boolean | undefined {
  return useStoreQuery(() => repository.isOnboarded(), []);
}

export function useTestRounds(): TestRound[] | undefined {
  return useStoreQuery(() => repository.listTestRounds(), []);
}

export function useOpenRound(): TestRound | null | undefined {
  return useStoreQuery(() => repository.getOpenRound(), []);
}

export function useLatestCompleteRound(): TestRound | null | undefined {
  return useStoreQuery(() => repository.getLatestCompleteRound(), []);
}

export function useLatestTests(): ReadonlyMap<TestId, TestResult> | undefined {
  return useStoreQuery(() => repository.latestTests(), []);
}

export function useActiveSession(): LoggedSession | null | undefined {
  return useStoreQuery(() => repository.getActiveSession(), []);
}

export function useSessions(): LoggedSession[] | undefined {
  return useStoreQuery(() => repository.listSessions(), []);
}

export function useExerciseStates(): ExerciseState[] | undefined {
  return useStoreQuery(() => repository.listExerciseStates(), []);
}

export function useExerciseState(slug: ExerciseSlug): ExerciseState | undefined {
  return useStoreQuery(() => repository.getExerciseState(slug), [slug]);
}

export function useExerciseVideo(slug: ExerciseSlug): string | null | undefined {
  return useStoreQuery(() => repository.getExerciseVideo(slug), [slug]);
}

export function useWeights(): WeightEntry[] | undefined {
  return useStoreQuery(() => repository.listWeights(), []);
}

export function useWaists(): WaistEntry[] | undefined {
  return useStoreQuery(() => repository.listWaists(), []);
}
