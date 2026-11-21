import { describe, expect, it } from 'vitest';
import { getExercise } from './exercises.ts';
import { getProgressionStep } from './progressions.ts';
import { getTest, testBaseline } from './tests.ts';
import { initialExerciseState, startingLevel } from '../engine/progression.ts';
import { latestTestResults, testResultSingle } from '../engine/ranges.ts';
import { variantLabelFor } from '../engine/draft.ts';
import type { LevelIndex } from '../types/index.ts';

/*
 * T-37: il rematore della Seduta 2 si fa agli anelli (Alessio, 2026-11-21).
 * Gli slug non cambiano: lo stato salvato di Alessio vale com'è.
 */
describe('T-37 · rematore agli anelli', () => {
  it('37.1 · slug invariati, nomi nuovi', () => {
    expect(getExercise('rematore-inverso-trx').name).toBe('Rematore inverso');
    expect(getExercise('rematore-inverso-trx-piedi-rialzati').name).toBe('Rematore inverso piedi rialzati');
    expect(getExercise('rematore-trx-monobraccio').name).toBe('Rematore inverso monobraccio');
  });

  it('37.2 · niente TRX né maniglie in nomi, cue e gradini della trazione orizzontale', () => {
    const testi = [
      ...['rematore-inverso-trx', 'rematore-inverso-trx-piedi-rialzati', 'rematore-trx-monobraccio'].flatMap((slug) => {
        const e = getExercise(slug);
        return [e.name, ...e.cues];
      }),
      ...([1, 2, 3, 4, 5, 6] as LevelIndex[]).map((l) => getProgressionStep('horizontal-pull', l).name),
      getTest('inverted-row-trx').label,
    ];
    for (const testo of testi) expect(testo, testo).not.toMatch(/TRX|maniglie|maniglia/i);
  });

  it('37.3 · i sei gradini, nell’ordine', () => {
    expect(([1, 2, 3, 4, 5, 6] as LevelIndex[]).map((l) => getProgressionStep('horizontal-pull', l).name)).toEqual([
      'Rematore agli anelli a 60°',
      'Rematore agli anelli a 45°',
      'Rematore agli anelli orizzontale',
      'Piedi rialzati + pausa 1"',
      'Rematore monobraccio agli anelli',
      'Rematore monobraccio piedi rialzati',
    ]);
  });

  it('37.4 · il test: stesso id, agli anelli, con la nota', () => {
    const test = getTest('inverted-row-trx');
    expect(test.exercise).toBe('rematore-inverso-trx');
    expect(test.label).toBe('Rematore inverso');
    expect(test.note).toBe(
      'Agli anelli a 45°, con la presa larga della seduta. Conta solo le ripetizioni con il corpo in linea e gli anelli al petto.',
    );
    expect(testBaseline('horizontal-pull')).toEqual({ testId: 'inverted-row-trx', level: 2, measurement: 'reps' });
  });

  it('37.5 · R1 invariata: 10 ⇒ 2, 9 ⇒ 1, nessun risultato ⇒ 1', () => {
    const e = getExercise('rematore-inverso-trx');
    const con = (m: number) => startingLevel(e, latestTestResults([testResultSingle('inverted-row-trx', '2026-03-01', 0, m)]));
    expect(con(10)).toBe(2);
    expect(con(9)).toBe(1);
    expect(startingLevel(e, new Map())).toBe(1);
  });

  it('37.6 e 37.7 · nessuna migrazione; il diario vecchio tiene la sua etichetta', () => {
    const salvato = { ...initialExerciseState(getExercise('rematore-inverso-trx')), level: 3 as LevelIndex, eccentricBonusSeconds: 1, bottomPauseBonusSeconds: 1 };
    /* Lo stato è un dato: stesso slug, stessi numeri. Il nome del gradino nuovo vale per le sedute nuove. */
    expect(variantLabelFor(getExercise('rematore-inverso-trx'), salvato)).toContain('Rematore agli anelli orizzontale');
    expect(salvato.exercise).toBe('rematore-inverso-trx');
  });
});
