import { describe, expect, it } from 'vitest';
import {
  DELOAD_BANNER,
  LOAD_LOCKED_BANNER,
  RETEST_BANNER,
  effectiveSets,
  getWeekState,
  isRetestDue,
  programWeek,
} from './schedule.ts';

describe('stato della settimana', () => {
  it('marca come scarico solo le settimane 6, 12 e 18', () => {
    const deload = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 17, 18, 19]
      .filter((week) => getWeekState(week).isDeload);
    expect(deload).toEqual([6, 12, 18]);
  });

  it('marca come ritest solo le settimane 6 e 12', () => {
    const retest = [1, 6, 12, 18, 24].filter((week) => getWeekState(week).isRetestWeek);
    expect(retest).toEqual([6, 12]);
  });

  it('sblocca la zavorra dalla settimana 3', () => {
    expect(getWeekState(1).loadUnlocked).toBe(false);
    expect(getWeekState(2).loadUnlocked).toBe(false);
    expect(getWeekState(3).loadUnlocked).toBe(true);
  });

  it('mostra il banner giusto per ogni situazione', () => {
    expect(getWeekState(1).banner).toBe(LOAD_LOCKED_BANNER);
    expect(getWeekState(4).banner).toBeNull();
    expect(getWeekState(6).banner).toBe(DELOAD_BANNER);
    expect(getWeekState(18).banner).toBe(DELOAD_BANNER);
  });

  it('la settimana 12 è insieme scarico e ritest, e il banner dello scarico vince', () => {
    const state = getWeekState(12);
    expect(state.isDeload).toBe(true);
    expect(state.isRetestWeek).toBe(true);
    expect(state.banner).toBe(DELOAD_BANNER);
    expect(RETEST_BANNER).toContain('massimali');
  });
});

describe('serie effettive', () => {
  it('non tocca nulla nelle settimane normali', () => {
    for (const sets of [1, 2, 3, 4]) {
      expect(effectiveSets(sets, 5), String(sets)).toBe(sets);
    }
  });

  it('dimezza nelle settimane di scarico, con un minimo di una serie', () => {
    expect(effectiveSets(4, 6)).toBe(2);
    expect(effectiveSets(3, 6)).toBe(2);
    expect(effectiveSets(2, 6)).toBe(1);
    expect(effectiveSets(1, 6)).toBe(1);
  });

  it('dimezza in tutte e tre le settimane di scarico', () => {
    for (const week of [6, 12, 18]) {
      expect(effectiveSets(4, week), String(week)).toBe(2);
    }
  });
});

describe('settimana del programma', () => {
  it('parte da 1 nella settimana che contiene la data di inizio', () => {
    expect(programWeek('2026-09-14', '2026-09-14')).toBe(1);
    expect(programWeek('2026-09-14', '2026-09-20')).toBe(1);
    expect(programWeek('2026-09-14', '2026-09-21')).toBe(2);
    expect(programWeek('2026-09-14', '2026-10-19')).toBe(6);
  });

  it('funziona anche se il programma inizia a metà settimana', () => {
    expect(programWeek('2026-09-16', '2026-09-16')).toBe(1);
    expect(programWeek('2026-09-16', '2026-09-14')).toBe(1);
    expect(programWeek('2026-09-16', '2026-09-21')).toBe(2);
  });

  it('restituisce 0 prima dell’inizio: è la Settimana 0 dei test', () => {
    expect(programWeek('2026-09-14', '2026-09-13')).toBe(0);
    expect(programWeek('2026-09-14', '2026-09-07')).toBe(0);
  });
});

describe('ritest', () => {
  it('si propone solo a fine settimana 6 e 12', () => {
    expect(isRetestDue(6, 6)).toBe(true);
    expect(isRetestDue(6, 7)).toBe(true);
    expect(isRetestDue(12, 6)).toBe(true);
    expect(isRetestDue(6, 5)).toBe(false);
    expect(isRetestDue(5, 6)).toBe(false);
    expect(isRetestDue(18, 6)).toBe(false);
  });
});
