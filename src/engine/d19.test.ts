import { describe, expect, it } from 'vitest';
import { MANUBRI_KG } from '../data/method.ts';
import { getExercise } from '../data/exercises.ts';
import { getAnySession } from '../data/sessions.ts';
import { decadenze, testoManubrioInAttesa } from './decadenza.ts';
import type { SceltaRegistrata } from './decadenza.ts';
import { pesoIniziale, syncStatesFromLog } from './draft.ts';
import { aumenti, aumentoRecente, evaluateProgression, initialExerciseState, manubrioDopo } from './progression.ts';
import type { AumentoRecente } from './progression.ts';
import { latestTestResults, resolveBlockRange, testResultSingle } from './ranges.ts';
import { loggedExercise, sets } from './__fixtures.ts';
import type { ExerciseState, LoggedSession } from '../types/index.ts';

/*
 * D-19 (b), Alessio, 2026-11-20: il manubrio successivo esatto dall'elenco
 * dei suoi manubri. training/reports/2026-11-21-training.md §1, prove D19.x.
 */

const MARTELLO = 'curl-martello-manubri';
const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
const TEST = latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]);
const stato = (p: Partial<ExerciseState> = {}): ExerciseState => ({ ...initialExerciseState(getExercise(MARTELLO)), ...p });

let n = 0;
const seduta = (date: string, kg: number, status: LoggedSession['status'] = 'completed'): LoggedSession => {
  n += 1;
  return {
    id: `d19-${date}-${String(n)}`,
    date,
    week: 4,
    sessionId: 'circuito-1',
    status,
    exercises: [{ ...loggedExercise(MARTELLO, sets([10, 10, 10], kg), { blockCode: 'B1' }), level: null }],
    note: null,
  };
};
const scelta = (date: string, prima: Partial<ExerciseState>, dopo: Partial<ExerciseState>): SceltaRegistrata => {
  n += 1;
  return {
    id: `c-${String(n)}`,
    date,
    sessionLogId: `revisione-${date}`,
    exercise: MARTELLO,
    blockCode: 'B1',
    lever: 'load',
    decision: 'accepted',
    stateBefore: stato(prima),
    stateAfter: stato({ ...prima, ...dopo }),
  };
};

function fine(kg: number, L: ExerciseState, week = 4, recente: AumentoRecente | null = null) {
  const block = getAnySession('circuito-1').blocks.find((b) => b.code === 'B1');
  if (block === undefined) throw new Error('B1');
  const exercise = getExercise(MARTELLO);
  return evaluateProgression({
    block,
    exercise,
    state: L,
    logged: { ...loggedExercise(MARTELLO, sets([10, 10, 10], kg), { blockCode: 'B1' }), level: null },
    range: resolveBlockRange(block, exercise, TEST),
    week,
    currentMaxReps: 12,
    salita: { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' },
    rientro: null,
    aumentoRecente: recente,
    pesoScrittoPrima: true,
  });
}

describe('D-19 (b) · il manubrio successivo esatto', () => {
  it('D19.1-D19.3 · manubrioDopo', () => {
    expect([3, 9, 10, 12, 22].map((v) => manubrioDopo(v))).toEqual(
      [4, 10, 12, 14, 24].map((kg) => ({ tipo: 'successivo', kg })),
    );
    expect(manubrioDopo(24)).toEqual({ tipo: 'cima' });
    expect(manubrioDopo(0)).toEqual({ tipo: 'mai-scritto' });
    for (const v of [2, 11, 14.5, 26]) expect(manubrioDopo(v), String(v)).toEqual({ tipo: 'fuori-elenco' });
    expect(manubrioDopo(4, [4, 8])).toEqual({ tipo: 'oltre-s2', kg: 8 });
  });

  it('D19.4 · il dato: elenco esatto, crescente, positivo, salti entro 2,5 kg', () => {
    expect(MANUBRI_KG).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24]);
    for (let i = 1; i < MANUBRI_KG.length; i += 1) {
      const a = MANUBRI_KG[i - 1] ?? 0;
      const b = MANUBRI_KG[i] ?? 0;
      expect(b).toBeGreaterThan(a);
      expect(b - a).toBeLessThanOrEqual(2.5);
    }
    expect(MANUBRI_KG.every((v) => v > 0)).toBe(true);
  });

  it('D19.5 e D19.6 · da 10 a 12, da 3 a 4', () => {
    const e = fine(10, stato({ loadKg: 10, ...ESAURITI }));
    expect(e.suggestion?.lever).toBe('load');
    expect(e.suggestion?.change).toBe(
      'Passa al manubrio da 12 kg: oggi usi 10 kg. Tempo e pausa tornano a quelli della scheda. Nel player il peso parte da 10 kg: quando prendi quello da 12 kg, scrivilo in ogni serie. Da lì in poi comanda quello che scrivi.',
    );
    expect(e.suggestion?.nextState).toEqual(stato({ loadKg: 12 }));
    const tre = fine(3, stato({ loadKg: 3, ...ESAURITI }));
    expect(tre.suggestion?.nextState.loadKg).toBe(4);
    expect(tre.suggestion?.change).toContain('Passa al manubrio da 4 kg: oggi usi 3 kg.');
  });

  it('D19.7 · in cima: niente leva, «leve finite» con il motivo, nessun R13', () => {
    const recente: AumentoRecente = { date: '2026-03-23', cosa: 'peso scritto da te, 22 → 24 kg', dal: '2026-03-30' };
    const e = fine(24, stato({ loadKg: 24, ...ESAURITI }), 4, recente);
    expect(e.suggestion).toBeNull();
    expect(e.levers.find((l) => l.lever === 'load')?.reason).toBe('24 kg è il manubrio più pesante che hai: il manubrio non sale più.');
    expect(e.blockedReason).toBe(
      'Hai esaurito tutte le leve disponibili su questo esercizio: 24 kg è il manubrio più pesante che hai. Serve un cambio di programmazione, non un altro giro.',
    );
  });

  it('D19.8, D19.9, D19.10 · fuori elenco, mai scritto, e la settimana prima di tutto', () => {
    expect(fine(14.5, stato({ loadKg: 14.5, ...ESAURITI })).blockedReason).toBe(
      '14,5 kg non è fra i tuoi manubri: scrivi nel player il peso che usi davvero, e il prossimo si calcola da lì.',
    );
    expect(fine(0, stato({ loadKg: 0, ...ESAURITI })).blockedReason).toBe(
      'Peso mai scritto su questo esercizio: scrivi nel player il manubrio che usi, e il prossimo si calcola da lì.',
    );
    expect(fine(14.5, stato({ loadKg: 14.5, ...ESAURITI }), 2).blockedReason).toContain('settimana 3');
  });

  it('D19.13 · R13: scelta 10 → 12 in attesa', () => {
    const c = scelta('2026-03-23', { loadKg: 10 }, { loadKg: 12 });
    expect(aumentoRecente(MARTELLO, [c], [seduta('2026-03-19', 10)], '2026-03-27')).toEqual({
      date: '2026-03-23',
      cosa: 'manubrio successivo scelto, 10 → 12 kg',
      dal: '2026-03-30',
    });
  });

  it('D19.15 · eseguita a 14 kg', () => {
    const c = scelta('2026-03-23', { loadKg: 12 }, { loadKg: 14 });
    const storico = [seduta('2026-03-19', 12), seduta('2026-03-26', 14)];
    expect(aumenti(MARTELLO, [c], storico).map((a) => `${a.date} ${a.cosa}`)).toEqual([
      '2026-03-26 carico 12 → 14 kg, scelta del lunedì 23 marzo',
    ]);
    expect(aumentoRecente(MARTELLO, [c], storico, '2026-03-27')?.dal).toBe('2026-04-02');
  });

  it('D19.16 · eseguita a 11 kg, fuori elenco: la volta dopo il manubrio chiede il peso vero', () => {
    const c = scelta('2026-03-23', { loadKg: 10 }, { loadKg: 12 });
    const al26 = seduta('2026-03-26', 11);
    expect(aumenti(MARTELLO, [c], [seduta('2026-03-19', 10), al26]).map((a) => a.cosa)).toEqual([
      'carico 10 → 11 kg, scelta del lunedì 23 marzo',
    ]);
    expect(syncStatesFromLog(al26, new Map([[MARTELLO, c.stateAfter]]))[0]).toEqual(stato({ loadKg: 11 }));
    expect(fine(11, stato({ loadKg: 11, ...ESAURITI })).blockedReason).toContain('11 kg non è fra i tuoi manubri');
  });

  it('D19.17 · superata a 14,5 kg', () => {
    const c = scelta('2026-03-23', { loadKg: 12 }, { loadKg: 14 });
    const storico = [seduta('2026-03-19', 12), seduta('2026-03-26', 14.5)];
    expect(aumenti(MARTELLO, [c], storico).map((a) => `${a.date} ${a.cosa}`)).toEqual([
      '2026-03-23 manubrio successivo scelto, 12 → 14 kg',
      '2026-03-26 peso scritto da te, 12 → 14,5 kg',
    ]);
  });

  it('D19.18 · R14: non eseguita, il testo con la scelta esatta', () => {
    const c = scelta('2026-03-23', { loadKg: 12, ...ESAURITI }, { loadKg: 14, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 });
    const S = seduta('2026-03-26', 12, 'in-progress');
    const [d] = decadenze(S, [c], [seduta('2026-03-19', 12)], new Map([[MARTELLO, c.stateAfter]]));
    expect(d?.testo).toBe(
      'Oggi hai usato 12 kg, il peso di prima: la scelta del lunedì 23 marzo (manubrio successivo, 12 → 14 kg) non è stata eseguita e si toglie. Tempo e pausa tornano a quelli che avevi su 12 kg. Il prossimo passo si valuta dalla prossima seduta.',
    );
    expect(d?.stato).toEqual(stato({ loadKg: 12, ...ESAURITI }));
  });

  it('D19.19 e D19.20 · R14d: il manubrio parte dal peso di prima, la zavorra dal nuovo', () => {
    const c = scelta('2026-03-23', { loadKg: 12 }, { loadKg: 14 });
    expect(pesoIniziale(true, 14, 12)).toBe(12);
    expect(testoManubrioInAttesa(MARTELLO, [c], [seduta('2026-03-19', 12)], c.stateAfter, 'oggi')).toBe(
      'Manubrio scelto: 14 kg. Il peso parte da 12 kg, quello di prima: se prendi quello da 14 kg, scrivilo in ogni serie. Se resti a 12 kg la scelta si toglie e tempo e pausa tornano come prima.',
    );
    const vecchia = scelta('2026-03-23', { loadKg: 12 }, { loadKg: 14.5 });
    expect(testoManubrioInAttesa(MARTELLO, [vecchia], [], vecchia.stateAfter, 'oggi')).toBe(
      'Manubrio successivo: al massimo 14,5 kg. Scrivi il peso che usi davvero; se resti a 12 kg la scelta si toglie e tempo e pausa tornano come prima.',
    );
    expect(testoManubrioInAttesa(MARTELLO, [], [], stato({ loadKg: 12 }), 'oggi')).toBeNull();
    expect(pesoIniziale(false, 5, 2.5)).toBe(5);
  });

  it('D19.P · ogni proposta di manubrio è nell’elenco e sale di 1 o 2 kg; mai da fuori elenco o da 0', () => {
    for (const v of [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12.5, 14, 14.5, 16, 18, 20, 22, 24, 26]) {
      const proposta = fine(v, stato({ loadKg: v, ...ESAURITI })).suggestion;
      if (proposta?.lever !== 'load') {
        expect(MANUBRI_KG.includes(v) && v !== 24, String(v)).toBe(false);
        continue;
      }
      expect(MANUBRI_KG.includes(proposta.nextState.loadKg), String(v)).toBe(true);
      expect([1, 2].includes(proposta.nextState.loadKg - v), String(v)).toBe(true);
    }
  });
});
