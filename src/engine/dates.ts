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

/* -------------------------------------------------------------------------- */
/* Date da leggere                                                             */
/* -------------------------------------------------------------------------- */

/*
 * Le date si conservano in ISO e si mostrano in italiano. Prima l'app mostrava
 * quelle che conservava: «Settimana 1 · 2026-11-12» in testa alla Home, «0 g
 * fa» accanto alla seduta appena chiusa. Sono formati da registro, non da
 * persona che ha appena finito di allenarsi.
 *
 * Nomi scritti a mano invece di `toLocaleDateString`: il risultato di quella
 * dipende dalla lingua del telefono, e un'app in italiano su un telefono in
 * inglese scriverebbe «Thursday 12 November».
 */

const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'] as const;
const MESI = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
] as const;

/** «giovedì 12 novembre». L'anno non c'è: serve a dire che giorno è oggi. */
export function formatDayLong(value: string): string {
  const date = parseIsoDate(value);
  const giorno = GIORNI[isoWeekday(value) - 1] ?? '';
  const mese = MESI[date.getUTCMonth()] ?? '';
  return `${giorno} ${String(date.getUTCDate())} ${mese}`;
}

/**
 * «gio 12 nov», e l'anno solo quando non è quello di `today`: in un diario
 * di tre mesi l'anno ripetuto su ogni riga è rumore, a gennaio serve.
 */
export function formatDayShort(value: string, today: string = todayIso()): string {
  const date = parseIsoDate(value);
  const giorno = (GIORNI[isoWeekday(value) - 1] ?? '').slice(0, 3);
  const mese = (MESI[date.getUTCMonth()] ?? '').slice(0, 3);
  const anno = value.slice(0, 4) === today.slice(0, 4) ? '' : ` ${value.slice(0, 4)}`;
  return `${giorno} ${String(date.getUTCDate())} ${mese}${anno}`;
}

/** «oggi», «ieri», «3 giorni fa». Per le date nel futuro, la data breve. */
export function formatDaysAgo(value: string, today: string = todayIso()): string {
  const giorni = daysBetween(value, today);
  if (giorni === 0) return 'oggi';
  if (giorni === 1) return 'ieri';
  if (giorni < 0) return formatDayShort(value, today);
  return `${String(giorni)} giorni fa`;
}

/** Singolare o plurale secondo il numero: «1 seduta», «2 sedute». */
export function plural(count: number, singolare: string, plurale: string): string {
  return `${String(count)} ${count === 1 ? singolare : plurale}`;
}

/** «34,5», non «34.5»: in italiano i decimali hanno la virgola. */
export function formatNumber(value: number): string {
  return String(Math.round(value * 10) / 10).replace('.', ',');
}
