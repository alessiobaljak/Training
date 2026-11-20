import { describe, expect, it } from 'vitest';
import { buildGuidedPlan, minWorkSeconds } from './circuit.ts';
import { initialExerciseState } from './progression.ts';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise } from '../data/exercises.ts';
import type { ExerciseState, ProgramBlock } from '../types/index.ts';

/*
 * R18 (training/reports/2026-11-18-training.md): il minimo della stazione
 * cresce con i secondi di tempo e pausa accettati. Prima restava quello della
 * scheda, e dopo «eccentrica da 3" a 4"» il player chiedeva ancora 30″.
 */

function blocco(sessione: string, codice: string): ProgramBlock {
  const block = CIRCUIT_SESSIONS.find((s) => s.id === sessione)?.blocks.find((b) => b.code === codice);
  if (block === undefined) throw new Error(`${sessione}/${codice}`);
  return block;
}

const stato = (block: ProgramBlock, parziale: Partial<ExerciseState>): ExerciseState => ({
  ...initialExerciseState(getExercise(block.exercise)),
  ...parziale,
});

describe('R18 · minimo della stazione con tempo e pausa accettati', () => {
  const trazioni = blocco('circuito-1', 'A1');

  it('18.1-18.4 · trazioni 6-8, 3-0-1-0, scheda 30″', () => {
    expect(minWorkSeconds(trazioni, undefined, false, stato(trazioni, {}))).toBe(30);
    expect(minWorkSeconds(trazioni, undefined, false, stato(trazioni, { eccentricBonusSeconds: 1 }))).toBe(36);
    expect(minWorkSeconds(trazioni, undefined, false, stato(trazioni, { eccentricBonusSeconds: 2 }))).toBe(42);
    expect(
      minWorkSeconds(trazioni, undefined, false, stato(trazioni, { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 })),
    ).toBe(54);
  });

  it('18.5 e 18.6 · bulgaro per lato, 3-1-1-0, scheda 100″; la pausa ha il tetto di 2″', () => {
    const bulgaro = blocco('circuito-1', 'A2');
    expect(minWorkSeconds(bulgaro, undefined, true, stato(bulgaro, { eccentricBonusSeconds: 1 }))).toBe(116);
    expect(minWorkSeconds(bulgaro, undefined, true, stato(bulgaro, { bottomPauseBonusSeconds: 2 }))).toBe(116);
  });

  it('18.7 · senza workSeconds il minimo nasce dal tempo, e cresce lo stesso', () => {
    const { workSeconds: _scheda, ...senzaScheda } = trazioni;
    void _scheda;
    const libero: ProgramBlock = { ...senzaScheda, prescription: { kind: 'reps', min: 8, max: 12 } };
    expect(minWorkSeconds(libero, undefined, false, stato(libero, {}))).toBe(32);
    expect(minWorkSeconds(libero, undefined, false, stato(libero, { eccentricBonusSeconds: 1 }))).toBe(40);
  });

  it('18.10 e 18.11 · tempo non a quattro fasi o stazione a secondi: invariato', () => {
    const controllato: ProgramBlock = { ...trazioni, tut: 'controllato' };
    expect(minWorkSeconds(controllato, undefined, false, stato(controllato, { eccentricBonusSeconds: 2 }))).toBe(30);
    const isometria = CIRCUIT_SESSIONS.flatMap((s) => s.blocks).find((b) => b.prescription.kind === 'seconds');
    if (isometria === undefined) throw new Error('isometria');
    const base = minWorkSeconds(isometria);
    expect(minWorkSeconds(isometria, undefined, isometria.perSide, stato(isometria, { eccentricBonusSeconds: 2 }))).toBe(base);
  });

  it('18.13 · senza stato, il minimo della scheda', () => {
    expect(minWorkSeconds(trazioni)).toBe(30);
  });

  it('18.15 · a bonus 0 ogni blocco dei quattro circuiti resta identico', () => {
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        expect(minWorkSeconds(block, undefined, block.perSide, stato(block, {}))).toBe(minWorkSeconds(block));
      }
    }
  });

  it('18.16 · il piano guidato usa lo stesso numero', () => {
    const sessione = CIRCUIT_SESSIONS.find((s) => s.id === 'circuito-1');
    if (sessione === undefined) throw new Error('circuito-1');
    const stati = new Map([[trazioni.exercise, stato(trazioni, { eccentricBonusSeconds: 1 })]]);
    const plan = buildGuidedPlan(sessione, 1, stati);
    const passo = plan.find((p) => p.kind === 'work' && p.blockCode === 'A1');
    expect(passo?.kind === 'work' ? passo.workSeconds : null).toBe(36);
  });
});
