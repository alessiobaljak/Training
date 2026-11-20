import { describe, expect, it } from 'vitest';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise } from '../data/exercises.ts';
import { buildGuidedPlan, estimatedSeconds } from './circuit.ts';
import { DURATA_MASSIMA_SECONDI, evaluateProgression, initialExerciseState, leveDiTempo } from './progression.ts';
import type { ProgressionEvaluation } from './progression.ts';
import { latestTestResults, resolveBlockRange, testResultSingle } from './ranges.ts';
import { loggedExercise, sets } from './__fixtures.ts';
import type { ExerciseSlug, ExerciseState, ProgramBlock, ProgramSession } from '../types/index.ts';

/*
 * R19 (D-22 a, Alessio, 2026-11-20): oltre 55 minuti stimati tempo e pausa
 * non si propongono più. training/reports/2026-11-20-training.md §7, T-22.
 */

const TEST = latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]);
type Stati = Map<ExerciseSlug, ExerciseState>;

function circuito(id: string): ProgramSession {
  const sessione = CIRCUIT_SESSIONS.find((s) => s.id === id);
  if (sessione === undefined) throw new Error(id);
  return sessione;
}

function iniziali(sessione: ProgramSession): Stati {
  return new Map(
    sessione.blocks.map((block) => {
      const exercise = getExercise(block.exercise);
      return [block.exercise, { ...initialExerciseState(exercise), level: exercise.defaultLevel }] as const;
    }),
  );
}

function aiMassimi(sessione: ProgramSession): Stati {
  const stati = iniziali(sessione);
  for (const block of sessione.blocks) {
    let stato = stati.get(block.exercise);
    while (stato !== undefined && leveDiTempo(block, stato).tempo.available) {
      stato = { ...stato, eccentricBonusSeconds: stato.eccentricBonusSeconds + 1 };
    }
    while (stato !== undefined && leveDiTempo(block, stato).pausa.available) {
      stato = { ...stato, bottomPauseBonusSeconds: stato.bottomPauseBonusSeconds + 1 };
    }
    if (stato !== undefined) stati.set(block.exercise, stato);
  }
  return stati;
}

const durata = (sessione: ProgramSession, stati: Stati): number => estimatedSeconds(buildGuidedPlan(sessione, 1, stati));

/** Il blocco chiuso al massimo, al tempo, allo stato: la fine seduta che si chiede la leva. */
function fine(sessione: ProgramSession, block: ProgramBlock, stati: Stati, conTetto = true): ProgressionEvaluation | null {
  const exercise = getExercise(block.exercise);
  const state = stati.get(block.exercise);
  const range = resolveBlockRange(block, exercise, TEST);
  if (state === undefined || range.kind !== 'range' || exercise.measurement !== 'reps') return null;
  const valori = Array.from({ length: block.sets }, () => range.range.max);
  return evaluateProgression({
    block,
    exercise,
    state,
    logged: { ...loggedExercise(exercise.slug, sets(valori, state.loadKg), { blockCode: block.code }), level: state.level },
    range,
    week: 4,
    currentMaxReps: 12,
    salita: { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' },
    rientro: null,
    aumentoRecente: null,
    ...(conTetto ? { durataCon: (stato: ExerciseState) => durata(sessione, new Map(stati).set(stato.exercise, stato)) } : {}),
  });
}

describe('R19 · tetto di durata a 55 minuti', () => {
  it('il tetto è quello deciso da Alessio', () => {
    expect(DURATA_MASSIMA_SECONDI).toBe(55 * 60);
  });

  it('circuito 4 ai massimi meno un passo: l’ultimo passo di tempo non si propone', () => {
    const c4 = circuito('circuito-4');
    const massimi = aiMassimi(c4);
    expect(durata(c4, massimi)).toBeGreaterThan(DURATA_MASSIMA_SECONDI);
    const block = c4.blocks.find((b) => (massimi.get(b.exercise)?.eccentricBonusSeconds ?? 0) > 0 && fine(c4, b, massimi) !== null);
    if (block === undefined) throw new Error('nessun blocco con il tempo');
    const meno: Stati = new Map(massimi);
    const stato = massimi.get(block.exercise);
    if (stato === undefined) throw new Error('stato');
    meno.set(block.exercise, { ...stato, eccentricBonusSeconds: stato.eccentricBonusSeconds - 1 });
    const e = fine(c4, block, meno);
    const tempo = e?.levers.find((leva) => leva.lever === 'tempo');
    expect(tempo?.available).toBe(false);
    expect(tempo?.reason).toContain('supererebbe i 55 minuti');
    expect(e?.suggestion?.lever).not.toBe('tempo');
    /* Senza il tetto lo stesso passo si proporrebbe: la prova misura R19. */
    expect(fine(c4, block, meno, false)?.levers.find((leva) => leva.lever === 'tempo')?.available).toBe(true);
  });

  it('circuito 1 ai massimi meno un passo: come prima', () => {
    const c1 = circuito('circuito-1');
    const massimi = aiMassimi(c1);
    expect(durata(c1, massimi)).toBeLessThanOrEqual(DURATA_MASSIMA_SECONDI);
    const block = c1.blocks.find((b) => (massimi.get(b.exercise)?.eccentricBonusSeconds ?? 0) > 0 && fine(c1, b, massimi) !== null);
    if (block === undefined) throw new Error('nessun blocco con il tempo');
    const stato = massimi.get(block.exercise);
    if (stato === undefined) throw new Error('stato');
    const meno: Stati = new Map(massimi).set(block.exercise, { ...stato, eccentricBonusSeconds: stato.eccentricBonusSeconds - 1 });
    expect(fine(c1, block, meno)?.levers.find((leva) => leva.lever === 'tempo')?.available).toBe(true);
  });

  it('proprietà: accettando ogni passo di tempo e pausa proposto, nessun circuito supera il tetto', () => {
    for (const id of ['circuito-1', 'circuito-2', 'circuito-3', 'circuito-4']) {
      const sessione = circuito(id);
      const stati = iniziali(sessione);
      expect(durata(sessione, stati), id).toBeLessThanOrEqual(DURATA_MASSIMA_SECONDI);
      for (let giro = 0; giro < 40; giro += 1) {
        let cambiato = false;
        for (const block of sessione.blocks) {
          const proposta = fine(sessione, block, stati)?.suggestion;
          if (proposta !== undefined && proposta !== null && (proposta.lever === 'tempo' || proposta.lever === 'iso-pause')) {
            stati.set(block.exercise, proposta.nextState);
            cambiato = true;
          }
        }
        if (!cambiato) break;
      }
      expect(durata(sessione, stati), id).toBeLessThanOrEqual(DURATA_MASSIMA_SECONDI);
    }
  });
});

describe('L26 · i minuti della nota del circuito 4', () => {
  it('3 · ogni «<n> minuti» è il tetto o la durata con tempo e pausa al tetto e l’hip thrust su una gamba', () => {
    const c4 = circuito('circuito-4');
    const stati = iniziali(c4);
    for (let giro = 0; giro < 40; giro += 1) {
      let cambiato = false;
      /*
       * Il caso peggiore (D5): tempo e pausa salgono fino al tetto sugli altri
       * esercizi mentre l'hip thrust resta a due gambe senza bonus; poi
       * passa su una gamba. Con il gradino nuovo i bonus ripartono da zero.
       */
      for (const block of c4.blocks) {
        if (block.exercise === 'hip-thrust-panca-bilaterale') continue;
        const proposta = fine(c4, block, stati)?.suggestion;
        if (proposta !== undefined && proposta !== null && (proposta.lever === 'tempo' || proposta.lever === 'iso-pause')) {
          stati.set(block.exercise, proposta.nextState);
          cambiato = true;
        }
      }
      if (!cambiato) break;
    }
    expect(durata(c4, stati)).toBeLessThanOrEqual(DURATA_MASSIMA_SECONDI);
    const hip = stati.get('hip-thrust-panca-bilaterale');
    if (hip === undefined) throw new Error('hip thrust');
    stati.set('hip-thrust-panca-bilaterale', { ...hip, level: 3, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 });
    const conVariante = Math.round(durata(c4, stati) / 60);
    const ammessi = [DURATA_MASSIMA_SECONDI / 60, conVariante];
    const nota = c4.note ?? '';
    const minuti = [...nota.matchAll(/(\d+) minuti/g)].map((m) => Number(m[1]));
    expect(minuti.length).toBeGreaterThan(0);
    for (const n of minuti) expect(ammessi, `${String(n)} minuti`).toContain(n);
    expect(conVariante, `con la variante: ${String(durata(c4, stati))} s`).toBe(59);
  });
});
