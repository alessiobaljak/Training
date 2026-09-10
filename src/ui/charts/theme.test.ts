import { describe, expect, it } from 'vitest';
import { MAX_BAR, SET_RAMP, SURFACE_GAP, niceTicks, setColor, topRoundedPath } from './theme.ts';

describe('ticks arrotondati', () => {
  it('parte sempre da zero e arriva sopra il massimo', () => {
    const ticks = niceTicks(37);
    expect(ticks[0]).toBe(0);
    expect(ticks.at(-1)).toBeGreaterThanOrEqual(37);
  });

  it('usa passi leggibili', () => {
    expect(niceTicks(20)).toEqual([0, 5, 10, 15, 20]);
    expect(niceTicks(100)).toEqual([0, 25, 50, 75, 100]);
  });

  it('i passi sono tutti uguali', () => {
    for (const max of [7, 13, 29, 44, 130, 900]) {
      const ticks = niceTicks(max);
      const steps = ticks.slice(1).map((tick, index) => tick - (ticks[index] ?? 0));
      const rounded = steps.map((step) => Math.round(step * 1000) / 1000);
      expect(new Set(rounded).size, String(max)).toBe(1);
    }
  });

  it('regge un massimo a zero o negativo', () => {
    expect(niceTicks(0)).toEqual([0]);
    expect(niceTicks(-5)).toEqual([0]);
  });
});

describe('rampa delle serie', () => {
  it('ha quattro gradini, quante le colonne del foglio Log', () => {
    expect(SET_RAMP).toHaveLength(4);
  });

  it('oltre il quarto gradino resta sull’ultimo invece di generarne uno nuovo', () => {
    expect(setColor(9)).toBe(SET_RAMP[3]);
  });

  it('ogni gradino è un token, non un colore scritto a mano', () => {
    for (const step of SET_RAMP) expect(step).toMatch(/^var\(--color-set-\d\)$/);
  });
});

describe('testa arrotondata della colonna', () => {
  it('parte e finisce sulla base, che resta squadrata', () => {
    const path = topRoundedPath(10, 20, 24, 50);
    expect(path.startsWith('M 10 70')).toBe(true);
    expect(path.endsWith('L 34 70 Z')).toBe(true);
  });

  it('non arrotonda più della metà della larghezza', () => {
    expect(topRoundedPath(0, 0, 4, 50)).toContain('A 2 2');
  });

  it('non arrotonda più dell’altezza su un segmento sottile', () => {
    expect(topRoundedPath(0, 0, 24, 1)).toContain('A 1 1');
  });
});

describe('specifiche delle marche', () => {
  it('una colonna non supera i 24 px', () => {
    expect(MAX_BAR).toBe(24);
  });

  it('i segmenti sono separati da 2 px di superficie, non da un bordo', () => {
    expect(SURFACE_GAP).toBe(2);
  });
});
