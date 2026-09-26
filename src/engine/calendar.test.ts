import { describe, expect, it } from 'vitest';
import {
  applyMoves,
  consecutiveTrainingDays,
  isMoved,
  moveWarning,
  nextTrainingDay,
  scheduledForDate,
  sessionForDate,
  sharedMuscles,
  swapDays,
} from './calendar.ts';
import { getSession } from '../data/program.ts';
import type { SessionMove } from './calendar.ts';

/*
 * Il caso vero, quello che ha fatto nascere il file: un sabato in cui non si
 * allena e una domenica in cui si allenerebbe volentieri.
 *
 * 2026-09-26 è un sabato — Shadow — e il 27 è la domenica di riposo.
 */
const SABATO = '2026-09-26';
const DOMENICA = '2026-09-27';
const LUNEDI = '2026-09-28';
const MARTEDI = '2026-09-22';
const GIOVEDI = '2026-09-24';
const VENERDI = '2026-09-25';

/** Lo spostamento salvato, come lo scriverebbe il database. */
function sposta(from: string, to: string, prima: readonly SessionMove[] = []): SessionMove[] {
  return applyMoves(prima, swapDays(from, to, prima));
}

describe('il calendario senza spostamenti', () => {
  it('dà a ogni giorno la seduta della scheda', () => {
    expect(sessionForDate(SABATO)?.id).toBe('shadow');
    expect(sessionForDate(GIOVEDI)?.id).toBe('upper-b');
    expect(sessionForDate(DOMENICA)).toBeNull();
  });

  it('il prossimo allenamento salta il giorno di riposo', () => {
    expect(nextTrainingDay(SABATO)).toEqual({ date: LUNEDI, weekday: 1, inDays: 2 });
  });

  it('sei giorni di fila, poi il riposo', () => {
    expect(consecutiveTrainingDays(SABATO)).toBe(6);
    expect(consecutiveTrainingDays(DOMENICA)).toBe(0);
  });
});

describe('spostare una seduta nel giorno libero', () => {
  const dopo = sposta(SABATO, DOMENICA);

  it('svuota il giorno di partenza e riempie quello di arrivo', () => {
    expect(sessionForDate(SABATO, dopo)).toBeNull();
    expect(sessionForDate(DOMENICA, dopo)?.id).toBe('shadow');
  });

  it('salva due righe sole, una per giorno toccato', () => {
    expect(dopo).toEqual([
      { date: SABATO, sessionId: null },
      { date: DOMENICA, sessionId: 'shadow' },
    ]);
  });

  it('il calendario della scheda non viene riscritto', () => {
    // È il punto: gli spostamenti sono un secondo strato, non una modifica al
    // programma. Senza questo, spostare una seduta una volta la sposterebbe
    // per sempre, in tutte le settimane.
    expect(scheduledForDate(SABATO)?.id).toBe('shadow');
    expect(scheduledForDate(DOMENICA)).toBeNull();
  });

  it('il prossimo allenamento diventa la domenica', () => {
    expect(nextTrainingDay(SABATO, dopo)).toEqual({ date: DOMENICA, weekday: 7, inDays: 1 });
  });

  it('dice che il riposo è sparito: sette giorni di fila', () => {
    const avviso = moveWarning(DOMENICA, dopo);
    expect(avviso?.inARow).toBe(7);
  });

  it('spostare due volte riporta tutto com’era', () => {
    /*
     * È uno scambio, e uno scambio fatto due volte è l'identità. Senza questa
     * proprietà «annullare» avrebbe richiesto un'operazione a parte, che è il
     * modo in cui nascono i calendari che non tornano più indietro.
     */
    expect(sposta(SABATO, DOMENICA, dopo)).toEqual([]);
  });
});

describe('spostare su un giorno occupato', () => {
  const dopo = sposta(GIOVEDI, VENERDI);

  it('le due sedute si scambiano di posto invece di sovrascriversi', () => {
    expect(sessionForDate(GIOVEDI, dopo)?.id).toBe('lower-b');
    expect(sessionForDate(VENERDI, dopo)?.id).toBe('upper-b');
  });

  it('nessuna seduta della settimana sparisce', () => {
    const settimana = ['2026-09-21', '2026-09-22', '2026-09-23', GIOVEDI, VENERDI, SABATO].map(
      (giorno) => sessionForDate(giorno, dopo)?.id,
    );
    expect([...settimana].sort()).toEqual(
      ['upper-a', 'lower-a', 'zona-2', 'upper-b', 'lower-b', 'shadow'].sort(),
    );
  });

  it('avverte quando due giorni di fila caricano gli stessi gruppi', () => {
    const avviso = moveWarning(VENERDI, dopo);
    // Il giovedì diventa Lower B e il venerdì Upper B: niente in comune.
    expect(avviso?.backToBack).toEqual([]);

    /*
     * Il programma alterna alto e basso apposta, quindi due giorni vicini non
     * si sovrappongono quasi mai: il Lower A del martedì e l'Upper B del
     * giovedì non hanno un solo gruppo in comune. Per farli scontrare bisogna
     * mettere l'Upper B di martedì, subito dopo l'Upper A del lunedì.
     */
    const attaccato = sposta(GIOVEDI, MARTEDI);
    expect(sessionForDate('2026-09-21', attaccato)?.id).toBe('upper-a');
    expect(sessionForDate(MARTEDI, attaccato)?.id).toBe('upper-b');
    expect(moveWarning(MARTEDI, attaccato)?.backToBack.length).toBeGreaterThan(0);
  });
});

describe('righe che non servono', () => {
  it('spostare un giorno su sé stesso non scrive niente', () => {
    expect(swapDays(SABATO, SABATO)).toEqual([]);
  });

  it('una riga uguale al calendario non viene salvata', () => {
    /*
     * Altrimenti il database si riempirebbe di righe che dicono «qui c'è
     * quello che ci sarebbe comunque», e `isMoved` non saprebbe più
     * distinguere un giorno spostato da uno normale.
     */
    const inutile: SessionMove[] = [{ date: SABATO, sessionId: 'shadow' }];
    expect(applyMoves(inutile, [])).toEqual([]);
    expect(isMoved(SABATO, inutile)).toBe(false);
  });

  it('riconosce un giorno davvero spostato', () => {
    expect(isMoved(DOMENICA, sposta(SABATO, DOMENICA))).toBe(true);
    expect(isMoved(LUNEDI, sposta(SABATO, DOMENICA))).toBe(false);
  });
});

describe('gruppi muscolari in comune', () => {
  it('trova quelli che due sedute caricano tutte e due', () => {
    const comuni = sharedMuscles(getSession('upper-a'), getSession('upper-b'));
    expect(comuni.length).toBeGreaterThan(0);
  });

  it('due sedute opposte non ne hanno', () => {
    expect(sharedMuscles(getSession('upper-a'), getSession('zona-2'))).toEqual([]);
  });
});
