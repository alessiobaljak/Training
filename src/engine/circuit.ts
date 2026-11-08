import { getExercise } from '../data/exercises.ts';
import { parseTut, repDurationSeconds } from './notation.ts';
import { buildSessionPlan } from './rest.ts';
import type { SessionStep } from './rest.ts';
import type {
  Exercise,
  ExerciseSlug,
  ExerciseState,
  ProgramBlock,
  ProgramSession,
  WarmupStep,
} from '../types/index.ts';

/**
 * Il piano guidato: una sequenza sola, dal riscaldamento all'ultima stazione.
 *
 * `buildSessionPlan` dice quali serie si fanno e in che ordine, e quel conto
 * resta suo. Qui la lista diventa piatta e alternata — esercizio, recupero,
 * esercizio, recupero — perché è così che la si attraversa con il telefono a
 * terra: un passo alla volta, senza decidere niente.
 *
 * Due cose che `buildSessionPlan` non sa e che si aggiungono qui:
 *
 * 1. **La pausa di blocco.** Nello Shadow il recupero di giro serviva anche da
 *    passaggio tra un blocco e l'altro. Nel circuito sono durate diverse: 45"
 *    tra due giri dello stesso tri-set, 90" tra due tri-set.
 *
 * 2. **La durata minima di esecuzione.** Il countdown dell'esercizio non è un
 *    tetto: è il monito che la serie deve almeno durare quel tempo. Su una
 *    stazione a tempo è la prescrizione; su una a ripetizioni è il tempo che
 *    quelle ripetizioni richiedono **se il TUT viene rispettato**. Otto
 *    ripetizioni a 3-0-1-0 sono 32 secondi: chiuderle in 18 vuol dire che il
 *    tempo non c'era, e questa è l'unica misura che lo dice mentre succede
 *    invece che a fine settimana.
 */

/* -------------------------------------------------------------------------- */
/* Durata minima di una serie                                                  */
/* -------------------------------------------------------------------------- */

/** Il minimo del range, dove la prescrizione ne ha uno di numerico. */
function minRepsOf(block: ProgramBlock): number | null {
  const prescription = block.prescription;
  switch (prescription.kind) {
    case 'reps':
      return prescription.min;
    case 'myo-reps':
      return prescription.activationReps;
    /*
     * `reps-from-test` dipende dal massimale, `max` è a cedimento: in entrambi
     * i casi un minimo non esiste prima di aver risolto il range. Il circuito
     * non li usa — i suoi range sono fissi, ed è il gradino che si sposta — ma
     * le sedute archiviate sì, e lì il player guidato non ci passa.
     */
    default:
      return null;
  }
}

/**
 * Secondi che la serie deve almeno durare. `0` quando non è calcolabile, e
 * allora il player mostra un cronometro in salita invece di un countdown.
 */
export function minWorkSeconds(block: ProgramBlock, exercise: Exercise = getExercise(block.exercise)): number {
  const raddoppia = (value: number): number => (block.perSide ? value * 2 : value);

  if (block.workSeconds !== undefined) return raddoppia(block.workSeconds);

  const prescription = block.prescription;
  if (prescription.kind === 'seconds') return raddoppia(prescription.min);
  if (prescription.kind === 'duration') return prescription.minMinutes * 60;

  /*
   * Un'isometria senza `workSeconds` non ha un tempo da rispettare: si tiene
   * la posizione e il cronometro misura quanto. Un tempo prescritto che non è
   * una notazione a quattro cifre — «controllato» — non dà un numero.
   */
  const perRipetizione = repDurationSeconds(parseTut(block.tut));
  const ripetizioni = minRepsOf(block);
  if (perRipetizione === null || perRipetizione === 0 || ripetizioni === null) {
    void exercise;
    return 0;
  }
  return raddoppia(perRipetizione * ripetizioni);
}

/* -------------------------------------------------------------------------- */
/* I passi del piano guidato                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A che livello sta il recupero.
 *
 * Sono quattro durate diverse con quattro significati diversi, e tenerli
 * distinti serve: la transizione la si può accorciare quando si è in ritardo,
 * il recupero di giro no. Chi taglia il recupero di giro ha cambiato
 * l'allenamento; chi accorcia una transizione ha solo fatto più in fretta.
 */
export type RestTier = 'transizione' | 'giro' | 'blocco' | 'serie';

export const REST_TIER_LABELS: Readonly<Record<RestTier, string>> = Object.freeze({
  transizione: 'Transizione',
  giro: 'Recupero di giro',
  blocco: 'Pausa di blocco',
  serie: 'Recupero tra le serie',
});

export interface GuidedWarmupStep {
  readonly kind: 'warmup';
  readonly id: string;
  readonly order: number;
  readonly label: string;
  /** L'esercizio dell'anagrafica, per figura e cue. */
  readonly exercise: ExerciseSlug | null;
  readonly reps: number | null;
  readonly perSide: boolean;
  readonly hint: string;
  /** Durata del countdown. Sui passi a ripetizioni è una stima. */
  readonly workSeconds: number;
  /** `true` quando la durata è prescritta e non stimata. */
  readonly timed: boolean;
}

export interface GuidedWorkStep {
  readonly kind: 'work';
  readonly id: string;
  readonly order: number;
  /** Tutto quello che serve a registrare la serie. */
  readonly step: SessionStep;
  readonly blockCode: string;
  readonly group: string;
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  /** Durata minima: il countdown parte da qui. `0` quando non è calcolabile. */
  readonly workSeconds: number;
}

export interface GuidedRestStep {
  readonly kind: 'rest';
  readonly id: string;
  readonly order: number;
  readonly tier: RestTier;
  readonly seconds: number;
  readonly maxSeconds: number;
  readonly label: string;
  readonly hint: string;
  /** Cosa arriva dopo, da mostrare mentre si recupera. */
  readonly nextLabel: string;
}

export type GuidedStep = GuidedWarmupStep | GuidedWorkStep | GuidedRestStep;

/* -------------------------------------------------------------------------- */
/* Costanti del riscaldamento                                                  */
/* -------------------------------------------------------------------------- */

/** Tra un passo di riscaldamento e il successivo: solo il tempo di spostarsi. */
export const WARMUP_TRANSITION_SEC = 10;

/** Dopo l'ultimo passo di riscaldamento, prima della prima serie vera. */
export const WARMUP_TO_WORK_SEC = 40;

/** Stima per un passo di riscaldamento a ripetizioni, che non ha un tempo suo. */
const WARMUP_SECONDS_PER_REP = 3;

function warmupSeconds(warmup: WarmupStep): number {
  if (warmup.seconds !== null) return warmup.seconds;
  if (warmup.reps === null) return WARMUP_TRANSITION_SEC;
  const base = warmup.reps * WARMUP_SECONDS_PER_REP;
  return warmup.perSide ? base * 2 : base;
}

/* -------------------------------------------------------------------------- */
/* Recupero tra due passi di lavoro                                            */
/* -------------------------------------------------------------------------- */

/** Quanto dura la pausa dopo l'ultimo giro di un blocco. */
export function blockRestSeconds(block: ProgramBlock): number {
  const rest = block.rest;
  switch (rest.kind) {
    case 'superset':
      return rest.blockRestSec ?? rest.roundRestSec;
    case 'straight':
    case 'cluster':
      return rest.restSec;
    case 'none':
      return 0;
  }
}

function tierOf(step: SessionStep): RestTier {
  switch (step.rest.kind) {
    case 'transition':
      return 'transizione';
    case 'round':
      return 'giro';
    default:
      return 'serie';
  }
}

interface RestShape {
  readonly tier: RestTier;
  readonly seconds: number;
  readonly maxSeconds: number;
  readonly hint: string;
}

/**
 * Il recupero che sta tra due serie consecutive del piano.
 *
 * `null` quando non ce n'è: tra due giri della finitura metabolica, dove si
 * passa da una stazione all'altra e si ricomincia senza fermarsi.
 */
function restBetween(
  step: SessionStep,
  next: SessionStep,
  session: ProgramSession,
): RestShape | null {
  if (next.group !== step.group) {
    const block = session.blocks.find((entry) => entry.code === step.blockCode);
    if (block === undefined) return null;
    const seconds = blockRestSeconds(block);
    if (seconds <= 0) return null;
    return {
      tier: 'blocco',
      seconds,
      maxSeconds: seconds,
      hint: 'Fine del blocco. Il prossimo riparte da fermo su muscoli nuovi: questa pausa serve tutta.',
    };
  }

  if (step.rest.kind === 'none' || step.rest.seconds <= 0) return null;
  return {
    tier: tierOf(step),
    seconds: step.rest.seconds,
    maxSeconds: step.rest.maxSeconds,
    hint: step.rest.hint,
  };
}

/* -------------------------------------------------------------------------- */
/* Costruzione del piano                                                       */
/* -------------------------------------------------------------------------- */

function workLabel(step: SessionStep, session: ProgramSession): string {
  const nome = getExercise(step.exercise).name;
  const totale = step.totalSets;
  const dentroUnGiro = session.blocks.filter((entry) => entry.group === step.group).length > 1;
  const quale = dentroUnGiro
    ? `giro ${String(step.setIndex)} di ${String(totale)}`
    : `serie ${String(step.setIndex)} di ${String(totale)}`;
  return `${nome} · ${quale}`;
}

/**
 * La sequenza completa della seduta.
 *
 * L'ordine è quello in cui la si esegue e non si decide più niente: i passi di
 * riscaldamento, le serie nell'ordine dei tri-set, i recuperi al posto giusto
 * con la durata giusta.
 */
export function buildGuidedPlan(
  session: ProgramSession,
  week: number,
  states: ReadonlyMap<ExerciseSlug, ExerciseState> = new Map(),
): GuidedStep[] {
  const steps: GuidedStep[] = [];
  let order = 0;

  const pushRest = (shape: RestShape, nextLabel: string): void => {
    order += 1;
    steps.push({
      kind: 'rest',
      id: `rest-${String(order)}`,
      order,
      tier: shape.tier,
      seconds: shape.seconds,
      maxSeconds: shape.maxSeconds,
      label: REST_TIER_LABELS[shape.tier],
      hint: shape.hint,
      nextLabel,
    });
  };

  const warmups = session.warmupSteps ?? [];
  const work = buildSessionPlan(session, week, states);

  warmups.forEach((warmup, index) => {
    order += 1;
    steps.push({
      kind: 'warmup',
      id: `warmup-${String(index)}`,
      order,
      label: warmup.label,
      exercise: warmup.exercise ?? null,
      reps: warmup.reps,
      perSide: warmup.perSide,
      hint: warmup.hint,
      workSeconds: warmupSeconds(warmup),
      timed: warmup.seconds !== null,
    });

    const prossimo = warmups[index + 1];
    if (prossimo !== undefined) {
      pushRest(
        {
          tier: 'transizione',
          seconds: WARMUP_TRANSITION_SEC,
          maxSeconds: WARMUP_TRANSITION_SEC,
          hint: 'Solo il tempo di spostarti.',
        },
        prossimo.label,
      );
      return;
    }

    const primaSerie = work[0];
    if (primaSerie !== undefined) {
      pushRest(
        {
          tier: 'blocco',
          seconds: WARMUP_TO_WORK_SEC,
          maxSeconds: WARMUP_TO_WORK_SEC,
          hint: 'Riscaldamento finito. Prepara la prima stazione mentre il conto scende.',
        },
        workLabel(primaSerie, session),
      );
    }
  });

  work.forEach((step, index) => {
    const block = session.blocks.find((entry) => entry.code === step.blockCode);
    order += 1;
    steps.push({
      kind: 'work',
      id: `work-${step.blockCode}-${String(step.setIndex)}`,
      order,
      step,
      blockCode: step.blockCode,
      group: step.group,
      exercise: step.exercise,
      exerciseName: getExercise(step.exercise).name,
      workSeconds: block === undefined ? 0 : minWorkSeconds({ ...block, perSide: step.perSide }),
    });

    const next = work[index + 1];
    if (next === undefined) return;
    const shape = restBetween(step, next, session);
    if (shape !== null) pushRest(shape, workLabel(next, session));
  });

  return steps;
}

/* -------------------------------------------------------------------------- */
/* Durata                                                                      */
/* -------------------------------------------------------------------------- */

/** Secondi di un passo, qualunque sia il suo tipo. */
export function stepSeconds(step: GuidedStep): number {
  return step.kind === 'rest' ? step.seconds : step.workSeconds;
}

/**
 * Durata stimata della seduta.
 *
 * È una somma, non una promessa: le serie a ripetizioni durano il minimo
 * prescritto dal TUT, e chi recupera più del dovuto sfora. Serve a verificare
 * che la scheda stia nei 40 minuti dichiarati, e un test lo verifica.
 */
export function estimatedSeconds(plan: readonly GuidedStep[]): number {
  return plan.reduce((total, step) => total + stepSeconds(step), 0);
}

/** Secondi trascorsi dall'inizio della seduta all'inizio di ciascun passo. */
export function clockOffsets(plan: readonly GuidedStep[]): number[] {
  const offsets: number[] = [];
  let acc = 0;
  for (const step of plan) {
    offsets.push(acc);
    acc += stepSeconds(step);
  }
  return offsets;
}

/** Quante serie di lavoro contiene il piano. Il riscaldamento non conta. */
export function workStepCount(plan: readonly GuidedStep[]): number {
  return plan.filter((step) => step.kind === 'work').length;
}
