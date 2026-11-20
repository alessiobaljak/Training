import { describe, expect, it } from 'vitest';
import {
  evaluateProgression,
  initialExerciseState,
  motivoBlocco,
  righeVere,
  salitaConsentita,
  serieVere,
} from './progression.ts';
import type { ProgressionInput, Rientro, SalitaConsentita } from './progression.ts';
import { latestTestResults, resolveBlockRange, testResultSingle } from './ranges.ts';
import { getExercise } from '../data/exercises.ts';
import { getAnySession } from '../data/sessions.ts';
import type {
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSet,
  ProgramBlock,
  SessionId,
} from '../types/index.ts';
import { loggedExercise, loggedSession, perSideSets, set, sets } from './__fixtures.ts';

/*
 * R5, R6 e R7 a fine seduta (training/PROGRESSION_RULES.md §9).
 *
 * I numeri delle prove sono quelli delle tabelle 5.x, 6.x e 7.x del designer,
 * per la parte che vive nel riepilogo di fine seduta. La revisione settimanale
 * arriva con R8 (D-16).
 */

const TESTS = latestTestResults([
  testResultSingle('pull-up', '2026-02-23', 0, 10),
  testResultSingle('dip', '2026-02-23', 0, 12),
  testResultSingle('push-up', '2026-02-23', 0, 30),
  testResultSingle('inverted-row-trx', '2026-02-23', 0, 18),
]);

const SALITA_LIBERA: SalitaConsentita = { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' };

function blockOf(sessionId: SessionId, code: string): ProgramBlock {
  const block = getAnySession(sessionId).blocks.find((entry) => entry.code === code);
  if (block === undefined) throw new Error(`Blocco mancante: ${sessionId}/${code}`);
  return block;
}

function input(options: {
  sessionId: SessionId;
  code: string;
  loggedSets: readonly LoggedSet[];
  tempoRespected?: boolean | null;
  state?: Partial<ExerciseState>;
  week?: number;
  currentMaxReps?: number | null;
  salita?: SalitaConsentita;
  rientro?: Rientro | null;
}): ProgressionInput {
  const block = blockOf(options.sessionId, options.code);
  const exercise = getExercise(block.exercise);
  const state: ExerciseState = { ...initialExerciseState(exercise), level: exercise.defaultLevel, ...options.state };
  return {
    block,
    exercise,
    state,
    /* La voce è fatta allo stato (R14b): il gradino scritto è quello dello stato. */
    logged: {
      ...loggedExercise(exercise.slug, options.loggedSets, {
        blockCode: block.code,
        tempoRespected: options.tempoRespected === undefined ? true : options.tempoRespected,
      }),
      level: state.level,
    },
    range: resolveBlockRange(block, exercise, TESTS),
    week: options.week ?? 4,
    currentMaxReps: options.currentMaxReps === undefined ? 12 : options.currentMaxReps,
    salita: options.salita ?? SALITA_LIBERA,
    rientro: options.rientro ?? null,
    aumentoRecente: null,
  };
}

/* Trazioni del circuito 1, 6-8: tempo e pausa già al massimo, resta la scala. */
const TRAZIONI_SENZA_TEMPO = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;

describe('R8 · serie vere', () => {
  it('due righe per lato sono una serie, non due', () => {
    expect(serieVere(perSideSets([[8, 8], [8, 8]]))).toEqual([1, 2]);
  });

  it('una serie con un lato solo non conta, e i suoi numeri non entrano', () => {
    const righe = [...perSideSets([[8, 8]]), set(2, 3, { side: 'left' })];
    expect(serieVere(righe)).toEqual([1]);
    expect(righeVere(righe).map((riga) => riga.value)).toEqual([8, 8]);
  });

  it('le serie senza lato contano una per una', () => {
    expect(serieVere(sets([10, 10, 10]))).toEqual([1, 2, 3]);
  });
});

describe('R5 · una sola regola per ogni aumento', () => {
  it('ordine dei motivi: scarico, rientro, tempo no, tempo mancante, poche serie', () => {
    const base = { tempo: [true, true], serieVere: 6, scarico: false, rientro: false };
    expect(motivoBlocco(base)).toBeNull();
    expect(motivoBlocco({ ...base, tempo: [true, false] })).toBe('tempo-no');
    expect(motivoBlocco({ ...base, tempo: [true, null] })).toBe('tempo-null');
    /* 5.4: il no vince sul null. */
    expect(motivoBlocco({ ...base, tempo: [false, null] })).toBe('tempo-no');
    expect(motivoBlocco({ ...base, serieVere: 2 })).toBe('poche-serie');
    expect(motivoBlocco({ ...base, tempo: [null], scarico: true })).toBe('scarico');
    expect(motivoBlocco({ ...base, rientro: true })).toBe('rientro');
    expect(motivoBlocco({ ...base, tempo: [] })).toBe('tempo-null');
  });

  it('5.9 · massimo chiuso senza risposta sul tempo: nessuna leva', () => {
    const evaluation = evaluateProgression(
      input({ sessionId: 'circuito-2', code: 'A3', loggedSets: sets([11, 11, 11]), tempoRespected: null }),
    );
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.motivoBlocco).toBe('tempo-null');
  });

  it('5.10 · due serie sole non bastano, anche al massimo e con il tempo', () => {
    const evaluation = evaluateProgression(
      input({ sessionId: 'circuito-2', code: 'A3', loggedSets: sets([11, 11]) }),
    );
    expect(evaluation.closedRange).toBe(true);
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.motivoBlocco).toBe('poche-serie');
    expect(evaluation.blockedReason).toContain('oggi ne hai chiuse 2');
  });

  it('5.10 per lato · tre serie a sinistra e due a destra sono due serie', () => {
    const block = blockOf('circuito-2', 'A3');
    const righe = [
      ...perSideSets([[11, 11], [11, 11]]),
      set(3, 11, { side: 'left' }),
    ];
    const evaluation = evaluateProgression({
      ...input({ sessionId: 'circuito-2', code: 'A3', loggedSets: righe }),
      block: { ...block, perSide: true },
    });
    expect(evaluation.motivoBlocco).toBe('poche-serie');
  });

  it('5.11 · in settimana di scarico nessun aumento, con il massimo e il tempo', () => {
    const evaluation = evaluateProgression(
      input({ sessionId: 'circuito-2', code: 'A3', loggedSets: sets([11, 11, 11]), week: 6 }),
    );
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.motivoBlocco).toBe('scarico');
    expect(evaluation.blockedReason).toContain('Settimana di scarico');
  });

  it('5.12 · in una seduta di rientro nessun aumento', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-2',
        code: 'A3',
        loggedSets: sets([11, 11, 11]),
        rientro: { seduta: 2, di: 4 },
      }),
    );
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.blockedReason).toContain('Seduta di rientro (2 di 4)');
  });

  it('con tre serie vere, il massimo e il tempo, una leva c’è', () => {
    const evaluation = evaluateProgression(
      input({ sessionId: 'circuito-2', code: 'A3', loggedSets: sets([11, 11, 11]) }),
    );
    expect(evaluation.triggered).toBe(true);
    expect(evaluation.suggestion).not.toBeNull();
  });
});

describe('R6 · prima la variante, poi la zavorra', () => {
  it('6.8 · al gradino 1 con tempo e pausa finiti la leva è la variante, non il carico', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A1',
        loggedSets: sets([8, 8, 8]),
        state: { ...TRAZIONI_SENZA_TEMPO, level: 1 },
      }),
    );
    expect(evaluation.suggestion?.lever).toBe('variant');
    expect(evaluation.levers.find((leva) => leva.lever === 'load')?.reason).toContain(
      'Prima la variante',
    );
  });

  it('6.8 con la variante in attesa (R7) · la zavorra non prende il suo posto', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A1',
        loggedSets: sets([8, 8, 8]),
        state: { ...TRAZIONI_SENZA_TEMPO, level: 1 },
        salita: { consentita: false, inizio: '2026-03-09', dal: '2026-03-23' },
      }),
    );
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.levers.find((leva) => leva.lever === 'load')?.available).toBe(false);
    expect(evaluation.blockedReason).toContain('Un gradino ogni due settimane');
    expect(evaluation.blockedReason).not.toContain('esaurito');
  });

  it('6.4 · all’ultimo gradino, con il test sopra la soglia, la zavorra arriva', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A1',
        loggedSets: sets([8, 8, 8]),
        state: { ...TRAZIONI_SENZA_TEMPO, level: 6 },
        currentMaxReps: 12,
      }),
    );
    expect(evaluation.suggestion?.lever).toBe('load');
  });

  it('6.9 · all’ultimo gradino con un test sotto la soglia, niente zavorra', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A1',
        loggedSets: sets([8, 8, 8]),
        state: { ...TRAZIONI_SENZA_TEMPO, level: 6 },
        currentMaxReps: 6,
      }),
    );
    const carico = evaluation.levers.find((leva) => leva.lever === 'load');
    expect(evaluation.suggestion).toBeNull();
    expect(carico?.available).toBe(false);
    expect(carico?.reason).toContain('Ultimo test: 6');
  });

  it('6.6 · senza un test registrato, niente zavorra su trazioni e dip', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A1',
        loggedSets: sets([8, 8, 8]),
        state: { ...TRAZIONI_SENZA_TEMPO, level: 6 },
        currentMaxReps: null,
      }),
    );
    expect(evaluation.levers.find((leva) => leva.lever === 'load')?.reason).toContain(
      'serve un test',
    );
  });

  it('6.10 · dip all’ultimo gradino con 9 al test: sotto la soglia di 10', () => {
    const block = blockOf('circuito-1', 'A3');
    const exercise = getExercise(block.exercise);
    expect(exercise.pattern).not.toBeNull();
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A3',
        loggedSets: sets([20, 20, 20]),
        state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, level: 6 },
        currentMaxReps: 9,
      }),
    );
    expect(evaluation.levers.find((leva) => leva.lever === 'load')?.available).toBe(false);
    expect(evaluation.suggestion?.lever).not.toBe('load');
  });
});

describe('R7 · un gradino ogni due settimane', () => {
  const voce = (level: LevelIndex | null, slug = 'push-up'): LoggedExercise => ({
    ...loggedExercise(slug, sets([19, 19, 19])),
    level,
  });
  const seduta = (date: string, level: LevelIndex | null, status: 'completed' | 'in-progress' = 'completed') =>
    loggedSession(date, 1, [voce(level)], status, 'circuito-3');

  const W1W2 = [
    seduta('2026-03-02', 2),
    seduta('2026-03-05', 2),
    seduta('2026-03-09', 2),
    seduta('2026-03-12', 2),
  ];

  it('7.1 · dopo 7 giorni al gradino la salita non c’è ancora', () => {
    const esito = salitaConsentita('push-up', 2, W1W2.slice(0, 2), '2026-03-09');
    expect(esito).toEqual({ consentita: false, inizio: '2026-03-02', dal: '2026-03-16' });
  });

  it('7.2 · dopo 14 giorni sì', () => {
    expect(salitaConsentita('push-up', 2, W1W2, '2026-03-16').consentita).toBe(true);
  });

  it('7.3 · appena saliti, con la seduta di oggi al gradino nuovo: dal oggi + 14', () => {
    const oggi = seduta('2026-03-16', 3, 'in-progress');
    const esito = salitaConsentita('push-up', 3, [...W1W2, oggi], '2026-03-16', oggi);
    expect(esito).toEqual({ consentita: false, inizio: null, dal: '2026-03-30' });
  });

  it('7.8 · dopo una discesa il conto riparte dalla prima seduta al gradino più basso', () => {
    const storia = [seduta('2026-03-09', 3), seduta('2026-03-16', 3), seduta('2026-03-23', 2)];
    expect(salitaConsentita('push-up', 2, storia, '2026-04-05')).toEqual({
      consentita: false,
      inizio: '2026-03-23',
      dal: '2026-04-06',
    });
  });

  it('7.10 · con i soli stati di partenza, senza sedute, non si sale', () => {
    expect(salitaConsentita('push-up', 2, [], '2026-03-16')).toEqual({
      consentita: false,
      inizio: null,
      dal: null,
    });
  });

  it('7.11 · conta solo la serie ininterrotta finale al gradino', () => {
    const storia = [
      seduta('2026-03-02', 2),
      seduta('2026-03-05', 2),
      seduta('2026-03-09', 3),
      seduta('2026-03-12', 2),
    ];
    expect(salitaConsentita('push-up', 2, storia, '2026-03-20')).toEqual({
      consentita: false,
      inizio: '2026-03-12',
      dal: '2026-03-26',
    });
  });

  it('le sedute in corso e di altri esercizi non contano', () => {
    const storia = [
      seduta('2026-02-01', 2, 'in-progress'),
      loggedSession('2026-02-02', 1, [voce(2, 'trazioni-prona-presa-media')], 'completed', 'circuito-1'),
      seduta('2026-03-10', 2),
    ];
    expect(salitaConsentita('push-up', 2, storia, '2026-03-20').inizio).toBe('2026-03-10');
  });

  it('a fine seduta la variante in attesa non si propone e si passa al tempo', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A1',
        loggedSets: sets([9, 9, 9]),
        state: { level: 1 },
        salita: { consentita: false, inizio: '2026-03-09', dal: '2026-03-23' },
      }),
    );
    expect(evaluation.suggestion?.lever).not.toBe('variant');
    expect(evaluation.levers.find((leva) => leva.lever === 'variant')?.reason).toContain(
      'il prossimo si può proporre dal',
    );
  });

  it('6.2 · con la salita consentita, 1→3 sui range fissi è una salita sola', () => {
    const evaluation = evaluateProgression(
      input({
        sessionId: 'circuito-1',
        code: 'A1',
        loggedSets: sets([9, 9, 9]),
        state: { ...TRAZIONI_SENZA_TEMPO, level: 1 },
      }),
    );
    expect(evaluation.suggestion?.lever).toBe('variant');
    expect(evaluation.suggestion?.nextState.level).toBe(3);
  });
});
