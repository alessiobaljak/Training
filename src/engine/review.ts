import { getExercise } from '../data/exercises.ts';
import { getProgressionStep } from '../data/progressions.ts';
import { getSession } from '../data/program.ts';
import { effectiveBlock } from './draft.ts';
import { getLoadAvailability, stepLoad } from './loading.ts';
import { initialExerciseState } from './progression.ts';
import { formatRange, resolveBlockRange } from './ranges.ts';
import type { RangeUnit, WorkRange } from './ranges.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedSession,
  OverloadLever,
  TestId,
  TestResult,
} from '../types/index.ts';

/**
 * Revisione di fine settimana.
 *
 * Il motore delle leve guarda una seduta sola e propone alla fine di quella,
 * una volta: se non rispondi, o se chiudi l'app prima del riepilogo, la
 * proposta non torna più. Il risultato era una settimana 2 identica alla
 * settimana 1 anche dopo sette giorni passati sopra il massimo del range.
 *
 * Qui si guarda la settimana intera, a mente fredda, e si legge una cosa sola:
 * dove sono finiti i numeri scritti rispetto al range prescritto. Sopra il
 * massimo su ogni serie di ogni seduta vuol dire che il gradino non fa più
 * resistenza; sotto il minimo su ogni serie vuol dire che il gradino è troppo
 * alto, ed è la direzione che il motore delle leve non ha mai avuto.
 *
 * Niente si applica da solo: la revisione propone, la schermata fa decidere.
 */

export type WeeklyVerdictKind =
  /** Il gradino è troppo facile: si sale nella scala. */
  | 'sali-di-livello'
  /** Il gradino è troppo difficile: si scende. */
  | 'scendi-di-livello'
  /** Il gradino non c'entra: è il peso a doversi muovere. */
  | 'aggiungi-peso'
  /** Sei al gradino 1 e ancora sotto: non è la variante, è il range. */
  | 'range-da-rifare';

export interface WeeklyVerdict {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly kind: WeeklyVerdictKind;
  /** Con quale leva del metodo si registra la decisione. */
  readonly lever: OverloadLever;
  readonly title: string;
  /** I numeri su cui si regge, sempre citati per esteso. */
  readonly evidence: string;
  /** Cosa cambia accettando. */
  readonly change: string;
  /** Avvertenza da leggere prima di accettare. `null` quando non serve. */
  readonly caution: string | null;
  readonly stateBefore: ExerciseState;
  readonly stateAfter: ExerciseState;
}

export interface WeeklyReview {
  readonly week: number;
  readonly sessionsCounted: number;
  readonly setsCounted: number;
  readonly verdicts: readonly WeeklyVerdict[];
  /**
   * Esercizi su cui non c'è niente di abbastanza netto da cambiare: i numeri
   * sono dentro il range, o sparsi attorno. Una settimana con una serie sotto
   * e due sopra finisce qui, e deve finire qui: è la settimana normale di
   * chiunque, non un gradino sbagliato.
   */
  readonly inRange: readonly string[];
  /**
   * Massimo del range chiuso, ma senza una leva che la revisione possa tirare:
   * la variante non c'è o è finita, e il peso è ancora bloccato. La leva giusta
   * è il tempo, e quella si decide a fine seduta con il blocco sotto gli occhi,
   * perché lo stesso esercizio ha TUT diversi in giorni diversi.
   */
  readonly alMassimo: readonly string[];
}

export interface WeeklyReviewInput {
  readonly week: number;
  readonly sessions: readonly LoggedSession[];
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  readonly tests: ReadonlyMap<TestId, TestResult>;
}

/** Serie minime nella settimana perché il giudizio valga qualcosa. */
export const MIN_SETS_FOR_VERDICT = 3;

interface Osservazione {
  readonly values: number[];
  readonly range: WorkRange;
  readonly unit: RangeUnit;
  /** `false` appena una seduta dice che il tempo non era quello prescritto. */
  tempoConfermato: boolean;
  /** `true` se almeno una seduta ha lasciato la domanda senza risposta. */
  tempoNonRisposto: boolean;
}

function elenco(values: readonly number[], unit: RangeUnit): string {
  const testa = values.slice(0, 8).map((value) => String(value)).join(', ');
  const coda = values.length > 8 ? `, …` : '';
  return `${testa}${coda}${unit === 'seconds' ? '"' : ''}`;
}

function serie(quante: number): string {
  return quante === 1 ? '1 serie' : `${String(quante)} serie`;
}

export function reviewWeek(input: WeeklyReviewInput): WeeklyReview {
  const { week, sessions, states, tests } = input;

  const perEsercizio = new Map<ExerciseSlug, Osservazione>();
  const sedute = sessions.filter(
    (session) => session.week === week && session.status === 'completed',
  );
  let setsCounted = 0;

  for (const session of sedute) {
    const program = getSession(session.sessionId);
    for (const logged of session.exercises) {
      if (logged.sets.length === 0) continue;
      const declared = program.blocks.find((entry) => entry.code === logged.blockCode);
      if (declared === undefined) continue;

      const block = effectiveBlock(declared, session);
      if (block.exercise !== logged.exercise) continue;

      const exercise = getExercise(block.exercise);
      const range = resolveBlockRange(block, exercise, tests);
      /*
       * Senza range non c'è niente da confrontare: la corsa in zona 2 si
       * giudica dalla frequenza cardiaca, un blocco a cedimento dal fatto che
       * sia arrivato a cedimento. Non sono sedute mal fatte, sono sedute che
       * questa revisione non ha titolo per giudicare.
       */
      if (range.kind !== 'range' || range.range.max <= 0) continue;

      const corrente = perEsercizio.get(block.exercise) ?? {
        values: [],
        range: range.range,
        unit: range.unit,
        tempoConfermato: true,
        tempoNonRisposto: false,
      };
      for (const set of logged.sets) corrente.values.push(set.value);
      setsCounted += logged.sets.length;
      if (logged.tempoRespected === false) corrente.tempoConfermato = false;
      if (logged.tempoRespected === null) corrente.tempoNonRisposto = true;
      perEsercizio.set(block.exercise, corrente);
    }
  }

  const verdicts: WeeklyVerdict[] = [];
  const inRange: string[] = [];
  const alMassimoSenzaLeva: string[] = [];

  for (const [slug, osservazione] of perEsercizio) {
    const exercise = getExercise(slug);
    const { values, range, unit } = osservazione;
    if (values.length < MIN_SETS_FOR_VERDICT) continue;

    const before = states.get(slug) ?? initialExerciseState(exercise);
    const sopra = values.filter((value) => value > range.max).length;
    const alMassimo = values.filter((value) => value >= range.max).length;
    const sotto = values.filter((value) => value < range.min).length;
    const numeri = `Settimana ${String(week)}: ${elenco(values, unit)} su un range di ${formatRange(range, unit)}.`;

    const cautelaTempo = osservazione.tempoNonRisposto
      ? 'Non hai risposto sul tempo prescritto: se stavi andando più veloce di quanto chiede la scheda, queste ripetizioni valgono meno di quello che sembrano.'
      : osservazione.tempoConfermato
        ? null
        : 'Il tempo prescritto non è stato rispettato su tutte le serie: prima di salire, rifai la settimana al tempo giusto.';

    /* 1. Troppo difficile. È la direzione che mancava del tutto. */
    if (sotto === values.length) {
      if (exercise.pattern !== null && before.level !== null && before.level > 1) {
        const giu = (before.level - 1) as LevelIndex;
        const step = getProgressionStep(exercise.pattern, giu);
        verdicts.push({
          exercise: slug,
          exerciseName: exercise.name,
          kind: 'scendi-di-livello',
          lever: 'variant',
          title: `Scendi al livello ${String(giu)}: ${step.name}`,
          evidence: `${numeri} Sotto il minimo su ${serie(sotto)} su ${String(values.length)}: il gradino è più alto di quello che regge.`,
          change: `Livello ${String(before.level)} → ${String(giu)}. Tempo e pause tornano a quelli della scheda.`,
          caution:
            'Scendere di gradino non è un passo indietro: è l’unico modo di fare le ripetizioni che il programma chiede, invece di tre mezze ripetizioni a serie.',
          stateBefore: before,
          stateAfter: { ...before, level: giu, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 },
        });
        continue;
      }
      verdicts.push({
        exercise: slug,
        exerciseName: exercise.name,
        kind: 'range-da-rifare',
        lever: 'reps',
        title: `${exercise.name}: il range è più alto di te`,
        evidence: `${numeri} Sotto il minimo su tutte le serie, e sei già al gradino più basso della scala.`,
        change: 'Niente da cambiare in automatico: il range viene dal test, e va rifatto quello.',
        caution: 'Un test gonfiato sbaglia il range per sei settimane. Rifallo a riposo, con il tempo prescritto.',
        stateBefore: before,
        stateAfter: before,
      });
      continue;
    }

    /* 2. Troppo facile: il gradino non fa più resistenza. */
    if (sopra === values.length) {
      if (exercise.pattern !== null && before.level !== null && before.level < 6) {
        const su = (before.level + 1) as LevelIndex;
        const step = getProgressionStep(exercise.pattern, su);
        verdicts.push({
          exercise: slug,
          exerciseName: exercise.name,
          kind: 'sali-di-livello',
          lever: 'variant',
          title: `Sali al livello ${String(su)}: ${step.name}`,
          evidence: `${numeri} Sopra il massimo su tutte e ${String(values.length)} le serie della settimana.`,
          change: `Livello ${String(before.level)} → ${String(su)}. Si riparte dal minimo del range, al tempo della scheda.`,
          caution:
            cautelaTempo ??
            'Aspettati di perdere il 30-40% delle ripetizioni. È normale e corretto: è il segno che il carico è aumentato davvero.',
          stateBefore: before,
          stateAfter: { ...before, level: su, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 },
        });
        continue;
      }
    }

    /*
     * 3. Il peso.
     *
     * Sui manubri la progressione è il peso, non una scala di varianti
     * inventata: chiuso il massimo del range su tutte le serie, si sale di
     * manubrio. Sulla zavorra vale lo stesso, ma solo quando la settimana la
     * sblocca.
     */
    if (alMassimo === values.length) {
      /*
       * La settimana che conta è quella in cui si applicherà, non quella
       * appena chiusa: la revisione della settimana 2 vale per la 3, ed è la 3
       * che sblocca la zavorra.
       */
      const disponibile = getLoadAvailability(exercise, week + 1);
      if (disponibile.allowed) {
        const next = stepLoad(before.loadKg, 1);
        const inerente = exercise.loadPolicy === 'inherent';
        verdicts.push({
          exercise: slug,
          exerciseName: exercise.name,
          kind: 'aggiungi-peso',
          lever: 'load',
          title: inerente
            ? `${exercise.name}: passa al manubrio successivo`
            : `${exercise.name}: aggiungi zavorra`,
          evidence: `${numeri} Massimo del range chiuso su tutte le serie.`,
          change: `Da ${String(before.loadKg)} kg a ${String(next)} kg. Se il salto in palestra è diverso, scrivi i kg veri nel player: da lì in poi comanda quello che scrivi.`,
          caution: cautelaTempo,
          stateBefore: before,
          stateAfter: { ...before, loadKg: next },
        });
        continue;
      }
      alMassimoSenzaLeva.push(exercise.name);
      continue;
    }

    inRange.push(exercise.name);
  }

  return {
    week,
    sessionsCounted: sedute.length,
    setsCounted,
    verdicts,
    inRange,
    alMassimo: alMassimoSenzaLeva,
  };
}

/* -------------------------------------------------------------------------- */
/* Decisioni già prese                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Chiave della decisione su un verdetto, uguale in scrittura e in lettura.
 *
 * Una decisione per esercizio e per settimana: la revisione della settimana 1
 * si decide una volta sola, ma quella della settimana 2 torna a chiedere,
 * perché sono numeri nuovi.
 */
export function reviewDecisionId(week: number, exercise: ExerciseSlug): string {
  return `revisione-${String(week)}:${exercise}`;
}

/** I verdetti su cui non si è ancora deciso niente. */
export function pendingVerdicts(
  review: WeeklyReview,
  decided: ReadonlySet<string>,
): WeeklyVerdict[] {
  return review.verdicts.filter(
    (verdict) => !decided.has(reviewDecisionId(review.week, verdict.exercise)),
  );
}
