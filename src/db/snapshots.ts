import { SNAPSHOTS_TABLE, type SnapshotRecord } from './db.ts';
import {
  exportBackup,
  importBackup,
  parseBackup,
  serializeBackup,
  type ImportMode,
  type ImportReport,
} from './backup.ts';
import type { ShadowRepository } from './repository.ts';

/**
 * Copie automatiche dell'archivio, tenute accanto ai dati.
 *
 * A cosa servono davvero. Firebase protegge da una cosa sola: perdere il
 * telefono. Non tiene versioni, quindi se qualcosa scrive un valore sbagliato
 * quel valore sostituisce il precedente ovunque, e il vecchio non esiste più.
 * Queste copie sono la macchina del tempo che Firestore non ha: una al giorno,
 * le ultime quattordici, e da ognuna si torna indietro.
 *
 * A cosa NON servono. Stanno nello stesso progetto Firebase dei dati: se perdi
 * l'account o il progetto viene sospeso, spariscono insieme a tutto il resto.
 * Per quel caso resta il file JSON scaricato, che è l'unica copia fuori da
 * questa catena.
 */

/** Quante copie tenere. Due settimane di storia bastano a tornare indietro. */
export const SNAPSHOTS_TO_KEEP = 14;

/**
 * Oltre questa soglia la copia non si scrive.
 *
 * Un documento Firestore non può superare 1 MiB. Fermarsi prima, e dirlo, è
 * meglio che vedersi rifiutare la scrittura quando l'archivio è cresciuto.
 */
export const MAX_SNAPSHOT_BYTES = 700_000;

export type SnapshotOutcome =
  | { readonly kind: 'presa'; readonly id: string; readonly bytes: number }
  | { readonly kind: 'già-presa-oggi'; readonly id: string }
  | { readonly kind: 'troppo-grande'; readonly bytes: number };

export async function listSnapshots(repo: ShadowRepository): Promise<SnapshotRecord[]> {
  const rows = await repo.store.all<SnapshotRecord>(SNAPSHOTS_TABLE);
  return rows.sort((a, b) => (a.id < b.id ? 1 : -1));
}

/**
 * Prende la copia del giorno, se non c'è già, e pota le più vecchie.
 *
 * Una al giorno e non una per scrittura: il costo è una scrittura al primo
 * avvio della giornata, e la granularità che serve per tornare indietro è il
 * giorno, non il minuto.
 */
export async function takeSnapshotIfDue(
  repo: ShadowRepository,
  today: string,
): Promise<SnapshotOutcome> {
  const existing = await repo.store.get<SnapshotRecord>(SNAPSHOTS_TABLE, today);
  if (existing !== undefined) return { kind: 'già-presa-oggi', id: today };

  const payload = serializeBackup(await exportBackup(repo));
  const bytes = new TextEncoder().encode(payload).byteLength;
  if (bytes > MAX_SNAPSHOT_BYTES) return { kind: 'troppo-grande', bytes };

  const record: SnapshotRecord = {
    id: today,
    takenAt: new Date().toISOString(),
    payload,
    bytes,
  };
  await repo.store.put(SNAPSHOTS_TABLE, record);

  await pruneSnapshots(repo);
  return { kind: 'presa', id: today, bytes };
}

/** Tiene le più recenti e butta il resto. */
export async function pruneSnapshots(repo: ShadowRepository): Promise<number> {
  const all = await listSnapshots(repo);
  const extra = all.slice(SNAPSHOTS_TO_KEEP);
  for (const record of extra) await repo.store.remove(SNAPSHOTS_TABLE, record.id);
  return extra.length;
}

/**
 * Torna a una copia.
 *
 * Passa dallo stesso percorso dell'import di un file: il contenuto viene
 * validato per intero prima che si scriva una riga. Una copia corrotta
 * fallisce senza toccare niente.
 */
export async function restoreSnapshot(
  repo: ShadowRepository,
  id: string,
  mode: ImportMode = 'replace',
): Promise<ImportReport> {
  const record = await repo.store.get<SnapshotRecord>(SNAPSHOTS_TABLE, id);
  if (record === undefined) throw new Error(`Copia del ${id} non trovata.`);
  return importBackup(repo, parseBackup(record.payload), mode);
}
