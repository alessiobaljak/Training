import { findExercise } from '../data/exercises.ts';
import {
  MUSCLE_GROUPS,
  SECONDARY_SET_WEIGHT,
  WEEKLY_SET_TARGET,
} from '../types/index.ts';
import type {
  Exercise,
  LoggedExercise,
  LoggedSession,
  MuscleGroup,
  ProgramSession,
  WaistEntry,
  WeightEntry,
} from '../types/index.ts';
import { addDays, daysBetween, sortIsoDates, startOfWeek } from './dates.ts';
import { findAnySession, isActiveSession } from '../data/sessions.ts';

/**
 * Medie, delta, volume e aderenza. Tutto puro, tutto su dati già registrati.
 */

export interface DatedValue {
  /** Data in formato YYYY-MM-DD. */
  readonly date: string;
  readonly value: number;
}

export const fromWeightEntries = (entries: readonly WeightEntry[]): DatedValue[] =>
  entries.map((entry) => ({ date: entry.date, value: entry.kg }));

export const fromWaistEntries = (entries: readonly WaistEntry[]): DatedValue[] =>
  entries.map((entry) => ({ date: entry.date, value: entry.cm }));

/* -------------------------------------------------------------------------- */
/* Media mobile                                                                */
/* -------------------------------------------------------------------------- */

export interface MovingAveragePoint {
  readonly date: string;
  /** Valore registrato quel giorno. */
  readonly value: number;
  /** Media della finestra che termina in quel giorno. */
  readonly average: number;
  /** Quanti giorni della finestra hanno un dato. */
  readonly sampleCount: number;
  /** `true` quando la finestra è piena: la media è confrontabile. */
  readonly complete: boolean;
}

export const DEFAULT_MOVING_AVERAGE_DAYS = 7;

/**
 * Media mobile su una finestra di giorni di calendario, non di misurazioni.
 *
 * Saltare due giorni non allunga la finestra all'indietro: la media resta di
 * sette giorni e `sampleCount` dice su quanti dati è calcolata. È il numero da
 * mostrare grande, con il dato singolo accanto in piccolo.
 */
export function movingAverage(
  values: readonly DatedValue[],
  windowDays: number = DEFAULT_MOVING_AVERAGE_DAYS,
): MovingAveragePoint[] {
  if (windowDays < 1) throw new Error('La finestra della media mobile deve essere di almeno un giorno.');

  const byDate = new Map<string, number>();
  for (const entry of values) byDate.set(entry.date, entry.value);
  const dates = sortIsoDates([...byDate.keys()]);

  return dates.map((date) => {
    const windowStart = addDays(date, -(windowDays - 1));
    const samples: number[] = [];
    for (const candidate of dates) {
      if (candidate >= windowStart && candidate <= date) {
        const value = byDate.get(candidate);
        if (value !== undefined) samples.push(value);
      }
    }
    const sum = samples.reduce((total, value) => total + value, 0);
    return {
      date,
      value: byDate.get(date) ?? 0,
      average: round1(sum / samples.length),
      sampleCount: samples.length,
      complete: samples.length >= windowDays,
    };
  });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/* -------------------------------------------------------------------------- */
/* Medie settimanali e delta                                                   */
/* -------------------------------------------------------------------------- */

export interface WeeklyAverage {
  /** Lunedì della settimana. */
  readonly weekStart: string;
  readonly average: number;
  readonly sampleCount: number;
  /** Differenza rispetto alla settimana con dati che precede. `null` la prima. */
  readonly delta: number | null;
  /** Settimana con cui è calcolato il delta. Può non essere quella subito prima. */
  readonly comparedTo: string | null;
}

/**
 * Medie per settimana, con il delta rispetto alla settimana precedente **che
 * contiene dati**. Il campo `comparedTo` lo dichiara esplicitamente, così una
 * pausa di tre settimane non passa per un peggioramento improvviso.
 */
export function weeklyAverages(values: readonly DatedValue[]): WeeklyAverage[] {
  const buckets = new Map<string, number[]>();
  for (const entry of values) {
    const week = startOfWeek(entry.date);
    const bucket = buckets.get(week);
    if (bucket === undefined) buckets.set(week, [entry.value]);
    else bucket.push(entry.value);
  }

  const weeks = sortIsoDates([...buckets.keys()]);
  let previous: { weekStart: string; average: number } | null = null;

  return weeks.map((weekStart) => {
    const samples = buckets.get(weekStart) ?? [];
    const average = round1(samples.reduce((sum, value) => sum + value, 0) / samples.length);
    const entry: WeeklyAverage = {
      weekStart,
      average,
      sampleCount: samples.length,
      delta: previous === null ? null : round1(average - previous.average),
      comparedTo: previous?.weekStart ?? null,
    };
    previous = { weekStart, average };
    return entry;
  });
}

/* -------------------------------------------------------------------------- */
/* Riepilogo di un esercizio                                                   */
/* -------------------------------------------------------------------------- */

export interface SetSummary {
  readonly setIndex: number;
  readonly left: number | null;
  readonly right: number | null;
  readonly bilateral: number | null;
  /** Testo per la colonna Rip S<n> del log: "8" per i bilaterali, "8/7" per lato. */
  readonly label: string;
  /** Somma di quanto registrato nella serie, i due lati compresi. */
  readonly total: number;
}

export interface ExerciseSummary {
  /** Serie programmate, non righe registrate: i due lati sono una serie sola. */
  readonly setCount: number;
  readonly sets: readonly SetSummary[];
  /** Colonna "Rip totali" del log. */
  readonly totalValue: number;
  /** Colonna "RIR medio" del log. `null` se non è stato registrato alcun RIR. */
  readonly meanRir: number | null;
  readonly maxLoadKg: number;
}

export function summarizeExercise(logged: LoggedExercise): ExerciseSummary {
  const indexes = [...new Set(logged.sets.map((set) => set.setIndex))].sort((a, b) => a - b);

  const sets = indexes.map<SetSummary>((setIndex) => {
    const rows = logged.sets.filter((set) => set.setIndex === setIndex);
    const left = rows.find((row) => row.side === 'left')?.value ?? null;
    const right = rows.find((row) => row.side === 'right')?.value ?? null;
    const bilateral = rows.find((row) => row.side === null)?.value ?? null;
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const label =
      bilateral !== null
        ? String(bilateral)
        : `${left === null ? '—' : String(left)}/${right === null ? '—' : String(right)}`;
    return { setIndex, left, right, bilateral, label, total };
  });

  const rirs = logged.sets.map((set) => set.rir).filter((rir): rir is number => rir !== null);

  return {
    setCount: indexes.length,
    sets,
    totalValue: logged.sets.reduce((sum, set) => sum + set.value, 0),
    meanRir: rirs.length === 0 ? null : round1(rirs.reduce((sum, rir) => sum + rir, 0) / rirs.length),
    maxLoadKg: logged.sets.reduce((max, set) => Math.max(max, set.loadKg), 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Volume settimanale                                                          */
/* -------------------------------------------------------------------------- */

export type VolumeStatus = 'under' | 'in' | 'over';

export interface GroupVolume {
  readonly group: MuscleGroup;
  /** Serie pesate: piene sui gruppi primari, a metà sui secondari. */
  readonly sets: number;
  readonly status: VolumeStatus;
}

/**
 * Volume per gruppo muscolare su un insieme di sedute.
 *
 * Una serie per lato conta una volta sola, come nella colonna Serie della
 * scheda: due righe di log, sinistra e destra, sono la stessa serie.
 */
/**
 * Il blocco conta nel volume? Una regola sola, per il fatto e per il previsto
 * (METHOD §3, R3 di training-designer).
 *
 * Finitura e decompressione no. Prima `metrics.ts` le contava e il test dei
 * dati no: l'atleta vedeva quadricipiti 14, il rapporto al progettista ne
 * citava 6, e nessuno dei due sapeva dell'altro. Trenta secondi di step al box
 * a fine seduta non sono volume di allenamento dei quadricipiti, e cinque
 * minuti di stretching non sono serie.
 */
function contaNelVolume(sessionId: LoggedSession['sessionId'], blockCode: string): boolean {
  const programma = findAnySession(sessionId);
  const blocco = programma?.blocks.find((block) => block.code === blockCode);
  return blocco?.excludeFromReview !== true;
}

function aggiungi(
  totals: Map<MuscleGroup, number>,
  exercise: Exercise,
  setCount: number,
): void {
  for (const group of exercise.primaryMuscles) {
    totals.set(group, (totals.get(group) ?? 0) + setCount);
  }
  for (const group of exercise.secondaryMuscles) {
    totals.set(group, (totals.get(group) ?? 0) + setCount * SECONDARY_SET_WEIGHT);
  }
}

function inFascia(sets: number): VolumeStatus {
  return sets < WEEKLY_SET_TARGET.min ? 'under' : sets > WEEKLY_SET_TARGET.max ? 'over' : 'in';
}

/**
 * Serie fatte per gruppo, sulle sedute chiuse o abbandonate.
 *
 * Una seduta ancora aperta non conta: è un numero che sta ancora cambiando.
 */
export function volumeByGroup(sessions: readonly LoggedSession[]): GroupVolume[] {
  const totals = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((group) => [group, 0]));

  for (const session of sessions) {
    if (session.status === 'in-progress') continue;
    for (const logged of session.exercises) {
      if (!contaNelVolume(session.sessionId, logged.blockCode)) continue;
      const setCount = new Set(logged.sets.map((set) => set.setIndex)).size;
      if (setCount === 0) continue;
      // Uno slug sconosciuto può arrivare da un backup fatto con una versione
      // precedente dei dati: la riga resta nel log, ma non conta nel volume.
      const exercise = findExercise(logged.exercise);
      if (exercise === undefined) continue;
      aggiungi(totals, exercise, setCount);
    }
  }

  return MUSCLE_GROUPS.map((group) => {
    const sets = totals.get(group) ?? 0;
    return { group, sets, status: inFascia(sets) };
  });
}

/**
 * Serie previste per gruppo: quelle che il programma scrive, a settimana.
 *
 * È il numero contro cui si confronta quello che fai. La fascia del metodo
 * (16-20) resta un riferimento da guardare a parte: con questa scheda è
 * irraggiungibile su tre gruppi per costruzione — 24 stazioni da tre serie
 * fanno 103,5 serie pesate contro le 128 che otto gruppi per sedici
 * pretenderebbero — e misurare l'atleta contro un numero che il programma
 * non gli chiede voleva dire scrivergli «sotto» ovunque.
 */
export function plannedVolumeByGroup(sessions: readonly ProgramSession[]): GroupVolume[] {
  const totals = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((group) => [group, 0]));
  for (const session of sessions) {
    for (const block of session.blocks) {
      if (block.excludeFromReview === true) continue;
      const exercise = findExercise(block.exercise);
      if (exercise === undefined) continue;
      aggiungi(totals, exercise, block.sets);
    }
  }
  return MUSCLE_GROUPS.map((group) => {
    const sets = totals.get(group) ?? 0;
    return { group, sets, status: inFascia(sets) };
  });
}

export function sessionsInWeek(
  sessions: readonly LoggedSession[],
  weekStart: string,
): LoggedSession[] {
  const weekEnd = addDays(weekStart, 6);
  return sessions.filter((session) => session.date >= weekStart && session.date <= weekEnd);
}

/* -------------------------------------------------------------------------- */
/* Aderenza                                                                    */
/* -------------------------------------------------------------------------- */

export interface Adherence {
  readonly completed: number;
  readonly planned: number;
  /** Percentuale intera da 0 a 100. `null` quando non c'è nulla di previsto. */
  readonly percent: number | null;
}

export function adherence(completed: number, planned: number): Adherence {
  if (planned <= 0) return { completed, planned: 0, percent: null };
  return { completed, planned, percent: Math.round((completed / planned) * 100) };
}

/**
 * Sedute previste da inizio programma fino a oggi compreso.
 *
 * La settimana in corso conta solo per i giorni già passati. Contarla intera
 * farebbe apparire in ritardo chi è perfettamente in pari.
 *
 * Il «già passati» però non è più il numero del giorno. Con un calendario che
 * assegnava una seduta a ogni giorno, `isoWeekday` era la risposta giusta: al
 * giovedì erano dovute quattro sedute perché quattro giorni avevano una seduta
 * ciascuno. Il programma attivo non assegna giorni: quattro sedute stanno
 * dentro sette giorni come si vuole, e con la vecchia formula chi al giovedì
 * ne aveva fatta una leggeva **25%** pur essendo in pari.
 *
 * Adesso il dovuto cresce in proporzione ai giorni trascorsi: al quarto giorno
 * di sette sono dovute due sedute su quattro, non quattro.
 */
export function plannedSessionsSoFar(
  startDate: string,
  today: string,
  sessionsPerWeek: number,
): number {
  const giorni = daysBetween(startOfWeek(startDate), today);
  if (giorni < 0) return 0;
  const settimanePiene = Math.floor(giorni / 7);
  /* 1 il lunedì, 7 la domenica: `startOfWeek` allinea al lunedì. */
  const giorniInCorso = (giorni % 7) + 1;
  const dovuteOra = Math.min(
    sessionsPerWeek,
    Math.floor((giorniInCorso / 7) * sessionsPerWeek),
  );
  return settimanePiene * sessionsPerWeek + dovuteOra;
}

/**
 * Aderenza sulle sedute chiuse, contro quelle previste fino a oggi.
 *
 * Il numeratore ha due filtri, e mancavano entrambi.
 *
 * **La data**: contava tutte le sedute chiuse di sempre. Con lo storico dello
 * Shadow archiviato nel registro — ventiquattro sedute del 2025 —
 * e tre sedute dovute dall'inizio del programma, l'app mostrava **833%**.
 *
 * **Il programma**: una seduta dello Shadow non è una seduta di questo
 * programma. Il filtro sulla data da solo basterebbe oggi, ma smette di
 * bastare il giorno in cui si rimette indietro la data di inizio, e allora
 * tornerebbe a contare lavoro di un'altra scheda.
 */
export function adherenceFromSessions(
  sessions: readonly LoggedSession[],
  sessionsPerWeek: number,
  startDate: string | null,
  today: string,
): Adherence {
  if (startDate === null) return adherence(0, 0);
  const dal = startOfWeek(startDate);
  const completed = sessions.filter(
    (session) =>
      session.status === 'completed' &&
      session.date >= dal &&
      session.date <= today &&
      isActiveSession(session.sessionId),
  ).length;
  return adherence(completed, plannedSessionsSoFar(startDate, today, sessionsPerWeek));
}
