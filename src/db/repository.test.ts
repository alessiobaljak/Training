import { beforeEach, describe, expect, it } from 'vitest';

import { ShadowRepository } from './repository.ts';
import { MemoryStore } from './store.ts';
import type { TableName } from './db.ts';
import { initialExerciseState } from '../engine/progression.ts';
import { testResultPerSide, testResultSingle } from '../engine/ranges.ts';
import { getExercise } from '../data/exercises.ts';
import { loggedExercise, sets } from '../engine/__fixtures.ts';
import { WEEK_ZERO_TESTS } from '../data/tests.ts';
import type { LoggedSession, TestResult } from '../types/index.ts';

/** Nove test dello stesso giorno: il giro che sblocca il programma. */
function fullRound(date: string, week: number): TestResult[] {
  return WEEK_ZERO_TESTS.map((test) => testResultSingle(test.id, date, week, 10));
}

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
    expect(await count('settings')).toBe(1);
  });

  it('salva la data di inizio programma', async () => {
    await repo.setProgramStartDate('2026-09-14');
    expect(await repo.getProgramStartDate()).toBe('2026-09-14');
  });

  it('rifiuta una data malformata', async () => {
    await expect(repo.setProgramStartDate('14/09/2026')).rejects.toThrow(/data non valida/i);
  });

  it('l’onboarding resta aperto finché il giro di test non è completo', async () => {
    expect(await repo.isOnboarded()).toBe(false);
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    expect(await repo.isOnboarded()).toBe(false);
    await repo.saveTestResults(fullRound('2026-09-14', 0));
    expect(await repo.isOnboarded()).toBe(true);
  });

  it('registra quando è stato preso l’ultimo backup', async () => {
    expect((await repo.getSettings()).lastBackupAt).toBeNull();
    await repo.markBackupTaken('2026-09-14T10:00:00.000Z');
    expect((await repo.getSettings()).lastBackupAt).toBe('2026-09-14T10:00:00.000Z');
  });
});

describe('giri di test', () => {
  it('un giro incompleto resta aperto e si può riprendere', async () => {
    await repo.saveTestResults(fullRound('2026-09-14', 0).slice(0, 4));
    const open = await repo.getOpenRound();
    expect(open?.complete).toBe(false);
    expect(open?.missing).toHaveLength(5);
    expect(await repo.getLatestCompleteRound()).toBeNull();
  });

  it('un giro completo sblocca il programma', async () => {
    await repo.saveTestResults(fullRound('2026-09-14', 0));
    const round = await repo.getLatestCompleteRound();
    expect(round?.complete).toBe(true);
    expect(round?.results).toHaveLength(9);
    expect(await repo.getOpenRound()).toBeNull();
  });

  it('tiene lo storico dei giri, per il confronto al ritest', async () => {
    await repo.saveTestResults(fullRound('2026-09-14', 0));
    await repo.saveTestResults(fullRound('2026-10-26', 6));
    const rounds = await repo.listTestRounds();
    expect(rounds.map((round) => round.date)).toEqual(['2026-09-14', '2026-10-26']);
    expect((await repo.getLatestCompleteRound())?.date).toBe('2026-10-26');
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
    expect(await count('sessions')).toBe(1);
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
    expect(await count('testResults')).toBe(1);
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
    expect(await count('testResults')).toBe(3);
  });

  it('rifiuta un massimale negativo', async () => {
    await expect(
      repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, -1)),
    ).rejects.toThrow(/negativo/i);
  });
});

describe('stato di avanzamento', () => {
  it('senza nulla salvato e senza test parte dal primo gradino eseguibile', async () => {
    /* Senza una misura l'app non ha nessuna prova che si possa fare di più. */
    const state = await repo.getExerciseState('trazioni-prona-presa-media');
    expect(state).toEqual(initialExerciseState(getExercise('trazioni-prona-presa-media')));
    expect(state.level).toBe(1);
  });

  it('con il test salvato parte dal gradino che il test regge', async () => {
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    const state = await repo.getExerciseState('trazioni-prona-presa-media');
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

  /*
   * T-2: stato e traccia insieme. Uno stato cambiato senza traccia fa passare
   * R10b e R13, che leggono il registro.
   */
  it('una scelta accettata scrive lo stato e la traccia insieme', async () => {
    const base = initialExerciseState(getExercise('trazioni-prona-presa-media'));
    const dopo = { ...base, eccentricBonusSeconds: 1 };
    await repo.recordDecision(
      {
        id: 's2',
        date: '2026-09-14',
        sessionLogId: 'sess-1',
        exercise: 'trazioni-prona-presa-media',
        blockCode: 'A1',
        lever: 'tempo',
        decision: 'accepted',
        stateBefore: base,
        stateAfter: dopo,
      },
      dopo,
    );
    expect(await repo.listSuggestions('trazioni-prona-presa-media')).toHaveLength(1);
    expect((await repo.getExerciseState('trazioni-prona-presa-media')).eccentricBonusSeconds).toBe(1);
  });

  it('se la traccia non si può scrivere, lo stato non cambia', async () => {
    const base = initialExerciseState(getExercise('trazioni-prona-presa-media'));
    const dopo = { ...base, eccentricBonusSeconds: 1 };
    await expect(
      repo.recordDecision(
        {
          id: 's3',
          date: 'non è una data',
          sessionLogId: 'sess-1',
          exercise: 'trazioni-prona-presa-media',
          blockCode: 'A1',
          lever: 'tempo',
          decision: 'accepted',
          stateBefore: base,
          stateAfter: dopo,
        },
        dopo,
      ),
    ).rejects.toThrow();
    expect(await repo.listSuggestions('trazioni-prona-presa-media')).toHaveLength(0);
    expect(await repo.listExerciseStates()).toHaveLength(0);
  });
});

describe('svuotamento', () => {
  it('cancella tutte le tabelle', async () => {
    await repo.getSettings();
    await repo.saveSession(session());
    await repo.saveTestResult(testResultSingle('pull-up', '2026-09-14', 0, 10));
    await repo.saveWeight({ date: '2026-09-14', kg: 80 });

    await repo.clearAll();

    expect(await count('settings')).toBe(0);
    expect(await count('sessions')).toBe(0);
    expect(await count('testResults')).toBe(0);
    expect(await count('weights')).toBe(0);
  });
});

describe('R9c (B16) · un test nuovo non alza il gradino di un esercizio già fatto', () => {
  const sedutaPush = (id: string, date: string, level: 1 | 2): LoggedSession => ({
    id,
    date,
    week: 1,
    sessionId: 'circuito-3',
    status: 'completed',
    exercises: [{ ...loggedExercise('push-up', sets([12, 12, 12]), { blockCode: 'A2' }), level }],
    note: null,
  });

  it('9.26 e 9.28 · push-up mai salvato, fatto al gradino del test: il ritest migliore non lo alza', async () => {
    const repo = new ShadowRepository(new MemoryStore());
    await repo.saveTestResult(testResultSingle('push-up', '2026-03-01', 0, 10));
    const prima = (await repo.getExerciseState('push-up')).level;
    await repo.saveSession(sedutaPush('s1', '2026-03-03', prima as 1 | 2));
    expect(await repo.fissaStatiMancanti()).toBe(1);
    /* Idempotente: la seconda apertura non trova niente. */
    expect(await repo.fissaStatiMancanti()).toBe(0);
    await repo.saveTestResult(testResultSingle('push-up', '2026-04-11', 6, 30));
    expect((await repo.getExerciseState('push-up')).level).toBe(prima);
  });

  it('controllo: senza fissare lo stato, lo stesso ritest lo alzerebbe (il difetto che si chiude)', async () => {
    const repo = new ShadowRepository(new MemoryStore());
    await repo.saveTestResult(testResultSingle('push-up', '2026-03-01', 0, 10));
    const prima = (await repo.getExerciseState('push-up')).level ?? 0;
    await repo.saveTestResult(testResultSingle('push-up', '2026-04-11', 6, 30));
    expect((await repo.getExerciseState('push-up')).level ?? 0).toBeGreaterThan(prima);
  });

  it('un esercizio mai fatto resta calcolato dai test: è un punto di partenza, non una salita', async () => {
    const repo = new ShadowRepository(new MemoryStore());
    await repo.saveTestResult(testResultSingle('push-up', '2026-03-01', 0, 10));
    expect(await repo.fissaStatiMancanti()).toBe(0);
  });

  /*
   * Un magazzino con una copia sul server, come Firestore: la copia locale
   * può essere rimasta indietro rispetto a un altro dispositivo.
   */
  class ConServer extends MemoryStore {
    readonly server = new Map<TableName, unknown[]>();
    offline = false;
    allFromServer<T>(table: TableName): Promise<T[]> {
      if (this.offline) return Promise.reject(new Error('offline'));
      return Promise.resolve((this.server.get(table) ?? []) as T[]);
    }
  }

  async function giornoUno(store: ConServer): Promise<ShadowRepository> {
    const repo = new ShadowRepository(store);
    await repo.saveTestResult(testResultSingle('push-up', '2026-03-01', 0, 10));
    const prima = (await repo.getExerciseState('push-up')).level;
    await repo.saveSession(sedutaPush('s1', '2026-03-03', prima as 1 | 2));
    return repo;
  }

  it('9.29 · uno stato salvato da un altro dispositivo e non ancora arrivato qui non si sovrascrive', async () => {
    const store = new ConServer();
    const repo = await giornoUno(store);
    const altrove = { ...(await repo.getExerciseState('push-up')), level: 1 };
    store.server.set('exerciseStates', [altrove]);
    expect(await repo.fissaStatiMancanti()).toBe(0);
    expect(await store.get('exerciseStates', 'push-up')).toBeUndefined();
  });

  it('9.30 · una scrittura di questo dispositivo non ancora partita conta come salvata', async () => {
    const store = new ConServer();
    const repo = await giornoUno(store);
    /* Seduta e test sono già sul server; lo stato è partito solo qui. */
    store.server.set('sessions', await store.all('sessions'));
    store.server.set('testResults', await store.all('testResults'));
    const qui = { ...(await repo.getExerciseState('push-up')), level: 1 };
    await store.put('exerciseStates', qui);
    expect(await repo.fissaStatiMancanti()).toBe(0);
    expect(await store.get('exerciseStates', 'push-up')).toEqual(qui);
  });

  it('9.31 · senza rete non scrive niente', async () => {
    const store = new ConServer();
    const repo = await giornoUno(store);
    store.offline = true;
    await expect(repo.fissaStatiMancanti()).rejects.toThrow('offline');
    expect(await store.all('exerciseStates')).toEqual([]);
    store.offline = false;
    expect(await repo.fissaStatiMancanti()).toBe(1);
  });
});
