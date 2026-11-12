/*
 * 11 — L'etichetta del gradino che finisce nel diario (A11, ristretto).
 *
 * `buildDraftSession` copia `variantLabel` dall'ultima registrazione del
 * blocco e prende `level` dallo stato attuale. Il titolo del player si
 * ricalcola dal gradino (chiuso in 40cb563); il riepilogo di fine seduta e il
 * diario invece mostrano `variantLabel` così com'è quando non termina con il
 * nome dell'esercizio. Qui: tre settimane di fila, con una salita accettata
 * nella revisione fra la prima e la seconda.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/11-etichetta-diario.mts
 */
import { findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { buildDraftSession, variantLabelFor } from '../../src/engine/draft.ts';
import type { ExerciseState, LevelIndex, LoggedExercise, LoggedSession } from '../../src/types/index.ts';

const prog = findCircuitSession('circuito-1')!;
const slug = 'trazioni-prona-presa-media';
const ex = getExercise(slug);
const stato = (l: LevelIndex): ExerciseState => ({ exercise: slug, level: l, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 });
const mostrata = (e: LoggedExercise): string =>
  e.variantLabel.endsWith(ex.name) ? (e.level === null || e.variantLabel === ex.name ? '(nessuna riga)' : `Liv. ${String(e.level)}`) : e.variantLabel;

let precedente = new Map<string, LoggedExercise>();
const livelli: LevelIndex[] = [1, 3, 3, 4];
livelli.forEach((l, i) => {
  const d: LoggedSession = buildDraftSession({ id: `w${String(i)}`, date: `2026-11-1${String(i)}`, week: i + 1, session: prog, states: new Map([[slug, stato(l)]]), previous: precedente });
  const a1 = d.exercises.find((e) => e.blockCode === 'A1')!;
  const giusta = variantLabelFor(ex, stato(l));
  console.log(`${mostrata(a1) === giusta || (giusta.endsWith(ex.name) && mostrata(a1).startsWith('Liv.')) ? 'ok  ' : 'NO  '} settimana ${String(i + 1)}: gradino dello stato ${String(l)} · level registrato ${String(a1.level)} · etichetta registrata «${a1.variantLabel}» · riepilogo e diario mostrano «${mostrata(a1)}» · atteso «${giusta}»`);
  /* la seduta si chiude con delle serie: diventa la «volta scorsa» del blocco */
  precedente = new Map([['A1', { ...a1, sets: [{ setIndex: 1, side: null, value: 7, rir: null, loadKg: 0, heartRate: null, note: null }] }]]);
});
