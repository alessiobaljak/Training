import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { rotationState, IN_A_ROW_WARNING } from '../../src/engine/rotation.ts';
import type { LoggedSession } from '../../src/types/index.ts';

function s(id: string, date: string, sessionId: any): LoggedSession {
  return { id, date, week: 1, sessionId, status: 'completed', exercises: [], note: null };
}

console.log('=== Z1 — seduta saltata e giorni di fila ===');
{
  const nessuna = rotationState('2026-01-05', []);
  console.log(`   diario vuoto → prossima=${nessuna.next} giorniDa=${String(nessuna.daysSince)} diFila=${String(nessuna.inARow)}`);
  const pausa = rotationState('2026-01-25', [s('a', '2026-01-05', 'circuito-2')]);
  console.log(`   ultima seduta 20 giorni fa → prossima=${pausa.next} giorniDa=${String(pausa.daysSince)} muscoliRipetuti=${pausa.repeatedMuscles.join(',') || 'nessuno'} diFila=${String(pausa.inARow)}`);
  console.log('   nessun rientro graduale, nessun avviso di ripresa dopo una pausa lunga: la seduta proposta è la stessa di sempre.');
  const difila = rotationState('2026-01-09', [s('a','2026-01-06','circuito-1'), s('b','2026-01-07','circuito-2'), s('c','2026-01-08','circuito-3'), s('d','2026-01-09','circuito-4')]);
  console.log(`   4 giorni di fila → diFila=${String(difila.inARow)} (soglia avviso ${String(IN_A_ROW_WARNING)}) muscoliRipetuti=${difila.repeatedMuscles.join(',')}`);
}

console.log('\n=== Z2 — attrezzatura: cosa serve e cosa ha un’alternativa ===');
{
  const conAlt: string[] = [];
  const senzaAlt = new Set<string>();
  let blocchi = 0;
  for (const sess of CIRCUIT_SESSIONS) {
    for (const b of sess.blocks) {
      blocchi += 1;
      if (b.alternatives !== undefined && b.alternatives.length > 0) conAlt.push(`${sess.id}/${b.code} ${b.exercise}`);
      else senzaAlt.add(b.exercise);
    }
  }
  console.log(`   blocchi totali: ${String(blocchi)} | con alternativa dichiarata: ${String(conAlt.length)}`);
  for (const c of conAlt) console.log(`     + ${c}`);
  console.log(`   esercizi senza nessuna alternativa (${String(senzaAlt.size)}):`);
  console.log(`     ${[...senzaAlt].join(', ')}`);
  console.log('   nota: l’anagrafica Exercise non ha nessun campo attrezzatura, e AppSettings non ha nessun campo per dichiarare cosa possiede l’atleta.');
}

console.log('\n=== Z3 — durata: esiste una seduta da 30 minuti? ===');
{
  for (const sess of CIRCUIT_SESSIONS) console.log(`   ${sess.id}: ${String(sess.estimatedMinutes)}' dichiarati, kind=${sess.kind}`);
  console.log('   nessuna variante corta dichiarata nei dati: le 4 sedute sono tutte da 40 minuti.');
}
