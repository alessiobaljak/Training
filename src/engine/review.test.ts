import { describe, expect, it } from 'vitest';
import { MIN_SETS_FOR_VERDICT, reviewWeek } from './review.ts';
import { initialExerciseState } from './progression.ts';
import { getExercise } from '../data/exercises.ts';
import { loggedExercise, loggedSession, sets } from './__fixtures.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedSession } from '../types/index.ts';

/**
 * Revisione di fine settimana.
 *
 * Il caso che ha fatto nascere questo file: settimana 1 chiusa sopra il
 * massimo del range su ogni serie, e la settimana 2 identica alla settimana 1.
 * Il motore delle leve proponeva solo a fine seduta, una volta, e solo se si
 * rispondeva alla domanda sul tempo.
 */

const CHIN_UP = 'chin-up-presa-supina-stretta';
const ALZATE = 'alzate-laterali-elastico';

function stato(slug: ExerciseSlug, level: LevelIndex | null, loadKg = 0): ExerciseState {
  return { ...initialExerciseState(getExercise(slug)), level, loadKg };
}

function settimana(
  slug: ExerciseSlug,
  blockCode: string,
  values: readonly number[],
  options: { week?: number; tempoRespected?: boolean | null; status?: LoggedSession['status'] } = {},
): LoggedSession {
  const week = options.week ?? 1;
  return loggedSession(
    '2026-01-05',
    week,
    [
      loggedExercise(slug, sets(values), {
        blockCode,
        ...(options.tempoRespected === undefined ? {} : { tempoRespected: options.tempoRespected }),
      }),
    ],
    options.status ?? 'completed',
  );
}

describe('reviewWeek', () => {
  it('propone il livello successivo quando la settimana è andata sopra il massimo su ogni serie', () => {
    // Blocco D: range fisso 6-10 ripetizioni.
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [12, 11, 12])],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    const verdict = review.verdicts[0];
    expect(review.verdicts).toHaveLength(1);
    expect(verdict?.kind).toBe('sali-di-livello');
    expect(verdict?.stateAfter.level).toBe(4);
    // I numeri vanno citati: un giudizio senza le sue prove non si può contestare.
    expect(verdict?.evidence).toContain('12, 11, 12');
    expect(verdict?.evidence).toContain('6-10');
  });

  it('propone il livello precedente quando la settimana è rimasta sotto il minimo su ogni serie', () => {
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [4, 3, 3])],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    /*
     * Al gradino eseguibile sotto, non al 2: il 2 sono le trazioni negative,
     * e su un range fisso a ripetizioni con un secondo di salita non si
     * eseguono. Prima si scendeva lì, cioè a un gesto diverso con il range e
     * il tempo dell'altro.
     */
    const verdict = review.verdicts[0];
    expect(verdict?.kind).toBe('scendi-di-livello');
    expect(verdict?.stateAfter.level).toBe(1);
  });

  it('al gradino più basso non inventa una discesa: dice che è il range da rifare', () => {
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [4, 3, 3])],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 1)]]),
      tests: new Map(),
    });

    const verdict = review.verdicts[0];
    expect(verdict?.kind).toBe('range-da-rifare');
    expect(verdict?.stateAfter).toEqual(verdict?.stateBefore);
  });

  it('sui manubri la leva è il peso, non una scala inventata', () => {
    // Blocco C1: range fisso 15-20, esercizio con carico inerente e senza scala.
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(ALZATE, 'C1', [20, 20, 20, 20])],
      states: new Map([[ALZATE, stato(ALZATE, null, 6)]]),
      tests: new Map(),
    });

    const verdict = review.verdicts[0];
    expect(verdict?.kind).toBe('aggiungi-peso');
    expect(verdict?.stateAfter.loadKg).toBe(8.5);
    expect(verdict?.stateAfter.level).toBeNull();
  });

  it('non propone zavorra nelle settimane in cui è ancora bloccata', () => {
    // Settimana 1 chiusa: quello che decide vale per la 2, dove la zavorra è
    // ancora bloccata. Lo stesso identico risultato in settimana 2 vale per la
    // 3, e lì la leva esiste.
    const numeri = [10, 10, 10];
    const states = new Map([[CHIN_UP, stato(CHIN_UP, 3)]]);

    const bloccata = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', numeri)],
      states,
      tests: new Map(),
    });
    expect(bloccata.verdicts).toHaveLength(0);
    expect(bloccata.alMassimo).toContain('Chin-up presa supina stretta');

    const sbloccata = reviewWeek({
      week: 2,
      sessions: [settimana(CHIN_UP, 'D', numeri, { week: 2 })],
      states,
      tests: new Map(),
    });
    expect(sbloccata.verdicts[0]?.kind).toBe('aggiungi-peso');
  });

  it('una serie storta non è una settimana storta', () => {
    /*
     * Il giudizio si regge sulla parola «tutte»: sopra il massimo su tutte le
     * serie, sotto il minimo su tutte le serie. Una serie andata male in mezzo
     * a due buone è la settimana normale di chiunque, non un gradino
     * sbagliato, e farla valere come tale farebbe scendere di livello per una
     * giornata no.
     */
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [12, 11, 5])],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    expect(review.verdicts).toHaveLength(0);
  });

  it('dentro il range non cambia niente', () => {
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [7, 8, 8])],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    expect(review.verdicts).toHaveLength(0);
    expect(review.inRange).toContain('Chin-up presa supina stretta');
  });

  it('non giudica una settimana con meno di tre serie su quell’esercizio', () => {
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [12, 12])],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    expect(MIN_SETS_FOR_VERDICT).toBe(3);
    expect(review.verdicts).toHaveLength(0);
  });

  it('somma le serie di tutte le sedute della settimana', () => {
    const review = reviewWeek({
      week: 1,
      sessions: [
        settimana(CHIN_UP, 'D', [12, 12]),
        { ...settimana(CHIN_UP, 'D', [11, 12]), id: 'seconda', date: '2026-01-08' },
      ],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    expect(review.setsCounted).toBe(4);
    expect(review.verdicts[0]?.kind).toBe('sali-di-livello');
  });

  it('ignora le sedute di altre settimane e quelle non chiuse', () => {
    const altraSettimana = settimana(CHIN_UP, 'D', [20, 20, 20], { week: 2 });
    const aperta = { ...settimana(CHIN_UP, 'D', [20, 20, 20], { status: 'in-progress' }), id: 'aperta' };

    const review = reviewWeek({
      week: 1,
      sessions: [altraSettimana, aperta],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    expect(review.sessionsCounted).toBe(0);
    expect(review.verdicts).toHaveLength(0);
  });

  it('avverte quando la domanda sul tempo è rimasta senza risposta', () => {
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [12, 11, 12], { tempoRespected: null })],
      states: new Map([[CHIN_UP, stato(CHIN_UP, 3)]]),
      tests: new Map(),
    });

    expect(review.verdicts[0]?.caution).toContain('tempo');
  });

  it('senza stato salvato parte dal livello iniziale dell’esercizio', () => {
    const review = reviewWeek({
      week: 1,
      sessions: [settimana(CHIN_UP, 'D', [12, 11, 12])],
      states: new Map(),
      tests: new Map(),
    });

    const atteso = initialExerciseState(getExercise(CHIN_UP)).level ?? 0;
    expect(review.verdicts[0]?.stateBefore.level).toBe(atteso);
  });
});
