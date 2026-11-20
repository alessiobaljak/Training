import { describe, expect, it } from 'vitest';
import {
  aumenti,
  aumentoRecente,
  evaluateProgression,
  initialExerciseState,
  livelloVoci,
} from './progression.ts';
import type { AumentoRecente, ProgressionInput } from './progression.ts';
import { latestTestResults, resolveBlockRange, testResultSingle } from './ranges.ts';
import { syncStatesFromLog } from './draft.ts';
import { addDays } from './dates.ts';
import { getExercise } from '../data/exercises.ts';
import { getAnySession } from '../data/sessions.ts';
import { loggedExercise, sets } from './__fixtures.ts';
import type {
  DecisioneRegistrata,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedSession,
  SessionId,
} from '../types/index.ts';

/*
 * R13 a fine seduta (un aumento per esercizio ogni 7 giorni, D-4 a) e il
 * manubrio come leva 5 (R10c-1, D-19). Tabelle di
 * training/reports/2026-11-16-training.md.
 */

const TRAZIONI = 'trazioni-prona-presa-media';
const MARTELLO = 'curl-martello-manubri';
const PUSH = 'push-up';
const PULLOVER = 'pull-over-trx';
const BLOCCO: Record<string, { sessionId: SessionId; code: string }> = {
  [TRAZIONI]: { sessionId: 'circuito-1', code: 'A1' },
  [MARTELLO]: { sessionId: 'circuito-1', code: 'B1' },
  [PUSH]: { sessionId: 'circuito-3', code: 'A2' },
  [PULLOVER]: { sessionId: 'circuito-3', code: 'A3' },
};
const TEST = latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]);
const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;

function stato(slug: ExerciseSlug, parziale: Partial<ExerciseState> = {}): ExerciseState {
  const exercise = getExercise(slug);
  return { ...initialExerciseState(exercise), level: exercise.pattern === null ? null : 2, ...parziale };
}

let progressivo = 0;
function seduta(
  date: string,
  slug: ExerciseSlug,
  values: readonly number[],
  options: { level?: LevelIndex | null; loadKg?: number; status?: LoggedSession['status'] } = {},
): LoggedSession {
  progressivo += 1;
  const blocco = BLOCCO[slug];
  if (blocco === undefined) throw new Error(slug);
  return {
    id: `${date}-${String(progressivo)}`,
    date,
    week: 4,
    sessionId: blocco.sessionId,
    status: options.status ?? 'completed',
    exercises: [
      {
        ...loggedExercise(slug, sets(values, options.loadKg ?? 0), { blockCode: blocco.code }),
        level: options.level === undefined ? (getExercise(slug).pattern === null ? null : 2) : options.level,
      },
    ],
    note: null,
  };
}

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

function fineSeduta(
  draft: LoggedSession,
  state: ExerciseState,
  recente: AumentoRecente | null,
  week = 4,
  opzioni: {
    salita?: ProgressionInput['salita'];
    caricoMassimoSeduta?: number;
    livelloMassimoSeduta?: LevelIndex | null;
    pesoScrittoPrima?: boolean;
    indice?: number;
  } = {},
): ReturnType<typeof evaluateProgression> {
  const voce = draft.exercises[opzioni.indice ?? 0];
  if (voce === undefined) throw new Error('voce');
  const blocco = BLOCCO[voce.exercise];
  if (blocco === undefined) throw new Error('blocco');
  const block = getAnySession(blocco.sessionId).blocks.find((entry) => entry.code === blocco.code);
  if (block === undefined) throw new Error('blocco');
  const exercise = getExercise(voce.exercise);
  const input: ProgressionInput = {
    block,
    exercise,
    state,
    logged: voce,
    range: resolveBlockRange(block, exercise, TEST),
    week,
    currentMaxReps: 12,
    salita: opzioni.salita ?? { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' },
    rientro: null,
    aumentoRecente: recente,
    ...(opzioni.caricoMassimoSeduta === undefined ? {} : { caricoMassimoSeduta: opzioni.caricoMassimoSeduta }),
    ...(opzioni.livelloMassimoSeduta === undefined ? {} : { livelloMassimoSeduta: opzioni.livelloMassimoSeduta }),
    ...(opzioni.pesoScrittoPrima === undefined ? {} : { pesoScrittoPrima: opzioni.pesoScrittoPrima }),
  };
  return evaluateProgression(input);
}

describe('R13 · aumenti dal registro e dal diario', () => {
  it('un peso scritto dall’atleta più alto della volta prima è un aumento', () => {
    const lista = aumenti(MARTELLO, [], [seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 })], seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' }));
    expect(lista).toEqual([expect.objectContaining({ date: '2026-03-26', tipi: ['carico'] })]);
    expect(lista[0]?.cosa).toBe('peso scritto da te, 12 → 14 kg');
  });

  it('eseguire una scelta accettata non è un secondo aumento', () => {
    const lista = aumenti(
      TRAZIONI,
      [scelta('2026-03-23', TRAZIONI, { level: 6 }, { loadKg: 2.5 })],
      [seduta('2026-03-19', TRAZIONI, [8, 8, 8], { level: 6 }), seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5 })],
    );
    expect(lista).toHaveLength(1);
    expect(lista[0]?.date).toBe('2026-03-26');
  });

  it('le decisioni rimandate e le discese non sono aumenti', () => {
    expect(aumenti(PUSH, [scelta('2026-03-16', PUSH, {}, { eccentricBonusSeconds: 1 }, 'postponed')], [])).toHaveLength(0);
    expect(aumenti(PUSH, [scelta('2026-03-16', PUSH, { level: 3 }, { level: 2 })], [])).toHaveLength(0);
  });
});

describe('R13 · a fine seduta', () => {
  const zavorra = [scelta('2026-03-23', TRAZIONI, { level: 6, ...ESAURITI }, { loadKg: 2.5 })];
  const storico = [seduta('2026-03-19', TRAZIONI, [8, 8, 8], { level: 6 })];

  it('13.3 · +2,5 kg accettato lunedì in revisione: giovedì nessuna leva', () => {
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const recente = aumentoRecente(TRAZIONI, zavorra, storico, draft.date, draft);
    // R15 (15.5): la zavorra conta dalla seduta che la esegue, non dal giorno in cui è accettata.
    expect(recente?.date).toBe('2026-03-26');
    expect(recente?.cosa).toBe('carico 0 → 2,5 kg, scelta del lunedì 23 marzo');
    expect(recente?.dal).toBe('2026-04-02');
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI }), recente);
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toContain('Un aumento per esercizio ogni 7 giorni');
    expect(e.blockedReason).toContain('dal giovedì 2 aprile');
  });

  it('15.6 · ex 13.4: la prima seduta a 2,5 kg, sette giorni dopo la scelta, non propone il passo dopo', () => {
    const draft = seduta('2026-03-30', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const recente = aumentoRecente(TRAZIONI, zavorra, storico, draft.date, draft);
    expect(recente?.date).toBe('2026-03-30');
    expect(recente?.dal).toBe('2026-04-06');
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI }), recente);
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toContain('l’ultimo è del lunedì 30 marzo');
  });

  it('15.7 · ex 13.4 riscritta: eseguita il 26, il 2 aprile il carico torna disponibile', () => {
    const chiusa = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5 });
    const draft = seduta('2026-04-02', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const recente = aumentoRecente(TRAZIONI, zavorra, [...storico, chiusa], draft.date, draft);
    expect(recente).toBeNull();
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI }), recente);
    expect(e.suggestion?.lever).toBe('load');
    expect(e.suggestion?.nextState.loadKg).toBe(5);
  });

  it('13.5 · due sedute lo stesso giorno: alla seconda nessuna leva', () => {
    const prima = [scelta('2026-03-26', TRAZIONI, { level: 6, ...ESAURITI }, { loadKg: 2.5 })];
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    expect(aumentoRecente(TRAZIONI, prima, storico, draft.date, draft)).not.toBeNull();
  });

  it('13.6 · manubrio cambiato dall’atleta: nessun altro aumento per 7 giorni', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' });
    const recente = aumentoRecente(MARTELLO, [], [seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 })], draft.date, draft);
    expect(recente?.cosa).toBe('peso scritto da te, 12 → 14 kg');
    expect(recente?.dal).toBe('2026-04-02');
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 14 }), recente);
    expect(e.suggestion).toBeNull();
  });

  it('13.7 · una decisione rimandata non ferma niente', () => {
    const rimandata = [scelta('2026-03-23', TRAZIONI, { level: 6, ...ESAURITI }, {}, 'postponed')];
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, status: 'in-progress' });
    const recente = aumentoRecente(TRAZIONI, rimandata, storico, draft.date, draft);
    expect(recente).toBeNull();
    expect(fineSeduta(draft, stato(TRAZIONI, { level: 6, ...ESAURITI }), recente).suggestion?.lever).toBe('load');
  });

  it('13.8 · D-4 (a): tempo accettato lunedì, giovedì nemmeno il gradino', () => {
    const draft = seduta('2026-03-19', PUSH, [19, 19, 19], { status: 'in-progress' });
    const recente = aumentoRecente(PUSH, [scelta('2026-03-16', PUSH, {}, { eccentricBonusSeconds: 1 })], [], draft.date, draft);
    // D-20 (b): il tempo conta dalla prima seduta dopo la scelta, qui quella in corso.
    expect(recente?.date).toBe('2026-03-19');
    expect(recente?.dal).toBe('2026-03-26');
    const e = fineSeduta(draft, stato(PUSH, { eccentricBonusSeconds: 1 }), recente);
    expect(e.suggestion).toBeNull();
    expect(e.levers.find((leva) => leva.lever === 'variant')?.available).toBe(false);
  });
});

describe('R15 · il diario che esegue una scelta', () => {
  const manubrio = scelta('2026-03-23', MARTELLO, { loadKg: 12 }, { loadKg: 14.5 });
  const al19 = seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 });
  const cose = (lista: readonly { date: string; cosa: string }[]): string[] => lista.map((a) => `${a.date} ${a.cosa}`);

  it('15.1 · L18: 14 kg con un tetto di 14,5 kg è l’esecuzione della scelta, datata il giorno in cui si fa', () => {
    const storico = [al19, seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14 })];
    expect(cose(aumenti(MARTELLO, [manubrio], storico))).toEqual(['2026-03-26 carico 12 → 14 kg, scelta del lunedì 23 marzo']);
    expect(aumentoRecente(MARTELLO, [manubrio], storico, '2026-03-31')?.dal).toBe('2026-04-02');
  });

  it('15.2 · al tetto esatto', () => {
    const storico = [al19, seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14.5 })];
    expect(cose(aumenti(MARTELLO, [manubrio], storico))).toEqual(['2026-03-26 carico 12 → 14,5 kg, scelta del lunedì 23 marzo']);
  });

  it('15.3 · oltre il tetto: la scelta resta in attesa e il diario conta il suo aumento', () => {
    const storico = [al19, seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 16 })];
    expect(cose(aumenti(MARTELLO, [manubrio], storico))).toEqual([
      '2026-03-23 manubrio successivo scelto, al massimo 14,5 kg',
      '2026-03-26 peso scritto da te, 12 → 16 kg',
    ]);
    expect(aumentoRecente(MARTELLO, [manubrio], storico, '2026-03-31')?.dal).toBe('2026-04-02');
  });

  it('15.4 · L19: una scelta di tempo non spiega un peso', () => {
    const al16 = seduta('2026-03-16', TRAZIONI, [8, 8, 8], { level: 6 });
    const tempo = { ...scelta('2026-03-16', TRAZIONI, { level: 6, loadKg: 2.5 }, { eccentricBonusSeconds: 1 }), sessionLogId: al16.id };
    const storico = [al16, seduta('2026-03-19', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5 })];
    const lista = cose(aumenti(TRAZIONI, [tempo], storico));
    expect(lista).toContain('2026-03-19 peso scritto da te, 0 → 2,5 kg');
    expect(lista.some((voce) => voce.includes('scelta del'))).toBe(false);
    expect(aumentoRecente(TRAZIONI, [tempo], storico, '2026-03-20')?.dal).toBe('2026-03-26');
  });

  it('15.8 · gradino eseguito: una voce, nessun «scritto da te»', () => {
    const sali = scelta('2026-03-23', PUSH, { level: 2 }, { level: 3 });
    const storico = [seduta('2026-03-19', PUSH, [19, 19, 19], { level: 2 }), seduta('2026-03-26', PUSH, [10, 10, 10], { level: 3 })];
    expect(cose(aumenti(PUSH, [sali], storico))).toEqual(['2026-03-26 livello 2 → 3, scelta del lunedì 23 marzo']);
  });

  it('15.9 · gradino scritto oltre la scelta', () => {
    const sali = scelta('2026-03-23', PUSH, { level: 2 }, { level: 3 });
    const storico = [seduta('2026-03-19', PUSH, [19, 19, 19], { level: 2 }), seduta('2026-03-26', PUSH, [10, 10, 10], { level: 4 })];
    expect(cose(aumenti(PUSH, [sali], storico))).toEqual(['2026-03-23 livello 2 → 3', '2026-03-26 livello scritto da te, 2 → 4']);
  });

  it('15.10 · la seduta del riepilogo in cui nasce la scelta non la esegue', () => {
    const x = seduta('2026-03-19', MARTELLO, [12, 12, 12], { loadKg: 12 });
    const diFine = { ...scelta('2026-03-19', MARTELLO, { loadKg: 12 }, { loadKg: 14.5 }), sessionLogId: x.id };
    const storico = [x, seduta('2026-03-23', MARTELLO, [10, 10, 10], { loadKg: 14 })];
    expect(cose(aumenti(MARTELLO, [diFine], storico))).toEqual(['2026-03-23 carico 12 → 14 kg, scelta del giovedì 19 marzo']);
  });

  it('15.11 · revisione accettata la sera di una seduta chiusa al peso di prima', () => {
    const storico = [seduta('2026-03-23', MARTELLO, [10, 10, 10], { loadKg: 12 }), seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14 })];
    expect(cose(aumenti(MARTELLO, [manubrio], storico))).toEqual(['2026-03-26 carico 12 → 14 kg, scelta del lunedì 23 marzo']);
  });

  it('15.13 · in attesa, senza sedute: conta dal giorno della scelta', () => {
    const lista = aumenti(MARTELLO, [manubrio], [al19]);
    expect(cose(lista)).toEqual(['2026-03-23 manubrio successivo scelto, al massimo 14,5 kg']);
    expect(aumentoRecente(MARTELLO, [manubrio], [al19], '2026-03-27')?.dal).toBe('2026-03-30');
  });

  it('15.14 · un peso non scritto si salta: esegue la seduta dopo', () => {
    const storico = [al19, seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 0 }), seduta('2026-03-30', MARTELLO, [10, 10, 10], { loadKg: 14 })];
    expect(cose(aumenti(MARTELLO, [manubrio], storico))).toEqual(['2026-03-30 carico 12 → 14 kg, scelta del lunedì 23 marzo']);
  });

  it('15.15 · una scelta rimandata non è niente', () => {
    const rimandata = scelta('2026-03-23', MARTELLO, { loadKg: 12 }, { loadKg: 14.5 }, 'postponed');
    expect(aumenti(MARTELLO, [rimandata], [al19])).toEqual([]);
  });
});

describe('R10c-1 · il manubrio successivo a fine seduta (D-19)', () => {
  it('10.15 · a bonus 0 la leva è il tempo, come prima', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    expect(fineSeduta(draft, stato(MARTELLO, { loadKg: 12 }), null).suggestion?.lever).toBe('tempo');
  });

  it('con tempo e pausa al massimo: il manubrio successivo esatto, tempo alla scheda (D-19 b)', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 12, ...ESAURITI }), null);
    expect(e.suggestion?.lever).toBe('load');
    expect(e.suggestion?.nextState).toEqual(
      expect.objectContaining({ loadKg: 14, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    );
    expect(e.suggestion?.change).toContain('Passa al manubrio da 14 kg');
  });

  it('nelle prime due settimane il manubrio non si cambia', () => {
    const draft = seduta('2026-03-05', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 12, ...ESAURITI }), null, 1);
    expect(e.suggestion).toBeNull();
  });

  it('cambiare manubrio di propria iniziativa riporta tempo e pausa alla scheda', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' });
    const cambiati = syncStatesFromLog(draft, new Map([[MARTELLO, stato(MARTELLO, { loadKg: 12, ...ESAURITI })]]));
    expect(cambiati).toEqual([
      expect.objectContaining({ loadKg: 14, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    ]);
  });
});

describe('R17 · a fine seduta R13 parla solo se c’è una leva da fermare', () => {
  const PUSH_ESAURITI = { eccentricBonusSeconds: 3, bottomPauseBonusSeconds: 2 } as const;
  const r13 = (dal: string): AumentoRecente => ({ date: addDays(dal, -7), cosa: 'pausa +1"', dal });

  it('17.1 · L21: leve finite e R13 attivo: «Hai esaurito», non una data', () => {
    const draft = seduta('2026-03-26', PULLOVER, [15, 15, 15], { status: 'in-progress' });
    const e = fineSeduta(draft, stato(PULLOVER, ESAURITI), r13('2026-03-27'));
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toContain('Hai esaurito tutte le leve');
    expect(e.blockedReason).not.toContain('venerdì 27 marzo');
  });

  it('17.2 · T-20: pausa accettata a fine seduta lunedì 23, il 26 R13 conta dal 26 (D-20 b)', () => {
    const al23 = seduta('2026-03-23', MARTELLO, [10, 10, 10], { loadKg: 12 });
    const pausa = { ...scelta('2026-03-23', MARTELLO, { loadKg: 12 }, { bottomPauseBonusSeconds: 1 }), sessionLogId: al23.id };
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const recente = aumentoRecente(MARTELLO, [pausa], [al23], draft.date, draft);
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 12, bottomPauseBonusSeconds: 1 }), recente);
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toBe(
      'Un aumento per esercizio ogni 7 giorni: l’ultimo è del giovedì 26 marzo (pausa +1"). Il prossimo si può proporre dal giovedì 2 aprile: oggi resta tutto com’è.',
    );
  });

  it('17.3 · variante in attesa per R7 dal 28, R13 dal 30: il testo di R13', () => {
    const draft = seduta('2026-03-26', PUSH, [18, 18, 18], { status: 'in-progress' });
    const e = fineSeduta(draft, stato(PUSH, PUSH_ESAURITI), r13('2026-03-30'), 4, {
      salita: { consentita: false, inizio: '2026-03-14', dal: '2026-03-28' },
    });
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toContain('Un aumento per esercizio ogni 7 giorni');
    expect(e.blockedReason).toContain('dal lunedì 30 marzo');
  });

  it('17.4 · variante in attesa per R7 dal 2 aprile, R13 dal 30: il testo di R7', () => {
    const draft = seduta('2026-03-26', PUSH, [18, 18, 18], { status: 'in-progress' });
    const e = fineSeduta(draft, stato(PUSH, PUSH_ESAURITI), r13('2026-03-30'), 4, {
      salita: { consentita: false, inizio: '2026-03-19', dal: '2026-04-02' },
    });
    expect(e.blockedReason).toContain('Un gradino ogni due settimane');
    expect(e.blockedReason).toContain('giovedì 2 aprile');
    expect(e.blockedReason).not.toContain('lunedì 30 marzo');
  });

  it('17.9 · settimana 2, trazioni all’ultimo gradino: la zavorra arriva, le leve non sono finite', () => {
    const draft = seduta('2026-03-12', TRAZIONI, [8, 8, 8], { level: 6, status: 'in-progress' });
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, ...ESAURITI }), null, 2);
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toContain('settimana 3');
    expect(e.blockedReason).not.toContain('Hai esaurito');
  });

  it('17.10 · senza R13 e senza attese, con le leve finite: invariato', () => {
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 2.5, ...ESAURITI }), null);
    expect(e.suggestion?.lever).toBe('load');
  });
});

describe('R14b · a fine seduta si giudica allo stato', () => {
  it('b.1 · manubrio più leggero dello stato: nessuna leva, e lo stato prende il peso scritto', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 10, status: 'in-progress' });
    const L = stato(MARTELLO, { loadKg: 12, ...ESAURITI });
    const e = fineSeduta(draft, L, null);
    expect(e.suggestion).toBeNull();
    expect(e.fuoriStato).toBe('r14b');
    expect(e.blockedReason).toBe(
      'Oggi hai usato 10 kg e lo stato era 12 kg: da qui comanda quello che hai scritto, e tempo e pausa tornano a quelli della scheda. Il prossimo passo si valuta dalla prossima seduta a 10 kg.',
    );
    expect(syncStatesFromLog(draft, new Map([[MARTELLO, L]]))[0]).toEqual(
      expect.objectContaining({ loadKg: 10, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    );
  });

  it('b.2 e b.10 · zavorra non messa: nessuna «eccentrica +1″» sopra 2,5 kg (L19)', () => {
    const draft = seduta('2026-03-16', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 0, status: 'in-progress' });
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 2.5 }), null);
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toBe(
      'Oggi hai usato 0 kg e lo stato era 2,5 kg: da qui comanda quello che hai scritto. Il prossimo passo si valuta dalla prossima seduta a 0 kg.',
    );
  });

  it('b.3 · più pesante dello stato: parla R13, con la seduta in corso (13.6)', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' });
    const recente = aumentoRecente(MARTELLO, [], [seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 })], draft.date, draft);
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 12 }), recente);
    expect(e.blockedReason).toContain('peso scritto da te, 12 → 14 kg');
    expect(e.fuoriStato).toBeNull();
  });

  it('b.4 e b.7 · allo stato, anche a 0 kg con lo stato a 0: come prima', () => {
    const allo = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    expect(fineSeduta(allo, stato(MARTELLO, { loadKg: 12 }), null).suggestion?.lever).toBe('tempo');
    const zero = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 0, status: 'in-progress' });
    expect(fineSeduta(zero, stato(MARTELLO, { loadKg: 0 }), null).suggestion?.lever).toBe('tempo');
  });

  it('b.5 · gradino diverso dallo stato: il testo sul livello', () => {
    const draft = seduta('2026-03-26', PUSH, [18, 18, 18], { level: 2, status: 'in-progress' });
    const e = fineSeduta(draft, stato(PUSH, { level: 3 }), null);
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toBe(
      'Oggi hai fatto il livello 2 e lo stato era il 3: da qui comanda quello che hai scritto. Il prossimo passo si valuta dalla prossima seduta al livello 2.',
    );
  });

  it('b.6 · due blocchi, uno a 10 e uno allo stato: «in questo blocco», e lo stato resta 12', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 10, status: 'in-progress' });
    const L = stato(MARTELLO, { loadKg: 12 });
    const e = fineSeduta(draft, L, null, 4, { caricoMassimoSeduta: 12 });
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toBe(
      'In questo blocco hai usato 10 kg invece di 12 kg: le leve si valutano solo sulle serie fatte allo stato, che resta 12 kg.',
    );
    const altro = draft.exercises[0];
    if (altro === undefined) throw new Error('voce');
    const dueBlocchi: LoggedSession = {
      ...draft,
      exercises: [altro, { ...altro, blockCode: 'B9', sets: altro.sets.map((riga) => ({ ...riga, loadKg: 12 })) }],
    };
    expect(syncStatesFromLog(dueBlocchi, new Map([[MARTELLO, L]]))).toEqual([]);
  });

  it('b.9 · zavorra vietata: si confronta solo il gradino', () => {
    const block = getAnySession('circuito-3').blocks.find((entry) => entry.code === 'A3');
    if (block === undefined) throw new Error('A3');
    const exercise = getExercise(block.exercise);
    expect(exercise.loadPolicy).toBe('forbidden');
    const state = { ...initialExerciseState(exercise), loadKg: 5 };
    const e = evaluateProgression({
      block,
      exercise,
      state,
      logged: { ...loggedExercise(exercise.slug, sets([15, 15, 15], 0), { blockCode: 'A3' }), level: state.level },
      range: resolveBlockRange(block, exercise, TEST),
      week: 4,
      currentMaxReps: null,
      salita: { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' },
      rientro: null,
      aumentoRecente: null,
    });
    expect(e.fuoriStato).toBeNull();
    expect(e.suggestion).not.toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Rilascio B1 (training/reports/2026-11-20-training.md)                      */
/* -------------------------------------------------------------------------- */

describe('L23 · un aumento con data dopo oggi ferma come uno di oggi (T-17)', () => {
  const al19 = seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 });

  it('15.17 · peso scritto in una seduta datata dopo oggi', () => {
    const futura = seduta('2026-03-23', MARTELLO, [10, 10, 10], { loadKg: 14 });
    const recente = aumentoRecente(MARTELLO, [], [al19, futura], '2026-03-22');
    expect(recente).toEqual({ date: '2026-03-23', cosa: 'peso scritto da te, 12 → 14 kg', dal: '2026-03-30' });
  });

  it('15.18 · scelta datata dopo oggi, nessuna seduta dopo', () => {
    const scelta23 = scelta('2026-03-23', MARTELLO, { loadKg: 12 }, { loadKg: 14.5 });
    const recente = aumentoRecente(MARTELLO, [scelta23], [al19], '2026-03-22');
    expect(recente).toEqual({ date: '2026-03-23', cosa: 'manubrio successivo scelto, al massimo 14,5 kg', dal: '2026-03-30' });
  });

  it('15.19 · proprietà: con date fino a oggi niente cambia; con una data futura ferma sempre', () => {
    const vecchia = (oggi: string, lista: ReturnType<typeof aumenti>) => {
      const recenti = lista.filter((a) => {
        const giorni = Math.round((Date.parse(oggi) - Date.parse(a.date)) / 86_400_000);
        return giorni >= 0 && giorni < 7;
      });
      return recenti.sort((a, b) => (a.date < b.date ? -1 : 1)).at(-1)?.date ?? null;
    };
    for (let giorno = 0; giorno < 21; giorno += 1) {
      const oggi = addDays('2026-03-19', giorno);
      for (const kg of [12, 14, 16]) {
        const storico = [al19, seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: kg })];
        const lista = aumenti(MARTELLO, [], storico);
        const recente = aumentoRecente(MARTELLO, [], storico, oggi);
        const future = lista.filter((a) => a.date > oggi);
        if (future.length === 0) {
          expect(recente?.date ?? null, `${oggi} ${String(kg)}`).toBe(vecchia(oggi, lista));
        } else {
          for (const a of future) {
            expect(recente, `${oggi} ${String(kg)}`).not.toBeNull();
            expect((recente?.dal ?? '') >= addDays(a.date, 7)).toBe(true);
          }
        }
      }
    }
  });
});

describe('M21 · il primo peso scritto su un manubrio (T-19)', () => {
  it('21.1 · stato iniziale a 0 kg, prima seduta a 10 kg', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 10, status: 'in-progress' });
    const L = stato(MARTELLO, { loadKg: 0 });
    const e = fineSeduta(draft, L, null, 4, { pesoScrittoPrima: false });
    expect(e.suggestion).toBeNull();
    expect(e.blockedReason).toBe(
      'Primo peso scritto su questo esercizio: 10 kg. Da qui si parte: le leve si valutano dalla prossima seduta a 10 kg.',
    );
    expect(syncStatesFromLog(draft, new Map([[MARTELLO, L]]))[0]).toEqual(
      expect.objectContaining({ loadKg: 10, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    );
  });

  it('21.2 · con tempo accumulato a peso non scritto', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 10, status: 'in-progress' });
    const L = stato(MARTELLO, { loadKg: 0, eccentricBonusSeconds: 1 });
    expect(fineSeduta(draft, L, null, 4, { pesoScrittoPrima: false }).blockedReason).toBe(
      'Primo peso scritto su questo esercizio: 10 kg. Da qui si parte, con tempo e pausa della scheda: le leve si valutano dalla prossima seduta a 10 kg.',
    );
    expect(syncStatesFromLog(draft, new Map([[MARTELLO, L]]))[0]).toEqual(
      expect.objectContaining({ loadKg: 10, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    );
  });

  it('21.3 · un peso già scritto prima: il testo generico', () => {
    const draft = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const e = fineSeduta(draft, stato(MARTELLO, { loadKg: 0 }), null, 4, { pesoScrittoPrima: true });
    expect(e.blockedReason).toContain('Oggi hai usato 12 kg e lo stato era 0 kg');
  });

  it('21.4 · zavorra: 0 kg è un valore vero, niente M21', () => {
    const draft = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const e = fineSeduta(draft, stato(TRAZIONI, { level: 6, loadKg: 0 }), null, 4, { pesoScrittoPrima: false });
    expect(e.blockedReason).not.toContain('Primo peso');
    expect(e.blockedReason).toContain('Oggi hai usato 2,5 kg e lo stato era 0 kg');
  });

  it('21.5 · la seduta dopo, allo stato: le leve come sempre', () => {
    const draft = seduta('2026-03-30', MARTELLO, [10, 10, 10], { loadKg: 10, status: 'in-progress' });
    expect(fineSeduta(draft, stato(MARTELLO, { loadKg: 10 }), null, 4, { pesoScrittoPrima: true }).suggestion?.lever).toBe('tempo');
  });
});

describe('L24 e D-23 · lo stesso esercizio in due blocchi (T-18, T-23)', () => {
  const dueVoci = (
    date: string,
    slug: ExerciseSlug,
    voci: readonly { level?: LevelIndex | null; loadKg?: number; values: readonly number[] }[],
  ): LoggedSession => {
    const base = seduta(date, slug, voci[0]?.values ?? [], { status: 'in-progress' });
    const blocco = BLOCCO[slug]?.code ?? 'A1';
    return {
      ...base,
      exercises: voci.map((v, i) => ({
        ...loggedExercise(slug, sets(v.values, v.loadKg ?? 0), { blockCode: i === 0 ? blocco : `${blocco}bis` }),
        level: v.level === undefined ? (getExercise(slug).pattern === null ? null : 2) : v.level,
      })),
    };
  };
  const seduteDi = (draft: LoggedSession, slug: ExerciseSlug) => ({
    livelloMassimoSeduta: livelloVoci(draft.exercises.filter((v) => v.exercise === slug)),
    caricoMassimoSeduta: draft.exercises
      .filter((v) => v.exercise === slug)
      .reduce((m, v) => v.sets.reduce((n, set) => Math.max(n, set.loadKg), m), 0),
  });

  it('24.1 e 24.2 · un blocco al 2 e uno al 3: R13 su tutti e due, chiusura al 3 con bonus a zero', () => {
    const L = stato(PUSH, { level: 2, eccentricBonusSeconds: 1 });
    const prima = seduta('2026-03-19', PUSH, [18, 18, 18], { level: 2 });
    for (const ordine of [
      [{ level: 2 as LevelIndex, values: [18, 18, 18] }, { level: 3 as LevelIndex, values: [10, 10, 10] }],
      [{ level: 3 as LevelIndex, values: [10, 10, 10] }, { level: 2 as LevelIndex, values: [18, 18, 18] }],
    ]) {
      const draft = dueVoci('2026-03-26', PUSH, ordine);
      const recente = aumentoRecente(PUSH, [], [prima], draft.date, draft);
      expect(recente?.cosa).toBe('livello scritto da te, 2 → 3');
      for (const indice of [0, 1]) {
        const e = fineSeduta(draft, L, recente, 4, { ...seduteDi(draft, PUSH), indice });
        expect(e.suggestion).toBeNull();
      }
      expect(syncStatesFromLog(draft, new Map([[PUSH, L]]))).toEqual([
        expect.objectContaining({ level: 3, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
      ]);
    }
  });

  it('24.3 · stato al 3, un blocco al 2: «in questo blocco», e lo stato resta', () => {
    const L = stato(PUSH, { level: 3 });
    const draft = dueVoci('2026-03-26', PUSH, [{ level: 3, values: [18, 18, 18] }, { level: 2, values: [19, 19, 19] }]);
    expect(fineSeduta(draft, L, null, 4, { ...seduteDi(draft, PUSH), indice: 0 }).fuoriStato).toBeNull();
    expect(fineSeduta(draft, L, null, 4, { ...seduteDi(draft, PUSH), indice: 1 }).blockedReason).toBe(
      'In questo blocco hai fatto il livello 2 invece del 3: le leve si valutano solo sulle serie fatte allo stato, che resta il livello 3.',
    );
    expect(syncStatesFromLog(draft, new Map([[PUSH, L]]))).toEqual([]);
  });

  it('24.4 · curl a 12 e a 14: R13 su tutti e due, chiusura a 14', () => {
    const L = stato(MARTELLO, { loadKg: 12 });
    const draft = dueVoci('2026-03-26', MARTELLO, [{ loadKg: 12, values: [10, 10, 10] }, { loadKg: 14, values: [10, 10, 10] }]);
    const recente = aumentoRecente(MARTELLO, [], [seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 })], draft.date, draft);
    expect(recente?.cosa).toBe('peso scritto da te, 12 → 14 kg');
    for (const indice of [0, 1]) {
      expect(fineSeduta(draft, L, recente, 4, { ...seduteDi(draft, MARTELLO), indice }).blockedReason).toContain('peso scritto da te, 12 → 14 kg');
    }
    expect(syncStatesFromLog(draft, new Map([[MARTELLO, L]]))).toEqual([expect.objectContaining({ loadKg: 14 })]);
  });

  it('24.5 · primo peso in un blocco, 0 kg nell’altro: M21 su tutti e due', () => {
    const L = stato(MARTELLO, { loadKg: 0 });
    const draft = dueVoci('2026-03-26', MARTELLO, [{ loadKg: 10, values: [10, 10, 10] }, { loadKg: 0, values: [10, 10, 10] }]);
    for (const indice of [0, 1]) {
      expect(fineSeduta(draft, L, null, 4, { ...seduteDi(draft, MARTELLO), pesoScrittoPrima: false, indice }).blockedReason).toBe(
        'Primo peso scritto su questo esercizio: 10 kg. Da qui si parte: le leve si valutano dalla prossima seduta a 10 kg.',
      );
    }
    expect(syncStatesFromLog(draft, new Map([[MARTELLO, L]]))).toEqual([expect.objectContaining({ loadKg: 10 })]);
  });

  it('D-23 · gradino scritto a mano sotto lo stato: tempo e pausa alla scheda, e il testo lo dice', () => {
    const L = stato(PUSH, { level: 3, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 });
    const draft = seduta('2026-03-26', PUSH, [18, 18, 18], { level: 2, status: 'in-progress' });
    expect(fineSeduta(draft, L, null).blockedReason).toBe(
      'Oggi hai fatto il livello 2 e lo stato era il 3: da qui comanda quello che hai scritto, e tempo e pausa tornano a quelli della scheda. Il prossimo passo si valuta dalla prossima seduta al livello 2.',
    );
    expect(syncStatesFromLog(draft, new Map([[PUSH, L]]))).toEqual([
      expect.objectContaining({ level: 2, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }),
    ]);
  });

  it('D-23 · gradino invariato: i bonus restano', () => {
    const L = stato(PUSH, { level: 2, eccentricBonusSeconds: 2 });
    const draft = seduta('2026-03-26', PUSH, [18, 18, 18], { level: 2, status: 'in-progress' });
    expect(syncStatesFromLog(draft, new Map([[PUSH, L]]))).toEqual([]);
  });

  it('24.6 · con una voce per esercizio, passare gradino e peso della seduta non cambia niente', () => {
    for (const [slug, values, kg] of [
      [PUSH, [18, 18, 18], 0],
      [MARTELLO, [10, 10, 10], 12],
      [TRAZIONI, [8, 8, 8], 2.5],
    ] as const) {
      const draft = seduta('2026-03-26', slug, values, { loadKg: kg, ...(slug === TRAZIONI ? { level: 6 as LevelIndex } : {}), status: 'in-progress' });
      const L = stato(slug, { loadKg: kg, ...(slug === TRAZIONI ? { level: 6 as LevelIndex } : {}) });
      expect(fineSeduta(draft, L, null, 4, seduteDi(draft, slug))).toEqual(fineSeduta(draft, L, null));
    }
  });
});

describe('D-21 · niente aumenti nella settimana prima dello scarico (T-21)', () => {
  const draft = () => seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
  const L = stato(MARTELLO, { loadKg: 12 });

  it('settimana 5: nessuna leva, il testo nuovo', () => {
    const e = fineSeduta(draft(), L, null, 5);
    expect(e.suggestion).toBeNull();
    expect(e.motivoBlocco).toBe('scarico');
    expect(e.blockedReason).toBe(
      'La settimana prossima è di scarico: niente aumenti da questa seduta, anche con il massimo chiuso. Si riprende dopo lo scarico.',
    );
  });

  it('settimana 4 come prima; settimana 6 con il testo dello scarico', () => {
    expect(fineSeduta(draft(), L, null, 4).suggestion?.lever).toBe('tempo');
    expect(fineSeduta(draft(), L, null, 6).blockedReason).toContain('Settimana di scarico');
    expect(fineSeduta(draft(), L, null, 11).motivoBlocco).toBe('scarico');
    expect(fineSeduta(draft(), L, null, 17).motivoBlocco).toBe('scarico');
  });

  it('con le leve finite il testo dello scarico vince su «leve finite»', () => {
    const pullover = seduta('2026-03-26', PULLOVER, [15, 15, 15], { status: 'in-progress' });
    expect(fineSeduta(pullover, stato(PULLOVER, ESAURITI), null, 5).blockedReason).toContain('La settimana prossima è di scarico');
  });
});
