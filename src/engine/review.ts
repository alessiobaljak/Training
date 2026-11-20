import { cosaDellaScelta } from './decadenza.ts';
import { getExercise } from '../data/exercises.ts';
import { LOAD_UNLOCK_WEEK, getLoadThreshold } from '../data/method.ts';
import { adjacentLevel, getProgressionStep } from '../data/progressions.ts';
import { getAnySession } from '../data/sessions.ts';
import { getTest, testBaseline } from '../data/tests.ts';
import { addDays, formatDayLong, formatNumber } from './dates.ts';
import { effectiveBlock } from './draft.ts';
import { assessLoadNeed, getLoadAvailability, stepLoad } from './loading.ts';
import {
  DURATA_MASSIMA_SECONDI,
  aumentoRecente,
  effectiveTempo,
  initialExerciseState,
  isFixedRange,
  isLevaManubrio,
  leveDiTempo,
  manubrioDopo,
  manubrioSuccessivo,
  testoManubrioFermo,
  isScarico,
  motivoBlocco,
  righeVere,
  salitaConsentita,
  serieVere,
  testoSalitaInAttesa,
  varianteEsaurita,
} from './progression.ts';
import { isTempoBreakdown } from './notation.ts';
import { formatRange, resolveBlockRange } from './ranges.ts';
import type { RangeUnit, WorkRange } from './ranges.ts';
import type {
  DecisioneRegistrata,
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
  /** R12: le ultime due sedute sono dello stesso giorno, questo. */
  readonly stessoGiorno: string | null;
}

/**
 * Esercizio che questa revisione non giudica: rifatto dopo a un altro stato
 * (R11a), con una leva di tempo accettata dopo le sedute lette (R10b), o con
 * una seduta nuova che smentisce la coppia (R11c).
 */
export interface Rimandato {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly date: string;
  readonly motivo: 'stato' | 'leva' | 'smentito' | 'decaduta';
  /** Il testo per l'atleta, senza il nome dell'esercizio davanti. */
  readonly testo: string;
}

/** Massimo chiuso, ma nessun aumento si applica (R5 E4, E5). */
export interface Fermo {
  readonly exercise: ExerciseSlug;
  readonly exerciseName: string;
  readonly motivo: 'scarico' | 'scarico-coppia' | 'rientro' | 'sette-giorni';
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

export type MotivoAlMassimo =
  | 'tempo'
  | 'pausa'
  | 'variante'
  | 'settimana'
  | 'soglia'
  | 'nessun-test'
  | 'leve-finite'
  /** D-19 (b): il peso non è scritto o non è fra i manubri dell'elenco. */
  | 'manubrio'
  /** R19 (M22): tempo e pausa fermi al tetto dei 55 minuti, e nessun'altra leva. */
  | 'tetto';

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
  /** Il registro delle scelte accettate e rimandate (R10b, R13). */
  readonly decisioni: readonly DecisioneRegistrata[];
  /**
   * R19 in revisione (M22): la durata stimata, in secondi, della seduta del
   * programma che contiene l'esercizio, con gli stati dati; la più lunga se
   * sono più d'una, `null` se nessuna. Senza, il tetto non si controlla.
   */
  readonly durata?: (esercizio: ExerciseSlug, stati: ReadonlyMap<ExerciseSlug, ExerciseState>) => number | null;
}

/** L'esito di un esercizio, prima di finire in un elenco. */
type Esito =
  | { readonly tipo: 'verdetto'; readonly verdict: WeeklyVerdict }
  | { readonly tipo: 'inRange' }
  | { readonly tipo: 'fermo'; readonly fermo: Fermo }
  | { readonly tipo: 'inAttesa'; readonly inAttesa: InAttesa }
  | { readonly tipo: 'alMassimo'; readonly alMassimo: AlMassimo };

/** Il tipo di un esito, per sapere se una seduta nuova lo conferma (R11). */
function chiaveEsito(esito: Esito): string {
  switch (esito.tipo) {
    case 'verdetto':
      return `verdetto:${esito.verdict.kind}`;
    case 'inRange':
      return 'inRange';
    case 'fermo':
      /* R16: «scarico» e «scarico-coppia» dicono la stessa cosa all'atleta. */
      return `fermo:${esito.fermo.motivo === 'scarico-coppia' ? 'scarico' : esito.fermo.motivo}`;
    case 'inAttesa':
      return 'inAttesa';
    case 'alMassimo':
      return `alMassimo:${esito.alMassimo.motivo}`;
  }
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
  if (input.durata === undefined) return reviewInterna(input, new Map());
  /*
   * M22: R10a (1) non dipende da R19. Un primo giro trova le salite di
   * gradino della revisione; il secondo le conta nella durata, perché una
   * salita che allunga la seduta si applica prima del passo di tempo.
   */
  const { durata: _durata, ...senzaDurata } = input;
  void _durata;
  const primo = reviewInterna(senzaDurata, new Map());
  const salite = new Map(
    primo.verdicts.filter((v) => v.kind === 'sali-di-livello').map((v) => [v.exercise, v.stateAfter] as const),
  );
  return reviewInterna(input, salite);
}

function reviewInterna(
  input: WeeklyReviewInput,
  salite: ReadonlyMap<ExerciseSlug, ExerciseState>,
): WeeklyReview {
  const { week, sessions, states, tests, weekEnd, today, decisioni } = input;
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
    const valoriDi = (session: LoggedSession, unit: RangeUnit): string =>
      elenco(
        vociDi(session, slug).flatMap(({ voce }) => righeVere(voce.sets).map((set) => set.value)),
        unit,
      );

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

    /*
     * R11a: rifatto dopo la fine di W a un altro livello o carico. La coppia
     * non dice più niente sullo stato di oggi.
     */
    const dopo = seduteE.filter((session) => session.date > weekEnd && session.date <= today);
    const cambiato = dopo.find((session) => !alloStato(session));
    if (cambiato !== undefined) {
      rimandati.push({
        exercise: slug,
        exerciseName: exercise.name,
        date: cambiato.date,
        motivo: 'stato',
        testo: `dopo le sedute lette hai cambiato livello o carico (${formatDayLong(cambiato.date)}). Si giudica quando avrai due sedute allo stato nuovo.`,
      });
      continue;
    }

    /*
     * Le ultime due fino a fine(W), non le ultime due buone (R8), e in due
     * giorni diversi (R12): due sedute nello stesso giorno sono un campione.
     */
    const ultime = seduteE.filter((session) => session.date <= weekEnd).slice(-MIN_SESSIONS_FOR_VERDICT);
    const a = ultime.at(-1);
    const b = ultime.length === 2 ? ultime[0] : undefined;
    const stessoGiorno = a !== undefined && b !== undefined && a.date === b.date;
    const utili: LoggedSession[] = [];
    if (a !== undefined && alloStato(a) && inFinestra(a)) {
      if (
        b !== undefined &&
        b.date < a.date &&
        alloStato(b) &&
        inFinestra(b) &&
        stessoRange(a, b)
      ) {
        utili.push(b);
      }
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
        stessoGiorno: stessoGiorno ? (a?.date ?? null) : null,
      });
      continue;
    }

    /*
     * R10b: dopo la più vecchia delle due è stata accettata una leva di
     * tempo o pausa. I numeri letti sono di prima: proporre il carico su
     * quelli era il doppio aumento di A17 (curl da 12 a 14,5 kg quattro giorni
     * dopo un secondo in più di eccentrica).
     */
    const primaDellaCoppia = utili[0];
    const levaDiTempo = decisioni.find(
      (record) =>
        record.exercise === slug &&
        record.decision === 'accepted' &&
        primaDellaCoppia !== undefined &&
        record.date >= primaDellaCoppia.date &&
        (record.stateAfter.eccentricBonusSeconds > record.stateBefore.eccentricBonusSeconds ||
          record.stateAfter.bottomPauseBonusSeconds > record.stateBefore.bottomPauseBonusSeconds),
    );
    if (levaDiTempo !== undefined) {
      const quale =
        levaDiTempo.stateAfter.eccentricBonusSeconds > levaDiTempo.stateBefore.eccentricBonusSeconds
          ? 'eccentrica'
          : 'pausa in allungamento';
      rimandati.push({
        exercise: slug,
        exerciseName: exercise.name,
        date: levaDiTempo.date,
        motivo: 'leva',
        testo: `${formatDayLong(levaDiTempo.date)} hai accettato un secondo in più di ${quale}. Le sedute lette sono di prima: si giudica quando avrai due sedute al tempo nuovo.`,
      });
      continue;
    }

    /*
     * R14c: una scelta tolta dopo la più vecchia delle due ha riportato tempo
     * e pausa a quelli di prima. Le sedute lette sono state fatte con il tempo
     * della scelta, non con quello di adesso: non si giudicano.
     */
    const tolta = decisioni.find(
      (record) =>
        record.exercise === slug &&
        record.decision === 'lapsed' &&
        primaDellaCoppia !== undefined &&
        record.date >= primaDellaCoppia.date &&
        (record.stateAfter.eccentricBonusSeconds > record.stateBefore.eccentricBonusSeconds ||
          record.stateAfter.bottomPauseBonusSeconds > record.stateBefore.bottomPauseBonusSeconds),
    );
    if (tolta !== undefined) {
      const scelta = decisioni.find((record) => record.id !== undefined && record.id === tolta.ref);
      const cosa = cosaDellaScelta({ exercise: slug, stateBefore: tolta.stateAfter, stateAfter: tolta.stateBefore });
      rimandati.push({
        exercise: slug,
        exerciseName: exercise.name,
        date: tolta.date,
        motivo: 'decaduta',
        testo: `${formatDayLong(tolta.date)} la scelta${scelta === undefined ? '' : ` del ${formatDayLong(scelta.date)}`} (${cosa}) non è stata eseguita e tempo e pausa sono tornati a quelli di prima. Le sedute lette non sono a questo stato: si giudica quando avrai due sedute allo stato di adesso.`,
      });
      continue;
    }

    const ultima = utili[utili.length - 1];
    const riferimento = ultima === undefined ? undefined : vociDi(ultima, slug)[0];
    if (riferimento === undefined) continue;
    const { range, unit } = riferimento;
    const rangeFisso = isFixedRange(riferimento.block);

    const livelloTesto =
      exercise.pattern === null || before.level === null
        ? ''
        : ` al livello ${String(before.level)}`;
    const kg = caricoStato !== null && caricoStato > 0 ? `, ${formatNumber(caricoStato)} kg` : '';
    const numeri = `Ultime due sedute${livelloTesto}${kg}: ${utili
      .map((session) => `${formatDayLong(session.date)} ${valoriDi(session, unit)}`)
      .join(' · ')}, su un range di ${formatRange(range, unit)}.`;

    const giu =
      exercise.pattern === null || before.level === null
        ? null
        : adjacentLevel(exercise.pattern, before.level, -1, rangeFisso);
    const su =
      exercise.pattern === null || before.level === null
        ? null
        : adjacentLevel(exercise.pattern, before.level, 1, rangeFisso);
    const recente = aumentoRecente(slug, decisioni, sessions, today);
    const fermoSetteGiorni = (): Esito => ({
      tipo: 'fermo',
      fermo: {
        exercise: slug,
        exerciseName: exercise.name,
        motivo: 'sette-giorni',
        testo:
          recente === null
            ? ''
            : `massimo chiuso, ma un aumento per esercizio ogni 7 giorni. L’ultimo è del ${formatDayLong(recente.date)} (${recente.cosa}): il prossimo si può proporre dal ${formatDayLong(recente.dal)}.`,
      },
    });

    /**
     * L'esito su un gruppo di sedute: la coppia (R8), oppure la coppia più le
     * sedute rifatte dopo fine(W) per la conferma di R11.
     */
    const valuta = (sedute: readonly LoggedSession[]): Esito => {
      const voci = sedute.flatMap((session) => vociDi(session, slug));
      const values = voci.flatMap(({ voce }) => righeVere(voce.sets).map((set) => set.value));
      const serieVereQui = voci.reduce((somma, { voce }) => somma + serieVere(voce.sets).length, 0);
      const sopra = values.filter((value) => value > range.max).length;
      const almeno = values.filter((value) => value >= range.max).length;
      const sotto = values.filter((value) => value < range.min).length;

      /* 1. Troppo difficile. La discesa non passa dai cancelli. */
      if (sotto === values.length) {
        if (exercise.pattern !== null && before.level !== null && giu !== null) {
          const step = getProgressionStep(exercise.pattern, giu);
          return {
            tipo: 'verdetto',
            verdict: {
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
            },
          };
        }
        return {
          tipo: 'verdetto',
          verdict: {
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
          },
        };
      }

      if (almeno !== values.length) return { tipo: 'inRange' };

      /* 2. Massimo chiuso su ogni serie (E1): il cancello di R5. */
      const seduteScarico = sedute.filter((session) => isScarico(session.week));
      const motivo = motivoBlocco({
        tempo: voci.map(({ voce }) => voce.tempoRespected),
        serieVere: serieVereQui,
        scarico: isScarico(week + 1) || seduteScarico.length > 0,
        rientro: false,
      });
      if (motivo === 'scarico') {
        const prossima = isScarico(week + 1);
        const tutta = prossima || seduteScarico.length === sedute.length;
        /* T-S1 se lo scarico deve ancora venire; T-S2 se è già passato (R16). */
        const testo = prossima
          ? 'Settimana di scarico: niente aumenti, anche con il massimo chiuso. Si riprende dopo lo scarico.'
          : tutta
            ? `Le due sedute lette sono di scarico (${seduteScarico.map((session) => formatDayLong(session.date)).join(' e ')}): niente aumenti da quei numeri. Si riprende con due sedute piene.`
            : `Una delle due sedute lette è di scarico (${formatDayLong(seduteScarico[0]?.date ?? weekEnd)}): niente aumenti da quei numeri. Si riprende con due sedute piene.`;
        return {
          tipo: 'fermo',
          fermo: { exercise: slug, exerciseName: exercise.name, motivo: tutta ? 'scarico' : 'scarico-coppia', testo },
        };
      }
      if (motivo === 'rientro') {
        return {
          tipo: 'fermo',
          fermo: {
            exercise: slug,
            exerciseName: exercise.name,
            motivo: 'rientro',
            testo: 'Sedute di rientro dopo la pausa: niente aumenti finché non torni al volume pieno.',
          },
        };
      }
      if (motivo === 'tempo-no' || motivo === 'tempo-null') {
        const giorni = sedute
          .filter((session) =>
            vociDi(session, slug).some(({ voce }) =>
              motivo === 'tempo-no' ? voce.tempoRespected === false : voce.tempoRespected === null,
            ),
          )
          .map((session) => formatDayLong(session.date))
          .join(' e ');
        return {
          tipo: 'verdetto',
          verdict:
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
        };
      }

      /* R10a, 1. Sopra il massimo con un gradino sopra: lo scavalco, con R7 e R13. */
      if (sopra === values.length && exercise.pattern !== null && before.level !== null && su !== null) {
        const salita = salitaConsentita(slug, before.level, sessions, today);
        /* R17b: se R13 ferma più a lungo di R7, la data vera è quella di R13. */
        if (!salita.consentita && recente !== null && salita.dal !== null && recente.dal > salita.dal) {
          return fermoSetteGiorni();
        }
        if (!salita.consentita) {
          return {
            tipo: 'inAttesa',
            inAttesa: {
              exercise: slug,
              exerciseName: exercise.name,
              level: before.level,
              inizio: salita.inizio,
              dal: salita.dal,
              testo: `${exercise.name}: sopra il massimo su tutte le serie. ${testoSalitaInAttesa(before.level, salita)}`,
            },
          };
        }
        if (recente !== null) return fermoSetteGiorni();
        const step = getProgressionStep(exercise.pattern, su);
        return {
          tipo: 'verdetto',
          verdict: {
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
          },
        };
      }

      const alMassimoCon = (motivoAl: MotivoAlMassimo, testo: string): Esito => ({
        tipo: 'alMassimo',
        alMassimo: { exercise: slug, exerciseName: exercise.name, motivo: motivoAl, testo },
      });
      const dopoChiusura =
        'te la propone il riepilogo di fine seduta, la prossima volta che chiudi il massimo con il tempo rispettato.';

      /* R10a, 2-3. Tempo e pausa vengono prima di tutto il resto. */
      const tp = leveDiTempo(riferimento.block, before);
      const tut = effectiveTempo(riferimento.block.tut, before);
      /* R17b: con R13 attivo, tempo e pausa non arrivano prima della sua data. */
      const nonPrima =
        recente === null ? '' : ` Un aumento per esercizio ogni 7 giorni: non prima del ${formatDayLong(recente.dal)}.`;
      /*
       * R19 in revisione (M22): un passo che porta la seduta oltre il tetto
       * non è la prossima leva. σ_rev: gli stati della revisione, le salite
       * di gradino di questa revisione che allungano, e il passo.
       */
      const oltreIlTetto = (dopo: ExerciseState): boolean => {
        if (input.durata === undefined) return false;
        const stati = new Map(states);
        for (const [altro, salita] of salite) {
          if (altro === slug) continue;
          const con = new Map(stati).set(altro, salita);
          if ((input.durata(slug, con) ?? 0) > (input.durata(slug, stati) ?? 0)) stati.set(altro, salita);
        }
        stati.set(slug, dopo);
        return (input.durata(slug, stati) ?? 0) > DURATA_MASSIMA_SECONDI;
      };
      const tempoOltre =
        tp.tempo.available && oltreIlTetto({ ...before, eccentricBonusSeconds: before.eccentricBonusSeconds + 1 });
      const pausaOltre =
        tp.pausa.available && oltreIlTetto({ ...before, bottomPauseBonusSeconds: before.bottomPauseBonusSeconds + 1 });
      const tetto = tempoOltre || pausaOltre;
      const minutiTetto = String(DURATA_MASSIMA_SECONDI / 60);
      const testoTetto = `massimo chiuso su tutte le serie. Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i ${minutiTetto} minuti, e su questo esercizio non ci sono altre leve. Si resta così finché la seduta non torna sotto i ${minutiTetto} minuti: allora il riepilogo di fine seduta riprende con tempo e pausa.`;
      if (tp.tempo.available && !tempoOltre && isTempoBreakdown(tut) && tut.eccentric !== 'X') {
        return alMassimoCon(
          'tempo',
          `massimo chiuso su tutte le serie. La prossima leva è il tempo, eccentrica da ${String(tut.eccentric)}" a ${String(tut.eccentric + 1)}": ${dopoChiusura}${nonPrima}`,
        );
      }
      if (tp.pausa.available && !pausaOltre && isTempoBreakdown(tut) && tut.bottomPause !== 'X') {
        return alMassimoCon(
          'pausa',
          `massimo chiuso su tutte le serie. La prossima leva è la pausa in allungamento, da ${String(tut.bottomPause)}" a ${String(tut.bottomPause + 1)}": ${dopoChiusura}${nonPrima}`,
        );
      }

      /* R10a, 4. La variante, se c'è: la propone la fine seduta. */
      if (!varianteEsaurita(exercise, before, riferimento.block) && exercise.pattern !== null && su !== null && before.level !== null) {
        const salita = salitaConsentita(slug, before.level, sessions, today);
        /* R17b: la più lontana fra la data di R7 e quella di R13. */
        const dal7 = salita.consentita ? null : salita.dal;
        const quando =
          recente !== null && (salita.consentita || (dal7 !== null && recente.dal > dal7))
            ? ` Un aumento per esercizio ogni 7 giorni: si può proporre dal ${formatDayLong(recente.dal)}.`
            : dal7 === null
              ? ''
              : ` Un gradino ogni due settimane: si può proporre dal ${formatDayLong(dal7)}.`;
        return alMassimoCon(
          'variante',
          `massimo chiuso su tutte le serie. ${tetto ? `Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i ${minutiTetto} minuti. La` : 'Tempo e pausa sono al massimo: la'} prossima leva è il livello ${String(su)} (${getProgressionStep(exercise.pattern, su).name}). Te lo propone il riepilogo di fine seduta, la prossima volta che chiudi il massimo con il tempo rispettato.${quando}`,
        );
      }

      const leveFinite = (): Esito =>
        tetto
          ? alMassimoCon('tetto', testoTetto)
          : alMassimoCon(
              'leve-finite',
              'Hai esaurito le leve su questo esercizio: serve un cambio di programmazione, non un altro giro.',
            );

      /* R10a, 5. Senza carico, le leve sono finite. */
      if (exercise.loadPolicy === 'forbidden') return leveFinite();

      /*
       * R10a, 6. Manubri: il manubrio successivo è la leva 5 solo sugli
       * esercizi dell'elenco (R10c-1, D-19); altrove il peso è l'esercizio.
       */
      if (exercise.loadPolicy === 'inherent') {
        if (!isLevaManubrio(exercise)) return leveFinite();
        if (week + 1 < LOAD_UNLOCK_WEEK) {
          return alMassimoCon(
            'settimana',
            `Fino alla settimana ${String(LOAD_UNLOCK_WEEK)} il manubrio non si cambia: le prime due settimane servono a ricostruire lo schema motorio.`,
          );
        }
        /* D-19 (b): il manubrio successivo esatto; senza, niente da fermare per R13. */
        const esito = manubrioDopo(before.loadKg);
        if (esito.tipo === 'mai-scritto' || esito.tipo === 'fuori-elenco') {
          return tetto
            ? alMassimoCon('tetto', testoTetto)
            : alMassimoCon('manubrio', `massimo chiuso su tutte le serie. ${testoManubrioFermo(esito, before.loadKg) ?? ''}`);
        }
        if (esito.tipo === 'cima' && tetto) return alMassimoCon('tetto', testoTetto);
        if (esito.tipo === 'cima') {
          return alMassimoCon(
            'leve-finite',
            `Hai esaurito le leve su questo esercizio: ${formatNumber(before.loadKg)} kg è il manubrio più pesante che hai. Serve un cambio di programmazione, non un altro giro.`,
          );
        }
        if (esito.tipo === 'oltre-s2') return leveFinite();
        if (recente !== null) return fermoSetteGiorni();
        const manubrio = manubrioSuccessivo(exercise, before, range.min);
        return {
          tipo: 'verdetto',
          verdict: {
            exercise: slug,
            exerciseName: exercise.name,
            kind: 'aggiungi-peso',
            lever: 'load',
            title: manubrio.title,
            evidence: tetto
              ? `${numeri} Massimo del range chiuso su tutte le serie; tempo e pausa fermi al tetto dei ${minutiTetto} minuti.`
              : `${numeri} Massimo del range chiuso su tutte le serie, con tempo e pausa al massimo.`,
            change: manubrio.change,
            caution: manubrio.caution,
            stateBefore: before,
            stateAfter: manubrio.nextState,
          },
        };
      }

      /* R10a, 7. Zavorra: settimana (Z3), soglia del test (Z4), sette giorni (R13). */
      const disponibile = getLoadAvailability(exercise, week + 1);
      if (!disponibile.allowed) {
        return alMassimoCon('settimana', disponibile.explanation ?? 'Il carico non si aumenta ancora.');
      }
      if (getLoadThreshold(exercise.pattern) !== null) {
        const baseline = exercise.pattern === null ? null : testBaseline(exercise.pattern);
        const massimale = baseline === null ? undefined : tests.get(baseline.testId)?.value;
        if (massimale === undefined || baseline === null) {
          return alMassimoCon(
            'nessun-test',
            `Per proporre la zavorra serve un test di ${baseline === null ? 'massimale' : getTest(baseline.testId).label} registrato.`,
          );
        }
        const need = assessLoadNeed(exercise, massimale);
        if (need.need === 'discouraged') {
          return alMassimoCon('soglia', `${need.message ?? ''} Ultimo test: ${String(massimale)}.`.trim());
        }
      }
      if (recente !== null) return fermoSetteGiorni();
      const next = stepLoad(before.loadKg, 1);
      return {
        tipo: 'verdetto',
        verdict: {
          exercise: slug,
          exerciseName: exercise.name,
          kind: 'aggiungi-peso',
          lever: 'load',
          title: `${exercise.name}: aggiungi zavorra`,
          evidence: `${numeri} Massimo del range chiuso su tutte le serie.`,
          change: `Da ${formatNumber(before.loadKg)} kg a ${formatNumber(next)} kg. Se il salto in palestra è diverso, scrivi i kg veri nel player: da lì in poi comanda quello che scrivi.`,
          caution: null,
          stateBefore: before,
          stateAfter: { ...before, loadKg: next },
        },
      };
    };

    let esito = valuta(utili);

    /*
     * R11: rifatto dopo fine(W) allo stesso stato. Si giudica lo stesso, se
     * la seduta nuova conferma l'esito della coppia; se lo smentisce, niente
     * cambia e conta la coppia dopo. Prima l'esercizio finiva sempre fra i
     * «rimandati», e chi apriva la revisione dopo la seduta del lunedì non
     * riceveva mai la discesa sugli esercizi di quel circuito.
     */
    if (dopo.length > 0) {
      const confrontabile = dopo.every((session) => a !== undefined && stessoRange(a, session));
      const conferma = confrontabile ? valuta([...utili, ...dopo]) : null;
      if (conferma === null || chiaveEsito(conferma) !== chiaveEsito(esito)) {
        const ultimaDopo = dopo[dopo.length - 1];
        const senzaTempo = dopo.some((session) =>
          vociDi(session, slug).some(({ voce }) => voce.tempoRespected !== true),
        );
        rimandati.push({
          exercise: slug,
          exerciseName: exercise.name,
          date: ultimaDopo?.date ?? today,
          motivo: 'smentito',
          testo: `rifatto ${dopo
            .map((session) => `${formatDayLong(session.date)} (${valoriDi(session, unit)})`)
            .join(', ')}${senzaTempo ? ', tempo non confermato' : ''}. L’ultima seduta non conferma le due lette: niente cambia, conta la prossima coppia di sedute.`,
        });
        continue;
      }
      /* R16: la coda vale per ogni esito confermato che ha un testo. */
      const rifatto = ` Rifatto ${dopo
        .map((session) => `${formatDayLong(session.date)}: ${valoriDi(session, unit)}`)
        .join(' · ')}.`;
      if (esito.tipo === 'verdetto') {
        esito = { tipo: 'verdetto', verdict: { ...esito.verdict, evidence: `${esito.verdict.evidence}${rifatto}` } };
      } else if (esito.tipo === 'fermo') {
        esito = { tipo: 'fermo', fermo: { ...esito.fermo, testo: `${esito.fermo.testo}${rifatto}` } };
      } else if (esito.tipo === 'inAttesa') {
        esito = { tipo: 'inAttesa', inAttesa: { ...esito.inAttesa, testo: `${esito.inAttesa.testo}${rifatto}` } };
      } else if (esito.tipo === 'alMassimo') {
        esito = { tipo: 'alMassimo', alMassimo: { ...esito.alMassimo, testo: `${esito.alMassimo.testo}${rifatto}` } };
      }
    }

    switch (esito.tipo) {
      case 'verdetto':
        verdicts.push(esito.verdict);
        break;
      case 'inRange':
        inRange.push(exercise.name);
        break;
      case 'fermo':
        fermi.push(esito.fermo);
        break;
      case 'inAttesa':
        inAttesa.push(esito.inAttesa);
        break;
      case 'alMassimo':
        alMassimo.push(esito.alMassimo);
        break;
    }
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
