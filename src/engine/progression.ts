import { adjacentLevel, getProgressionStep } from '../data/progressions.ts';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise as getExerciseBySlug } from '../data/exercises.ts';
import { ENDURANCE_REP_THRESHOLD, LEVA_MANUBRIO, LOAD_UNLOCK_WEEK, getLoadThreshold } from '../data/method.ts';
import { DELOAD_WEEKS } from '../data/program.ts';
import { getTest, testBaseline } from '../data/tests.ts';
import {
  ECCENTRIC_TEMPO_LADDER,
  ISO_PAUSE_LADDER,
  OVERLOAD_LEVERS,
  OVERLOAD_LEVER_LABELS,
  VARIANT_JUMP_REP_LOSS,
} from '../types/index.ts';
import type {
  DecisioneRegistrata,
  Exercise,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  MotorPattern,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
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
import { addDays, daysBetween, formatDayLong, formatNumber } from './dates.ts';

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
/* Serie vere, salita consentita, motivi di blocco (R5, R7, R8)                */
/* -------------------------------------------------------------------------- */

/**
 * Le serie vere di una voce, come numeri di serie (R8).
 *
 * Una serie conta se ha una riga senza lato, oppure se ha sia il sinistro sia
 * il destro. Due righe per lato sono una serie, non due: prima il conto
 * diceva «4 serie» a chi ne aveva fatte 2 per lato, e bastava per un verdetto.
 */
export function serieVere(sets: readonly LoggedSet[]): readonly number[] {
  const perIndice = new Map<number, Set<string>>();
  for (const set of sets) {
    const lati = perIndice.get(set.setIndex) ?? new Set<string>();
    lati.add(set.side ?? 'nessuno');
    perIndice.set(set.setIndex, lati);
  }
  return [...perIndice]
    .filter(([, lati]) => lati.has('nessuno') || (lati.has('left') && lati.has('right')))
    .map(([indice]) => indice)
    .sort((a, b) => a - b);
}

/** Le righe che appartengono a serie vere: le orfane non entrano nei valori. */
export function righeVere(sets: readonly LoggedSet[]): readonly LoggedSet[] {
  const vere = new Set(serieVere(sets));
  return sets.filter((set) => vere.has(set.setIndex));
}

/** Esito di R7 per un esercizio a un gradino. */
export interface SalitaConsentita {
  readonly consentita: boolean;
  /** Prima seduta chiusa della serie ininterrotta al gradino. `null` se non ce n'è. */
  readonly inizio: string | null;
  /** Da quando si può proporre il gradino dopo. `null` se non si sa ancora. */
  readonly dal: string | null;
}

/** Giorni minimi fra la prima seduta a un gradino e la salita al successivo (S1). */
export const GIORNI_PER_GRADINO = 14;

/**
 * R7: un gradino eseguibile ogni due settimane (S1).
 *
 * Il conto parte dalla prima seduta chiusa della serie **ininterrotta** di
 * sedute a questo gradino: una discesa e una risalita lo fanno ripartire, e
 * un gradino accettato ma non ancora eseguito non ha ancora un inizio, quindi
 * blocca ogni altra salita. La seduta in corso non è chiusa e non conta; se
 * è a questo gradino, dice solo da quando si potrà salire.
 *
 * Prima non c'era nessun tetto: con cinque settimane sopra il range si
 * attraversava una scala di sei gradini in cinque settimane.
 */
export function salitaConsentita(
  slug: ExerciseSlug,
  level: LevelIndex | null,
  sessions: readonly LoggedSession[],
  oggi: string,
  inCorso: LoggedSession | null = null,
): SalitaConsentita {
  if (level === null) return { consentita: false, inizio: null, dal: null };

  const chiuse = sessions
    .filter((session) => session.status === 'completed' && session.id !== inCorso?.id)
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1));

  let inizio: string | null = null;
  let precedente: LevelIndex | null | undefined;
  for (const session of chiuse) {
    for (const voce of session.exercises) {
      if (voce.exercise !== slug || voce.level === null || voce.sets.length === 0) continue;
      if (voce.level === level) {
        if (precedente !== level) inizio = session.date;
      } else {
        inizio = null;
      }
      precedente = voce.level;
    }
  }

  if (inizio !== null) {
    const dal = addDays(inizio, GIORNI_PER_GRADINO);
    return { consentita: daysBetween(inizio, oggi) >= GIORNI_PER_GRADINO, inizio, dal };
  }

  const oggiAlGradino =
    inCorso?.exercises.some(
      (voce) => voce.exercise === slug && voce.level === level && voce.sets.length > 0,
    ) ?? false;
  return {
    consentita: false,
    inizio: null,
    dal: oggiAlGradino && inCorso !== null ? addDays(inCorso.date, GIORNI_PER_GRADINO) : null,
  };
}

/** Il testo di R7, uguale a fine seduta e nella revisione (ADVICE §7). */
export function testoSalitaInAttesa(level: LevelIndex, salita: SalitaConsentita): string {
  if (salita.inizio !== null && salita.dal !== null) {
    return `Un gradino ogni due settimane: sei al livello ${String(level)} dal ${formatDayLong(salita.inizio)}, il prossimo si può proporre dal ${formatDayLong(salita.dal)}.`;
  }
  if (salita.dal !== null) {
    return `Sei appena arrivato al livello ${String(level)}: il prossimo gradino si può proporre dal ${formatDayLong(salita.dal)}.`;
  }
  return `Sei appena arrivato al livello ${String(level)}: il prossimo gradino si può proporre 14 giorni dopo la prima seduta chiusa a questo livello.`;
}

/** Seduta di rientro dopo una pausa (R9). `null` finché R9 non c'è. */
export interface Rientro {
  readonly seduta: number;
  readonly di: number;
}

/** Il primo motivo per cui nessun aumento si può applicare (R5). */
export type MotivoBlocco = 'scarico' | 'rientro' | 'tempo-no' | 'tempo-null' | 'poche-serie';

/** Serie vere minime per un aumento (R5 E3). */
export const MIN_SERIE_PER_AUMENTO = 3;

/**
 * R5: una sola regola per ogni aumento, a fine seduta e nella revisione.
 *
 * Si chiama con il massimo del range già chiuso (E1). L'ordine conta: chi è
 * in scarico legge «scarico», non una domanda sul tempo che non cambierebbe
 * niente. Un `null` sul tempo non vale mai come sì.
 */
export function motivoBlocco(condizioni: {
  readonly tempo: readonly (boolean | null)[];
  readonly serieVere: number;
  readonly scarico: boolean;
  readonly rientro: boolean;
}): MotivoBlocco | null {
  if (condizioni.scarico) return 'scarico';
  if (condizioni.rientro) return 'rientro';
  if (condizioni.tempo.some((valore) => valore === false)) return 'tempo-no';
  if (condizioni.tempo.length === 0 || condizioni.tempo.some((valore) => valore === null)) {
    return 'tempo-null';
  }
  if (condizioni.serieVere < MIN_SERIE_PER_AUMENTO) return 'poche-serie';
  return null;
}

/** La settimana è di scarico (R5 E4). */
export function isScarico(week: number): boolean {
  return DELOAD_WEEKS.includes(week);
}

/** Stato dell'esercizio con la variante strutturalmente esaurita (R6 Z2). */
export function varianteEsaurita(exercise: Exercise, state: ExerciseState, block: ProgramBlock): boolean {
  return (
    exercise.pattern === null ||
    state.level === null ||
    adjacentLevel(exercise.pattern, state.level, 1, isFixedRange(block)) === null
  );
}

/* -------------------------------------------------------------------------- */
/* R13: un aumento per esercizio ogni 7 giorni                                 */
/* -------------------------------------------------------------------------- */

/** Giorni minimi fra due aumenti dello stesso esercizio (S2, D-4 a). */
export const GIORNI_PER_AUMENTO = 7;

export type TipoAumento = 'livello' | 'tempo' | 'pausa' | 'carico';

/** Un aumento già avvenuto su un esercizio, con la data e cosa è cambiato. */
export interface Aumento {
  readonly date: string;
  readonly tipi: readonly TipoAumento[];
  /** «livello 2 → 3», «eccentrica +1"», «peso scritto da te, 12 → 14 kg». */
  readonly cosa: string;
}

/** L'ultimo aumento entro 7 giorni, che ferma il prossimo. */
export interface AumentoRecente {
  readonly date: string;
  readonly cosa: string;
  /** Da quando si può proporre il prossimo. */
  readonly dal: string;
}

function kg(value: number): string {
  return `${formatNumber(value)} kg`;
}

function aumentiDiStato(prima: ExerciseState, dopo: ExerciseState): { tipi: TipoAumento[]; cosa: string[] } {
  const tipi: TipoAumento[] = [];
  const cosa: string[] = [];
  if (prima.level !== null && dopo.level !== null && dopo.level > prima.level) {
    tipi.push('livello');
    cosa.push(`livello ${String(prima.level)} → ${String(dopo.level)}`);
  }
  if (dopo.eccentricBonusSeconds > prima.eccentricBonusSeconds) {
    tipi.push('tempo');
    cosa.push('eccentrica +1"');
  }
  if (dopo.bottomPauseBonusSeconds > prima.bottomPauseBonusSeconds) {
    tipi.push('pausa');
    cosa.push('pausa +1"');
  }
  if (dopo.loadKg > prima.loadKg) {
    tipi.push('carico');
    cosa.push(`carico ${kg(prima.loadKg)} → ${kg(dopo.loadKg)}`);
  }
  return { tipi, cosa };
}

function voceDi(session: LoggedSession, slug: ExerciseSlug): readonly LoggedExercise[] {
  return session.exercises.filter((voce) => voce.exercise === slug && voce.sets.length > 0);
}

function caricoMassimoVoci(voci: readonly LoggedExercise[]): number {
  return voci.reduce((max, voce) => voce.sets.reduce((m, set) => Math.max(m, set.loadKg), max), 0);
}

function livelloVoci(voci: readonly LoggedExercise[]): LevelIndex | null {
  return voci.find((voce) => voce.level !== null)?.level ?? null;
}

/**
 * Gli aumenti di un esercizio, da due fonti (R13).
 *
 * Le scelte accettate, con la loro data; e il diario: una seduta chiusa con
 * un carico o un livello più alto della precedente è un aumento scritto
 * dall'atleta, salvo quando è proprio l'esecuzione di una scelta accettata
 * nel frattempo, che è già contata. A fine seduta conta anche la seduta in
 * corso. Nessun campo di testo viene letto.
 */
export function aumenti(
  slug: ExerciseSlug,
  decisioni: readonly DecisioneRegistrata[],
  sessions: readonly LoggedSession[],
  inCorso: LoggedSession | null = null,
): Aumento[] {
  const exercise = getExerciseBySlug(slug);
  const out: Aumento[] = [];
  const accettate = decisioni.filter((record) => record.exercise === slug && record.decision === 'accepted');

  for (const record of accettate) {
    const { tipi, cosa } = aumentiDiStato(record.stateBefore, record.stateAfter);
    if (tipi.length > 0) out.push({ date: record.date, tipi, cosa: cosa.join(', ') });
  }

  const diario = [
    ...sessions.filter((session) => session.status === 'completed' && session.id !== inCorso?.id),
    ...(inCorso === null ? [] : [inCorso]),
  ]
    .filter((session) => voceDi(session, slug).length > 0)
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1));

  for (let i = 1; i < diario.length; i += 1) {
    const prima = diario[i - 1];
    const dopo = diario[i];
    if (prima === undefined || dopo === undefined) continue;
    const vociPrima = voceDi(prima, slug);
    const vociDopo = voceDi(dopo, slug);
    const spiegata = (vale: (record: DecisioneRegistrata) => boolean): boolean =>
      accettate.some((record) => record.date >= prima.date && record.date <= dopo.date && vale(record));

    const caricoPrima = caricoMassimoVoci(vociPrima);
    const caricoDopo = caricoMassimoVoci(vociDopo);
    if (
      exercise.loadPolicy !== 'forbidden' &&
      caricoDopo > caricoPrima &&
      !spiegata((record) => record.stateAfter.loadKg === caricoDopo)
    ) {
      out.push({
        date: dopo.date,
        tipi: ['carico'],
        cosa: `peso scritto da te, ${formatNumber(caricoPrima)} → ${kg(caricoDopo)}`,
      });
    }

    const livelloPrima = livelloVoci(vociPrima);
    const livelloDopo = livelloVoci(vociDopo);
    if (
      livelloPrima !== null &&
      livelloDopo !== null &&
      livelloDopo > livelloPrima &&
      !spiegata((record) => record.stateAfter.level === livelloDopo)
    ) {
      out.push({
        date: dopo.date,
        tipi: ['livello'],
        cosa: `livello scritto da te, ${String(livelloPrima)} → ${String(livelloDopo)}`,
      });
    }
  }
  return out;
}

/**
 * R13b, nella forma decisa da Alessio (D-4 a): un aumento per esercizio ogni
 * 7 giorni, di qualunque tipo, gradino compreso. `null` se niente lo ferma.
 * Le discese non passano di qui.
 */
export function aumentoRecente(
  slug: ExerciseSlug,
  decisioni: readonly DecisioneRegistrata[],
  sessions: readonly LoggedSession[],
  oggi: string,
  inCorso: LoggedSession | null = null,
): AumentoRecente | null {
  const recenti = aumenti(slug, decisioni, sessions, inCorso)
    .filter((aumento) => {
      const giorni = daysBetween(aumento.date, oggi);
      return giorni >= 0 && giorni < GIORNI_PER_AUMENTO;
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const ultimo = recenti.at(-1);
  return ultimo === undefined
    ? null
    : { date: ultimo.date, cosa: ultimo.cosa, dal: addDays(ultimo.date, GIORNI_PER_AUMENTO) };
}

/** Il testo di R13 a fine seduta (ADVICE §7). */
export function testoSetteGiorni(recente: AumentoRecente): string {
  return `Un aumento per esercizio ogni 7 giorni: l’ultimo è del ${formatDayLong(recente.date)} (${recente.cosa}). Il prossimo si può proporre dal ${formatDayLong(recente.dal)}: oggi resta tutto com’è.`;
}

/** Il manubrio successivo è una leva su questo esercizio (R10c-1, D-19). */
export function isLevaManubrio(exercise: Exercise): boolean {
  return (
    exercise.loadPolicy === 'inherent' &&
    exercise.measurement === 'reps' &&
    LEVA_MANUBRIO.has(exercise.slug)
  );
}

/**
 * R10c-1: il manubrio successivo, uguale a fine seduta e nella revisione.
 *
 * I 2,5 kg sono un tetto, non un bersaglio: il salto vero dipende dai
 * manubri che si hanno. Tempo e pausa tornano a quelli della scheda, come
 * dopo un cambio di gradino.
 */
export function manubrioSuccessivo(
  exercise: Exercise,
  state: ExerciseState,
  rangeMin: number,
): { readonly title: string; readonly change: string; readonly caution: string; readonly nextState: ExerciseState } {
  const tetto = stepLoad(state.loadKg, 1);
  return {
    title: `${exercise.name}: passa al manubrio successivo`,
    change: `Manubrio successivo, al massimo ${kg(tetto)}: oggi usi ${kg(state.loadKg)}. Tempo e pausa tornano a quelli della scheda. Nel player scrivi il peso vero: da lì in poi comanda quello che scrivi. Se il tuo manubrio successivo pesa più di ${kg(tetto)}, resta a ${kg(state.loadKg)}.`,
    caution: `Aspettati di scendere verso ${String(rangeMin)} ripetizioni: è il segno che il carico è aumentato davvero.`,
    nextState: { ...state, loadKg: tetto, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 },
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
  /**
   * Ultimo massimale del test dello schema motorio, per la soglia della
   * zavorra (R6 Z4). `null` se non c'è: senza test niente zavorra su trazioni
   * e dip.
   */
  readonly currentMaxReps: number | null;
  /** R7, calcolata sullo stato di prima della scelta. */
  readonly salita: SalitaConsentita;
  /** R9: la seduta è di rientro. `null` fuori dal rientro. */
  readonly rientro: Rientro | null;
  /** R13: l'ultimo aumento entro 7 giorni, che ferma il prossimo. */
  readonly aumentoRecente: AumentoRecente | null;
}

function tempoLever(block: ProgramBlock, state: ExerciseState): LeverAvailability {
  const label = OVERLOAD_LEVER_LABELS.tempo;
  const tut = effectiveTempo(block.tut, state);
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

function isoPauseLever(block: ProgramBlock, state: ExerciseState): LeverAvailability {
  const label = OVERLOAD_LEVER_LABELS['iso-pause'];
  const tut = effectiveTempo(block.tut, state);
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

/**
 * Tempo e pausa allo stato dato, con le stesse regole della fine seduta.
 * La revisione le legge per rispettare l'ordine delle leve (R10a): prima di
 * loro non arriva né il carico né il manubrio.
 */
export function leveDiTempo(
  block: ProgramBlock,
  state: ExerciseState,
): { readonly tempo: LeverAvailability; readonly pausa: LeverAvailability } {
  return { tempo: tempoLever(block, state), pausa: isoPauseLever(block, state) };
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
  if (!input.salita.consentita) {
    return { lever: 'variant', label, available: false, reason: testoSalitaInAttesa(state.level, input.salita) };
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
    /*
     * R10c-1: sui manubri dell'elenco il manubrio successivo è la leva 5,
     * dopo tempo e pausa (l'ordine lo tiene `evaluateProgression`) e dalla
     * settimana in cui si sblocca il carico. Altrove il peso resta
     * l'esercizio: si registra, ma non è una leva.
     */
    if (!isLevaManubrio(input.exercise)) {
      return {
        lever: 'load',
        label,
        available: false,
        reason: 'Qui il peso è l’esercizio, non una leva: si registra, ma non è zavorra.',
      };
    }
    if (input.week < LOAD_UNLOCK_WEEK) {
      return {
        lever: 'load',
        label,
        available: false,
        reason: `Fino alla settimana ${String(LOAD_UNLOCK_WEEK)} il manubrio non si cambia: le prime due settimane servono a ricostruire lo schema motorio.`,
      };
    }
    return { lever: 'load', label, available: true, reason: null };
  }

  /*
   * R6 Z2: prima la variante. Il metodo mette il carico alla leva 5, dopo
   * l'ultimo gradino; prima, con tempo e pausa esauriti, la zavorra arrivava
   * al gradino 1. Una variante solo in attesa per R7 non è esaurita: il
   * carico non prende il suo posto.
   */
  if (!varianteEsaurita(input.exercise, input.state, input.block)) {
    return {
      lever: 'load',
      label,
      available: false,
      reason: 'Prima la variante: la zavorra arriva dopo l’ultimo gradino della scala.',
    };
  }

  const availability = getLoadAvailability(input.exercise, input.week);
  if (!availability.allowed) {
    return { lever: 'load', label, available: false, reason: availability.explanation };
  }

  /*
   * R6 Z4: su trazioni e dip la soglia del test si legge sempre. Prima il
   * riepilogo del circuito passava `null` a ogni blocco e la soglia non era
   * mai letta; senza un test registrato, adesso, niente zavorra.
   */
  if (getLoadThreshold(input.exercise.pattern) !== null) {
    if (input.currentMaxReps === null) {
      const baseline = input.exercise.pattern === null ? null : testBaseline(input.exercise.pattern);
      const nome = baseline === null ? 'massimale' : getTest(baseline.testId).label;
      return {
        lever: 'load',
        label,
        available: false,
        reason: `Per proporre la zavorra serve un test di ${nome} registrato.`,
      };
    }
    const need = assessLoadNeed(input.exercise, input.currentMaxReps);
    if (need.need === 'discouraged') {
      return {
        lever: 'load',
        label,
        available: false,
        reason: `${need.message ?? ''} Ultimo test: ${String(input.currentMaxReps)}.`.trim(),
      };
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
  /** Il motivo di R5 per cui nessun aumento si applica, se c'è. */
  readonly motivoBlocco: MotivoBlocco | null;
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
      if (input.exercise.loadPolicy === 'inherent') {
        const range = input.range.kind === 'range' ? input.range.range.min : 0;
        const manubrio = manubrioSuccessivo(input.exercise, state, range);
        return {
          lever,
          title: 'Manubrio successivo',
          change: manubrio.change,
          warning: manubrio.caution,
          nextState: manubrio.nextState,
        };
      }
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
    tempoLever(input.block, input.state),
    isoPauseLever(input.block, input.state),
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
      motivoBlocco: null,
    };
  }

  /*
   * Si giudicano le serie vere (R8): una serie per lato a cui manca un lato
   * non conta e i suoi numeri non entrano. Senza nessuna serie vera restano
   * le righe com'erano, così il riepilogo dice comunque come è andata.
   */
  const vere = serieVere(logged.sets);
  const righe = vere.length > 0 ? righeVere(logged.sets) : logged.sets;
  const closedRange = righe.length > 0 && righe.every((set) => set.value >= range.range.max);
  /*
   * `null` è «non hai ancora risposto», e non vale come sì.
   *
   * Prima il campo nasceva a `true`: la domanda di fine seduta arrivava già
   * con «Sì» acceso, premerlo non cambiava niente, e soprattutto il metodo
   * dava per rispettato un tempo che nessuno aveva confermato. La condizione
   * di avanzamento si reggeva su una risposta mai data.
   */
  /*
   * R5: la stessa regola della revisione. Massimo chiuso (E1), tempo
   * confermato (E2), almeno tre serie vere (E3), niente scarico (E4), niente
   * rientro (E5). Prima bastava il massimo con il tempo: una seduta chiusa
   * dopo due giri o la settimana di scarico proponevano un aumento.
   */
  const motivo = closedRange
    ? motivoBlocco({
        tempo: [logged.tempoRespected],
        serieVere: vere.length,
        scarico: isScarico(input.week),
        rientro: input.rientro !== null,
      })
    : null;
  const triggered = closedRange && motivo === null;

  if (!triggered) {
    levers[0] = repsLever;
    const blockedReason = !closedRange
      ? `Non hai ancora chiuso ${String(range.range.max)} su tutte le serie. Resta sulla leva 1 e sali dentro il range.`
      : motivo === 'scarico'
        ? 'Settimana di scarico: niente aumenti, anche con il massimo chiuso. Stessa difficoltà, metà delle serie.'
        : motivo === 'rientro' && input.rientro !== null
          ? `Seduta di rientro (${String(input.rientro.seduta)} di ${String(input.rientro.di)}): niente aumenti finché non torni al volume pieno.`
          : motivo === 'tempo-null'
            ? 'Manca una risposta sul tempo prescritto: finché non c’è, la leva 1 non si può dire esaurita.'
            : motivo === 'tempo-no'
              ? 'Il tempo prescritto non è stato rispettato su tutte le serie: la leva 1 non è ancora esaurita.'
              : `Per cambiare leva servono almeno ${String(MIN_SERIE_PER_AUMENTO)} serie complete: oggi ne hai chiuse ${String(vere.length)}. Resta sulla leva 1.`;
    return {
      closedRange,
      tempoRespected: logged.tempoRespected,
      triggered: false,
      levers,
      suggestion: null,
      blockedReason,
      enduranceWarning,
      motivoBlocco: motivo,
    };
  }

  // Il trigger scatta proprio quando la leva 1 è esaurita.
  levers[0] = {
    lever: 'reps',
    label: OVERLOAD_LEVER_LABELS.reps,
    available: false,
    reason: `Hai chiuso ${String(range.range.max)} su tutte le serie: la leva delle ripetizioni è esaurita.`,
  };

  /*
   * R13 (D-4 a): un aumento per esercizio ogni 7 giorni, di qualunque tipo.
   * Prima la revisione del lunedì e il riepilogo del giovedì potevano
   * sommare +5 kg in tre giorni sullo stesso esercizio.
   */
  if (input.aumentoRecente !== null) {
    const motivo = testoSetteGiorni(input.aumentoRecente);
    for (const [indice, entry] of levers.entries()) {
      if (entry.lever !== 'reps' && entry.available) {
        levers[indice] = { ...entry, available: false, reason: motivo };
      }
    }
    return {
      closedRange,
      tempoRespected: true,
      triggered: true,
      levers,
      suggestion: null,
      blockedReason: motivo,
      enduranceWarning,
      motivoBlocco: null,
    };
  }

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
  const sopraIlRange = righe.every((set) => set.value > range.range.max);
  const rirTarget = parseRir(input.block.rir);
  const conMargine =
    rirTarget !== null && righe.every((set) => set.rir !== null && set.rir > rirTarget.max);
  const gradinoTroppoFacile =
    input.exercise.measurement === 'reps' &&
    (sopraIlRange || enduranceWarning !== null || conMargine) &&
    byLever.get('variant')?.available === true;

  const next = gradinoTroppoFacile
    ? 'variant'
    : OVERLOAD_LEVERS.find((lever) => byLever.get(lever)?.available === true);

  if (next === undefined) {
    /*
     * Con la variante solo in attesa (R7) le leve non sono finite: dirlo
     * sarebbe falso, e spingerebbe a cambiare programma due settimane prima
     * del gradino successivo.
     */
    const inAttesa =
      input.state.level !== null &&
      !varianteEsaurita(input.exercise, input.state, input.block) &&
      !input.salita.consentita;
    return {
      closedRange,
      tempoRespected: true,
      triggered: true,
      levers,
      suggestion: null,
      blockedReason:
        inAttesa && input.state.level !== null
          ? testoSalitaInAttesa(input.state.level, input.salita)
          : 'Hai esaurito tutte le leve disponibili su questo esercizio. Serve un cambio di programmazione, non un altro giro.',
      enduranceWarning,
      motivoBlocco: null,
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
    motivoBlocco: null,
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
  /**
   * L'esercizio compare solo in blocchi che non si giudicano: il test non
   * cambia il suo gradino. Il dead hang della decompressione.
   */
  readonly notJudged: boolean;
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
  /*
   * Prima i blocchi esclusi non si guardavano, e l'onboarding scriveva del
   * dead hang «non usato nelle sedute»: sta nella decompressione di tutte e
   * quattro, trenta secondi al gradino 2. Il test non ne cambia il gradino,
   * ma chi ha appena misurato otto secondi deve saperlo (training-quality B9).
   */
  const giudicati = (slug: ExerciseSlug): boolean =>
    CIRCUIT_SESSIONS.some((session) =>
      session.blocks.some((block) => block.exercise === slug && block.excludeFromReview !== true),
    );
  for (const session of CIRCUIT_SESSIONS) {
    for (const block of session.blocks) {
      if (visti.has(block.exercise)) continue;
      /* Un esercizio giudicato altrove si nomina dal blocco che si giudica. */
      if (block.excludeFromReview === true && giudicati(block.exercise)) continue;
      const exercise = getExerciseBySlug(block.exercise);
      if (exercise.pattern === null) continue;
      const prova = testBaseline(exercise.pattern);
      if (prova === null || prova.testId !== testId) continue;
      visti.add(block.exercise);
      esiti.push({
        where: `${session.name} · ${block.code}`,
        exercise: block.exercise,
        level: startingLevel(exercise, prove),
        notJudged: block.excludeFromReview === true,
      });
    }
  }
  return esiti;
}
