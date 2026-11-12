/*
 * 09 — R1, gradino di partenza dal test (PROGRAM_RULES §3, proposta 2026-11-12).
 *
 * Implementazione INDIPENDENTE di R1 scritta dal testo di
 * training/PROGRAM_RULES.md §3, righe 1-8, non dal codice. Dall'app si
 * leggono solo i DATI (catalogo, scale, test, blocchi del circuito) e si
 * chiama `startingLevel` per confrontare. Poi:
 *   A. i casi di accettazione T1.3 del rapporto training-designer 2026-11-12;
 *   B. la tabella «Esiti sul circuito» di PROGRAM_RULES §3;
 *   C. una griglia esaustiva: ogni esercizio del catalogo × valori 0..40 e
 *      assente del suo test → mio R1 vs `startingLevel`;
 *   D. i tetti «mai sopra Lt, mai sopra P» e «mai un gradino solo eccentrico»
 *      sui blocchi a range fisso;
 *   E. i flag eccentricOnly contro la lista del designer;
 *   F. `testOutcomes` (onboarding) contro il mio R1;
 *   G. salire/scendere saltando le sole negative (PROGRESSION §5).
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/09-gradino-partenza.mts
 */
import { CIRCUIT_SESSIONS, findCircuitSession } from '../../src/data/circuit.ts';
import { EXERCISES, getExercise } from '../../src/data/exercises.ts';
import { getProgressionStep, PROGRESSION_SCALES } from '../../src/data/progressions.ts';
import { testBaseline, WEEK_ZERO_TESTS } from '../../src/data/tests.ts';
/* solo confronto: */
import { startingLevel, testOutcomes } from '../../src/engine/progression.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import type { Exercise, ExerciseSlug, LevelIndex, LoggedSession, MotorPattern, ProgramBlock, TestId, TestResult } from '../../src/types/index.ts';

/* ---------------------------------------------------------------- mio R1 */
const SOLO_ECC: Record<string, number[]> = {
  'vertical-pull': [2], 'vertical-push': [3], dip: [2], 'posterior-chain': [2, 3, 4],
};
const ecc = (p: MotorPattern, l: number): boolean => (SOLO_ECC[p] ?? []).includes(l);
const giu = (p: MotorPattern, L: number): number => {
  for (let c = L - 1; c >= 1; c -= 1) if (!ecc(p, c)) return c;
  return 1;
};
const primoEseguibile = (p: MotorPattern): number => {
  for (let c = 1; c <= 6; c += 1) if (!ecc(p, c)) return c;
  return 1;
};
/* `0`→0, `1`/`0-1`→1, `2`/`1-2`→2, `—`→0 */
const rirMax = (rir: string): number => {
  if (rir === '—' || rir === '—') return 0;
  const parti = rir.split('-').map(Number);
  return parti[parti.length - 1] ?? 0;
};
const fisso = (b: ProgramBlock): boolean => b.prescription.kind === 'reps' || b.prescription.kind === 'seconds';
const soglia = (b: ProgramBlock): number | null => {
  const p = b.prescription;
  if (p.kind === 'reps') return p.min + rirMax(b.rir);
  if (p.kind === 'seconds') return p.min + Math.ceil(0.2 * p.min);
  return null;
};
const blocchiDi = (slug: ExerciseSlug): ProgramBlock[] => CIRCUIT_SESSIONS.flatMap((s) => s.blocks.filter((b) => b.exercise === slug));

function mioR1(e: Exercise, prove: ReadonlyMap<TestId, TestResult>): number | null {
  const P = e.defaultLevel;
  if (e.pattern === null || P === null) return P; // 1
  const B = blocchiDi(e.slug);
  if (B.length > 0 && B.every((b) => b.excludeFromReview === true)) return P; // 2
  const t = testBaseline(e.pattern);
  if (t === null) return P <= 2 ? P : 1; // 3
  const Lt = t.level;
  if (P < Lt) return P; // 4
  if (t.measurement !== e.measurement) return P; // 5
  const r = prove.get(t.testId);
  if (r === undefined || r.value <= 0) return primoEseguibile(e.pattern); // 6
  const fissi = B.filter((b) => b.excludeFromReview !== true && fisso(b));
  if (fissi.length === 0) return Math.min(P, Lt); // 7
  const s = Math.max(...fissi.map((b) => soglia(b) ?? -Infinity)); // 8
  return r.value >= s ? Lt : giu(e.pattern, Lt);
}

const prova1 = (testId: TestId, value: number): Map<TestId, TestResult> =>
  new Map([[testId, { testId, date: '2026-11-12', week: 0, value }]]);

let errori = 0;
const out = (ok: boolean, riga: string): void => {
  if (!ok) errori += 1;
  console.log(`${ok ? 'ok  ' : 'NO  '} ${riga}`);
};

/* ---------------------------------------------------------------- A */
console.log('=== A. Casi di accettazione T1.3 (rapporto training-designer 2026-11-12) ===');
type Caso = [ExerciseSlug, TestId | null, number | null, number];
const CASI: Caso[] = [
  ['trazioni-prona-presa-media', 'pull-up', 4, 1], ['trazioni-prona-presa-media', 'pull-up', 7, 1],
  ['trazioni-prona-presa-media', 'pull-up', 8, 3], ['trazioni-prona-presa-media', 'pull-up', 20, 3],
  ['trazioni-prona-presa-media', 'pull-up', 0, 1], ['trazioni-prona-presa-media', null, null, 1],
  ['dip-parallele-anelli', 'dip', 7, 1], ['dip-parallele-anelli', 'dip', 8, 3],
  ['bulgarian-split-squat', 'bulgarian-split-squat', 9, 1], ['bulgarian-split-squat', 'bulgarian-split-squat', 10, 2],
  ['push-up', 'push-up', 13, 1], ['push-up', 'push-up', 14, 2],
  ['pike-pushup-piedi-rialzati', 'pike-push-up', 7, 1], ['pike-pushup-piedi-rialzati', 'pike-push-up', 8, 2],
  ['rematore-inverso-trx', 'inverted-row-trx', 9, 1], ['rematore-inverso-trx', 'inverted-row-trx', 10, 2],
  ['hollow-hold', 'hollow-hold', 35, 2], ['hollow-hold', 'hollow-hold', 36, 3], ['hollow-hold', 'hollow-hold', 0, 1],
  ['hip-thrust-panca-bilaterale', null, null, 2],
  ['hip-thrust-monopodalico', null, null, 1], ['single-leg-rdl', null, null, 1],
  ['step-up-box-alto', null, null, 1], ['sissy-squat', null, null, 1],
  ['dip-panche-piedi-rialzati', 'dip', 0, 1], ['dip-panche-piedi-rialzati', null, null, 1], ['dip-panche-piedi-rialzati', 'dip', 20, 1],
  ['dead-hang', null, null, 2],
];
for (const [slug, testId, value, atteso] of CASI) {
  let e: Exercise;
  try { e = getExercise(slug); } catch { out(false, `${slug}: non esiste nel catalogo`); continue; }
  const prove = testId === null || value === null ? new Map<TestId, TestResult>() : prova1(testId, value);
  const app = startingLevel(e, prove);
  const mio = mioR1(e, prove);
  out(app === atteso && mio === atteso, `${slug} ${testId ?? 'nessun test'}=${String(value)} → app ${String(app)} · mio ${String(mio)} · atteso ${String(atteso)}`);
}
/* calf: tutti gli slug con «calf» */
for (const e of EXERCISES.filter((x) => x.slug.includes('calf'))) {
  const app = startingLevel(e, new Map());
  out(app === 1 || app === null, `${e.slug} nessun test → app ${String(app)} · atteso 1`);
}

/* ---------------------------------------------------------------- B */
console.log('\n=== B. Tabella «Esiti sul circuito» (PROGRAM_RULES §3) ===');
const TAB: [string, string, ExerciseSlug, TestId | null, number, number, number][] = [
  // dove, nome, slug, test, M≥soglia, 0<M<soglia, M=0
  ['S1 A1', 'trazioni', 'trazioni-prona-presa-media', 'pull-up', 3, 1, 1],
  ['S1 A2', 'bulgarian', 'bulgarian-split-squat', 'bulgarian-split-squat', 2, 1, 1],
  ['S1 A3', 'dip parallele', 'dip-parallele-anelli', 'dip', 3, 1, 1],
  ['S2 A1', 'pike', 'pike-pushup-piedi-rialzati', 'pike-push-up', 2, 1, 1],
  ['S2 A3', 'rematore', 'rematore-inverso-trx', 'inverted-row-trx', 2, 1, 1],
  ['S3 A2', 'push-up', 'push-up', 'push-up', 2, 1, 1],
  ['S3 B3', 'hollow', 'hollow-hold', 'hollow-hold', 3, 2, 1],
];
for (const [dove, nome, slug, testId, alto, medio, zero] of TAB) {
  const e = getExercise(slug);
  const s = Math.max(...blocchiDi(slug).filter((b) => b.excludeFromReview !== true).map((b) => soglia(b) ?? -Infinity));
  const a = startingLevel(e, prova1(testId!, s));
  const m = startingLevel(e, prova1(testId!, Math.max(1, s - 1)));
  const z = startingLevel(e, prova1(testId!, 0));
  out(a === alto && m === medio && z === zero, `${dove} ${nome}: soglia ${String(s)} · M=${String(s)}→${String(a)} (${String(alto)}) · M=${String(s - 1)}→${String(m)} (${String(medio)}) · M=0→${String(z)} (${String(zero)})`);
}

/* ---------------------------------------------------------------- C */
console.log('\n=== C. Griglia esaustiva: catalogo × valori 0..40 e assente ===');
let celle = 0;
const diff: string[] = [];
for (const e of EXERCISES) {
  const t = e.pattern === null ? null : testBaseline(e.pattern);
  const valori: (number | null)[] = [null, ...Array.from({ length: 41 }, (_, i) => i)];
  for (const v of valori) {
    const prove = t === null || v === null ? new Map<TestId, TestResult>() : prova1(t.testId, v);
    const app = startingLevel(e, prove);
    const mio = mioR1(e, prove);
    celle += 1;
    if (app !== mio) diff.push(`${e.slug} ${t?.testId ?? '-'}=${String(v)}: app ${String(app)} mio ${String(mio)}`);
  }
}
out(diff.length === 0, `${String(celle)} celle, ${String(diff.length)} differenze${diff.length > 0 ? ` → ${diff.slice(0, 8).join(' | ')}` : ''}`);

/* ---------------------------------------------------------------- D */
console.log('\n=== D. Tetti: mai sopra Lt, mai sopra P, mai un gradino solo eccentrico su un range fisso ===');
const violD: string[] = [];
for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) {
  const e = getExercise(b.exercise);
  if (e.pattern === null || e.defaultLevel === null) continue;
  const t = testBaseline(e.pattern);
  for (const v of [null, 0, 1, 3, 5, 8, 10, 15, 20, 30, 60]) {
    const prove = t === null || v === null ? new Map<TestId, TestResult>() : prova1(t.testId, v);
    const l = startingLevel(e, prove);
    if (l === null) continue;
    if (l > e.defaultLevel) violD.push(`${s.id}/${b.code} ${b.exercise} v=${String(v)} → ${String(l)} > P ${String(e.defaultLevel)}`);
    if (t !== null && e.defaultLevel >= t.level && t.measurement === e.measurement && l > t.level) violD.push(`${s.id}/${b.code} ${b.exercise} v=${String(v)} → ${String(l)} > Lt ${String(t.level)}`);
    if (fisso(b) && b.excludeFromReview !== true && getProgressionStep(e.pattern, l as LevelIndex).eccentricOnly) violD.push(`${s.id}/${b.code} ${b.exercise} v=${String(v)} → gradino ${String(l)} solo eccentrico su range fisso`);
  }
}
out(violD.length === 0, `${String(violD.length)} violazioni${violD.length > 0 ? ` → ${violD.slice(0, 6).join(' | ')}` : ''}`);

/* ---------------------------------------------------------------- E */
console.log('\n=== E. Flag eccentricOnly contro la lista del designer, e contro il nome del gradino ===');
const violE: string[] = [];
for (const scala of PROGRESSION_SCALES) for (const st of scala.steps) {
  const atteso = ecc(scala.pattern, st.level);
  if (st.eccentricOnly !== atteso) violE.push(`${scala.pattern} ${String(st.level)} «${st.name}»: flag ${String(st.eccentricOnly)} atteso ${String(atteso)}`);
  const nomeDice = /negativ|eccentric[oi]\b/i.test(st.name); /* «Con eccentrica 5"» del sissy è una ripetizione completa con discesa lenta, non un gradino di sole negative */
  if (nomeDice !== st.eccentricOnly) violE.push(`${scala.pattern} ${String(st.level)} «${st.name}»: il nome ${nomeDice ? 'dice' : 'non dice'} eccentrico, flag ${String(st.eccentricOnly)}`);
}
out(violE.length === 0, `${String(PROGRESSION_SCALES.length)} scale · ${String(violE.length)} discordanze${violE.length > 0 ? ` → ${violE.join(' | ')}` : ''}`);

/* ---------------------------------------------------------------- F */
console.log('\n=== F. Onboarding: testOutcomes contro il mio R1 ===');
const violF: string[] = [];
let righeF = 0;
for (const t of WEEK_ZERO_TESTS) {
  for (const v of [null, 0, 1, 4, 7, 8, 9, 10, 13, 14, 20, 35, 36, 60]) {
    const res = v === null ? null : { testId: t.id, date: '2026-11-12', week: 0, value: v };
    for (const esito of testOutcomes(t.id, res)) {
      righeF += 1;
      const mio = mioR1(getExercise(esito.exercise), v === null ? new Map() : prova1(t.id, v));
      if (mio !== esito.level) violF.push(`${t.id}=${String(v)} ${esito.where} ${esito.exercise}: mostrato ${String(esito.level)} mio ${String(mio)}`);
    }
  }
}
const vuoti = WEEK_ZERO_TESTS.filter((t) => testOutcomes(t.id, null).length === 0).map((t) => t.id);
out(violF.length === 0, `${String(righeF)} righe mostrate · ${String(violF.length)} differenze · test che non decidono niente: ${vuoti.join(', ')}`);

/* ---------------------------------------------------------------- G */
console.log('\n=== G. Revisione settimanale: salire e scendere saltano le sole negative sui range fissi ===');
function rev(sessionId: LoggedSession['sessionId'], code: string, valori: number[], livello: LevelIndex): string {
  const b = findCircuitSession(sessionId)!.blocks.find((x) => x.code === code)!;
  const slug = b.exercise;
  const sedute: LoggedSession[] = [1, 2].map((i) => ({
    id: `g${String(i)}`, date: `2026-11-0${String(i + 1)}`, week: 3, sessionId, status: 'completed', note: null,
    exercises: [{ blockCode: code, exercise: slug, variantLabel: 'fixture', level: livello, tempoRespected: true, note: null,
      sets: valori.map((v, k) => ({ setIndex: k + 1, side: null, value: v, rir: null, loadKg: 0, heartRate: null, note: null })) }],
  }));
  const r = reviewWeek({ week: 3, sessions: sedute, states: new Map([[slug, { exercise: slug, level: livello, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 }]]), tests: new Map() });
  const v = r.verdicts.find((x) => x.exercise === slug);
  return v === undefined ? 'nessun verdetto' : `${v.kind} → ${String(v.stateAfter.level)}`;
}
const G: [string, LoggedSession['sessionId'], string, number[], LevelIndex, string][] = [
  ['trazioni 1, tre serie da 9 su 6-8', 'circuito-1', 'A1', [9, 9, 9], 1, 'sali-di-livello → 3'],
  ['trazioni 3, tre serie da 3 su 6-8', 'circuito-1', 'A1', [3, 3, 3], 3, 'scendi-di-livello → 1'],
  ['dip 1, tre serie da 9 su 6-8', 'circuito-1', 'A3', [9, 9, 9], 1, 'sali-di-livello → 3'],
  ['dip 3, tre serie da 3', 'circuito-1', 'A3', [3, 3, 3], 3, 'scendi-di-livello → 1'],
  ['pike 2, tre serie da 9', 'circuito-2', 'A1', [9, 9, 9], 2, 'sali-di-livello → 4'],
  ['pike 4, tre serie da 3', 'circuito-2', 'A1', [3, 3, 3], 4, 'scendi-di-livello → 2'],
  ['trazioni 2 (stato vecchio, solo eccentrico), tre serie da 3', 'circuito-1', 'A1', [3, 3, 3], 2, 'scendi-di-livello → 1'],
  ['trazioni 2 (stato vecchio, solo eccentrico), tre serie da 9', 'circuito-1', 'A1', [9, 9, 9], 2, 'sali-di-livello → 3'],
];
for (const [t, sid, code, v, l, atteso] of G) {
  const r = rev(sid, code, v, l);
  out(r === atteso, `${t}: ${r} (atteso ${atteso})`);
}

console.log(`\nTotale controlli non superati: ${String(errori)}`);
if (errori > 0) process.exitCode = 1;
