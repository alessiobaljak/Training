import { TABLE_NAMES } from './db.ts';
import type { DocumentStore } from './store.ts';

/**
 * Porta su Firestore i dati di chi usava l'app prima che ci fosse un account.
 *
 * Due regole, entrambe per non fare danni:
 *
 * 1. Si copia solo se lo spazio dell'utente su Firestore è **vuoto**. Se c'è
 *    già qualcosa vuol dire che l'account ha uno storico suo, e sovrascriverlo
 *    con quello che si trova su questo telefono sarebbe un disastro
 *    silenzioso.
 * 2. Non si cancella niente in locale. Se qualcosa va storto, i dati vecchi
 *    sono ancora lì e la migrazione si può rifare.
 */

export interface MigrationReport {
  readonly migrated: boolean;
  readonly reason: 'vuoto-in-locale' | 'destinazione-non-vuota' | 'copiato';
  readonly counts: Readonly<Record<string, number>>;
}

async function countAll(store: DocumentStore): Promise<number> {
  let total = 0;
  for (const table of TABLE_NAMES) total += (await store.all(table)).length;
  return total;
}

export async function migrateLocalData(
  from: DocumentStore,
  to: DocumentStore,
): Promise<MigrationReport> {
  const counts: Record<string, number> = {};

  if ((await countAll(from)) === 0) {
    return { migrated: false, reason: 'vuoto-in-locale', counts };
  }
  if ((await countAll(to)) > 0) {
    return { migrated: false, reason: 'destinazione-non-vuota', counts };
  }

  for (const table of TABLE_NAMES) {
    const rows = await from.all(table);
    counts[table] = rows.length;
    if (rows.length > 0) await to.putMany(table, rows);
  }

  return { migrated: true, reason: 'copiato', counts };
}
