import { adjacentLevel, getProgressionStep } from '../data/progressions.ts';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise as getExerciseBySlug } from '../data/exercises.ts';
import { ENDURANCE_REP_THRESHOLD, LEVA_MANUBRIO, LOAD_STEP_KG, LOAD_UNLOCK_WEEK, MANUBRI_KG, getLoadThreshold } from '../data/method.ts';
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

function voceDi(session: LoggedSession, slug: ExerciseSlug): readonly LoggedExercise[] {
  return session.exercises.filter((voce) => voce.exercise === slug && voce.sets.length > 0);
}

function caricoMassimoVoci(voci: readonly LoggedExercise[]): number {
  return voci.reduce((max, voce) => voce.sets.reduce((m, set) => Math.max(m, set.loadKg), max), 0);
}

/**
 * Il gradino di un esercizio in una seduta: il più alto fra le voci con
 * almeno una serie (L24), come il peso è il più alto. Non dipende dall'ordine
 * dei blocchi.
 */
export function livelloVoci(voci: readonly LoggedExercise[]): LevelIndex | null {
  return voci.reduce<LevelIndex | null>(
    (max, voce) =>
      voce.sets.length === 0 || voce.level === null ? max : max === null || voce.level > max ? voce.level : max,
    null,
  );
}

/**
 * Gli aumenti di un esercizio (R13), datati dal giorno in cui si fanno (R15).
 *
 * Due fonti. Le scelte accettate: un carico o un gradino contano dalla prima
 * seduta che li esegue, cioè la prima che si stacca dal valore di prima
 * restando entro quello accettato; tempo e pausa dalla prima seduta dopo la
 * scelta (D-20, Alessio, 2026-11-20). Finché nessuna seduta li esegue contano
 * dal giorno della scelta. E il diario: una seduta con un carico o un gradino
 * più alto della precedente è un aumento scritto dall'atleta, salvo quando è
 * proprio l'esecuzione di una scelta sulla stessa grandezza.
 *
 * Prima l'aumento contava dal giorno della scelta: la prima seduta al peso
 * nuovo, sette giorni dopo, poteva già proporre il passo dopo — +5 kg veri in
 * due sedute ravvicinate. Un peso non scritto (manubri a 0 kg) non è un
 * valore e si salta. Nessun campo di testo viene letto.
 */
export function aumenti(
  slug: ExerciseSlug,
  decisioni: readonly DecisioneRegistrata[],
  sessions: readonly LoggedSession[],
  inCorso: LoggedSession | null = null,
): Aumento[] {
  const exercise = getExerciseBySlug(slug);
  const out: Aumento[] = [];
  /* R14: una scelta tolta non conta né come aumento né come spiegazione. */
  const decadute = new Set(
    decisioni.flatMap((record) => (record.decision === 'lapsed' && record.ref !== undefined ? [record.ref] : [])),
  );
  const accettate = decisioni.filter(
    (record) =>
      record.exercise === slug &&
      record.decision === 'accepted' &&
      (record.id === undefined || !decadute.has(record.id)),
  );

  const diario = [
    ...sessions.filter((session) => session.status === 'completed' && session.id !== inCorso?.id),
    ...(inCorso === null ? [] : [inCorso]),
  ]
    .filter((session) => voceDi(session, slug).length > 0)
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1));

  const carico = (session: LoggedSession): number => caricoMassimoVoci(voceDi(session, slug));
  const caricoScritto = (session: LoggedSession): boolean =>
    exercise.loadPolicy !== 'forbidden' && (exercise.loadPolicy !== 'inherent' || carico(session) > 0);
  const livello = (session: LoggedSession): LevelIndex | null => livelloVoci(voceDi(session, slug));

  /* Le sedute che eseguono una scelta, per grandezza: lì il diario non conta un secondo aumento. */
  const eseguite = new Set<string>();

  for (const scelta of accettate) {
    const dopo = diario.filter((session) => session.id !== scelta.sessionLogId && session.date >= scelta.date);
    const giorno = formatDayLong(scelta.date);

    if (scelta.stateAfter.loadKg > scelta.stateBefore.loadKg) {
      const B = scelta.stateBefore.loadKg;
      const T = scelta.stateAfter.loadKg;
      const esecuzione = dopo.find((session) => caricoScritto(session) && carico(session) !== B);
      const v = esecuzione === undefined ? null : carico(esecuzione);
      if (esecuzione !== undefined && v !== null && v > B && v <= T) {
        out.push({ date: esecuzione.date, tipi: ['carico'], cosa: `carico ${formatNumber(B)} → ${kg(v)}, scelta del ${giorno}` });
        eseguite.add(`${esecuzione.id}:carico`);
      } else {
        out.push({
          date: scelta.date,
          tipi: ['carico'],
          cosa:
            exercise.loadPolicy === 'inherent'
              ? inElencoManubri(T)
                ? `manubrio successivo scelto, ${formatNumber(B)} → ${kg(T)}`
                : `manubrio successivo scelto, al massimo ${kg(T)}`
              : `carico ${formatNumber(B)} → ${kg(T)}`,
        });
      }
    }

    const B = scelta.stateBefore.level;
    const T = scelta.stateAfter.level;
    if (B !== null && T !== null && T > B) {
      const esecuzione = dopo.find((session) => livello(session) !== null && livello(session) !== B);
      const v = esecuzione === undefined ? null : livello(esecuzione);
      if (esecuzione !== undefined && v !== null && v > B && v <= T) {
        out.push({ date: esecuzione.date, tipi: ['livello'], cosa: `livello ${String(B)} → ${String(v)}, scelta del ${giorno}` });
        eseguite.add(`${esecuzione.id}:livello`);
      } else {
        out.push({ date: scelta.date, tipi: ['livello'], cosa: `livello ${String(B)} → ${String(T)}` });
      }
    }

    /* Tempo e pausa: dalla prima seduta dopo la scelta (D-20 b). */
    const tempo = scelta.stateAfter.eccentricBonusSeconds > scelta.stateBefore.eccentricBonusSeconds;
    const pausa = scelta.stateAfter.bottomPauseBonusSeconds > scelta.stateBefore.bottomPauseBonusSeconds;
    if (tempo || pausa) {
      const prima = dopo[0];
      out.push({
        date: prima?.date ?? scelta.date,
        tipi: [...(tempo ? (['tempo'] as const) : []), ...(pausa ? (['pausa'] as const) : [])],
        cosa: [tempo ? 'eccentrica +1"' : '', pausa ? 'pausa +1"' : ''].filter(Boolean).join(', '),
      });
    }
  }

  const conCarico = diario.filter(caricoScritto);
  for (let i = 1; i < conCarico.length; i += 1) {
    const prima = conCarico[i - 1];
    const dopo = conCarico[i];
    if (prima === undefined || dopo === undefined) continue;
    if (carico(dopo) > carico(prima) && !eseguite.has(`${dopo.id}:carico`)) {
      out.push({
        date: dopo.date,
        tipi: ['carico'],
        cosa: `peso scritto da te, ${formatNumber(carico(prima))} → ${kg(carico(dopo))}`,
      });
    }
  }

  const conLivello = diario.filter((session) => livello(session) !== null);
  for (let i = 1; i < conLivello.length; i += 1) {
    const prima = conLivello[i - 1];
    const dopo = conLivello[i];
    if (prima === undefined || dopo === undefined) continue;
    const lp = livello(prima);
    const ld = livello(dopo);
    if (lp !== null && ld !== null && ld > lp && !eseguite.has(`${dopo.id}:livello`)) {
      out.push({ date: dopo.date, tipi: ['livello'], cosa: `livello scritto da te, ${String(lp)} → ${String(ld)}` });
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
      /*
       * L23: un aumento con data dopo oggi (orologio avanti, due dispositivi,
       * un backup) ferma come uno di oggi. Prima spariva, e la revisione
       * proponeva un passo sopra uno già fatto.
       */
      return daysBetween(aumento.date, oggi) < GIORNI_PER_AUMENTO;
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
  /* D-19 (b): il manubrio dopo nell'elenco. Chi chiama ha già controllato che esista. */
  const esito = manubrioDopo(state.loadKg);
  const N = esito.tipo === 'successivo' ? esito.kg : state.loadKg;
  return {
    title: `${exercise.name}: passa al manubrio successivo`,
    change: `Passa al manubrio da ${kg(N)}: oggi usi ${kg(state.loadKg)}. Tempo e pausa tornano a quelli della scheda. Nel player il peso parte da ${kg(state.loadKg)}: quando prendi quello da ${kg(N)}, scrivilo in ogni serie. Da lì in poi comanda quello che scrivi.`,
    caution: `Aspettati di scendere verso ${String(rangeMin)} ripetizioni: è il segno che il carico è aumentato davvero.`,
    nextState: { ...state, loadKg: N, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 },
  };
}

/** Il manubrio dopo `v` nell'elenco, o perché non c'è (D-19 b). */
export type EsitoManubrio =
  | { readonly tipo: 'successivo'; readonly kg: number }
  | { readonly tipo: 'oltre-s2'; readonly kg: number }
  | { readonly tipo: 'mai-scritto' | 'fuori-elenco' | 'cima' };

const ugualeKg = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

/** `true` se il peso è uno dei manubri dell'elenco. */
export function inElencoManubri(v: number, elenco: readonly number[] = MANUBRI_KG): boolean {
  return elenco.some((peso) => ugualeKg(peso, v));
}

/**
 * Il manubrio successivo esatto (D-19 b). Un peso fuori elenco ferma la leva
 * invece di salire al successivo: è un refuso o un residuo del vecchio tetto
 * (14,5 kg scritti da chi era a 12), e salire da lì vorrebbe dire salire da un
 * numero che nessuno ha sollevato.
 */
export function manubrioDopo(v: number, elenco: readonly number[] = MANUBRI_KG): EsitoManubrio {
  if (v <= 0) return { tipo: 'mai-scritto' };
  const indice = elenco.findIndex((peso) => ugualeKg(peso, v));
  if (indice < 0) return { tipo: 'fuori-elenco' };
  const dopo = elenco[indice + 1];
  if (dopo === undefined) return { tipo: 'cima' };
  if (dopo - v > LOAD_STEP_KG + 1e-9) return { tipo: 'oltre-s2', kg: dopo };
  return { tipo: 'successivo', kg: dopo };
}

/** Il motivo della leva del manubrio quando non c'è. */
export function testoManubrioFermo(esito: EsitoManubrio, v: number): string | null {
  switch (esito.tipo) {
    case 'successivo':
      return null;
    case 'mai-scritto':
      return 'Peso mai scritto su questo esercizio: scrivi nel player il manubrio che usi, e il prossimo si calcola da lì.';
    case 'fuori-elenco':
      return `${kg(v)} non è fra i tuoi manubri: scrivi nel player il peso che usi davvero, e il prossimo si calcola da lì.`;
    case 'cima':
      return `${kg(v)} è il manubrio più pesante che hai: il manubrio non sale più.`;
    case 'oltre-s2':
      return `Dopo ${kg(v)} il tuo manubrio successivo pesa ${kg(esito.kg)}: più di 2,5 kg in un passo, oltre il limite del metodo. Il manubrio non sale.`;
  }
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
  /**
   * R14b: il peso più alto scritto oggi su questo esercizio, in tutti i suoi
   * blocchi. Se è quello dello stato, un blocco fatto più leggero non cambia
   * lo stato. Senza, si usa il blocco stesso.
   */
  readonly caricoMassimoSeduta?: number;
  /** R14b (L24): il gradino più alto scritto oggi su questo esercizio. */
  readonly livelloMassimoSeduta?: LevelIndex | null;
  /**
   * M21: c'è già una seduta chiusa di questo esercizio con un peso scritto.
   * Senza, si assume di sì: il testo generico di R14b è sempre vero.
   */
  readonly pesoScrittoPrima?: boolean;
  /**
   * R19 (D-22): la durata stimata della seduta, in secondi, se l'esercizio
   * passasse allo stato dato. Senza, il tetto non si controlla.
   */
  readonly durataCon?: (stato: ExerciseState) => number;
  /** R14a: il testo della scelta che questa seduta toglie, se ce n'è una. */
  readonly decaduta?: string | null;
}

/** R19 (D-22, Alessio, 2026-11-20): oltre 55 minuti tempo e pausa si fermano. */
export const DURATA_MASSIMA_SECONDI = 55 * 60;

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
  return loadLeverConMotivo(input).leva;
}

/**
 * La leva del carico, e se è ferma solo per la settimana (Z3) o per il test
 * (Z4): in quel caso le leve non sono finite, arrivano più avanti (R17c).
 */
function loadLeverConMotivo(input: ProgressionInput): {
  leva: LeverAvailability;
  piuAvanti: boolean;
  manubrio?: EsitoManubrio;
} {
  const label = OVERLOAD_LEVER_LABELS.load;
  const ferma = (reason: string | null, piuAvanti = false) => ({
    leva: { lever: 'load' as const, label, available: false, reason },
    piuAvanti,
  });

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
      return ferma('Qui il peso è l’esercizio, non una leva: si registra, ma non è zavorra.');
    }
    if (input.week < LOAD_UNLOCK_WEEK) {
      return ferma(
        `Fino alla settimana ${String(LOAD_UNLOCK_WEEK)} il manubrio non si cambia: le prime due settimane servono a ricostruire lo schema motorio.`,
        true,
      );
    }
    /* D-19 (b): il manubrio successivo esatto, se c'è. Prima di R13: se non sale, non c'è niente da fermare. */
    const esito = manubrioDopo(input.state.loadKg);
    if (esito.tipo !== 'successivo') {
      return { ...ferma(testoManubrioFermo(esito, input.state.loadKg)), manubrio: esito };
    }
    return { leva: { lever: 'load', label, available: true, reason: null }, piuAvanti: false, manubrio: esito };
  }

  /*
   * R6 Z2: prima la variante. Il metodo mette il carico alla leva 5, dopo
   * l'ultimo gradino; prima, con tempo e pausa esauriti, la zavorra arrivava
   * al gradino 1. Una variante solo in attesa per R7 non è esaurita: il
   * carico non prende il suo posto.
   */
  if (!varianteEsaurita(input.exercise, input.state, input.block)) {
    return ferma('Prima la variante: la zavorra arriva dopo l’ultimo gradino della scala.');
  }

  const availability = getLoadAvailability(input.exercise, input.week);
  if (!availability.allowed) {
    return ferma(availability.explanation, availability.reason === 'locked-week');
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
      return ferma(`Per proporre la zavorra serve un test di ${nome} registrato.`, true);
    }
    const need = assessLoadNeed(input.exercise, input.currentMaxReps);
    if (need.need === 'discouraged') {
      return ferma(`${need.message ?? ''} Ultimo test: ${String(input.currentMaxReps)}.`.trim(), true);
    }
  }
  return { leva: { lever: 'load', label, available: true, reason: null }, piuAvanti: false };
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
  /**
   * Nessuna leva, e `blockedReason` dice perché: la scelta di prima si toglie
   * (R14a), il peso non è scritto (R14e), la voce non è allo stato (R14b).
   */
  readonly fuoriStato: 'r14a' | 'r14b' | 'r14e' | null;
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
        change: `Passa da ${kg(state.loadKg)} a ${kg(next)}. Punta a 6-8 ripetizioni con RIR 1.`,
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
   * R19 (D-22 a): tempo e pausa allungano ogni ripetizione. Oltre i 55 minuti
   * stimati la seduta non cresce più così: si passa a variante e carico.
   * Niente tagli a serie, ripetizioni o recuperi.
   */
  if (input.durataCon !== undefined) {
    for (const [indice, entry] of levers.entries()) {
      if ((entry.lever === 'tempo' || entry.lever === 'iso-pause') && entry.available) {
        const dopo = buildSuggestion(entry.lever, input).nextState;
        if (input.durataCon(dopo) > DURATA_MASSIMA_SECONDI) {
          levers[indice] = {
            ...entry,
            available: false,
            reason: `Con questo passo la seduta supererebbe i ${String(DURATA_MASSIMA_SECONDI / 60)} minuti: tempo e pausa si fermano qui, si passa alla leva successiva.`,
          };
        }
      }
    }
  }

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

  /* R14a: la scelta di prima non è stata eseguita e si toglie: niente leve su questo esercizio. */
  if (input.decaduta !== undefined && input.decaduta !== null) {
    const motivo = input.decaduta;
    return {
      closedRange: false,
      tempoRespected: logged.tempoRespected,
      triggered: false,
      levers: levers.map((entry) => (entry.lever !== 'reps' && entry.available ? { ...entry, available: false, reason: motivo } : entry)),
      suggestion: null,
      blockedReason: motivo,
      enduranceWarning,
      motivoBlocco: null,
      fuoriStato: 'r14a',
    };
  }

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
      fuoriStato: null,
    };
  }

  const caricoVoce = logged.sets.reduce((max, set) => Math.max(max, set.loadKg), 0);

  /*
   * R14e: un manubrio lasciato a 0 kg con lo stato a peso è un peso non
   * scritto. Lo stato resta e non si valuta nessuna leva.
   */
  if (input.exercise.loadPolicy === 'inherent' && input.state.loadKg > 0 && (input.caricoMassimoSeduta ?? caricoVoce) === 0) {
    const motivo = `Peso non scritto: lo stato resta ${kg(input.state.loadKg)}. Scrivi il peso la prossima volta: senza, su questo esercizio le leve non si valutano.`;
    return {
      closedRange: false,
      tempoRespected: logged.tempoRespected,
      triggered: false,
      levers: levers.map((entry) => (entry.lever !== 'reps' && entry.available ? { ...entry, available: false, reason: motivo } : entry)),
      suggestion: null,
      blockedReason: motivo,
      enduranceWarning,
      motivoBlocco: null,
      fuoriStato: 'r14e',
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
        /*
         * D-21 (a): anche la settimana prima dello scarico. Una leva accettata
         * nell'ultima seduta della settimana 5 si fa nella 6, a metà serie.
         */
        scarico: isScarico(input.week) || isScarico(input.week + 1),
        rientro: input.rientro !== null,
      })
    : null;
  const triggered = closedRange && motivo === null;

  if (!triggered) {
    levers[0] = repsLever;
    const blockedReason = !closedRange
      ? `Non hai ancora chiuso ${String(range.range.max)} su tutte le serie. Resta sulla leva 1 e sali dentro il range.`
      : motivo === 'scarico'
        ? isScarico(input.week)
          ? 'Settimana di scarico: niente aumenti, anche con il massimo chiuso. Stessa difficoltà, metà delle serie.'
          : 'La settimana prossima è di scarico: niente aumenti da questa seduta, anche con il massimo chiuso. Si riprende dopo lo scarico.'
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
      fuoriStato: null,
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
  /*
   * R17a: R13 parla solo se resta una leva da fermare. Prima, con tutte le
   * leve finite, il riepilogo diceva «il prossimo si può proporre dal…» di un
   * aumento che non sarebbe arrivato mai.
   */
  const candidati = levers.filter((entry) => entry.lever !== 'reps' && entry.available);
  if (input.aumentoRecente !== null && candidati.length > 0) {
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
      fuoriStato: null,
    };
  }

  /*
   * R14b: una leva si propone solo sulla voce fatta allo stato. La leva si
   * applica allo stato, e lo stato accettato vince sul diario alla chiusura:
   * «eccentrica +1″» giudicata su una seduta a 0 kg cancellava gli 0 kg
   * scritti e rimetteva 2,5 kg (L19).
   */
  const L = input.state;
  const livelloSeduta = input.livelloMassimoSeduta === undefined ? logged.level : input.livelloMassimoSeduta;
  const caricoSeduta = input.caricoMassimoSeduta ?? caricoVoce;
  const conCarico = input.exercise.loadPolicy !== 'forbidden';
  const sedutaFuoriLivello = L.level !== null && livelloSeduta !== null && livelloSeduta !== L.level;
  const sedutaFuoriCarico = conCarico && caricoSeduta !== L.loadKg;
  const voceFuoriLivello = L.level !== null && logged.level !== null && logged.level !== L.level;
  const voceFuoriCarico = conCarico && caricoVoce !== L.loadKg;
  if (sedutaFuoriLivello || sedutaFuoriCarico || voceFuoriLivello || voceFuoriCarico) {
    const conBonus = L.eccentricBonusSeconds > 0 || L.bottomPauseBonusSeconds > 0;
    /* M21: il primo peso scritto su un manubrio non è un cambio di peso. */
    const primoPeso =
      input.exercise.loadPolicy === 'inherent' && L.loadKg === 0 && caricoSeduta > 0 && input.pesoScrittoPrima === false;
    /*
     * Il testo è il primo che vale (L24): prima la seduta, che decide lo
     * stato alla chiusura, poi il blocco. D-23: un gradino cambiato a mano
     * riporta tempo e pausa alla scheda, come il manubrio.
     */
    const motivo =
      sedutaFuoriLivello && livelloSeduta !== null && L.level !== null
        ? `Oggi hai fatto il livello ${String(livelloSeduta)} e lo stato era il ${String(L.level)}: da qui comanda quello che hai scritto${conBonus ? ', e tempo e pausa tornano a quelli della scheda' : ''}. Il prossimo passo si valuta dalla prossima seduta al livello ${String(livelloSeduta)}.`
        : sedutaFuoriCarico && primoPeso
          ? `Primo peso scritto su questo esercizio: ${kg(caricoSeduta)}. Da qui si parte${conBonus ? ', con tempo e pausa della scheda' : ''}: le leve si valutano dalla prossima seduta a ${kg(caricoSeduta)}.`
          : sedutaFuoriCarico
            ? `Oggi hai usato ${kg(caricoSeduta)} e lo stato era ${kg(L.loadKg)}: da qui comanda quello che hai scritto${input.exercise.loadPolicy === 'inherent' && conBonus ? ', e tempo e pausa tornano a quelli della scheda' : ''}. Il prossimo passo si valuta dalla prossima seduta a ${kg(caricoSeduta)}.`
            : voceFuoriLivello && logged.level !== null && L.level !== null
              ? `In questo blocco hai fatto il livello ${String(logged.level)} invece del ${String(L.level)}: le leve si valutano solo sulle serie fatte allo stato, che resta il livello ${String(L.level)}.`
              : `In questo blocco hai usato ${kg(caricoVoce)} invece di ${kg(L.loadKg)}: le leve si valutano solo sulle serie fatte allo stato, che resta ${kg(L.loadKg)}.`;
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
      fuoriStato: 'r14b',
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
    /*
     * R17c, nell'ordine: la variante in attesa, con la data più lontana fra
     * R7 e R13 (R17b); il carico fermo solo per la settimana o per il test,
     * che arriva più avanti; altrimenti le leve sono finite davvero.
     */
    const recente = input.aumentoRecente;
    const carico = loadLeverConMotivo(input);
    const blockedReason =
      inAttesa && input.state.level !== null
        ? recente !== null && input.salita.dal !== null && recente.dal > input.salita.dal
          ? testoSetteGiorni(recente)
          : testoSalitaInAttesa(input.state.level, input.salita)
        : carico.piuAvanti && carico.leva.reason !== null
          ? carico.leva.reason
          : (carico.manubrio?.tipo === 'mai-scritto' || carico.manubrio?.tipo === 'fuori-elenco') && carico.leva.reason !== null
            ? carico.leva.reason
            : carico.manubrio?.tipo === 'cima'
              ? `Hai esaurito tutte le leve disponibili su questo esercizio: ${kg(input.state.loadKg)} è il manubrio più pesante che hai. Serve un cambio di programmazione, non un altro giro.`
              : 'Hai esaurito tutte le leve disponibili su questo esercizio. Serve un cambio di programmazione, non un altro giro.';
    return {
      closedRange,
      tempoRespected: true,
      triggered: true,
      levers,
      suggestion: null,
      blockedReason,
      enduranceWarning,
      motivoBlocco: null,
      fuoriStato: null,
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
    fuoriStato: null,
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
