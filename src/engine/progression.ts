import { adjacentLevel, getProgressionStep } from '../data/progressions.ts';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise as getExerciseBySlug } from '../data/exercises.ts';
import { ENDURANCE_REP_THRESHOLD } from '../data/method.ts';
import { testBaseline } from '../data/tests.ts';
import {
  ECCENTRIC_TEMPO_LADDER,
  ISO_PAUSE_LADDER,
  OVERLOAD_LEVERS,
  OVERLOAD_LEVER_LABELS,
  VARIANT_JUMP_REP_LOSS,
} from '../types/index.ts';
import type {
  Exercise,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  MotorPattern,
  LoggedExercise,
  OverloadLever,
  ProgramBlock,
  TempoPhase,
  TestId,
  TestResult,
  Tut,
  TutNotation,
} from '../types/index.ts';
import { isTempoBreakdown, parseRir, parseTut } from './notation.ts';
import { getLoadAvailability, assessLoadNeed, stepLoad } from './loading.ts';
import type { RangeResolution } from './ranges.ts';
import { formatRange } from './ranges.ts';

/**
 * Regola di avanzamento e scelta della leva.
 *
 * Il motore **suggerisce**, non applica. Ogni funzione qui dentro restituisce
 * uno stato nuovo senza toccare quello ricevuto: l'accettazione è una scelta
 * dell'utente e viene tracciata a parte.
 */

/** Tetto della leva tempo: l'eccentrica non va oltre 5". */
export const MAX_ECCENTRIC_SECONDS = ECCENTRIC_TEMPO_LADDER.at(-1) ?? 5;

/** Tetto della leva pause: la pausa in allungamento non va oltre 2". */
export const MAX_ISO_PAUSE_SECONDS = ISO_PAUSE_LADDER.at(-1) ?? 2;

/**
 * I blocchi del programma attivo che prescrivono questo esercizio.
 *
 * Il gradino di partenza dipende da *come* l'esercizio verrà usato: lo stesso
 * massimale di quattro trazioni basta per tre serie a cedimento e non basta
 * per tre serie da sei-otto con due di riserva.
 */
function activeBlocksFor(slug: ExerciseSlug): readonly ProgramBlock[] {
  return CIRCUIT_SESSIONS.flatMap((session) =>
    session.blocks.filter((block) => block.exercise === slug),
  );
}

/**
 * Quanto bisogna saper fare al test perché il range del blocco stia sotto il
 * massimo con il RIR chiesto.
 *
 * Sei-otto ripetizioni a RIR 1-2 vogliono che l'ottava arrivi con ancora due
 * in serbatoio: dieci al test non è un'esagerazione, otto è il minimo.
 * Il designer l'ha scritto così: sulle ripetizioni `min + RIRmax`, sui
 * secondi `min + 20% del min`, arrotondato per eccesso.
 */
function thresholdFor(block: ProgramBlock): number | null {
  const prescription = block.prescription;
  if (prescription.kind === 'reps') {
    const rir = parseRir(block.rir);
    return prescription.min + (rir === null ? 0 : rir.max);
  }
  if (prescription.kind === 'seconds') {
    return prescription.min + Math.ceil(prescription.min * 0.2);
  }
  return null;
}

/** Il primo gradino della scala che non sia solo eccentrico. */
function firstExecutableLevel(pattern: MotorPattern): LevelIndex {
  if (!getProgressionStep(pattern, 1).eccentricOnly) return 1;
  return adjacentLevel(pattern, 1, 1, true) ?? 1;
}

/**
 * Il gradino da cui si parte (PROGRAM_RULES R1, chiude B5).
 *
 * Prima la regola era «mai sopra il gradino del test»: un tetto uguale per
 * chiunque avesse fatto almeno una ripetizione. Chi chiudeva il test delle
 * trazioni con quattro si vedeva assegnare le trazioni complete, gradino 3,
 * con un range di sei-otto: cioè il doppio di quello che aveva appena
 * dimostrato di saper fare, per tre serie. La scheda originale lo sapeva e lo
 * scriveva a parole, «un piede sul box»; nessuna funzione lo calcolava.
 *
 * Adesso il risultato del test si confronta con quello che il blocco chiede.
 * Si valuta in ordine, e la prima riga che si applica decide:
 *
 * 1. esercizio senza scala: il suo gradino;
 * 2. solo in blocchi fuori dalla revisione (il dead hang della
 *    decompressione): il suo gradino, perché niente lo farà mai cambiare;
 * 3. scala senza test: il gradino dell'esercizio se è 1 o 2, altrimenti 1 —
 *    l'hip thrust su panca della Seduta 4 parte su panca, come dice la scheda,
 *    e il monopodalico non lo assegna nessuno a chi non ha mai fatto quello a
 *    due gambe;
 * 4. la scheda prescrive sotto il gradino del test (il dip su panca): si
 *    rispetta, è una scelta;
 * 5. misure diverse fra test ed esercizio: il gradino dell'esercizio;
 * 6. test mancante o a zero: il primo gradino eseguibile;
 * 7. nessun blocco a range fisso (il programma archiviato): il tetto di prima;
 * 8. altrimenti: se il massimale arriva alla soglia del blocco più esigente,
 *    il gradino del test; se no, quello sotto — saltando le sole negative,
 *    che su un range fisso non si eseguono.
 */
export function startingLevel(
  exercise: Exercise,
  tests: ReadonlyMap<TestId, TestResult> = new Map(),
): LevelIndex | null {
  const prescritto = exercise.defaultLevel;
  /* 1 */
  if (exercise.pattern === null || prescritto === null) return prescritto;
  const pattern = exercise.pattern;

  const blocchi = activeBlocksFor(exercise.slug);
  /* 2 */
  if (blocchi.length > 0 && blocchi.every((block) => block.excludeFromReview === true)) {
    return prescritto;
  }

  const prova = testBaseline(pattern);
  /* 3 */
  if (prova === null) return prescritto <= 2 ? prescritto : 1;
  /* 4 */
  if (prescritto < prova.level) return prescritto;
  /* 5 */
  if (prova.measurement !== exercise.measurement) return prescritto;

  /* 6 */
  const risultato = tests.get(prova.testId);
  if (risultato === undefined || risultato.value <= 0) return firstExecutableLevel(pattern);

  /* 7 */
  const soglie = blocchi
    .filter((block) => block.excludeFromReview !== true)
    .map(thresholdFor)
    .filter((soglia): soglia is number => soglia !== null);
  if (soglie.length === 0) return (prescritto < prova.level ? prescritto : prova.level) as LevelIndex;

  /* 8 */
  const soglia = Math.max(...soglie);
  if (risultato.value >= soglia) return prova.level;
  return adjacentLevel(pattern, prova.level, -1, true) ?? firstExecutableLevel(pattern);
}

/**
 * Il gradino attuale è quello per cui l'esercizio è scritto.
 *
 * Decide chi ha ragione fra il nome dell'esercizio e il nome del gradino, e lo
 * decide una volta per il titolo e per la figura, che devono dire la stessa
 * cosa. Quando coincidono vince il nome dell'esercizio, che è più preciso: dice
 * anche quello che il gradino non nomina, la presa larga di una trazione o la
 * panca di un dip. Quando non coincidono vince il gradino, perché il nome
 * dell'esercizio a quel punto descrive un movimento che non stai facendo.
 */
export function isOwnLevel(exercise: Exercise, level: LevelIndex | null): boolean {
  return exercise.pattern === null || level === null || level === exercise.defaultLevel;
}

export function initialExerciseState(
  exercise: Exercise,
  tests: ReadonlyMap<TestId, TestResult> = new Map(),
): ExerciseState {
  return {
    exercise: exercise.slug,
    level: startingLevel(exercise, tests),
    eccentricBonusSeconds: 0,
    bottomPauseBonusSeconds: 0,
    loadKg: 0,
  };
}

function raisePhase(phase: TempoPhase, bonus: number, cap: number): TempoPhase {
  if (phase === 'X') return 'X';
  return Math.min(cap, phase + bonus);
}

/**
 * Tempo effettivo: quello prescritto dal blocco più i bonus accumulati.
 * I bonus sono relativi apposta, perché lo stesso esercizio compare in blocchi
 * con TUT diversi.
 */
export function effectiveTempo(notation: TutNotation, state: ExerciseState): Tut {
  const tut = parseTut(notation);
  if (!isTempoBreakdown(tut)) return tut;
  return {
    ...tut,
    eccentric: raisePhase(tut.eccentric, state.eccentricBonusSeconds, MAX_ECCENTRIC_SECONDS),
    bottomPause: raisePhase(tut.bottomPause, state.bottomPauseBonusSeconds, MAX_ISO_PAUSE_SECONDS),
  };
}

/* -------------------------------------------------------------------------- */
/* Disponibilità delle leve                                                    */
/* -------------------------------------------------------------------------- */

export interface LeverAvailability {
  readonly lever: OverloadLever;
  readonly label: string;
  readonly available: boolean;
  /** Perché la leva è esaurita o bloccata. `null` quando è disponibile. */
  readonly reason: string | null;
}

export interface ProgressionInput {
  readonly block: ProgramBlock;
  readonly exercise: Exercise;
  readonly state: ExerciseState;
  readonly logged: LoggedExercise;
  readonly range: RangeResolution;
  readonly week: number;
  /** Ultimo massimale noto, per la soglia della zavorra. `null` se non c'è. */
  readonly currentMaxReps: number | null;
}

function tempoLever(input: ProgressionInput): LeverAvailability {
  const label = OVERLOAD_LEVER_LABELS.tempo;
  const tut = effectiveTempo(input.block.tut, input.state);
  if (!isTempoBreakdown(tut)) {
    return { lever: 'tempo', label, available: false, reason: 'Questo esercizio non ha un tempo a quattro fasi su cui agire.' };
  }
  if (tut.eccentric === 'X') {
    return { lever: 'tempo', label, available: false, reason: 'L’eccentrica prescritta è esplosiva: non si rallenta.' };
  }
  if (tut.eccentric >= MAX_ECCENTRIC_SECONDS) {
    return {
      lever: 'tempo',
      label,
      available: false,
      reason: `Eccentrica già a ${String(MAX_ECCENTRIC_SECONDS)}", il massimo previsto dal metodo.`,
    };
  }
  return { lever: 'tempo', label, available: true, reason: null };
}

function isoPauseLever(input: ProgressionInput): LeverAvailability {
  const label = OVERLOAD_LEVER_LABELS['iso-pause'];
  const tut = effectiveTempo(input.block.tut, input.state);
  if (!isTempoBreakdown(tut)) {
    return { lever: 'iso-pause', label, available: false, reason: 'Questo esercizio non ha un tempo a quattro fasi su cui agire.' };
  }
  if (tut.bottomPause === 'X') {
    return { lever: 'iso-pause', label, available: false, reason: 'La fase in allungamento è esplosiva: non si tiene.' };
  }
  if (tut.bottomPause >= MAX_ISO_PAUSE_SECONDS) {
    return {
      lever: 'iso-pause',
      label,
      available: false,
      reason: `Pausa in allungamento già a ${String(MAX_ISO_PAUSE_SECONDS)}", il massimo previsto dal metodo.`,
    };
  }
  return { lever: 'iso-pause', label, available: true, reason: null };
}

function variantLever(input: ProgressionInput): LeverAvailability {
  const label = OVERLOAD_LEVER_LABELS.variant;
  const { exercise, state } = input;
  if (exercise.pattern === null || state.level === null) {
    return { lever: 'variant', label, available: false, reason: 'Questo esercizio non appartiene a una scala di progressione.' };
  }
  if (adjacentLevel(exercise.pattern, state.level, 1, isFixedRange(input.block)) === null) {
    return { lever: 'variant', label, available: false, reason: 'Sei già all’ultimo gradino eseguibile della scala.' };
  }
  return { lever: 'variant', label, available: true, reason: null };
}

/**
 * Il blocco ha un range scritto nella scheda, non ricavato dal test.
 *
 * Sui range fissi del circuito i gradini di sole negative non si eseguono
 * come la scheda chiede, quindi salire e scendere li salta.
 */
export function isFixedRange(block: ProgramBlock): boolean {
  return block.prescription.kind === 'reps' || block.prescription.kind === 'seconds';
}

function loadLever(input: ProgressionInput): LeverAvailability {
  const label = OVERLOAD_LEVER_LABELS.load;

  /*
   * Il peso di un manubrio non è la quinta leva del metodo.
   *
   * `inherent` vuol dire che il carico è l'esercizio: si registra sempre, ma
   * non si sale di 2,5 kg alla volta e non entra nell'ordine delle leve.
   * Confondere le due cose farebbe comparire "aggiungi zavorra" su un'alzata
   * laterale, dove la scheda non prevede nessuna progressione di carico.
   */
  if (input.exercise.loadPolicy === 'inherent') {
    return {
      lever: 'load',
      label,
      available: false,
      reason: 'Qui il peso è l’esercizio, non una leva: si registra, ma non è zavorra.',
    };
  }

  const availability = getLoadAvailability(input.exercise, input.week);
  if (!availability.allowed) {
    return { lever: 'load', label, available: false, reason: availability.explanation };
  }
  if (input.currentMaxReps !== null) {
    const need = assessLoadNeed(input.exercise, input.currentMaxReps);
    if (need.need === 'discouraged') {
      return { lever: 'load', label, available: false, reason: need.message };
    }
  }
  return { lever: 'load', label, available: true, reason: null };
}

/* -------------------------------------------------------------------------- */
/* Valutazione                                                                 */
/* -------------------------------------------------------------------------- */

export interface ProgressionSuggestion {
  readonly lever: OverloadLever;
  readonly title: string;
  /** Cosa cambia concretamente la prossima volta. */
  readonly change: string;
  /** Avviso sulla perdita di ripetizioni. Solo per la leva variante. */
  readonly warning: string | null;
  /** Stato dell'esercizio se il suggerimento viene accettato. */
  readonly nextState: ExerciseState;
}

export interface ProgressionEvaluation {
  /** Massimo del range chiuso su tutte le serie. */
  readonly closedRange: boolean;
  readonly tempoRespected: boolean | null;
  /** Le due condizioni insieme: è il momento di cambiare leva. */
  readonly triggered: boolean;
  readonly levers: readonly LeverAvailability[];
  readonly suggestion: ProgressionSuggestion | null;
  /** Perché non c'è un suggerimento. `null` quando c'è. */
  readonly blockedReason: string | null;
  /** Avviso quando le ripetizioni entrano nel territorio della resistenza. */
  readonly enduranceWarning: string | null;
}

function meanValue(logged: LoggedExercise): number {
  if (logged.sets.length === 0) return 0;
  return logged.sets.reduce((sum, set) => sum + set.value, 0) / logged.sets.length;
}

function buildSuggestion(
  lever: OverloadLever,
  input: ProgressionInput,
): ProgressionSuggestion {
  const { state, block } = input;
  const title = OVERLOAD_LEVER_LABELS[lever];

  switch (lever) {
    case 'reps': {
      const target =
        input.range.kind === 'range' ? formatRange(input.range.range, input.range.unit) : 'il range prescritto';
      return {
        lever,
        title,
        change: `Resta su questa variante e questo tempo, e sali dentro ${target}.`,
        warning: null,
        nextState: state,
      };
    }
    case 'tempo': {
      const current = effectiveTempo(block.tut, state);
      const from = isTempoBreakdown(current) && current.eccentric !== 'X' ? current.eccentric : 0;
      return {
        lever,
        title,
        change: `Eccentrica da ${String(from)}" a ${String(from + 1)}". Stessa variante, stesso range: cambia solo quanto ci metti a scendere.`,
        warning: null,
        nextState: { ...state, eccentricBonusSeconds: state.eccentricBonusSeconds + 1 },
      };
    }
    case 'iso-pause': {
      const current = effectiveTempo(block.tut, state);
      const from = isTempoBreakdown(current) && current.bottomPause !== 'X' ? current.bottomPause : 0;
      return {
        lever,
        title,
        change: `Pausa nel punto di massimo allungamento da ${String(from)}" a ${String(from + 1)}". Fermo, senza rimbalzo.`,
        warning: null,
        nextState: { ...state, bottomPauseBonusSeconds: state.bottomPauseBonusSeconds + 1 },
      };
    }
    case 'variant': {
      const pattern = input.exercise.pattern;
      const level = state.level;
      const nextLevel =
        pattern === null || level === null
          ? null
          : adjacentLevel(pattern, level, 1, isFixedRange(input.block));
      if (pattern === null || nextLevel === null) {
        return { lever, title, change: 'Nessuna variante più difficile disponibile.', warning: null, nextState: state };
      }
      const step = getProgressionStep(pattern, nextLevel);
      const achieved = meanValue(input.logged);
      const low = Math.max(1, Math.round(achieved * (1 - VARIANT_JUMP_REP_LOSS.max)));
      const high = Math.max(low, Math.round(achieved * (1 - VARIANT_JUMP_REP_LOSS.min)));
      return {
        lever,
        title,
        change: `Sali al livello ${String(nextLevel)}: ${step.name}. Torna al tempo prescritto dalla scheda e riparti dal minimo del range.`,
        warning: `Aspettati di scendere a ${String(low)}-${String(high)} ripetizioni. Perdere il 30-40% salendo di variante è normale e corretto: è il segno che il carico è aumentato davvero.`,
        nextState: {
          ...state,
          level: nextLevel,
          // Il bonus di tempo e pause si azzera: la variante nuova si affronta
          // al tempo che la scheda prescrive, non a quello accumulato su
          // quella vecchia.
          eccentricBonusSeconds: 0,
          bottomPauseBonusSeconds: 0,
        },
      };
    }
    case 'load': {
      const next = stepLoad(state.loadKg, 1);
      return {
        lever,
        title,
        change: `Passa da ${String(state.loadKg)} kg a ${String(next)} kg. Punta a 6-8 ripetizioni con RIR 1.`,
        warning: null,
        nextState: { ...state, loadKg: next },
      };
    }
  }
}

export function evaluateProgression(input: ProgressionInput): ProgressionEvaluation {
  const { logged, range } = input;

  const repsLever: LeverAvailability = { lever: 'reps', label: OVERLOAD_LEVER_LABELS.reps, available: true, reason: null };
  const levers: LeverAvailability[] = [
    repsLever,
    tempoLever(input),
    isoPauseLever(input),
    variantLever(input),
    loadLever(input),
  ];

  /*
   * La soglia è in ripetizioni e vale solo dove si contano ripetizioni.
   *
   * Su un'isometria il numero registrato sono secondi: 40" di wall sit
   * facevano scattare «sopra 25-30 ripetizioni stai allenando la resistenza»,
   * che oltre a essere falso suggeriva di cambiare leva su una tenuta da 45"
   * andata come prescritto.
   */
  const enduranceWarning =
    input.exercise.measurement === 'reps' &&
    logged.sets.length > 0 &&
    meanValue(logged) >= ENDURANCE_REP_THRESHOLD.min
      ? `Sopra ${String(ENDURANCE_REP_THRESHOLD.min)}-${String(ENDURANCE_REP_THRESHOLD.max)} ripetizioni stai allenando la resistenza, non l’ipertrofia. Cambia leva.`
      : null;

  if (range.kind !== 'range') {
    return {
      closedRange: false,
      tempoRespected: logged.tempoRespected,
      triggered: false,
      levers,
      suggestion: null,
      blockedReason: 'Questo blocco non ha un range di lavoro: la regola di avanzamento non si applica.',
      enduranceWarning,
    };
  }

  const closedRange =
    logged.sets.length > 0 && logged.sets.every((set) => set.value >= range.range.max);
  /*
   * `null` è «non hai ancora risposto», e non vale come sì.
   *
   * Prima il campo nasceva a `true`: la domanda di fine seduta arrivava già
   * con «Sì» acceso, premerlo non cambiava niente, e soprattutto il metodo
   * dava per rispettato un tempo che nessuno aveva confermato. La condizione
   * di avanzamento si reggeva su una risposta mai data.
   */
  const triggered = closedRange && logged.tempoRespected === true;

  if (!triggered) {
    levers[0] = repsLever;
    const blockedReason = !closedRange
      ? `Non hai ancora chiuso ${String(range.range.max)} su tutte le serie. Resta sulla leva 1 e sali dentro il range.`
      : logged.tempoRespected === null
        ? 'Manca una risposta sul tempo prescritto: finché non c’è, la leva 1 non si può dire esaurita.'
        : 'Il tempo prescritto non è stato rispettato su tutte le serie: la leva 1 non è ancora esaurita.';
    return {
      closedRange,
      tempoRespected: logged.tempoRespected,
      triggered: false,
      levers,
      suggestion: null,
      blockedReason,
      enduranceWarning,
    };
  }

  // Il trigger scatta proprio quando la leva 1 è esaurita.
  levers[0] = {
    lever: 'reps',
    label: OVERLOAD_LEVER_LABELS.reps,
    available: false,
    reason: `Hai chiuso ${String(range.range.max)} su tutte le serie: la leva delle ripetizioni è esaurita.`,
  };

  // La leva più bassa ancora disponibile, nell'ordine obbligato del metodo.
  // Le ripetizioni sono già marcate esaurite qui sopra, quindi non vengono
  // mai riproposte: la regola sta nella disponibilità, non in un indice.
  const byLever = new Map(levers.map((entry) => [entry.lever, entry]));

  /*
   * Quando il gradino è troppo facile la variante passa davanti.
   *
   * L'ordine del metodo — ripetizioni, tempo, pausa, variante, carico — è
   * giusto finché il gradino è tarato: allungare l'eccentrica e aggiungere una
   * pausa spreme la variante che si sta facendo. Ma tempo e pausa non riducono
   * il numero di ripetizioni, e a trenta ripetizioni il problema non è il
   * tempo: è che il gradino non fa più resistenza. Il metodo lo dice da sé
   * nell'avviso sulla resistenza, «cambia leva»; qui la leva che risolve
   * davvero è la variante, e quattro passi intermedi prima di arrivarci
   * significano mesi sullo stesso gradino.
   *
   * Tre segnali, tutti misurati e nessuno dichiarato:
   *
   * 1. ogni serie è andata *sopra* il massimo del range, non solo a toccarlo.
   *    Toccare il massimo è la leva 1 esaurita e il metodo passa al tempo;
   *    superarlo a ogni serie vuol dire che il gradino non sta limitando
   *    niente;
   * 2. la media entra nel territorio della resistenza (25+ ripetizioni);
   * 3. il massimo del range è chiuso su tutte le serie *con più margine di
   *    quello prescritto*, cioè ogni serie registrata con un RIR sopra il
   *    tetto richiesto: se avanzavano ripetizioni a ogni serie, il gradino
   *    non era il limite.
   */
  const sopraIlRange =
    logged.sets.length > 0 && logged.sets.every((set) => set.value > range.range.max);
  const rirTarget = parseRir(input.block.rir);
  const conMargine =
    rirTarget !== null &&
    logged.sets.length > 0 &&
    logged.sets.every((set) => set.rir !== null && set.rir > rirTarget.max);
  const gradinoTroppoFacile =
    input.exercise.measurement === 'reps' &&
    (sopraIlRange || enduranceWarning !== null || conMargine) &&
    byLever.get('variant')?.available === true;

  const next = gradinoTroppoFacile
    ? 'variant'
    : OVERLOAD_LEVERS.find((lever) => byLever.get(lever)?.available === true);

  if (next === undefined) {
    return {
      closedRange,
      tempoRespected: true,
      triggered: true,
      levers,
      suggestion: null,
      blockedReason:
        'Hai esaurito tutte le leve disponibili su questo esercizio. Serve un cambio di programmazione, non un altro giro.',
      enduranceWarning,
    };
  }

  /*
   * Se la variante ha saltato la coda, tempo e pausa restano disponibili ma
   * scavalcate: la schermata deve dire perché, non lasciarle lì come se fossero
   * la prossima cosa da fare.
   */
  if (gradinoTroppoFacile) {
    const motivo = `Scavalcata: a queste ripetizioni il gradino non fa più resistenza, e rallentare il tempo non le riduce.`;
    for (const [indice, entry] of levers.entries()) {
      if (entry.lever === 'tempo' || entry.lever === 'iso-pause') {
        levers[indice] = { ...entry, available: false, reason: motivo };
      }
    }
  }

  return {
    closedRange,
    tempoRespected: true,
    triggered: true,
    levers,
    suggestion: buildSuggestion(next, input),
    blockedReason: null,
    enduranceWarning,
  };
}

/* -------------------------------------------------------------------------- */
/* Applicazione                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Applica una leva allo stato. Non muta l'originale.
 * L'app la chiama solo quando l'utente accetta il suggerimento.
 */
export function applyLever(
  lever: OverloadLever,
  input: ProgressionInput,
): ExerciseState {
  return buildSuggestion(lever, input).nextState;
}

export interface TestOutcome {
  /** Il blocco, con la seduta: «Seduta 1 · A1». */
  readonly where: string;
  readonly exercise: ExerciseSlug;
  readonly level: LevelIndex | null;
}

/**
 * Cosa decide un risultato di test nel programma attivo: da che gradino parte
 * ogni esercizio che quel test misura.
 *
 * È la stessa regola che l'app applica dopo (R1), fatta girare subito con il
 * numero appena scritto. Prima la schermata del test mostrava «range 6-8,
 * dal 55% al 75% del massimale»: la formula del programma archiviato, che
 * nel circuito non decide niente — i range sono scritti nella scheda.
 *
 * Lista vuota quando il test non decide niente nel circuito (il nordic,
 * che nessuna seduta usa; il dead hang, che sta solo nella decompressione).
 */
export function testOutcomes(testId: TestId, result: TestResult | null): TestOutcome[] {
  const prove: ReadonlyMap<TestId, TestResult> =
    result === null ? new Map() : new Map([[testId, result]]);
  const visti = new Set<ExerciseSlug>();
  const esiti: TestOutcome[] = [];
  for (const session of CIRCUIT_SESSIONS) {
    for (const block of session.blocks) {
      if (block.excludeFromReview === true || visti.has(block.exercise)) continue;
      const exercise = getExerciseBySlug(block.exercise);
      if (exercise.pattern === null) continue;
      const prova = testBaseline(exercise.pattern);
      if (prova === null || prova.testId !== testId) continue;
      visti.add(block.exercise);
      esiti.push({
        where: `${session.name} · ${block.code}`,
        exercise: block.exercise,
        level: startingLevel(exercise, prove),
      });
    }
  }
  return esiti;
}
