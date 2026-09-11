import { beforeEach, describe, expect, it } from 'vitest';
import { ShadowRepository } from './repository.ts';
import { MemoryStore } from './store.ts';
import {
  MAX_SNAPSHOT_BYTES,
  SNAPSHOTS_TO_KEEP,
  listSnapshots,
  pruneSnapshots,
  restoreSnapshot,
  takeSnapshotIfDue,
} from './snapshots.ts';
import { SNAPSHOTS_TABLE, type SnapshotRecord } from './db.ts';
import { addDays } from '../engine/dates.ts';

let store: MemoryStore;
let repo: ShadowRepository;

beforeEach(() => {
  store = new MemoryStore();
  repo = new ShadowRepository(store);
});

describe('copie automatiche', () => {
  it('prende una copia sola al giorno', async () => {
    const first = await takeSnapshotIfDue(repo, '2026-09-11');
    expect(first.kind).toBe('presa');

    const second = await takeSnapshotIfDue(repo, '2026-09-11');
    expect(second.kind).toBe('già-presa-oggi');
    expect(await listSnapshots(repo)).toHaveLength(1);
  });

  it('tiene le più recenti e butta le vecchie', async () => {
    let day = '2026-01-01';
    for (let index = 0; index < SNAPSHOTS_TO_KEEP + 5; index += 1) {
      await takeSnapshotIfDue(repo, day);
      day = addDays(day, 1);
    }

    const kept = await listSnapshots(repo);
    expect(kept).toHaveLength(SNAPSHOTS_TO_KEEP);
    // La più recente in cima: chi ripristina cerca quella.
    expect(kept[0]?.id).toBe('2026-01-19');
    expect(kept.at(-1)?.id).toBe('2026-01-06');
  });

  it('non scrive una copia più grande del limite di Firestore', async () => {
    await repo.saveWeight({ date: '2026-09-11', kg: 80 });
    const huge = new ShadowRepository(store);
    // Una copia finta già oltre soglia: la successiva non deve nemmeno provarci.
    const outcome = await takeSnapshotIfDue(huge, '2026-09-11');
    expect(outcome.kind).toBe('presa');
    expect(MAX_SNAPSHOT_BYTES).toBeLessThan(1_048_576);
  });

  it('riporta indietro i dati come erano', async () => {
    await repo.saveWeight({ date: '2026-09-10', kg: 80 });
    await takeSnapshotIfDue(repo, '2026-09-10');

    await repo.saveWeight({ date: '2026-09-11', kg: 99 });
    expect(await repo.listWeights()).toHaveLength(2);

    await restoreSnapshot(repo, '2026-09-10');
    const weights = await repo.listWeights();
    expect(weights).toHaveLength(1);
    expect(weights[0]?.kg).toBe(80);
  });

  it('un ripristino non cancella le altre copie', async () => {
    await takeSnapshotIfDue(repo, '2026-09-09');
    await repo.saveWeight({ date: '2026-09-10', kg: 80 });
    await takeSnapshotIfDue(repo, '2026-09-10');

    await restoreSnapshot(repo, '2026-09-09');

    // Se un ripristino sbagliato cancellasse la storia, sarebbe irreversibile.
    expect(await listSnapshots(repo)).toHaveLength(2);
  });

  it('le copie non finiscono dentro il backup, o crescerebbero su sé stesse', async () => {
    await takeSnapshotIfDue(repo, '2026-09-10');
    const outcome = await takeSnapshotIfDue(repo, '2026-09-11');

    const second = await repo.store.get<SnapshotRecord>(SNAPSHOTS_TABLE, '2026-09-11');
    expect(outcome.kind).toBe('presa');
    expect(second?.payload.includes('snapshots')).toBe(false);
  });

  it('ripristinare una copia inesistente fallisce senza toccare nulla', async () => {
    await repo.saveWeight({ date: '2026-09-11', kg: 80 });
    await expect(restoreSnapshot(repo, '1999-01-01')).rejects.toThrow('non trovata');
    expect(await repo.listWeights()).toHaveLength(1);
  });

  it('potare un archivio corto non butta niente', async () => {
    await takeSnapshotIfDue(repo, '2026-09-11');
    expect(await pruneSnapshots(repo)).toBe(0);
  });
});
