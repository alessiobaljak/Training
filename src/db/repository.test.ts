import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ShadowDatabase } from './db.ts';
import { ShadowRepository } from './repository.ts';
import { initialExerciseState } from '../engine/progression.ts';
import { testResultPerSide, testResultSingle } from '../engine/ranges.ts';
import { getExercise } from '../data/exercises.ts';
import { loggedExercise, sets } from '../engine/__fixtures.ts';
import type { LoggedSession } from '../types/index.ts';

let counter = 0;
let database: ShadowDatabase;
let repo: ShadowRepository;

beforeEach(async () => {
  counter += 1;
  database = new ShadowDatabase(`shadow-test-repo-${String(counter)}`);
  repo = new ShadowRepository(database);
  await database.open();
});

afterEach(async () => {
  database.close();
  await ShadowDatabase.delete(database.name);
});

function session(overrides: Partial<LoggedSession> = {}): LoggedSession {
  return {
    id: 'sess-1',
    date: '2026-09-14',
    week: 1,
    sessionId: 'upper-a',
    status: 'completed',
    exercises: [loggedExercise('trazioni-prona-presa-media', sets([8, 8, 7, 6]))],
    note: null,
    ...overrides,
  };
}

describe('impostazioni', () => {
  it('crea la riga al primo accesso, senza data di inizio', async () => {
    const settings = await repo.getSettings();
    expect(settings.id).toBe('app');
    expect(settings.programStartDate).toBeNull();
  });

  it('non ricrea la riga a ogni lettura', async () => {
    const first = await repo.getSettings();
    const second = await repo.getSettings();
    expect(second.createdAt).toBe(first.createdAt);
    expect(await database.settings.count()).toBe(1);
  });

  it('salva la data di inizio programma', async () => {
    await repo.setProgramStartDate('2026-09-14');
    expect(await repo.getProgramStartDate()).toBe('2026-09-14');
  });

  it('rifiuta una data malformata', async () => {
    await expect(repo.setProgramStartDate('14/09/2026')).rejects.toThrow(/data non valida/i);
  });

  it('l’onboarding è chiuso solo quando esiste almeno un test', async () => {
    expect(await repo.isOnboarded()).toBe(false);
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    expect(await repo.isOnboarded()).toBe(true);
  });
});

describe('sedute', () => {
  it('salva e rilegge una seduta con le sue serie', async () => {
    await repo.saveSession(session());
    const stored = await repo.getSession('sess-1');
    expect(stored?.exercises[0]?.sets).toHaveLength(4);
    expect(stored?.exercises[0]?.sets[0]?.value).toBe(8);
  });

  it('sovrascrive la seduta con lo stesso id: è il salvataggio in corso d’opera', async () => {
    await repo.saveSession(session({ status: 'in-progress' }));
    await repo.saveSession(session({ status: 'completed' }));
    expect(await database.sessions.count()).toBe(1);
    expect((await repo.getSession('sess-1'))?.status).toBe('completed');
  });

  it('ritrova la seduta interrotta da riprendere', async () => {
    await repo.saveSession(session({ id: 'a', date: '2026-09-14', status: 'completed' }));
    await repo.saveSession(session({ id: 'b', date: '2026-09-15', status: 'in-progress' }));
    expect((await repo.getActiveSession())?.id).toBe('b');
  });

  it('senza sedute aperte non propone nulla da riprendere', async () => {
    await repo.saveSession(session({ status: 'completed' }));
    expect(await repo.getActiveSession()).toBeNull();
  });

  it('con più sedute aperte prende la più recente', async () => {
    await repo.saveSession(session({ id: 'a', date: '2026-09-14', status: 'in-progress' }));
    await repo.saveSession(session({ id: 'b', date: '2026-09-18', status: 'in-progress' }));
    expect((await repo.getActiveSession())?.id).toBe('b');
  });

  it('filtra per periodo e per tipo di seduta', async () => {
    await repo.saveSession(session({ id: 'a', date: '2026-09-14', sessionId: 'upper-a' }));
    await repo.saveSession(session({ id: 'b', date: '2026-09-15', sessionId: 'lower-a' }));
    await repo.saveSession(session({ id: 'c', date: '2026-09-21', sessionId: 'upper-a' }));

    expect((await repo.listSessions({ from: '2026-09-15' })).map((s) => s.id)).toEqual(['b', 'c']);
    expect((await repo.listSessions({ to: '2026-09-14' })).map((s) => s.id)).toEqual(['a']);
    expect((await repo.listSessions({ sessionId: 'upper-a' })).map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('restituisce le sedute in ordine di data', async () => {
    await repo.saveSession(session({ id: 'c', date: '2026-09-21' }));
    await repo.saveSession(session({ id: 'a', date: '2026-09-14' }));
    expect((await repo.listSessions()).map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('rifiuta una seduta con data malformata', async () => {
    await expect(repo.saveSession(session({ date: 'ieri' }))).rejects.toThrow(/data non valida/i);
  });

  it('rifiuta una seduta senza id', async () => {
    await expect(repo.saveSession(session({ id: '  ' }))).rejects.toThrow(/id/i);
  });

  it('cancella una seduta', async () => {
    await repo.saveSession(session());
    await repo.deleteSession('sess-1');
    expect(await repo.getSession('sess-1')).toBeNull();
  });
});

describe('test dei massimali', () => {
  it('rifare lo stesso test lo stesso giorno sovrascrive', async () => {
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 11));
    expect(await database.testResults.count()).toBe(1);
    expect((await repo.listTestResults('pull-up'))[0]?.value).toBe(11);
  });

  it('un ritest in un altro giorno è una riga nuova: lo storico resta', async () => {
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    await repo.saveTestResult(testResultSingle('pull-up', '2026-10-26', 6, 13));
    expect(await repo.listTestResults('pull-up')).toHaveLength(2);
  });

  it('i range partono sempre dall’ultimo massimale', async () => {
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    await repo.saveTestResult(testResultSingle('pull-up', '2026-10-26', 6, 13));
    expect((await repo.latestTests()).get('pull-up')?.value).toBe(13);
  });

  it('conserva i due lati di un test per gamba', async () => {
    await repo.saveTestResult(testResultPerSide('bulgarian-split-squat', '2026-09-14', 0, 15, 12));
    const stored = (await repo.listTestResults('bulgarian-split-squat'))[0];
    expect(stored?.value).toBe(12);
    expect(stored?.left).toBe(15);
  });

  it('salva tutti e nove i test dell’onboarding in una volta', async () => {
    await repo.saveTestResults([
      testResultSingle('pull-up', '2026-09-14', 0, 10),
      testResultSingle('dip', '2026-09-14', 0, 12),
      testResultSingle('hollow-hold', '2026-09-14', 0, 45),
    ]);
    expect(await database.testResults.count()).toBe(3);
  });

  it('rifiuta un massimale negativo', async () => {
    await expect(
      repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, -1)),
    ).rejects.toThrow(/negativo/i);
  });
});

describe('stato di avanzamento', () => {
  it('senza nulla salvato parte dal livello del programma', async () => {
    const state = await repo.getExerciseState('trazioni-prona-presa-media');
    expect(state).toEqual(initialExerciseState(getExercise('trazioni-prona-presa-media')));
    expect(state.level).toBe(3);
  });

  it('salva e rilegge lo stato modificato', async () => {
    const state = { ...initialExerciseState(getExercise('dip-parallele-anelli')), loadKg: 5 };
    await repo.saveExerciseState(state);
    expect((await repo.getExerciseState('dip-parallele-anelli')).loadKg).toBe(5);
  });

  it('rifiuta uno stato per un esercizio che non esiste', async () => {
    await expect(
      repo.saveExerciseState({
        exercise: 'esercizio-inventato',
        level: null,
        eccentricBonusSeconds: 0,
        bottomPauseBonusSeconds: 0,
        loadKg: 0,
      }),
    ).rejects.toThrow(/sconosciuto/i);
  });
});

describe('video personali', () => {
  it('salva il link incollato e da lì in poi è quello', async () => {
    await repo.setExerciseVideo('dip-parallele-anelli', 'https://example.com/dip');
    expect(await repo.getExerciseVideo('dip-parallele-anelli')).toBe('https://example.com/dip');
  });

  it('rifiuta uno schema che diventerebbe codice al tap', async () => {
    await expect(
      repo.setExerciseVideo('dip-parallele-anelli', 'javascript:alert(1)'),
    ).rejects.toThrow(/http/i);
    expect(await repo.getExerciseVideo('dip-parallele-anelli')).toBeNull();
  });

  it('si può togliere', async () => {
    await repo.setExerciseVideo('dip-parallele-anelli', 'https://example.com/dip');
    await repo.clearExerciseVideo('dip-parallele-anelli');
    expect(await repo.getExerciseVideo('dip-parallele-anelli')).toBeNull();
  });
});

describe('misure', () => {
  it('un peso al giorno: risalvare lo stesso giorno corregge', async () => {
    await repo.saveWeight({ date: '2026-09-14', kg: 80 });
    await repo.saveWeight({ date: '2026-09-14', kg: 80.4 });
    expect(await repo.listWeights()).toEqual([{ date: '2026-09-14', kg: 80.4 }]);
  });

  it('restituisce i pesi in ordine di data', async () => {
    await repo.saveWeight({ date: '2026-09-16', kg: 80 });
    await repo.saveWeight({ date: '2026-09-14', kg: 81 });
    expect((await repo.listWeights()).map((entry) => entry.date)).toEqual([
      '2026-09-14',
      '2026-09-16',
    ]);
  });

  it('rifiuta un peso non positivo', async () => {
    await expect(repo.saveWeight({ date: '2026-09-14', kg: 0 })).rejects.toThrow(/maggiore di zero/i);
  });

  it('registra il girovita allo stesso modo', async () => {
    await repo.saveWaist({ date: '2026-09-14', cm: 84 });
    expect(await repo.listWaists()).toEqual([{ date: '2026-09-14', cm: 84 }]);
  });
});

describe('tracciamento dei suggerimenti', () => {
  it('registra accettazione e rinvio', async () => {
    const base = initialExerciseState(getExercise('trazioni-prona-presa-media'));
    await repo.recordSuggestion({
      id: 's1',
      date: '2026-09-14',
      sessionLogId: 'sess-1',
      exercise: 'trazioni-prona-presa-media',
      blockCode: 'A2',
      lever: 'tempo',
      decision: 'postponed',
      stateBefore: base,
      stateAfter: { ...base, eccentricBonusSeconds: 1 },
    });
    const stored = await repo.listSuggestions('trazioni-prona-presa-media');
    expect(stored).toHaveLength(1);
    expect(stored[0]?.decision).toBe('postponed');
  });
});

describe('svuotamento', () => {
  it('cancella tutte le tabelle', async () => {
    await repo.getSettings();
    await repo.saveSession(session());
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    await repo.saveWeight({ date: '2026-09-14', kg: 80 });

    await repo.clearAll();

    expect(await database.settings.count()).toBe(0);
    expect(await database.sessions.count()).toBe(0);
    expect(await database.testResults.count()).toBe(0);
    expect(await database.weights.count()).toBe(0);
  });
});
