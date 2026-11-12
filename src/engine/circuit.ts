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
export function minWorkSeconds(
  block: ProgramBlock,
  exercise: Exercise = getExercise(block.exercise),
  /**
   * Se la serie si esegue davvero un lato per volta.
   *
   * Di norma lo dice il blocco, ma non sempre: `blockPerSide` legge il
   * gradino, e la scala `hip-thrust` è `[false, false, true, true, true,
   * true]`. Chi sale al gradino 3 fa un esercizio unilaterale dentro un
   * blocco che si dichiara bilaterale, e la stazione dura il doppio.
   *
   * Arriva come argomento suo e non sovrascrivendo `block.perSide`, perché
   * servono tutti e due: quello del blocco dice rispetto a cosa è scritto il
   * `workSeconds` della scheda, questo dice cosa si sta facendo adesso.
   * Sovrascrivendolo si perdeva il primo, e il confronto non si poteva fare.
   */
  perSideEseguito: boolean = block.perSide,
): number {
  const raddoppia = (value: number): number => (perSideEseguito ? value * 2 : value);

  /*
   * Un `workSeconds` dichiarato e' il tempo dell'intera stazione, lati
   * compresi, e non si raddoppia.
   *
   * La colonna «lavoro» della scheda conta cosi': il bulgaro 8-10 per gamba
   * sta scritto «~100"», che sono i cinquanta secondi di una gamba piu' i
   * cinquanta dell'altra. Raddoppiandolo il player chiedeva 200 secondi di
   * countdown per una stazione da cento, e l'orologio della seduta sforava di
   * otto minuti su quaranta. Dove invece il tempo arriva dalla prescrizione
   * (30-40" per lato) il raddoppio e' giusto, ed e' rimasto sotto.
   */
  if (block.workSeconds !== undefined) {
    /*
     * Il numero della scheda vale per il gradino che la scheda prescrive. Se
     * il gradino eseguito ha cambiato lateralità, la stazione dura il doppio
     * o la metà: l'hip thrust al gradino 3 è monopodalico e vuole 170
     * secondi, non gli 85 scritti per quello a due gambe.
     */
    if (perSideEseguito === block.perSide) return block.workSeconds;
    return perSideEseguito ? block.workSeconds * 2 : Math.round(block.workSeconds / 2);
  }

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

/**
 * Una stazione a tempo fisso che la revisione non legge: si chiude da sola.
 *
 * Le due condizioni servono tutte e due. Il tempo fisso (minimo uguale al
 * massimo) vuol dire che non c'e' niente da misurare; l'esclusione dalla
 * revisione vuol dire che nessuna regola aspetta quel numero. L'hollow hold da
 * 30-45 secondi ha un range e viene giudicato: quello resta a mano.
 */
export function isAutoComplete(block: ProgramBlock): boolean {
  const prescription = block.prescription;
  return (
    block.excludeFromReview === true &&
    prescription.kind === 'seconds' &&
    prescription.min === prescription.max
  );
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
  /**
   * Durata del passo. Finita, si va avanti da soli.
   *
   * Prima i passi a ripetizioni ne avevano una stimata e **non** avanzavano:
   * il conto arrivava a zero, scriveva «Fatto» in verde e lì restava. Adesso
   * la durata è prescritta dalla scheda e lo zero vuol dire una cosa sola.
   */
  readonly workSeconds: number;
  /** Il passo fa parte di un giro di prova di un blocco. */
  readonly inRamp: boolean;
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
  /**
   * La stazione si chiude da sola allo scadere del tempo, senza chiedere niente.
   *
   * Vale per le stazioni a tempo fisso che la revisione non legge: i trenta
   * secondi di corda della finitura e le posizioni della decompressione. Lì
   * «quanti ne hai fatti» ha una risposta sola — trenta, sempre — e chiederla
   * con le mani sudate a fine seduta voleva dire undici tocchi per scrivere
   * undici volte il numero che la scheda aveva gia' deciso. Alla domanda
   * «hai tenuto il tempo» su una respirazione da supino non c'era risposta
   * sensata.
   */
  readonly autoComplete: boolean;
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
  /** Cosa la scheda chiede di fare dentro questa pausa. `null` quasi sempre. */
  readonly task: string | null;
}

export type GuidedStep = GuidedWarmupStep | GuidedWorkStep | GuidedRestStep;

/* -------------------------------------------------------------------------- */
/* Costanti del riscaldamento                                                  */
/* -------------------------------------------------------------------------- */

/** Tra un passo di riscaldamento e il successivo: solo il tempo di spostarsi. */
export const WARMUP_TRANSITION_SEC = 10;

/**
 * Dopo l'ultimo passo di riscaldamento, prima della prima serie vera.
 *
 * Trenta e non quaranta da quando il riscaldamento finisce con il giro di
 * prova: quel giro *è* il ponte verso il lavoro, e una pausa lunga dopo
 * averlo fatto disfa quello che è appena servito a costruire.
 */
export const WARMUP_TO_WORK_SEC = 30;

/**
 * Durata minima di un passo del giro di prova.
 *
 * Tre ripetizioni a metà carico durano dodici secondi e sono finite prima che
 * tu abbia finito di leggere cosa fare. Il minimo serve a quello.
 */
export const RAMP_MIN_SEC = 15;

/**
 * Durata massima di un passo del giro di prova.
 *
 * Senza un tetto una stazione unilaterale lenta si prende mezzo minuto di
 * riscaldamento da sola, e il giro di prova comincia a somigliare a un giro
 * vero — che è esattamente quello che non deve essere.
 */
export const RAMP_MAX_SEC = 25;

/* -------------------------------------------------------------------------- */
/* Espansione del riscaldamento                                                */
/* -------------------------------------------------------------------------- */

interface PassoRiscaldamento {
  readonly label: string;
  readonly exercise: ExerciseSlug | null;
  readonly seconds: number;
  readonly reps: number | null;
  readonly perSide: boolean;
  readonly hint: string;
  /**
   * Il passo fa parte di un giro di prova.
   *
   * Dentro un giro non c'è transizione: è un giro, non una lista di cose da
   * fare con una pausa in mezzo.
   */
  readonly inRamp: boolean;
}

/** Metà delle ripetizioni minime, mai meno di due. */
function mezzeRipetizioni(block: ProgramBlock): number | null {
  const prescription = block.prescription;
  if (prescription.kind !== 'reps') return null;
  return Math.max(2, Math.ceil(prescription.min / 2));
}

/**
 * Il riscaldamento, con i giri di prova aperti.
 *
 * Un passo con `rampGroup` diventa un passo per ogni esercizio di quel blocco,
 * con il suo nome e la sua figura. Scritto come riga unica — «un giro del
 * Tri-set A a metà carico» — chiedeva tre esercizi senza nominarne nessuno.
 */
function expandWarmup(
  session: ProgramSession,
  warmups: readonly WarmupStep[],
): PassoRiscaldamento[] {
  return warmups.flatMap((warmup): PassoRiscaldamento[] => {
    if (warmup.rampGroup === undefined) {
      return [
        {
          label: warmup.label,
          exercise: warmup.exercise ?? null,
          seconds: warmup.seconds,
          reps: warmup.reps,
          perSide: warmup.perSide,
          hint: warmup.hint,
          inRamp: false,
        },
      ];
    }

    const blocchi = session.blocks.filter((block) => block.group === warmup.rampGroup);
    return blocchi.map((block): PassoRiscaldamento => {
      const esercizio = getExercise(block.exercise);
      const ripetizioni = mezzeRipetizioni(block);
      const perRipetizione = repDurationSeconds(parseTut(block.tut)) ?? 0;
      const stimato =
        ripetizioni === null ? 0 : ripetizioni * perRipetizione * (block.perSide ? 2 : 1);
      return {
        label: esercizio.name,
        exercise: block.exercise,
        seconds: Math.min(RAMP_MAX_SEC, Math.max(RAMP_MIN_SEC, Math.round(stimato))),
        reps: ripetizioni,
        perSide: block.perSide,
        hint: warmup.hint,
        inRamp: true,
      };
    });
  });
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
  readonly task?: string;
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
    const task = session.pauseTasks?.[step.group];
    return {
      tier: 'blocco',
      seconds,
      maxSeconds: seconds,
      hint: `${groupLabel(session, step.group)} finito, ora ${groupLabel(session, next.group)}. Riparte da fermo su muscoli nuovi: questa pausa serve tutta.`,
      ...(task === undefined ? {} : { task }),
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

/**
 * Come si chiama un gruppo di blocchi.
 *
 * Stava solo nella scheda, e il player non lo diceva: dopo nove serie di
 * Tri-set A compariva il pull-over al TRX senza che niente avesse annunciato
 * che il primo blocco era finito e ne cominciava un altro. A dieci minuti
 * dall'inizio, un esercizio che non ti aspetti sembra un'app che ti ha
 * cambiato la scheda.
 */
export function groupLabel(session: ProgramSession, group: string): string {
  const quanti = session.blocks.filter((block) => block.group === group).length;
  if (group === 'F') return 'Finitura metabolica';
  if (group === 'Z') return 'Decompressione';
  if (quanti >= 3) return `Tri-set ${group}`;
  if (quanti === 2) return `Coppia ${group}`;
  return `Blocco ${group}`;
}

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
      task: shape.task ?? null,
    });
  };

  const warmups = expandWarmup(session, session.warmupSteps ?? []);
  const work = buildSessionPlan(session, week, states);

  warmups.forEach((warmup, index) => {
    order += 1;
    steps.push({
      kind: 'warmup',
      id: `warmup-${String(index)}`,
      order,
      label: warmup.label,
      exercise: warmup.exercise,
      reps: warmup.reps,
      perSide: warmup.perSide,
      hint: warmup.hint,
      workSeconds: warmup.seconds,
      inRamp: warmup.inRamp,
    });

    const prossimo = warmups[index + 1];
    if (prossimo !== undefined) {
      /* Dentro un giro di prova non si recupera: è un giro. */
      if (!(warmup.inRamp && prossimo.inRamp)) {
        pushRest(
          {
            tier: 'transizione',
            seconds: WARMUP_TRANSITION_SEC,
            maxSeconds: WARMUP_TRANSITION_SEC,
            hint: 'Solo il tempo di spostarti.',
          },
          prossimo.label,
        );
      }
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
      workSeconds: block === undefined ? 0 : minWorkSeconds(block, undefined, step.perSide),
      autoComplete: block !== undefined && isAutoComplete(block),
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
