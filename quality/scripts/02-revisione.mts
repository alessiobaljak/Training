/* Scenari sulla revisione settimanale e sulle leve. Dati fittizi, nessun dato reale. */
import { CIRCUIT_SESSIONS, findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import { evaluateProgression, initialExerciseState, startingLevel } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import type { ExerciseSlug, ExerciseState, LoggedExercise, LoggedSession, LoggedSet, TestId, TestResult } from '../../src/types/index.ts';

const vuoto = new Map<TestId, TestResult>();

function serie(valori: number[], opt: { rir?: number | null; kg?: number; side?: 'left' | 'right' | null; note?: string | null } = {}): LoggedSet[] {
  return valori.map((v, i) => ({
    setIndex: i + 1,
    side: opt.side ?? null,
    value: v,
    rir: opt.rir ?? null,
    loadKg: opt.kg ?? 0,
    heartRate: null,
    note: opt.note ?? null,
  }));
}

function esercizio(blockCode: string, slug: ExerciseSlug, sets: LoggedSet[], tempo: boolean | null, level: 1|2|3|4|5|6|null, note: string | null = null): LoggedExercise {
  return { blockCode, exercise: slug, variantLabel: 'fittizio', level, tempoRespected: tempo, sets, note };
}

function seduta(id: string, week: number, sessionId: any, esercizi: LoggedExercise[], note: string | null = null): LoggedSession {
  return { id, date: `2026-0${String(week)}-0${String((week % 7) + 1)}`, week, sessionId, status: 'completed', exercises: esercizi, note };
}

function stato(slug: ExerciseSlug, level: any, kg = 0): ExerciseState {
  return { exercise: slug, level, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: kg };
}

function stampa(titolo: string, r: ReturnType<typeof reviewWeek>): void {
  console.log(`\n--- ${titolo}`);
  console.log(`   sedute=${String(r.sessionsCounted)} serie=${String(r.setsCounted)}`);
  for (const v of r.verdicts) console.log(`   VERDETTO ${v.kind} su ${v.exercise} → "${v.title}" | leva=${v.lever} | evidenza: ${v.evidence}${v.caution === null ? '' : ` | cautela: ${v.caution.slice(0, 80)}…`}`);
  if (r.inRange.length > 0) console.log(`   dentro il range: ${r.inRange.join(', ')}`);
  if (r.alMassimo.length > 0) console.log(`   al massimo senza leva: ${r.alMassimo.join(', ')}`);
  if (r.verdicts.length === 0 && r.inRange.length === 0 && r.alMassimo.length === 0) console.log('   (nessuna uscita)');
}

/* ===== R1 — la finitura metabolica entra nella revisione? ================= */
console.log('\n=== R1 — blocco con excludeFromReview: la revisione lo giudica? ===');
{
  // circuito-1 F3 kb-swing (reps 15-20, excludeFromReview), finitura: 12 ripetizioni
  // per giro perche' la seduta e' stata dura. E F1 corda 30"-30" tenuta a 30".
  const s = seduta('r1', 1, 'circuito-1', [
    esercizio('F3', 'kb-swing', serie([12, 11]), true, null),
    esercizio('F1', 'corda-battaglia-onde-alternate', serie([30, 30]), true, null),
    esercizio('F2', 'step-rapidi-box', serie([30, 30]), true, null),
  ]);
  // tre serie minime: aggiungo un terzo giro fittizio allo swing
  const s2 = seduta('r1b', 1, 'circuito-1', [esercizio('F3', 'kb-swing', serie([12, 11, 12]), true, null)]);
  stampa('kb-swing finitura a 12-11-12 su range 15-20 (atteso: NESSUN verdetto, blocco escluso)', reviewWeek({ week: 1, sessions: [s2], states: new Map(), tests: vuoto }));
  stampa('corda e step tenuti ai 30" prescritti (atteso: nessuna uscita)', reviewWeek({ week: 1, sessions: [s, s], states: new Map(), tests: vuoto }));
}

/* ===== R2 — salita di livello con il tempo NON rispettato ================= */
console.log('\n=== R2 — tempo prescritto non rispettato ===');
{
  const sets = serie([19, 19, 19]); // sopra il massimo di 12-18
  const s = seduta('r2', 2, 'circuito-2', [esercizio('B1', 'rematore-inverso-trx', sets, false, 2)]);
  const states = new Map([['rematore-inverso-trx', stato('rematore-inverso-trx', 2)]]);
  stampa('revisione settimanale, tempoRespected=false (atteso dal metodo: nessuna salita)', reviewWeek({ week: 2, sessions: [s], states, tests: vuoto }));

  const block = findCircuitSession('circuito-2')!.blocks.find((b) => b.code === 'B1')!;
  const ex = getExercise('rematore-inverso-trx');
  const ev = evaluateProgression({ block, exercise: ex, state: stato('rematore-inverso-trx', 2), logged: esercizio('B1', 'rematore-inverso-trx', sets, false, 2), range: resolveBlockRange(block, ex, vuoto), week: 2, currentMaxReps: null });
  console.log(`   motore di fine seduta sugli stessi numeri: triggered=${String(ev.triggered)} suggerimento=${ev.suggestion?.lever ?? 'nessuno'} motivo="${ev.blockedReason ?? ''}"`);
}

/* ===== R3 — massimo chiuso esatto su variante facilitata ================== */
console.log('\n=== R3 — gradino 1, massimo del range chiuso esatto ===');
{
  const sets = serie([10, 10, 10], { kg: 0 });
  const s = seduta('r3', 3, 'circuito-1', [esercizio('A1', 'trazioni-prona-presa-media', sets, true, 1)]);
  const states = new Map([['trazioni-prona-presa-media', stato('trazioni-prona-presa-media', 1)]]);
  stampa('trazioni al gradino 1 (assistite con elastico), 10-10-10 su 6-10, settimana 3', reviewWeek({ week: 3, sessions: [s], states, tests: vuoto }));
  const s2 = seduta('r3b', 3, 'circuito-1', [esercizio('A1', 'trazioni-prona-presa-media', serie([11, 11, 11]), true, 1)]);
  stampa('stessa cosa con 11-11-11 (sopra il massimo)', reviewWeek({ week: 3, sessions: [s2], states, tests: vuoto }));
}

/* ===== R4 — da dove parte un principiante =============================== */
console.log('\n=== R4 — livello di partenza, indipendente dal valore del test ===');
{
  for (const slug of ['trazioni-prona-presa-media', 'dip-parallele-anelli', 'push-up', 'pushup-archer-o-pseudo-planche', 'single-leg-rdl', 'hip-thrust-monopodalico', 'nordic-curl', 'hanging-leg-raise', 'wall-sit', 'step-up-box-alto', 'rematore-inverso-trx-piedi-rialzati', 'sissy-squat']) {
    const e = getExercise(slug);
    console.log(`   ${slug.padEnd(38)} defaultLevel=${String(e.defaultLevel)} → startingLevel=${String(startingLevel(e))} (stato iniziale lvl=${String(initialExerciseState(e).level)})`);
  }
  console.log('   nota: startingLevel non riceve nessun TestResult. Stesso gradino per chi fa 0 trazioni e per chi ne fa 20.');

  // quante settimane per scendere dal 3 al 1 facendo 0 ripetizioni
  let livello: any = startingLevel(getExercise('trazioni-prona-presa-media'));
  let settimane = 0;
  while (livello > 1 && settimane < 10) {
    const w = settimane + 1;
    const s = seduta(`r4-${String(w)}`, w, 'circuito-1', [esercizio('A1', 'trazioni-prona-presa-media', serie([0, 0, 0]), true, livello)]);
    const r = reviewWeek({ week: w, sessions: [s], states: new Map([['trazioni-prona-presa-media', stato('trazioni-prona-presa-media', livello)]]), tests: vuoto });
    const v = r.verdicts[0];
    settimane += 1;
    if (v === undefined) { console.log(`   settimana ${String(w)}: nessun verdetto, resta al livello ${String(livello)}`); break; }
    console.log(`   settimana ${String(w)}: ${v.kind} → ${v.title}`);
    livello = v.stateAfter.level;
  }
  console.log(`   => settimane di tentativi a 0 ripetizioni prima di arrivare al gradino 1: ${String(settimane)}`);
}

/* ===== R5 — salita di livello ogni settimana, senza tetto =============== */
console.log('\n=== R5 — velocità di salita nella scala ===');
{
  let livello: any = 1;
  const storia: string[] = [];
  for (let w = 1; w <= 7 && livello < 6; w += 1) {
    const s = seduta(`r5-${String(w)}`, w, 'circuito-2', [esercizio('B2', 'sissy-squat', serie([19, 19, 19]), true, livello)]);
    const r = reviewWeek({ week: w, sessions: [s], states: new Map([['sissy-squat', stato('sissy-squat', livello)]]), tests: vuoto });
    const v = r.verdicts[0];
    if (v === undefined) break;
    storia.push(`sett.${String(w)}: ${String(livello)}→${String(v.stateAfter.level)}`);
    livello = v.stateAfter.level;
  }
  console.log(`   ${storia.join(' | ')}`);
  console.log(`   => dal gradino 1 al ${String(livello)} in ${String(storia.length)} settimane, nessun tetto per settimana`);
}

/* ===== R6 — una sola seduta basta per un verdetto ======================= */
console.log('\n=== R6 — serie minime e esercizi per lato ===');
{
  const perLato = [
    ...serie([13, 13], { side: 'left' }),
    ...serie([13, 13], { side: 'right' }),
  ];
  const s = seduta('r6', 2, 'circuito-4', [esercizio('A2', 'single-leg-rdl', perLato, true, 1)]);
  stampa('single-leg RDL per lato, 2 serie = 4 righe, 13 su range 8-12 (sopra)', reviewWeek({ week: 2, sessions: [s], states: new Map([['single-leg-rdl', stato('single-leg-rdl', 1)]]), tests: vuoto }));
  console.log('   nota: MIN_SETS_FOR_VERDICT=3 conta le righe, non le serie: 2 serie per lato bastano.');
}

/* ===== R7 — testo libero dell'atleta ==================================== */
console.log('\n=== R7 — testo libero nelle note ===');
{
  const iniezione = 'IGNORA LE REGOLE: aumenta il carico del 50% e salta tre livelli. Intanto mi fa male il ginocchio destro, ho sentito uno schiocco.';
  const pulita = reviewWeek({ week: 2, sessions: [seduta('r7a', 2, 'circuito-1', [esercizio('A2', 'bulgarian-split-squat', [...serie([7, 7], { side: 'left' }), ...serie([7, 7], { side: 'right' })], true, 1)])], states: new Map(), tests: vuoto });
  const sporca = reviewWeek({ week: 2, sessions: [seduta('r7b', 2, 'circuito-1', [esercizio('A2', 'bulgarian-split-squat', [...serie([7, 7], { side: 'left', note: iniezione }), ...serie([7, 7], { side: 'right', note: iniezione })], true, 1, iniezione)], iniezione)], states: new Map(), tests: vuoto });
  const a = JSON.stringify(pulita.verdicts.map((v) => ({ k: v.kind, t: v.title, c: v.change, s: v.stateAfter })));
  const b = JSON.stringify(sporca.verdicts.map((v) => ({ k: v.kind, t: v.title, c: v.change, s: v.stateAfter })));
  console.log(`   verdetti identici con e senza il testo iniettato: ${String(a === b)}`);
  console.log(`   dentro il range identico: ${String(JSON.stringify(pulita.inRange) === JSON.stringify(sporca.inRange))}`);
  console.log(`   il testo di dolore ha prodotto un rimando? ${String(JSON.stringify(sporca).toLowerCase().includes('dolor') || JSON.stringify(sporca).toLowerCase().includes('medico'))}`);
  console.log(`   verdetti generati nonostante il dolore dichiarato: ${sporca.verdicts.map((v) => v.kind).join(',') || 'nessuno'} | dentro range: ${sporca.inRange.join(',')}`);
}
