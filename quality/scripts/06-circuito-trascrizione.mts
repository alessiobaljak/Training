/*
 * Misura INDIPENDENTE della trascrizione del circuito (commit f63c9f1).
 *
 * Non legge engine/circuit.ts ne' engine/rest.ts per calcolare: ricalcola
 * durata, volume, recuperi e durata minima di serie dai dati di
 * src/data/circuit.ts e dalle semantiche dichiarate in src/types/program.ts e
 * in training/METHOD.md. L'engine lo importa solo per confrontare.
 */
import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { getProgressionScale } from '../../src/data/progressions.ts';
import { MUSCLE_GROUPS, SECONDARY_SET_WEIGHT, WEEKLY_SET_TARGET } from '../../src/types/index.ts';
import type { MuscleGroup, ProgramBlock, ProgramSession } from '../../src/types/index.ts';
/* solo confronto: */
import { buildGuidedPlan, estimatedSeconds, minWorkSeconds, groupLabel } from '../../src/engine/circuit.ts';

const TRANS_RISC = 10;
const PONTE = 30;

function perRep(tut: string): number | null {
  if (!/^[0-9X]-[0-9X]-[0-9X]-[0-9X]$/.test(tut)) return null;
  const parti = tut.split('-').map((d) => (d === 'X' ? 0 : Number(d)));
  const somma = parti.reduce((a, b) => a + b, 0);
  return somma === 0 ? null : somma;
}

/* workSeconds = tempo dell'intera stazione, lati compresi (types/program.ts). */
function lavoroDichiarato(b: ProgramBlock): number {
  if (b.workSeconds !== undefined) return b.workSeconds;
  const doppio = b.perSide ? 2 : 1;
  const p = b.prescription;
  if (p.kind === 'seconds') return p.min * doppio;
  const r = perRep(b.tut);
  if (r === null) return 0;
  if (p.kind === 'reps') return r * p.min * doppio;
  return 0;
}

/* Quanto durerebbe la stazione se il TUT prescritto venisse rispettato. */
function lavoroDaTut(b: ProgramBlock): number | null {
  const r = perRep(b.tut);
  if (r === null) return null;
  const p = b.prescription;
  if (p.kind !== 'reps') return null;
  return r * p.min * (b.perSide ? 2 : 1);
}

function durata(s: ProgramSession): { totale: number; righe: string[] } {
  const righe: string[] = [];
  let totale = 0;

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
  const rampa = (s.warmupSteps ?? []).filter((w) => w.rampGroup !== undefined).length;
  const nonRampa = (s.warmupSteps ?? []).length - rampa;
  const trans = Math.max(0, nonRampa - 1 + rampa) * TRANS_RISC;
  totale += risc + trans + PONTE;
  righe.push(`  riscaldamento ${risc}s + transizioni ${trans}s + ponte ${PONTE}s = ${risc + trans + PONTE}s`);

  const gruppi = [...new Set(s.blocks.map((b) => b.group))];
  gruppi.forEach((g, i) => {
    const blocchi = s.blocks.filter((b) => b.group === g);
    const giri = Math.max(...blocchi.map((b) => b.sets));
    const lavoro = blocchi.reduce((sum, b) => sum + lavoroDichiarato(b) * b.sets, 0);
    const primo = blocchi[0]!;
    const r = primo.rest;
    const t = r.kind === 'superset' ? r.transitionMinSec : 0;
    const giroSec = r.kind === 'superset' ? r.roundRestSec : 0;
    const dentro = blocchi.length > 1 ? (blocchi.length - 1) * t * giri : 0;
    const traGiri = (giri - 1) * giroSec;
    const blocco = i === gruppi.length - 1
      ? 0
      : (r.kind === 'superset' ? (r.blockRestSec ?? r.roundRestSec) : 0);
    const sub = lavoro + dentro + traGiri + blocco;
    totale += sub;
    righe.push(
      `  ${g} (${groupLabel(s, g)}): lavoro ${lavoro}s + transizioni ${dentro}s + giri ${traGiri}s + blocco ${blocco}s = ${sub}s`,
    );
  });

  return { totale, righe };
}

/* ------------------------------- volume ---------------------------------- */
const volume = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((m) => [m, 0]));
const volumeSenzaFinitura = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((m) => [m, 0]));

for (const s of CIRCUIT_SESSIONS) {
  for (const b of s.blocks) {
    const e = getExercise(b.exercise);
    /* una serie per lato conta una volta (METHOD §3) */
    for (const m of e.primaryMuscles) {
      volume.set(m, volume.get(m)! + b.sets);
      if (b.excludeFromReview !== true) volumeSenzaFinitura.set(m, volumeSenzaFinitura.get(m)! + b.sets);
    }
    for (const m of e.secondaryMuscles) {
      volume.set(m, volume.get(m)! + b.sets * SECONDARY_SET_WEIGHT);
      if (b.excludeFromReview !== true) {
        volumeSenzaFinitura.set(m, volumeSenzaFinitura.get(m)! + b.sets * SECONDARY_SET_WEIGHT);
      }
    }
  }
}

/* ------------------------------- stampa ---------------------------------- */
console.log('=== DURATA (ricalcolo indipendente vs engine) ===');
for (const s of CIRCUIT_SESSIONS) {
  const mio = durata(s);
  const suo = estimatedSeconds(buildGuidedPlan(s, 1));
  const min = (x: number): string => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`;
  console.log(
    `${s.id} dichiarati ${s.estimatedMinutes}' · mio ${min(mio.totale)} · engine ${min(suo)} · scarto ${Math.round(suo - mio.totale)}s`,
  );
  for (const r of mio.righe) console.log(r);
}

console.log('\n=== VOLUME SETTIMANALE (4 sedute) ===');
console.log(`riferimento METHOD §3: ${WEEKLY_SET_TARGET.min}-${WEEKLY_SET_TARGET.max}`);
for (const m of MUSCLE_GROUPS) {
  const tot = volume.get(m)!;
  const senza = volumeSenzaFinitura.get(m)!;
  const stato = tot < WEEKLY_SET_TARGET.min ? 'SOTTO' : tot > WEEKLY_SET_TARGET.max ? 'SOPRA' : 'in fascia';
  console.log(`${m.padEnd(18)} ${String(tot).padStart(6)}  (senza finitura/decompr. ${String(senza).padStart(5)})  ${stato}`);
}

console.log('\n=== workSeconds vs TUT (il monito della durata minima) ===');
for (const s of CIRCUIT_SESSIONS) {
  for (const b of s.blocks) {
    const tut = lavoroDaTut(b);
    if (tut === null || b.workSeconds === undefined) continue;
    if (b.workSeconds < tut) {
      console.log(
        `${s.id}/${b.code} ${b.exercise}: dichiarato ${b.workSeconds}s < TUT×min ${tut}s (${b.tut}, ${JSON.stringify(b.prescription)}, perSide ${String(b.perSide)})`,
      );
    }
  }
}

console.log('\n=== perSide del gradino vs workSeconds fisso ===');
for (const s of CIRCUIT_SESSIONS) {
  for (const b of s.blocks) {
    const e = getExercise(b.exercise);
    if (e.pattern === null) continue;
    const mappa = getProgressionScale(e.pattern).steps.map((st) => st.perSide);
    const dichiarato = b.perSide;
    const diversi = mappa
      .map((v, i) => ({ livello: i + 1, perSide: v }))
      .filter((x) => x.perSide !== dichiarato);
    if (diversi.length === 0) continue;
    const ws = b.workSeconds;
    console.log(
      `${s.id}/${b.code} ${b.exercise} (scala ${e.pattern}, default ${String(e.defaultLevel)}, blocco perSide ${String(dichiarato)}, workSeconds ${String(ws)}): gradini con perSide diverso → ${diversi.map((x) => `${x.livello}:${String(x.perSide)}`).join(' ')}`,
    );
    if (ws !== undefined) {
      const finto = { ...b, perSide: !dichiarato } as ProgramBlock;
      console.log(`    countdown al gradino opposto: ${minWorkSeconds(finto)}s (resta ${ws}s)`);
    }
  }
}

console.log('\n=== RECUPERI: ultimo lavoro di B → prima stazione di F ===');
for (const s of CIRCUIT_SESSIONS) {
  const plan = buildGuidedPlan(s, 1);
  for (let i = 0; i < plan.length; i += 1) {
    const step = plan[i]!;
    if (step.kind !== 'work' || step.group !== 'B') continue;
    const next = plan[i + 1];
    if (next === undefined) continue;
    if (next.kind === 'work' && next.group === 'F') {
      console.log(`${s.id}: ${step.exercise} → ${next.exercise} · NESSUN PASSO DI RECUPERO`);
    } else if (next.kind === 'rest') {
      const dopo = plan[i + 2];
      if (dopo !== undefined && dopo.kind === 'work' && dopo.group === 'F') {
        console.log(`${s.id}: ${step.exercise} → [${next.tier} ${next.seconds}s] → ${dopo.exercise}`);
      }
    }
  }
}

console.log('\n=== BALISTICO E CERNIERE D\'ANCA PER SEDUTA (PROGRAM_RULES §2) ===');
for (const s of CIRCUIT_SESSIONS) {
  const righe: string[] = [];
  for (const w of s.warmupSteps ?? []) {
    if (w.exercise === undefined) continue;
    const e = getExercise(w.exercise);
    if (e.pattern === 'hip-hinge' || w.exercise === 'kb-swing') righe.push(`riscaldamento:${w.exercise}`);
  }
  for (const b of s.blocks) {
    const e = getExercise(b.exercise);
    if (e.pattern === 'hip-hinge' || e.pattern === 'hip-thrust' || b.exercise === 'kb-swing') {
      righe.push(`${b.code}:${b.exercise}(${String(e.pattern)})`);
    }
  }
  console.log(`${s.id}: ${righe.join(' · ')}`);
}

console.log('\n=== ALTERNATIVE DICHIARATE (PROGRAM_RULES §6) ===');
let alt = 0;
let blocchi = 0;
for (const s of CIRCUIT_SESSIONS) {
  for (const b of s.blocks) {
    blocchi += 1;
    alt += (b.alternatives ?? []).length;
  }
}
console.log(`blocchi ${blocchi} · alternative totali ${alt}`);

console.log('\n=== CAMPI DI SICUREZZA SULLA SCHEDA ESERCIZIO (BOUNDARIES L8/L3) ===');
const campi = Object.keys(getExercise('kb-swing'));
console.log(`campi: ${campi.join(', ')}`);
for (const atteso of ['equipment', 'minLevel', 'prerequisites', 'sites', 'contraindications']) {
  console.log(`  ${atteso}: ${campi.includes(atteso) ? 'presente' : 'ASSENTE'}`);
}
