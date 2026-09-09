import { describe, expect, it } from 'vitest';
import { FIXED_RANGES_BY_BLOCK, LOG_CSV_COLUMNS, TEST_REFERENCE_ROWS } from './reference.ts';
import { REP_RANGE_MIN_FACTOR, REP_RANGE_MAX_FACTOR } from './method.ts';
import { WEEK_ZERO_TESTS } from './tests.ts';
import { PROGRAM_SESSIONS } from './program.ts';

/**
 * Il calcolo vero vivrà in src/engine/ranges.ts (Fase 2). Qui la formula è
 * ripetuta apposta: questo file verifica che la formula della specifica
 * riproduca i numeri scritti nella scheda, prima ancora che il motore esista.
 */
const rangeMin = (max: number) => Math.round(max * REP_RANGE_MIN_FACTOR);
const rangeMax = (max: number) => Math.round(max * REP_RANGE_MAX_FACTOR);

describe('valori di riferimento del foglio Test_Livelli', () => {
  it('copre tutti e nove i test, una riga ciascuno', () => {
    expect(TEST_REFERENCE_ROWS).toHaveLength(9);
    expect(TEST_REFERENCE_ROWS.map((r) => r.testId)).toEqual(WEEK_ZERO_TESTS.map((t) => t.id));
  });

  it('la formula 55%-75% riproduce i range della scheda', () => {
    const conformi = TEST_REFERENCE_ROWS.filter((r) => !r.divergesFromFormula);
    expect(conformi).toHaveLength(8);
    for (const row of conformi) {
      expect([rangeMin(row.maxReps), rangeMax(row.maxReps)], row.testId).toEqual([
        row.rangeMin,
        row.rangeMax,
      ]);
    }
  });

  it('il nordic curl è l’unico range della scheda che la formula non produce', () => {
    const divergenti = TEST_REFERENCE_ROWS.filter((r) => r.divergesFromFormula);
    expect(divergenti.map((r) => r.testId)).toEqual(['nordic-curl']);
    const nordic = divergenti[0];
    expect(nordic).toBeDefined();
    if (nordic === undefined) return;
    expect([rangeMin(nordic.maxReps), rangeMax(nordic.maxReps)]).toEqual([2, 3]);
    expect([nordic.rangeMin, nordic.rangeMax]).toEqual([3, 5]);
  });

  it('arrotonda a metà per eccesso, come la scheda', () => {
    // 10 × 0,55 = 5,5 → 6 ; 30 × 0,75 = 22,5 → 23 ; 18 × 0,75 = 13,5 → 14
    expect(rangeMin(10)).toBe(6);
    expect(rangeMax(30)).toBe(23);
    expect(rangeMax(18)).toBe(14);
  });

  it('ogni riga porta il testo del livello di partenza scritto nella scheda', () => {
    for (const row of TEST_REFERENCE_ROWS) {
      expect(row.startingLevelNote.trim().length, row.testId).toBeGreaterThan(10);
    }
  });

  it('in quattro righe la scheda dichiara un livello diverso da quello che descrive', () => {
    const contraddittorie = TEST_REFERENCE_ROWS.filter(
      (r) =>
        r.statedLevel !== null &&
        r.scaleLevelForNote !== null &&
        r.statedLevel !== r.scaleLevelForNote,
    );
    expect(contraddittorie.map((r) => r.testId)).toEqual([
      'inverted-row-trx',
      'pike-push-up',
      'nordic-curl',
      'hollow-hold',
    ]);
  });

  it('solo due righe hanno livello dichiarato e livello descritto coincidenti', () => {
    const coerenti = TEST_REFERENCE_ROWS.filter(
      (r) => r.statedLevel !== null && r.statedLevel === r.scaleLevelForNote,
    );
    expect(coerenti.map((r) => r.testId)).toEqual(['pull-up', 'bulgarian-split-squat']);
  });
});

describe('blocchi a range fisso', () => {
  it('elenca esattamente i blocchi che citano un test ma prescrivono un numero fisso', () => {
    const keys: string[] = [];
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        if (!block.reference.startsWith('Test ')) continue;
        if (block.prescription.kind === 'reps-from-test') continue;
        keys.push(`${session.id}/${block.code}`);
      }
    }
    expect([...keys].sort()).toEqual(Object.keys(FIXED_RANGES_BY_BLOCK).sort());
  });
});

describe('colonne del foglio Log_Allenamenti', () => {
  it('sono tredici, nell’ordine originale', () => {
    expect(LOG_CSV_COLUMNS).toHaveLength(13);
    expect(LOG_CSV_COLUMNS[0]).toBe('Data');
    expect(LOG_CSV_COLUMNS.at(-1)).toBe('Note');
    expect(LOG_CSV_COLUMNS).toContain('Variante / Livello');
  });

  it('prevede quattro colonne di ripetizioni, quante le serie massime del programma', () => {
    const repColumns = LOG_CSV_COLUMNS.filter((c) => c.startsWith('Rip S'));
    expect(repColumns).toEqual(['Rip S1', 'Rip S2', 'Rip S3', 'Rip S4']);
    const maxSets = Math.max(
      ...PROGRAM_SESSIONS.flatMap((s) => s.blocks.map((b) => b.sets)),
    );
    expect(maxSets).toBe(repColumns.length);
  });
});
