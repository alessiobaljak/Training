import { describe, expect, it } from 'vitest';
import {
  describeTut,
  formatRir,
  formatTut,
  isRirOnTarget,
  isTempoBreakdown,
  parseRir,
  parseTut,
  repDurationSeconds,
} from './notation.ts';
import { PROGRAM_SESSIONS } from '../data/program.ts';

describe('notazione TUT', () => {
  it('legge le quattro fasi', () => {
    const tut = parseTut('3-1-1-0');
    expect(tut).toEqual({
      kind: 'tempo',
      eccentric: 3,
      bottomPause: 1,
      concentric: 1,
      topPause: 0,
    });
  });

  it('legge la fase esplosiva', () => {
    const tut = parseTut('5-0-X-0');
    expect(isTempoBreakdown(tut)).toBe(true);
    if (!isTempoBreakdown(tut)) return;
    expect(tut.eccentric).toBe(5);
    expect(tut.concentric).toBe('X');
  });

  it('riconosce le forme non numeriche', () => {
    expect(parseTut('controllato')).toEqual({ kind: 'controlled' });
    expect(parseTut('isometrico')).toEqual({ kind: 'isometric' });
    expect(parseTut('—')).toEqual({ kind: 'none' });
  });

  it('fa il giro completo su ogni TUT del programma', () => {
    const notations = PROGRAM_SESSIONS.flatMap((session) => session.blocks.map((block) => block.tut));
    expect(notations.length).toBe(36);
    for (const notation of notations) {
      expect(formatTut(parseTut(notation)), notation).toBe(notation);
    }
  });

  it('stima la durata di una ripetizione, contando la fase esplosiva come un secondo', () => {
    expect(repDurationSeconds(parseTut('3-1-1-0'))).toBe(5);
    expect(repDurationSeconds(parseTut('2-2-1-2'))).toBe(7);
    expect(repDurationSeconds(parseTut('5-0-X-0'))).toBe(6);
    expect(repDurationSeconds(parseTut('controllato'))).toBeNull();
    expect(repDurationSeconds(parseTut('isometrico'))).toBeNull();
  });

  it('descrive il tempo a parole, saltando le fasi a zero', () => {
    expect(describeTut(parseTut('3-1-1-0'))).toBe('eccentrica 3", pausa in basso 1", concentrica 1"');
    expect(describeTut(parseTut('5-0-X-0'))).toBe('eccentrica 5", concentrica esplosiva');
    expect(describeTut(parseTut('isometrico'))).toContain('Isometria');
  });
});

describe('notazione RIR', () => {
  it('legge valori singoli e intervalli', () => {
    expect(parseRir('0')).toEqual({ min: 0, max: 0 });
    expect(parseRir('0-1')).toEqual({ min: 0, max: 1 });
    expect(parseRir('1-2')).toEqual({ min: 1, max: 2 });
    expect(parseRir('—')).toBeNull();
  });

  it('fa il giro completo su ogni RIR del programma', () => {
    const notations = PROGRAM_SESSIONS.flatMap((session) => session.blocks.map((block) => block.rir));
    for (const notation of notations) {
      expect(formatRir(parseRir(notation)), notation).toBe(notation);
    }
  });

  it('verifica se il RIR registrato è nel bersaglio', () => {
    const target = parseRir('0-1');
    expect(isRirOnTarget(0, target)).toBe(true);
    expect(isRirOnTarget(1, target)).toBe(true);
    expect(isRirOnTarget(2, target)).toBe(false);
  });

  it('non giudica quando manca il bersaglio o il dato', () => {
    expect(isRirOnTarget(3, null)).toBe(true);
    expect(isRirOnTarget(null, parseRir('0'))).toBe(true);
  });
});
