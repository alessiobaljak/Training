import { describe, expect, it } from 'vitest';
import {
  MAX_ECCENTRIC_SECONDS,
  MAX_ISO_PAUSE_SECONDS,
  applyLever,
  effectiveTempo,
  evaluateProgression,
  initialExerciseState,
} from './progression.ts';
import { latestTestResults, resolveBlockRange, testResultSingle } from './ranges.ts';
import { getExercise } from '../data/exercises.ts';
import { getSession } from '../data/program.ts';
import type {
  ExerciseState,
  LoggedSet,
  ProgramBlock,
  SessionId,
  TestResult,
} from '../types/index.ts';
import type { ProgressionInput } from './progression.ts';
import { OVERLOAD_LEVERS } from '../types/index.ts';
import { loggedExercise, perSideSets, sets } from './__fixtures.ts';

const DEFAULT_TESTS: TestResult[] = [
  testResultSingle('pull-up', '2026-09-14', 0, 10),
  testResultSingle('dip', '2026-09-14', 0, 12),
  testResultSingle('push-up', '2026-09-14', 0, 30),
  testResultSingle('inverted-row-trx', '2026-09-14', 0, 18),
  testResultSingle('pike-push-up', '2026-09-14', 0, 8),
  testResultSingle('bulgarian-split-squat', '2026-09-14', 0, 12),
  testResultSingle('hollow-hold', '2026-09-14', 0, 45),
];

function blockOf(sessionId: SessionId, code: string): ProgramBlock {
  const block = getSession(sessionId).blocks.find((candidate) => candidate.code === code);
  if (block === undefined) throw new Error(`Blocco mancante: ${sessionId}/${code}`);
  return block;
}

function makeInput(options: {
  sessionId: SessionId;
  code: string;
  loggedSets: readonly LoggedSet[];
  tempoRespected?: boolean;
  state?: Partial<ExerciseState>;
  week?: number;
  currentMaxReps?: number | null;
  tests?: readonly TestResult[];
}): ProgressionInput {
  const block = blockOf(options.sessionId, options.code);
  const exercise = getExercise(block.exercise);
  const tests = latestTestResults(options.tests ?? DEFAULT_TESTS);
  return {
    block,
    exercise,
    state: { ...initialExerciseState(exercise), ...options.state },
    logged: loggedExercise(exercise.slug, options.loggedSets, {
      blockCode: block.code,
      tempoRespected: options.tempoRespected ?? true,
    }),
    range: resolveBlockRange(block, exercise, tests),
    week: options.week ?? 4,
    currentMaxReps: options.currentMaxReps ?? null,
  };
}

const leverOf = (input: ProgressionInput) => evaluateProgression(input).suggestion?.lever ?? null;

/* -------------------------------------------------------------------------- */

describe('stato iniziale', () => {
  it('parte dal livello che il programma prescrive', () => {
    expect(initialExerciseState(getExercise('trazioni-prona-presa-media'))).toEqual({
      exercise: 'trazioni-prona-presa-media',
      level: 3,
      eccentricBonusSeconds: 0,
      bottomPauseBonusSeconds: 0,
      loadKg: 0,
    });
  });

  it('gli esercizi fuori scala partono senza livello', () => {
    expect(initialExerciseState(getExercise('alzate-laterali-elastico')).level).toBeNull();
  });
});

describe('tempo effettivo', () => {
  const base = initialExerciseState(getExercise('trazioni-prona-presa-media'));

  it('senza bonus è quello della scheda', () => {
    expect(effectiveTempo('3-0-1-1', base)).toEqual({
      kind: 'tempo',
      eccentric: 3,
      bottomPause: 0,
      concentric: 1,
      topPause: 1,
    });
  });

  it('somma i bonus accumulati', () => {
    const state = { ...base, eccentricBonusSeconds: 1, bottomPauseBonusSeconds: 1 };
    const tempo = effectiveTempo('3-0-1-1', state);
    expect(tempo).toMatchObject({ eccentric: 4, bottomPause: 1 });
  });

  it('non supera i tetti del metodo', () => {
    const state = { ...base, eccentricBonusSeconds: 9, bottomPauseBonusSeconds: 9 };
    const tempo = effectiveTempo('3-1-1-0', state);
    expect(tempo).toMatchObject({
      eccentric: MAX_ECCENTRIC_SECONDS,
      bottomPause: MAX_ISO_PAUSE_SECONDS,
    });
  });

  it('non tocca le fasi esplosive', () => {
    const state = { ...base, eccentricBonusSeconds: 2 };
    expect(effectiveTempo('5-0-X-0', state)).toMatchObject({ eccentric: 5, concentric: 'X' });
  });

  it('lascia stare i tempi non numerici', () => {
    expect(effectiveTempo('controllato', base)).toEqual({ kind: 'controlled' });
    expect(effectiveTempo('isometrico', base)).toEqual({ kind: 'isometric' });
  });
});

/* -------------------------------------------------------------------------- */

describe('regola di avanzamento', () => {
  it('non scatta se una sola serie resta sotto il massimo del range', () => {
    // Range 6-8 dal test trazioni: 8, 8, 7, 6 non chiude.
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 7, 6]) }),
    );
    expect(evaluation.closedRange).toBe(false);
    expect(evaluation.triggered).toBe(false);
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.blockedReason).toContain('8');
  });

  it('non scatta se il tempo prescritto non è stato rispettato', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'upper-a',
        code: 'A2',
        loggedSets: sets([8, 8, 8, 8]),
        tempoRespected: false,
      }),
    );
    expect(evaluation.closedRange).toBe(true);
    expect(evaluation.triggered).toBe(false);
    expect(evaluation.blockedReason).toContain('tempo');
  });

  it('non scatta senza serie registrate', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: [] }),
    );
    expect(evaluation.closedRange).toBe(false);
    expect(evaluation.triggered).toBe(false);
  });

  it('scatta chiudendo il massimo su tutte le serie con il tempo rispettato', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]) }),
    );
    expect(evaluation.triggered).toBe(true);
    expect(evaluation.suggestion).not.toBeNull();
  });

  it('anche superando il massimo la leva 1 risulta esaurita', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([10, 9, 9, 9]) }),
    );
    expect(evaluation.triggered).toBe(true);
    const reps = evaluation.levers.find((lever) => lever.lever === 'reps');
    expect(reps?.available).toBe(false);
    expect(reps?.reason).toContain('esaurita');
  });

  it('non si applica ai blocchi senza range, come il dead hang a cedimento', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'shadow', code: 'E', loggedSets: sets([60, 55, 50]) }),
    );
    expect(evaluation.triggered).toBe(false);
    expect(evaluation.blockedReason).toContain('range');
  });
});

describe('esercizi per lato', () => {
  it('serve che entrambi i lati chiudano il massimo', () => {
    // Test split squat 12 → range 7-9.
    const closing = evaluateProgression(
      makeInput({
        sessionId: 'lower-a',
        code: 'A',
        loggedSets: perSideSets([[9, 9], [9, 9], [9, 9], [9, 9]]),
      }),
    );
    expect(closing.triggered).toBe(true);
  });

  it('un lato indietro basta a bloccare l’avanzamento', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'lower-a',
        code: 'A',
        loggedSets: perSideSets([[9, 9], [9, 8], [9, 9], [9, 9]]),
      }),
    );
    expect(evaluation.closedRange).toBe(false);
    expect(evaluation.triggered).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */

describe('ordine delle leve', () => {
  it('dopo le ripetizioni propone il tempo', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]) }),
    );
    expect(evaluation.suggestion?.lever).toBe('tempo');
    expect(evaluation.suggestion?.change).toContain('da 3" a 4"');
  });

  it('con l’eccentrica al massimo passa alle pause isometriche', () => {
    expect(
      leverOf(
        makeInput({
          sessionId: 'upper-a',
          code: 'A2',
          loggedSets: sets([8, 8, 8, 8]),
          state: { eccentricBonusSeconds: 2 },
        }),
      ),
    ).toBe('iso-pause');
  });

  it('con tempo e pause esaurite passa alla variante', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'upper-a',
        code: 'A2',
        loggedSets: sets([8, 8, 8, 8]),
        state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 },
      }),
    );
    expect(evaluation.suggestion?.lever).toBe('variant');
    expect(evaluation.suggestion?.change).toContain('livello 4');
    expect(evaluation.suggestion?.change).toContain('Trazioni con pausa 1" in alto');
  });

  it('la variante avvisa della perdita di ripetizioni', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'upper-a',
        code: 'A2',
        loggedSets: sets([10, 10, 10, 10]),
        state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 },
      }),
    );
    expect(evaluation.suggestion?.warning).toContain('30-40%');
    // 10 ripetizioni meno il 30-40% danno 6-7.
    expect(evaluation.suggestion?.warning).toContain('6-7');
  });

  it('al livello 6 la variante è esaurita e resta la zavorra', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'upper-a',
        code: 'A2',
        loggedSets: sets([8, 8, 8, 8]),
        state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, level: 6 },
        week: 4,
      }),
    );
    expect(evaluation.suggestion?.lever).toBe('load');
    expect(evaluation.suggestion?.change).toContain('2.5 kg');
  });

  it('propone sempre la leva più bassa ancora disponibile', () => {
    const cases: { sessionId: SessionId; code: string; state: Partial<ExerciseState> }[] = [
      { sessionId: 'upper-a', code: 'A2', state: {} },
      { sessionId: 'upper-a', code: 'A2', state: { eccentricBonusSeconds: 2 } },
      { sessionId: 'upper-a', code: 'A2', state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } },
      {
        sessionId: 'upper-a',
        code: 'A2',
        state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, level: 6 },
      },
    ];
    for (const testCase of cases) {
      const input = makeInput({
        sessionId: testCase.sessionId,
        code: testCase.code,
        loggedSets: sets([8, 8, 8, 8]),
        state: testCase.state,
        week: 8,
      });
      const evaluation = evaluateProgression(input);
      const available = OVERLOAD_LEVERS.filter(
        (lever) => evaluation.levers.find((entry) => entry.lever === lever)?.available === true,
      );
      expect(evaluation.suggestion?.lever, JSON.stringify(testCase.state)).toBe(available[0]);
    }
  });

  it('le ripetizioni non vengono mai riproposte quando il trigger è scattato', () => {
    const states: Partial<ExerciseState>[] = [{}, { eccentricBonusSeconds: 2 }, { level: 6 }];
    for (const state of states) {
      const evaluation = evaluateProgression(
        makeInput({
          sessionId: 'upper-a',
          code: 'A2',
          loggedSets: sets([8, 8, 8, 8]),
          state,
          week: 8,
        }),
      );
      expect(evaluation.suggestion?.lever, JSON.stringify(state)).not.toBe('reps');
    }
  });

  it('la zavorra resta l’ultima anche quando tutte le altre sono disponibili', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]), week: 12 }),
    );
    expect(evaluation.suggestion?.lever).not.toBe('load');
  });
});

describe('leve non disponibili', () => {
  it('il nordic parte già con l’eccentrica a 5": il tempo è esaurito in partenza', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'lower-a', code: 'B', loggedSets: sets([5, 5, 5, 5]) }),
    );
    const tempo = evaluation.levers.find((lever) => lever.lever === 'tempo');
    expect(tempo?.available).toBe(false);
    expect(tempo?.reason).toContain('5"');
    expect(evaluation.suggestion?.lever).toBe('iso-pause');
  });

  it('un esercizio a tempo "controllato" non ha né leva tempo né leva pause', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'lower-a', code: 'D2', loggedSets: sets([15, 15, 15]) }),
    );
    const tempo = evaluation.levers.find((lever) => lever.lever === 'tempo');
    const pause = evaluation.levers.find((lever) => lever.lever === 'iso-pause');
    expect(tempo?.available).toBe(false);
    expect(pause?.available).toBe(false);
    expect(evaluation.suggestion?.lever).toBe('variant');
  });

  it('un’isometria salta alle varianti: non ha fasi da rallentare', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'shadow', code: 'A', loggedSets: sets([45, 45, 45]) }),
    );
    expect(evaluation.triggered).toBe(true);
    expect(evaluation.suggestion?.lever).toBe('variant');
  });

  it('la zavorra è bloccata nelle prime due settimane', () => {
    for (const week of [1, 2]) {
      const evaluation = evaluateProgression(
        makeInput({
          sessionId: 'upper-a',
          code: 'A2',
          loggedSets: sets([8, 8, 8, 8]),
          state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, level: 6 },
          week,
        }),
      );
      expect(evaluation.suggestion, String(week)).toBeNull();
      expect(evaluation.blockedReason).toContain('esaurito tutte le leve');
      const load = evaluation.levers.find((lever) => lever.lever === 'load');
      expect(load?.reason).toContain('settimana 3');
    }
  });

  it('sotto le 8 trazioni la zavorra resta chiusa e rimanda alla scala', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'upper-a',
        code: 'A2',
        loggedSets: sets([8, 8, 8, 8]),
        state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, level: 6 },
        week: 8,
        currentMaxReps: 7,
      }),
    );
    const load = evaluation.levers.find((lever) => lever.lever === 'load');
    expect(load?.available).toBe(false);
    expect(load?.reason).toContain('sali prima di livello');
    expect(evaluation.suggestion).toBeNull();
  });

  it('su un esercizio a zavorra vietata la leva non si apre mai', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'lower-a',
        code: 'D2',
        loggedSets: sets([15, 15, 15]),
        state: { level: 6 },
        week: 20,
      }),
    );
    const load = evaluation.levers.find((lever) => lever.lever === 'load');
    expect(load?.available).toBe(false);
    expect(load?.reason).toContain('non si usa mai');
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.blockedReason).toContain('esaurito tutte le leve');
  });

  it('un accessorio fuori scala esaurisce le leve dopo tempo e pause', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'upper-a',
        code: 'C1',
        loggedSets: sets([20, 20, 20, 20]),
        state: { eccentricBonusSeconds: 3, bottomPauseBonusSeconds: 2 },
        week: 10,
      }),
    );
    const variant = evaluation.levers.find((lever) => lever.lever === 'variant');
    expect(variant?.available).toBe(false);
    expect(variant?.reason).toContain('non appartiene');
    expect(evaluation.suggestion).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */

describe('applicazione del suggerimento', () => {
  it('non muta lo stato ricevuto', () => {
    const input = makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]) });
    const before = { ...input.state };
    const next = applyLever('tempo', input);
    expect(input.state).toEqual(before);
    expect(next).not.toBe(input.state);
  });

  it('la leva tempo aggiunge un secondo di eccentrica', () => {
    const input = makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]) });
    expect(applyLever('tempo', input).eccentricBonusSeconds).toBe(1);
  });

  it('la leva pause aggiunge un secondo in allungamento', () => {
    const input = makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]) });
    expect(applyLever('iso-pause', input).bottomPauseBonusSeconds).toBe(1);
  });

  it('la leva variante sale di livello e azzera i bonus di tempo e pause', () => {
    const input = makeInput({
      sessionId: 'upper-a',
      code: 'A2',
      loggedSets: sets([8, 8, 8, 8]),
      state: { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 },
    });
    expect(applyLever('variant', input)).toMatchObject({
      level: 4,
      eccentricBonusSeconds: 0,
      bottomPauseBonusSeconds: 0,
    });
  });

  it('la leva variante non tocca la zavorra già in uso', () => {
    const input = makeInput({
      sessionId: 'upper-a',
      code: 'A2',
      loggedSets: sets([8, 8, 8, 8]),
      state: { loadKg: 5 },
    });
    expect(applyLever('variant', input).loadKg).toBe(5);
  });

  it('la leva zavorra aggiunge 2,5 kg', () => {
    const input = makeInput({
      sessionId: 'upper-a',
      code: 'A2',
      loggedSets: sets([8, 8, 8, 8]),
      state: { loadKg: 5 },
      week: 6,
    });
    expect(applyLever('load', input).loadKg).toBe(7.5);
  });

  it('coincide con lo stato proposto dal suggerimento', () => {
    const input = makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]) });
    const evaluation = evaluateProgression(input);
    expect(evaluation.suggestion?.nextState).toEqual(applyLever('tempo', input));
  });
});

describe('avviso sulla resistenza', () => {
  it('compare sopra le 25 ripetizioni di media', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'shadow', code: 'C', loggedSets: sets([25, 25, 25]) }),
    );
    expect(evaluation.enduranceWarning).toContain('resistenza');
  });

  it('non compare dentro i range normali', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'A2', loggedSets: sets([8, 8, 8, 8]) }),
    );
    expect(evaluation.enduranceWarning).toBeNull();
  });
});
