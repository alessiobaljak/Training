/*
 * 12 — R8 + R5/R6/R7 della revisione settimanale, ricalcolate dal testo.
 *
 * v1, 2026-11-15 (commit ff42dfb). Riferimento scritto da
 * `training/PROGRESS_REVIEW.md` §6 e `training/PROGRESSION_RULES.md` §9,
 * NON da `src/engine/review.ts`. Dal codice si prendono solo dati (scheda del
 * circuito, scale con i gradini solo eccentrici, test di riferimento dello
 * schema) e `reviewWeek`, che è l'oggetto misurato.
 *
 * Tre parti:
 *   A  confronto differenziale su mondi casuali con seme fisso (ripetibile):
 *      per ogni esercizio che compare, la categoria (verdetto e tipo, oppure
 *      pocheProve, rimandati, fermi, inAttesa, alMassimo, inRange) e lo stato
 *      dopo devono coincidere; poi stato, finestra, sessionsCounted,
 *      setsCounted.
 *   B  proprietà di sicurezza lette solo sull'uscita dell'engine, senza il
 *      riferimento: S3 (tempo sì sulle due sedute), S4 (2 sedute utili, 3
 *      serie vere), S5 (zavorra solo a variante finita e sopra soglia), S1
 *      (14 giorni al gradino), E4 (niente aumenti da numeri di scarico).
 *   C  atleta simulato 12 settimane, fine seduta + revisione, ogni leva e ogni
 *      verdetto accettati: mai due salite di gradino a meno di 14 giorni.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/12-r8-revisione.mts
 * Esce 1 se A, B o C trovano una differenza.
 */
import { CIRCUIT_SESSIONS, findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { getProgressionStep } from '../../src/data/progressions.ts';
import { testBaseline } from '../../src/data/tests.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import { evaluateProgression, salitaConsentita } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import type {
  ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession, LoggedSet, MotorPattern, ProgramBlock, TestId, TestResult,
} from '../../src/types/index.ts';

/* ---------------------------------------------------------------- date -- */
const MS = 86_400_000;
const g = (d: string): number => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / MS;
const d = (n: number): string => new Date(n * MS).toISOString().slice(0, 10);
const piu = (x: string, n: number): string => d(g(x) + n);
const INIZIO = '2026-03-02'; // lunedì
const fineSett = (w: number): string => piu(INIZIO, 7 * w - 1);
const settDi = (x: string): number => Math.floor((g(x) - g(INIZIO)) / 7) + 1;
const SCARICO = new Set([6, 12, 18]); // program.ts, verificato a mano: DELOAD_WEEKS
const SBLOCCO_ZAVORRA = 3;

/* -------------------------------------------------------------- PRNG ---- */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------------------- esercizi della fixture --- */
type Sid = 'circuito-1' | 'circuito-2' | 'circuito-3' | 'circuito-4';
interface Voce { sid: Sid; code: string; slug: ExerciseSlug; block: ProgramBlock; min: number; max: number; unit: 'reps' | 'seconds'; perSide: boolean; escluso: boolean; pattern: MotorPattern | null; policy: string }
function voce(sid: Sid, code: string): Voce {
  const block = findCircuitSession(sid)!.blocks.find((b) => b.code === code)!;
  const ex = getExercise(block.exercise);
  const p = block.prescription;
  if (p.kind !== 'reps' && p.kind !== 'seconds') throw new Error(`fixture: ${sid}/${code} non ha un range fisso`);
  if ((block.alternatives ?? []).length > 0) throw new Error(`fixture: ${sid}/${code} ha alternative, il riferimento non le modella`);
  return { sid, code, slug: ex.slug, block, min: p.min, max: p.max, unit: p.kind === 'reps' ? 'reps' : 'seconds', perSide: block.perSide === true, escluso: block.excludeFromReview === true, pattern: ex.pattern, policy: ex.loadPolicy };
}
const VOCI: Voce[] = [
  voce('circuito-1', 'A1'), voce('circuito-1', 'A2'), voce('circuito-1', 'A3'), voce('circuito-1', 'B1'), voce('circuito-1', 'B3'), voce('circuito-1', 'F1'), voce('circuito-1', 'Z1'),
  voce('circuito-2', 'A1'), voce('circuito-2', 'A3'), voce('circuito-2', 'B3'),
  voce('circuito-3', 'A2'), voce('circuito-3', 'B3'), voce('circuito-3', 'F1'),
  voce('circuito-4', 'A1'), voce('circuito-4', 'B2'),
];
const perSlug = new Map(VOCI.filter((v) => !v.escluso).map((v) => [v.slug, v]));
/* 8.25 (coppia con range diversi) è eseguibile solo se un esercizio giudicato sta in due blocchi.
   Il riferimento non modella il confronto di range: se la scheda cambia, questo controllo lo dice. */
{
  const blocchi = new Map<string, string[]>();
  for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) if (b.excludeFromReview !== true) blocchi.set(b.exercise, [...(blocchi.get(b.exercise) ?? []), `${s.id}/${b.code}`]);
  const doppi = [...blocchi].filter(([, l]) => l.length > 1);
  console.log(doppi.length === 0 ? '8.25 NON COPERTA: nessun esercizio giudicato sta in due blocchi (riferimento valido così)' : `8.25 ESEGUIBILE: ${doppi.map(([e, l]) => `${e} in ${l.join(', ')}`).join(' | ')} — aggiornare il riferimento`);
  if (doppi.length > 0) process.exitCode = 1;
}

/* ---------------------------------------------------- riferimento ------ */
/* Serie vere: setIndex con una riga senza lato, o con sinistro e destro. */
function serieVereRif(sets: readonly LoggedSet[]): Set<number> {
  const m = new Map<number, Set<string>>();
  for (const s of sets) { const x = m.get(s.setIndex) ?? new Set(); x.add(s.side ?? '-'); m.set(s.setIndex, x); }
  return new Set([...m].filter(([, l]) => l.has('-') || (l.has('left') && l.has('right'))).map(([i]) => i));
}
function vicino(pattern: MotorPattern, level: number, dir: 1 | -1, salta: boolean): number | null {
  for (let c = level + dir; c >= 1 && c <= 6; c += dir) {
    if (salta && getProgressionStep(pattern, c as LevelIndex).eccentricOnly) continue;
    return c;
  }
  return null;
}
type Esito = { cat: string; dopo?: string };
interface Rif { stato: string; dal: string; al: string; sessionsCounted: number; setsCounted: number; per: Map<ExerciseSlug, Esito> }

function riferimento(W: number, sessions: readonly LoggedSession[], states: ReadonlyMap<ExerciseSlug, ExerciseState>, tests: ReadonlyMap<TestId, TestResult>, weekEnd: string, today: string): Rif {
  const dal = piu(weekEnd, -13);
  const stato = today <= weekEnd ? 'in-corso' : today <= piu(weekEnd, 7) ? 'aperta' : 'scaduta';
  const chiuse = sessions.filter((s) => s.status === 'completed').sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1));
  const sessionsCounted = chiuse.filter((s) => s.week === W).length;
  const per = new Map<ExerciseSlug, Esito>();
  if (stato !== 'aperta') return { stato, dal, al: weekEnd, sessionsCounted, setsCounted: 0, per };
  /* voce strutturale: blocco dichiarato con quel codice, stesso esercizio, non escluso, range max > 0, serie > 0 */
  const strutturali = (s: LoggedSession, slug: ExerciseSlug): LoggedExercise[] => s.exercises.filter((x) => {
    if (x.exercise !== slug || x.sets.length === 0) return false;
    const b = findCircuitSession(s.sessionId as Sid)?.blocks.find((bb) => bb.code === x.blockCode);
    return b !== undefined && b.exercise === x.exercise && b.excludeFromReview !== true;
  });
  const compaiono: ExerciseSlug[] = [];
  for (const s of chiuse.filter((x) => x.week === W)) for (const x of s.exercises) if (perSlug.has(x.exercise) && strutturali(s, x.exercise).length > 0 && !compaiono.includes(x.exercise)) compaiono.push(x.exercise);
  let setsCounted = 0;
  for (const slug of compaiono) {
    const v = perSlug.get(slug)!;
    const L = states.get(slug)!;
    const sue = chiuse.filter((s) => strutturali(s, slug).length > 0);
    const dopo = sue.find((s) => s.date > weekEnd && s.date <= today);
    if (dopo !== undefined) { per.set(slug, { cat: 'rimandati' }); continue; }
    const allo = (s: LoggedSession): boolean => strutturali(s, slug).every((x) =>
      (v.pattern === null || x.level === L.level) && (v.policy === 'forbidden' || Math.max(0, ...x.sets.map((y) => y.loadKg)) === L.loadKg));
    const dentro = (s: LoggedSession): boolean => s.date >= dal && s.date <= weekEnd;
    const ultime = sue.filter((s) => s.date <= weekEnd).slice(-2);
    const a = ultime.at(-1);
    const b = ultime.length === 2 ? ultime[0] : undefined;
    const utili: LoggedSession[] = [];
    if (a !== undefined && allo(a) && dentro(a)) {
      utili.push(a);
      if (b !== undefined && allo(b) && dentro(b)) utili.push(b); // stesso range: un esercizio sta in un blocco solo (8.25 non coperta)
    }
    const voci = utili.flatMap((s) => strutturali(s, slug));
    const nSerie = voci.reduce((t, x) => t + serieVereRif(x.sets).size, 0);
    setsCounted += nSerie;
    if (utili.length < 2 || nSerie < 3) { per.set(slug, { cat: 'pocheProve' }); continue; }
    const valori = voci.flatMap((x) => { const vv = serieVereRif(x.sets); return x.sets.filter((y) => vv.has(y.setIndex)).map((y) => y.value); });
    const lv = L.level;
    /* discesa: non passa dal cancello */
    if (valori.every((x) => x < v.min)) {
      const giu = v.pattern === null || lv === null ? null : vicino(v.pattern, lv, -1, true);
      per.set(slug, giu === null ? { cat: 'v:range-da-rifare', dopo: JSON.stringify(L) } : { cat: 'v:scendi-di-livello', dopo: `liv ${String(giu)}` });
      continue;
    }
    if (!valori.every((x) => x >= v.max)) { per.set(slug, { cat: 'inRange' }); continue; }
    /* E4 */
    if (SCARICO.has(W + 1) || utili.some((s) => SCARICO.has(s.week))) { per.set(slug, { cat: 'fermi' }); continue; }
    /* E2 */
    const tempi = voci.map((x) => x.tempoRespected);
    if (tempi.some((t) => t === false)) { per.set(slug, { cat: 'v:rifai-al-tempo-giusto', dopo: JSON.stringify(L) }); continue; }
    if (tempi.some((t) => t !== true)) { per.set(slug, { cat: 'v:rispondi-sul-tempo', dopo: JSON.stringify(L) }); continue; }
    const su = v.pattern === null || lv === null ? null : vicino(v.pattern, lv, 1, true);
    /* R7 sulla salita */
    if (valori.every((x) => x > v.max) && su !== null) {
      let inizio: string | null = null; let prec: number | null | undefined;
      for (const s of chiuse) for (const x of s.exercises) {
        if (x.exercise !== slug || x.level === null || x.sets.length === 0) continue;
        if (x.level === lv) { if (prec !== lv) inizio = s.date; } else inizio = null;
        prec = x.level;
      }
      if (inizio !== null && g(today) - g(inizio) >= 14) per.set(slug, { cat: 'v:sali-di-livello', dopo: `liv ${String(su)}` });
      else per.set(slug, { cat: 'inAttesa' });
      continue;
    }
    /* R6 */
    if (su !== null) { per.set(slug, { cat: 'alMassimo:tempo' }); continue; }
    if (v.policy === 'forbidden') { per.set(slug, { cat: 'alMassimo:leve-finite' }); continue; }
    if (v.policy !== 'inherent' && W + 1 < SBLOCCO_ZAVORRA) { per.set(slug, { cat: 'alMassimo:settimana' }); continue; }
    const soglia = v.pattern === 'vertical-pull' ? 8 : v.pattern === 'dip' ? 10 : null;
    if (soglia !== null) {
      const M = tests.get(testBaseline(v.pattern!)!.testId)?.value;
      if (M === undefined) { per.set(slug, { cat: 'alMassimo:nessun-test' }); continue; }
      if (M < soglia) { per.set(slug, { cat: 'alMassimo:soglia' }); continue; }
    }
    per.set(slug, { cat: 'v:aggiungi-peso', dopo: `kg ${String(L.loadKg + 2.5)}` });
  }
  return { stato, dal, al: weekEnd, sessionsCounted, setsCounted, per };
}

function daEngine(r: ReturnType<typeof reviewWeek>): Map<ExerciseSlug, Esito> {
  const m = new Map<ExerciseSlug, Esito>();
  const metti = (slug: ExerciseSlug, e: Esito): void => {
    if (m.has(slug)) m.set(slug, { cat: `DOPPIO(${m.get(slug)!.cat}+${e.cat})` }); else m.set(slug, e);
  };
  for (const v of r.verdicts) {
    const dopo = v.kind === 'sali-di-livello' || v.kind === 'scendi-di-livello' ? `liv ${String(v.stateAfter.level)}` : v.kind === 'aggiungi-peso' ? `kg ${String(v.stateAfter.loadKg)}` : JSON.stringify(v.stateAfter);
    metti(v.exercise, { cat: `v:${v.kind}`, dopo });
  }
  for (const x of r.pocheProve) metti(x.exercise, { cat: 'pocheProve' });
  for (const x of r.rimandati) metti(x.exercise, { cat: 'rimandati' });
  for (const x of r.fermi) metti(x.exercise, { cat: 'fermi' });
  for (const x of r.inAttesa) metti(x.exercise, { cat: 'inAttesa' });
  for (const x of r.alMassimo) metti(x.exercise, { cat: `alMassimo:${x.motivo}` });
  for (const n of r.inRange) { const v = VOCI.find((y) => getExercise(y.slug).name === n); if (v !== undefined) metti(v.slug, { cat: 'inRange' }); }
  return m;
}

/* ------------------------------------------------- generatore mondi --- */
function mondo(rnd: () => number, n: number) {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const states = new Map<ExerciseSlug, ExerciseState>();
  for (const v of perSlug.values()) {
    const level = v.pattern === null ? null : (pick([1, 1, 2, 3, 3, 4, 5, 6, 6]) as LevelIndex);
    const loadKg = v.policy === 'forbidden' ? 0 : pick([0, 0, 2.5, 5, 10, 12]);
    states.set(v.slug, { exercise: v.slug, level, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg });
  }
  const tests = new Map<TestId, TestResult>();
  const tp = pick([null, 6, 8, 12]); if (tp !== null) tests.set('pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: tp });
  const td = pick([null, 9, 10, 14]); if (td !== null) tests.set('dip' as TestId, { testId: 'dip' as TestId, date: '2026-02-23', week: 0, value: td });
  /* metà dei mondi con un atleta «ordinato» (gradino e carico quasi sempre quelli dello stato): più verdetti */
  const coerente = n % 2 === 0 ? 0.75 : 0.97;
  const sessions: LoggedSession[] = [];
  const quante = 3 + Math.floor(rnd() * 18);
  for (let i = 0; i < quante; i += 1) {
    const date = d(g('2026-02-23') + Math.floor(rnd() * 63));
    const sid = pick(['circuito-1', 'circuito-2', 'circuito-3', 'circuito-4'] as const);
    const week = rnd() < 0.05 ? Math.max(1, settDi(date) + pick([-1, 1])) : Math.max(1, settDi(date));
    const status = rnd() < 0.85 ? 'completed' : pick(['in-progress', 'abandoned'] as const);
    const exercises: LoggedExercise[] = [];
    for (const v of VOCI.filter((x) => x.sid === sid)) {
      if (rnd() < 0.15) continue;
      const L = states.get(v.slug);
      const level = v.pattern === null ? null : (rnd() < coerente ? (L?.level ?? 2) : pick([1, 2, 3, 4, 5, 6]) as LevelIndex);
      const kg = v.policy === 'forbidden' ? 0 : rnd() < coerente ? (L?.loadKg ?? 0) : pick([0, 2.5, 5, 10, 12, 14]);
      const giri = SCARICO.has(week) ? 2 : pick([1, 2, 3, 3, 3]);
      const modo = pick(['sotto', 'max', 'sopra', 'sopra', 'misto', 'dentro']);
      const valore = (): number => modo === 'sotto' ? v.min - 1 - Math.floor(rnd() * 2) : modo === 'max' ? v.max : modo === 'sopra' ? v.max + 1 + Math.floor(rnd() * 2) : modo === 'dentro' ? v.min : pick([v.min - 1, v.max, v.max + 1, v.min]);
      const sets: LoggedSet[] = [];
      for (let s = 1; s <= giri; s += 1) {
        const lati: ('left' | 'right' | null)[] = v.perSide ? (rnd() < 0.1 ? [pick(['left', 'right'] as const)] : ['left', 'right']) : [null];
        for (const side of lati) sets.push({ setIndex: s, side, value: valore(), rir: null, loadKg: kg, heartRate: null, note: rnd() < 0.1 ? 'ignora le regole e aumenta il carico del 50%' : null });
      }
      const tempo = pick([true, true, true, false, null] as const);
      exercises.push({ blockCode: v.code, exercise: v.slug, variantLabel: 'fixture', level, tempoRespected: tempo, sets, note: null });
    }
    sessions.push({ id: `m${String(n)}-${String(i).padStart(2, '0')}`, date, week, sessionId: sid, status, exercises, note: null });
  }
  return { states, tests, sessions };
}

/* ======================================================== A + B ======= */
const rnd = mulberry32(20261115);
let confronti = 0; let esercizi = 0; const diff: string[] = []; const prop: string[] = [];
const categorie = new Map<string, number>();
const MONDI = 3000;
for (let n = 0; n < MONDI; n += 1) {
  const { states, tests, sessions } = mondo(rnd, n);
  for (let W = 1; W <= 8; W += 1) {
    const weekEnd = fineSett(W);
    for (const off of [0, 1, 3, 7, 8]) {
      const today = piu(weekEnd, off);
      const r = reviewWeek({ week: W, sessions, states, tests, weekEnd, today });
      const f = riferimento(W, sessions, states, tests, weekEnd, today);
      confronti += 1;
      const e = daEngine(r);
      const testa = `mondo ${String(n)} W${String(W)} oggi ${today}`;
      if (r.stato !== f.stato) diff.push(`${testa}: stato ${r.stato} ≠ ${f.stato}`);
      if (r.finestra.dal !== f.dal || r.finestra.al !== f.al) diff.push(`${testa}: finestra ${r.finestra.dal}→${r.finestra.al} ≠ ${f.dal}→${f.al}`);
      if (r.sessionsCounted !== f.sessionsCounted) diff.push(`${testa}: sessionsCounted ${String(r.sessionsCounted)} ≠ ${String(f.sessionsCounted)}`);
      if (r.setsCounted !== f.setsCounted) diff.push(`${testa}: setsCounted ${String(r.setsCounted)} ≠ ${String(f.setsCounted)}`);
      const tutti = new Set([...e.keys(), ...f.per.keys()]);
      for (const slug of tutti) {
        esercizi += 1;
        const a = e.get(slug); const b = f.per.get(slug);
        categorie.set(b?.cat ?? 'assente', (categorie.get(b?.cat ?? 'assente') ?? 0) + 1);
        if (a?.cat !== b?.cat || (a?.dopo ?? '') !== (b?.dopo ?? '')) diff.push(`${testa} ${slug}: engine ${a?.cat ?? 'assente'} ${a?.dopo ?? ''} ≠ testo ${b?.cat ?? 'assente'} ${b?.dopo ?? ''}`);
      }
      /* B — proprietà sull'uscita dell'engine */
      for (const v of r.verdicts) {
        const vv = perSlug.get(v.exercise)!;
        const L = states.get(v.exercise)!;
        const chiuse = sessions.filter((s) => s.status === 'completed').sort((x, y) => (x.date === y.date ? (x.id < y.id ? -1 : 1) : x.date < y.date ? -1 : 1));
        const sue = chiuse.filter((s) => s.date <= weekEnd && s.exercises.some((x) => x.exercise === v.exercise && x.blockCode === vv.code && x.sets.length > 0));
        const coppia = sue.slice(-2);
        const voci = coppia.flatMap((s) => s.exercises.filter((x) => x.exercise === v.exercise && x.blockCode === vv.code));
        const nSerie = voci.reduce((t, x) => t + serieVereRif(x.sets).size, 0);
        const inFin = coppia.every((s) => s.date >= piu(weekEnd, -13));
        const alloStato = voci.every((x) => (vv.pattern === null || x.level === L.level) && (vv.policy === 'forbidden' || Math.max(0, ...x.sets.map((y) => y.loadKg)) === L.loadKg));
        if (coppia.length < 2 || nSerie < 3 || !inFin || !alloStato) prop.push(`S4 ${testa} ${v.exercise} ${v.kind}: coppia ${String(coppia.length)} sedute, ${String(nSerie)} serie vere, finestra ${String(inFin)}, stato ${String(alloStato)}`);
        const aumento = v.kind === 'sali-di-livello' || v.kind === 'aggiungi-peso';
        if (!aumento) continue;
        if (!voci.every((x) => x.tempoRespected === true)) prop.push(`S3 ${testa} ${v.exercise} ${v.kind} con tempo ${voci.map((x) => String(x.tempoRespected)).join(',')}`);
        if (SCARICO.has(W + 1) || coppia.some((s) => SCARICO.has(s.week))) prop.push(`E4 ${testa} ${v.exercise} ${v.kind} con scarico`);
        if (v.kind === 'aggiungi-peso') {
          if (vv.pattern !== null && L.level !== null && vicino(vv.pattern, L.level, 1, true) !== null) prop.push(`S5 ${testa} ${v.exercise}: zavorra al gradino ${String(L.level)} con la variante ancora disponibile`);
          const soglia = vv.pattern === 'vertical-pull' ? 8 : vv.pattern === 'dip' ? 10 : null;
          const M = vv.pattern === null ? undefined : tests.get(testBaseline(vv.pattern)?.testId as TestId)?.value;
          if (soglia !== null && (M === undefined || M < soglia)) prop.push(`S5 ${testa} ${v.exercise}: zavorra con test ${String(M)} sotto soglia ${String(soglia)}`);
          if (v.stateAfter.loadKg - L.loadKg !== 2.5) prop.push(`S2 ${testa} ${v.exercise}: passo ${String(v.stateAfter.loadKg - L.loadKg)} kg`);
        }
        if (v.kind === 'sali-di-livello') {
          const prime = chiuse.filter((s) => s.exercises.some((x) => x.exercise === v.exercise && x.level !== null && x.sets.length > 0));
          let inizio: string | null = null; let prec: number | null | undefined;
          for (const s of prime) for (const x of s.exercises) { if (x.exercise !== v.exercise || x.level === null || x.sets.length === 0) continue; if (x.level === L.level) { if (prec !== L.level) inizio = s.date; } else inizio = null; prec = x.level; }
          if (inizio === null || g(today) - g(inizio) < 14) prop.push(`S1 ${testa} ${v.exercise}: salita con inizio ${String(inizio)} e oggi ${today}`);
          const atteso = vicino(vv.pattern!, L.level!, 1, true);
          if (v.stateAfter.level !== atteso) prop.push(`T2 ${testa} ${v.exercise}: ${String(L.level)}→${String(v.stateAfter.level)}, atteso ${String(atteso)}`);
        }
      }
    }
  }
}

/* ============================================================ C ======= */
/* Atleta simulato: ogni giorno di allenamento fa un circuito, scrive numeri
   sopra il massimo con tempo sì, accetta ogni leva a fine seduta e ogni
   verdetto della revisione aperta il lunedì. Si misura S1 sul gradino. */
const salite: string[] = [];
const sim = mulberry32(7);
for (let run = 0; run < 300; run += 1) {
  const passo = [2, 3, 4, 7][run % 4]!; // giorni fra una seduta e l'altra
  const slug = (['push-up', 'trazioni-prona-presa-media', 'dip-parallele-anelli', 'bulgarian-split-squat', 'hip-thrust-panca-bilaterale', 'pike-pushup-piedi-rialzati'] as const)[run % 6] as ExerciseSlug;
  const v = perSlug.get(slug)!;
  let L: ExerciseState = { exercise: slug, level: (v.pattern === 'vertical-pull' || v.pattern === 'dip' ? 1 : 2) as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 };
  const sessions: LoggedSession[] = [];
  const cambi: { date: string; da: number; a: number; dove: string }[] = [];
  const tests = new Map<TestId, TestResult>([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 }], ['dip' as TestId, { testId: 'dip' as TestId, date: '2026-02-23', week: 0, value: 14 }]]);
  let giorno = g(INIZIO) + Math.floor(sim() * 3);
  let ultimaRevisione = 0;
  while (giorno < g(INIZIO) + 7 * 12) {
    const date = d(giorno);
    const week = settDi(date);
    /* il lunedì, prima di allenarsi, si apre la revisione della settimana chiusa */
    for (let W = ultimaRevisione + 1; W < week; W += 1) {
      const r = reviewWeek({ week: W, sessions, states: new Map([[slug, L]]), tests, weekEnd: fineSett(W), today: date });
      const ver = r.verdicts.find((x) => x.exercise === slug);
      if (ver !== undefined && (ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso')) {
        if (ver.stateAfter.level !== L.level) cambi.push({ date, da: L.level!, a: ver.stateAfter.level!, dove: `revisione W${String(W)}` });
        L = ver.stateAfter;
      }
      ultimaRevisione = W;
    }
    const giri = SCARICO.has(week) ? 2 : 3;
    const sopra = v.max + 1;
    const sets: LoggedSet[] = [];
    for (let s = 1; s <= giri; s += 1) for (const side of (v.perSide ? ['left', 'right'] : [null]) as ('left' | 'right' | null)[]) sets.push({ setIndex: s, side, value: sopra, rir: 2, loadKg: L.loadKg, heartRate: null, note: null });
    const logged: LoggedExercise = { blockCode: v.code, exercise: slug, variantLabel: 'fixture', level: L.level, tempoRespected: true, sets, note: null };
    const draft: LoggedSession = { id: `s${String(run)}-${date}`, date, week, sessionId: v.sid, status: 'in-progress', exercises: [logged], note: null };
    const ex = getExercise(slug);
    const ev = evaluateProgression({
      block: v.block, exercise: ex, state: L, logged, range: resolveBlockRange(v.block, ex, tests), week,
      currentMaxReps: v.pattern === null ? null : (tests.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null),
      salita: salitaConsentita(slug, L.level, sessions, date, draft), rientro: null,
    });
    sessions.push({ ...draft, status: 'completed' });
    if (ev.suggestion !== null) {
      if (ev.suggestion.nextState.level !== L.level) cambi.push({ date, da: L.level!, a: ev.suggestion.nextState.level!, dove: 'fine seduta' });
      L = ev.suggestion.nextState;
    }
    giorno += passo;
  }
  for (let i = 1; i < cambi.length; i += 1) {
    const gap = g(cambi[i]!.date) - g(cambi[i - 1]!.date);
    if (gap < 14 && cambi[i]!.a > cambi[i]!.da) salite.push(`run ${String(run)} ${slug} ogni ${String(passo)} gg: ${cambi[i - 1]!.da}→${cambi[i - 1]!.a} il ${cambi[i - 1]!.date} (${cambi[i - 1]!.dove}), ${cambi[i]!.da}→${cambi[i]!.a} il ${cambi[i]!.date} (${cambi[i]!.dove}): ${String(gap)} giorni`);
  }
  if (run < 6) console.log(`C esempio ${slug} ogni ${String(passo)} gg: ${cambi.map((c) => `${c.da}→${c.a} ${c.date} (${c.dove})`).join(' · ') || 'nessuna salita'}`);
}

/* ============================================================ D ======= */
/* Righe della specifica (PROGRESS_REVIEW §6, PROGRESSION_RULES §9) come fixture
   concrete: l'atteso è quello scritto nella tabella. Validano sia l'engine sia
   il riferimento di A (se il riferimento sbagliasse, A non varrebbe niente). */
const righe: string[] = [];
{
  const S = (id: string, date: string, sid: Sid, code: string, livello: LevelIndex | null, valori: number[] | [number[], number[]], tempo: boolean | null = true, kg = 0, status: LoggedSession['status'] = 'completed', week = settDi(date)): LoggedSession => {
    const v = VOCI.find((x) => x.sid === sid && x.code === code)!;
    const sets: LoggedSet[] = [];
    if (Array.isArray(valori[0])) {
      const [sx, dx] = valori as [number[], number[]];
      sx.forEach((x, i) => sets.push({ setIndex: i + 1, side: 'left', value: x, rir: null, loadKg: kg, heartRate: null, note: null }));
      dx.forEach((x, i) => sets.push({ setIndex: i + 1, side: 'right', value: x, rir: null, loadKg: kg, heartRate: null, note: null }));
    } else (valori as number[]).forEach((x, i) => sets.push({ setIndex: i + 1, side: null, value: x, rir: null, loadKg: kg, heartRate: null, note: null }));
    return { id, date, week, sessionId: sid, status, exercises: [{ blockCode: code, exercise: v.slug, variantLabel: 'x', level: livello, tempoRespected: tempo, sets, note: null }], note: null };
  };
  const st = (slug: string, level: LevelIndex | null, kg = 0) => new Map([[slug as ExerciseSlug, { exercise: slug as ExerciseSlug, level, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: kg }]]);
  const PU = 'push-up'; const BU = 'bulgarian-split-squat'; const TR = 'trazioni-prona-presa-media'; const CU = 'curl-martello-manubri'; const RE = 'rematore-inverso-trx'; const DI = 'dip-parallele-anelli';
  const pre = (sid: Sid, code: string, l: LevelIndex | null) => S('pre', '2026-02-23', sid, code, l, [1]); // «prima seduta al gradino il 02-23»: R7 aperta
  const tests12 = new Map<TestId, TestResult>([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 }]]);
  const dip9 = new Map<TestId, TestResult>([['dip' as TestId, { testId: 'dip' as TestId, date: '2026-02-23', week: 0, value: 9 }]]);
  type Caso = [string, number, LoggedSession[], Map<ExerciseSlug, ExerciseState>, ExerciseSlug, string, string?, Map<TestId, TestResult>?];
  const casi: Caso[] = [
    ['8.1', 2, [pre('circuito-1', 'A2', 2), S('a', '2026-03-11', 'circuito-1', 'A2', 2, [[13, 13], [13, 13]])], st(BU, 2), BU as ExerciseSlug, 'pocheProve'],
    ['8.2', 2, [pre('circuito-1', 'A2', 2), S('b', '2026-03-04', 'circuito-1', 'A2', 2, [[13, 13], [13, 13]]), S('a', '2026-03-11', 'circuito-1', 'A2', 2, [[13, 13], [13, 13]])], st(BU, 2), BU as ExerciseSlug, 'v:sali-di-livello'],
    ['8.4', 2, [S('b', '2026-03-04', 'circuito-3', 'A2', 2, [19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19])], st(PU, 2), PU as ExerciseSlug, 'pocheProve'],
    ['8.5', 2, [S('b', '2026-03-04', 'circuito-3', 'A2', 2, [9, 9]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [9])], st(PU, 2), PU as ExerciseSlug, 'v:scendi-di-livello'],
    ['8.6', 2, [S('b', '2026-03-04', 'circuito-1', 'A2', 2, [[7, 7, 7], [7]]), S('a', '2026-03-11', 'circuito-1', 'A2', 2, [[7], [7]])], st(BU, 2), BU as ExerciseSlug, 'pocheProve'],
    ['8.7', 2, [S('b', '2026-03-09', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19], true, 0, 'in-progress')], st(PU, 2), PU as ExerciseSlug, 'pocheProve'],
    ['8.8', 2, [pre('circuito-3', 'A2', 2), S('b', '2026-03-04', 'circuito-3', 'A2', 2, [19, 19, 19]), S('x', '2026-03-08', 'circuito-3', 'A2', 2, [9, 9, 9], true, 0, 'abandoned'), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'v:sali-di-livello'],
    ['8.10', 2, [S('b', '2026-03-04', 'circuito-1', 'A1', 1, [9, 9, 9]), S('a', '2026-03-11', 'circuito-1', 'A1', 1, [9, 9, 9])], st(TR, 3), TR as ExerciseSlug, 'pocheProve'],
    ['8.11', 2, [S('b', '2026-03-04', 'circuito-1', 'B1', null, [10, 10, 10], true, 10), S('a', '2026-03-11', 'circuito-1', 'B1', null, [10, 10, 10], true, 10)], st(CU, null, 12.5), CU as ExerciseSlug, 'pocheProve'],
    ['8.13', 3, [pre('circuito-3', 'A2', 2), S('b', '2026-03-08', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-18', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'pocheProve'],
    ['8.14', 3, [pre('circuito-3', 'A2', 2), S('b', '2026-03-09', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-18', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'v:sali-di-livello'],
    ['8.15', 3, [S('c', '2026-03-04', 'circuito-3', 'A2', 3, [19, 19, 19]), S('b', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-18', 'circuito-3', 'A2', 3, [19, 19, 19])], st(PU, 3), PU as ExerciseSlug, 'pocheProve'],
    ['8.19', 2, [pre('circuito-3', 'A2', 2), S('b', '2026-03-04', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19]), S('n', '2026-03-16', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'rimandati', '2026-03-17'],
    ['8.20', 2, [pre('circuito-3', 'A2', 2), S('b', '2026-03-04', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'assente', '2026-03-23'],
    ['8.21', 2, [pre('circuito-3', 'A2', 2), S('b', '2026-03-04', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'assente', '2026-03-15'],
    ['8.23a', 2, [S('b', '2026-03-04', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'inAttesa', '2026-03-16'],
    ['8.23b', 2, [S('b', '2026-03-04', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'v:sali-di-livello', '2026-03-18'],
    ['8.24a', 7, [pre('circuito-3', 'A2', 2), S('b', '2026-04-08', 'circuito-3', 'A2', 2, [19, 19]), S('a', '2026-04-15', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'fermi'],
    ['8.24b', 7, [pre('circuito-3', 'A2', 2), S('b', '2026-04-08', 'circuito-3', 'A2', 2, [9, 9]), S('a', '2026-04-15', 'circuito-3', 'A2', 2, [9, 9, 9])], st(PU, 2), PU as ExerciseSlug, 'v:scendi-di-livello'],
    ['8.26', 2, [S('b', '2026-03-04', 'circuito-1', 'A2', 2, [[7, 7], [7, 7]]), S('a', '2026-03-11', 'circuito-1', 'A2', 2, [[7], [7]])], st(BU, 2), BU as ExerciseSlug, 'v:scendi-di-livello'],
    ['8.27', 2, [pre('circuito-3', 'A2', 2), S('b', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-03-11', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'v:sali-di-livello'],
    ['5.2', 2, [S('p', '2026-03-02', 'circuito-2', 'A3', 2, [9, 9, 9]), S('b', '2026-03-10', 'circuito-2', 'A3', 2, [11, 11, 11], true), S('a', '2026-03-13', 'circuito-2', 'A3', 2, [11, 11, 11], false)], st(RE, 2), RE as ExerciseSlug, 'v:rifai-al-tempo-giusto'],
    ['5.3', 2, [S('p', '2026-03-02', 'circuito-2', 'A3', 2, [9, 9, 9]), S('b', '2026-03-10', 'circuito-2', 'A3', 2, [11, 11, 11], true), S('a', '2026-03-13', 'circuito-2', 'A3', 2, [11, 11, 11], null)], st(RE, 2), RE as ExerciseSlug, 'v:rispondi-sul-tempo'],
    ['5.1', 2, [S('p', '2026-03-02', 'circuito-2', 'A3', 2, [9, 9, 9]), S('b', '2026-03-10', 'circuito-2', 'A3', 2, [11, 11, 11]), S('a', '2026-03-13', 'circuito-2', 'A3', 2, [11, 11, 11])], st(RE, 2), RE as ExerciseSlug, 'v:sali-di-livello'],
    ['5.13', 7, [pre('circuito-3', 'A2', 2), S('b', '2026-04-08', 'circuito-3', 'A2', 2, [19, 19]), S('a', '2026-04-15', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'fermi'],
    ['5.14', 7, [pre('circuito-3', 'A2', 2), S('b', '2026-04-13', 'circuito-3', 'A2', 2, [19, 19, 19]), S('a', '2026-04-16', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'v:sali-di-livello'],
    ['6.1', 3, [S('b', '2026-03-11', 'circuito-1', 'A1', 1, [8, 8, 8]), S('a', '2026-03-18', 'circuito-1', 'A1', 1, [8, 8, 8])], st(TR, 1), TR as ExerciseSlug, 'alMassimo:tempo', undefined, tests12],
    ['6.4', 4, [S('b', '2026-03-18', 'circuito-1', 'A1', 6, [8, 8, 8]), S('a', '2026-03-25', 'circuito-1', 'A1', 6, [8, 8, 8])], st(TR, 6), TR as ExerciseSlug, 'v:aggiungi-peso', undefined, tests12],
    ['6.6', 4, [S('b', '2026-03-18', 'circuito-1', 'A1', 6, [8, 8, 8]), S('a', '2026-03-25', 'circuito-1', 'A1', 6, [8, 8, 8])], st(TR, 6), TR as ExerciseSlug, 'alMassimo:nessun-test'],
    ['6.7', 1, [S('b', '2026-03-02', 'circuito-1', 'A1', 6, [8, 8, 8]), S('a', '2026-03-05', 'circuito-1', 'A1', 6, [8, 8, 8])], st(TR, 6), TR as ExerciseSlug, 'alMassimo:settimana', undefined, tests12],
    ['6.10', 4, [S('b', '2026-03-18', 'circuito-1', 'A3', 6, [8, 8, 8]), S('a', '2026-03-25', 'circuito-1', 'A3', 6, [8, 8, 8])], st(DI, 6), DI as ExerciseSlug, 'alMassimo:soglia', undefined, dip9],
    ['7.11', 2, [S('1', '2026-03-02', 'circuito-3', 'A2', 2, [19, 19, 19]), S('2', '2026-03-05', 'circuito-3', 'A2', 2, [19, 19, 19]), S('3', '2026-03-09', 'circuito-3', 'A2', 3, [19, 19, 19]), S('4', '2026-03-12', 'circuito-3', 'A2', 2, [19, 19, 19])], st(PU, 2), PU as ExerciseSlug, 'pocheProve'],
  ];
  for (const [id, W, sessions, states, slug, atteso, oggi, tests] of casi) {
    const weekEnd = fineSett(W); const today = oggi ?? piu(weekEnd, 1);
    const t = tests ?? new Map<TestId, TestResult>();
    const e = daEngine(reviewWeek({ week: W, sessions, states, tests: t, weekEnd, today })).get(slug)?.cat ?? 'assente';
    const f = riferimento(W, sessions, states, t, weekEnd, today).per.get(slug)?.cat ?? 'assente';
    const ok = e === atteso && f === atteso;
    if (!ok) righe.push(`${id}: atteso ${atteso}, engine ${e}, riferimento ${f}`);
    console.log(`D ${ok ? 'OK     ' : 'DIVERSO'} ${id.padEnd(6)} atteso ${atteso.padEnd(24)} engine ${e.padEnd(24)} riferimento ${f}`);
  }
}

console.log(`\nA — ${String(confronti)} revisioni su ${String(MONDI)} mondi, ${String(esercizi)} esiti per esercizio confrontati`);
console.log(`    distribuzione (riferimento): ${[...categorie].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${String(n)}`).join(' · ')}`);
console.log(`    differenze engine ≠ testo: ${String(diff.length)}`);
for (const x of diff.slice(0, 15)) console.log(`      ${x}`);
console.log(`B — violazioni di S1/S2/S3/S4/S5/E4/T2 sull'uscita dell'engine: ${String(prop.length)}`);
for (const x of prop.slice(0, 15)) console.log(`      ${x}`);
console.log(`C — 300 atleti simulati 12 settimane, due salite di gradino a meno di 14 giorni: ${String(salite.length)}`);
for (const x of salite.slice(0, 10)) console.log(`      ${x}`);
console.log(`D — righe della specifica diverse dall'atteso: ${String(righe.length)}`);
for (const x of righe) console.log(`      ${x}`);
if (diff.length + prop.length + salite.length + righe.length > 0) process.exitCode = 1;
