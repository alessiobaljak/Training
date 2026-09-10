/**
 * Aritmetica su date in formato YYYY-MM-DD.
 *
 * Tutto passa da UTC a mezzanotte: l'app funziona offline su un telefono che
 * può cambiare fuso orario in viaggio, e una media a 7 giorni non deve
 * spostarsi perché l'utente ha attraversato un meridiano.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value;
}

export function toIsoDate(date: Date): string {
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

/**
 * Data di oggi secondo l'orologio del telefono.
 *
 * Non è `toIsoDate(new Date())`: quello darebbe la data UTC, e alle 00:30 di
 * un utente a UTC+2 restituirebbe ieri. L'aritmetica interna resta in UTC,
 * ma il "che giorno è" deve venire dal calendario locale.
 */
export function todayIso(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  if (!isIsoDate(value)) {
    throw new Error(`Data non valida: ${value}`);
  }
  return new Date(`${value}T00:00:00Z`);
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Giorni pieni tra due date. Positivo quando `to` viene dopo `from`. */
export function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Indice ISO del giorno: 1 = lunedì … 7 = domenica. */
export function isoWeekday(value: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const day = parseIsoDate(value).getUTCDay();
  return (day === 0 ? 7 : day) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/** Lunedì della settimana che contiene la data. */
export function startOfWeek(value: string): string {
  return addDays(value, 1 - isoWeekday(value));
}

/** Ordina una lista di date crescente, senza mutare l'originale. */
export function sortIsoDates(dates: readonly string[]): string[] {
  return [...dates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
