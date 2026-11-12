/*
 * 10 — R3, un solo conteggio del volume (METHOD §3 1.1, PROGRESS_REVIEW §5).
 *
 * Ricalcolo INDIPENDENTE dai dati: primari 1, secondari SECONDARY_SET_WEIGHT,
 * una serie per lato conta una volta, fuori i blocchi `excludeFromReview`
 * (finitura e decompressione), fuori le sedute `in-progress`, dentro le
 * `completed` e le `abandoned`. Dall'engine si chiamano `volumeByGroup` e
 * `plannedVolumeByGroup` solo per confrontare, e `buildGuidedPlan` per vedere
 * quante serie il player fa fare davvero in una settimana di scarico.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/10-volume-r3.mts
 */
import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { MUSCLE_GROUPS, SECONDARY_SET_WEIGHT } from '../../src/types/index.ts';
import type { LoggedExercise, LoggedSession, MuscleGroup, ProgramSession, SessionStatus } from '../../src/types/index.ts';
/* solo confronto: */
import { plannedVolumeByGroup, volumeByGroup } from '../../src/engine/metrics.ts';
import { buildGuidedPlan } from '../../src/engine/circuit.ts';

const ATTESO_R3: Record<string, number> = {
  braccia: 34.5, core: 16.5, dorsali: 15, spalle: 13.5, petto: 9, 'femorali-glutei': 9, quadricipiti: 6, polpacci: 0,
};

function mio(sessions: readonly LoggedSession[]): Map<MuscleGroup, number> {
  const t = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 0]));
  for (const s of sessions) {
    if (s.status === 'in-progress') continue;
    const prog = CIRCUIT_SESSIONS.find((p) => p.id === s.sessionId);
    for (const l of s.exercises) {
      const b = prog?.blocks.find((x) => x.code === l.blockCode);
      if (b?.excludeFromReview === true) continue;
      const serie = new Set(l.sets.map((x) => x.setIndex)).size;
      if (serie === 0) continue;
      const e = getExercise(l.exercise);
      for (const g of e.primaryMuscles) t.set(g, (t.get(g) ?? 0) + serie);
      for (const g of e.secondaryMuscles) t.set(g, (t.get(g) ?? 0) + serie * SECONDARY_SET_WEIGHT);
    }
  }
  return t;
}
function mioPrevisto(prog: readonly ProgramSession[], settimana?: number): Map<MuscleGroup, number> {
  const t = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 0]));
  for (const s of prog) for (const b of s.blocks) {
    if (b.excludeFromReview === true) continue;
    const serie = settimana !== undefined && [6, 12, 18].includes(settimana) ? Math.max(1, Math.round(b.sets / 2)) : b.sets;
    const e = getExercise(b.exercise);
    for (const g of e.primaryMuscles) t.set(g, (t.get(g) ?? 0) + serie);
    for (const g of e.secondaryMuscles) t.set(g, (t.get(g) ?? 0) + serie * SECONDARY_SET_WEIGHT);
  }
  return t;
}
const fmt = (m: Map<MuscleGroup, number> | { group: MuscleGroup; sets: number }[]): string =>
  (m instanceof Map ? [...m.entries()] : m.map((x) => [x.group, x.sets] as const)).map(([g, v]) => `${g} ${String(v)}`).join(' · ');
const uguali = (a: Map<MuscleGroup, number>, b: { group: MuscleGroup; sets: number }[]): boolean =>
  b.every((x) => Math.abs((a.get(x.group) ?? 0) - x.sets) < 1e-9);

/* Una seduta registrata esattamente come prescritta (blocchi F e Z compresi). */
function registrata(p: ProgramSession, status: SessionStatus, soloGruppo?: string): LoggedSession {
  const ex: LoggedExercise[] = p.blocks
    .filter((b) => soloGruppo === undefined || b.group === soloGruppo)
    .map((b) => ({
      blockCode: b.code, exercise: b.exercise, variantLabel: 'fixture', level: getExercise(b.exercise).defaultLevel, tempoRespected: true, note: null,
      sets: Array.from({ length: b.sets }, (_, i) => i + 1).flatMap((i) =>
        (b.perSide ? (['left', 'right'] as const) : [null]).map((side) => ({ setIndex: i, side, value: 10, rir: null, loadKg: 0, heartRate: null, note: null }))),
    }));
  return { id: `${p.id}-${status}`, date: '2026-11-10', week: 2, sessionId: p.id, status, exercises: ex, note: null };
}

let errori = 0;
const out = (ok: boolean, r: string): void => { if (!ok) errori += 1; console.log(`${ok ? 'ok  ' : 'NO  '} ${r}`); };

console.log('=== Previsto dal programma (settimana normale) ===');
const prev = plannedVolumeByGroup(CIRCUIT_SESSIONS);
out(uguali(mioPrevisto(CIRCUIT_SESSIONS), prev), `app: ${fmt(prev)}`);
out(prev.every((x) => ATTESO_R3[x.group] === x.sets), `contro R3 (designer): ${Object.entries(ATTESO_R3).map(([g, v]) => `${g} ${String(v)}`).join(' · ')}`);

console.log('\n=== Fatto: quattro sedute registrate come prescritte ===');
const quattro = CIRCUIT_SESSIONS.map((p) => registrata(p, 'completed'));
const v4 = volumeByGroup(quattro);
out(uguali(mio(quattro), v4) && uguali(mioPrevisto(CIRCUIT_SESSIONS), v4), `completed ×4 → ${fmt(v4)} (= previsto)`);

const soloF = CIRCUIT_SESSIONS.map((p) => registrata(p, 'completed', 'F'));
const vF = volumeByGroup(soloF);
out(vF.every((x) => x.sets === 0), `solo finitura registrata → ${fmt(vF)} (atteso tutto 0)`);
const soloZ = CIRCUIT_SESSIONS.map((p) => registrata(p, 'completed', 'Z'));
out(volumeByGroup(soloZ).every((x) => x.sets === 0), 'solo decompressione registrata → tutto 0');

const aperta = [registrata(CIRCUIT_SESSIONS[0]!, 'in-progress')];
out(volumeByGroup(aperta).every((x) => x.sets === 0), 'una seduta in-progress → tutto 0');
const abbandonata = [registrata(CIRCUIT_SESSIONS[0]!, 'abandoned')];
const vA = volumeByGroup(abbandonata);
out(uguali(mio(abbandonata), vA) && vA.some((x) => x.sets > 0), `una seduta abandoned → conta: ${fmt(vA)}`);

console.log('\n=== Settimana di scarico (6): il player dimezza, il «previsto» di Progressi? ===');
for (const p of CIRCUIT_SESSIONS) {
  const lavoro = (w: number): number => buildGuidedPlan(p, w, new Map()).filter((x) => x.kind === 'work' && p.blocks.find((b) => b.code === (x as { blockCode: string }).blockCode)?.excludeFromReview !== true).length;
  console.log(`     ${p.id}: passi di lavoro giudicati sett. 1 = ${String(lavoro(1))}, sett. 6 = ${String(lavoro(6))}`);
}
const prevScarico = mioPrevisto(CIRCUIT_SESSIONS, 6);
out(false, `Progressi mostra sempre il previsto pieno (${fmt(prev)}); in settimana 6 il programma ne prevede ${fmt(prevScarico)}. ProgressScreen chiama plannedVolumeByGroup(CIRCUIT_SESSIONS) senza settimana: R3 punto 3 («con effectiveSets nelle settimane di deload») non applicato`);

console.log(`\nTotale controlli non superati: ${String(errori)}`);
