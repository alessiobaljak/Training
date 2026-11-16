import { describe, expect, it } from 'vitest';
import {
  aumenti,
  aumentoRecente,
  evaluateProgression,
  initialExerciseState,
} from './progression.ts';
import type { AumentoRecente, ProgressionInput } from './progression.ts';
import { latestTestResults, resolveBlockRange, testResultSingle } from './ranges.ts';
import { syncStatesFromLog } from './draft.ts';
import { getExercise } from '../data/exercises.ts';
import { getAnySession } from '../data/sessions.ts';
import { loggedExercise, sets } from './__fixtures.ts';
import type {
  DecisioneRegistrata,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedSession,
  SessionId,
} from '../types/index.ts';

/*
 * R13 a fine seduta (un aumento per esercizio ogni 7 giorni, D-4 a) e il
 * manubrio come leva 5 (R10c-1, D-19). Tabelle di
 * training/reports/2026-11-16-training.md.
 */

const TRAZIONI = 'trazioni-prona-presa-media';
const MARTELLO = 'curl-martello-manubri';
const PUSH = 'push-up';
const BLOCCO: Record<string, { sessionId: SessionId; code: string }> = {
  [TRAZIONI]: { sessionId: 'circuito-1', code: 'A1' },
  [MARTELLO]: { sessionId: 'circuito-1', code: 'B1' },
  [PUSH]: { sessionId: 'circuito-3', code: 'A2' },
};
const TEST = latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]);
const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;

function stato(slug: ExerciseSlug, parziale: Partial<ExerciseState> = {}): ExerciseState {
  const exercise = getExercise(slug);
  return { ...initialExerciseState(exercise), level: exercise.pattern === null ? null : 2, ...parziale };
}

let progressivo = 0;
function seduta(
  date: string,
  slug: ExerciseSlug,
  values: readonly number[],
  options: { level?: LevelIndex | null; loadKg?: number; status?: LoggedSession['status'] } = {},
): LoggedSession {
  progressivo += 1;
  const blocco = BLOCCO[slug];
  if (blocco === undefined) throw new Error(slug);
  return {
    id: `${date}-${String(progressivo)}`,
    date,
    week: 4,
    sessionId: blocco.sessionId,
    status: options.status ?? 'completed',
    exercises: [
      {
        ...loggedExercise(slug, sets(values, options.loadKg ?? 0), { blockCode: blocco.code }),
        level: options.level === undefined ? (getExercise(slug).pattern === null ? null : 2) : options.level,
      },
    ],
    note: null,
  };
}

const scelta = (
  date: string,
  slug: ExerciseSlug,
  prima: Partial<ExerciseState>,
  dopo: Partial<ExerciseState>,
  decision: 'accepted' | 'postponed' = 'accepted',
): DecisioneRegistrata => ({
  date,
  exercise: slug,
  decision,
  stateBefore: stato(slug, prima),
  stateAfter: stato(slug, { ...prima, ...dopo }),
});

function fineSeduta(
  draft: LoggedSession,
  state: ExerciseState,
  recente: AumentoRecente | null,
  week = 4,
): ReturnType<typeof evaluateProgression> {
  const voce = draft.exercises[0];
  if (voce === undefined) throw new Error('voce');
  const blocco = BLOCCO[voce.exercise];
  if (blocco === undefined) throw new Error('blocco');
  const block = getAnySession(blocco.sessionId).blocks.find((entry) => entry.code === blocco.code);
  if (block === undefined) throw new Error('blocco');
  const exercise = getExercise(voce.exercise);
  const input: ProgressionInput = {
    block,
    exercise,
    state,
    logged: voce,
    range: resolveBlockRange(block, exercise, TEST),
    week,
    currentMaxReps: 12,
    salita: { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' },
    rientro: null,
    aumentoRecente: recente,
  };
  return evaluateProgression(input);
}

describe('R13 · aumenti dal registro e dal diario', () => {
  it('un peso scritto dall’atleta più alto della volta prima è un aumento', () => {
    const lista = aumenti(MARTELLO, [], [seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 })], seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' }));
    expect(lista).toEqual([expect.objectContaining({ date: '2026-03-26', tipi: ['carico'] })]);
    expect(lista[0]?.cosa).toBe('peso scritto da te, 12 → 14 kg');
  });

  it('eseguire una scelta accettata non è un secondo aumento', () => {
    const lista = aumenti(
      TRAZIONI,
      [scelta('2026-03-23', TRAZIONI, { level: 6 }, { loadKg: 2.5 })],
      [seduta('2026-03-19', TRAZIONI, [8, 8, 8], { level: 6 }), seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5 })],
    );
    expect(lista).toHaveLength(1);
    expect(lista[0]?.date).toBe('2026-03-23');
  });

  it('le decisioni rimandate e le discese non sono aumenti', () => {
    expect(aumenti(PUSH, [scelta('2026-03-16', PUSH, {}, { eccentricBonusSeconds: 1 }, 'postponed')], [])).toHaveLength(0);
    expect(aumenti(PUSH, [scelta('2026-03-16', PUSH, { level: 3 }, { level: 2 })], [])).toHaveLength(0);
  });
});

describe('R13 · a fine seduta', () => {
  const zavorra = [scelta('2026-03-23', TRAZIONI, { level: 6, ...ESAURITI }, { loadKg: 2.5 })];
  const storico = [seduta('2026-03-19', TRAZIONI, [8, 8, 8], { level: 6 })];

  it('13.3 · +2,5 kg accettato lunedì in revisione: giovedì nessuna leva', () => {
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const recente = aumentoRecente(TRAZIONI, zavorra, storico, draft.date, draft);
    expect(recente?.dal).toBe('2026-03-30');
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI }), recente);
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toContain('Un aumento per esercizio ogni 7 giorni');
    expect(e.blockedReason).toContain('dal lunedì 30 marzo');
  });

  it('13.4 · sette giorni dopo il carico torna disponibile', () => {
    const draft = seduta('2026-03-30', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const recente = aumentoRecente(TRAZIONI, zavorra, storico, draft.date, draft);
    expect(recente).toBeNull();
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI }), recente);
    expect(e.suggestion?.lever).toBe('load');
    expect(e.suggestion?.nextState.loadKg).toBe(5);
  });

  it('13.5 · due sedute lo stesso giorno: alla seconda nessuna leva', () => {
    const prima = [scelta('2026-03-26', TRAZIONI, { level: 6, ...ESAURITI }, { loadKg: 2.5 })];
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    expect(aumentoRecente(TRAZIONI, prima, storico, draft.date, draft)).not.toBeNull();
  });

  it('13.6 · manubrio cambiato dall’atleta: nessun altro aumento per 7 giorni', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' });
    const recente = aumentoRecente(MARTELLO, [], [seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 })], draft.date, draft);
    expect(recente?.cosa).toBe('peso scritto da te, 12 → 14 kg');
    expect(recente?.dal).toBe('2026-04-02');
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 14 }), recente);
    expect(e.suggestion).toBeNull();
  });

  it('13.7 · una decisione rimandata non ferma niente', () => {
    const rimandata = [scelta('2026-03-23', TRAZIONI, { level: 6, ...ESAURITI }, {}, 'postponed')];
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, status: 'in-progress' });
    const recente = aumentoRecente(TRAZIONI, rimandata, storico, draft.date, draft);
    expect(recente).toBeNull();
    expect(fineSeduta(draft, stato(TRAZIONI, { level: 6, ...ESAURITI }), recente).suggestion?.lever).toBe('load');
  });

  it('13.8 · D-4 (a): tempo accettato lunedì, giovedì nemmeno il gradino', () => {
    const draft = seduta('2026-03-19', PUSH, [19, 19, 19], { status: 'in-progress' });
    const recente = aumentoRecente(PUSH, [scelta('2026-03-16', PUSH, {}, { eccentricBonusSeconds: 1 })], [], draft.date, draft);
    expect(recente?.dal).toBe('2026-03-23');
    const e = fineSeduta(draft, stato(PUSH, { eccentricBonusSeconds: 1 }), recente);
    expect(e.suggestion).toBeNull();
    expect(e.levers.find((leva) => leva.lever === 'variant')?.available).toBe(false);
  });
});

describe('R10c-1 · il manubrio successivo a fine seduta (D-19)', () => {
  it('10.15 · a bonus 0 la leva è il tempo, come prima', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    expect(fineSeduta(draft, stato(MARTELLO, { loadKg: 12 }), null).suggestion?.lever).toBe('tempo');
  });

  it('con tempo e pausa al massimo: manubrio successivo, al massimo +2,5 kg, tempo alla scheda', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 12, ...ESAURITI }), null);
    expect(e.suggestion?.lever).toBe('load');
    expect(e.suggestion?.nextState).toEqual(
      expect.objectContaining({ loadKg: 14.5, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    );
    expect(e.suggestion?.change).toContain('al massimo 14,5 kg');
  });

  it('nelle prime due settimane il manubrio non si cambia', () => {
    const draft = seduta('2026-03-05', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 12, ...ESAURITI }), null, 1);
    expect(e.suggestion).toBeNull();
  });

  it('cambiare manubrio di propria iniziativa riporta tempo e pausa alla scheda', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' });
    const cambiati = syncStatesFromLog(draft, new Map([[MARTELLO, stato(MARTELLO, { loadKg: 12, ...ESAURITI })]]));
    expect(cambiati).toEqual([
      expect.objectContaining({ loadKg: 14, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    ]);
  });
});
