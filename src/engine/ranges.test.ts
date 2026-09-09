import { describe, expect, it } from 'vitest';
import {
  EMPTY_RANGE,
  classifyValue,
  computeWorkRange,
  formatRange,
  isUsableRange,
  latestTestResults,
  resolveBlockRange,
  shiftRange,
  testResultPerSide,
  testResultSingle,
} from './ranges.ts';
import { TEST_REFERENCE_ROWS } from '../data/reference.ts';
import { getExercise } from '../data/exercises.ts';
import { getSession } from '../data/program.ts';
import type { ProgramBlock, TestId, TestResult } from '../types/index.ts';

function blockOf(sessionId: Parameters<typeof getSession>[0], code: string): ProgramBlock {
  const block = getSession(sessionId).blocks.find((candidate) => candidate.code === code);
  if (block === undefined) throw new Error(`Blocco mancante: ${sessionId}/${code}`);
  return block;
}

const noTests: ReadonlyMap<TestId, TestResult> = new Map();

describe('calcolo del range di lavoro', () => {
  it('riproduce i range della scheda su tutte le righe che seguono la formula', () => {
    for (const row of TEST_REFERENCE_ROWS.filter((r) => !r.divergesFromFormula)) {
      expect(computeWorkRange(row.maxReps), row.testId).toEqual({
        min: row.rangeMin,
        max: row.rangeMax,
      });
    }
  });

  it('arrotonda a metà per eccesso', () => {
    expect(computeWorkRange(10)).toEqual({ min: 6, max: 8 });
    expect(computeWorkRange(30)).toEqual({ min: 17, max: 23 });
    expect(computeWorkRange(18)).toEqual({ min: 10, max: 14 });
  });

  it('massimale a zero: nessun range utilizzabile', () => {
    expect(computeWorkRange(0)).toEqual(EMPTY_RANGE);
    expect(isUsableRange(computeWorkRange(0))).toBe(false);
  });

  it('massimale negativo o non numerico: nessun range utilizzabile', () => {
    expect(computeWorkRange(-5)).toEqual(EMPTY_RANGE);
    expect(computeWorkRange(Number.NaN)).toEqual(EMPTY_RANGE);
    expect(computeWorkRange(Number.POSITIVE_INFINITY)).toEqual(EMPTY_RANGE);
  });

  it('non scende mai sotto una ripetizione con massimali piccoli', () => {
    expect(computeWorkRange(1)).toEqual({ min: 1, max: 1 });
    expect(computeWorkRange(2)).toEqual({ min: 1, max: 2 });
    expect(computeWorkRange(3)).toEqual({ min: 2, max: 2 });
    for (let max = 1; max <= 60; max += 1) {
      const range = computeWorkRange(max);
      expect(range.min, String(max)).toBeGreaterThanOrEqual(1);
      expect(range.max, String(max)).toBeGreaterThanOrEqual(range.min);
    }
  });

  it('funziona identico sulle isometrie, che misurano secondi', () => {
    expect(computeWorkRange(45)).toEqual({ min: 25, max: 34 });
    expect(computeWorkRange(60)).toEqual({ min: 33, max: 45 });
  });
});

describe('offset del range', () => {
  it('riproduce il "test trazioni −2" della scheda', () => {
    expect(shiftRange(computeWorkRange(10), -2)).toEqual({ min: 4, max: 6 });
  });

  it('sposta il range calcolato, non il massimale prima del calcolo', () => {
    // La scheda non basta a distinguere le due letture: con 10 massime
    // entrambe danno 4-6. A 12 massime divergono, ed è la lettura letterale
    // di "range test −2" a valere: si sottrae dal range, non dal massimale.
    expect(shiftRange(computeWorkRange(12), -2)).toEqual({ min: 5, max: 7 });
    expect(computeWorkRange(12 - 2)).toEqual({ min: 6, max: 8 });
  });

  it('sposta entrambi gli estremi', () => {
    expect(shiftRange({ min: 10, max: 14 }, -2)).toEqual({ min: 8, max: 12 });
    expect(shiftRange({ min: 10, max: 14 }, 3)).toEqual({ min: 13, max: 17 });
  });

  it('non scende mai sotto una ripetizione', () => {
    expect(shiftRange({ min: 2, max: 3 }, -5)).toEqual({ min: 1, max: 1 });
    expect(shiftRange({ min: 1, max: 1 }, -1)).toEqual({ min: 1, max: 1 });
  });

  it('lascia intatto un range non utilizzabile', () => {
    expect(shiftRange(EMPTY_RANGE, -2)).toEqual(EMPTY_RANGE);
  });
});

describe('posizione rispetto al range', () => {
  const range = { min: 6, max: 8 };

  it('classifica sotto, dentro e sopra', () => {
    expect(classifyValue(5, range)).toBe('under');
    expect(classifyValue(6, range)).toBe('in');
    expect(classifyValue(7, range)).toBe('in');
    expect(classifyValue(8, range)).toBe('in');
    expect(classifyValue(9, range)).toBe('over');
  });

  it('gli estremi sono dentro il range, non fuori', () => {
    expect(classifyValue(range.min, range)).toBe('in');
    expect(classifyValue(range.max, range)).toBe('in');
  });
});

describe('formattazione', () => {
  it('scrive un solo numero quando gli estremi coincidono', () => {
    expect(formatRange({ min: 12, max: 12 }, 'reps')).toBe('12');
    expect(formatRange({ min: 6, max: 8 }, 'reps')).toBe('6-8');
    expect(formatRange({ min: 30, max: 45 }, 'seconds')).toBe('30-45"');
  });
});

describe('risultati dei test', () => {
  it('un test per lato programma sul lato più debole', () => {
    const result = testResultPerSide('bulgarian-split-squat', '2026-09-14', 0, 15, 12);
    expect(result.value).toBe(12);
    expect(result.left).toBe(15);
    expect(result.right).toBe(12);
    expect(computeWorkRange(result.value)).toEqual({ min: 7, max: 9 });
  });

  it('un test bilaterale non ha lati', () => {
    const result = testResultSingle('pull-up', '2026-09-14', 0, 10);
    expect(result.left).toBeNull();
    expect(result.right).toBeNull();
  });

  it('tiene il risultato più recente per ogni test', () => {
    const latest = latestTestResults([
      testResultSingle('pull-up', '2026-09-14', 0, 10),
      testResultSingle('pull-up', '2026-10-26', 6, 13),
      testResultSingle('dip', '2026-09-14', 0, 12),
    ]);
    expect(latest.get('pull-up')?.value).toBe(13);
    expect(latest.get('dip')?.value).toBe(12);
    expect(latest.size).toBe(2);
  });

  it('a parità di data preferisce la settimana più alta', () => {
    const latest = latestTestResults([
      testResultSingle('pull-up', '2026-10-26', 6, 13),
      testResultSingle('pull-up', '2026-10-26', 0, 10),
    ]);
    expect(latest.get('pull-up')?.value).toBe(13);
  });
});

describe('risoluzione del range di un blocco', () => {
  const tests = latestTestResults([
    testResultSingle('pull-up', '2026-09-14', 0, 10),
    testResultSingle('dip', '2026-09-14', 0, 12),
    testResultSingle('hollow-hold', '2026-09-14', 0, 45),
  ]);

  it('deriva il range dal test citato', () => {
    const block = blockOf('upper-a', 'A1');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), tests);
    expect(resolved).toEqual({
      kind: 'range',
      range: { min: 7, max: 9 },
      unit: 'reps',
      source: 'test',
      testId: 'dip',
    });
  });

  it('applica l’offset del giovedì', () => {
    const block = blockOf('upper-b', 'A1');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), tests);
    expect(resolved.kind === 'range' && resolved.range).toEqual({ min: 4, max: 6 });
  });

  it('l’offset resta sul range anche con un massimale diverso da quello della scheda', () => {
    const block = blockOf('upper-b', 'A1');
    const other = latestTestResults([testResultSingle('pull-up', '2026-10-26', 6, 12)]);
    const resolved = resolveBlockRange(block, getExercise(block.exercise), other);
    expect(resolved.kind === 'range' && resolved.range).toEqual({ min: 5, max: 7 });
  });

  it('usa il range fisso quando la scheda lo scrive', () => {
    const block = blockOf('upper-a', 'C1');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), tests);
    expect(resolved).toEqual({
      kind: 'range',
      range: { min: 15, max: 20 },
      unit: 'reps',
      source: 'fixed',
      testId: null,
    });
  });

  it('la skill isometrica del sabato ha un range in secondi', () => {
    const block = blockOf('shadow', 'A');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), tests);
    expect(resolved).toEqual({
      kind: 'range',
      range: { min: 30, max: 45 },
      unit: 'seconds',
      source: 'fixed',
      testId: null,
    });
  });

  it('il dead hang a cedimento non ha un massimo da rispettare', () => {
    const block = blockOf('shadow', 'E');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), tests);
    expect(resolved.kind).toBe('not-applicable');
  });

  it('il cluster myo-reps non ha un range', () => {
    const block = blockOf('upper-b', 'D');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), tests);
    expect(resolved.kind).toBe('not-applicable');
  });

  it('le attività a durata non hanno un range', () => {
    const block = blockOf('zona-2', 'A');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), tests);
    expect(resolved.kind).toBe('not-applicable');
  });

  it('segnala il test mancante invece di inventare numeri', () => {
    const block = blockOf('upper-a', 'A2');
    const resolved = resolveBlockRange(block, getExercise(block.exercise), noTests);
    expect(resolved).toEqual({ kind: 'missing-test', testId: 'pull-up' });
  });

  it('senza alcun test, ogni blocco che dipende da un massimale si blocca', () => {
    const blocked: string[] = [];
    for (const sessionId of ['upper-a', 'lower-a', 'upper-b', 'lower-b', 'shadow'] as const) {
      for (const block of getSession(sessionId).blocks) {
        const resolved = resolveBlockRange(block, getExercise(block.exercise), noTests);
        if (resolved.kind === 'missing-test') blocked.push(`${sessionId}/${block.code}`);
      }
    }
    expect(blocked).toEqual([
      'upper-a/A1',
      'upper-a/A2',
      'upper-a/B1',
      'upper-a/B2',
      'lower-a/A',
      'upper-b/A1',
      'upper-b/A2',
    ]);
  });
});
