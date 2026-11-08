/*
 * Ricalcolo INDIPENDENTE di durata della seduta e volume settimanale.
 * Non legge engine/rest.ts ne' engine/metrics.ts: parte dai dati di
 * src/data/circuit.ts e dalle semantiche dichiarate in src/types/program.ts.
 */
import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { MUSCLE_GROUPS, WEEKLY_SET_TARGET } from '../../src/types/index.ts';
import type { MuscleGroup, ProgramBlock, ProgramSession } from '../../src/types/index.ts';
// solo per il confronto, non per il calcolo:
import { buildGuidedPlan, estimatedSeconds } from '../../src/engine/circuit.ts';

const TRANS = 10;        // transizione tra passi di riscaldamento
const WARMUP_TO_WORK = 30;

function perRep(tut: string): number | null {
  if (!/^[0-9X]-[0-9X]-[0-9X]-[0-9X]$/.test(tut)) return null;
  const parti = tut.split('-').map((d) => (d === 'X' ? 0 : Number(d)));
  const somma = parti.reduce((a, b) => a + b, 0);
  return somma === 0 ? null : somma;
}

function minWork(b: ProgramBlock): number {
  const doppio = b.perSide ? 2 : 1;
  if (b.workSeconds !== undefined) return b.workSeconds * doppio;
  const p = b.prescription;
  if (p.kind === 'seconds') return p.min * doppio;
  if (p.kind === 'duration') return p.minMinutes * 60;
  const r = perRep(b.tut);
  if (r === null) return 0;
  if (p.kind === 'reps') return r * p.min * doppio;
  if (p.kind === 'myo-reps') return r * p.activationReps * doppio;
  return 0;
}

function blockRest(b: ProgramBlock): number {
  const r = b.rest;
  if (r.kind === 'superset') return r.blockRestSec ?? r.roundRestSec;
  if (r.kind === 'straight' || r.kind === 'cluster') return r.restSec;
  return 0;
}

function duarataIndipendente(s: ProgramSession): { totale: number; dettaglio: string[] } {
  const dettaglio: string[] = [];
  let totale = 0;

  // riscaldamento
  const passi: number[] = [];
  for (const w of s.warmupSteps ?? []) {
    if (w.rampGroup === undefined) { passi.push(w.seconds); continue; }
    const blocchi = s.blocks.filter((b) => b.group === w.rampGroup);
    for (const b of blocchi) {
      const p = b.prescription;
      const mezze = p.kind === 'reps' ? Math.max(2, Math.ceil(p.min / 2)) : null;
      const r = perRep(b.tut) ?? 0;
      const stimato = mezze === null ? 0 : mezze * r * (b.perSide ? 2 : 1);
      passi.push(Math.min(25, Math.max(15, Math.round(stimato))));
    }
  }
  const risc = passi.reduce((a, b) => a + b, 0);
  // transizioni: tra passi non-rampa. Conteggio semplificato: una transizione
  // ogni coppia di passi che non sono entrambi dentro un giro di prova.
  const rampaCount = (s.warmupSteps ?? []).filter((w) => w.rampGroup !== undefined).length;
  const nonRampa = (s.warmupSteps ?? []).length - rampaCount;
  const transizioni = Math.max(0, nonRampa - 1 + rampaCount) * TRANS;
  totale += risc + transizioni + WARMUP_TO_WORK;
  dettaglio.push(`riscaldamento ${String(risc)}s + transizioni ${String(transizioni)}s + ponte ${String(WARMUP_TO_WORK)}s`);

  // lavoro, gruppo per gruppo
  const gruppi = [...new Set(s.blocks.map((b) => b.group))];
  gruppi.forEach((g, indice) => {
    const blocchi = s.blocks.filter((b) => b.group === g);
    const giri = Math.max(...blocchi.map((b) => b.sets));
    const lavoro = blocchi.reduce((sum, b) => sum + minWork(b) * b.sets, 0);
    const primo = blocchi[0]!;
    const r = primo.rest;
    const trans = r.kind === 'superset' ? r.transitionMinSec : 0;
    const giro = r.kind === 'superset' ? r.roundRestSec : r.kind === 'straight' ? r.restSec : 0;
    const dentroGiro = blocchi.length > 1 ? (blocchi.length - 1) * trans * giri : 0;
    const traGiri = (giri - 1) * giro;
    const fineBlocco = indice === gruppi.length - 1 ? 0 : blockRest(primo);
    const somma = lavoro + dentroGiro + traGiri + fineBlocco;
    totale += somma;
    dettaglio.push(`blocco ${g}: lavoro ${String(lavoro)}s + transizioni ${String(dentroGiro)}s + giri ${String(traGiri)}s + pausa blocco ${String(fineBlocco)}s = ${String(somma)}s`);
  });

  return { totale, dettaglio };
}

console.log('## DURATA DELLA SEDUTA — ricalcolo indipendente vs piano dell’app\n');
for (const s of CIRCUIT_SESSIONS) {
  const mio = duarataIndipendente(s);
  const app = estimatedSeconds(buildGuidedPlan(s, 1));
  const appScarico = estimatedSeconds(buildGuidedPlan(s, 6));
  console.log(`${s.id}: dichiarati ${String(s.estimatedMinutes)}' | mio ricalcolo ${(mio.totale / 60).toFixed(1)}' | piano app ${(app / 60).toFixed(1)}' | scarico sett.6 ${(appScarico / 60).toFixed(1)}'`);
  for (const d of mio.dettaglio) console.log(`   - ${d}`);
  const sforo = app / 60 - s.estimatedMinutes;
  console.log(`   => scarto app-dichiarato: ${sforo > 0 ? '+' : ''}${sforo.toFixed(1)}'`);
}

console.log('\n## VOLUME SETTIMANALE — ricalcolo indipendente (4 sedute, settimana normale)\n');
const tot = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 0]));
for (const s of CIRCUIT_SESSIONS) {
  for (const b of s.blocks) {
    const e = getExercise(b.exercise);
    for (const g of e.primaryMuscles) tot.set(g, (tot.get(g) ?? 0) + b.sets);
    for (const g of e.secondaryMuscles) tot.set(g, (tot.get(g) ?? 0) + b.sets * 0.5);
  }
}
for (const g of MUSCLE_GROUPS) {
  const v = tot.get(g) ?? 0;
  const stato = v < WEEKLY_SET_TARGET.min ? 'SOTTO' : v > WEEKLY_SET_TARGET.max ? 'SOPRA' : 'dentro';
  console.log(`${g.padEnd(18)} ${String(v).padStart(5)} serie pesate — ${stato} il riferimento ${String(WEEKLY_SET_TARGET.min)}-${String(WEEKLY_SET_TARGET.max)}`);
}
