/*
 * 13 — R5, R6, R7 a fine seduta (commit 2c9d822) e incrocio con la revisione.
 *
 * v1, 2026-11-15 (commit ff42dfb). Atteso scritto da PROGRESSION_RULES §9
 * (righe 5.9-5.12, 6.8, 6.9, 7.3) e da S1, S3, S4, S5, S10, non dal codice.
 * La salita R7 si dà a `evaluateProgression` come la calcola il riepilogo
 * (`salitaConsentita` sulle sedute chiuse, la bozza in corso esclusa).
 *
 * Parte X: una leva di tempo accettata a fine seduta, poi la revisione della
 * settimana sulle stesse due sedute. PROGRESS_REVIEW §6 promette «nessun
 * doppio aumento» perché uno stato cambiato fa uscire le voci: si misura se
 * vale anche quando lo stato cambia solo nel tempo (gradino e carico uguali).
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/13-fine-seduta-r5r6r7.mts
 */
import { findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { evaluateProgression, salitaConsentita } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession, LoggedSet, TestId, TestResult } from '../../src/types/index.ts';

type Sid = 'circuito-1' | 'circuito-2' | 'circuito-3' | 'circuito-4';
const VUOTO = new Map<TestId, TestResult>();
const test = (id: string, value: number): Map<TestId, TestResult> => new Map([[id as TestId, { testId: id as TestId, date: '2026-02-23', week: 0, value }]]);
let difetti = 0;
const riga = (ok: boolean, id: string, testo: string): void => { if (!ok) difetti += 1; console.log(`${ok ? 'OK      ' : 'DIFETTO '} ${id} ${testo}`); };

function serie(valori: number[], kg = 0, perSide = false, orfana = false): LoggedSet[] {
  const out: LoggedSet[] = [];
  valori.forEach((v, i) => {
    for (const side of perSide ? (['left', 'right'] as const) : [null]) {
      if (orfana && side === 'right' && i === valori.length - 1) continue;
      out.push({ setIndex: i + 1, side, value: v, rir: 2, loadKg: kg, heartRate: null, note: null });
    }
  });
  return out;
}
function fine(sid: Sid, code: string, o: { valori: number[]; livello: LevelIndex | null; kg?: number; tempo: boolean | null; week: number; data: string; storia?: LoggedSession[]; tests?: Map<TestId, TestResult>; ecc?: number; pausa?: number; rientro?: boolean; orfana?: boolean }) {
  const block = findCircuitSession(sid)!.blocks.find((b) => b.code === code)!;
  const ex = getExercise(block.exercise);
  const tests = o.tests ?? VUOTO;
  const state: ExerciseState = { exercise: ex.slug, level: o.livello, eccentricBonusSeconds: o.ecc ?? 0, bottomPauseBonusSeconds: o.pausa ?? 0, loadKg: o.kg ?? 0 };
  const logged: LoggedExercise = { blockCode: code, exercise: ex.slug, variantLabel: 'fixture', level: o.livello, tempoRespected: o.tempo, sets: serie(o.valori, o.kg ?? 0, block.perSide === true, o.orfana === true), note: null };
  const draft: LoggedSession = { id: `bozza-${o.data}`, date: o.data, week: o.week, sessionId: sid, status: 'in-progress', exercises: [logged], note: null };
  /* storia di default: prima seduta chiusa al gradino 15 giorni prima (R7 aperta) */
  const storia = o.storia ?? [{ ...draft, id: 'storia', date: '2026-03-01', week: 1, status: 'completed' as const }];
  const baseline = tests.size > 0 ? [...tests.values()][0]!.value : null;
  const ev = evaluateProgression({
    block, exercise: ex, state, logged, range: resolveBlockRange(block, ex, tests), week: o.week, currentMaxReps: baseline,
    salita: salitaConsentita(ex.slug, o.livello, storia, o.data, draft),
    rientro: o.rientro === true ? { seduta: 1, di: 4 } : null,
  });
  return { ev, state, logged, draft, block, ex };
}
const leva = (ev: ReturnType<typeof evaluateProgression>): string => ev.suggestion === null ? 'nessuna' : ev.suggestion.lever;
const motivoLeva = (ev: ReturnType<typeof evaluateProgression>, l: string): string => ev.levers.find((x) => x.lever === l)?.reason ?? '—';

console.log('=== F · fine seduta ===');
{ const { ev } = fine('circuito-2', 'A3', { valori: [11, 11, 11], livello: 2, tempo: null, week: 2, data: '2026-03-16' });
  riga(ev.suggestion === null, '5.9 ', `rematore 11-11-11, tempo null → leva ${leva(ev)} · «${String(ev.blockedReason)}»`); }
{ const { ev } = fine('circuito-2', 'A3', { valori: [11, 11], livello: 2, tempo: true, week: 2, data: '2026-03-16' });
  riga(ev.suggestion === null && /ne hai chiuse 2/.test(ev.blockedReason ?? ''), '5.10', `rematore 11-11, sì → leva ${leva(ev)} · «${String(ev.blockedReason)}»`); }
{ const { ev } = fine('circuito-2', 'A3', { valori: [11, 11, 11], livello: 2, tempo: true, week: 6, data: '2026-04-08' });
  riga(ev.suggestion === null && /scarico/i.test(ev.blockedReason ?? ''), '5.11', `rematore 11-11-11 in settimana 6, sì → leva ${leva(ev)} · «${String(ev.blockedReason)}»`); }
{ const { ev } = fine('circuito-2', 'A3', { valori: [11, 11, 11], livello: 2, tempo: true, week: 4, data: '2026-03-25', rientro: true });
  riga(ev.suggestion === null && /rientro/i.test(ev.blockedReason ?? ''), '5.12', `rematore 11-11-11 seduta ridotta (rientro passato a mano: nel prodotto è sempre null) → leva ${leva(ev)} · «${String(ev.blockedReason)}»`); }
{ const { ev } = fine('circuito-1', 'A1', { valori: [8, 8, 8], livello: 1, tempo: true, week: 4, data: '2026-03-25', tests: test('pull-up', 12) });
  riga(ev.suggestion?.lever !== 'load' && /variante/i.test(motivoLeva(ev, 'load')), '6.8 ', `trazioni gradino 1, 8-8-8, sì, M=12 → leva ${leva(ev)} · zavorra: «${motivoLeva(ev, 'load')}»`); }
{ const { ev } = fine('circuito-1', 'A1', { valori: [8, 8, 8], livello: 6, tempo: true, week: 4, data: '2026-03-25', tests: test('pull-up', 6), ecc: 2, pausa: 2 });
  const l = ev.levers.find((x) => x.lever === 'load');
  riga(l?.available === false && /6/.test(l.reason ?? ''), '6.9 ', `trazioni gradino 6, tempo e pause esauriti, M=6 → leva ${leva(ev)} · zavorra: «${motivoLeva(ev, 'load')}»`); }
{ const { ev } = fine('circuito-1', 'A1', { valori: [8, 8, 8], livello: 6, tempo: true, week: 4, data: '2026-03-25', ecc: 2, pausa: 2 });
  riga(ev.suggestion === null, 'Z4  ', `trazioni gradino 6, tempo e pause esauriti, nessun test → leva ${leva(ev)} · zavorra: «${motivoLeva(ev, 'load')}»`); }
{ /* A3 non riaperto: variante bloccata da R7, tempo e pause finiti → nessuna leva, testo di R7 */
  const storia: LoggedSession[] = [{ id: 's', date: '2026-03-20', week: 3, sessionId: 'circuito-1', status: 'completed', note: null, exercises: [{ blockCode: 'A1', exercise: 'trazioni-prona-presa-media' as ExerciseSlug, variantLabel: 'x', level: 1, tempoRespected: true, sets: serie([7, 7, 7]), note: null }] }];
  const { ev } = fine('circuito-1', 'A1', { valori: [9, 9, 9], livello: 1, tempo: true, week: 4, data: '2026-03-25', storia, tests: test('pull-up', 12), ecc: 2, pausa: 2 });
  riga(ev.suggestion === null && /due settimane/.test(ev.blockedReason ?? ''), 'R6/R7', `trazioni gradino 1 dal 03-20, 9-9-9, tempo e pause finiti, M=12 → leva ${leva(ev)} · «${String(ev.blockedReason)}»`); }
{ const storia: LoggedSession[] = [{ id: 's', date: '2026-03-20', week: 3, sessionId: 'circuito-1', status: 'completed', note: null, exercises: [{ blockCode: 'A1', exercise: 'trazioni-prona-presa-media' as ExerciseSlug, variantLabel: 'x', level: 1, tempoRespected: true, sets: serie([7, 7, 7]), note: null }] }];
  const { ev } = fine('circuito-1', 'A1', { valori: [9, 9, 9], livello: 1, tempo: true, week: 4, data: '2026-03-25', storia, tests: test('pull-up', 12) });
  riga(ev.suggestion?.lever === 'tempo' || ev.suggestion?.lever === 'iso-pause', 'R7  ', `trazioni gradino 1 dal 03-20, 9-9-9, R7 chiusa → leva ${leva(ev)} (attesa tempo o pausa, mai variante né zavorra) · variante: «${motivoLeva(ev, 'variant')}»`); }
{ const { ev } = fine('circuito-3', 'A2', { valori: [19, 19, 19], livello: 3, tempo: true, week: 3, data: '2026-03-16', storia: [] });
  riga(ev.suggestion?.lever !== 'variant' && /30 marzo|03-30|30\/03/.test(motivoLeva(ev, 'variant')), '7.3 ', `push-up al 3, nessuna seduta chiusa al 3, bozza del 03-16 → leva ${leva(ev)} · variante: «${motivoLeva(ev, 'variant')}»`); }
{ const { ev } = fine('circuito-1', 'A2', { valori: [11, 11, 11], livello: 2, tempo: true, week: 3, data: '2026-03-18', orfana: true });
  riga(ev.suggestion === null, 'E3  ', `bulgarian 11 × 3 sinistro, 11 × 2 destro (terza orfana) → 2 serie vere · leva ${leva(ev)} · «${String(ev.blockedReason)}»`); }
{ const { ev } = fine('circuito-1', 'F1', { valori: [21, 21, 21], livello: null, tempo: true, week: 3, data: '2026-03-18' });
  riga(ev.suggestion === null, 'escl', `kb-swing finitura 21-21-21 → leva ${leva(ev)}`); }

console.log('\n=== X · leva di tempo accettata a fine seduta, poi revisione sulle stesse sedute ===');
function incrocio(titolo: string, sid: Sid, code: string, valori: number[], livello: LevelIndex | null, kg: number, tests: Map<TestId, TestResult>): void {
  const block = findCircuitSession(sid)!.blocks.find((b) => b.code === code)!;
  const ex = getExercise(block.exercise);
  const voceDi = (tempo: boolean): LoggedExercise => ({ blockCode: code, exercise: ex.slug, variantLabel: 'x', level: livello, tempoRespected: tempo, sets: serie(valori, kg, block.perSide === true), note: null });
  const s1: LoggedSession = { id: 'x1', date: '2026-03-19', week: 3, sessionId: sid, status: 'completed', exercises: [voceDi(true)], note: null };
  const bozza: LoggedSession = { id: 'x2', date: '2026-03-26', week: 4, sessionId: sid, status: 'in-progress', exercises: [voceDi(true)], note: null };
  const prima: ExerciseState = { exercise: ex.slug, level: livello, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: kg };
  const storia = [s1, { ...s1, id: 'x0', date: '2026-03-05', week: 1 }];
  const ev = evaluateProgression({ block, exercise: ex, state: prima, logged: bozza.exercises[0]!, range: resolveBlockRange(block, ex, tests), week: 4, currentMaxReps: [...tests.values()][0]?.value ?? null, salita: salitaConsentita(ex.slug, livello, storia, bozza.date, bozza), rientro: null });
  const accettato = ev.suggestion?.nextState ?? prima;
  const chiuse = [...storia, { ...bozza, status: 'completed' as const }];
  const r = reviewWeek({ week: 4, sessions: chiuse, states: new Map([[ex.slug, accettato]]), tests, weekEnd: '2026-03-29', today: '2026-03-30' });
  const v = r.verdicts.find((x) => x.exercise === ex.slug);
  const doppio = ev.suggestion !== null && v !== undefined && (v.kind === 'aggiungi-peso' || v.kind === 'sali-di-livello') && v.stateAfter.eccentricBonusSeconds + v.stateAfter.bottomPauseBonusSeconds > 0;
  riga(!doppio, 'X   ', `${titolo}: fine seduta 03-26 leva «${leva(ev)}» accettata (ecc+${String(accettato.eccentricBonusSeconds)}"), revisione W4 il 03-30 → ${v === undefined ? 'nessun verdetto' : `«${v.title}» con stato dopo ecc+${String(v.stateAfter.eccentricBonusSeconds)}" e ${String(v.stateAfter.loadKg)} kg`}${doppio ? ' — DUE AUMENTI DALLE STESSE DUE SEDUTE IN 4 GIORNI' : ''}`);
}
incrocio('curl a martello, 10-10-10 a 12 kg su 8-10', 'circuito-1', 'B1', [10, 10, 10], null, 12, VUOTO);
incrocio('trazioni gradino 6, 8-8-8 a 5 kg su 6-8, M=12', 'circuito-1', 'A1', [8, 8, 8], 6, 5, test('pull-up', 12));
incrocio('hip thrust gradino 6, 20-20-20 a 10 kg su 15-20', 'circuito-4', 'A1', [20, 20, 20], 6, 10, VUOTO);
incrocio('push-up gradino 2, 18-18-18 su 12-18 (massimo esatto)', 'circuito-3', 'A2', [18, 18, 18], 2, 0, VUOTO);

console.log('\n=== M17 · revisione aperta dopo la seduta del lunedì, ogni settimana ===');
{
  const piu = (x: string, n: number): string => new Date(Date.parse(`${x}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  const esito = (prima: boolean): string[] => {
    const sedute: LoggedSession[] = []; const out: string[] = [];
    const st = new Map([['push-up' as ExerciseSlug, { exercise: 'push-up' as ExerciseSlug, level: 3 as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 }]]);
    for (let w = 1; w <= 8; w += 1) {
      const lunedi = piu('2026-03-02', 7 * (w - 1));
      const seduta: LoggedSession = { id: `m17-${String(w)}`, date: lunedi, week: w, sessionId: 'circuito-3', status: 'completed', note: null, exercises: [{ blockCode: 'A2', exercise: 'push-up' as ExerciseSlug, variantLabel: 'x', level: 3, tempoRespected: true, sets: serie([9, 9, 9]), note: null }] };
      if (!prima) sedute.push(seduta);
      if (w >= 2) {
        const r = reviewWeek({ week: w - 1, sessions: sedute, states: st, tests: VUOTO, weekEnd: piu('2026-03-02', 7 * (w - 1) - 1), today: lunedi });
        out.push(r.verdicts.find((v) => v.exercise === 'push-up')?.kind ?? (r.rimandati.length > 0 ? 'rimandati' : r.pocheProve.length > 0 ? 'pocheProve' : '—'));
      }
      if (prima) sedute.push(seduta);
    }
    return out;
  };
  const dopo = esito(false); const prima = esito(true);
  riga(dopo.includes('scendi-di-livello'), 'M17 ', `push-up al 3, 9-9-9 su 12-18 ogni lunedì · revisione aperta DOPO la seduta W1-W7: ${dopo.join(', ')} · aperta PRIMA: ${prima.join(', ')}`);
}

console.log(`\nDifetti: ${String(difetti)}`);
if (difetti > 0) process.exitCode = 1;
