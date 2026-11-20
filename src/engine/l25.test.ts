import { describe, expect, it } from 'vitest';
import { getExercise } from '../data/exercises.ts';
import type { SceltaRegistrata } from './decadenza.ts';
import { initialExerciseState } from './progression.ts';
import { statiDellaChiusura, tettoDelRiepilogo } from './tetto.ts';
import { loggedExercise, sets } from './__fixtures.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedSession } from '../types/index.ts';

/*
 * L25 (training/reports/2026-11-21-training.md §3): σ′ conta tutto quello che
 * la seduta scriverà. La durata qui è finta, per isolare la regola: 100 s per
 * gradino dell'hip thrust, 10 s per secondo di tempo o pausa su tutti.
 */

const HIP = 'hip-thrust-panca-bilaterale';
const REMATORE = 'rematore-manubrio-un-braccio';
const PRESS = 'military-press-manubri';
const st = (slug: ExerciseSlug, p: Partial<ExerciseState> = {}): ExerciseState => ({
  ...initialExerciseState(getExercise(slug)),
  ...p,
});
const durata = (stati: ReadonlyMap<ExerciseSlug, ExerciseState>): number =>
  [...stati.values()].reduce(
    (t, s) => t + (s.exercise === HIP ? (s.level ?? 0) * 100 : 0) + 10 * (s.eccentricBonusSeconds + s.bottomPauseBonusSeconds),
    0,
  );

describe('L25 · σ′ conta tutto quello che la seduta scriverà', () => {
  const base = new Map([
    [HIP, st(HIP, { level: 2 })],
    [REMATORE, st(REMATORE, { loadKg: 12, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 })],
    [PRESS, st(PRESS, { loadKg: 10 })],
  ]);

  it('L25.1 · una variante proposta sopra che allunga conta per il passo sotto', () => {
    const tetto = tettoDelRiepilogo(base, durata);
    const passo = st(PRESS, { loadKg: 10, eccentricBonusSeconds: 1 });
    expect(tetto.durataCon(passo)).toBe(200 + 40 + 10);
    tetto.proposta(st(HIP, { level: 3 as LevelIndex }));
    expect(tetto.durataCon(passo)).toBe(300 + 40 + 10);
  });

  it('L25.2 · una proposta che accorcia non conta: l’atleta può rifiutarla', () => {
    const tetto = tettoDelRiepilogo(base, durata);
    const passo = st(PRESS, { loadKg: 10, eccentricBonusSeconds: 1 });
    const prima = tetto.durataCon(passo);
    tetto.proposta(st(REMATORE, { loadKg: 14 }));
    expect(tetto.durataCon(passo)).toBe(prima);
  });

  it('L25.3 · un gradino scritto a mano entra dalla chiusura, con i bonus a zero (D-23)', () => {
    const S: LoggedSession = {
      id: 'S',
      date: '2026-03-26',
      week: 4,
      sessionId: 'circuito-4',
      status: 'in-progress',
      exercises: [{ ...loggedExercise(HIP, sets([12, 12, 12])), level: 3 }],
      note: null,
    };
    const chiusura = statiDellaChiusura(S, new Map([[HIP, st(HIP, { level: 2, eccentricBonusSeconds: 1 })]]), [], []);
    expect(chiusura.get(HIP)).toEqual(st(HIP, { level: 3 }));
  });

  it('L25.4 · una scelta tolta che rialza tempo e pausa entra dalla chiusura', () => {
    const CURL = 'curl-panca-inclinata';
    const c: SceltaRegistrata = {
      id: 'c',
      date: '2026-03-23',
      sessionLogId: 'revisione',
      exercise: CURL,
      blockCode: 'B1',
      lever: 'load',
      decision: 'accepted',
      stateBefore: st(CURL, { loadKg: 10, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 }),
      stateAfter: st(CURL, { loadKg: 12 }),
    };
    const S: LoggedSession = {
      id: 'S',
      date: '2026-03-26',
      week: 4,
      sessionId: 'circuito-4',
      status: 'in-progress',
      exercises: [{ ...loggedExercise(CURL, sets([10, 10, 10], 10)), level: null }],
      note: null,
    };
    const chiusura = statiDellaChiusura(S, new Map([[CURL, c.stateAfter]]), [c], []);
    expect(chiusura.get(CURL)).toEqual(c.stateBefore);
    expect(durata(chiusura)).toBe(40);
  });
});
