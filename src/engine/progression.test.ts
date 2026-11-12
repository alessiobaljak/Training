import { describe, expect, it } from 'vitest';
import {
  MAX_ECCENTRIC_SECONDS,
  MAX_ISO_PAUSE_SECONDS,
  applyLever,
  effectiveTempo,
  evaluateProgression,
  initialExerciseState,
  startingLevel,
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
import { loggedExercise, perSideSets, set, sets } from './__fixtures.ts';

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
  tempoRespected?: boolean | null;
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
    /*
     * Queste prove riguardano le leve, non la partenza: si parte dal gradino
     * per cui l'esercizio è scritto, quello su cui le regole delle leve sono
     * state pensate. La partenza vera, che dipende dal test, ha le sue prove
     * più sotto.
     */
    state: { ...initialExerciseState(exercise), level: exercise.defaultLevel, ...options.state },
    logged: loggedExercise(exercise.slug, options.loggedSets, {
      blockCode: block.code,
      tempoRespected: options.tempoRespected === undefined ? true : options.tempoRespected,
    }),
    range: resolveBlockRange(block, exercise, tests),
    week: options.week ?? 4,
    currentMaxReps: options.currentMaxReps ?? null,
  };
}

const leverOf = (input: ProgressionInput) => evaluateProgression(input).suggestion?.lever ?? null;

/* -------------------------------------------------------------------------- */

describe('stato iniziale', () => {
  it('senza un test parte dal primo gradino eseguibile, non da quello della scheda', () => {
    /*
     * Prima partiva dal gradino 3, trazioni complete, anche senza nessun test:
     * il gradino della scheda era assegnato a chiunque. Senza una misura
     * l'app non ha nessuna prova che si possa fare di più.
     */
    expect(initialExerciseState(getExercise('trazioni-prona-presa-media'))).toEqual({
      exercise: 'trazioni-prona-presa-media',
      level: 1,
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

  /*
   * «Non risposto» non vale come «sì».
   *
   * La bozza nasceva con il tempo già dato per rispettato: la domanda di fine
   * seduta arrivava con «Sì» acceso, premerlo non cambiava niente, e la
   * condizione di avanzamento si reggeva su una risposta mai data.
   */
  it('non scatta finché la domanda sul tempo resta senza risposta', () => {
    const evaluation = evaluateProgression(
      makeInput({
        sessionId: 'upper-a',
        code: 'A2',
        loggedSets: sets([8, 8, 8, 8]),
        tempoRespected: null,
      }),
    );
    expect(evaluation.closedRange).toBe(true);
    expect(evaluation.triggered).toBe(false);
    expect(evaluation.suggestion).toBeNull();
    expect(evaluation.blockedReason).toContain('risposta');
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

  /*
   * Su un'isometria il numero registrato sono secondi. 40" di wall sit
   * facevano scattare «sopra 25-30 ripetizioni stai allenando la resistenza»,
   * che è falso e per giunta suggerisce di cambiare leva su una tenuta andata
   * come prescritto.
   */
  it('non compare sugli esercizi che si misurano in secondi', () => {
    /* Il C2 del Lower A fatto come wall sit: il blocco effettivo, non quello
       dichiarato dalla scheda, che è il sissy squat a ripetizioni. */
    const declared = blockOf('lower-a', 'C2');
    const alternative = declared.alternatives?.[0];
    if (alternative === undefined) throw new Error('Il C2 del Lower A deve avere un’alternativa.');
    const block = { ...declared, exercise: alternative.exercise, prescription: alternative.prescription };
    const exercise = getExercise(block.exercise);
    expect(exercise.measurement).toBe('seconds');

    const evaluation = evaluateProgression({
      block,
      exercise,
      state: initialExerciseState(exercise),
      logged: loggedExercise(exercise.slug, sets([40, 40, 40]), { blockCode: 'C2' }),
      range: resolveBlockRange(block, exercise, latestTestResults(DEFAULT_TESTS)),
      week: 4,
      currentMaxReps: null,
    });
    expect(evaluation.enduranceWarning).toBeNull();
  });

  it('sullo stesso blocco fatto a ripetizioni l’avviso compare', () => {
    const block = blockOf('lower-a', 'C2');
    const exercise = getExercise(block.exercise);
    expect(exercise.measurement).toBe('reps');
    const evaluation = evaluateProgression({
      block,
      exercise,
      state: initialExerciseState(exercise),
      logged: loggedExercise(exercise.slug, sets([40, 40, 40]), { blockCode: 'C2' }),
      range: resolveBlockRange(block, exercise, latestTestResults(DEFAULT_TESTS)),
      week: 4,
      currentMaxReps: null,
    });
    expect(evaluation.enduranceWarning).toContain('resistenza');
  });
});

describe('livello di partenza dal test', () => {
  /*
   * Il test misura una variante precisa, e quella è il tetto.
   *
   * Prima il livello di partenza era il gradino che la scheda prescrive, e su
   * cinque blocchi quel gradino stava sopra il test — fino a tre gradini. Il
   * caso più chiaro: il test dei push-up si fa a terra, gradino 2, e il
   * giovedì partiva dagli archer push-up, gradino 5, col range calcolato sui
   * push-up a terra. Ventiquattro push-up non dicono niente sugli archer.
   */
  it('non parte sopra il gradino a cui il test ha misurato', () => {
    const conTest = latestTestResults(DEFAULT_TESTS);
    const archer = getExercise('pushup-archer-o-pseudo-planche');
    expect(archer.defaultLevel).toBe(5);
    expect(startingLevel(archer, conTest)).toBe(2);

    const monobraccio = getExercise('rematore-trx-monobraccio');
    expect(monobraccio.defaultLevel).toBe(5);
    expect(startingLevel(monobraccio, conTest)).toBe(2);

    const hspu = getExercise('negative-hspu-muro-o-pike-pushup');
    expect(hspu.defaultLevel).toBe(3);
    expect(startingLevel(hspu, conTest)).toBe(2);
  });

  it('è un tetto, non un’assegnazione: chi sta più in basso resta più in basso', () => {
    /* I dip su panca dei finisher: gradino 1 contro il 3 del test. */
    const finisher = getExercise('dip-panche');
    expect(finisher.defaultLevel).toBe(1);
    expect(startingLevel(finisher)).toBe(1);
  });

  it('non abbassa attraverso misure diverse', () => {
    /*
     * La scala del core passa dalle tenute in secondi alle ripetizioni:
     * abbassare l'hanging leg raise fino all'hollow hold darebbe «10-15
     * ripetizioni» di una tenuta.
     */
    const legRaise = getExercise('hanging-leg-raise');
    expect(legRaise.measurement).toBe('reps');
    expect(startingLevel(legRaise)).toBe(legRaise.defaultLevel);
  });

  it('non tocca chi è già al gradino del test, se il test basta per il range', () => {
    /* Dieci trazioni coprono sei-otto con due di riserva: si parte complete. */
    const trazioni = getExercise('trazioni-prona-presa-media');
    expect(startingLevel(trazioni, latestTestResults(DEFAULT_TESTS))).toBe(trazioni.defaultLevel);
  });

  it('lo stato iniziale usa il gradino del test', () => {
    expect(
      initialExerciseState(
        getExercise('pushup-archer-o-pseudo-planche'),
        latestTestResults(DEFAULT_TESTS),
      ).level,
    ).toBe(2);
  });

  /*
   * Senza un test non c'è niente contro cui tarare un tetto, quindi si parte
   * dal primo gradino. Sono le cinque scale aggiunte: il foglio prescriveva
   * questi esercizi già nella forma avanzata, e chi non ha mai fatto l'hip
   * thrust a due gambe non aveva niente da cui salire.
   */
  it('senza un test sulla scala si parte dal primo gradino', () => {
    for (const slug of [
      'hip-thrust-monopodalico',
      'single-leg-rdl',
      'calf-monopodalico-rialzo',
      'calf-monopodalico-seduto',
      'step-up-box-alto',
      'sissy-squat',
    ]) {
      const exercise = getExercise(slug);
      expect(exercise.pattern, slug).not.toBeNull();
      expect(exercise.defaultLevel, slug).not.toBeNull();
      expect(startingLevel(exercise), slug).toBe(1);
    }
  });

  it('il gradino della scheda resta l’obiettivo, non sparisce', () => {
    /* Serve alla riga «Obiettivo della scheda» del player. */
    expect(getExercise('hip-thrust-monopodalico').defaultLevel).toBe(4);
    expect(getExercise('single-leg-rdl').defaultLevel).toBe(5);
    expect(getExercise('sissy-squat').defaultLevel).toBe(3);
  });
});

describe('la variante scavalca quando il gradino è troppo facile', () => {
  /*
   * L'ordine del metodo è giusto finché il gradino è tarato: allungare
   * l'eccentrica e aggiungere una pausa spremono la variante che si sta
   * facendo. Ma tempo e pausa non riducono il numero di ripetizioni, e a
   * trenta ripetizioni il problema non è il tempo: è che il gradino non fa
   * più resistenza. Quattro passi intermedi prima della variante significano
   * mesi sullo stesso gradino.
   */
  it('a ripetizioni da resistenza propone la variante, non il tempo', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: sets([26, 26, 26]) }),
    );
    expect(evaluation.triggered).toBe(true);
    expect(evaluation.enduranceWarning).toContain('resistenza');
    expect(evaluation.suggestion?.lever).toBe('variant');
  });

  it('dentro ripetizioni normali resta l’ordine del metodo', () => {
    /* Range 4-6 dal test pike: toccare il 6 è la leva 1 esaurita, non di più. */
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: sets([6, 6, 6]) }),
    );
    expect(evaluation.triggered).toBe(true);
    expect(evaluation.enduranceWarning).toBeNull();
    expect(evaluation.suggestion?.lever).toBe('tempo');
  });

  it('chiudere il range con più margine di quello prescritto basta', () => {
    /* Il B1 chiede RIR 1: tre serie chiuse al massimo del range a RIR 3. */
    const conMargine = [set(1, 6, { rir: 3 }), set(2, 6, { rir: 3 }), set(3, 6, { rir: 3 })];
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: conMargine }),
    );
    expect(evaluation.suggestion?.lever).toBe('variant');
  });

  it('il margine dentro quello prescritto non scavalca niente', () => {
    const aTarget = [set(1, 6, { rir: 1 }), set(2, 6, { rir: 1 }), set(3, 6, { rir: 1 })];
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: aTarget }),
    );
    expect(evaluation.suggestion?.lever).toBe('tempo');
  });

  it('scavalcando, tempo e pausa dicono perché sono state salvate', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: sets([26, 26, 26]) }),
    );
    for (const lever of ['tempo', 'iso-pause'] as const) {
      const entry = evaluation.levers.find((row) => row.lever === lever);
      expect(entry?.available, lever).toBe(false);
      expect(entry?.reason, lever).toContain('Scavalcata');
    }
  });

  it('su un’isometria non scavalca niente: i secondi non sono ripetizioni', () => {
    /*
     * Sulla skill isometrica la variante è la prima leva disponibile comunque,
     * perché tempo e pausa non si applicano a una tenuta. Quello che si
     * verifica qui è che non ci arrivi scavalcando: la soglia della resistenza
     * è in ripetizioni e 45 secondi non sono 45 ripetizioni.
     */
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'shadow', code: 'A', loggedSets: sets([45, 45, 45]) }),
    );
    expect(evaluation.enduranceWarning).toBeNull();
    for (const lever of ['tempo', 'iso-pause'] as const) {
      const entry = evaluation.levers.find((row) => row.lever === lever);
      expect(entry?.reason ?? '', lever).not.toContain('Scavalcata');
    }
  });
});

describe('andare oltre il range', () => {
  /*
   * Toccare il massimo e superarlo sono due cose diverse.
   *
   * Toccarlo è la leva 1 esaurita, e il metodo passa al tempo: giusto, perché
   * il gradino sta ancora limitando. Superarlo a ogni serie vuol dire che non
   * limita più niente, e rallentare l'eccentrica non riduce le ripetizioni.
   */
  it('superare il massimo su tutte le serie propone la variante', () => {
    /* Il B1 dell'Upper A ha range 4-6 dal test pike: sei serie da 9. */
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: sets([9, 9, 9]) }),
    );
    expect(evaluation.triggered).toBe(true);
    expect(evaluation.suggestion?.lever).toBe('variant');
  });

  it('toccare il massimo senza superarlo resta sul tempo', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: sets([6, 6, 6]) }),
    );
    expect(evaluation.triggered).toBe(true);
    expect(evaluation.suggestion?.lever).toBe('tempo');
  });

  it('una sola serie sopra il massimo non basta', () => {
    const evaluation = evaluateProgression(
      makeInput({ sessionId: 'upper-a', code: 'B1', loggedSets: sets([9, 6, 6]) }),
    );
    expect(evaluation.suggestion?.lever).toBe('tempo');
  });
});

describe('gradino di partenza dal test (PROGRAM_RULES R1)', () => {
  const prova = (testId: TestResult['testId'], value: number): ReadonlyMap<TestResult['testId'], TestResult> =>
    latestTestResults([testResultSingle(testId, '2026-11-09', 0, value)]);

  it('le trazioni a quattro partono dal box, non dalle complete', () => {
    /*
     * Il caso che ha fatto nascere la regola. Sei-otto a RIR 1-2 vogliono
     * otto al test; con quattro si scende di un gradino, saltando le sole
     * negative, che a sei-otto ripetizioni con un secondo di salita non si
     * fanno. È il «piede sul box» che la scheda scriveva a parole.
     */
    const trazioni = getExercise('trazioni-prona-presa-media');
    expect(startingLevel(trazioni, prova('pull-up', 4))).toBe(1);
    expect(startingLevel(trazioni, prova('pull-up', 7))).toBe(1);
    expect(startingLevel(trazioni, prova('pull-up', 8))).toBe(3);
  });

  it('i dip sotto la soglia saltano le negative', () => {
    const dip = getExercise('dip-parallele-anelli');
    expect(startingLevel(dip, prova('dip', 8))).toBe(3);
    expect(startingLevel(dip, prova('dip', 5))).toBe(1);
  });

  it('confronta la soglia del blocco: per lato sul bulgaro, in secondi sull’hollow', () => {
    const bulgaro = getExercise('bulgarian-split-squat');
    expect(startingLevel(bulgaro, prova('bulgarian-split-squat', 10))).toBe(2);
    expect(startingLevel(bulgaro, prova('bulgarian-split-squat', 9))).toBe(1);

    /* 30-45": soglia 30 + 6 = 36. */
    const hollow = getExercise('hollow-hold');
    expect(startingLevel(hollow, prova('hollow-hold', 40))).toBe(3);
    expect(startingLevel(hollow, prova('hollow-hold', 30))).toBe(2);
  });

  it('un test a zero o mancante parte dal primo gradino', () => {
    const trazioni = getExercise('trazioni-prona-presa-media');
    expect(startingLevel(trazioni, prova('pull-up', 0))).toBe(1);
    expect(startingLevel(trazioni, new Map())).toBe(1);
  });

  it('l’hip thrust su panca parte su panca, come dice la scheda', () => {
    /*
     * Prima la Seduta 4 lo apriva al gradino 1, glute bridge a terra: la
     * scala non ha un test, e «senza test, gradino 1» valeva per tutti. Ma i
     * gradini 1 e 2 delle scale senza test non sono mai monopodalici né
     * eccentrici: partire dal 2 quando la scheda lo prescrive non rischia
     * niente.
     */
    expect(startingLevel(getExercise('hip-thrust-panca-bilaterale'))).toBe(2);
    /* Il monopodalico resta al primo: è il 4, e nessuno ci arriva senza passare dal 2. */
    expect(startingLevel(getExercise('hip-thrust-monopodalico'))).toBe(1);
  });

  it('rispetta la scheda dove prescrive sotto il test, e non tocca la decompressione', () => {
    /* Dip su panca piedi rialzati: gradino 1 contro il 3 del test. */
    expect(startingLevel(getExercise('dip-panche-piedi-rialzati'), prova('dip', 12))).toBe(1);
    /* Il dead hang sta solo in Z1, fuori dalla revisione: niente lo muoverà mai. */
    const hang = getExercise('dead-hang');
    expect(startingLevel(hang, new Map())).toBe(hang.defaultLevel);
  });
});
