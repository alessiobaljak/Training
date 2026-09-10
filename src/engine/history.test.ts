import { describe, expect, it } from 'vitest';
import {
  exerciseHistory,
  filterLogRows,
  logRows,
  loggedExerciseSlugs,
  maxSetCount,
} from './history.ts';
import { loggedExercise, loggedSession, perSideSets, sets } from './__fixtures.ts';
import type { LoggedSession } from '../types/index.ts';

const history: LoggedSession[] = [
  loggedSession('2026-09-14', 1, [
    { ...loggedExercise('trazioni-prona-presa-media', sets([7, 7, 6, 6]), { blockCode: 'A2' }), level: 3, variantLabel: 'Liv. 3 · Trazioni complete' },
    { ...loggedExercise('dip-parallele-anelli', sets([9, 9, 8]), { blockCode: 'A1' }), level: 3, variantLabel: 'Liv. 3 · Dip completi' },
  ]),
  loggedSession('2026-09-21', 2, [
    { ...loggedExercise('trazioni-prona-presa-media', sets([8, 8, 7, 7]), { blockCode: 'A2' }), level: 3, variantLabel: 'Liv. 3 · Trazioni complete' },
  ]),
  loggedSession('2026-09-28', 3, [
    { ...loggedExercise('trazioni-prona-presa-media', sets([6, 5, 5, 5], 2.5), { blockCode: 'A2' }), level: 4, variantLabel: 'Liv. 4 · con pausa' },
  ]),
];

describe('righe del log', () => {
  it('una riga per esercizio registrato, in ordine di data', () => {
    const rows = logRows(history);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.date)).toEqual([
      '2026-09-14',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
    ]);
  });

  it('salta gli esercizi senza nessuna serie', () => {
    const empty = loggedSession('2026-10-05', 4, [
      loggedExercise('trazioni-prona-presa-media', [], { blockCode: 'A2' }),
    ]);
    expect(logRows([empty])).toEqual([]);
  });

  it('porta le colonne del foglio Log', () => {
    const row = logRows(history)[0];
    expect(row).toMatchObject({
      date: '2026-09-14',
      week: 1,
      sessionName: 'Upper A',
      exerciseName: 'Trazioni prona presa media',
      variantLabel: 'Liv. 3 · Trazioni complete',
      total: 26,
    });
    expect(row?.setLabels).toEqual(['7', '7', '6', '6']);
  });

  it('sugli esercizi per lato tiene i due valori nell’etichetta e li somma nel totale', () => {
    const perSide = loggedSession('2026-09-15', 1, [
      loggedExercise('bulgarian-split-squat', perSideSets([[9, 8], [9, 8]]), { blockCode: 'A' }),
    ]);
    const row = logRows([perSide])[0];
    expect(row?.setLabels).toEqual(['9/8', '9/8']);
    expect(row?.setTotals).toEqual([17, 17]);
    expect(row?.total).toBe(34);
  });
});

describe('filtri', () => {
  const rows = logRows(history);

  it('per esercizio', () => {
    expect(filterLogRows(rows, { exercise: 'dip-parallele-anelli' })).toHaveLength(1);
  });

  it('per periodo, estremi inclusi', () => {
    expect(filterLogRows(rows, { from: '2026-09-21' })).toHaveLength(2);
    expect(filterLogRows(rows, { to: '2026-09-14' })).toHaveLength(2);
    expect(filterLogRows(rows, { from: '2026-09-21', to: '2026-09-21' })).toHaveLength(1);
  });

  it('per tipo di seduta', () => {
    expect(filterLogRows(rows, { sessionId: 'lower-a' })).toHaveLength(0);
    expect(filterLogRows(rows, { sessionId: 'upper-a' })).toHaveLength(4);
  });

  it('senza filtri non toglie niente', () => {
    expect(filterLogRows(rows, {})).toHaveLength(4);
  });
});

describe('storia di un esercizio', () => {
  const points = exerciseHistory(history, 'trazioni-prona-presa-media');

  it('prende solo quell’esercizio, in ordine di data', () => {
    expect(points).toHaveLength(3);
    expect(points.map((point) => point.total)).toEqual([26, 30, 21]);
  });

  it('il primo punto non è mai un cambio', () => {
    expect(points[0]?.levelChanged).toBe(false);
    expect(points[0]?.loadChanged).toBe(false);
  });

  it('segnala il cambio di livello', () => {
    expect(points[1]?.levelChanged).toBe(false);
    expect(points[2]?.levelChanged).toBe(true);
  });

  it('segnala il cambio di zavorra', () => {
    expect(points[2]?.loadChanged).toBe(true);
    expect(points[2]?.loadKg).toBe(2.5);
  });

  it('il calo dopo un salto di variante resta visibile insieme al marker', () => {
    // 30 ripetizioni totali diventano 21: senza il marker sembrerebbe un crollo.
    const jump = points[2];
    expect(jump?.total).toBeLessThan(points[1]?.total ?? 0);
    expect(jump?.levelChanged).toBe(true);
  });

  it('un esercizio mai registrato non ha storia', () => {
    expect(exerciseHistory(history, 'nordic-curl')).toEqual([]);
  });
});

describe('elenco degli esercizi registrati', () => {
  it('sono in ordine alfabetico per nome', () => {
    expect(loggedExerciseSlugs(history)).toEqual([
      'dip-parallele-anelli',
      'trazioni-prona-presa-media',
    ]);
  });

  it('senza log non c’è nulla da scegliere', () => {
    expect(loggedExerciseSlugs([])).toEqual([]);
  });
});

describe('numero massimo di serie', () => {
  it('è quello della riga più lunga', () => {
    expect(maxSetCount(logRows(history))).toBe(4);
    expect(maxSetCount([])).toBe(0);
  });
});
