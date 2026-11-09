import { getProgressionStep } from '../data/progressions.ts';
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
  ExerciseState,
  LevelIndex,
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
 * Il gradino da cui si parte: mai sopra quello a cui il test ha misurato.
 *
 * Prima era il gradino che la scheda prescrive, e su sette blocchi su
 * diciannove quel gradino stava sopra il test — fino a tre gradini sopra. Il
 * caso più chiaro: il test dei push-up si fa a terra, gradino 2, e il giovedì
 * prescriveva archer push-up, gradino 5, col range calcolato sui push-up a
 * terra. Ventiquattro push-up non dicono niente sugli archer, che hanno una
 * tecnica diversa.
 *
 * È un tetto e non un'assegnazione: dove la scheda prescrive più in basso —
 * i dip su panca dei finisher, gradino 1 contro il 3 del test — resta in
 * basso, perché lì la scelta è voluta.
 */
export function startingLevel(
  exercise: Exercise,
  tests: ReadonlyMap<TestId, TestResult> = new Map(),
): LevelIndex | null {
  const prescritto = exercise.defaultLevel;
  if (exercise.pattern === null || prescritto === null) return prescritto;
  const prova = testBaseline(exercise.pattern);
  /*
   * Nessun test su questa scala: si parte dal primo gradino.
   *
   * Le cinque scale aggiunte non hanno un test in settimana 0, quindi non c'è
   * niente contro cui tarare un tetto. Partire dal gradino che la scheda
   * prescrive era il problema: l'hip thrust monopodalico a chi non ha mai
   * fatto quello a due gambe. Senza una misura l'app non ha nessuna prova che
   * si possa fare di più, e la regola di avanzamento porta su in fretta se il
   * primo gradino è banale.
   */
  if (prova === null) return 1;
  /*
   * Zero misurato vuol dire gradino 1, qualunque cosa prescriva la scheda.
   *
   * Prima il tetto era il gradino *dell'esercizio del test*, uguale per
   * chiunque: chi chiudeva la settimana 0 con zero trazioni, zero dip e zero
   * nordic si vedeva assegnare il gradino 3 — trazioni complete, dip completi
   * alle parallele, nordic eccentrico 5" — e gli servivano due settimane di
   * serie da zero ripetizioni per scendere al gradino 1. Il risultato del
   * test non entrava in nessuna decisione.
   *
   * Qui c'è solo la parte inarguibile: un movimento che non hai eseguito
   * nemmeno una volta non è il tuo punto di partenza. La mappatura completa
   * valore → gradino è una regola di metodo e spetta a training-designer:
   * finché non c'è, sopra lo zero resta il tetto del test.
   */
  const risultato = tests.get(prova.testId);
  if (risultato !== undefined && risultato.value <= 0) return 1;
  /*
   * Solo dentro la stessa misura. La scala del core passa dalle tenute in
   * secondi alle ripetizioni: abbassare l'hanging leg raise fino all'hollow
   * hold darebbe «10-15 ripetizioni» di una tenuta.
   */
  if (prova.measurement !== exercise.measurement) return prescritto;
  return (prescritto < prova.level ? prescritto : prova.level) as LevelIndex;
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
  if (state.level >= 6) {
    return { lever: 'variant', label, available: false, reason: 'Sei già al livello 6, l’ultimo della scala.' };
  }
  return { lever: 'variant', label, available: true, reason: null };
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
      if (pattern === null || level === null || level >= 6) {
        return { lever, title, change: 'Nessuna variante più difficile disponibile.', warning: null, nextState: state };
      }
      const nextLevel = (level + 1) as LevelIndex;
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
