import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  isIsoDate,
  isoWeekday,
  parseIsoDate,
  sortIsoDates,
  startOfWeek,
  todayIso,
} from './dates.ts';

describe('date in formato YYYY-MM-DD', () => {
  it('riconosce le date valide', () => {
    expect(isIsoDate('2026-09-14')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('14/09/2026')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
  });

  it('solleva su una data non valida', () => {
    expect(() => parseIsoDate('2026-02-30')).toThrow(/non valida/i);
  });

  it('somma giorni attraverso mese e anno', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('conta i giorni tra due date', () => {
    expect(daysBetween('2026-09-14', '2026-09-21')).toBe(7);
    expect(daysBetween('2026-09-21', '2026-09-14')).toBe(-7);
    expect(daysBetween('2026-09-14', '2026-09-14')).toBe(0);
  });

  it('usa l’indice ISO del giorno, con la domenica a 7', () => {
    expect(isoWeekday('2026-09-14')).toBe(1);
    expect(isoWeekday('2026-09-19')).toBe(6);
    expect(isoWeekday('2026-09-20')).toBe(7);
  });

  it('riporta al lunedì della stessa settimana', () => {
    expect(startOfWeek('2026-09-14')).toBe('2026-09-14');
    expect(startOfWeek('2026-09-20')).toBe('2026-09-14');
    expect(startOfWeek('2026-09-21')).toBe('2026-09-21');
  });

  it('ordina senza mutare la lista di partenza', () => {
    const input = ['2026-09-20', '2026-09-14', '2026-09-17'];
    expect(sortIsoDates(input)).toEqual(['2026-09-14', '2026-09-17', '2026-09-20']);
    expect(input[0]).toBe('2026-09-20');
  });
});

describe('data di oggi', () => {
  it('usa il calendario locale, non quello UTC', () => {
    // Mezzanotte e mezza del 15 a UTC+2 è ancora il 14 in UTC: la data che
    // conta per l'utente è quella che legge sul telefono.
    const local = new Date(2026, 8, 15, 0, 30, 0);
    expect(todayIso(local)).toBe('2026-09-15');
  });

  it('mette lo zero davanti a mesi e giorni', () => {
    expect(todayIso(new Date(2026, 0, 5, 12, 0, 0))).toBe('2026-01-05');
  });

  it('produce una data che le altre funzioni accettano', () => {
    const today = todayIso(new Date(2026, 8, 15, 23, 59, 0));
    expect(isIsoDate(today)).toBe(true);
    expect(addDays(today, 1)).toBe('2026-09-16');
  });
});
