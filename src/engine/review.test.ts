import { describe, expect, it } from 'vitest';
import { MIN_SESSIONS_FOR_VERDICT, MIN_SETS_FOR_VERDICT, reviewWeek } from './review.ts';
import type { WeeklyReview } from './review.ts';
import { evaluateProgression, initialExerciseState } from './progression.ts';
import { durataDellaSedutaDi } from './circuit.ts';
import { resolveBlockRange } from './ranges.ts';
import { getAnySession } from '../data/sessions.ts';
import { latestTestResults, testResultSingle } from './ranges.ts';
import { programWeek, weekEndDate } from './schedule.ts';
import { addDays } from './dates.ts';
import { getExercise } from '../data/exercises.ts';
import { loggedExercise, perSideSets, set, sets } from './__fixtures.ts';
import type {
  DecisioneRegistrata,
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
const PULLOVER = 'pull-over-trx';

const BLOCCO: Record<string, { sessionId: SessionId; code: string }> = {
  [PUSH]: { sessionId: 'circuito-3', code: 'A2' },
  [BULGARIAN]: { sessionId: 'circuito-1', code: 'A2' },
  [TRAZIONI]: { sessionId: 'circuito-1', code: 'A1' },
  [DIP]: { sessionId: 'circuito-1', code: 'A3' },
  [MARTELLO]: { sessionId: 'circuito-1', code: 'B1' },
  [TRX]: { sessionId: 'circuito-2', code: 'A3' },
  [SWING]: { sessionId: 'circuito-1', code: 'F1' },
  [PULLOVER]: { sessionId: 'circuito-3', code: 'A3' },
  'military-press-manubri': { sessionId: 'circuito-4', code: 'A3' },
  'plank-trascinamento-kb': { sessionId: 'circuito-4', code: 'B3' },
  'hip-thrust-panca-bilaterale': { sessionId: 'circuito-4', code: 'A1' },
  'dead-hang': { sessionId: 'circuito-3', code: 'Z1' },
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
  options: {
    today?: string;
    tests?: ReadonlyMap<TestResult['testId'], TestResult>;
    decisioni?: readonly DecisioneRegistrata[];
    durata?: (slug: ExerciseSlug, stati: ReadonlyMap<ExerciseSlug, ExerciseState>) => number | null;
  } = {},
): WeeklyReview {
  return reviewWeek({
    ...(options.durata === undefined ? {} : { durata: options.durata }),
    week,
    sessions,
    states: new Map(stati.map((entry) => [entry.exercise, entry])),
    tests: options.tests ?? TEST_PIENI,
    weekEnd: fine(week),
    today: options.today ?? addDays(fine(week), 1),
    decisioni: options.decisioni ?? [],
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

  it('8.19 → 11.14 · rifatto dopo la fine della settimana e confermato: si giudica, con la conferma', () => {
    const r = rivedi(
      2,
      [storia(PUSH), seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])]), seduta('2026-03-16', [S([19, 19, 19])])],
      [stato(PUSH)],
      { today: '2026-03-17' },
    );
    expect(r.rimandati).toHaveLength(0);
    expect(r.verdicts[0]?.kind).toBe('sali-di-livello');
    expect(r.verdicts[0]?.evidence).toContain('Rifatto lunedì 16 marzo: 19-19-19');
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

  it('8.27 → 12.1 · due sedute chiuse lo stesso giorno contano una', () => {
    const r = rivedi(
      2,
      [storia(PUSH), seduta('2026-03-11', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])],
      [stato(PUSH)],
    );
    expect(r.verdicts).toHaveLength(0);
    expect(r.pocheProve[0]).toEqual(expect.objectContaining({ sedute: 1, stessoGiorno: '2026-03-11' }));
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
  /* R10a: la zavorra arriva solo con tempo e pausa al massimo (eccentrica 5", pausa 2"). */
  const esauriti = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
  const conTest = (value: number | null) =>
    latestTestResults(value === null ? [] : [testResultSingle('pull-up', '2026-02-23', 0, value)]);

  it('6.4 · all’ultimo gradino con il test sopra la soglia, la zavorra', () => {
    const r = rivedi(4, cima, [stato(TRAZIONI, { level: 6, ...esauriti })], { tests: conTest(12) });
    expect(r.verdicts[0]?.kind).toBe('aggiungi-peso');
    expect(r.verdicts[0]?.stateAfter.loadKg).toBe(2.5);
  });

  it('6.5 · con il test sotto la soglia, niente zavorra e il perché', () => {
    const r = rivedi(4, cima, [stato(TRAZIONI, { level: 6, ...esauriti })], { tests: conTest(6) });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'soglia' }));
    expect(r.alMassimo[0]?.testo).toContain('Ultimo test: 6');
    expect(r.alMassimo[0]?.testo).toContain('8');
  });

  it('6.6 · senza test, niente zavorra', () => {
    const r = rivedi(4, cima, [stato(TRAZIONI, { level: 6, ...esauriti })], { tests: conTest(null) });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'nessun-test' }));
  });

  it('6.7 · nella settimana in cui la zavorra è ancora bloccata', () => {
    const r = rivedi(
      1,
      [t('2026-02-25', [8, 8, 8], 6), t('2026-03-04', [8, 8, 8], 6)],
      [stato(TRAZIONI, { level: 6, ...esauriti })],
      { tests: conTest(12) },
    );
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'settimana' }));
  });

  it('6.10 · dip all’ultimo gradino con 9 al test: sotto la soglia di 10', () => {
    const d = (date: string) => seduta(date, [voce(DIP, [9, 9, 9], { level: 6 })]);
    const r = rivedi(
      4,
      [d('2026-03-18'), d('2026-03-25')],
      [stato(DIP, { level: 6, ...esauriti })],
      { tests: latestTestResults([testResultSingle('dip', '2026-02-23', 0, 9)]) },
    );
    expect(r.verdicts.filter((v) => v.kind === 'aggiungi-peso')).toHaveLength(0);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'soglia' }));
  });

  it('6.11 → 10.4 · sui manubri il manubrio successivo arriva dopo tempo e pausa (R10c-1, D-19)', () => {
    const c = (date: string) => seduta(date, [voce(MARTELLO, [10, 10, 10], { loadKg: 10 })]);
    const r = rivedi(4, [c('2026-03-17'), c('2026-03-24')], [stato(MARTELLO, { loadKg: 10, ...esauriti })]);
    expect(r.verdicts[0]?.kind).toBe('aggiungi-peso');
    expect(r.verdicts[0]?.stateAfter).toEqual(
      expect.objectContaining({ loadKg: 12, level: null, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    );
    /* D-19 (b): il manubrio successivo esatto dell'elenco. */
    expect(r.verdicts[0]?.change).toContain('Passa al manubrio da 12 kg');

    /* 10.2: a bonus 0 la prossima leva è il tempo, e la propone la fine seduta. */
    const bonusZero = rivedi(4, [c('2026-03-17'), c('2026-03-24')], [stato(MARTELLO, { loadKg: 10 })]);
    expect(bonusZero.verdicts).toHaveLength(0);
    expect(bonusZero.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'tempo' }));
    expect(bonusZero.alMassimo[0]?.testo).toContain('da 3" a 4"');
  });

  it('10.8 · trazioni all’ultimo gradino a bonus 0: prima il tempo, poi il carico', () => {
    const r = rivedi(4, cima, [stato(TRAZIONI, { level: 6 })], { tests: conTest(12) });
    expect(r.verdicts).toHaveLength(0);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'tempo' }));
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

/* -------------------------------------------------------------------------- */
/* R10-R13 (training/reports/2026-11-16-training.md)                          */
/* -------------------------------------------------------------------------- */

const scelta = (
  date: string,
  slug: ExerciseSlug,
  prima: Partial<ExerciseState>,
  dopo: Partial<ExerciseState>,
  decision: 'accepted' | 'postponed' = 'accepted',
): DecisioneRegistrata => ({
  date,
  exercise: slug,
  decision,
  stateBefore: stato(slug, prima),
  stateAfter: stato(slug, { ...prima, ...dopo }),
});

describe('R10 · in revisione le leve nell’ordine della fine seduta', () => {
  const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
  const curl = (date: string, kg = 12) => seduta(date, [voce(MARTELLO, [10, 10, 10], { loadKg: kg })]);
  const coppiaCurl = [curl('2026-03-19'), curl('2026-03-26')];

  it('10.1 · caso A17: tempo accettato dopo le sedute lette, nessun manubrio in più', () => {
    const r = rivedi(4, coppiaCurl, [stato(MARTELLO, { loadKg: 12, eccentricBonusSeconds: 1 })], {
      decisioni: [scelta('2026-03-26', MARTELLO, { loadKg: 12 }, { eccentricBonusSeconds: 1 })],
    });
    expect(r.verdicts).toHaveLength(0);
    expect(r.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'leva' }));
    expect(r.rimandati[0]?.testo).toContain('un secondo in più di eccentrica');
  });

  it('10.3 · con l’eccentrica al massimo, la prossima è la pausa', () => {
    const r = rivedi(4, coppiaCurl, [stato(MARTELLO, { loadKg: 12, eccentricBonusSeconds: 2 })]);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'pausa' }));
    expect(r.alMassimo[0]?.testo).toContain('da 0" a 1"');
  });

  it('10.5, 10.6, 10.7 · la leva di pausa conta solo se accettata dopo la prima seduta della coppia', () => {
    const stessoGiorno = rivedi(4, coppiaCurl, [stato(MARTELLO, { loadKg: 12, ...ESAURITI })], {
      decisioni: [scelta('2026-03-19', MARTELLO, { loadKg: 12, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 1 }, { bottomPauseBonusSeconds: 2 })],
    });
    expect(stessoGiorno.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'leva' }));

    const prima = rivedi(4, coppiaCurl, [stato(MARTELLO, { loadKg: 12, ...ESAURITI })], {
      decisioni: [scelta('2026-03-12', MARTELLO, { loadKg: 12, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 1 }, { bottomPauseBonusSeconds: 2 })],
    });
    expect(prima.verdicts[0]?.kind).toBe('aggiungi-peso');

    const rimandata = rivedi(4, coppiaCurl, [stato(MARTELLO, { loadKg: 12, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 1 })], {
      decisioni: [scelta('2026-03-19', MARTELLO, { loadKg: 12, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 1 }, {}, 'postponed')],
    });
    expect(rimandata.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'pausa' }));
    expect(rimandata.alMassimo[0]?.testo).toContain('da 1" a 2"');
  });

  it('10.10 · trazioni a 5 kg, tempo 4" → 5" accettato a fine seduta: nessun +2,5 kg', () => {
    const t = (date: string) => seduta(date, [voce(TRAZIONI, [8, 8, 8], { level: 6, loadKg: 5 })]);
    const r = rivedi(4, [t('2026-03-19'), t('2026-03-26')], [stato(TRAZIONI, { level: 6, loadKg: 5, ...ESAURITI })], {
      decisioni: [scelta('2026-03-26', TRAZIONI, { level: 6, loadKg: 5, eccentricBonusSeconds: 1, bottomPauseBonusSeconds: 2 }, { eccentricBonusSeconds: 2 })],
    });
    expect(r.verdicts).toHaveLength(0);
    expect(r.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'leva' }));
  });

  it('10.11 · superare il massimo all’ultimo gradino non fa saltare al carico', () => {
    const t = (date: string) => seduta(date, [voce(TRAZIONI, [9, 9, 9], { level: 6 })]);
    const r = rivedi(4, [t('2026-03-19'), t('2026-03-26')], [stato(TRAZIONI, { level: 6 })]);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'tempo' }));
  });

  it('10.12 e 10.13 · tempo e pausa al massimo, al massimo del range: la prossima è la variante', () => {
    const p = (date: string) => seduta(date, [S([18, 18, 18])]);
    /* Il push-up prescrive 2-0-1-0: l'eccentrica arriva a 5" con tre secondi in più. */
    const PUSH_ESAURITI = { eccentricBonusSeconds: 3, bottomPauseBonusSeconds: 2 } as const;
    const conStoria = rivedi(4, [storia(PUSH), p('2026-03-19'), p('2026-03-26')], [stato(PUSH, PUSH_ESAURITI)]);
    expect(conStoria.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'variante' }));
    expect(conStoria.alMassimo[0]?.testo).toContain('livello 3');

    const appena = rivedi(4, [p('2026-03-19'), p('2026-03-26')], [stato(PUSH, PUSH_ESAURITI)]);
    expect(appena.alMassimo[0]?.testo).toContain('dal giovedì 2 aprile');
  });

  it('10.14 · senza carico: prima il tempo, poi le leve sono finite', () => {
    const p = (date: string) => seduta(date, [voce(PULLOVER, [15, 15, 15])]);
    const zero = rivedi(4, [p('2026-03-19'), p('2026-03-26')], [stato(PULLOVER)]);
    expect(zero.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'tempo' }));
    const finite = rivedi(4, [p('2026-03-19'), p('2026-03-26')], [stato(PULLOVER, ESAURITI)]);
    expect(finite.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'leve-finite' }));
  });
});

describe('R11 · rifatto dopo la fine della settimana', () => {
  const p3 = (date: string, values: readonly number[], options: { tempo?: boolean | null; level?: LevelIndex } = {}) =>
    seduta(date, [voce(PUSH, values, { level: options.level ?? 3, ...(options.tempo === undefined ? {} : { tempo: options.tempo }) })]);
  const L3 = stato(PUSH, { level: 3 });

  it('11.1 e 11.2 · M17: aperta dopo la seduta del lunedì, la discesa arriva lo stesso', () => {
    const dopo = rivedi(2, [p3('2026-03-02', [9, 9, 9]), p3('2026-03-09', [9, 9, 9]), p3('2026-03-16', [9, 9, 9])], [L3], { today: '2026-03-16' });
    expect(dopo.verdicts[0]?.kind).toBe('scendi-di-livello');
    expect(dopo.verdicts[0]?.evidence).toContain('Rifatto lunedì 16 marzo: 9-9-9');

    const prima = rivedi(2, [p3('2026-03-02', [9, 9, 9]), p3('2026-03-09', [9, 9, 9])], [L3], { today: '2026-03-16' });
    expect(prima.verdicts[0]?.kind).toBe('scendi-di-livello');
  });

  it('11.3 · una seduta nuova che smentisce: niente cambia', () => {
    const r = rivedi(2, [p3('2026-03-02', [9, 9, 9]), p3('2026-03-09', [9, 9, 9]), p3('2026-03-16', [13, 12, 12])], [L3], { today: '2026-03-16' });
    expect(r.verdicts).toHaveLength(0);
    expect(r.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'smentito' }));
    expect(r.rimandati[0]?.testo).toContain('non conferma');
  });

  it('11.4 · discesa accettata: la settimana dopo nessuna seconda discesa', () => {
    const r = rivedi(
      3,
      [p3('2026-03-02', [9, 9, 9]), p3('2026-03-09', [9, 9, 9]), p3('2026-03-16', [9, 9, 9]), p3('2026-03-23', [13, 13, 13], { level: 2 })],
      [stato(PUSH, { level: 2 })],
      { today: '2026-03-23' },
    );
    expect(r.verdicts).toHaveLength(0);
  });

  it('11.5, 11.6, 11.7 · la salita si conferma solo con il massimo e il tempo', () => {
    const p2 = (date: string, values: readonly number[], tempo: boolean | null = true) =>
      seduta(date, [voce(PUSH, values, { tempo })]);
    const base = [p2('2026-03-02', [19, 19, 19]), p2('2026-03-09', [19, 19, 19])];
    const confermata = rivedi(2, [...base, p2('2026-03-16', [19, 19, 19])], [stato(PUSH)], { today: '2026-03-16' });
    expect(confermata.verdicts[0]?.kind).toBe('sali-di-livello');

    const smentita = rivedi(2, [...base, p2('2026-03-16', [17, 16, 16])], [stato(PUSH)], { today: '2026-03-16' });
    expect(smentita.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'smentito' }));

    const senzaTempo = rivedi(2, [...base, p2('2026-03-16', [19, 19, 19], null)], [stato(PUSH)], { today: '2026-03-16' });
    expect(senzaTempo.rimandati[0]?.testo).toContain('tempo non confermato');
  });

  it('11.8 · gradino cambiato dopo le sedute lette: rimandato per stato', () => {
    const p2 = (date: string) => seduta(date, [voce(PUSH, [19, 19, 19])]);
    const r = rivedi(2, [p2('2026-03-02'), p2('2026-03-09'), p2('2026-03-16')], [stato(PUSH, { level: 3 })], { today: '2026-03-16' });
    expect(r.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'stato' }));
  });

  it('11.10 · tempo accettato alla seduta nuova: rimandato per leva', () => {
    const p2 = (date: string) => seduta(date, [voce(PUSH, [18, 18, 18])]);
    const r = rivedi(2, [p2('2026-03-02'), p2('2026-03-09'), p2('2026-03-16')], [stato(PUSH, { eccentricBonusSeconds: 1 })], {
      today: '2026-03-16',
      decisioni: [scelta('2026-03-16', PUSH, {}, { eccentricBonusSeconds: 1 })],
    });
    expect(r.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'leva' }));
  });

  it('11.11 e 11.12 · più sedute nuove: devono confermare tutte', () => {
    const base = [p3('2026-03-02', [9, 9, 9]), p3('2026-03-09', [9, 9, 9]), p3('2026-03-16', [9, 9, 9])];
    const confermata = rivedi(2, [...base, p3('2026-03-19', [9, 9, 9])], [L3], { today: '2026-03-22' });
    expect(confermata.verdicts[0]?.kind).toBe('scendi-di-livello');

    const smentita = rivedi(2, [...base, p3('2026-03-19', [12, 12, 11])], [L3], { today: '2026-03-22' });
    expect(smentita.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'smentito' }));
  });

  it('11.13 · aperta sempre dopo la seduta del lunedì, da W2 lo stesso esito di prima della seduta', () => {
    const lunedi = (n: number) => addDays('2026-03-02', 7 * n);
    const sedute = Array.from({ length: 8 }, (_, n) => p3(lunedi(n), [9, 9, 9]));
    for (let w = 2; w <= 7; w += 1) {
      const oggi = lunedi(w);
      const primaDellaSeduta = rivedi(w, sedute.filter((x) => x.date < oggi), [L3], { today: oggi });
      const dopoLaSeduta = rivedi(w, sedute.filter((x) => x.date <= oggi), [L3], { today: oggi });
      expect(dopoLaSeduta.verdicts.map((v) => v.kind)).toEqual(primaDellaSeduta.verdicts.map((v) => v.kind));
      expect(dopoLaSeduta.verdicts[0]?.kind).toBe('scendi-di-livello');
    }
  });
});

describe('R12 · due date diverse', () => {
  it('12.2 · una seduta più vecchia non prende il posto di quella dello stesso giorno', () => {
    const r = rivedi(
      2,
      [storia(PUSH), seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])],
      [stato(PUSH)],
    );
    expect(r.verdicts).toHaveLength(0);
    expect(r.pocheProve[0]?.stessoGiorno).toBe('2026-03-11');
  });

  it('12.3 · nessuna discesa da un giorno solo', () => {
    const r = rivedi(2, [seduta('2026-03-11', [S([9, 9, 9])]), seduta('2026-03-11', [S([9, 9, 9])])], [stato(PUSH)]);
    expect(r.verdicts).toHaveLength(0);
  });

  it('12.4 · una seduta per giorno: si giudica (controllo)', () => {
    const r = rivedi(2, [storia(PUSH), seduta('2026-03-04', [S([19, 19, 19])]), seduta('2026-03-11', [S([19, 19, 19])])], [stato(PUSH)]);
    expect(r.verdicts[0]?.kind).toBe('sali-di-livello');
  });
});

describe('R13 in revisione · un aumento per esercizio ogni 7 giorni', () => {
  const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
  const t = (date: string, kg: number) => seduta(date, [voce(TRAZIONI, [8, 8, 8], { level: 6, loadKg: kg })]);
  const diario = [t('2026-03-17', 0), t('2026-03-24', 2.5), t('2026-03-26', 2.5)];
  const conTest = latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]);

  it('13.10 · zavorra scritta dall’atleta martedì: nessun altro +2,5 kg prima del martedì dopo', () => {
    const r = rivedi(4, diario, [stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI })], { tests: conTest, today: '2026-03-30' });
    expect(r.verdicts).toHaveLength(0);
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'sette-giorni' }));
    expect(r.fermi[0]?.testo).toContain('dal martedì 31 marzo');
    expect(r.fermi[0]?.testo).toContain('peso scritto da te');
  });

  it('13.11 · aperta il giorno dopo: +2,5 kg', () => {
    const r = rivedi(4, diario, [stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI })], { tests: conTest, today: '2026-03-31' });
    expect(r.verdicts[0]?.kind).toBe('aggiungi-peso');
    expect(r.verdicts[0]?.stateAfter.loadKg).toBe(5);
  });

  it('13.9 · le discese non si fermano', () => {
    const r = rivedi(
      3,
      [seduta('2026-03-18', [S([9, 9, 9], 3)]), seduta('2026-03-19', [S([9, 9, 9], 3)])],
      [stato(PUSH, { level: 3 })],
      { today: '2026-03-23', decisioni: [scelta('2026-03-17', PUSH, {}, { level: 3 })] },
    );
    expect(r.verdicts[0]?.kind).toBe('scendi-di-livello');
  });
});

/* -------------------------------------------------------------------------- */
/* R16, R17 (training/reports/2026-11-18-training.md)                         */
/* -------------------------------------------------------------------------- */

describe('R16 · in R11 «scarico» e «scarico-coppia» sono lo stesso esito', () => {
  const p = (date: string, values: readonly number[]) => seduta(date, [S(values)]);

  it('16.1 · L20: coppia di scarico confermata da una seduta piena', () => {
    const r = rivedi(6, [storia(PUSH), p('2026-04-06', [18, 18]), p('2026-04-09', [18, 18]), p('2026-04-13', [18, 18, 18])], [stato(PUSH)], {
      today: '2026-04-13',
    });
    expect(r.rimandati).toHaveLength(0);
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'scarico' }));
    expect(r.fermi[0]?.testo).toContain('Le due sedute lette sono di scarico (lunedì 6 aprile e giovedì 9 aprile)');
    expect(r.fermi[0]?.testo).toContain('Si riprende con due sedute piene.');
    expect(r.fermi[0]?.testo).toContain('Rifatto lunedì 13 aprile: 18-18-18.');
  });

  it('16.2 · una sola della coppia di scarico: T-S3, e la conferma', () => {
    const r = rivedi(6, [storia(PUSH), p('2026-04-02', [18, 18, 18]), p('2026-04-08', [18, 18]), p('2026-04-13', [18, 18, 18])], [stato(PUSH)], {
      today: '2026-04-13',
    });
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'scarico-coppia' }));
    expect(r.fermi[0]?.testo).toContain('Una delle due sedute lette è di scarico');
    expect(r.fermi[0]?.testo).toContain('Rifatto lunedì 13 aprile');
  });

  it('16.3 · coppia di scarico, la seduta dopo sotto il massimo: smentito', () => {
    const r = rivedi(6, [storia(PUSH), p('2026-04-06', [18, 18]), p('2026-04-09', [18, 18]), p('2026-04-13', [15, 15, 15])], [stato(PUSH)], {
      today: '2026-04-13',
    });
    expect(r.fermi).toHaveLength(0);
    expect(r.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'smentito' }));
  });

  it('16.5 · revisione della settimana prima dello scarico: T-S1 e la conferma', () => {
    const r = rivedi(5, [storia(PUSH), p('2026-03-31', [18, 18, 18]), p('2026-04-02', [18, 18, 18]), p('2026-04-06', [18, 18])], [stato(PUSH)], {
      today: '2026-04-06',
    });
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'scarico' }));
    expect(r.fermi[0]?.testo).toContain('Settimana di scarico');
    expect(r.fermi[0]?.testo).toContain('Rifatto lunedì 6 aprile: 18-18.');
  });

  it('16.6 · un fermo per i sette giorni confermato porta la coda', () => {
    const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
    const t = (date: string, kg: number) => seduta(date, [voce(TRAZIONI, [8, 8, 8], { level: 6, loadKg: kg })]);
    const r = rivedi(4, [t('2026-03-17', 0), t('2026-03-24', 2.5), t('2026-03-26', 2.5), t('2026-03-30', 2.5)], [stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI })], {
      tests: latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]),
      today: '2026-03-30',
    });
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'sette-giorni' }));
    expect(r.fermi[0]?.testo).toContain('Rifatto lunedì 30 marzo: 8-8-8.');
  });
});

describe('R17 in revisione · la data più lontana fra R7 e R13', () => {
  const p = (date: string, values: readonly number[]) => seduta(date, [S(values)]);
  /* Una leva di tempo accettata a fine seduta conta dalla seduta dopo (D-20 b). */
  const sceltaDiFine = (prima: LoggedSession, da: Partial<ExerciseState>, a: Partial<ExerciseState>): DecisioneRegistrata => ({
    ...scelta(prima.date, PUSH, da, a),
    sessionLogId: prima.id,
  });

  it('17.5 · sopra il massimo, R7 dal 24 e R13 dal 25: fermo per i sette giorni', () => {
    const x = p('2026-03-10', [17, 17, 17]);
    const r = rivedi(3, [x, p('2026-03-18', [19, 19, 19]), p('2026-03-20', [19, 19, 19])], [stato(PUSH, { eccentricBonusSeconds: 1 })], {
      decisioni: [sceltaDiFine(x, {}, { eccentricBonusSeconds: 1 })],
    });
    expect(r.inAttesa).toHaveLength(0);
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'sette-giorni' }));
    expect(r.fermi[0]?.testo).toContain('dal mercoledì 25 marzo');
  });

  it('17.6 · R7 dal 26 e R13 dal 25: in attesa, dal 26 (invariato)', () => {
    const x = p('2026-03-12', [17, 17, 17]);
    const r = rivedi(3, [x, p('2026-03-18', [19, 19, 19]), p('2026-03-20', [19, 19, 19])], [stato(PUSH, { eccentricBonusSeconds: 1 })], {
      decisioni: [sceltaDiFine(x, {}, { eccentricBonusSeconds: 1 })],
    });
    expect(r.inAttesa[0]).toEqual(expect.objectContaining({ dal: '2026-03-26' }));
  });

  it('17.7 · alMassimo variante con R7 libero e R13 attivo: la data di R13', () => {
    const PUSH_ESAURITI = { eccentricBonusSeconds: 3, bottomPauseBonusSeconds: 2 } as const;
    const x = p('2026-03-10', [17, 17, 17]);
    const r = rivedi(3, [storia(PUSH), x, p('2026-03-18', [18, 18, 18]), p('2026-03-20', [18, 18, 18])], [stato(PUSH, PUSH_ESAURITI)], {
      decisioni: [sceltaDiFine(x, { eccentricBonusSeconds: 3, bottomPauseBonusSeconds: 1 }, { bottomPauseBonusSeconds: 2 })],
    });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'variante' }));
    expect(r.alMassimo[0]?.testo).toContain('Un aumento per esercizio ogni 7 giorni: si può proporre dal mercoledì 25 marzo.');
  });

  it('17.8 · alMassimo tempo con R13 attivo: «non prima del»', () => {
    const x = p('2026-03-10', [17, 17, 17]);
    const r = rivedi(3, [storia(PUSH), x, p('2026-03-18', [18, 18, 18]), p('2026-03-20', [18, 18, 18])], [stato(PUSH, { bottomPauseBonusSeconds: 1 })], {
      decisioni: [sceltaDiFine(x, {}, { bottomPauseBonusSeconds: 1 })],
    });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'tempo' }));
    expect(r.alMassimo[0]?.testo).toContain('Un aumento per esercizio ogni 7 giorni: non prima del mercoledì 25 marzo.');
  });

  it('senza R13 i testi restano quelli di prima', () => {
    const r = rivedi(3, [storia(PUSH), p('2026-03-18', [18, 18, 18]), p('2026-03-20', [18, 18, 18])], [stato(PUSH)]);
    expect(r.alMassimo[0]?.testo).not.toContain('ogni 7 giorni');
  });
});

describe('L23 in revisione · una seduta con data dopo oggi', () => {
  it('15.16 · la salita eseguita in una seduta datata domani ferma il +2,5 kg di oggi', () => {
    /*
     * Il mondo 668 di quality, spostato di un giorno: con l'inizio del
     * programma di queste prove la settimana 3 finisce domenica 22, e la
     * revisione si apre lunedì 23. La seduta che esegue la salita ha la data
     * di martedì 24, cioè dopo oggi.
     */
    const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
    const t = (date: string) => seduta(date, [voce(TRAZIONI, [8, 8, 8], { level: 6 })]);
    const r = rivedi(3, [t('2026-03-17'), t('2026-03-19'), t('2026-03-24')], [stato(TRAZIONI, { level: 6, ...ESAURITI })], {
      tests: latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]),
      today: '2026-03-23',
      decisioni: [scelta('2026-03-20', TRAZIONI, { level: 5 }, { level: 6 })],
    });
    expect(r.verdicts.filter((v) => v.kind === 'aggiungi-peso')).toHaveLength(0);
    expect(r.fermi[0]).toEqual(expect.objectContaining({ motivo: 'sette-giorni' }));
    expect(r.fermi[0]?.testo).toContain(
      'L’ultimo è del martedì 24 marzo (livello 5 → 6, scelta del venerdì 20 marzo): il prossimo si può proporre dal martedì 31 marzo.',
    );
  });
});

describe('R14c · in revisione, una scelta tolta che riporta tempo e pausa', () => {
  const PRIMA = { loadKg: 12, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
  const DOPO = { loadKg: 14.5, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 } as const;
  const c = (date: string) => seduta(date, [voce(MARTELLO, [10, 10, 10], { loadKg: 12 })]);
  const registro: DecisioneRegistrata[] = [
    { ...scelta('2026-03-23', MARTELLO, PRIMA, DOPO), id: 'c-23' },
    {
      date: '2026-03-26',
      exercise: MARTELLO,
      decision: 'lapsed',
      id: 'lapsed:s26:c-23',
      ref: 'c-23',
      sessionLogId: 's26',
      stateBefore: stato(MARTELLO, DOPO),
      stateAfter: stato(MARTELLO, PRIMA),
    },
  ];

  it('14.17 · la coppia (19, 26) è a uno stato che non c’è più: rimandata', () => {
    const r = rivedi(4, [c('2026-03-19'), c('2026-03-26')], [stato(MARTELLO, PRIMA)], { today: '2026-03-30', decisioni: registro });
    expect(r.verdicts).toHaveLength(0);
    expect(r.rimandati[0]).toEqual(expect.objectContaining({ motivo: 'decaduta' }));
    expect(r.rimandati[0]?.testo).toBe(
      'giovedì 26 marzo la scelta del lunedì 23 marzo (manubrio successivo, al massimo 14,5 kg) non è stata eseguita e tempo e pausa sono tornati a quelli di prima. Le sedute lette non sono a questo stato: si giudica quando avrai due sedute allo stato di adesso.',
    );
  });

  it('14.17 · due sedute dopo, allo stato di adesso: si giudica', () => {
    const r = rivedi(5, [c('2026-03-19'), c('2026-03-26'), c('2026-03-30'), c('2026-04-02')], [stato(MARTELLO, PRIMA)], {
      today: '2026-04-06',
      decisioni: registro,
    });
    expect(r.rimandati.filter((x) => x.motivo === 'decaduta')).toHaveLength(0);
  });

  it('14.7 · zavorra tolta con i bonus uguali: la coppia vale', () => {
    const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
    const t = (date: string) => seduta(date, [voce(TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5 })]);
    const zavorra: DecisioneRegistrata[] = [
      {
        date: '2026-03-26',
        exercise: TRAZIONI,
        decision: 'lapsed',
        ref: 'z',
        stateBefore: stato(TRAZIONI, { level: 6, loadKg: 5, ...ESAURITI }),
        stateAfter: stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI }),
      },
    ];
    const r = rivedi(4, [t('2026-03-19'), t('2026-03-26')], [stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI })], {
      today: '2026-03-30',
      decisioni: zavorra,
      tests: latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]),
    });
    expect(r.rimandati.filter((x) => x.motivo === 'decaduta')).toHaveLength(0);
  });
});

describe('D-19 (b) in revisione · il manubrio successivo esatto', () => {
  const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
  const coppia = (kg: number) => [
    seduta('2026-03-17', [voce(MARTELLO, [10, 10, 10], { loadKg: kg })]),
    seduta('2026-03-24', [voce(MARTELLO, [10, 10, 10], { loadKg: kg })]),
  ];

  it('D19.12 · in cima: leve finite con il motivo del manubrio', () => {
    const r = rivedi(4, coppia(24), [stato(MARTELLO, { loadKg: 24, ...ESAURITI })]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'leve-finite' }));
    expect(r.alMassimo[0]?.testo).toBe(
      'Hai esaurito le leve su questo esercizio: 24 kg è il manubrio più pesante che hai. Serve un cambio di programmazione, non un altro giro.',
    );
  });

  it('D19.12 · fuori elenco: alMassimo «manubrio», si chiede il peso vero', () => {
    const r = rivedi(4, coppia(14.5), [stato(MARTELLO, { loadKg: 14.5, ...ESAURITI })]);
    expect(r.verdicts).toHaveLength(0);
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'manubrio' }));
    expect(r.alMassimo[0]?.testo).toBe(
      'massimo chiuso su tutte le serie. 14,5 kg non è fra i tuoi manubri: scrivi nel player il peso che usi davvero, e il prossimo si calcola da lì.',
    );
  });
});

describe('M22 · il tetto di 55 minuti anche in revisione', () => {
  const MP = 'military-press-manubri';
  const PLANK = 'plank-trascinamento-kb';
  const HIP = 'hip-thrust-panca-bilaterale';
  type Stati = ReadonlyMap<ExerciseSlug, ExerciseState>;
  /* Durate finte, per isolare la regola: secondi di tempo e pausa degli esercizi indicati. */
  const durataDi =
    (base: number, pesi: Readonly<Record<string, number>>, hip3 = 0) =>
    (_slug: ExerciseSlug, stati: Stati): number =>
      [...stati.values()].reduce(
        (t, x) =>
          t + (pesi[x.exercise] ?? 0) * (x.eccentricBonusSeconds + x.bottomPauseBonusSeconds) + (x.exercise === HIP && x.level === 3 ? hip3 : 0),
        base,
      );
  const fineSeduta = (slug: ExerciseSlug, values: readonly number[], L: ExerciseState, week: number, durata: (s: Stati) => number) => {
    const blocco = BLOCCO[slug];
    if (blocco === undefined) throw new Error(slug);
    const block = getAnySession(blocco.sessionId).blocks.find((b) => b.code === blocco.code);
    if (block === undefined) throw new Error(blocco.code);
    const exercise = getExercise(slug);
    return evaluateProgression({
      block,
      exercise,
      state: L,
      logged: { ...voce(slug, values, { loadKg: L.loadKg, ...(L.level === null ? {} : { level: L.level }) }), level: L.level },
      range: resolveBlockRange(block, exercise, TEST_PIENI),
      week,
      currentMaxReps: 12,
      salita: { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' },
      rientro: null,
      aumentoRecente: null,
      durataCon: (stato) => durata(new Map([[stato.exercise, stato]])),
    });
  };
  const sedute = (slug: ExerciseSlug, values: readonly number[], kg: number, level?: LevelIndex) => [
    seduta('2026-03-19', [voce(slug, values, { loadKg: kg, ...(level === undefined ? {} : { level }) })]),
    seduta('2026-03-26', [voce(slug, values, { loadKg: kg, ...(level === undefined ? {} : { level }) })]),
  ];

  it('M22.1 · military press al tetto: in revisione il manubrio, come a fine seduta', () => {
    const L = stato(MP, { loadKg: 10, eccentricBonusSeconds: 1 });
    const durata = durataDi(3150, { [MP]: 100 });
    expect(durata(MP, new Map([[MP, { ...L, eccentricBonusSeconds: 2 }]]))).toBeGreaterThan(3300);
    expect(durata(MP, new Map([[MP, { ...L, bottomPauseBonusSeconds: 1 }]]))).toBeGreaterThan(3300);
    const r = rivedi(4, sedute(MP, [15, 15, 15], 10), [L], { durata });
    expect(r.alMassimo).toHaveLength(0);
    expect(r.verdicts[0]?.kind).toBe('aggiungi-peso');
    expect(r.verdicts[0]?.change).toContain('Passa al manubrio da 12 kg: oggi usi 10 kg.');
    expect(r.verdicts[0]?.evidence).toContain('tempo e pausa fermi al tetto dei 55 minuti.');
    const e = fineSeduta(MP, [15, 15, 15], L, 4, (s) => durata(MP, s));
    expect(e.suggestion?.lever).toBe('load');
    expect(e.suggestion?.nextState).toEqual(r.verdicts[0]?.stateAfter);
  });

  it('M22.2 · plank: tempo oltre il tetto e nessun’altra leva', () => {
    const L = stato(PLANK);
    const durata = durataDi(3250, { [PLANK]: 100 });
    const r = rivedi(4, sedute(PLANK, [10, 10, 10], 0), [L], { durata });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'tetto' }));
    expect(r.alMassimo[0]?.testo).toBe(
      'massimo chiuso su tutte le serie. Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i 55 minuti, e su questo esercizio non ci sono altre leve. Si resta così finché la seduta non torna sotto i 55 minuti: allora il riepilogo di fine seduta riprende con tempo e pausa.',
    );
    expect(fineSeduta(PLANK, [10, 10, 10], L, 4, (s) => durata(PLANK, s)).blockedReason).toBe(
      'Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i 55 minuti, e su questo esercizio non ci sono altre leve. Oggi resta tutto com’è; tempo e pausa ripartono quando la seduta torna sotto i 55 minuti, per esempio dopo un cambio di manubrio su un altro esercizio del circuito.',
    );
  });

  it('M22.3 · con la variante libera, la revisione la indica e dice del tetto', () => {
    const L = stato(HIP, { level: 2 });
    const durata = durataDi(3250, { [HIP]: 100 });
    const r = rivedi(4, [storia(HIP, 2), ...sedute(HIP, [20, 20, 20], 0, 2)], [L], { durata });
    expect(r.alMassimo[0]).toEqual(expect.objectContaining({ motivo: 'variante' }));
    expect(r.alMassimo[0]?.testo).toContain('Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i 55 minuti. La prossima leva è il livello 3');
    expect(fineSeduta(HIP, [20, 20, 20], L, 4, (s) => durata(HIP, s)).suggestion?.lever).toBe('variant');
  });

  it('M22.4 · una salita di gradino della stessa revisione che allunga conta per il tempo', () => {
    const durata = durataDi(3150, { [MP]: 100 }, 200);
    const stati = [stato(HIP, { level: 2 }), stato(MP, { loadKg: 10 })];
    const coppia = ['2026-03-19', '2026-03-26'].map((d) =>
      seduta(d, [voce(HIP, [21, 21, 21], { level: 2 }), voce(MP, [15, 15, 15], { loadKg: 10 })]),
    );
    const senza = rivedi(4, [storia(HIP, 2), ...coppia], stati);
    expect(senza.alMassimo.find((a) => a.exercise === MP)?.motivo).toBe('tempo');
    const r = rivedi(4, [storia(HIP, 2), ...coppia], stati, { durata });
    expect(r.verdicts.find((v) => v.exercise === HIP)?.kind).toBe('sali-di-livello');
    expect(r.alMassimo.find((a) => a.exercise === MP)).toBeUndefined();
    expect(r.verdicts.find((v) => v.exercise === MP)?.kind).toBe('aggiungi-peso');
  });

  it('M22.5 e M22.6 · a fine seduta prima la settimana, poi il manubrio fuori elenco, poi il tetto', () => {
    const durata = (s: Stati) => durataDi(3250, { [MP]: 100 })(MP, s);
    expect(fineSeduta(MP, [15, 15, 15], stato(MP, { loadKg: 10 }), 2, durata).blockedReason).toContain('settimana 3');
    expect(fineSeduta(MP, [15, 15, 15], stato(MP, { loadKg: 12.5 }), 4, durata).blockedReason).toContain(
      '12,5 kg non è fra i tuoi manubri',
    );
  });

  it('M22.7 · circuiti 1-3: con la durata vera niente cambia', () => {
    const p = (date: string) => seduta(date, [S([18, 18, 18])]);
    const senza = rivedi(4, [storia(PUSH), p('2026-03-19'), p('2026-03-26')], [stato(PUSH)]);
    const con = rivedi(4, [storia(PUSH), p('2026-03-19'), p('2026-03-26')], [stato(PUSH)], { durata: durataDellaSedutaDi });
    expect(con).toEqual(senza);
  });
});

describe('R21 · il dead hang della decompressione resta fuori dalla revisione (B9)', () => {
  it('21.9 · con Z1 a 8, 12 e 30 il dead hang non compare in verdetti ed elenchi', () => {
    const sedute = [8, 12, 30].map((secondi, i) =>
      seduta(`2026-03-${String(9 + i * 2).padStart(2, '0')}`, [voce(PUSH, [19, 19, 19]), voce('dead-hang', [secondi])]),
    );
    const senza = rivedi(2, sedute.map((s) => ({ ...s, exercises: s.exercises.filter((v) => v.exercise !== 'dead-hang') })), [stato(PUSH)]);
    const r = rivedi(2, sedute, [stato(PUSH)]);
    const nomina = JSON.stringify([r.verdicts, r.inRange, r.alMassimo, r.pocheProve, r.rimandati, r.fermi]);
    expect(nomina).not.toContain('dead-hang');
    /* Il resto della revisione è quello di una settimana senza dead hang. */
    expect(r.verdicts).toEqual(senza.verdicts);
    expect(r.setsCounted).toBe(senza.setsCounted);
  });
});

describe('B18 (S5) · scendendo di gradino la zavorra si toglie', () => {
  it('trazioni al 6 con 5 kg, due sedute sotto il minimo: al 5 senza zavorra, e il testo lo dice', () => {
    const sei = { level: 6 as LevelIndex, loadKg: 5 };
    const r = rivedi(
      2,
      [seduta('2026-03-04', [voce(TRAZIONI, [3, 3, 3], sei)]), seduta('2026-03-11', [voce(TRAZIONI, [3, 3, 3], sei)])],
      [stato(TRAZIONI, sei)],
    );
    expect(r.verdicts[0]?.kind).toBe('scendi-di-livello');
    expect(r.verdicts[0]?.stateAfter).toEqual(expect.objectContaining({ level: 5, loadKg: 0 }));
    expect(r.verdicts[0]?.change).toBe(
      'Livello 6 → 5. Tempo e pause tornano a quelli della scheda; la zavorra si toglie, perché si mette solo all’ultimo gradino.',
    );
  });

  it('senza zavorra il testo resta quello di prima', () => {
    const r = rivedi(2, [seduta('2026-03-04', [S([9, 9])]), seduta('2026-03-11', [S([9])])], [stato(PUSH)]);
    expect(r.verdicts[0]?.change).toBe('Livello 2 → 1. Tempo e pause tornano a quelli della scheda.');
    expect(r.verdicts[0]?.stateAfter.loadKg).toBe(0);
  });
});
