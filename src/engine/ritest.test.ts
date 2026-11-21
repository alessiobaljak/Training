import { describe, expect, it } from 'vitest';
import { CIRCUIT_SESSIONS } from '../data/circuit.ts';
import { getExercise } from '../data/exercises.ts';
import { initialExerciseState, rigaOtto, startingLevel } from './progression.ts';
import { delGiorno, proposteDeiRitest, propostaRitest, ritestDecisionId, testoEsitoRitest } from './ritest.ts';
import { latestTestResults, testResultSingle } from './ranges.ts';
import type { ExerciseState, LevelIndex, TestResult } from '../types/index.ts';

const TRAZIONI = 'trazioni-prona-presa-media';
const HOLLOW = 'hollow-hold';

const stato = (slug: string, level: LevelIndex, loadKg = 0): ExerciseState => ({
  ...initialExerciseState(getExercise(slug)),
  level,
  loadKg,
});

/** Ritest di settimana 6, sabato 11 aprile 2026. */
const ritest = (testId: TestResult['testId'], value: number, date = '2026-04-11', week = 6): TestResult =>
  testResultSingle(testId, date, week, value);

describe('R9b · un test dopo la settimana 0 può solo far scendere', () => {
  it('9.19 · trazioni, Lt 3 e soglia 8: si scende solo sotto la soglia, mai si sale', () => {
    const casi: [LevelIndex, number, LevelIndex | null][] = [
      [3, 5, 1],
      [3, 9, null],
      [5, 9, null],
      [1, 5, null],
      [5, 5, 1],
      [3, 0, 1],
      [1, 0, null],
    ];
    for (const [L, M, atteso] of casi) {
      const proposta = propostaRitest(TRAZIONI, stato(TRAZIONI, L), ritest('pull-up', M));
      expect(proposta?.verdict.stateAfter.level ?? null, `L=${String(L)} M=${String(M)}`).toBe(atteso);
    }
    /* Test non fatto: nessun risultato, nessuna proposta. */
    expect(proposteDeiRitest(new Map(), (slug) => stato(slug, 3), new Set())).toEqual([]);
  });

  it('9.20 · trazioni al 6 con 5 kg, M=5: al gradino 1 senza zavorra, e il testo lo dice', () => {
    const proposta = propostaRitest(TRAZIONI, stato(TRAZIONI, 6, 5), ritest('pull-up', 5));
    expect(proposta?.verdict.stateAfter).toEqual(
      expect.objectContaining({ level: 1, loadKg: 0, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    );
    expect(proposta?.verdict.change).toBe(
      'Livello 6 → 1. Tempo e pause tornano a quelli della scheda; la zavorra si toglie, perché si mette solo all’ultimo gradino.',
    );
  });

  it('9.21 · hollow hold al 3: 30″ scende al 2, 40″ niente', () => {
    expect(propostaRitest(HOLLOW, stato(HOLLOW, 3), ritest('hollow-hold', 30))?.verdict.stateAfter.level).toBe(2);
    expect(propostaRitest(HOLLOW, stato(HOLLOW, 3), ritest('hollow-hold', 40))).toBeNull();
  });

  it('9.22 · stessi esiti in un ritest di settimana 6 e in un test fuori programma; cambia la fonte', () => {
    const sei = propostaRitest(TRAZIONI, stato(TRAZIONI, 3), ritest('pull-up', 5));
    const libero = propostaRitest(TRAZIONI, stato(TRAZIONI, 3), ritest('pull-up', 5, '2026-03-10', 2));
    expect(sei?.verdict.stateAfter.level).toBe(1);
    expect(libero?.verdict.stateAfter.level).toBe(1);
    expect(sei?.verdict.evidence).toBe(
      'Test di settimana 6, sabato 11 aprile: 5 al test Trazioni prona (pull-up), al livello 3. Per il range di Seduta 1 · A1 (6-8) ne servono almeno 8: il livello 3 oggi è troppo alto.',
    );
    expect(libero?.verdict.evidence.startsWith('Test del 10 marzo: 5 al test')).toBe(true);
    const zero = propostaRitest(TRAZIONI, stato(TRAZIONI, 3), ritest('pull-up', 0));
    expect(zero?.verdict.evidence).toBe(
      'Test di settimana 6, sabato 11 aprile: 0 al test Trazioni prona (pull-up). Il livello 3 oggi è troppo alto: si riparte dal primo gradino.',
    );
  });

  it('9.23 · la proposta: titolo, leva, id, stato dopo', () => {
    const proposta = propostaRitest(TRAZIONI, stato(TRAZIONI, 3), ritest('pull-up', 5));
    expect(proposta?.id).toBe('ritest-2026-04-11:trazioni-prona-presa-media');
    expect(proposta?.verdict).toEqual(
      expect.objectContaining({ kind: 'riparti-dal-test', lever: 'variant' }),
    );
    expect(proposta?.verdict.title.startsWith('Riparti dal livello 1: ')).toBe(true);
    expect(proposta?.verdict.stateAfter).toEqual(
      expect.objectContaining({ level: 1, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 }),
    );
  });

  it('9.24 · una proposta già decisa non si ripropone', () => {
    const tests = latestTestResults([ritest('pull-up', 5)]);
    const decise = new Set([ritestDecisionId('2026-04-11', TRAZIONI)]);
    expect(proposteDeiRitest(tests, (slug) => stato(slug, 3), decise).map((p) => p.verdict.exercise)).not.toContain(TRAZIONI);
  });

  it('9.25 · trazioni rifatte il giorno dopo con 9: la proposta del primo test sparisce', () => {
    const prima = latestTestResults([ritest('pull-up', 5)]);
    expect(proposteDeiRitest(prima, (slug) => stato(slug, 3), new Set()).map((p) => p.verdict.exercise)).toContain(TRAZIONI);
    const dopo = latestTestResults([ritest('pull-up', 5), ritest('pull-up', 9, '2026-04-12')]);
    expect(proposteDeiRitest(dopo, (slug) => stato(slug, 3), new Set()).map((p) => p.verdict.exercise)).not.toContain(TRAZIONI);
  });

  it('la settimana 0 non propone niente, e un esercizio mai fatto resta un punto di partenza', () => {
    expect(propostaRitest(TRAZIONI, stato(TRAZIONI, 3), ritest('pull-up', 5, '2026-03-01', 0))).toBeNull();
    /* Mai fatto: lo stato si calcola dai test più recenti, già bassi. Niente da proporre. */
    const tests = latestTestResults([ritest('pull-up', 5)]);
    const calcolato = initialExerciseState(getExercise(TRAZIONI), tests);
    expect(propostaRitest(TRAZIONI, calcolato, ritest('pull-up', 5))).toBeNull();
  });

  it('mai una salita, su tutti gli esercizi e tutti i valori', () => {
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        const riga = rigaOtto(getExercise(block.exercise));
        if (riga === null) continue;
        for (const L of [1, 2, 3, 4, 5, 6] as LevelIndex[]) {
          for (let M = 0; M <= 60; M += 1) {
            const p = propostaRitest(block.exercise, stato(block.exercise, L), ritest(riga.testId, M));
            if (p !== null) expect(p.verdict.stateAfter.level ?? 0, `${block.exercise} L=${String(L)} M=${String(M)}`).toBeLessThan(L);
          }
        }
      }
    }
  });

  it('coerenza con R1: sotto la soglia `startingLevel` dà `giù(Lt)`, sopra `Lt`, a zero il primo gradino', () => {
    for (const session of CIRCUIT_SESSIONS) {
      for (const block of session.blocks) {
        const exercise = getExercise(block.exercise);
        const riga = rigaOtto(exercise);
        if (riga === null) continue;
        const con = (value: number) => startingLevel(exercise, latestTestResults([ritest(riga.testId, value, '2026-03-01', 0)]));
        expect(con(riga.soglia), exercise.slug).toBe(riga.livelloTest);
        expect(con(riga.soglia - 1), exercise.slug).toBe(riga.giu);
        expect(con(0), exercise.slug).toBe(riga.primo);
      }
    }
  });

  it('l’esito del ritest nella schermata dei test, al posto di «parti da …»', () => {
    const statoDi = (slug: string) => stato(slug, 3);
    expect(testoEsitoRitest(ritest('pull-up', 5), statoDi)).toMatch(/^5 · sotto 8: ti propongo .+\.$/);
    expect(testoEsitoRitest(ritest('pull-up', 9), statoDi)).toBe('9 · nessun gradino da abbassare.');
    expect(testoEsitoRitest(ritest('hollow-hold', 30), statoDi)).toMatch(/^30″ · sotto 36″: ti propongo /);
    /* Il nordic non lo legge nessuna seduta: resta il testo di sempre. */
    expect(testoEsitoRitest(ritest('nordic-curl', 2), statoDi)).toBeNull();
  });

  it('«del 10 marzo», ma «dell’8», «dell’11» e «dell’1»', () => {
    expect(delGiorno('2026-03-10')).toBe('del 10 marzo');
    expect(delGiorno('2026-03-08')).toBe('dell’8 marzo');
    expect(delGiorno('2026-04-11')).toBe('dell’11 aprile');
    expect(delGiorno('2026-06-01')).toBe('dell’1 giugno');
    expect(propostaRitest(TRAZIONI, stato(TRAZIONI, 3), ritest('pull-up', 5, '2026-03-11', 2))?.verdict.evidence.startsWith('Test dell’11 marzo: ')).toBe(true);
  });
});
