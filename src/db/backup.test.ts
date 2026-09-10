import { beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  BackupError,
  backupFileName,
  exportBackup,
  importBackup,
  parseBackup,
  serializeBackup,
  validateBackup,
} from './backup.ts';
import { DATA_VERSION, type TableName } from './db.ts';
import { ShadowRepository } from './repository.ts';
import { MemoryStore } from './store.ts';
import { testResultSingle } from '../engine/ranges.ts';
import { loggedExercise, sets } from '../engine/__fixtures.ts';
import type { LoggedSession } from '../types/index.ts';

let store: MemoryStore;
let repo: ShadowRepository;

/** Quante righe ci sono in una tabella. */
async function count(table: TableName): Promise<number> {
  return (await store.all(table)).length;
}

beforeEach(() => {
  store = new MemoryStore();
  repo = new ShadowRepository(store);
});

const session: LoggedSession = {
  id: 'sess-1',
  date: '2026-09-14',
  week: 1,
  sessionId: 'upper-a',
  status: 'completed',
  exercises: [loggedExercise('trazioni-prona-presa-media', sets([8, 8, 7, 6]))],
  note: 'Ultima serie con presa che cede',
};

async function seed(): Promise<void> {
  await repo.getSettings();
  await repo.setProgramStartDate('2026-09-14');
  await repo.saveSession(session);
  await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
  await repo.saveWeight({ date: '2026-09-14', kg: 80 });
  await repo.saveWaist({ date: '2026-09-14', cm: 84 });
  await repo.setExerciseVideo('dip-parallele-anelli', 'https://example.com/dip');
}

/** Backup minimo valido, da manipolare nei test sui file rotti. */
function minimalBackup(): Record<string, unknown> {
  return {
    format: BACKUP_FORMAT,
    version: DATA_VERSION,
    exportedAt: '2026-09-14T10:00:00.000Z',
    data: {},
  };
}

describe('export', () => {
  it('raccoglie tutte le tabelle', async () => {
    await seed();
    const backup = await exportBackup(repo);
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.version).toBe(DATA_VERSION);
    expect(backup.data.sessions).toHaveLength(1);
    expect(backup.data.testResults).toHaveLength(1);
    expect(backup.data.weights).toHaveLength(1);
    expect(backup.data.waists).toHaveLength(1);
    expect(backup.data.exerciseMedia).toHaveLength(1);
    expect(backup.data.settings).toHaveLength(1);
  });

  it('produce un JSON che si rilegge da solo', async () => {
    await seed();
    const json = serializeBackup(await exportBackup(repo));
    const { backup, warnings } = parseBackup(json);
    expect(warnings).toEqual([]);
    expect(backup.data.sessions[0]?.exercises[0]?.sets).toHaveLength(4);
  });

  it('propone un nome file con la data', () => {
    expect(backupFileName('2026-09-14')).toBe('shadow-backup-2026-09-14.json');
  });
});

describe('ripristino', () => {
  it('riporta i dati identici su un database vuoto', async () => {
    await seed();
    const json = serializeBackup(await exportBackup(repo));

    await repo.clearAll();
    expect(await count('sessions')).toBe(0);

    const report = await importBackup(repo, parseBackup(json), 'replace');
    expect(report.counts.sessions).toBe(1);
    expect(await repo.getProgramStartDate()).toBe('2026-09-14');
    expect((await repo.getSession('sess-1'))?.note).toBe('Ultima serie con presa che cede');
    expect(await repo.getExerciseVideo('dip-parallele-anelli')).toBe('https://example.com/dip');
  });

  it('in modalità sostituzione cancella quello che non è nel file', async () => {
    const json = serializeBackup(await exportBackup(repo));
    await seed();
    await importBackup(repo, parseBackup(json), 'replace');
    expect(await count('sessions')).toBe(0);
    expect(await count('weights')).toBe(0);
  });

  it('in modalità unione tiene quello che non è nel file', async () => {
    const json = serializeBackup(await exportBackup(repo));
    await seed();
    await importBackup(repo, parseBackup(json), 'merge');
    expect(await count('sessions')).toBe(1);
    expect(await count('weights')).toBe(1);
  });

  it('in modalità unione le righe del file vincono su quelle esistenti', async () => {
    await seed();
    const json = serializeBackup(await exportBackup(repo));
    await repo.saveWeight({ date: '2026-09-14', kg: 99 });
    await importBackup(repo, parseBackup(json), 'merge');
    expect((await repo.listWeights())[0]?.kg).toBe(80);
  });

  it('riporta quante righe ha scritto per tabella', async () => {
    await seed();
    const report = await importBackup(repo, parseBackup(serializeBackup(await exportBackup(repo))));
    expect(report.mode).toBe('replace');
    expect(report.counts).toMatchObject({ sessions: 1, testResults: 1, weights: 1, waists: 1 });
  });
});

describe('file rifiutati', () => {
  it('non è JSON', () => {
    expect(() => parseBackup('{ non json')).toThrow(BackupError);
    expect(() => parseBackup('{ non json')).toThrow(/JSON valido/i);
  });

  it('non è un backup di Shadow', () => {
    expect(() => validateBackup({ format: 'qualcos-altro', version: 1, exportedAt: '', data: {} })).toThrow(
      /non è un backup di Shadow/i,
    );
  });

  it('viene da una versione più recente dell’app', () => {
    expect(() => validateBackup({ ...minimalBackup(), version: DATA_VERSION + 1 })).toThrow(
      /versione più recente/i,
    );
  });

  it('la radice non è un oggetto', () => {
    expect(() => validateBackup([])).toThrow(/atteso un oggetto/i);
    expect(() => validateBackup('testo')).toThrow(/atteso un oggetto/i);
  });

  it('indica il punto esatto del problema', () => {
    const broken = {
      ...minimalBackup(),
      data: {
        sessions: [
          {
            ...session,
            exercises: [
              {
                ...session.exercises[0],
                sets: [{ setIndex: 1, side: null, value: 'otto', rir: null, loadKg: 0, note: null }],
              },
            ],
          },
        ],
      },
    };
    expect(() => validateBackup(broken)).toThrow(
      'data.sessions[0].exercises[0].sets[0].value: atteso un numero',
    );
  });

  it('un campo mancante è segnalato come un campo sbagliato', () => {
    const broken = {
      ...minimalBackup(),
      data: { weights: [{ date: '2026-09-14' }] },
    };
    expect(() => validateBackup(broken)).toThrow('data.weights[0].kg: atteso un numero');
  });

  it('rifiuta una seduta con un tipo che non esiste', () => {
    const broken = { ...minimalBackup(), data: { sessions: [{ ...session, sessionId: 'upper-c' }] } };
    expect(() => validateBackup(broken)).toThrow(/valore non ammesso/i);
  });

  it('rifiuta uno stato con un livello fuori scala', () => {
    const broken = {
      ...minimalBackup(),
      data: {
        exerciseStates: [
          {
            exercise: 'trazioni-prona-presa-media',
            level: 9,
            eccentricBonusSeconds: 0,
            bottomPauseBonusSeconds: 0,
            loadKg: 0,
          },
        ],
      },
    };
    expect(() => validateBackup(broken)).toThrow(/livello fuori scala/i);
  });

  it('rifiuta un link video che diventerebbe codice al tap', () => {
    const broken = {
      ...minimalBackup(),
      data: {
        exerciseMedia: [
          {
            exercise: 'dip-parallele-anelli',
            videoUrl: 'javascript:alert(1)',
            updatedAt: '2026-09-14T10:00:00.000Z',
          },
        ],
      },
    };
    expect(() => validateBackup(broken)).toThrow(/http/i);
  });

  it('rifiuta una data malformata', () => {
    const broken = { ...minimalBackup(), data: { weights: [{ date: '14/09/2026', kg: 80 }] } };
    expect(() => validateBackup(broken)).toThrow(/data non valida/i);
  });
});

describe('un file rotto non tocca i dati esistenti', () => {
  it('la validazione fallisce prima di qualunque scrittura', async () => {
    await seed();
    const before = {
      sessions: await count('sessions'),
      weights: await count('weights'),
      tests: await count('testResults'),
    };

    // La seduta 0 è valida, la 1 no: senza validazione preventiva le prime
    // righe sarebbero già state scritte.
    const halfBroken = {
      ...minimalBackup(),
      data: {
        sessions: [session, { ...session, id: 'sess-2', date: 'domani' }],
        weights: [{ date: '2026-09-20', kg: 79 }],
      },
    };

    expect(() => validateBackup(halfBroken)).toThrow(BackupError);

    expect(await count('sessions')).toBe(before.sessions);
    expect(await count('weights')).toBe(before.weights);
    expect(await count('testResults')).toBe(before.tests);
  });
});

describe('backup di una versione precedente dei dati', () => {
  it('un esercizio che non esiste più non fa fallire il ripristino', async () => {
    const withGhost = {
      ...minimalBackup(),
      data: {
        sessions: [
          {
            ...session,
            id: 'sess-ghost',
            exercises: [{ ...session.exercises[0], exercise: 'esercizio-sparito' }],
          },
        ],
      },
    };

    const validated = validateBackup(withGhost);
    expect(validated.warnings).toHaveLength(1);
    expect(validated.warnings[0]).toContain('esercizio-sparito');

    const report = await importBackup(repo, validated, 'replace');
    expect(report.warnings).toHaveLength(1);
    expect((await repo.getSession('sess-ghost'))?.exercises[0]?.exercise).toBe('esercizio-sparito');
  });

  it('le tabelle assenti dal file valgono come vuote', () => {
    const validated = validateBackup(minimalBackup());
    expect(validated.backup.data.sessions).toEqual([]);
    expect(validated.backup.data.weights).toEqual([]);
  });
});
