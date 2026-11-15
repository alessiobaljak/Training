import { DELOAD_WEEKS, RETEST_WEEKS } from '../data/program.ts';
import { LOAD_UNLOCK_WEEK } from '../data/method.ts';
import { addDays, daysBetween, startOfWeek } from './dates.ts';
import type { WeekdayIndex } from '../types/index.ts';

/**
 * Stato della settimana nel mesociclo: scarico, ritest, zavorra sbloccata.
 */

export interface WeekState {
  /** 0 è la Settimana 0 dei test, il programma parte dalla 1. */
  readonly week: number;
  readonly isDeload: boolean;
  /** La settimana in cui, alla fine, va rifatto il test dei massimali. */
  readonly isRetestWeek: boolean;
  readonly loadUnlocked: boolean;
  /** Testo del banner, `null` quando non c'è nulla da spiegare. */
  readonly banner: string | null;
}

export const DELOAD_BANNER =
  'Settimana di scarico: stessa difficoltà, metà delle serie. Non è un passo indietro, è quello che permette alla settimana successiva di essere più dura.';

export const RETEST_BANNER =
  'A fine settimana rifai i test dei massimali. Da lì l’app ricalcola tutti i range di lavoro.';

export const LOAD_LOCKED_BANNER =
  'Zavorra bloccata nelle prime due settimane: servono a ricostruire lo schema motorio e a validare i massimali del test.';

export function getWeekState(week: number): WeekState {
  const isDeload = DELOAD_WEEKS.includes(week);
  const isRetestWeek = RETEST_WEEKS.includes(week);
  const loadUnlocked = week >= LOAD_UNLOCK_WEEK;

  const banner = isDeload
    ? DELOAD_BANNER
    : isRetestWeek
      ? RETEST_BANNER
      : loadUnlocked
        ? null
        : LOAD_LOCKED_BANNER;

  return { week, isDeload, isRetestWeek, loadUnlocked, banner };
}

/**
 * Serie effettive di un blocco nella settimana indicata.
 * Nelle settimane di scarico si dimezzano, con un minimo di una serie:
 * 4 diventano 2, 3 diventano 2, 1 resta 1.
 */
export function effectiveSets(sets: number, week: number): number {
  if (!DELOAD_WEEKS.includes(week)) return sets;
  return Math.max(1, Math.round(sets / 2));
}

/**
 * Settimana del programma a partire dalla data di inizio.
 * La settimana 1 è quella che contiene `startDate`, allineata al lunedì.
 * Le date precedenti restituiscono 0, cioè la Settimana 0 dei test.
 */
export function programWeek(startDate: string, date: string): number {
  const diff = daysBetween(startOfWeek(startDate), date);
  if (diff < 0) return 0;
  return Math.floor(diff / 7) + 1;
}

/**
 * La domenica che chiude la settimana `week` del programma (R8).
 *
 * Le settimane partono dal lunedì della data di inizio: un programma che
 * comincia di mercoledì ha comunque la settimana 1 da lunedì a domenica.
 */
export function weekEndDate(startDate: string, week: number): string {
  return addDays(startOfWeek(startDate), 7 * week - 1);
}

/** Il ritest si propone a fine settimana 6 e 12, mai prima. */
export function isRetestDue(week: number, weekday: WeekdayIndex): boolean {
  return RETEST_WEEKS.includes(week) && weekday >= 6;
}
