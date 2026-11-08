import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
for (const s of CIRCUIT_SESSIONS) {
  console.log(`\n### ${s.id} — ${s.name} / ${s.focus} — ${String(s.estimatedMinutes)}'`);
  for (const b of s.blocks) {
    const e = getExercise(b.exercise);
    const p = b.prescription;
    const pres = p.kind === 'reps' ? `reps ${p.min}-${p.max}` : p.kind === 'seconds' ? `sec ${p.min}-${p.max}` : p.kind === 'duration' ? `min ${p.minMinutes}-${p.maxMinutes}` : p.kind;
    console.log([b.code, b.group, b.exercise, `set=${b.sets}`, pres, `tut=${b.tut}`, `rir=${b.rir}`, b.perSide ? 'perSide' : '-', b.excludeFromReview ? 'EXCL' : '-', `lvl=${String(e.defaultLevel)}`, `pat=${String(e.pattern)}`, `load=${e.loadPolicy}`, `meas=${e.measurement}`, b.alternatives ? `alt=${b.alternatives.map(a=>a.exercise).join('|')}` : ''].join(' · '));
  }
}
