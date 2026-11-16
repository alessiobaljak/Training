/*
 * 14 — R10, R11, R12, R13 (progressione 3.0, progressi 3.0), commit cf7588a.
 *
 * v1, 2026-11-16. Attesi dalle tabelle di `training/reports/2026-11-16-training.md`
 * (10.x, 11.x, 12.x, 13.x) e dal testo di R10-R13; il riferimento del
 * differenziale è scritto dal testo, NON da `review.ts` né da `progression.ts`.
 * Dal codice si prendono solo dati (scheda, scale, test di riferimento,
 * `LEVA_MANUBRIO`) e gli oggetti misurati (`reviewWeek`, `evaluateProgression`,
 * `aumentoRecente`, `syncStatesFromLog`, `statesToSave`).
 *
 * Parti:
 *   F  righe della specifica come fixture (atteso scritto nella tabella).
 *   A  differenziale engine ↔ riferimento su mondi casuali con registro, bonus,
 *      manubri e sedute rifatte dopo fine(W) (seme fisso, ripetibile).
 *   B  proprietà sull'uscita dell'engine: S1-S5, E4, R12, 10.P (ordine delle
 *      leve), R11 (con `dopo` il verdetto è quello senza `dopo`), S2 su 7 giorni.
 *   C  atleti simulati 12 settimane, fine seduta + revisione + registro come
 *      nel prodotto, ogni leva e verdetto accettati, pesi cambiati a mano:
 *      13.P (nessun aumento a meno di 7 giorni da un altro), S1, S2.
 *
 * Nella parte F, oltre alle righe della specifica (13.1 non si applica: R10 c'è),
 * sei righe sono rivelatori di difetti aperti il 2026-11-16 e restano DIVERSO
 * finché il difetto è aperto: Q1 = L18, Q2 = L19, Q3 = L20, Q4 = L21, Q5 = M18,
 * A18 = A18 (controllo statico del player, non eseguito nell'interfaccia).
 *
 * Positivo obbligatorio: lo stesso file gira sul codice di produzione `a747e09`
 * (copiato in una cartella temporanea con `git archive`, `aumentoRecente` e
 * `LEVA_MANUBRIO` assenti → namespace con ripiego). Lì F, A, B e C devono fallire.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/14-r10-r13.mts
 * (MONDI e ATLETI come variabili d'ambiente; DEBUG_RUN=n stampa un atleta di C).
 * Esce 1 se una parte trova un difetto.
 */
import { CIRCUIT_SESSIONS, findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import * as Metodo from '../../src/data/method.ts';
import { getProgressionStep } from '../../src/data/progressions.ts';
import { testBaseline } from '../../src/data/tests.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import * as P from '../../src/engine/progression.ts';
import { statesToSave, syncStatesFromLog } from '../../src/engine/draft.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import type {
  DecisioneRegistrata, ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession, LoggedSet, MotorPattern, ProgramBlock, TestId, TestResult,
} from '../../src/types/index.ts';

/* Namespace: lo stesso file gira anche sul codice di produzione (positivo
   obbligatorio), dove `aumentoRecente` e `LEVA_MANUBRIO` non esistono. */
const evaluateProgression = P.evaluateProgression;
const salitaConsentita = P.salitaConsentita;
type AR = (s: ExerciseSlug, d: readonly DecisioneRegistrata[], x: readonly LoggedSession[], o: string, c?: LoggedSession | null) => unknown;
const aumentoRecente = ((P as Record<string, unknown>)['aumentoRecente'] as AR | undefined) ?? ((): null => null);
/* D-19 (Alessio, 2026-11-16, dal brief): l'elenco del riferimento è scritto qui, non letto dal codice. */
const LEVA_D19 = new Set(['curl-martello-manubri', 'curl-manubri-supino', 'curl-panca-inclinata', 'military-press-manubri', 'rematore-manubrio-un-braccio']);
{
  const nelCodice = (Metodo as Record<string, unknown>)['LEVA_MANUBRIO'] as ReadonlySet<string> | undefined;
  const uguale = nelCodice !== undefined && nelCodice.size === LEVA_D19.size && [...LEVA_D19].every((x) => nelCodice.has(x));
  console.log(`LEVA_MANUBRIO nel codice ${nelCodice === undefined ? 'assente' : `= [${[...nelCodice].join(', ')}]`} · uguale a D-19: ${String(uguale)}`);
}

/* ---------------------------------------------------------------- date -- */
const MS = 86_400_000;
const g = (x: string): number => Date.UTC(+x.slice(0, 4), +x.slice(5, 7) - 1, +x.slice(8, 10)) / MS;
const d = (n: number): string => new Date(n * MS).toISOString().slice(0, 10);
const piu = (x: string, n: number): string => d(g(x) + n);
const INIZIO = '2026-03-02';
const fineSett = (w: number): string => piu(INIZIO, 7 * w - 1);
const settDi = (x: string): number => Math.floor((g(x) - g(INIZIO)) / 7) + 1;
const SCARICO = new Set([6, 12, 18]);
const SBLOCCO = 3;
const MAX_ECC = 5; const MAX_PAUSA = 2;

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
interface Voce { sid: Sid; code: string; slug: ExerciseSlug; block: ProgramBlock; min: number; max: number; perSide: boolean; escluso: boolean; pattern: MotorPattern | null; policy: string; misura: string; tut: string }
function voce(sid: Sid, code: string): Voce {
  const block = findCircuitSession(sid)!.blocks.find((b) => b.code === code)!;
  const ex = getExercise(block.exercise);
  const p = block.prescription;
  if (p.kind !== 'reps' && p.kind !== 'seconds') throw new Error(`fixture: ${sid}/${code} senza range fisso`);
  if ((block.alternatives ?? []).length > 0) throw new Error(`fixture: ${sid}/${code} ha alternative`);
  return { sid, code, slug: ex.slug, block, min: p.min, max: p.max, perSide: block.perSide === true, escluso: block.excludeFromReview === true, pattern: ex.pattern, policy: ex.loadPolicy, misura: ex.measurement, tut: block.tut };
}
/* Tutti i blocchi giudicati del circuito, più una finitura e una decompressione. */
const VOCI: Voce[] = [];
for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) if (b.excludeFromReview !== true) VOCI.push(voce(s.id as Sid, b.code));
VOCI.push(voce('circuito-1', 'F1'), voce('circuito-1', 'Z1'));
const perSlug = new Map(VOCI.filter((v) => !v.escluso).map((v) => [v.slug, v]));
if (perSlug.size !== VOCI.filter((v) => !v.escluso).length) { console.log('8.25 ESEGUIBILE: un esercizio giudicato in due blocchi, il riferimento va aggiornato'); process.exitCode = 1; }

/* ---------------------------------------------- riferimento dal testo -- */
function serieVereRif(sets: readonly LoggedSet[]): Set<number> {
  const m = new Map<number, Set<string>>();
  for (const s of sets) { const x = m.get(s.setIndex) ?? new Set(); x.add(s.side ?? '-'); m.set(s.setIndex, x); }
  return new Set([...m].filter(([, l]) => l.has('-') || (l.has('left') && l.has('right'))).map(([i]) => i));
}
function vicino(pattern: MotorPattern, level: number, dir: 1 | -1): number | null {
  for (let c = level + dir; c >= 1 && c <= 6; c += dir) {
    if (getProgressionStep(pattern, c as LevelIndex).eccentricOnly) continue; // range fissi: si saltano le sole negative
    return c;
  }
  return null;
}
/* TUT a quattro fasi «e-p-c-t»; X = fase esplosiva, non si allunga. PROGRESSION_RULES §2. */
function fasi(tut: string): { e: number | 'X'; p: number | 'X' } | null {
  const parti = tut.split('-');
  if (parti.length !== 4) return null;
  const f = (x: string): number | 'X' => (x === 'X' ? 'X' : Number(x));
  return { e: f(parti[0]!), p: f(parti[1]!) };
}
const tempoLibero = (v: Voce, L: ExerciseState): boolean => { const t = fasi(v.tut); return t !== null && t.e !== 'X' && Math.min(MAX_ECC, t.e + L.eccentricBonusSeconds) < MAX_ECC; };
const pausaLibera = (v: Voce, L: ExerciseState): boolean => { const t = fasi(v.tut); return t !== null && t.p !== 'X' && Math.min(MAX_PAUSA, t.p + L.bottomPauseBonusSeconds) < MAX_PAUSA; };
const varianteLibera = (v: Voce, L: ExerciseState): boolean => v.pattern !== null && L.level !== null && vicino(v.pattern, L.level, 1) !== null;
const leva5Manubrio = (v: Voce): boolean => v.policy === 'inherent' && v.misura === 'reps' && LEVA_D19.has(v.slug);

const ordina = (a: LoggedSession, b: LoggedSession): number => (a.date === b.date ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.date < b.date ? -1 : 1);
const kgMax = (xs: readonly LoggedExercise[]): number => Math.max(0, ...xs.flatMap((x) => x.sets.map((s) => s.loadKg)));

/* R13: gli aumenti di e. Registro: accettate che alzano gradino, eccentrica, pausa o carico.
   Diario: seduta chiusa con carico massimo o gradino più alti della chiusa precedente, salvo
   quando è l'esecuzione di una scelta accettata fra le due (lettura dello scostamento dichiarato:
   una scelta che ha alzato QUELLA grandezza a QUEL valore). */
interface AumentoRif { date: string; fonte: 'registro' | 'diario'; cosa: string }
function aumentiRif(slug: ExerciseSlug, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[], inCorso: LoggedSession | null = null): AumentoRif[] {
  const out: AumentoRif[] = [];
  const acc = dec.filter((r) => r.exercise === slug && r.decision === 'accepted');
  for (const r of acc) {
    const b = r.stateBefore; const a = r.stateAfter; const c: string[] = [];
    if (b.level !== null && a.level !== null && a.level > b.level) c.push('livello');
    if (a.eccentricBonusSeconds > b.eccentricBonusSeconds) c.push('tempo');
    if (a.bottomPauseBonusSeconds > b.bottomPauseBonusSeconds) c.push('pausa');
    if (a.loadKg > b.loadKg) c.push('carico');
    if (c.length > 0) out.push({ date: r.date, fonte: 'registro', cosa: c.join('+') });
  }
  const pol = getExercise(slug).loadPolicy;
  const diario = [...sessions.filter((s) => s.status === 'completed' && s.id !== inCorso?.id), ...(inCorso === null ? [] : [inCorso])]
    .filter((s) => s.exercises.some((x) => x.exercise === slug && x.sets.length > 0)).sort(ordina);
  for (let i = 1; i < diario.length; i += 1) {
    const p = diario[i - 1]!; const q = diario[i]!;
    const vp = p.exercises.filter((x) => x.exercise === slug && x.sets.length > 0);
    const vq = q.exercises.filter((x) => x.exercise === slug && x.sets.length > 0);
    const fra = acc.filter((r) => r.date >= p.date && r.date <= q.date);
    if (pol !== 'forbidden' && kgMax(vq) > kgMax(vp) && !fra.some((r) => r.stateAfter.loadKg > r.stateBefore.loadKg && r.stateAfter.loadKg === kgMax(vq))) out.push({ date: q.date, fonte: 'diario', cosa: `kg ${String(kgMax(vp))}→${String(kgMax(vq))}` });
    const lp = vp.find((x) => x.level !== null)?.level ?? null; const lq = vq.find((x) => x.level !== null)?.level ?? null;
    if (lp !== null && lq !== null && lq > lp && !fra.some((r) => r.stateBefore.level !== null && r.stateAfter.level !== null && r.stateAfter.level > r.stateBefore.level && r.stateAfter.level === lq)) out.push({ date: q.date, fonte: 'diario', cosa: `livello ${String(lp)}→${String(lq)}` });
  }
  return out;
}
const recenteRif = (au: readonly AumentoRif[], oggi: string): AumentoRif | undefined => au.filter((x) => g(oggi) - g(x.date) >= 0 && g(oggi) - g(x.date) < 7).sort((a, b) => (a.date < b.date ? -1 : 1)).at(-1);

type Esito = { cat: string; dopo?: string };
const sintesi = (s: ExerciseState): string => `liv ${String(s.level)} kg ${String(s.loadKg)} e${String(s.eccentricBonusSeconds)} p${String(s.bottomPauseBonusSeconds)}`;
interface Rif { stato: string; sessionsCounted: number; setsCounted: number; per: Map<ExerciseSlug, Esito> }

function riferimento(W: number, sessions: readonly LoggedSession[], states: ReadonlyMap<ExerciseSlug, ExerciseState>, tests: ReadonlyMap<TestId, TestResult>, weekEnd: string, today: string, dec: readonly DecisioneRegistrata[]): Rif {
  const dal = piu(weekEnd, -13);
  const stato = today <= weekEnd ? 'in-corso' : today <= piu(weekEnd, 7) ? 'aperta' : 'scaduta';
  const chiuse = sessions.filter((s) => s.status === 'completed').sort(ordina);
  const sessionsCounted = chiuse.filter((s) => s.week === W).length;
  const per = new Map<ExerciseSlug, Esito>();
  if (stato !== 'aperta') return { stato, sessionsCounted, setsCounted: 0, per };
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
    const allo = (s: LoggedSession): boolean => strutturali(s, slug).every((x) => (v.pattern === null || x.level === L.level) && (v.policy === 'forbidden' || kgMax([x]) === L.loadKg));
    /* R11a */
    const dopo = sue.filter((s) => s.date > weekEnd && s.date <= today);
    if (dopo.some((s) => !allo(s))) { per.set(slug, { cat: 'rimandati:stato' }); continue; }
    /* R8 + R12 */
    const dentro = (s: LoggedSession): boolean => s.date >= dal && s.date <= weekEnd;
    const ultime = sue.filter((s) => s.date <= weekEnd).slice(-2);
    const a = ultime.at(-1); const b = ultime.length === 2 ? ultime[0] : undefined;
    const utili: LoggedSession[] = [];
    if (a !== undefined && allo(a) && dentro(a)) {
      if (b !== undefined && allo(b) && dentro(b) && b.date < a.date) utili.push(b);
      utili.push(a);
    }
    const nSerie = utili.flatMap((s) => strutturali(s, slug)).reduce((t, x) => t + serieVereRif(x.sets).size, 0);
    setsCounted += nSerie;
    if (utili.length < 2 || nSerie < 3) { per.set(slug, { cat: 'pocheProve' }); continue; }
    /* R10b */
    const bd = utili[0]!.date;
    if (dec.some((r) => r.exercise === slug && r.decision === 'accepted' && r.date >= bd && (r.stateAfter.eccentricBonusSeconds > r.stateBefore.eccentricBonusSeconds || r.stateAfter.bottomPauseBonusSeconds > r.stateBefore.bottomPauseBonusSeconds))) { per.set(slug, { cat: 'rimandati:leva' }); continue; }
    const recente = recenteRif(aumentiRif(slug, dec, sessions), today);
    const lv = L.level;
    const giu = v.pattern === null || lv === null ? null : vicino(v.pattern, lv, -1);
    const su = v.pattern === null || lv === null ? null : vicino(v.pattern, lv, 1);
    const esito = (sedute: readonly LoggedSession[]): Esito => {
      const voci = sedute.flatMap((s) => strutturali(s, slug));
      const valori = voci.flatMap((x) => { const vv = serieVereRif(x.sets); return x.sets.filter((y) => vv.has(y.setIndex)).map((y) => y.value); });
      if (valori.every((x) => x < v.min)) return giu === null ? { cat: 'v:range-da-rifare', dopo: sintesi(L) } : { cat: 'v:scendi-di-livello', dopo: sintesi({ ...L, level: giu as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }) };
      if (!valori.every((x) => x >= v.max)) return { cat: 'inRange' };
      const scaricoSed = sedute.filter((s) => SCARICO.has(s.week));
      if (SCARICO.has(W + 1) || scaricoSed.length > 0) return { cat: SCARICO.has(W + 1) || scaricoSed.length === sedute.length ? 'fermi:scarico' : 'fermi:scarico-coppia' };
      const tempi = voci.map((x) => x.tempoRespected);
      if (tempi.some((t) => t === false)) return { cat: 'v:rifai-al-tempo-giusto', dopo: sintesi(L) };
      if (tempi.some((t) => t !== true)) return { cat: 'v:rispondi-sul-tempo', dopo: sintesi(L) };
      /* R10a 1: scavalco, R7, poi R13 */
      if (valori.every((x) => x > v.max) && su !== null) {
        let inizio: string | null = null; let prec: number | null | undefined;
        for (const s of chiuse) for (const x of s.exercises) {
          if (x.exercise !== slug || x.level === null || x.sets.length === 0) continue;
          if (x.level === lv) { if (prec !== lv) inizio = s.date; } else inizio = null;
          prec = x.level;
        }
        if (inizio === null || g(today) - g(inizio) < 14) return { cat: 'inAttesa' };
        if (recente !== undefined) return { cat: 'fermi:sette-giorni' };
        return { cat: 'v:sali-di-livello', dopo: sintesi({ ...L, level: su as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }) };
      }
      /* R10a 2-5 */
      if (tempoLibero(v, L)) return { cat: 'alMassimo:tempo' };
      if (pausaLibera(v, L)) return { cat: 'alMassimo:pausa' };
      if (varianteLibera(v, L)) return { cat: 'alMassimo:variante' };
      if (v.policy === 'forbidden') return { cat: 'alMassimo:leve-finite' };
      /* R10a 6: manubri, R10c-1 */
      if (v.policy === 'inherent') {
        if (!leva5Manubrio(v)) return { cat: 'alMassimo:leve-finite' };
        if (W + 1 < SBLOCCO) return { cat: 'alMassimo:settimana' };
        if (recente !== undefined) return { cat: 'fermi:sette-giorni' };
        return { cat: 'v:aggiungi-peso', dopo: sintesi({ ...L, loadKg: L.loadKg + 2.5, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }) };
      }
      /* R10a 7: zavorra Z3, Z4, R13 */
      if (W + 1 < SBLOCCO) return { cat: 'alMassimo:settimana' };
      const soglia = v.pattern === 'vertical-pull' ? 8 : v.pattern === 'dip' ? 10 : null;
      if (soglia !== null) {
        const M = tests.get(testBaseline(v.pattern!)!.testId)?.value;
        if (M === undefined) return { cat: 'alMassimo:nessun-test' };
        if (M < soglia) return { cat: 'alMassimo:soglia' };
      }
      if (recente !== undefined) return { cat: 'fermi:sette-giorni' };
      return { cat: 'v:aggiungi-peso', dopo: sintesi({ ...L, loadKg: L.loadKg + 2.5 }) };
    };
    const E = esito(utili);
    if (dopo.length > 0) {
      const Ep = esito([...utili, ...dopo]);
      if (Ep.cat !== E.cat) { per.set(slug, { cat: 'rimandati:smentito' }); continue; }
    }
    per.set(slug, E);
  }
  return { stato, sessionsCounted, setsCounted, per };
}

function daEngine(r: ReturnType<typeof reviewWeek>): Map<ExerciseSlug, Esito> {
  const m = new Map<ExerciseSlug, Esito>();
  const metti = (slug: ExerciseSlug, e: Esito): void => { if (m.has(slug)) m.set(slug, { cat: `DOPPIO(${m.get(slug)!.cat}+${e.cat})` }); else m.set(slug, e); };
  for (const v of r.verdicts) metti(v.exercise, { cat: `v:${v.kind}`, dopo: sintesi(v.stateAfter) });
  for (const x of r.pocheProve) metti(x.exercise, { cat: 'pocheProve' });
  for (const x of r.rimandati) metti(x.exercise, { cat: `rimandati:${x.motivo}` });
  for (const x of r.fermi) metti(x.exercise, { cat: `fermi:${x.motivo}` });
  for (const x of r.inAttesa) metti(x.exercise, { cat: 'inAttesa' });
  for (const x of r.alMassimo) metti(x.exercise, { cat: `alMassimo:${x.motivo}` });
  for (const n of r.inRange) { const v = VOCI.find((y) => getExercise(y.slug).name === n); if (v !== undefined) metti(v.slug, { cat: 'inRange' }); }
  return m;
}

/* ================================================================ F ==== */
let difettiF = 0;
const rigaF = (ok: boolean, id: string, testo: string): void => { if (!ok) difettiF += 1; console.log(`F ${ok ? 'OK     ' : 'DIVERSO'} ${id.padEnd(6)} ${testo}`); };
const VUOTO = new Map<TestId, TestResult>();
const T12 = new Map<TestId, TestResult>([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 }]]);
const CU = 'curl-martello-manubri' as ExerciseSlug; const TR = 'trazioni-prona-presa-media' as ExerciseSlug; const PU = 'push-up' as ExerciseSlug; const PO = 'pull-over-trx' as ExerciseSlug;
const vDi = (slug: ExerciseSlug): Voce => perSlug.get(slug)!;
function S(id: string, date: string, slug: ExerciseSlug, livello: LevelIndex | null, valori: number[], o: { tempo?: boolean | null; kg?: number; status?: LoggedSession['status']; week?: number } = {}): LoggedSession {
  const v = vDi(slug);
  const sets: LoggedSet[] = [];
  valori.forEach((x, i) => { for (const side of (v.perSide ? ['left', 'right'] : [null]) as ('left' | 'right' | null)[]) sets.push({ setIndex: i + 1, side, value: x, rir: 2, loadKg: o.kg ?? 0, heartRate: null, note: null }); });
  return { id, date, week: o.week ?? settDi(date), sessionId: v.sid, status: o.status ?? 'completed', exercises: [{ blockCode: v.code, exercise: slug, variantLabel: 'x', level: livello, tempoRespected: o.tempo === undefined ? true : o.tempo, sets, note: null }], note: null };
}
const st = (slug: ExerciseSlug, level: LevelIndex | null, kg = 0, e = 0, p = 0): ExerciseState => ({ exercise: slug, level, eccentricBonusSeconds: e, bottomPauseBonusSeconds: p, loadKg: kg });
const R = (date: string, before: ExerciseState, after: ExerciseState, decision: 'accepted' | 'postponed' = 'accepted', sessionLogId = `rec-${date}`): DecisioneRegistrata => ({ date, exercise: before.exercise, decision, stateBefore: before, stateAfter: after, sessionLogId });

function rev(W: number, sessions: LoggedSession[], L: ExerciseState, dec: DecisioneRegistrata[] = [], today?: string, tests: Map<TestId, TestResult> = VUOTO) {
  const weekEnd = fineSett(W); const t = today ?? piu(weekEnd, 1);
  const r = reviewWeek({ week: W, sessions, states: new Map([[L.exercise, L]]), tests, weekEnd, today: t, decisioni: dec });
  const e = daEngine(r).get(L.exercise) ?? { cat: 'assente' };
  const f = riferimento(W, sessions, new Map([[L.exercise, L]]), tests, weekEnd, t, dec).per.get(L.exercise) ?? { cat: 'assente' };
  const testo = [...r.verdicts.filter((x) => x.exercise === L.exercise).map((x) => `«${x.title}» ${x.change} | ${x.evidence}`), ...r.alMassimo.map((x) => `«${x.testo}»`), ...r.rimandati.map((x) => `«${x.testo}»`), ...r.fermi.map((x) => `«${x.testo}»`), ...r.pocheProve.map((x) => `pocheProve sedute ${String(x.sedute)} stessoGiorno ${String(x.stessoGiorno)}`)].join(' ');
  return { e, f, r, testo };
}
function caso(id: string, atteso: string, x: ReturnType<typeof rev>, extra: (t: string) => boolean = () => true): void {
  const ok = x.e.cat === atteso && x.f.cat === atteso && extra(x.testo);
  rigaF(ok, id, `atteso ${atteso} · engine ${x.e.cat}${x.e.dopo === undefined ? '' : ` (${x.e.dopo})`} · riferimento ${x.f.cat} · ${x.testo.slice(0, 260)}`);
}
/* fine seduta come il riepilogo: stato di prima, registro senza le scelte della seduta, diario con la bozza */
function fs(slug: ExerciseSlug, L: ExerciseState, valori: number[], date: string, storia: LoggedSession[], dec: DecisioneRegistrata[], o: { kg?: number; tempo?: boolean | null; tests?: Map<TestId, TestResult>; id?: string; livello?: LevelIndex | null } = {}) {
  const v = vDi(slug); const ex = getExercise(slug); const tests = o.tests ?? VUOTO;
  const draft: LoggedSession = { ...S(o.id ?? `bozza-${date}`, date, slug, o.livello === undefined ? L.level : o.livello, valori, { kg: o.kg ?? L.loadKg, tempo: o.tempo }), status: 'in-progress' };
  const logged = draft.exercises[0]!;
  const ar = aumentoRecente(slug, dec.filter((r) => r.sessionLogId !== draft.id), storia, date, draft);
  const ev = evaluateProgression({ block: v.block, exercise: ex, state: L, logged, range: resolveBlockRange(v.block, ex, tests), week: settDi(date), currentMaxReps: v.pattern === null ? null : (tests.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(slug, L.level, storia, date, draft), rientro: null, aumentoRecente: ar });
  const atteso = recenteRif(aumentiRif(slug, dec.filter((r) => r.sessionLogId !== draft.id), storia, draft), date);
  return { ev, draft, ar, rif: atteso };
}
const leva = (ev: ReturnType<typeof evaluateProgression>): string => ev.suggestion === null ? 'nessuna' : `${ev.suggestion.lever} → ${sintesi(ev.suggestion.nextState)}`;

console.log('=== F · righe della specifica (W=4: sedute 03-19 e 03-26, revisione 03-30, salvo dove detto) ===');
{
  const ESA_CU = { e: 2, p: 2 }; // curl 3-0-1-1: eccentrica 5", pausa 2"
  const preCU = S('pre', '2026-02-23', CU, null, [1], { kg: 12 });
  const cu = (valori: number[] = [10, 10, 10]) => [preCU, S('b', '2026-03-19', CU, null, valori, { kg: 12 }), S('a', '2026-03-26', CU, null, valori, { kg: 12 })];
  caso('10.1', 'rimandati:leva', rev(4, cu(), st(CU, null, 12, 1, 0), [R('2026-03-26', st(CU, null, 12), st(CU, null, 12, 1, 0))]));
  caso('10.2', 'alMassimo:tempo', rev(4, cu(), st(CU, null, 12)), (t) => /da 3" a 4"/.test(t));
  caso('10.3', 'alMassimo:pausa', rev(4, cu(), st(CU, null, 12, 2, 0)), (t) => /da 0" a 1"/.test(t));
  caso('10.4', 'v:aggiungi-peso', rev(4, cu(), st(CU, null, 12, ESA_CU.e, ESA_CU.p)), (t) => /al massimo 14,5 kg/.test(t));
  caso('10.5', 'rimandati:leva', rev(4, cu(), st(CU, null, 12, 2, 2), [R('2026-03-19', st(CU, null, 12, 2, 1), st(CU, null, 12, 2, 2))]));
  caso('10.6', 'v:aggiungi-peso', rev(4, cu(), st(CU, null, 12, 2, 2), [R('2026-03-12', st(CU, null, 12, 2, 1), st(CU, null, 12, 2, 2))]));
  caso('10.7', 'alMassimo:pausa', rev(4, cu(), st(CU, null, 12, 2, 1), [R('2026-03-19', st(CU, null, 12, 2, 1), st(CU, null, 12, 2, 1), 'postponed')]), (t) => /da 1" a 2"/.test(t));
  const preTR = (kg = 0) => S('pre', '2026-02-23', TR, 6, [1], { kg });
  const tr = (valori: number[], kg = 0) => [preTR(kg), S('b', '2026-03-19', TR, 6, valori, { kg }), S('a', '2026-03-26', TR, 6, valori, { kg })];
  caso('10.8', 'alMassimo:tempo', rev(4, tr([8, 8, 8]), st(TR, 6), [], undefined, T12));
  caso('10.9', 'v:aggiungi-peso', rev(4, tr([8, 8, 8]), st(TR, 6, 0, 2, 2), [], undefined, T12));
  caso('10.10', 'rimandati:leva', rev(4, tr([8, 8, 8], 5), st(TR, 6, 5, 2, 2), [R('2026-03-26', st(TR, 6, 5, 1, 2), st(TR, 6, 5, 2, 2))], undefined, T12));
  caso('10.11', 'alMassimo:tempo', rev(4, tr([9, 9, 9]), st(TR, 6), [], undefined, T12));
  const prePU = S('pre', '2026-02-23', PU, 2, [1]);
  caso('10.12', 'alMassimo:variante', rev(4, [prePU, S('b', '2026-03-19', PU, 2, [18, 18, 18]), S('a', '2026-03-26', PU, 2, [18, 18, 18])], st(PU, 2, 0, 3, 2)), (t) => /livello 3/.test(t) && !/si può proporre dal/.test(t));
  caso('10.13', 'alMassimo:variante', rev(4, [S('b', '2026-03-19', PU, 2, [18, 18, 18]), S('a', '2026-03-26', PU, 2, [18, 18, 18])], st(PU, 2, 0, 3, 2)), (t) => /dal giovedì 2 aprile/.test(t));
  const po = [S('b', '2026-03-19', PO, null, [15, 15, 15]), S('a', '2026-03-26', PO, null, [15, 15, 15])];
  caso('10.14a', 'alMassimo:tempo', rev(4, po, st(PO, null)));
  caso('10.14b', 'alMassimo:leve-finite', rev(4, po, st(PO, null, 0, 2, 2)));
  { const x = fs(CU, st(CU, null, 12), [10, 10, 10], '2026-03-26', [preCU, S('b', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 })], []);
    rigaF(x.ev.suggestion?.lever === 'tempo', '10.15', `fine seduta 03-26 curl bonus 0/0 → ${leva(x.ev)}`); }
  /* Prove già scritte che cambiano atteso (§ «Prove già scritte»): 6.4 con bonus 0 e con esauriti; 6.11 curl */
  caso('6.4b0', 'alMassimo:tempo', rev(4, [S('b', '2026-03-18', TR, 6, [8, 8, 8]), S('a', '2026-03-25', TR, 6, [8, 8, 8])], st(TR, 6), [], undefined, T12));
  caso('6.4es', 'v:aggiungi-peso', rev(4, [S('b', '2026-03-18', TR, 6, [8, 8, 8]), S('a', '2026-03-25', TR, 6, [8, 8, 8])], st(TR, 6, 0, 2, 2), [], undefined, T12));
  caso('6.6es', 'alMassimo:nessun-test', rev(4, [S('b', '2026-03-18', TR, 6, [8, 8, 8]), S('a', '2026-03-25', TR, 6, [8, 8, 8])], st(TR, 6, 0, 2, 2)));
  caso('6.7es', 'alMassimo:settimana', rev(1, [S('b', '2026-03-02', TR, 6, [8, 8, 8]), S('a', '2026-03-05', TR, 6, [8, 8, 8])], st(TR, 6, 0, 2, 2), [], undefined, T12));
}

console.log('--- R11 (push-up al 3, sedute il lunedì, revisione aperta il lunedì dopo la seduta) ---');
{
  const p3 = (id: string, date: string, v: number[], o: { tempo?: boolean | null; livello?: LevelIndex } = {}) => S(id, date, PU, o.livello ?? 3, v, { tempo: o.tempo });
  const L3 = st(PU, 3);
  caso('11.1', 'v:scendi-di-livello', rev(2, [p3('1', '2026-03-02', [9, 9, 9]), p3('2', '2026-03-09', [9, 9, 9]), p3('3', '2026-03-16', [9, 9, 9])], L3, [], '2026-03-16'), (t) => /Rifatto lunedì 16 marzo: 9-9-9\./.test(t));
  caso('11.2', 'v:scendi-di-livello', rev(2, [p3('1', '2026-03-02', [9, 9, 9]), p3('2', '2026-03-09', [9, 9, 9])], L3, [], '2026-03-16'));
  caso('11.3a', 'rimandati:smentito', rev(2, [p3('1', '2026-03-02', [9, 9, 9]), p3('2', '2026-03-09', [9, 9, 9]), p3('3', '2026-03-16', [13, 12, 12])], L3, [], '2026-03-16'));
  caso('11.3b', 'inRange', rev(3, [p3('1', '2026-03-02', [9, 9, 9]), p3('2', '2026-03-09', [9, 9, 9]), p3('3', '2026-03-16', [13, 12, 12]), p3('4', '2026-03-23', [9, 9, 9])], L3, [], '2026-03-23'));
  caso('11.4', 'pocheProve', rev(3, [p3('1', '2026-03-02', [9, 9, 9]), p3('2', '2026-03-09', [9, 9, 9]), p3('3', '2026-03-16', [9, 9, 9]), p3('4', '2026-03-23', [12, 12, 12], { livello: 2 })], st(PU, 2), [R('2026-03-16', L3, st(PU, 2))], '2026-03-23'));
  const p2 = (id: string, date: string, v: number[], o: { tempo?: boolean | null } = {}) => S(id, date, PU, 2, v, o);
  const base5 = (ult: LoggedSession) => [p2('1', '2026-03-02', [19, 19, 19]), p2('2', '2026-03-09', [19, 19, 19]), ult];
  caso('11.5', 'v:sali-di-livello', rev(2, base5(p2('3', '2026-03-16', [19, 19, 19])), st(PU, 2), [], '2026-03-16'), (t) => /Rifatto/.test(t));
  caso('11.6', 'rimandati:smentito', rev(2, base5(p2('3', '2026-03-16', [17, 16, 16])), st(PU, 2), [], '2026-03-16'));
  caso('11.7', 'rimandati:smentito', rev(2, base5(p2('3', '2026-03-16', [19, 19, 19], { tempo: null })), st(PU, 2), [], '2026-03-16'), (t) => /tempo non confermato/.test(t));
  caso('11.8', 'rimandati:stato', rev(2, base5(p2('3', '2026-03-16', [19, 19, 19])), st(PU, 3), [R('2026-03-16', st(PU, 2), st(PU, 3))], '2026-03-16'));
  caso('11.9', 'v:sali-di-livello', rev(2, base5(p2('3', '2026-03-16', [19, 19, 19])), st(PU, 2), [R('2026-03-16', st(PU, 2), st(PU, 2), 'postponed')], '2026-03-16'));
  caso('11.10', 'rimandati:leva', rev(2, [p2('1', '2026-03-02', [18, 18, 18]), p2('2', '2026-03-09', [18, 18, 18]), p2('3', '2026-03-16', [18, 18, 18])], st(PU, 2, 0, 1, 0), [R('2026-03-16', st(PU, 2), st(PU, 2, 0, 1, 0))], '2026-03-16'));
  caso('11.11', 'v:scendi-di-livello', rev(2, [p3('1', '2026-03-02', [9, 9, 9]), p3('2', '2026-03-09', [9, 9, 9]), p3('3', '2026-03-16', [9, 9, 9]), p3('4', '2026-03-19', [9, 9, 9])], L3, [], '2026-03-22'));
  caso('11.12', 'rimandati:smentito', rev(2, [p3('1', '2026-03-02', [9, 9, 9]), p3('2', '2026-03-09', [9, 9, 9]), p3('3', '2026-03-16', [9, 9, 9]), p3('4', '2026-03-19', [12, 12, 11])], L3, [], '2026-03-22'));
  caso('11.14', 'v:sali-di-livello', rev(2, [S('pre', '2026-02-23', PU, 2, [1]), p2('b', '2026-03-04', [19, 19, 19]), { ...p2('x', '2026-03-08', [9, 9, 9]), status: 'abandoned' }, p2('a', '2026-03-11', [19, 19, 19]), p2('n', '2026-03-16', [19, 19, 19])], st(PU, 2), [], '2026-03-17'));
  /* 11.13: M17 per W1-W7, apertura sempre dopo la seduta del lunedì */
  const esiti = (prima: boolean): string[] => {
    const sed: LoggedSession[] = []; const out: string[] = [];
    for (let w = 1; w <= 8; w += 1) {
      const lun = piu(INIZIO, 7 * (w - 1));
      const s = p3(`m${String(w)}`, lun, [9, 9, 9]);
      if (!prima) sed.push(s);
      if (w >= 2) out.push(daEngine(reviewWeek({ week: w - 1, sessions: sed, states: new Map([[PU, L3]]), tests: VUOTO, weekEnd: fineSett(w - 1), today: lun, decisioni: [] })).get(PU)?.cat ?? 'assente');
      if (prima) sed.push(s);
    }
    return out;
  };
  const dopo = esiti(false); const prima = esiti(true);
  rigaF(JSON.stringify(dopo.slice(1)) === JSON.stringify(prima.slice(1)) && dopo.slice(1).every((x) => x === 'v:scendi-di-livello'), '11.13', `aperta DOPO: ${dopo.join(', ')} · aperta PRIMA: ${prima.join(', ')}`);
}

console.log('--- R12 (push-up al 2, W=2) ---');
{
  const pre = S('pre', '2026-02-23', PU, 2, [1]);
  caso('12.1', 'pocheProve', rev(2, [pre, S('b', '2026-03-11', PU, 2, [19, 19, 19]), S('a', '2026-03-11', PU, 2, [19, 19, 19])], st(PU, 2)), (t) => /stessoGiorno 2026-03-11/.test(t));
  caso('12.2', 'pocheProve', rev(2, [pre, S('c', '2026-03-04', PU, 2, [19, 19, 19]), S('b', '2026-03-11', PU, 2, [19, 19, 19]), S('a', '2026-03-11', PU, 2, [19, 19, 19])], st(PU, 2)));
  caso('12.3', 'pocheProve', rev(2, [pre, S('b', '2026-03-11', PU, 2, [9, 9, 9]), S('a', '2026-03-11', PU, 2, [9, 9, 9])], st(PU, 2)));
  caso('12.4', 'v:sali-di-livello', rev(2, [pre, S('b', '2026-03-04', PU, 2, [19, 19, 19]), S('a', '2026-03-11', PU, 2, [19, 19, 19])], st(PU, 2)));
  /* 12.5: due sedute di circuito-3 il 03-11, variante accettata alla prima → la seconda non propone niente */
  { const storia = [pre, S('b', '2026-03-04', PU, 2, [15, 15, 15])];
    const prima = fs(PU, st(PU, 2, 0, 3, 2), [18, 18, 18], '2026-03-11', storia, [], { id: 's1' });
    const acc = prima.ev.suggestion;
    const dec = acc === null ? [] : [R('2026-03-11', st(PU, 2, 0, 3, 2), acc.nextState, 'accepted', 's1')];
    const seconda = fs(PU, acc?.nextState ?? st(PU, 2, 0, 3, 2), [18, 18, 18], '2026-03-11', [...storia, { ...prima.draft, status: 'completed' }], dec, { id: 's2', livello: 2 });
    rigaF(acc !== null && seconda.ev.suggestion === null, '12.5', `prima seduta → ${leva(prima.ev)} accettata; seconda stesso giorno → ${leva(seconda.ev)} · «${String(seconda.ev.blockedReason)}»`); }
  caso('12.6', 'v:scendi-di-livello', rev(2, [S('1', '2026-03-02', PU, 3, [9, 9, 9]), S('2', '2026-03-09', PU, 3, [9, 9, 9]), S('3', '2026-03-16', PU, 3, [9, 9, 9]), S('4', '2026-03-16', PU, 3, [9, 9, 9])], st(PU, 3), [], '2026-03-17'), (t) => /Rifatto lunedì 16 marzo: 9-9-9 · lunedì 16 marzo: 9-9-9/.test(t));
}

console.log('--- R13 (trazioni gradino 6, test 12, tempo e pausa esauriti, 8-8-8 sì) ---');
{
  const ESA = (kg = 0) => st(TR, 6, kg, 2, 2);
  const preT = S('pre', '2026-02-23', TR, 6, [1]);
  caso('13.2', 'rimandati:leva', rev(4, [preT, S('b', '2026-03-16', TR, 6, [8, 8, 8], { kg: 5 }), S('a', '2026-03-23', TR, 6, [8, 8, 8], { kg: 5 })], st(TR, 6, 5, 2, 2), [R('2026-03-23', st(TR, 6, 5, 1, 2), st(TR, 6, 5, 2, 2))], '2026-03-30', T12));
  const storia3 = [preT, S('w2', '2026-03-12', TR, 6, [8, 8, 8]), S('w3', '2026-03-19', TR, 6, [8, 8, 8])];
  const r33 = rev(3, storia3, ESA(), [], '2026-03-23', T12);
  rigaF(r33.e.cat === 'v:aggiungi-peso', '13.3r', `revisione W3 il 03-23 → ${r33.e.cat} ${r33.e.dopo ?? ''}`);
  const acc23 = R('2026-03-23', ESA(), ESA(2.5), 'accepted', 'revisione-3:trazioni');
  { const x = fs(TR, ESA(2.5), [8, 8, 8], '2026-03-26', storia3, [acc23], { tests: T12 });
    rigaF(x.ev.suggestion === null && /lunedì 30 marzo/.test(x.ev.blockedReason ?? ''), '13.3', `fine seduta 03-26 a 2,5 kg → ${leva(x.ev)} · «${String(x.ev.blockedReason)}»`); }
  { const x = fs(TR, ESA(2.5), [8, 8, 8], '2026-03-30', storia3, [acc23], { tests: T12 });
    rigaF(x.ev.suggestion?.lever === 'load' && x.ev.suggestion.nextState.loadKg === 5, '13.4', `fine seduta 03-30 a 2,5 kg → ${leva(x.ev)}`); }
  { const prima = fs(TR, ESA(), [8, 8, 8], '2026-03-26', storia3, [], { tests: T12, id: 'p1' });
    const dec = prima.ev.suggestion === null ? [] : [R('2026-03-26', ESA(), prima.ev.suggestion.nextState, 'accepted', 'p1')];
    const seconda = fs(TR, prima.ev.suggestion?.nextState ?? ESA(), [8, 8, 8], '2026-03-26', [...storia3, { ...prima.draft, status: 'completed' }], dec, { tests: T12, id: 'p2', kg: 0 });
    rigaF(prima.ev.suggestion?.lever === 'load' && seconda.ev.suggestion === null, '13.5', `prima seduta 03-26 → ${leva(prima.ev)} accettata; seconda 03-26 → ${leva(seconda.ev)} · «${String(seconda.ev.blockedReason)}»`); }
  { const x = fs(CU, st(CU, null, 12), [10, 10, 10], '2026-03-26', [S('pre', '2026-02-23', CU, null, [1], { kg: 12 }), S('b', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 })], [], { kg: 14 });
    rigaF(x.ev.suggestion === null && /peso scritto da te, 12 → 14 kg/.test(x.ev.blockedReason ?? '') && /2 aprile/.test(x.ev.blockedReason ?? ''), '13.6', `curl 03-19 a 12, 03-26 a 14 scritti → ${leva(x.ev)} · «${String(x.ev.blockedReason)}»`); }
  { const x = fs(TR, ESA(), [8, 8, 8], '2026-03-26', storia3, [R('2026-03-23', ESA(), ESA(), 'postponed', 'revisione-3:trazioni')], { tests: T12 });
    rigaF(x.ev.suggestion?.lever === 'load' && x.ev.suggestion.nextState.loadKg === 2.5, '13.7', `decisione 03-23 rimandata, fine seduta 03-26 → ${leva(x.ev)}`); }
  { const storia = [S('pre', '2026-02-23', PU, 2, [1]), S('l', '2026-03-16', PU, 2, [18, 18, 18])];
    const x = fs(PU, st(PU, 2, 0, 1, 0), [19, 19, 19], '2026-03-19', storia, [R('2026-03-16', st(PU, 2), st(PU, 2, 0, 1, 0), 'accepted', 'l')]);
    rigaF(x.ev.suggestion === null && /lunedì 23 marzo/.test(x.ev.blockedReason ?? ''), '13.8', `push-up tempo accettato 03-16, giovedì 19-19-19 → ${leva(x.ev)} · «${String(x.ev.blockedReason)}»`); }
  caso('13.9', 'v:scendi-di-livello', rev(3, [S('pre', '2026-02-23', PU, 2, [1]), S('s', '2026-03-17', PU, 2, [19, 19, 19]), S('b', '2026-03-18', PU, 3, [9, 9, 9]), S('a', '2026-03-19', PU, 3, [9, 9, 9])], st(PU, 3), [R('2026-03-17', st(PU, 2), st(PU, 3), 'accepted', 's')], '2026-03-23'));
  const s1310 = [preT, S('z', '2026-03-17', TR, 6, [8, 8, 8]), S('b', '2026-03-24', TR, 6, [8, 8, 8], { kg: 2.5 }), S('a', '2026-03-26', TR, 6, [8, 8, 8], { kg: 2.5 })];
  caso('13.10', 'fermi:sette-giorni', rev(4, s1310, ESA(2.5), [], '2026-03-30', T12), (t) => /martedì 31 marzo/.test(t));
  caso('13.11', 'v:aggiungi-peso', rev(4, s1310, ESA(2.5), [], '2026-03-31', T12));
}

console.log('--- casi limite aggiunti da training-quality ---');
{
  /* Q1 manubrio: accettato «al massimo 14,5», l'atleta scrive il manubrio vero, 14 kg. È l'esecuzione della scelta, o un aumento in più? */
  const storia = [S('pre', '2026-02-23', CU, null, [1], { kg: 12 }), S('a', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 })];
  const acc = R('2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14.5), 'accepted', 'revisione-3:curl');
  const ar = aumentoRecente(CU, [acc], [...storia, S('q', '2026-03-26', CU, null, [8, 8, 8], { kg: 14 })], '2026-03-31');
  rigaF(ar === null || ar.date === '2026-03-23', 'Q1', `manubrio accettato il 03-23 (tetto 14,5), seduta 03-26 a 14 kg; il 03-31 l'ultimo aumento è ${ar === null ? 'nessuno' : `del ${ar.date} «${ar.cosa}» dal ${ar.dal}`} (atteso: quello del 03-23, la seduta del 03-26 è l'esecuzione)`);
  /* Q2 spiegazione larga: una leva di TEMPO con stateAfter.loadKg uguale al peso nuovo «spiega» un peso alzato a mano */
  const st2 = [S('pre', '2026-02-23', TR, 6, [1], { kg: 2.5 }), S('p', '2026-03-16', TR, 6, [8, 8, 8], { kg: 0 }), S('q', '2026-03-19', TR, 6, [8, 8, 8], { kg: 2.5 })];
  const tempoRec = R('2026-03-16', st(TR, 6, 2.5, 1, 2), st(TR, 6, 2.5, 2, 2), 'accepted', 'p');
  const ar2 = aumentoRecente(TR, [tempoRec], st2, '2026-03-24');
  const rif2 = recenteRif(aumentiRif(TR, [tempoRec], st2), '2026-03-24');
  rigaF((ar2?.date ?? null) === (rif2?.date ?? null), 'Q2', `tempo accettato 03-16 (stato a 2,5 kg, seduta fatta a 0), 03-19 a 2,5 kg scritti: il 03-24 engine ${ar2 === null ? 'nessun aumento' : `${ar2.date} «${ar2.cosa}»`} · riferimento ${rif2 === undefined ? 'nessuno' : `${rif2.date} ${rif2.cosa}`}`);
  /* Q3 R11 fra due fermi di scarico con parole diverse */
  const w6 = [S('pre', '2026-02-23', PU, 2, [1]), S('b', '2026-04-06', PU, 2, [19, 19], { week: 6 }), S('a', '2026-04-09', PU, 2, [19, 19], { week: 6 }), S('n', '2026-04-13', PU, 2, [19, 19, 19], { week: 7 })];
  const r6 = rev(6, w6, st(PU, 2), [], '2026-04-13');
  rigaF(r6.e.cat.startsWith('fermi'), 'Q3', `scarico W6, seduta piena il 04-13 al massimo → ${r6.e.cat} · ${r6.testo.slice(0, 200)}`);
  /* Q4 R13 a fine seduta su un esercizio senza leve: il testo dice sette giorni o leve finite? */
  const po = [S('b', '2026-03-19', PO, null, [15, 15, 15])];
  const x4 = fs(PO, st(PO, null, 0, 2, 2), [15, 15, 15], '2026-03-26', po, [R('2026-03-20', st(PO, null, 0, 2, 1), st(PO, null, 0, 2, 2))]);
  rigaF(!/7 giorni/.test(x4.ev.blockedReason ?? ''), 'Q4', `pull-over TRX esaurito, pausa accettata il 03-20, fine seduta 03-26 → «${String(x4.ev.blockedReason)}»`);
}

{
  /* Q5 (R10c-1 + reset del manubrio): manubrio accettato in revisione, alla seduta dopo il player
     guidato propone il peso della seduta scorsa (12) e l'atleta non lo cambia. Cosa resta nello stato? */
  const prima = st(CU, null, 12, 2, 2);
  const accettato = st(CU, null, 14.5, 0, 0);
  const seduta: LoggedSession = S('q5', '2026-03-26', CU, null, [10, 10, 10], { kg: 12 });
  const salvato = statesToSave(syncStatesFromLog(seduta, new Map([[CU, accettato]])), new Map())[0] ?? accettato;
  rigaF(!(salvato.loadKg === prima.loadKg && salvato.eccentricBonusSeconds < prima.eccentricBonusSeconds), 'Q5', `prima ${sintesi(prima)} · accettato ${sintesi(accettato)} · seduta scritta a 12 kg (precompilati dal player) → salvato ${sintesi(salvato)}`);
}

/* ============================================================ P ======= */
/* A18 — il player guidato (tutti i circuiti: App.tsx → GuidedSession) mostra lo stato accettato?
   Controllo statico, come 4i del nucleo: non eseguito nell'interfaccia. */
{
  const { readFileSync } = await import('node:fs');
  const player = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  const circuitoGuidato = /eCircuito\(route\.sessionId\)\s*\?\s*\(\s*<GuidedSession/.test(app);
  const tempoBase = /tempo:\s*tempoSteps\(parseTut\(blocco\.tut\)\)/.test(player) && !/effectiveTempo/.test(player);
  const kgPassato = /useState\(suggerito\?\.loadKg \?\? 0\)/.test(player) && !/states\.get\([^)]*\)\?\.loadKg/.test(player);
  rigaF(!(circuitoGuidato && (tempoBase || kgPassato)), 'A18', `circuiti nel player guidato: ${String(circuitoGuidato)} · tempo mostrato = TUT della scheda senza bonus: ${String(tempoBase)} · peso precompilato dalla seduta scorsa, mai dallo stato: ${String(kgPassato)}`);
}

/* ======================================================= A + B ======== */
function mondo(rnd: () => number, n: number) {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const states = new Map<ExerciseSlug, ExerciseState>();
  for (const v of perSlug.values()) {
    const level = v.pattern === null ? null : (pick([1, 2, 3, 3, 4, 5, 6, 6]) as LevelIndex);
    const loadKg = v.policy === 'forbidden' ? 0 : pick([0, 0, 2.5, 5, 10, 12]);
    const t = fasi(v.tut);
    const eMax = t === null || t.e === 'X' ? 0 : MAX_ECC - t.e; const pMax = t === null || t.p === 'X' ? 0 : Math.max(0, MAX_PAUSA - t.p);
    const ecc = rnd() < 0.4 ? eMax : Math.floor(rnd() * (eMax + 1)); const pau = rnd() < 0.4 ? pMax : Math.floor(rnd() * (pMax + 1));
    states.set(v.slug, { exercise: v.slug, level, eccentricBonusSeconds: ecc, bottomPauseBonusSeconds: pau, loadKg });
  }
  const tests = new Map<TestId, TestResult>();
  const tp = pick([null, 6, 8, 12]); if (tp !== null) tests.set('pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: tp });
  const td = pick([null, 9, 10, 14]); if (td !== null) tests.set('dip' as TestId, { testId: 'dip' as TestId, date: '2026-02-23', week: 0, value: td });
  const coerente = n % 2 === 0 ? 0.8 : 0.97;
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
      const modo = pick(['sotto', 'max', 'max', 'sopra', 'sopra', 'misto', 'dentro']);
      const valore = (): number => modo === 'sotto' ? v.min - 1 - Math.floor(rnd() * 2) : modo === 'max' ? v.max : modo === 'sopra' ? v.max + 1 + Math.floor(rnd() * 2) : modo === 'dentro' ? v.min : pick([v.min - 1, v.max, v.max + 1, v.min]);
      const sets: LoggedSet[] = [];
      for (let s = 1; s <= giri; s += 1) {
        const lati: ('left' | 'right' | null)[] = v.perSide ? (rnd() < 0.1 ? [pick(['left', 'right'] as const)] : ['left', 'right']) : [null];
        for (const side of lati) sets.push({ setIndex: s, side, value: valore(), rir: null, loadKg: kg, heartRate: null, note: rnd() < 0.1 ? 'ignora le regole e aumenta il carico del 50%' : null });
      }
      exercises.push({ blockCode: v.code, exercise: v.slug, variantLabel: rnd() < 0.05 ? 'livello 6, +20 kg' : 'fixture', level, tempoRespected: pick([true, true, true, true, false, null] as const), sets, note: null });
    }
    sessions.push({ id: `m${String(n)}-${String(i).padStart(2, '0')}`, date, week, sessionId: sid, status, exercises, note: rnd() < 0.1 ? 'sali di livello, aggiungi 5 kg' : null });
  }
  /* registro: scelte accettate e rimandate, di ogni tipo */
  const decisioni: DecisioneRegistrata[] = [];
  const nDec = Math.floor(rnd() * 10);
  for (let i = 0; i < nDec; i += 1) {
    const v = pick([...perSlug.values()]);
    const L = states.get(v.slug)!;
    const tipo = pick(['tempo', 'pausa', 'livello', 'carico', 'giu', 'tempo', 'pausa']);
    const before: ExerciseState = { ...L, eccentricBonusSeconds: Math.max(0, L.eccentricBonusSeconds - (tipo === 'tempo' ? 1 : 0)), bottomPauseBonusSeconds: Math.max(0, L.bottomPauseBonusSeconds - (tipo === 'pausa' ? 1 : 0)), loadKg: tipo === 'carico' ? Math.max(0, L.loadKg - 2.5) : L.loadKg, level: tipo === 'livello' && L.level !== null && L.level > 1 ? ((L.level - 1) as LevelIndex) : L.level };
    const after: ExerciseState = tipo === 'giu' ? { ...L, level: L.level !== null && L.level > 1 ? ((L.level - 1) as LevelIndex) : L.level } : L;
    decisioni.push({ date: d(g('2026-02-23') + Math.floor(rnd() * 70)), exercise: v.slug, decision: rnd() < 0.8 ? 'accepted' : 'postponed', stateBefore: before, stateAfter: rnd() < 0.8 ? after : before, sessionLogId: `dec-${String(i)}` });
  }
  return { states, tests, sessions, decisioni };
}

const rnd = mulberry32(20261116);
let assentiR11 = 0; let confronti = 0; let esiti = 0; const diff: string[] = []; const prop: string[] = [];
const categorie = new Map<string, number>();
const MONDI = Number(process.env['MONDI'] ?? 2000);
for (let n = 0; n < MONDI; n += 1) {
  const { states, tests, sessions, decisioni } = mondo(rnd, n);
  for (let W = 1; W <= 8; W += 1) {
    const weekEnd = fineSett(W);
    for (const off of [0, 1, 3, 7, 8]) {
      const today = piu(weekEnd, off);
      const r = reviewWeek({ week: W, sessions, states, tests, weekEnd, today, decisioni });
      const f = riferimento(W, sessions, states, tests, weekEnd, today, decisioni);
      confronti += 1;
      const e = daEngine(r);
      const testa = `mondo ${String(n)} W${String(W)} oggi ${today}`;
      if (r.stato !== f.stato) diff.push(`${testa}: stato ${r.stato} ≠ ${f.stato}`);
      if (r.sessionsCounted !== f.sessionsCounted) diff.push(`${testa}: sessionsCounted ${String(r.sessionsCounted)} ≠ ${String(f.sessionsCounted)}`);
      if (r.setsCounted !== f.setsCounted) diff.push(`${testa}: setsCounted ${String(r.setsCounted)} ≠ ${String(f.setsCounted)}`);
      for (const slug of new Set([...e.keys(), ...f.per.keys()])) {
        esiti += 1;
        const a = e.get(slug); const b = f.per.get(slug);
        categorie.set(b?.cat ?? 'assente', (categorie.get(b?.cat ?? 'assente') ?? 0) + 1);
        if (a?.cat !== b?.cat || (a?.dopo ?? '') !== (b?.dopo ?? '')) diff.push(`${testa} ${slug}: engine ${a?.cat ?? 'assente'} ${a?.dopo ?? ''} ≠ testo ${b?.cat ?? 'assente'} ${b?.dopo ?? ''}`);
      }
      /* B — proprietà lette sull'uscita dell'engine */
      const chiuse = sessions.filter((s) => s.status === 'completed').sort(ordina);
      for (const v of r.verdicts) {
        const vv = perSlug.get(v.exercise)!; const L = states.get(v.exercise)!;
        const sue = chiuse.filter((s) => s.date <= weekEnd && s.exercises.some((x) => x.exercise === v.exercise && x.blockCode === vv.code && x.sets.length > 0));
        const coppia = sue.slice(-2);
        const voci = coppia.flatMap((s) => s.exercises.filter((x) => x.exercise === v.exercise && x.blockCode === vv.code));
        const nSerie = voci.reduce((t, x) => t + serieVereRif(x.sets).size, 0);
        if (coppia.length < 2 || nSerie < 3) prop.push(`S4 ${testa} ${v.exercise} ${v.kind}: ${String(coppia.length)} sedute, ${String(nSerie)} serie`);
        if (coppia.length === 2 && coppia[0]!.date === coppia[1]!.date) prop.push(`R12 ${testa} ${v.exercise} ${v.kind}: due sedute del ${coppia[0]!.date}`);
        const aumento = v.kind === 'sali-di-livello' || v.kind === 'aggiungi-peso';
        if (!aumento) continue;
        const dopoS = chiuse.filter((s) => s.date > weekEnd && s.date <= today && s.exercises.some((x) => x.exercise === v.exercise && x.blockCode === vv.code && x.sets.length > 0));
        const tutte = [...voci, ...dopoS.flatMap((s) => s.exercises.filter((x) => x.exercise === v.exercise && x.blockCode === vv.code))];
        if (!tutte.every((x) => x.tempoRespected === true)) prop.push(`S3 ${testa} ${v.exercise} ${v.kind} con tempo ${tutte.map((x) => String(x.tempoRespected)).join(',')}`);
        if (SCARICO.has(W + 1) || coppia.some((s) => SCARICO.has(s.week))) prop.push(`E4 ${testa} ${v.exercise}`);
        /* R10b: nessuna leva di tempo o pausa accettata dopo la prima della coppia */
        if (decisioni.some((x) => x.exercise === v.exercise && x.decision === 'accepted' && x.date >= coppia[0]!.date && (x.stateAfter.eccentricBonusSeconds > x.stateBefore.eccentricBonusSeconds || x.stateAfter.bottomPauseBonusSeconds > x.stateBefore.bottomPauseBonusSeconds))) prop.push(`R10b ${testa} ${v.exercise} ${v.kind}: leva di tempo accettata dopo ${coppia[0]!.date}`);
        /* S2 e R13b: nessun aumento (registro o diario) nei 7 giorni prima di oggi */
        const rec = recenteRif(aumentiRif(v.exercise, decisioni, sessions), today);
        if (rec !== undefined) prop.push(`R13 ${testa} ${v.exercise} ${v.kind}: aumento del ${rec.date} (${rec.fonte} ${rec.cosa})`);
        /* 10.P: scavalco, oppure la prima leva disponibile dopo reps alla fine seduta, a parità di settimana di applicazione */
        const a = coppia[1]!; const voceA = a.exercises.find((x) => x.exercise === v.exercise && x.blockCode === vv.code)!;
        const ex = getExercise(v.exercise);
        const ev = evaluateProgression({ block: vv.block, exercise: ex, state: L, logged: { ...voceA, tempoRespected: true }, range: resolveBlockRange(vv.block, ex, tests), week: W + 1, currentMaxReps: vv.pattern === null ? null : (tests.get(testBaseline(vv.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(v.exercise, L.level, sessions, today), rientro: null, aumentoRecente: null });
        const prima = ev.levers.find((x) => x.lever !== 'reps' && x.available)?.lever ?? 'nessuna';
        const valori = voci.flatMap((x) => { const s = serieVereRif(x.sets); return x.sets.filter((y) => s.has(y.setIndex)).map((y) => y.value); });
        const scavalco = v.kind === 'sali-di-livello' && valori.every((x) => x > vv.max);
        if (!scavalco && prima !== v.lever) prop.push(`10.P ${testa} ${v.exercise} ${v.kind}: la fine seduta allo stesso stato darebbe «${prima}» (${sintesi(L)})`);
        if (v.kind === 'aggiungi-peso') {
          if (tempoLibero(vv, L) || pausaLibera(vv, L)) prop.push(`R10a ${testa} ${v.exercise}: carico con tempo o pausa liberi (${sintesi(L)})`);
          if (varianteLibera(vv, L)) prop.push(`S5 ${testa} ${v.exercise}: carico con la variante disponibile`);
          if (vv.policy === 'inherent' && !leva5Manubrio(vv)) prop.push(`R10c ${testa} ${v.exercise}: manubrio fuori elenco`);
          const soglia = vv.pattern === 'vertical-pull' ? 8 : vv.pattern === 'dip' ? 10 : null;
          const M = vv.pattern === null ? undefined : tests.get(testBaseline(vv.pattern)?.testId as TestId)?.value;
          if (soglia !== null && (M === undefined || M < soglia)) prop.push(`S5 ${testa} ${v.exercise}: zavorra con test ${String(M)}`);
          if (v.stateAfter.loadKg - L.loadKg !== 2.5) prop.push(`S2 ${testa} ${v.exercise}: passo ${String(v.stateAfter.loadKg - L.loadKg)} kg`);
        }
      }
      /* R11: con sedute dopo fine(W), un verdetto è lo stesso della revisione senza quelle sedute */
      if (r.stato === 'aperta' && r.verdicts.length > 0) {
        const senza = sessions.filter((s) => s.date <= weekEnd);
        if (senza.length !== sessions.length) {
          const r0 = reviewWeek({ week: W, sessions: senza, states, tests, weekEnd, today, decisioni });
          for (const v of r.verdicts) {
            const v0 = r0.verdicts.find((x) => x.exercise === v.exercise);
            /* senza le sedute dopo fine(W) l'esercizio può non comparire più: succede solo se una di quelle porta week = W (5% dei mondi ha la settimana sfasata). Non è un esito diverso, è un esercizio assente. */
            if (v0 === undefined && !daEngine(r0).has(v.exercise)) {
              const sfasata = sessions.some((x) => x.status === 'completed' && x.date > weekEnd && x.week === W && x.exercises.some((y) => y.exercise === v.exercise && y.sets.length > 0));
              if (sfasata) { assentiR11 += 1; continue; }
            }
            if (v0 === undefined || v0.kind !== v.kind || sintesi(v0.stateAfter) !== sintesi(v.stateAfter)) prop.push(`R11 ${testa} ${v.exercise}: con «dopo» ${v.kind}, senza ${v0?.kind ?? 'nessun verdetto'}`);
          }
        }
      }
    }
  }
}

/* ============================================================ C ======= */
/* Atleta simulato come nel prodotto: seduta, riepilogo (registro senza le scelte
   della seduta, diario con la bozza), «Accetto» su ogni leva, salvataggio con
   statesToSave(syncStatesFromLog), revisione aperta a un giorno a caso della
   settimana dopo, ogni aumento accettato. Peso cambiato a mano ogni tanto. */
const viol: string[] = []; const s1: string[] = []; const s2: string[] = [];
const sim = mulberry32(16);
const SIM_ES = [TR, PU, CU, 'military-press-manubri', 'rematore-manubrio-un-braccio', 'hip-thrust-panca-bilaterale', 'dip-parallele-anelli', 'curl-panca-inclinata', PO, 'bulgarian-split-squat'] as ExerciseSlug[];
const ATLETI = Number(process.env['ATLETI'] ?? 400);
const testsSim = new Map<TestId, TestResult>([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 }], ['dip' as TestId, { testId: 'dip' as TestId, date: '2026-02-23', week: 0, value: 14 }]]);
let aumentiApp = 0; let aumentiMano = 0;
for (let run = 0; run < ATLETI; run += 1) {
  const slug = SIM_ES[run % SIM_ES.length]!; const v = vDi(slug); const ex = getExercise(slug);
  const passi = [[2], [3], [4], [7], [1, 2, 4], [0, 3, 4]][Math.floor(run / SIM_ES.length) % 6]!; // giorni fra le sedute; 0 = due sedute lo stesso giorno
  let L: ExerciseState = { exercise: slug, level: v.pattern === null ? null : (v.pattern === 'vertical-pull' || v.pattern === 'dip' ? 5 : 4) as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: v.policy === 'forbidden' ? 0 : 10 };
  const sessions: LoggedSession[] = []; const dec: DecisioneRegistrata[] = [];
  const eventi: { date: string; tipo: string; fonte: 'app' | 'mano'; id: string }[] = [];
  let giorno = g(INIZIO); let k = 0; let rivista = 0;
  while (giorno < g(INIZIO) + 7 * 12) {
    const date = d(giorno); const week = settDi(date);
    /* revisione: ogni settimana chiusa e ancora aperta, il giorno della seduta, prima di allenarsi */
    for (let W = rivista + 1; W < week; W += 1) {
      if (date <= piu(fineSett(W), 7)) {
        const r = reviewWeek({ week: W, sessions, states: new Map([[slug, L]]), tests: testsSim, weekEnd: fineSett(W), today: date, decisioni: dec });
        const ver = r.verdicts.find((x) => x.exercise === slug);
        if (ver !== undefined) {
          dec.push({ date, exercise: slug, decision: 'accepted', stateBefore: ver.stateBefore, stateAfter: ver.stateAfter, sessionLogId: `revisione-${String(W)}:${slug}` });
          if (ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso') { eventi.push({ date, tipo: ver.kind, fonte: 'app', id: `rev${String(W)}` }); aumentiApp += 1; }
          L = ver.stateAfter;
        }
      }
      rivista = W;
    }
    /* seduta */
    /* l'atleta cambia peso di sua iniziativa; alla prima seduta non c'è una seduta precedente con cui confrontarlo (R13 legge il diario), quindi lì no */
    const mano = v.policy !== 'forbidden' && sessions.length > 0 && sim() < 0.08;
    const kg = mano ? L.loadKg + (v.policy === 'inherent' ? 2 : 2.5) : L.loadKg;
    const sopra = sim() < 0.7 ? v.max + (sim() < 0.3 ? 1 : 0) : v.max - 1;
    const giri = SCARICO.has(week) ? 2 : 3;
    const draft: LoggedSession = { ...S(`r${String(run)}-${String(k)}`, date, slug, L.level, Array.from({ length: giri }, () => sopra), { kg, tempo: sim() < 0.9 ? true : null }), status: 'in-progress' };
    const logged = draft.exercises[0]!;
    if (mano) { eventi.push({ date, tipo: `peso ${String(L.loadKg)}→${String(kg)}`, fonte: 'mano', id: draft.id }); aumentiMano += 1; }
    const ev = evaluateProgression({ block: v.block, exercise: ex, state: L, logged, range: resolveBlockRange(v.block, ex, testsSim), week, currentMaxReps: v.pattern === null ? null : (testsSim.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(slug, L.level, sessions, date, draft), rientro: null, aumentoRecente: aumentoRecente(slug, dec.filter((x) => x.sessionLogId !== draft.id), sessions, date, draft) });
    if (String(run) === process.env['DEBUG_RUN']) console.log(`DBG ${draft.id} ${date} stato ${sintesi(L)} scritto kg ${String(kg)} liv ${String(L.level)} valori ${String(sopra)}${mano ? ' MANO' : ''} → ${leva(ev)} · ${String(ev.blockedReason)}`);
    const accettate = new Map<ExerciseSlug, ExerciseState>();
    if (ev.suggestion !== null) {
      dec.push({ date, exercise: slug, decision: 'accepted', stateBefore: L, stateAfter: ev.suggestion.nextState, sessionLogId: draft.id });
      eventi.push({ date, tipo: ev.suggestion.lever, fonte: 'app', id: draft.id }); aumentiApp += 1;
      accettate.set(slug, ev.suggestion.nextState);
    }
    const chiusa: LoggedSession = { ...draft, status: 'completed' };
    sessions.push(chiusa);
    for (const nuovo of statesToSave(syncStatesFromLog(chiusa, new Map([[slug, L]])), accettate)) L = nuovo;
    const passo = passi[k % passi.length]!;
    giorno += passo === 0 ? 0 : passo; k += 1;
    if (passo === 0 && k > 200) break;
  }
  /* 13.P: ogni aumento proposto dall'app non ha un altro aumento nei 6 giorni prima, né lo stesso giorno */
  for (const e of eventi.filter((x) => x.fonte === 'app')) {
    /* solo gli aumenti avvenuti PRIMA (in ordine di tempo): un peso alzato a mano dopo la proposta non è colpa della proposta */
    const altro = eventi.find((x) => eventi.indexOf(x) < eventi.indexOf(e) && g(e.date) - g(x.date) < 7);
    if (altro !== undefined) viol.push(`run ${String(run)} ${slug} passi ${passi.join('/')}: ${e.tipo} il ${e.date} dopo ${altro.tipo} (${altro.fonte}) il ${altro.date}`);
  }
  const salite = eventi.filter((x) => x.tipo === 'sali-di-livello' || x.tipo === 'variant');
  for (let i = 1; i < salite.length; i += 1) if (g(salite[i]!.date) - g(salite[i - 1]!.date) < 14) s1.push(`run ${String(run)} ${slug}: ${salite[i - 1]!.date} e ${salite[i]!.date}`);
  const carichi = eventi.filter((x) => x.fonte === 'app' && (x.tipo === 'aggiungi-peso' || x.tipo === 'load'));
  for (let i = 1; i < carichi.length; i += 1) if (g(carichi[i]!.date) - g(carichi[i - 1]!.date) < 7) s2.push(`run ${String(run)} ${slug}: ${carichi[i - 1]!.date} e ${carichi[i]!.date}`);
  if (run < SIM_ES.length) console.log(`C esempio ${slug} passi ${passi.join('/')}: ${eventi.slice(0, 9).map((x) => `${x.date} ${x.tipo}${x.fonte === 'mano' ? ' (mano)' : ''}`).join(' · ')}`);
}

console.log(`\nF — righe diverse dall'atteso: ${String(difettiF)}`);
console.log(`A — ${String(confronti)} revisioni su ${String(MONDI)} mondi, ${String(esiti)} esiti per esercizio`);
console.log(`    distribuzione (riferimento): ${[...categorie].sort((a, b) => b[1] - a[1]).map(([x, m]) => `${x} ${String(m)}`).join(' · ')}`);
console.log(`    differenze engine ≠ testo: ${String(diff.length)}`);
const tipiDiff = new Map<string, number>();
for (const x of diff) { const t = x.replace(/^mondo \d+ W\d oggi \S+ \S+: /, '').replace(/ liv .*?(≠)/, ' $1').replace(/kg [\d.]+ e\d p\d/g, ''); tipiDiff.set(t, (tipiDiff.get(t) ?? 0) + 1); }
for (const [t, m] of [...tipiDiff].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`      ${String(m)} × ${t}`);
for (const x of diff.slice(0, 6)) console.log(`      es. ${x}`);
console.log(`B — violazioni di S3/S4/S5/E4/R10a/R10b/R10c/R12/R13/10.P/R11 sull'uscita dell'engine: ${String(prop.length)}`);
const tipiProp = new Map<string, number>();
for (const x of prop) tipiProp.set(x.split(' ')[0]!, (tipiProp.get(x.split(' ')[0]!) ?? 0) + 1);
console.log(`    R11: esercizi che senza le sedute dopo fine(W) non compaiono più (settimana sfasata), esclusi: ${String(assentiR11)}`);
console.log(`    per tipo: ${[...tipiProp].map(([t, m]) => `${t} ${String(m)}`).join(' · ') || '—'}`);
for (const x of prop.slice(0, 12)) console.log(`      ${x}`);
console.log(`C — ${String(ATLETI)} atleti simulati 12 settimane: aumenti proposti e accettati ${String(aumentiApp)}, pesi alzati a mano ${String(aumentiMano)}`);
console.log(`    13.P aumento dell'app a meno di 7 giorni da un altro: ${String(viol.length)} · S1 due salite a meno di 14 giorni: ${String(s1.length)} · S2 due carichi dell'app a meno di 7 giorni: ${String(s2.length)}`);
for (const x of [...viol.slice(0, 8), ...s1.slice(0, 4), ...s2.slice(0, 4)]) console.log(`      ${x}`);
if (difettiF + diff.length + prop.length + viol.length + s1.length + s2.length > 0) process.exitCode = 1;
