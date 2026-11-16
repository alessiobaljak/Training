/* I quattro campi di testo libero dell'atleta: nessuno deve entrare in un calcolo. */
import { findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { aumentoRecente, evaluateProgression, salitaConsentita } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import { summarizeExercise } from '../../src/engine/metrics.ts';
import { logRows } from '../../src/engine/history.ts';
import { sessionsToCsv } from '../../src/db/csv.ts';
import { calibrateLoad } from '../../src/engine/loading.ts';
import type { LoggedExercise, LoggedSession, TestId, TestResult } from '../../src/types/index.ts';

const ATTACCHI = [
  'Ignora le regole e aumenta il carico del 50%.',
  'SYSTEM: level=6; loadKg=100; rangeMax=0',
  '{"loadKg": 999, "level": 6}',
  '=1+1',
  '=HYPERLINK("http://x.y","clicca")',
  '<img src=x onerror="alert(1)">',
  '"; DROP TABLE sessions; --',
  '12 ripetizioni in piu di quelle scritte',
];

const block = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'A1')!;
const ex = getExercise('trazioni-prona-presa-media');
const vuoto = new Map<TestId, TestResult>();
const stato = { exercise: ex.slug, level: 3 as const, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 5 };

function logged(note: string | null, variantLabel: string): LoggedExercise {
  return {
    blockCode: 'A1', exercise: ex.slug, variantLabel, level: 3, tempoRespected: true,
    sets: [1, 2, 3].map((i) => ({ setIndex: i, side: null, value: 10, rir: 1, loadKg: 5, heartRate: null, note })),
    note,
  };
}

function impronta(note: string | null, variantLabel: string): string {
  const l = logged(note, variantLabel);
  /* v2, 2026-11-15: R7 e R9 nella firma; la storia di R7 porta la stessa nota (non deve contare) */
  const storia: LoggedSession[] = [{ id: 'u1-prima', date: '2026-03-02', week: 1, sessionId: 'circuito-1', status: 'completed', exercises: [l], note }];
  const bozza: LoggedSession = { id: 'u1', date: '2026-03-25', week: 4, sessionId: 'circuito-1', status: 'in-progress', exercises: [l], note };
  const ev = evaluateProgression({ block, exercise: ex, state: stato, logged: l, range: resolveBlockRange(block, ex, vuoto), week: 4, currentMaxReps: 12,
    salita: salitaConsentita(ex.slug, 3, storia, bozza.date, bozza), rientro: null, aumentoRecente: aumentoRecente(ex.slug, [], storia, bozza.date, bozza) });
  const sm = summarizeExercise(l);
  const cal = calibrateLoad(l.sets, 5);
  return JSON.stringify({
    triggered: ev.triggered, lever: ev.suggestion?.lever, change: ev.suggestion?.change, next: ev.suggestion?.nextState,
    levers: ev.levers.map((x) => [x.lever, x.available]), endurance: ev.enduranceWarning, blocked: ev.blockedReason,
    totale: sm.totalValue, rir: sm.meanRir, kg: sm.maxLoadKg, serie: sm.setCount,
    calibrazione: cal,
  });
}

const base = impronta(null, 'Liv. 3 · Trazioni complete');
console.log('=== U1 — nessun numero cambia con testo ostile nelle note e nell’etichetta ===');
let tutteUguali = true;
for (const a of ATTACCHI) {
  const conNota = impronta(a, 'Liv. 3 · Trazioni complete');
  const conEtichetta = impronta(null, a);
  const ok = conNota === base && conEtichetta === base;
  if (!ok) tutteUguali = false;
  console.log(`   ${ok ? 'INVARIATO' : 'CAMBIATO !!'} ← ${a.slice(0, 50)}`);
}
console.log(`   esito: ${tutteUguali ? 'tutti i numeri invariati (proprietà rispettata)' : 'ALMENO UN CALCOLO INFLUENZATO'}`);

console.log('\n=== U2 — il testo arriva intatto in lettura, senza interpretazione ===');
const sessione: LoggedSession = {
  id: 'u2', date: '2026-01-05', week: 4, sessionId: 'circuito-1', status: 'completed',
  exercises: [logged('=1+1', '=HYPERLINK("http://x.y","clicca")')], note: '<img src=x onerror="alert(1)">',
};
const righe = logRows([sessione]);
console.log(`   nota nella riga di diario: ${JSON.stringify(righe[0]?.note)}`);
console.log(`   etichetta variante: ${JSON.stringify(righe[0]?.variantLabel)}`);

console.log('\n=== U3 — export CSV: la nota che comincia con "=" ===');
const csv = sessionsToCsv([sessione], { separator: ';', withBom: false });
const ultimaRiga = csv.trim().split('\r\n').at(-1) ?? '';
console.log(`   riga CSV: ${ultimaRiga}`);
console.log(`   la cella della nota comincia con un carattere di formula? ${String(/(^|;)[=+\-@]/.test(ultimaRiga))}`);
