import { describe, expect, it } from 'vitest';
import { tempoPhases } from './Metronome.tsx';
import { parseTut } from '../../engine/notation.ts';
import { PROGRAM_SESSIONS } from '../../data/program.ts';

describe('fasi del metronomo', () => {
  it('salta le fasi a zero', () => {
    expect(tempoPhases(parseTut('3-0-1-0')).map((phase) => phase.name)).toEqual(['Giù', 'Su']);
  });

  it('tiene le pause quando ci sono', () => {
    expect(tempoPhases(parseTut('2-2-1-2')).map((phase) => phase.seconds)).toEqual([2, 2, 1, 2]);
  });

  it('dà mezzo secondo alla fase esplosiva', () => {
    expect(tempoPhases(parseTut('5-0-X-0')).map((phase) => phase.seconds)).toEqual([5, 0.5]);
  });

  it('non produce fasi sui tempi non numerici', () => {
    expect(tempoPhases(parseTut('controllato'))).toEqual([]);
    expect(tempoPhases(parseTut('isometrico'))).toEqual([]);
    expect(tempoPhases(parseTut('—'))).toEqual([]);
  });

  it('ogni blocco del programma produce un ciclo sensato o nessuno', () => {
    for (const session of PROGRAM_SESSIONS) {
      for (const block of session.blocks) {
        const phases = tempoPhases(parseTut(block.tut));
        const cycle = phases.reduce((sum, phase) => sum + phase.seconds, 0);
        if (phases.length === 0) continue;
        expect(cycle, `${session.id}/${block.code}`).toBeGreaterThan(0);
        expect(cycle, `${session.id}/${block.code}`).toBeLessThanOrEqual(12);
      }
    }
  });
});
