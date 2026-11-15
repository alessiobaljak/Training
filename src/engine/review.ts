import { getExercise } from '../data/exercises.ts';
import { getLoadThreshold } from '../data/method.ts';
import { adjacentLevel, getProgressionStep } from '../data/progressions.ts';
import { getAnySession } from '../data/sessions.ts';
import { getTest, testBaseline } from '../data/tests.ts';
import { addDays, formatDayLong } from './dates.ts';
import { effectiveBlock } from './draft.ts';
import { assessLoadNeed, getLoadAvailability, stepLoad } from './loading.ts';
import {
  initialExerciseState,
  isFixedRange,
  isScarico,
  motivoBlocco,
  righeVere,
  salitaConsentita,
  serieVere,
  testoSalitaInAttesa,
  varianteEsaurita,
} from './progression.ts';
import { formatRange, resolveBlockRange } from './ranges.ts';
import type { RangeUnit, WorkRange } from './ranges.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
  OverloadLever,
  ProgramBlock,
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
  | 'range-da-rifare'
  /** Massimo chiuso con un «no» sul tempo: si rifà al tempo giusto (R5). */
  | 'rifai-al-tempo-giusto'
  /** Massimo chiuso senza risposta sul tempo: niente sale (R5). */
  | 'rispondi-sul-tempo';

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

/** In corso fino a `fine(W)`, decidibile per i sette giorni dopo, poi scaduta (R8). */
export type StatoRevisione = 'in-corso' | 'aperta' | 'scaduta';

/** Esercizio senza abbastanza numeri allo stato attuale (R8). */
export interface PocaProva {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  /** Sedute utili: 0, 1 o 2. */
  readonly sedute: number;
  /** Serie vere nelle sedute utili. */
  readonly serie: number;
  readonly level: LevelIndex | null;
  /** Il carico dello stato, quando l'esercizio ne ha uno. */
  readonly loadKg: number | null;
}

/** Esercizio rifatto dopo la fine della settimana: lo giudica la revisione dopo. */
export interface Rimandato {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly date: string;
}

/** Massimo chiuso, ma nessun aumento si applica (R5 E4, E5). */
export interface Fermo {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly motivo: 'scarico' | 'scarico-coppia' | 'rientro';
  readonly testo: string;
}

/** Salita pronta ma non ancora consentita (R7). */
export interface InAttesa {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly level: LevelIndex;
  readonly inizio: string | null;
  readonly dal: string | null;
  readonly testo: string;
}

export type MotivoAlMassimo = 'tempo' | 'settimana' | 'soglia' | 'nessun-test' | 'leve-finite';

/** Massimo chiuso senza una leva che la revisione possa tirare (R6). */
export interface AlMassimo {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly motivo: MotivoAlMassimo;
  readonly testo: string;
}

export interface WeeklyReview {
  readonly week: number;
  readonly stato: StatoRevisione;
  /** I 14 giorni letti: le settimane W−1 e W. */
  readonly finestra: { readonly dal: string; readonly al: string };
  /** Sedute chiuse con `week === W`. */
  readonly sessionsCounted: number;
  /** Serie vere delle sedute utili di chi compare, mai righe. */
  readonly setsCounted: number;
  readonly verdicts: readonly WeeklyVerdict[];
  /**
   * Esercizi su cui non c'è niente di abbastanza netto da cambiare: i numeri
   * sono dentro il range, o sparsi attorno. Una settimana con una serie sotto
   * e due sopra finisce qui, e deve finire qui: è la settimana normale di
   * chiunque, non un gradino sbagliato.
   */
  readonly inRange: readonly string[];
  readonly alMassimo: readonly AlMassimo[];
  readonly pocheProve: readonly PocaProva[];
  readonly rimandati: readonly Rimandato[];
  readonly fermi: readonly Fermo[];
  readonly inAttesa: readonly InAttesa[];
}

export interface WeeklyReviewInput {
  readonly week: number;
  readonly sessions: readonly LoggedSession[];
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  readonly tests: ReadonlyMap<TestId, TestResult>;
  /** `fine(W)`: la domenica che chiude la settimana W (`weekEndDate`). */
  readonly weekEnd: string;
  /** Oggi: decide lo stato della revisione e R7. */
  readonly today: string;
}

/** Serie vere minime, sommate sulle due sedute, perché un giudizio valga (S4). */
export const MIN_SETS_FOR_VERDICT = 3;
/** Sedute minime per un giudizio (S4). */
export const MIN_SESSIONS_FOR_VERDICT = 2;
/** Giorni della finestra di R8, estremi compresi. */
const GIORNI_FINESTRA = 14;

/** Una voce che la revisione può leggere, con il blocco e il range effettivi. */
interface VoceStrutturale {
  readonly voce: LoggedExercise;
  readonly block: ProgramBlock;
  readonly range: WorkRange;
  readonly unit: RangeUnit;
}

function elenco(values: readonly number[], unit: RangeUnit): string {
  const testa = values.slice(0, 8).map((value) => String(value)).join('-');
  const coda = values.length > 8 ? `-…` : '';
  return `${testa}${coda}${unit === 'seconds' ? '"' : ''}`;
}

function serie(quante: number): string {
  return quante === 1 ? '1 serie' : `${String(quante)} serie`;
}

function perData(a: LoggedSession, b: LoggedSession): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Le voci di una seduta che la revisione ha titolo per leggere.
 *
 * Fuori la finitura e la decompressione (`excludeFromReview`), i blocchi
 * senza range, le voci vuote e quelle registrate su un esercizio diverso da
 * quello del blocco effettivo.
 */
function vociStrutturali(
  session: LoggedSession,
  tests: ReadonlyMap<TestId, TestResult>,
): Map<ExerciseSlug, VoceStrutturale[]> {
  const out = new Map<ExerciseSlug, VoceStrutturale[]>();
  const program = getAnySession(session.sessionId);
  for (const logged of session.exercises) {
    if (logged.sets.length === 0) continue;
    const declared = program.blocks.find((entry) => entry.code === logged.blockCode);
    if (declared === undefined) continue;
    const block = effectiveBlock(declared, session);
    if (block.exercise !== logged.exercise) continue;
    /*
     * La finitura metabolica non si giudica: sono numeri che dipendono da
     * quanto era dura la seduta fin lì, non dal gradino. Senza questa riga
     * venti swing su tutte le serie producevano +2,5 kg su un balistico.
     */
    if (block.excludeFromReview === true) continue;
    const range = resolveBlockRange(block, getExercise(block.exercise), tests);
    if (range.kind !== 'range' || range.range.max <= 0) continue;
    const lista = out.get(block.exercise) ?? [];
    lista.push({ voce: logged, block, range: range.range, unit: range.unit });
    out.set(block.exercise, lista);
  }
  return out;
}

function caricoMassimo(voce: LoggedExercise): number {
  return voce.sets.reduce((max, set) => Math.max(max, set.loadKg), 0);
}

/**
 * R8: la revisione della settimana W.
 *
 * Prima si leggeva la settimana di calendario, e bastava una seduta: due
 * serie per lato di un giorno solo facevano «4 serie» e un verdetto. Adesso
 * per ogni esercizio allenato in W si leggono le sue **ultime due sedute
 * chiuse**, se sono allo stato attuale (gradino e carico), cadono entrambe nei
 * 14 giorni fino alla fine di W e hanno almeno tre serie vere in tutto. Sul
 * circuito, dove ogni esercizio sta in una seduta sola, la coppia è di norma
 * (W−1, W): la settimana di calendario alla lettera lasciava la revisione muta.
 *
 * Poi le regole uguali a fine seduta: R5 (tempo, scarico), R7 (un gradino
 * ogni due settimane), R6 (prima la variante, poi il carico).
 */
export function reviewWeek(input: WeeklyReviewInput): WeeklyReview {
  const { week, sessions, states, tests, weekEnd, today } = input;
  const finestra = { dal: addDays(weekEnd, -(GIORNI_FINESTRA - 1)), al: weekEnd };
  const stato: StatoRevisione =
    today <= weekEnd ? 'in-corso' : today <= addDays(weekEnd, 7) ? 'aperta' : 'scaduta';

  const chiuse = sessions.filter((session) => session.status === 'completed').sort(perData);
  const dellaSettimana = chiuse.filter((session) => session.week === week);

  const vuota: WeeklyReview = {
    week,
    stato,
    finestra,
    sessionsCounted: dellaSettimana.length,
    setsCounted: 0,
    verdicts: [],
    inRange: [],
    alMassimo: [],
    pocheProve: [],
    rimandati: [],
    fermi: [],
    inAttesa: [],
  };
  /* Solo una revisione aperta giudica: prima di fine(W) mancano numeri, dopo sono vecchi. */
  if (stato !== 'aperta') return vuota;

  const voci = new Map<string, Map<ExerciseSlug, VoceStrutturale[]>>(
    chiuse.map((session) => [session.id, vociStrutturali(session, tests)]),
  );
  const vociDi = (session: LoggedSession, slug: ExerciseSlug): readonly VoceStrutturale[] =>
    voci.get(session.id)?.get(slug) ?? [];

  /* Chi compare: gli esercizi allenati in W, nell'ordine in cui sono stati fatti. */
  const compaiono: ExerciseSlug[] = [];
  for (const session of dellaSettimana) {
    for (const slug of voci.get(session.id)?.keys() ?? []) {
      if (!compaiono.includes(slug)) compaiono.push(slug);
    }
  }

  const verdicts: WeeklyVerdict[] = [];
  const inRange: string[] = [];
  const alMassimo: AlMassimo[] = [];
  const pocheProve: PocaProva[] = [];
  const rimandati: Rimandato[] = [];
  const fermi: Fermo[] = [];
  const inAttesa: InAttesa[] = [];
  let setsCounted = 0;

  for (const slug of compaiono) {
    const exercise = getExercise(slug);
    const before = states.get(slug) ?? initialExerciseState(exercise, tests);
    const seduteE = chiuse.filter((session) => vociDi(session, slug).length > 0);

    /* Rifatto dopo la fine di W: la coppia non è più l'ultima. */
    const dopo = seduteE.find((session) => session.date > weekEnd && session.date <= today);
    if (dopo !== undefined) {
      rimandati.push({ exercise: slug, exerciseName: exercise.name, date: dopo.date });
      continue;
    }

    const alloStato = (session: LoggedSession): boolean =>
      vociDi(session, slug).every(
        ({ voce }) =>
          (exercise.pattern === null || voce.level === before.level) &&
          (exercise.loadPolicy === 'forbidden' || caricoMassimo(voce) === before.loadKg),
      );
    const inFinestra = (session: LoggedSession): boolean =>
      session.date >= finestra.dal && session.date <= finestra.al;
    const stessoRange = (x: LoggedSession, y: LoggedSession): boolean => {
      const rx = vociDi(x, slug)[0];
      const ry = vociDi(y, slug)[0];
      return (
        rx !== undefined &&
        ry !== undefined &&
        rx.unit === ry.unit &&
        rx.range.min === ry.range.min &&
        rx.range.max === ry.range.max
      );
    };

    /* Le ultime due, non le ultime due buone: una più vecchia non prende il posto. */
    const ultime = seduteE.filter((session) => session.date <= weekEnd).slice(-MIN_SESSIONS_FOR_VERDICT);
    const a = ultime.at(-1);
    const b = ultime.length === 2 ? ultime[0] : undefined;
    const utili: LoggedSession[] = [];
    if (a !== undefined && alloStato(a) && inFinestra(a)) {
      if (b !== undefined && alloStato(b) && inFinestra(b) && stessoRange(a, b)) utili.push(b);
      utili.push(a);
    }

    const vociUtili = utili.flatMap((session) => vociDi(session, slug));
    const serieTotali = vociUtili.reduce((somma, { voce }) => somma + serieVere(voce.sets).length, 0);
    setsCounted += serieTotali;

    const caricoStato = exercise.loadPolicy === 'forbidden' ? null : before.loadKg;
    if (utili.length < MIN_SESSIONS_FOR_VERDICT || serieTotali < MIN_SETS_FOR_VERDICT) {
      pocheProve.push({
        exercise: slug,
        exerciseName: exercise.name,
        sedute: utili.length,
        serie: serieTotali,
        level: before.level,
        loadKg: caricoStato,
      });
      continue;
    }

    const ultima = utili[utili.length - 1];
    const riferimento = ultima === undefined ? undefined : vociDi(ultima, slug)[0];
    if (riferimento === undefined) continue;
    const { range, unit } = riferimento;
    const rangeFisso = isFixedRange(riferimento.block);
    const values = vociUtili.flatMap(({ voce }) => righeVere(voce.sets).map((set) => set.value));

    const valoriDi = (session: LoggedSession): string =>
      elenco(
        vociDi(session, slug).flatMap(({ voce }) => righeVere(voce.sets).map((set) => set.value)),
        unit,
      );
    const livelloTesto =
      exercise.pattern === null || before.level === null
        ? ''
        : ` al livello ${String(before.level)}`;
    const kg = caricoStato !== null && caricoStato > 0 ? `, ${String(caricoStato)} kg` : '';
    const numeri = `Ultime due sedute${livelloTesto}${kg}: ${utili
      .map((session) => `${formatDayLong(session.date)} ${valoriDi(session)}`)
      .join(' · ')}, su un range di ${formatRange(range, unit)}.`;

    const sopra = values.filter((value) => value > range.max).length;
    const almeno = values.filter((value) => value >= range.max).length;
    const sotto = values.filter((value) => value < range.min).length;

    const giu =
      exercise.pattern === null || before.level === null
        ? null
        : adjacentLevel(exercise.pattern, before.level, -1, rangeFisso);
    const su =
      exercise.pattern === null || before.level === null
        ? null
        : adjacentLevel(exercise.pattern, before.level, 1, rangeFisso);

    /* 1. Troppo difficile. La discesa non passa dal cancello di R5. */
    if (sotto === values.length) {
      if (exercise.pattern !== null && before.level !== null && giu !== null) {
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

    if (almeno !== values.length) {
      inRange.push(exercise.name);
      continue;
    }

    /* 2. Massimo chiuso su ogni serie (E1): il cancello di R5. */
    const seduteScarico = utili.filter((session) => isScarico(session.week));
    const motivo = motivoBlocco({
      tempo: vociUtili.map(({ voce }) => voce.tempoRespected),
      serieVere: serieTotali,
      scarico: isScarico(week + 1) || seduteScarico.length > 0,
      rientro: false,
    });

    if (motivo === 'scarico') {
      const tutta = isScarico(week + 1) || seduteScarico.length === utili.length;
      fermi.push({
        exercise: slug,
        exerciseName: exercise.name,
        motivo: tutta ? 'scarico' : 'scarico-coppia',
        testo: tutta
          ? 'Settimana di scarico: niente aumenti, anche con il massimo chiuso. Si riprende dopo lo scarico.'
          : `Una delle due sedute lette è di scarico (${formatDayLong(seduteScarico[0]?.date ?? weekEnd)}): niente aumenti da quei numeri. Si riprende con due sedute piene.`,
      });
      continue;
    }
    if (motivo === 'rientro') {
      fermi.push({
        exercise: slug,
        exerciseName: exercise.name,
        motivo: 'rientro',
        testo: 'Sedute di rientro dopo la pausa: niente aumenti finché non torni al volume pieno.',
      });
      continue;
    }
    if (motivo === 'tempo-no' || motivo === 'tempo-null') {
      const giorni = utili
        .filter((session) =>
          vociDi(session, slug).some(({ voce }) =>
            motivo === 'tempo-no' ? voce.tempoRespected === false : voce.tempoRespected === null,
          ),
        )
        .map((session) => formatDayLong(session.date))
        .join(' e ');
      verdicts.push(
        motivo === 'tempo-no'
          ? {
              exercise: slug,
              exerciseName: exercise.name,
              kind: 'rifai-al-tempo-giusto',
              lever: 'reps',
              title: `${exercise.name}: rifai al tempo giusto`,
              evidence: `${numeri} Tempo non rispettato ${giorni}.`,
              change:
                'Niente cambia: stesso gradino, stesso peso. Si sale quando chiudi il massimo al tempo della scheda, con un sì sul tempo nelle ultime due sedute.',
              caution: null,
              stateBefore: before,
              stateAfter: before,
            }
          : {
              exercise: slug,
              exerciseName: exercise.name,
              kind: 'rispondi-sul-tempo',
              lever: 'reps',
              title: `${exercise.name}: manca la risposta sul tempo`,
              evidence: `${numeri} Nessuna risposta sul tempo ${giorni}.`,
              change:
                'Niente cambia. Senza un sì sul tempo in tutte e due le sedute la salita non si propone: a fine seduta rispondi alla domanda sul tempo prescritto.',
              caution: null,
              stateBefore: before,
              stateAfter: before,
            },
      );
      continue;
    }

    /* 3. Troppo facile: si sale, ma un gradino ogni due settimane (R7). */
    if (sopra === values.length && exercise.pattern !== null && before.level !== null && su !== null) {
      const salita = salitaConsentita(slug, before.level, sessions, today);
      if (!salita.consentita) {
        inAttesa.push({
          exercise: slug,
          exerciseName: exercise.name,
          level: before.level,
          inizio: salita.inizio,
          dal: salita.dal,
          testo: `${exercise.name}: sopra il massimo su tutte le serie. ${testoSalitaInAttesa(before.level, salita)}`,
        });
        continue;
      }
      const step = getProgressionStep(exercise.pattern, su);
      verdicts.push({
        exercise: slug,
        exerciseName: exercise.name,
        kind: 'sali-di-livello',
        lever: 'variant',
        title: `Sali al livello ${String(su)}: ${step.name}`,
        evidence: `${numeri} Sopra il massimo su tutte e ${String(values.length)} le serie.`,
        change: `Livello ${String(before.level)} → ${String(su)}. Si riparte dal minimo del range, al tempo della scheda.`,
        caution:
          'Aspettati di perdere il 30-40% delle ripetizioni. È normale e corretto: è il segno che il carico è aumentato davvero.',
        stateBefore: before,
        stateAfter: { ...before, level: su, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 },
      });
      continue;
    }

    /* 4. Il carico: solo con la variante finita (R6). */
    const fuoriLeva = (motivoAl: MotivoAlMassimo, testo: string): void => {
      alMassimo.push({ exercise: slug, exerciseName: exercise.name, motivo: motivoAl, testo });
    };
    if (!varianteEsaurita(exercise, before, riferimento.block)) {
      fuoriLeva('tempo', 'Massimo chiuso ma non superato: la prossima leva è il tempo, e si decide a fine seduta.');
      continue;
    }
    if (exercise.loadPolicy === 'forbidden') {
      fuoriLeva(
        'leve-finite',
        'Hai esaurito le leve su questo esercizio: serve un cambio di programmazione, non un altro giro.',
      );
      continue;
    }
    /*
     * La settimana che conta è quella in cui si applicherà: la revisione
     * della settimana 2 vale per la 3, ed è la 3 che sblocca la zavorra.
     */
    const disponibile = getLoadAvailability(exercise, week + 1);
    if (!disponibile.allowed) {
      fuoriLeva('settimana', disponibile.explanation ?? 'Il carico non si aumenta ancora.');
      continue;
    }
    if (getLoadThreshold(exercise.pattern) !== null) {
      const baseline = exercise.pattern === null ? null : testBaseline(exercise.pattern);
      const massimale = baseline === null ? undefined : tests.get(baseline.testId)?.value;
      if (massimale === undefined || baseline === null) {
        fuoriLeva(
          'nessun-test',
          `Per proporre la zavorra serve un test di ${baseline === null ? 'massimale' : getTest(baseline.testId).label} registrato.`,
        );
        continue;
      }
      const need = assessLoadNeed(exercise, massimale);
      if (need.need === 'discouraged') {
        fuoriLeva('soglia', `${need.message ?? ''} Ultimo test: ${String(massimale)}.`.trim());
        continue;
      }
    }
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
      caution: null,
      stateBefore: before,
      stateAfter: { ...before, loadKg: next },
    });
  }

  return {
    ...vuota,
    setsCounted,
    verdicts,
    inRange,
    alMassimo,
    pocheProve,
    rimandati,
    fermi,
    inAttesa,
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
