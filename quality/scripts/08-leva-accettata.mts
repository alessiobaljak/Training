/*
 * 08 — Una leva accettata a fine seduta sopravvive al salvataggio?
 *
 * Il player guidato (03c7395..47c7f6d) adesso passa al riepilogo lo stesso
 * `decide` del player a serie: accettando, `confirmExercise(nextState)`.
 * Al «Salva e chiudi» entrambi i player eseguono, nell'ordine:
 *   for (const next of syncStatesFromLog(draft, states)) confirmExercise(next);
 * con `states` che a quel punto contiene già lo stato accettato.
 *
 * Qui si eseguono le stesse due funzioni dell'engine nello stesso ordine, con
 * i dati di una seduta vera del circuito, e si guarda lo stato che resta.
 * Non si legge il codice per dedurre: si esegue.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/08-leva-accettata.mts
 */
import { findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { evaluateProgression } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import { syncStatesFromLog } from '../../src/engine/draft.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession, TestId, TestResult } from '../../src/types/index.ts';

const VUOTO = new Map<TestId, TestResult>();

function prova(titolo: string, sessionId: 'circuito-1' | 'circuito-2' | 'circuito-3' | 'circuito-4', code: string, valori: number[], livello: LevelIndex, kg: number, settimana: number, bonus = 0, massimale: number | null = null): void {
  const s = findCircuitSession(sessionId)!;
  const block = s.blocks.find((b) => b.code === code)!;
  const ex = getExercise(block.exercise);
  const prima: ExerciseState = { exercise: ex.slug, level: livello, eccentricBonusSeconds: bonus, bottomPauseBonusSeconds: bonus, loadKg: kg };
  const logged: LoggedExercise = {
    blockCode: code, exercise: ex.slug, variantLabel: 'fixture', level: livello, tempoRespected: true,
    sets: valori.map((v, i) => ({ setIndex: i + 1, side: null, value: v, rir: null, loadKg: kg, heartRate: null, note: null })),
    note: null,
  };
  const draft: LoggedSession = { id: 'q08', date: '2026-11-12', week: settimana, sessionId, status: 'in-progress', exercises: [logged], note: null };
  const ev = evaluateProgression({ block, exercise: ex, state: prima, logged, range: resolveBlockRange(block, ex, VUOTO), week: settimana, currentMaxReps: massimale });
  const sug = ev.suggestion;
  if (sug === null) { console.log(`${titolo}: nessun suggerimento (trigger=${String(ev.triggered)})`); return; }

  /* 1. «Accetto, dalla prossima volta» → confirmExercise(nextState) */
  const stati = new Map<ExerciseSlug, ExerciseState>([[ex.slug, prima]]);
  stati.set(ex.slug, sug.nextState);
  /* 2. «Salva e chiudi» → syncStatesFromLog(draft, stati) e confirmExercise di ognuno */
  for (const next of syncStatesFromLog(draft, stati)) stati.set(next.exercise, next);
  const finale = stati.get(ex.slug)!;

  const accettato = `gradino ${String(sug.nextState.level)} · ${String(sug.nextState.loadKg)} kg · ecc+${String(sug.nextState.eccentricBonusSeconds)}"`;
  const resta = `gradino ${String(finale.level)} · ${String(finale.loadKg)} kg · ecc+${String(finale.eccentricBonusSeconds)}"`;
  const tenuto = JSON.stringify(finale) === JSON.stringify(sug.nextState);
  console.log(`${tenuto ? 'TENUTA  ' : 'ANNULLATA'} ${titolo}: leva «${sug.lever}» · prima gradino ${String(livello)} · ${String(kg)} kg → accettato ${accettato} → dopo il salvataggio ${resta}`);
}

console.log('=== Leva accettata nel riepilogo, poi «Salva e chiudi» ===');
prova('trazioni S1 A1, gradino 1, 9-9-9 su 6-8', 'circuito-1', 'A1', [9, 9, 9], 1, 0, 2);
prova('push-up S3 A2, gradino 2, 19-19-19 su 12-18', 'circuito-3', 'A2', [19, 19, 19], 2, 0, 2);
prova('push-up S3 A2, gradino 2, 18-18-18 su 12-18 (massimo esatto)', 'circuito-3', 'A2', [18, 18, 18], 2, 0, 2);
prova('curl martello S1 B1, 10-10-10 su 8-10, 12 kg, sett. 4', 'circuito-1', 'B1', [10, 10, 10], 1, 12, 4);
prova('trazioni S1 A1, gradino 6, 8-8-8, 5 kg, sett. 4', 'circuito-1', 'A1', [8, 8, 8], 6, 5, 4);
prova('trazioni S1 A1, gradino 6, tempo e pause esauriti, 8-8-8, 5 kg, sett. 4, massimale 12', 'circuito-1', 'A1', [8, 8, 8], 6, 5, 4, 2, 12);
