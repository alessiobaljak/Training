import { describe, expect, it } from 'vitest';
import { decadenze } from './decadenza.ts';
import type { SceltaRegistrata } from './decadenza.ts';
import { syncStatesFromLog } from './draft.ts';
import { aumenti, aumentoRecente, evaluateProgression, initialExerciseState } from './progression.ts';
import type { AumentoRecente } from './progression.ts';
import { latestTestResults, resolveBlockRange, testResultSingle } from './ranges.ts';
import { loggedExercise, sets } from './__fixtures.ts';
import { getExercise } from '../data/exercises.ts';
import { getAnySession } from '../data/sessions.ts';
import { validateBackup, BACKUP_FORMAT } from '../db/backup.ts';
import { DATA_VERSION } from '../db/db.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedSession, SessionId } from '../types/index.ts';

/*
 * R14 (training/reports/2026-11-18-training.md, rev. 2026-11-20): una scelta
 * in salita accettata e non eseguita si toglie, con un record `lapsed`.
 * Prove 14.1-14.17 e b.8 (R14e).
 */

const MARTELLO = 'curl-martello-manubri';
const TRAZIONI = 'trazioni-prona-presa-media';
const PUSH = 'push-up';
const BLOCCO: Record<string, { sessionId: SessionId; code: string }> = {
  [TRAZIONI]: { sessionId: 'circuito-1', code: 'A1' },
  [MARTELLO]: { sessionId: 'circuito-1', code: 'B1' },
  [PUSH]: { sessionId: 'circuito-3', code: 'A2' },
};
const TEST = latestTestResults([testResultSingle('pull-up', '2026-02-23', 0, 12)]);

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
    id: `s-${date}-${String(progressivo)}`,
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

let numero = 0;
function scelta(
  date: string,
  slug: ExerciseSlug,
  prima: Partial<ExerciseState>,
  dopo: Partial<ExerciseState>,
  sessionLogId = `revisione-${date}`,
): SceltaRegistrata {
  numero += 1;
  return {
    id: `c${String(numero)}`,
    date,
    sessionLogId,
    exercise: slug,
    blockCode: BLOCCO[slug]?.code ?? 'A1',
    lever: dopo.loadKg !== undefined ? 'load' : dopo.level !== undefined ? 'variant' : 'tempo',
    decision: 'accepted',
    stateBefore: stato(slug, prima),
    stateAfter: stato(slug, { ...prima, ...dopo }),
  };
}

function fine(draft: LoggedSession, state: ExerciseState, recente: AumentoRecente | null, decaduta: string | null = null) {
  const voce = draft.exercises[0];
  if (voce === undefined) throw new Error('voce');
  const blocco = BLOCCO[voce.exercise];
  if (blocco === undefined) throw new Error('blocco');
  const block = getAnySession(blocco.sessionId).blocks.find((entry) => entry.code === blocco.code);
  if (block === undefined) throw new Error('blocco');
  const exercise = getExercise(voce.exercise);
  return evaluateProgression({
    block,
    exercise,
    state,
    logged: voce,
    range: resolveBlockRange(block, exercise, TEST),
    week: 4,
    currentMaxReps: 12,
    salita: { consentita: true, inizio: '2026-01-05', dal: '2026-01-19' },
    rientro: null,
    aumentoRecente: recente,
    decaduta,
  });
}

const ESAURITI = { eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 } as const;
const PRIMA = { loadKg: 12, ...ESAURITI };
const DOPO = { loadKg: 14.5, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 };

describe('R14 · una scelta in salita non eseguita si toglie', () => {
  const al19 = seduta('2026-03-19', MARTELLO, [10, 10, 10], { loadKg: 12 });
  const manubrio = scelta('2026-03-23', MARTELLO, PRIMA, DOPO);
  const ora = new Map([[MARTELLO, stato(MARTELLO, DOPO)]]);

  it('14.1 · M18: giovedì 26 a 12 kg, la scelta del 23 si toglie e tempo e pausa tornano', () => {
    const S = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const [d, ...altre] = decadenze(S, [manubrio], [al19], ora);
    expect(altre).toHaveLength(0);
    expect(d?.stato).toEqual(stato(MARTELLO, PRIMA));
    expect(d?.record).toEqual(
      expect.objectContaining({ decision: 'lapsed', ref: manubrio.id, date: '2026-03-26', sessionLogId: S.id, stateBefore: manubrio.stateAfter }),
    );
    expect(d?.testo).toBe(
      'Oggi hai usato 12 kg, il peso di prima: la scelta del lunedì 23 marzo (manubrio successivo, al massimo 14,5 kg) non è stata eseguita e si toglie. Tempo e pausa tornano a quelli che avevi su 12 kg. Il prossimo passo si valuta dalla prossima seduta.',
    );
    /* Riepilogo di S: nessuna leva. */
    const e = fine(S, stato(MARTELLO, DOPO), null, d?.testo ?? null);
    expect(e.suggestion).toBeNull();
    expect(e.fuoriStato).toBe('r14a');
    expect(e.levers.filter((l) => l.lever !== 'reps' && l.available)).toHaveLength(0);
    /* R13 non conta la scelta tolta: lunedì 30 a 12 kg, il manubrio successivo torna proponibile. */
    if (d === undefined) throw new Error('decadenza');
    const chiusa = { ...S, status: 'completed' as const };
    const registro = [manubrio, d.record];
    expect(aumenti(MARTELLO, registro, [al19, chiusa])).toEqual([]);
    const al30 = seduta('2026-03-30', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const recente = aumentoRecente(MARTELLO, registro, [al19, chiusa], al30.date, al30);
    expect(recente).toBeNull();
    /* D-19 (b): torna proponibile, come manubrio esatto dell'elenco. */
    expect(fine(al30, d.stato, recente).suggestion?.change).toContain('Passa al manubrio da 14 kg');
  });

  it('14.2, 14.3, 14.4 · a 14, 14,5 o 16 kg la scelta non si toglie', () => {
    for (const kg of [14, 14.5, 16]) {
      const S = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: kg, status: 'in-progress' });
      expect(decadenze(S, [manubrio], [al19], ora), String(kg)).toEqual([]);
    }
  });

  it('14.5 · a 10 kg, meno di prima: si toglie, e tempo e pausa alla scheda', () => {
    const S = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 10, status: 'in-progress' });
    const [d] = decadenze(S, [manubrio], [al19], ora);
    expect(d?.stato).toEqual(stato(MARTELLO, { loadKg: 10 }));
    expect(d?.testo).toBe(
      'Oggi hai usato 10 kg, meno di prima: la scelta del lunedì 23 marzo (manubrio successivo, al massimo 14,5 kg) non è stata eseguita e si toglie. Da qui comanda quello che hai scritto: tempo e pausa tornano a quelli della scheda.',
    );
  });

  it('14.6 e b.8 · a 0 kg il peso non è scritto: niente si toglie, lo stato resta, testo R14e', () => {
    const S = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 0, status: 'in-progress' });
    expect(decadenze(S, [manubrio], [al19], ora)).toEqual([]);
    expect(syncStatesFromLog(S, ora)).toEqual([]);
    const e = fine(S, stato(MARTELLO, DOPO), null);
    expect(e.fuoriStato).toBe('r14e');
    expect(e.blockedReason).toBe(
      'Peso non scritto: lo stato resta 14,5 kg. Scrivi il peso la prossima volta: senza, su questo esercizio le leve non si valutano.',
    );
    /* Poi lunedì 30 a 12 kg: come 14.1. */
    const al30 = seduta('2026-03-30', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    expect(decadenze(al30, [manubrio], [al19, { ...S, status: 'completed' }], ora)).toHaveLength(1);
  });

  it('14.7 · zavorra non messa: si toglie, i bonus erano uguali', () => {
    const TR = { level: 6 as LevelIndex, loadKg: 2.5, ...ESAURITI };
    const zavorra = scelta('2026-03-23', TRAZIONI, TR, { loadKg: 5 });
    const S = seduta('2026-03-26', TRAZIONI, [8, 8, 8], { level: 6, loadKg: 2.5, status: 'in-progress' });
    const [d] = decadenze(S, [zavorra], [], new Map([[TRAZIONI, zavorra.stateAfter]]));
    expect(d?.stato).toEqual(stato(TRAZIONI, TR));
    expect(d?.testo).toBe(
      'Oggi hai usato 2,5 kg, il peso di prima: la scelta del lunedì 23 marzo (carico 2,5 → 5 kg) non è stata eseguita e si toglie. Il prossimo passo si valuta dalla prossima seduta.',
    );
  });

  it('14.8 · gradino: «sali al 3» e seduta al 2, si toglie e torna il +1″', () => {
    const sali = scelta('2026-03-23', PUSH, { level: 2, eccentricBonusSeconds: 1 }, { level: 3, eccentricBonusSeconds: 0 });
    const S = seduta('2026-03-26', PUSH, [18, 18, 18], { level: 2, status: 'in-progress' });
    const [d] = decadenze(S, [sali], [], new Map([[PUSH, sali.stateAfter]]));
    expect(d?.stato).toEqual(stato(PUSH, { level: 2, eccentricBonusSeconds: 1 }));
    expect(d?.testo).toBe(
      'Oggi hai fatto il livello 2, quello di prima: la scelta del lunedì 23 marzo (livello 2 → 3) non è stata eseguita e si toglie. Tempo e pausa tornano a quelli che avevi al livello 2. Il prossimo passo si valuta dalla prossima seduta.',
    );
  });

  it('14.9 e 14.10 · la seduta del riepilogo in cui nasce la scelta non la toglie; quella dopo sì', () => {
    const diFine = scelta('2026-03-19', MARTELLO, PRIMA, DOPO, al19.id);
    const S = seduta('2026-03-23', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    expect(decadenze(S, [diFine], [al19], ora)).toHaveLength(1);
    const nata = scelta('2026-03-26', MARTELLO, PRIMA, DOPO, 'S-stessa');
    const stessa = { ...seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' }), id: 'S-stessa' };
    expect(decadenze(stessa, [nata], [al19], ora)).toEqual([]);
  });

  it('14.12 · due sedute dopo: la prima a 12 la toglie, la seconda a 14 è un aumento tuo', () => {
    const prima = { ...seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12 }), id: 's-26-a' };
    const [d] = decadenze({ ...prima, status: 'in-progress' }, [manubrio], [al19], ora);
    if (d === undefined) throw new Error('decadenza');
    const seconda = { ...seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 14, status: 'in-progress' }), id: 's-26-b' };
    const registro = [manubrio, d.record];
    expect(decadenze(seconda, registro, [al19, prima], new Map([[MARTELLO, d.stato]]))).toEqual([]);
    expect(aumentoRecente(MARTELLO, registro, [al19, prima], seconda.date, seconda)?.cosa).toBe('peso scritto da te, 12 → 14 kg');
    expect(syncStatesFromLog(seconda, new Map([[MARTELLO, d.stato]]))[0]).toEqual(stato(MARTELLO, { loadKg: 14 }));
  });

  it('14.13 · stato diverso da quello della scelta: R14 non si applica', () => {
    const S = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    expect(decadenze(S, [manubrio], [al19], new Map([[MARTELLO, stato(MARTELLO, { loadKg: 13 })]]))).toEqual([]);
  });

  it('14.15 · ricalcolata dopo una ricarica: lo stesso record, non un secondo', () => {
    const S = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const una = decadenze(S, [manubrio], [al19], ora);
    const due = decadenze(S, [manubrio], [al19], ora);
    expect(una[0]?.record.id).toBe(due[0]?.record.id);
    /* Scritto il record, la scelta è tolta: niente da togliere una seconda volta. */
    const scritto = una[0]?.record;
    if (scritto === undefined) throw new Error('record');
    expect(decadenze(S, [manubrio, scritto], [al19], new Map([[MARTELLO, una[0]?.stato ?? stato(MARTELLO)]]))).toEqual([]);
  });

  it('14.16 · il backup porta il record `lapsed` con il suo `ref`', () => {
    const S = seduta('2026-03-26', MARTELLO, [10, 10, 10], { loadKg: 12, status: 'in-progress' });
    const record = decadenze(S, [manubrio], [al19], ora)[0]?.record;
    const { backup } = validateBackup({
      format: BACKUP_FORMAT,
      version: DATA_VERSION,
      exportedAt: '2026-03-27T10:00:00.000Z',
      data: { suggestions: [manubrio, record] },
    });
    expect(backup.data.suggestions[1]).toEqual(expect.objectContaining({ decision: 'lapsed', ref: manubrio.id }));
  });
});
