import { describe, expect, it } from 'vitest';
import {
  ENDURANCE_REP_THRESHOLD,
  LOAD_CALIBRATION,
  LOAD_START_BASELINE_REPS,
  LOAD_START_TABLE,
  LOAD_STEP_KG,
  LOAD_UNLOCK_WEEK,
  MORNING_DELAY_MINUTES,
  REP_RANGE_MAX_FACTOR,
  REP_RANGE_MIN_FACTOR,
  STARTING_LEVEL_POLICY,
  WARMUP_MINUTES,
  WARMUP_RAMP_SETS,
  getLoadThreshold,
} from './method.ts';
import { EXERCISES } from './exercises.ts';

describe('regole del metodo — foglio Istruzioni', () => {
  it('fissa il range di lavoro al 55%-75% del massimale', () => {
    expect(REP_RANGE_MIN_FACTOR).toBe(0.55);
    expect(REP_RANGE_MAX_FACTOR).toBe(0.75);
  });

  it('colloca la soglia della resistenza a 25-30 ripetizioni', () => {
    expect(ENDURANCE_REP_THRESHOLD).toEqual({ min: 25, max: 30 });
  });

  it('prende il livello iniziale dal programma, non dalla colonna della scheda', () => {
    expect(STARTING_LEVEL_POLICY).toBe('program-default');
  });

  it('ogni esercizio dentro una scala ha un livello di partenza utilizzabile', () => {
    const dentroScala = EXERCISES.filter((e) => e.pattern !== null);
    expect(dentroScala.length).toBeGreaterThan(0);
    for (const exercise of dentroScala) {
      expect(exercise.defaultLevel, exercise.slug).not.toBeNull();
    }
  });

  it('trascrive riscaldamento e regola mattutina', () => {
    expect(WARMUP_MINUTES).toEqual({ general: 4, ramp: 4 });
    expect(WARMUP_RAMP_SETS).toBe(2);
    expect(MORNING_DELAY_MINUTES).toBe(40);
  });
});

describe('regole della zavorra — foglio Zavorra', () => {
  it('sblocca la zavorra dalla settimana 3', () => {
    expect(LOAD_UNLOCK_WEEK).toBe(3);
  });

  it('ammette un solo incremento: 2,5 kg', () => {
    expect(LOAD_STEP_KG).toBe(2.5);
  });

  it('fissa le soglie su trazione verticale e dip, e su nient’altro', () => {
    expect(getLoadThreshold('vertical-pull')).toEqual({ mandatoryAbove: 15, discouragedBelow: 8 });
    expect(getLoadThreshold('dip')).toEqual({ mandatoryAbove: 18, discouragedBelow: 10 });
    for (const pattern of ['horizontal-pull', 'horizontal-push', 'vertical-push', 'single-leg-squat', 'posterior-chain', 'core'] as const) {
      expect(getLoadThreshold(pattern), pattern).toBeNull();
    }
    expect(getLoadThreshold(null)).toBeNull();
  });

  it('calibra il carico su 6-8 ripetizioni con RIR 1', () => {
    expect(LOAD_CALIBRATION.targetReps).toEqual({ min: 6, max: 8 });
    expect(LOAD_CALIBRATION.targetRir).toBe(1);
    expect(LOAD_CALIBRATION.increaseAtOrAbove).toBe(10);
    expect(LOAD_CALIBRATION.decreaseAtOrBelow).toBe(4);
  });

  it('la formula del carico di partenza passa per tutte le righe della tabella', () => {
    const suggest = (maxReps: number) =>
      LOAD_STEP_KG * Math.round((maxReps - LOAD_START_BASELINE_REPS) / LOAD_STEP_KG);
    expect(LOAD_START_TABLE).toHaveLength(3);
    for (const row of LOAD_START_TABLE) {
      expect(suggest(row.maxReps), row.label).toBe(row.suggestedKg);
    }
  });

  it('ogni carico consigliato è un multiplo di 2,5 kg', () => {
    for (const row of LOAD_START_TABLE) {
      expect(row.suggestedKg % LOAD_STEP_KG, row.label).toBe(0);
    }
  });
});
