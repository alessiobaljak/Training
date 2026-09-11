import { listSnapshots } from '../../db/snapshots.ts';
import { repository } from '../../db/repository.ts';
import { useStoreQuery } from './useStoreQuery.ts';
import type { SnapshotRecord } from '../../db/db.ts';

/** Le copie automatiche, dalla più recente. `undefined` finché carica. */
export function useSnapshots(): SnapshotRecord[] | undefined {
  return useStoreQuery(() => listSnapshots(repository), []);
}
