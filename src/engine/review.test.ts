import { describe, expect, it } from 'vitest';
import { MIN_SESSIONS_FOR_VERDICT, MIN_SETS_FOR_VERDICT, reviewWeek } from './review.ts';
import type { WeeklyReview } from './review.ts';
import { initialExerciseState } from './progression.ts';
import { latestTestResults, testResultSingle } from './ranges.ts';
import { programWeek, weekEndDate } from './schedule.ts';
import { addDays } from './dates.ts';
import { getExercise } from '../data/exercises.ts';
import { loggedExercise, perSideSets, set, sets } from './__fixtures.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  SessionId,
  TestResult,
} from '../types/index.ts';

/**
 * Revisione di fine settimana con R8 (training/PROGRESS_REVIEW.md §6, D-16) e
 * le regole di R5, R6, R7 in revisione (PROGRESSION_RULES.md §9).
 *
 * Ogni esercizio allenato nella settimana W si giudica sulle sue ultime due
 * sedute chiuse, se sono allo stato attuale, cadono nei 14 giorni fino alla
 * fine di W e hanno almeno tre serie vere. I numeri dei casi sono quelli delle
 * tabelle del designer; la base è un programma che parte lunedì 2 marzo 2026.
 */

const INIZIO = '2026-03-02';
const fine = (week: number): string => weekEndDate(INIZIO, week);

const PUSH = 'push-up';
const BULGARIAN = 'bulgarian-split-squat';
const TRAZIONI = 'trazioni-prona-presa-media';
const DIP = 'dip-parallele-anelli';
const MARTELLO = 'curl-martello-manubri';
const TRX = 'rematore-inverso-trx';
const SWING = 'kb-swing';

const BLOCCO: Record<string, { sessionId: SessionId; code: string }> = {
  [PUSH]: { sessionId: 'circuito-3', code: 'A2' },
  [BULGARIAN]: { sessionId: 'circuito-1', code: 'A2' },
  [TRAZIONI]: { sessionId: 'circuito-1', code: 'A1' },
  [DIP]: { sessionId: 'circuito-1', code: 'A3' },
  [MARTELLO]: { sessionId: 'circuito-1', code: 'B1' },
  [TRX]: { sessionId: 'circuito-2', code: 'A3' },
  [SWING]: { sessionId: 'circuito-1', code: 'F1' },
};

let progressivo = 0;

function voce(
  slug: ExerciseSlug,
  valori: readonly number[] | readonly LoggedSet[],
  options: { level?: LevelIndex | null; tempo?: boolean | null; loadKg?: number } = {},
): LoggedExercise {
  const blocco = BLOCCO[slug];
  if (blocco === undefined) throw new Error(`Blocco sconosciuto per ${slug}`);
  const righe =
    typeof valori[0] === 'number' || valori.length === 0
      ? sets(valori as readonly number[], options.loadKg ?? 0)
      : [...(valori as readonly LoggedSet[])];
  const exercise = getExercise(slug);
  return {
    ...loggedExercise(slug, righe, {
      blockCode: blocco.code,
      ...(options.tempo === undefined ? {} : { tempoRespected: options.tempo }),
    }),
    level: options.level === undefined ? (exercise.pattern === null ? null : 2) : options.level,
  };
}

function seduta(
  date: string,
  voci: readonly LoggedExercise[],
  status: LoggedSession['status'] = 'completed',
): LoggedSession {
  const slug = voci[0]?.exercise ?? PUSH;
  progressivo += 1;
  return {
    id: `${date}-${String(progressivo).padStart(3, '0')}`,
    date,
    week: programWeek(INIZIO, date),
    sessionId: BLOCCO[slug]?.sessionId ?? 'circuito-3',
    status,
    exercises: [...voci],
    note: null,
  };
}

function stato(slug: ExerciseSlug, parziale: Partial<ExerciseState> = {}): ExerciseState {
  const exercise = getExercise(slug);
  return {
    ...initialExerciseState(exercise),
    level: exercise.pattern === null ? null : 2,
    ...parziale,
  };
}

const TEST_PIENI = latestTestResults([
  testResultSingle('pull-up', '2026-02-23', 0, 12),
  testResultSingle('dip', '2026-02-23', 0, 12),
  testResultSingle('push-up', '2026-02-23', 0, 30),
  testResultSingle('bulgarian-split-squat', '2026-02-23', 0, 12),
  testResultSingle('inverted-row-trx', '2026-02-23', 0, 18),
]);

function rivedi(
  week: number,
  sessions: readonly LoggedSession[],
  stati: readonly ExerciseState[],
  options: { today?: string; tests?: ReadonlyMap<TestResult['testId'], TestResult> } = {},
): WeeklyReview {
  return reviewWeek({
    week,
    sessions,
    states: new Map(stati.map((entry) => [entry.exercise, entry])),
    tests: options.tests ?? TEST_PIENI,
    weekEnd: fine(week),
    today: options.today ?? addDays(fine(week), 1),
  });
}

/** R7 fuori dai piedi: una seduta al gradino tre settimane prima. */
const storia = (slug: ExerciseSlug, level: LevelIndex | null = 2, date = '2026-02-09') =>
  seduta(date, [voce(slug, [1, 1, 1], { level })]);

const S = (values: readonly number[], level: LevelIndex | null = 2) => voce(PUSH, values, { level });

describe('R8 · quanto serve per un verdetto', () => {
  it('le costanti di S4', () => {
    expect(MIN_SESSIONS_FOR_VERDICT).toBe(2);
    expect(MIN_SETS_FOR_VERDICT).toBe(3);
  });

  it('8.1 · caso 4d: una seduta sola, due serie per lato, non dà un verdetto', () => {
    const r = rivedi(2, [seduta('2026-03-11', [voce(BULGARIAN, perSideSets([[13, 13], [13, 13]]))])], [stato(BULGARIAN)]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.pocheProve).toEqual([
      expect.objectContaining({ exercise: BULGARIAN, sedute: 1, serie: 2, level: 2 }),
    ]);
  });

  it('8.2 e 8.12 · due sedute a cavallo di due settimane: 4 serie vere, si sale', () => {
    const r = rivedi(
      2,
      [
        storia(BULGARIAN),
        seduta('2026-03-04', [voce(BULGARIAN, perSideSets([[13, 13], [13, 13]]))]),
        seduta('2026-03-11', [voce(BULGARIAN, perSideSets([[13, 13], [13, 13]]))]),
      ],
      [stato(BULGARIAN)],
    );
    expect(r.verdicts[0]?.kind).toBe('sali-di-livello');
    expect(r.verdicts[0]?.stateAfter.level).toBe(3);
    expect(r.setsCounted).toBe(4);
    expect(r.finestra).toEqual({ dal: '2026-03-02', al: '2026-03-15' });
    /* I numeri vanno citati: un giudizio senza le sue prove non si può contestare. */
    expect(r.verdicts[0]?.evidence).toContain('Ultime due sedute al livello 2');
    expect(r.verdicts[0]?.evidence).toContain('13-13-13-13');
  });

  it('8.3 · tre serie in una seduta sola non bastano', () => {
    const r = rivedi(2, [seduta('2026-03-11', [S([19, 19, 19])])], [stato(PUSH)]);
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 1, serie: 3 }));
  });

  it('8.4 · due sedute con una serie ciascuna non bastano', () => {
    const r = rivedi(2, [seduta('2026-03-04', [S([19])]), seduta('2026-03-11', [S([19])])], [stato(PUSH)]);
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 2, serie: 2 }));
  });

  it('8.5 · due sedute sotto il minimo: si scende, anche senza R7', () => {
    const r = rivedi(2, [seduta('2026-03-04', [S([9, 9])]), seduta('2026-03-11', [S([9])])], [stato(PUSH)]);
    expect(r.verdicts[0]?.kind).toBe('scendi-di-livello');
    expect(r.verdicts[0]?.stateAfter.level).toBe(1);
  });

  it('8.6 · una serie con un lato solo non conta e non entra nei valori', () => {
    const prima = [...perSideSets([[13, 13]]), set(2, 13, { side: 'left' })];
    const r = rivedi(
      2,
      [seduta('2026-03-04', [voce(BULGARIAN, prima)]), seduta('2026-03-11', [voce(BULGARIAN, perSideSets([[13, 13]]))])],
      [stato(BULGARIAN)],
    );
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 2, serie: 2 }));
  });

  it('8.7 · le sedute in corso non esistono per nessun conto', () => {
    const r = rivedi(
      2,
      [seduta('2026-03-09', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])], 'in-progress')],
      [stato(PUSH)],
    );
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 1 }));

    const bis = rivedi(
      2,
      [seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])], 'in-progress')],
      [stato(PUSH)],
    );
    expect(bis.pocheProve).toHaveLength(0);
    expect(bis.verdicts).toHaveLength(0);
  });

  it('8.8 · una seduta abbandonata in mezzo non spezza la coppia', () => {
    const r = rivedi(
      2,
      [
        storia(PUSH),
        seduta('2026-03-04', [S([19, 19, 19])]),
        seduta('2026-03-08', [S([2])], 'abandoned'),
        seduta('2026-03-11', [S([19, 19, 19])]),
      ],
      [stato(PUSH)],
    );
    expect(r.verdicts[0]?.kind).toBe('sali-di-livello');
  });

  it('8.9 · la finitura non si giudica e non fa numero', () => {
    const swing = (date: string) => seduta(date, [voce(SWING, [20, 20], { loadKg: 16 })]);
    const r = rivedi(2, [swing('2026-03-04'), swing('2026-03-11')], [stato(SWING, { loadKg: 16 })]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.pocheProve).toHaveLength(0);
    expect(r.alMassimo).toHaveLength(0);
    expect(r.setsCounted).toBe(0);
  });

  it('8.10 · numeri fatti a un altro gradino non dicono niente su quello attuale', () => {
    const t = (date: string) => seduta(date, [voce(TRAZIONI, [9, 9, 9], { level: 1 })]);
    const r = rivedi(2, [t('2026-03-04'), t('2026-03-11')], [stato(TRAZIONI, { level: 3 })]);
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 0, level: 3 }));
  });

  it('8.11 · numeri fatti a un altro carico: nessun secondo +2,5 kg', () => {
    const c = (date: string) => seduta(date, [voce(MARTELLO, [10, 10, 10], { loadKg: 10 })]);
    const r = rivedi(2, [c('2026-03-04'), c('2026-03-11')], [stato(MARTELLO, { loadKg: 12.5 })]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 0, loadKg: 12.5 }));
  });

  it('8.13 e 8.14 · la finestra è di 14 giorni fino alla fine della settimana, estremi compresi', () => {
    const fuori = rivedi(3, [seduta('2026-03-08', [S([19, 19, 19])]), seduta('2026-03-18', [S([19, 19, 19])])], [stato(PUSH)]);
    expect(fuori.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 1 }));

    const dentro = rivedi(
      3,
      [storia(PUSH), seduta('2026-03-09', [S([19, 19, 19])]), seduta('2026-03-18', [S([19, 19, 19])])],
      [stato(PUSH)],
    );
    expect(dentro.verdicts[0]?.kind).toBe('sali-di-livello');
  });

  it('8.15 · le ultime due, non le ultime due buone', () => {
    const r = rivedi(
      3,
      [
        seduta('2026-03-04', [S([19, 19, 19], 3)]),
        seduta('2026-03-11', [S([19, 19, 19], 2)]),
        seduta('2026-03-18', [S([19, 19, 19], 3)]),
      ],
      [stato(PUSH, { level: 3 })],
    );
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 1, level: 3 }));
  });

  it('8.17 e 8.18 · dopo «Lascia com’è» si rilegge, dopo «Applica» no', () => {
    const base = [storia(PUSH), seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])];

    const lasciato = rivedi(3, [...base, seduta('2026-03-18', [S([19, 19, 19])])], [stato(PUSH)]);
    expect(lasciato.verdicts[0]?.kind).toBe('sali-di-livello');

    const applicato = rivedi(3, [...base, seduta('2026-03-18', [S([19, 19, 19], 3)])], [stato(PUSH, { level: 3 })]);
    expect(applicato.verdicts).toHaveLength(0);
    expect(applicato.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 1, level: 3 }));
  });

  it('8.19 · un esercizio già rifatto dopo la fine della settimana va nei rimandati', () => {
    const r = rivedi(
      2,
      [storia(PUSH), seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])]), seduta('2026-03-16', [S([19, 19, 19])])],
      [stato(PUSH)],
      { today: '2026-03-17' },
    );
    expect(r.verdicts).toHaveLength(0);
    expect(r.rimandati).toEqual([expect.objectContaining({ exercise: PUSH, date: '2026-03-16' })]);
  });

  it('8.20 e 8.21 · in corso prima della fine, scaduta dopo una settimana', () => {
    const sedute = [storia(PUSH), seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])];
    const scaduta = rivedi(2, sedute, [stato(PUSH)], { today: '2026-03-23' });
    expect(scaduta.stato).toBe('scaduta');
    expect(scaduta.verdicts).toHaveLength(0);
    expect(scaduta.pocheProve).toHaveLength(0);

    const inCorso = rivedi(2, sedute, [stato(PUSH)], { today: '2026-03-15' });
    expect(inCorso.stato).toBe('in-corso');
    expect(inCorso.verdicts).toHaveLength(0);

    expect(rivedi(2, sedute, [stato(PUSH)], { today: '2026-03-22' }).stato).toBe('aperta');
  });

  it('8.22 · aperta lunedì o domenica, la revisione legge gli stessi numeri', () => {
    const sedute = [storia(PUSH), seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])];
    const lunedi = rivedi(2, sedute, [stato(PUSH)], { today: '2026-03-16' });
    const domenica = rivedi(2, sedute, [stato(PUSH)], { today: '2026-03-22' });
    expect(domenica.verdicts.map((v) => v.evidence)).toEqual(lunedi.verdicts.map((v) => v.evidence));
  });

  it('8.23 · R7 su oggi: in attesa lunedì, salita quando arriva il quattordicesimo giorno', () => {
    const sedute = [seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])];
    const lunedi = rivedi(2, sedute, [stato(PUSH)], { today: '2026-03-16' });
    expect(lunedi.verdicts).toHaveLength(0);
    expect(lunedi.inAttesa[0]).toEqual(expect.objectContaining({ inizio: '2026-03-04', dal: '2026-03-18' }));

    const mercoledi = rivedi(2, sedute, [stato(PUSH)], { today: '2026-03-18' });
    expect(mercoledi.verdicts[0]?.kind).toBe('sali-di-livello');
  });

  it('8.24 · una seduta di scarico nella coppia ferma gli aumenti, non la discesa', () => {
    const sopra = rivedi(
      7,
      [storia(PUSH), seduta('2026-04-08', [S([19, 19])]), seduta('2026-04-15', [S([19, 19, 19])])],
      [stato(PUSH)],
    );
    expect(sopra.verdicts).toHaveLength(0);
    expect(sopra.fermi[0]).toEqual(expect.objectContaining({ motivo: 'scarico-coppia' }));

    const sotto = rivedi(7, [seduta('2026-04-08', [S([9, 9])]), seduta('2026-04-15', [S([9, 9, 9])])], [stato(PUSH)]);
    expect(sotto.verdicts[0]?.kind).toBe('scendi-di-livello');
  });

  it('8.26 · serie per lato sommate sulle due sedute', () => {
    const r = rivedi(
      2,
      [
        seduta('2026-03-04', [voce(BULGARIAN, perSideSets([[7, 7], [7, 7]]))]),
        seduta('2026-03-11', [voce(BULGARIAN, perSideSets([[7, 7]]))]),
      ],
      [stato(BULGARIAN)],
    );
    expect(r.verdicts[0]?.kind).toBe('scendi-di-livello');
    expect(r.setsCounted).toBe(3);
  });

  it('8.27 · due sedute chiuse lo stesso giorno contano due', () => {
    const r = rivedi(
      2,
      [storia(PUSH), seduta('2026-03-11', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])],
      [stato(PUSH)],
    );
    expect(r.verdicts[0]?.kind).toBe('sali-di-livello');
  });

  it('8.28 · caso 4c sul circuito: una seduta a settimana, una salita sola in quattro settimane', () => {
    const w1 = seduta('2026-03-04', [S([19, 19, 19])]);
    const w2 = seduta('2026-03-11', [S([19, 19, 19])]);
    const w3 = seduta('2026-03-18', [S([19, 19, 19])]);

    expect(rivedi(1, [w1], [stato(PUSH)]).pocheProve).toHaveLength(1);
    expect(rivedi(2, [w1, w2], [stato(PUSH)]).inAttesa[0]?.dal).toBe('2026-03-18');
    const terza = rivedi(3, [w1, w2, w3], [stato(PUSH)]);
    expect(terza.verdicts[0]?.kind).toBe('sali-di-livello');

    /* Salita accettata: la quarta settimana si fa al 3. */
    const w4 = seduta('2026-03-25', [S([19, 19, 19], 3)]);
    const quarta = rivedi(4, [w1, w2, w3, w4], [stato(PUSH, { level: 3 })]);
    expect(quarta.verdicts).toHaveLength(0);
    expect(quarta.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 1, level: 3 }));
  });

  it('una serie storta in mezzo a due buone non è un gradino sbagliato', () => {
    const r = rivedi(2, [seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 5, 19])])], [stato(PUSH)]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.inRange).toContain(getExercise(PUSH).name);
  });

  it('senza stato salvato si parte dallo stato iniziale dell’esercizio, test compresi', () => {
    const iniziale = initialExerciseState(getExercise(PUSH), TEST_PIENI);
    const r = rivedi(
      2,
      [seduta('2026-03-04', [S([9, 9], iniziale.level)]), seduta('2026-03-11', [S([9], iniziale.level)])],
      [],
    );
    expect(r.verdicts[0]?.stateBefore).toEqual(iniziale);
  });
});

describe('R5 in revisione · una sola regola di avanzamento', () => {
  const trx = (date: string, tempo: boolean | null, values: readonly number[] = [11, 11, 11]) =>
    seduta(date, [voce(TRX, values, { tempo })]);
  const conStoria = (...sedute: LoggedSession[]) => [storia(TRX, 2, '2026-03-02'), ...sedute];

  it('5.1 · sì e sì: si sale', () => {
    const r = rivedi(2, conStoria(trx('2026-03-10', true), trx('2026-03-13', true)), [stato(TRX)]);
    expect(r.verdicts[0]?.kind).toBe('sali-di-livello');
    expect(r.verdicts[0]?.caution).not.toContain('tempo');
  });

  it('5.2 · un no: rifai al tempo giusto, stato invariato', () => {
    const r = rivedi(2, conStoria(trx('2026-03-10', true), trx('2026-03-13', false)), [stato(TRX)]);
    expect(r.verdicts[0]?.kind).toBe('rifai-al-tempo-giusto');
    expect(r.verdicts[0]?.stateAfter).toEqual(r.verdicts[0]?.stateBefore);
  });

  it('5.3 · una risposta mancante: rispondi sul tempo', () => {
    const r = rivedi(2, conStoria(trx('2026-03-10', true), trx('2026-03-13', null)), [stato(TRX)]);
    expect(r.verdicts[0]?.kind).toBe('rispondi-sul-tempo');
    expect(r.verdicts[0]?.stateAfter).toEqual(r.verdicts[0]?.stateBefore);
  });

  it('5.4 · il no vince sul null', () => {
    const r = rivedi(2, conStoria(trx('2026-03-10', false), trx('2026-03-13', null)), [stato(TRX)]);
    expect(r.verdicts[0]?.kind).toBe('rifai-al-tempo-giusto');
  });

  it('5.6 · la discesa non passa dal cancello del tempo', () => {
    const r = rivedi(2, conStoria(trx('2026-03-10', false, [7, 7, 7]), trx('2026-03-13', false, [7, 7, 7])), [stato(TRX)]);
    expect(r.verdicts[0]?.kind).toBe('scendi-di-livello');
  });

  it('5.7 · con la settimana dopo di scarico, nessun aumento', () => {
    const r = rivedi(5, [storia(TRX, 2, '2026-03-16'), trx('2026-03-31', true), trx('2026-04-03', true)], [stato(TRX)]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'scarico' }));
  });

  it('5.8 · manubri al massimo senza risposta sul tempo: nessun +2,5 kg', () => {
    const c = (date: string, tempo: boolean | null) => seduta(date, [voce(MARTELLO, [10, 10, 10], { tempo })]);
    const r = rivedi(4, [c('2026-03-17', true), c('2026-03-24', null)], [stato(MARTELLO)]);
    expect(r.verdicts[0]?.kind).toBe('rispondi-sul-tempo');
  });

  it('5.13 e 5.14 · lo scarico ferma solo le coppie che lo contengono', () => {
    const conScarico = rivedi(7, [storia(TRX, 2, '2026-03-16'), trx('2026-04-08', true, [11, 11]), trx('2026-04-15', true)], [stato(TRX)]);
    expect(conScarico.fermi[0]?.testo).toContain('Una delle due sedute lette è di scarico');

    const senza = rivedi(7, [storia(TRX, 2, '2026-03-16'), trx('2026-04-13', true), trx('2026-04-16', true)], [stato(TRX)]);
    expect(senza.verdicts[0]?.kind).toBe('sali-di-livello');
  });

  it('5.15 · un no pesa su due revisioni consecutive', () => {
    const sedute = conStoria(
      trx('2026-03-05', true),
      trx('2026-03-12', false),
      trx('2026-03-19', true),
      trx('2026-03-26', true),
    );
    expect(rivedi(2, sedute.slice(0, 3), [stato(TRX)]).verdicts[0]?.kind).toBe('rifai-al-tempo-giusto');
    expect(rivedi(3, sedute.slice(0, 4), [stato(TRX)]).verdicts[0]?.kind).toBe('rifai-al-tempo-giusto');
    expect(rivedi(4, sedute, [stato(TRX)]).verdicts[0]?.kind).toBe('sali-di-livello');
  });
});

describe('R6 in revisione · prima la variante, poi la zavorra', () => {
  const t = (date: string, values: readonly number[], level: LevelIndex) =>
    seduta(date, [voce(TRAZIONI, values, { level })]);

  it('6.1 · caso 4b: al gradino 1 con il massimo toccato, niente zavorra', () => {
    const r = rivedi(3, [t('2026-03-11', [8, 8, 8], 1), t('2026-03-18', [8, 8, 8], 1)], [stato(TRAZIONI, { level: 1 })]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'tempo' }));
  });

  it('6.2 e 6.3 · al gradino 1 sopra il massimo si sale a 3, se R7 lo consente', () => {
    const sedute = [t('2026-03-11', [9, 9, 9], 1), t('2026-03-18', [9, 9, 9], 1)];
    const libera = rivedi(3, [t('2026-03-02', [9, 9, 9], 1), ...sedute], [stato(TRAZIONI, { level: 1 })]);
    expect(libera.verdicts[0]?.stateAfter.level).toBe(3);

    const attesa = rivedi(3, sedute, [stato(TRAZIONI, { level: 1 })]);
    expect(attesa.verdicts).toHaveLength(0);
    expect(attesa.inAttesa).toHaveLength(1);
    expect(attesa.alMassimo).toHaveLength(0);
  });

  const cima = [t('2026-03-18', [8, 8, 8], 6), t('2026-03-25', [8, 8, 8], 6)];
  const conTest = (value: number | null) =>
    latestTestResults(value === null ? [] : [testResultSingle('pull-up', '2026-02-23', 0, value)]);

  it('6.4 · all’ultimo gradino con il test sopra la soglia, la zavorra', () => {
    const r = rivedi(4, cima, [stato(TRAZIONI, { level: 6 })], { tests: conTest(12) });
    expect(r.verdicts[0]?.kind).toBe('aggiungi-peso');
    expect(r.verdicts[0]?.stateAfter.loadKg).toBe(2.5);
  });

  it('6.5 · con il test sotto la soglia, niente zavorra e il perché', () => {
    const r = rivedi(4, cima, [stato(TRAZIONI, { level: 6 })], { tests: conTest(6) });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'soglia' }));
    expect(r.alMassimo[0]?.testo).toContain('Ultimo test: 6');
    expect(r.alMassimo[0]?.testo).toContain('8');
  });

  it('6.6 · senza test, niente zavorra', () => {
    const r = rivedi(4, cima, [stato(TRAZIONI, { level: 6 })], { tests: conTest(null) });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'nessun-test' }));
  });

  it('6.7 · nella settimana in cui la zavorra è ancora bloccata', () => {
    const r = rivedi(
      1,
      [t('2026-02-25', [8, 8, 8], 6), t('2026-03-04', [8, 8, 8], 6)],
      [stato(TRAZIONI, { level: 6 })],
      { tests: conTest(12) },
    );
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'settimana' }));
  });

  it('6.10 · dip all’ultimo gradino con 9 al test: sotto la soglia di 10', () => {
    const d = (date: string) => seduta(date, [voce(DIP, [9, 9, 9], { level: 6 })]);
    const r = rivedi(
      4,
      [d('2026-03-18'), d('2026-03-25')],
      [stato(DIP, { level: 6 })],
      { tests: latestTestResults([testResultSingle('dip', '2026-02-23', 0, 9)]) },
    );
    expect(r.verdicts.filter((v) => v.kind === 'aggiungi-peso')).toHaveLength(0);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'soglia' }));
  });

  it('6.11 · sui manubri la leva è il peso', () => {
    const c = (date: string) => seduta(date, [voce(MARTELLO, [10, 10, 10], { loadKg: 10 })]);
    const r = rivedi(4, [c('2026-03-17'), c('2026-03-24')], [stato(MARTELLO, { loadKg: 10 })]);
    expect(r.verdicts[0]?.kind).toBe('aggiungi-peso');
    expect(r.verdicts[0]?.stateAfter.loadKg).toBe(12.5);
    expect(r.verdicts[0]?.stateAfter.level).toBeNull();
  });
});

describe('R7 in revisione · un gradino ogni due settimane', () => {
  it('7.1 · dopo sette giorni al gradino, in attesa', () => {
    const r = rivedi(1, [seduta('2026-03-02', [S([19, 19, 19])]), seduta('2026-03-05', [S([19, 19, 19])])], [stato(PUSH)], { today: '2026-03-09' });
    expect(r.inAttesa[0]).toEqual(expect.objectContaining({ inizio: '2026-03-02', dal: '2026-03-16' }));
    expect(r.inAttesa[0]?.testo).toContain('Un gradino ogni due settimane');
  });

  it('7.9 · la discesa non aspetta i 14 giorni', () => {
    const r = rivedi(
      3,
      [seduta('2026-03-17', [S([9, 9, 9], 3)]), seduta('2026-03-19', [S([9, 9, 9], 3)])],
      [stato(PUSH, { level: 3 })],
    );
    expect(r.verdicts[0]?.kind).toBe('scendi-di-livello');
  });
});
