/*
 * 21 — R-17 sul codice: un ritest migliore alza il gradino di uno stato mai salvato?
 *
 * Criterio 9.26 di training-designer (rapporto 2026-11-21): push-up mai salvato,
 * livello di partenza dal test di settimana 0 con M=10; sedute chiuse sempre a
 * quel livello; ritest di settimana 6 con M=16. Atteso dal metodo (R9c): resta.
 * Controllo: lo stesso con lo stato salvato.
 * Esposizione: esercizi dei 4 circuiti il cui gradino iniziale dipende da un test
 * (stesso esercizio, test basso contro test alto) = esposti a R-17 se mai salvati.
 * Usa il repository vero con il suo MemoryStore, nessun browser, nessun database.
 * Uso: dalla radice di un `git archive`, node --experimental-strip-types quality/scripts/21-r17.mts
 */
import { ShadowRepository } from '../../src/db/repository.ts';
import { syncStatesFromLog } from '../../src/engine/draft.ts';
import { testResultSingle } from '../../src/engine/ranges.ts';
import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { startingLevel } from '../../src/engine/progression.ts';

const seduta = (level: number) => ({
  id: 'x', date: '2026-03-04', week: 1, status: 'completed',
  exercises: [{ exercise: 'push-up', blockCode: 'A2', level, sets: [{ reps: 12, loadKg: 0 }, { reps: 12, loadKg: 0 }] }],
}) as never;

for (const salvato of [false, true]) {
  const repo = new ShadowRepository();
  await repo.saveTestResult(testResultSingle('push-up' as never, '2026-03-02', 0, 10));
  const s0 = await repo.getExerciseState('push-up' as never);
  if (salvato) await repo.saveExerciseState(s0);
  let salvati = 0;
  for (let w = 1; w <= 6; w += 1) {
    const stato = await repo.getExerciseState('push-up' as never);
    const cambiati = syncStatesFromLog(seduta(s0.level as number), new Map([['push-up', stato]]) as never);
    for (const c of cambiati) { await repo.saveExerciseState(c); salvati += 1; }
  }
  await repo.saveTestResult(testResultSingle('push-up' as never, '2026-04-13', 6, 16));
  const s1 = await repo.getExerciseState('push-up' as never);
  console.log(`9.26 ${salvato ? 'controllo, stato salvato' : 'stato mai salvato'}: livello settimana 0 = ${String(s0.level)}, stati scritti dalle 6 chiusure = ${String(salvati)}, dopo il ritest M=16 = ${String(s1.level)} → ${s1.level === s0.level ? 'resta' : 'SALE'}`);
}

const slugs = [...new Set(CIRCUIT_SESSIONS.flatMap((s) => s.blocks.map((b) => b.exercise)))];
const prove = ['pull-up', 'dip', 'push-up', 'inverted-row-trx', 'pike-push-up', 'bulgarian-split-squat', 'nordic-curl', 'hollow-hold', 'dead-hang'];
const esposti: string[] = [];
for (const slug of slugs) {
  const ex = getExercise(slug as never);
  const basso = new Map(prove.map((t) => [t, testResultSingle(t as never, '2026-03-02', 0, 1)])) as never;
  const alto = new Map(prove.map((t) => [t, testResultSingle(t as never, '2026-03-02', 0, 999)])) as never;
  const a = startingLevel(ex, basso), b = startingLevel(ex, alto);
  if (a !== b) esposti.push(`${slug} ${String(a)}→${String(b)}`);
}
console.log(`esposti a R-17 se mai salvati: ${String(esposti.length)} esercizi su ${String(slugs.length)} dei circuiti: ${esposti.join(', ')}`);
