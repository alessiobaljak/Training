/*
 * 18 — rilascio C (T-27 L26 `d8c18ce`, T-26 L25 `4142059`, T-25 M22 `17ea244`, B14 `f7f945d`), commit f7f945d.
 *
 * v1, 2026-11-20 (riferimento B18 2026-11-21e; R23 sulla salita 2026-11-21, quality su 9d7b20f). Copia di `17` (stessa macchina, righe di B2 invariate) con il riferimento aggiornato dal testo di
 * training/reports/2026-11-21-training.md §2 (M22), §3 (L25), §4 (L26), NON da review.ts, tetto.ts né circuit.ts:
 *   - riferimento della revisione con R19 in R10a (2)-(7): σ_rev = stati della revisione (iniziali per chi manca), salite
 *     di gradino della stessa revisione che allungano (primo giro), passo; `tetto` per (5) forbidden, (6) fuori da
 *     LEVA_MANUBRIO, (6) cima/oltre-s2; il peso mai scritto o fuori da MANUBRI_KG resta «manubrio» come R17c (3) (M22.6);
 *   - A2: le revisioni dei mondi di A con `durata: durataDellaSedutaDi` (come Home e Revisione) contro il riferimento;
 *     M22.7 (circuiti 1-3 identici con e senza durata, uscita intera); M22.P sulla fine seduta rifatta in W+1; testi;
 *   - C3 e C3R: riepilogo e revisione come l'app a f7f945d (tetto.ts, durata), σ′ di riferimento dal §3 (base =
 *     toEvaluate → syncRif → decadenze; proposte sopra che allungano, durRif), confronto a due lati; M22.P; L25.P1
 *     (prefisso delle proposte accettate e cause delle sedute oltre il tetto); S2, S5, D19.P, R13 sui carichi della
 *     revisione (R-14); C3R con accetto e rifiuto, scelte non eseguite e gradini scritti a mano;
 *   - F: M22.1-M22.6, L25.1-L25.5, L26.1-L26.4 (note contro f63c9f1 via git, 59 costruito, estremo teorico), B14.
 *
 * Positivo obbligatorio: lo stesso file gira su fb560e7 (git archive nella scratchpad, script copiato lì dentro);
 * lì tetto.ts, durataDellaSedutaDi, calibrazioneDaMostrare e DEVIAZIONI_NOTA non esistono e le righe nuove devono fallire.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/18-c.mts
 * (MONDI, ATLETI, ATLETI3, SETT, P14, ROLLBACK, A2 come variabili d'ambiente). Esce 1 se una parte trova un difetto.
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
import { buildGuidedPlan, estimatedSeconds, minWorkSeconds } from '../../src/engine/circuit.ts';
import { blockPerSide } from '../../src/engine/rest.ts';
import { calibrateLoad } from '../../src/engine/loading.ts';
import * as CircE from '../../src/engine/circuit.ts';
import * as LoE from '../../src/engine/loading.ts';
import * as DevE from '../../src/data/deviations.ts';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type {
  DecisioneRegistrata, ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession, LoggedSet, MotorPattern, ProgramBlock, TestId, TestResult,
} from '../../src/types/index.ts';

/* Namespace: lo stesso file gira anche sul codice di produzione (positivo
   obbligatorio), dove `aumentoRecente` e `LEVA_MANUBRIO` non esistono. */
const evaluateProgression = P.evaluateProgression;
const salitaConsentita = P.salitaConsentita;
type AR = (s: ExerciseSlug, d: readonly DecisioneRegistrata[], x: readonly LoggedSession[], o: string, c?: LoggedSession | null) => unknown;
const aumentoRecente = ((P as Record<string, unknown>)['aumentoRecente'] as AR | undefined) ?? ((): null => null);
/* B1 (221b2e8): funzioni e ingressi nuovi. In produzione non esistono: lì le righe nuove devono fallire. */
const livelloVociP = (P as Record<string, unknown>)['livelloVoci'] as ((v: readonly LoggedExercise[]) => LevelIndex | null) | undefined;
const DURATA_CODICE = (P as Record<string, unknown>)['DURATA_MASSIMA_SECONDI'] as number | undefined;
/* D-22 (a), Alessio, 2026-11-20: tetto di 55 minuti di piano guidato, riscaldamento compreso (§7). */
const TETTO = 55 * 60;
const PROD = process.env['PROD'];
const Pp = PROD === undefined ? null : ((await import(`${PROD}/src/engine/progression.ts`)) as typeof P);
/* B2: decadenza.ts (T-15, T-16). In produzione non esiste: riepilogo e chiusura restano quelli di prima. */
type DzT = typeof import('../../src/engine/decadenza.ts');
const Dz: DzT | null = await import('../../src/engine/decadenza.ts').catch(() => null);
/* C (f7f945d): T-25 durataDellaSedutaDi, T-26 tetto.ts, B14 calibrazioneDaMostrare, T-27 DEVIAZIONI_NOTA. In produzione non esistono. */
type TtT = typeof import('../../src/engine/tetto.ts');
const Tt: TtT | null = await import('../../src/engine/tetto.ts').catch(() => null);
type DurApp = (slug: ExerciseSlug, stati: ReadonlyMap<ExerciseSlug, ExerciseState>) => number | null;
const durataApp = (CircE as Record<string, unknown>)['durataDellaSedutaDi'] as DurApp | undefined;
const calDaMostrare = (LoE as Record<string, unknown>)['calibrazioneDaMostrare'] as ((k: string, s: readonly LoggedSet[], c: number) => ReturnType<typeof calibrateLoad>) | undefined;
type DevNota = { sessione: string; scheda: string | null; app: string | null; motivo: string };
const DEV_NOTA = (DevE as Record<string, unknown>)['DEVIAZIONI_NOTA'] as readonly DevNota[] | undefined;
/* Testi della specifica 2026-11-21 §2 e §4, parola per parola */
const TESTO_TETTO_REV = 'massimo chiuso su tutte le serie. Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i 55 minuti, e su questo esercizio non ci sono altre leve. Si resta così finché la seduta non torna sotto i 55 minuti: allora il riepilogo di fine seduta riprende con tempo e pausa.';
const TESTO_R17C4 = 'Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i 55 minuti, e su questo esercizio non ci sono altre leve. Oggi resta tutto com’è; tempo e pausa ripartono quando la seduta torna sotto i 55 minuti, per esempio dopo un cambio di manubrio su un altro esercizio del circuito.';
const FRASE_VARIANTE_TETTO = 'massimo chiuso su tutte le serie. Tempo e pausa si fermano al tetto: con un altro passo la seduta supererebbe i 55 minuti. La prossima leva è il livello';
const EVIDENZA_TETTO = 'Massimo del range chiuso su tutte le serie; tempo e pausa fermi al tetto dei 55 minuti.';
const NOTA_C4 = 'È la più lunga delle quattro. Con tempo e pausa accumulati può arrivare a 55 minuti: oltre, il metodo non aggiunge altro tempo e passa alla leva successiva. Quando l’hip thrust passa ai gradini su una gamba, che si fanno per lato, può arrivare a circa 59 minuti. Non togliere ripetizioni né recupero.';
const NOTA_C2_APP = 'I minuti di margine sono il posto giusto per 2 serie opzionali di alzate laterali (12-18, RIR 0-1, 30" tra le due), in coda al Tri-set B.';
/* Testi dalla specifica: §6 (D-21), §7 (R19); E4 in scarico com'è (T-21: «W6 con l'E4 di oggi»). */
const TESTO_D21 = 'La settimana prossima è di scarico: niente aumenti da questa seduta, anche con il massimo chiuso. Si riprende dopo lo scarico.';
const TESTO_E4 = 'Settimana di scarico: niente aumenti, anche con il massimo chiuso. Stessa difficoltà, metà delle serie.';
const TESTO_R19 = 'Con questo passo la seduta supererebbe i 55 minuti: tempo e pausa si fermano qui, si passa alla leva successiva.';
const SETT = Number(process.env['SETT'] ?? 18);
const mmss = (x: number): string => `${String(Math.floor(x / 60))}:${String(x % 60).padStart(2, '0')}`;
console.log(`livelloVoci nel codice: ${livelloVociP === undefined ? 'assente' : 'presente'} · DURATA_MASSIMA_SECONDI nel codice: ${String(DURATA_CODICE)} · D-22 (a): ${String(TETTO)}`);
const arDal = (x: unknown): string | null => (x === null || x === undefined ? null : (x as { dal: string }).dal);
/* D-19 (Alessio, 2026-11-16, dal brief): l'elenco del riferimento è scritto qui, non letto dal codice. */
const LEVA_D19 = new Set(['curl-martello-manubri', 'curl-manubri-supino', 'curl-panca-inclinata', 'military-press-manubri', 'rematore-manubrio-un-braccio']);
{
  const nelCodice = (Metodo as Record<string, unknown>)['LEVA_MANUBRIO'] as ReadonlySet<string> | undefined;
  const uguale = nelCodice !== undefined && nelCodice.size === LEVA_D19.size && [...LEVA_D19].every((x) => nelCodice.has(x));
  console.log(`LEVA_MANUBRIO nel codice ${nelCodice === undefined ? 'assente' : `= [${[...nelCodice].join(', ')}]`} · uguale a D-19: ${String(uguale)}`);
}

/* D-19 (b), Alessio 2026-11-20 (2026-11-21-training.md §1): i manubri che ha. Scritto qui, non letto da method.ts. */
const MANUBRI_RIF: readonly number[] = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24];
type EsitoRif = { tipo: 'successivo' | 'oltre-s2'; kg: number } | { tipo: 'mai-scritto' | 'fuori-elenco' | 'cima' };
function manubrioDopoRif(v: number, elenco: readonly number[] = MANUBRI_RIF): EsitoRif {
  if (v <= 0) return { tipo: 'mai-scritto' };
  const i = elenco.findIndex((x) => Math.abs(x - v) < 1e-9);
  if (i < 0) return { tipo: 'fuori-elenco' };
  if (i === elenco.length - 1) return { tipo: 'cima' };
  const N = elenco[i + 1]!;
  return N - v > 2.5 + 1e-9 ? { tipo: 'oltre-s2', kg: N } : { tipo: 'successivo', kg: N };
}
const inElenco = (x: number): boolean => MANUBRI_RIF.some((y) => Math.abs(y - x) < 1e-9);
const D19P = { rev: 0, fs: 0, viol: [] as string[] };
let idSeq = 0;
const nuovoId = (): string => `q${String(++idSeq)}`;
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

/* R13 con R15 e D-20 (a, b), dal testo della specifica (Notazione comune, R15):
   - scelta in salita c su g ∈ {carico, livello}: D(c) = prima seduta di e, in ordine
     (date, id), con id ≠ c.sessionLogId, date ≥ c.date, v_g scritto e ≠ B;
     eseguita ⇔ B < v_g(D) ≤ T → data D.date; altrimenti (in attesa, superata,
     sotto B) data c.date;
   - tempo e pausa: data della prima seduta di e dopo la scelta (id ≠ sessionLogId,
     date ≥ c.date), o c.date se non c'è (D-20 b);
   - diario: seduta con v_g > v_g della precedente in cui v_g è scritto, salvo se è
     la D di una scelta eseguita sulla stessa grandezza. Peso non scritto:
     inherent a 0 kg; forbidden: il carico non si considera. */
/* L24 (appendice 2026-11-20 §2): v_livello(X) = il più alto level ≠ null fra le voci di e in X con almeno una serie. */
const livRif = (voci: readonly LoggedExercise[]): number | null => voci.reduce<number | null>((m, x) => (x.sets.length === 0 || x.level === null ? m : m === null || x.level > m ? x.level : m), null);
/* 16.P (appendice §4): con dopo ≠ ∅, due verdetti in salita su E ed E⁺ hanno lo stesso tipo. */
const P16: string[] = []; const P16conti = { coppie: 0 };
interface AumentoRif { date: string; fonte: 'registro' | 'diario'; cosa: string; scelta?: string; sid?: string; ref?: string }
function aumentiRif(slug: ExerciseSlug, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[], inCorso: LoggedSession | null = null): AumentoRif[] {
  const out: AumentoRif[] = [];
  const pol = getExercise(slug).loadPolicy;
  /* R14: una scelta tolta non conta né come aumento né come spiegazione */
  const tolteR = new Set(dec.flatMap((r) => (r.decision === 'lapsed' && r.ref !== undefined ? [r.ref] : [])));
  const acc = dec.filter((r) => r.exercise === slug && r.decision === 'accepted' && (r.id === undefined || !tolteR.has(r.id)));
  const diario = [...sessions.filter((s) => s.status === 'completed' && s.id !== inCorso?.id), ...(inCorso === null ? [] : [inCorso])]
    .filter((s) => s.exercises.some((x) => x.exercise === slug && x.sets.length > 0)).sort(ordina);
  const voci = (s: LoggedSession): LoggedExercise[] => s.exercises.filter((x) => x.exercise === slug && x.sets.length > 0);
  const vCarico = (s: LoggedSession): number | null => { if (pol === 'forbidden') return null; const k = kgMax(voci(s)); return pol === 'inherent' && k === 0 ? null : k; };
  const vLivello = (s: LoggedSession): number | null => livRif(voci(s));
  const eseguite = new Set<string>();
  for (const c of acc) {
    const dopo = diario.filter((s) => s.id !== c.sessionLogId && s.date >= c.date);
    const grandezze: [string, number | null, number | null, (s: LoggedSession) => number | null][] = [
      ['carico', c.stateBefore.loadKg, c.stateAfter.loadKg, vCarico],
      ['livello', c.stateBefore.level, c.stateAfter.level, vLivello],
    ];
    for (const [gr, B, T, v] of grandezze) {
      if (B === null || T === null || !(T > B)) continue;
      const D = dopo.find((s) => v(s) !== null && v(s) !== B);
      const val = D === undefined ? null : v(D);
      if (D !== undefined && val !== null && val > B && val <= T) { out.push({ date: D.date, fonte: 'registro', cosa: `${gr} eseguito ${String(B)}→${String(val)}`, scelta: c.date, sid: D.id, ref: c.sessionLogId }); eseguite.add(`${D.id}:${gr}`); }
      else out.push({ date: c.date, fonte: 'registro', cosa: `${gr} scelto ${String(B)}→${String(T)}`, scelta: c.date, ref: c.sessionLogId });
    }
    const t = c.stateAfter.eccentricBonusSeconds > c.stateBefore.eccentricBonusSeconds; const p = c.stateAfter.bottomPauseBonusSeconds > c.stateBefore.bottomPauseBonusSeconds;
    if (t || p) out.push({ date: dopo[0]?.date ?? c.date, fonte: 'registro', cosa: [t ? 'tempo' : '', p ? 'pausa' : ''].filter(Boolean).join('+'), scelta: c.date, sid: dopo[0]?.id, ref: c.sessionLogId });
  }
  const conC = diario.filter((s) => vCarico(s) !== null);
  for (let i = 1; i < conC.length; i += 1) { const a = vCarico(conC[i - 1]!)!; const b = vCarico(conC[i]!)!; if (b > a && !eseguite.has(`${conC[i]!.id}:carico`)) out.push({ date: conC[i]!.date, fonte: 'diario', cosa: `kg ${String(a)}→${String(b)}`, sid: conC[i]!.id }); }
  const conL = diario.filter((s) => vLivello(s) !== null);
  for (let i = 1; i < conL.length; i += 1) { const a = vLivello(conL[i - 1]!)!; const b = vLivello(conL[i]!)!; if (b > a && !eseguite.has(`${conL[i]!.id}:livello`)) out.push({ date: conL[i]!.date, fonte: 'diario', cosa: `livello ${String(a)}→${String(b)}`, sid: conL[i]!.id }); }
  return out;
}
/* L23 (appendice §1): un aumento con data d conta se daysBetween(d, oggi) < 7, anche negativo; dal = d + 7 con d la più recente. */
const recenteRif = (au: readonly AumentoRif[], oggi: string): AumentoRif | undefined => au.filter((x) => g(oggi) - g(x.date) < 7).sort((a, b) => (a.date < b.date ? -1 : 1)).at(-1);

type Esito = { cat: string; dopo?: string; tetto?: boolean; pesoFuori?: boolean };
/* M22: il riferimento gira anche in silenzio (A2, C3), senza toccare i conti di 16.P */
let rifSilenzioso = false;
function circuitiDi(slug: ExerciseSlug): Circ[] { return (CIRCUIT_SESSIONS as readonly Circ[]).filter((c) => c.blocks.some((b) => b.exercise === slug)); }
/* §2: σ_rev parte da WeeklyReviewInput.states, con initialExerciseState per chi manca */
function statiRev(c: Circ, states: ReadonlyMap<ExerciseSlug, ExerciseState>, tests: ReadonlyMap<TestId, TestResult>): Stati {
  const m: Stati = new Map();
  for (const b of c.blocks) m.set(b.exercise, states.get(b.exercise) ?? P.initialExerciseState(getExercise(b.exercise), tests));
  return m;
}
const sintesi = (s: ExerciseState): string => `liv ${String(s.level)} kg ${String(s.loadKg)} e${String(s.eccentricBonusSeconds)} p${String(s.bottomPauseBonusSeconds)}`;
interface Rif { stato: string; sessionsCounted: number; setsCounted: number; per: Map<ExerciseSlug, Esito> }

function riferimento(W: number, sessions: readonly LoggedSession[], states: ReadonlyMap<ExerciseSlug, ExerciseState>, tests: ReadonlyMap<TestId, TestResult>, weekEnd: string, today: string, dec: readonly DecisioneRegistrata[], durRev?: (c: Circ, s: Stati) => number, salite?: ReadonlyMap<ExerciseSlug, ExerciseState>): Rif {
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
    /* R14c: un record `lapsed` che rialza tempo o pausa, con data ≥ la più vecchia della coppia */
    if (dec.some((r) => r.exercise === slug && r.decision === 'lapsed' && r.date >= bd && (r.stateAfter.eccentricBonusSeconds > r.stateBefore.eccentricBonusSeconds || r.stateAfter.bottomPauseBonusSeconds > r.stateBefore.bottomPauseBonusSeconds))) { per.set(slug, { cat: 'rimandati:decaduta' }); continue; }
    const recente = recenteRif(aumentiRif(slug, dec, sessions), today);
    const lv = L.level;
    const giu = v.pattern === null || lv === null ? null : vicino(v.pattern, lv, -1);
    const su = v.pattern === null || lv === null ? null : vicino(v.pattern, lv, 1);
    const esito = (sedute: readonly LoggedSession[]): Esito => {
      const voci = sedute.flatMap((s) => strutturali(s, slug));
      const valori = voci.flatMap((x) => { const vv = serieVereRif(x.sets); return x.sets.filter((y) => vv.has(y.setIndex)).map((y) => y.value); });
      if (valori.every((x) => x < v.min)) return giu === null ? { cat: 'v:range-da-rifare', dopo: sintesi(L) } : { cat: 'v:scendi-di-livello', dopo: sintesi({ ...L, level: giu as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, /* B18 (S5, 2026-11-21e) e R23 (2026-11-21): cambiando gradino la zavorra torna a 0 sugli `allowed`; i manubri restano */ ...(getExercise(slug).loadPolicy === 'allowed' && L.loadKg > 0 ? { loadKg: 0 } : {}) }) };
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
        if (inizio === null || g(today) - g(inizio) < 14) {
          /* R17b: se R13 ferma più a lungo di R7, fermo sette-giorni */
          if (inizio !== null && recente !== undefined && piu(recente.date, 7) > piu(inizio, 14)) return { cat: 'fermi:sette-giorni' };
          return { cat: 'inAttesa' };
        }
        if (recente !== undefined) return { cat: 'fermi:sette-giorni' };
        return { cat: 'v:sali-di-livello', dopo: sintesi({ ...L, level: su as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, /* R23 (2026-11-21, L14): anche salendo la zavorra torna a 0 sugli `allowed`; i manubri restano */ ...(getExercise(slug).loadPolicy === 'allowed' && L.loadKg > 0 ? { loadKg: 0 } : {}) }) };
      }
      /* R10a 2-5, con R19 in revisione quando `durRev` c'è (M22, 2026-11-21 §2): σ_rev = stati della revisione, le salite
         di gradino della stessa revisione su altri esercizi del circuito se allungano, poi il passo; un passo disponibile
         ma oltre il tetto mette tetto = vero e si va avanti. */
      const oltre = (dopoPasso: ExerciseState): boolean => durRev !== undefined && circuitiDi(slug).some((c) => {
        const base = statiRev(c, states, tests);
        const sigma: Stati = new Map(base);
        for (const [x, s] of salite ?? new Map<ExerciseSlug, ExerciseState>()) {
          if (x === slug || !base.has(x)) continue;
          if (durRev(c, new Map(base).set(x, s)) > durRev(c, base)) sigma.set(x, s);
        }
        sigma.set(slug, dopoPasso);
        return durRev(c, sigma) > TETTO;
      });
      const tOltre = tempoLibero(v, L) && oltre({ ...L, eccentricBonusSeconds: L.eccentricBonusSeconds + 1 });
      const pOltre = pausaLibera(v, L) && oltre({ ...L, bottomPauseBonusSeconds: L.bottomPauseBonusSeconds + 1 });
      const tetto = tOltre || pOltre;
      const T = tetto ? { tetto: true } : {};
      if (tempoLibero(v, L) && !tOltre) return { cat: 'alMassimo:tempo' };
      if (pausaLibera(v, L) && !pOltre) return { cat: 'alMassimo:pausa' };
      if (varianteLibera(v, L)) return { cat: 'alMassimo:variante', ...T };
      /* (5) forbidden, (6) fuori da LEVA_MANUBRIO (R10c-1, M22.2), (6) cima o oltre-s2: `tetto` quando c'è */
      const finite: Esito = { cat: tetto ? 'alMassimo:tetto' : 'alMassimo:leve-finite', ...T };
      if (v.policy === 'forbidden') return finite;
      /* R10a 6: manubri, R10c-1 */
      if (v.policy === 'inherent') {
        if (!leva5Manubrio(v)) return finite;
        if (W + 1 < SBLOCCO) return { cat: 'alMassimo:settimana', ...T };
        /* D-19 (b) §1, R10a (6): mai-scritto/fuori-elenco ⇒ alMassimo «manubrio» (anche col tetto: §2 non lo elenca, e
           R17c (3) a fine seduta tiene il testo del manubrio, M22.6); cima/oltre-s2 ⇒ leve-finite o tetto; poi R13; poi N */
        const m = manubrioDopoRif(L.loadKg);
        if (m.tipo === 'mai-scritto' || m.tipo === 'fuori-elenco') return { cat: 'alMassimo:manubrio', ...T, ...(tetto ? { pesoFuori: true } : {}) };
        if (m.tipo === 'cima' || m.tipo === 'oltre-s2') return finite;
        if (recente !== undefined) return { cat: 'fermi:sette-giorni', ...T };
        return { cat: 'v:aggiungi-peso', dopo: sintesi({ ...L, loadKg: m.kg, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }), ...T };
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
      const su16 = (c: string): boolean => c === 'v:sali-di-livello' || c === 'v:aggiungi-peso';
      if (!rifSilenzioso && su16(E.cat) && su16(Ep.cat)) { P16conti.coppie += 1; if (E.cat !== Ep.cat) P16.push(`${slug} W${String(W)} oggi ${today}: E ${E.cat}, E⁺ ${Ep.cat}`); }
      /* R16: per i fermi conta la famiglia; scarico-coppia = scarico */
      const fam = (c: string): string => (c === 'fermi:scarico-coppia' ? 'fermi:scarico' : c);
      if (fam(Ep.cat) !== fam(E.cat)) { per.set(slug, { cat: 'rimandati:smentito' }); continue; }
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

/* M22 §2: due giri. Il primo trova le salite di gradino (R10a 1 non dipende da R19); il secondo le usa in σ_rev. */
function riferimentoM22(W: number, sessions: readonly LoggedSession[], states: ReadonlyMap<ExerciseSlug, ExerciseState>, tests: ReadonlyMap<TestId, TestResult>, weekEnd: string, today: string, dec: readonly DecisioneRegistrata[]): Rif {
  rifSilenzioso = true;
  try {
    const primo = riferimento(W, sessions, states, tests, weekEnd, today, dec);
    const salite = new Map<ExerciseSlug, ExerciseState>();
    for (const [slug, e] of primo.per) {
      if (e.cat !== 'v:sali-di-livello') continue;
      const L = states.get(slug)!; const v = perSlug.get(slug)!;
      const su = v.pattern === null || L.level === null ? null : vicino(v.pattern, L.level, 1);
      if (su !== null) salite.set(slug, { ...L, level: su as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 });
    }
    return riferimento(W, sessions, states, tests, weekEnd, today, dec, durRif, salite);
  } finally { rifSilenzioso = false; }
}
/* L'uscita della revisione per un esercizio, intera (M22.7: con e senza durata deve essere identica) */
function serialEs(r: ReturnType<typeof reviewWeek>, slug: ExerciseSlug): string {
  const out: unknown[] = [];
  for (const [k, v] of Object.entries(r as unknown as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    for (const x of v) if (typeof x === 'object' && x !== null && (x as { exercise?: string }).exercise === slug) out.push([k, x]);
    if (k === 'inRange') out.push([k, (v as unknown[]).includes(getExercise(slug).name)]);
  }
  return JSON.stringify(out);
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
/* fine seduta come il riepilogo (SessionSummary a 221b2e8): stato di prima, registro senza le scelte della seduta,
   diario con la bozza; ingressi B1 come li passa il riepilogo: carico e gradino più alti fra le voci dell'esercizio
   nella bozza, «peso scritto prima» = una seduta chiusa diversa dalla bozza con un peso > 0 su quell'esercizio. */
interface VoceBozza { code?: string; livello?: LevelIndex | null; kg?: number; valori: number[]; tempo?: boolean | null }
type OpzFs = { kg?: number; tempo?: boolean | null; tests?: Map<TestId, TestResult>; id?: string; livello?: LevelIndex | null; caricoSeduta?: number; week?: number; durataCon?: (s: ExerciseState) => number };
function fsN(slug: ExerciseSlug, L: ExerciseState, vociB: VoceBozza[], date: string, storia: LoggedSession[], dec: DecisioneRegistrata[], o: OpzFs = {}) {
  const v = vDi(slug); const ex = getExercise(slug); const tests = o.tests ?? VUOTO;
  const id = o.id ?? `bozza-${date}`;
  const exercises: LoggedExercise[] = vociB.map((x, i) => ({ ...S(id, date, slug, x.livello === undefined ? L.level : x.livello, x.valori, { kg: x.kg ?? L.loadKg, tempo: x.tempo }).exercises[0]!, blockCode: x.code ?? (i === 0 ? v.code : `${v.code}bis${String(i)}`) }));
  const draft: LoggedSession = { id, date, week: o.week ?? settDi(date), sessionId: v.sid, status: 'in-progress', exercises, note: null };
  const stessi = exercises.filter((x) => x.exercise === slug);
  const decF = dec.filter((r) => r.sessionLogId !== draft.id);
  const ar = aumentoRecente(slug, decF, storia, date, draft);
  const pesoScrittoPrima = storia.some((s) => s.status === 'completed' && s.id !== draft.id && s.exercises.some((x) => x.exercise === slug && x.sets.some((y) => y.loadKg > 0)));
  const livS = livelloVociP === undefined ? undefined : livelloVociP(stessi);
  const salita = salitaConsentita(slug, L.level, storia, date, draft);
  const evs = exercises.map((logged) => evaluateProgression({ block: v.block, exercise: ex, state: L, logged, range: resolveBlockRange(v.block, ex, tests), week: draft.week, currentMaxReps: v.pattern === null ? null : (tests.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null), salita, rientro: null, aumentoRecente: ar, caricoMassimoSeduta: o.caricoSeduta ?? kgMax(stessi), livelloMassimoSeduta: livS, pesoScrittoPrima, ...(o.durataCon === undefined ? {} : { durataCon: o.durataCon }) } as Parameters<typeof evaluateProgression>[0]));
  const rif = recenteRif(aumentiRif(slug, decF, storia, draft), date);
  return { evs, ev: evs[0]!, draft, ar, rif, livS, livR: livRif(stessi), pesoScrittoPrima };
}
function fs(slug: ExerciseSlug, L: ExerciseState, valori: number[], date: string, storia: LoggedSession[], dec: DecisioneRegistrata[], o: OpzFs = {}) {
  return fsN(slug, L, [{ livello: o.livello, kg: o.kg, valori, tempo: o.tempo }], date, storia, dec, o);
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
  caso('10.4', 'v:aggiungi-peso', rev(4, cu(), st(CU, null, 12, ESA_CU.e, ESA_CU.p)), (t) => /Passa al manubrio da 14 kg: oggi usi 12 kg\. Tempo e pausa tornano a quelli della scheda\. Nel player il peso parte da 12 kg: quando prendi quello da 14 kg, scrivilo in ogni serie\. Da lì in poi comanda quello che scrivi\./.test(t));
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
    rigaF(x.ev.suggestion === null && /giovedì 26 marzo \(carico 0 → 2,5 kg, scelta del lunedì 23 marzo\)/.test(x.ev.blockedReason ?? '') && /dal giovedì 2 aprile/.test(x.ev.blockedReason ?? ''), '15.5', `fine seduta 03-26 a 2,5 kg → ${leva(x.ev)} · «${String(x.ev.blockedReason)}»`); }
  /* 15.6 e 15.7 cadono in settimana 5: con D-21 (a) vale E4 (posto 5 dell'ordine dei motivi, prima di R13).
     Restano come righe di D-21; il controllo delle date di R13 si rifà spostato di 5 settimane (W8-W10). */
  { const x = fs(TR, ESA(2.5), [8, 8, 8], '2026-03-30', storia3, [acc23], { tests: T12 });
    rigaF(x.ev.suggestion === null && x.ev.blockedReason === TESTO_D21 && arDal(x.ar) === '2026-04-06', '15.6w5', `13.4 in W5 (D-21): fine seduta 03-30 → ${leva(x.ev)} · «${String(x.ev.blockedReason)}» · R13 sotto: dal ${String(arDal(x.ar))}`); }
  { const x = fs(TR, ESA(2.5), [8, 8, 8], '2026-04-02', [...storia3, S('g26', '2026-03-26', TR, 6, [8, 8, 8], { kg: 2.5 })], [acc23], { tests: T12 });
    rigaF(x.ev.suggestion === null && x.ev.blockedReason === TESTO_D21, '15.7w5', `13.4 riscritta in W5 (D-21): fine seduta 04-02 → ${leva(x.ev)} · «${String(x.ev.blockedReason)}»`); }
  { const sp = (x: string): string => piu(x, 35);
    const storiaS = [preT, S('w7', sp('2026-03-12'), TR, 6, [8, 8, 8]), S('w8', sp('2026-03-19'), TR, 6, [8, 8, 8])];
    const r88 = rev(8, storiaS, ESA(), [], sp('2026-03-23'), T12);
    const accS = R(sp('2026-03-23'), ESA(), ESA(2.5), 'accepted', 'revisione-8:trazioni');
    const a = fs(TR, ESA(2.5), [8, 8, 8], sp('2026-03-26'), storiaS, [accS], { tests: T12 });
    const b = fs(TR, ESA(2.5), [8, 8, 8], sp('2026-03-30'), storiaS, [accS], { tests: T12 });
    const c = fs(TR, ESA(2.5), [8, 8, 8], sp('2026-04-02'), [...storiaS, S('g30', sp('2026-03-26'), TR, 6, [8, 8, 8], { kg: 2.5 })], [accS], { tests: T12 });
    rigaF(r88.e.cat === 'v:aggiungi-peso', '15.5s', `revisione W8 del ${sp('2026-03-23')} → ${r88.e.cat} ${r88.e.dopo ?? ''}`);
    rigaF(a.ev.suggestion === null && /giovedì 30 aprile \(carico 0 → 2,5 kg, scelta del lunedì 27 aprile\)/.test(a.ev.blockedReason ?? '') && /dal giovedì 7 maggio/.test(a.ev.blockedReason ?? ''), '15.5+5', `fine seduta ${sp('2026-03-26')} a 2,5 → ${leva(a.ev)} · «${String(a.ev.blockedReason)}»`);
    rigaF(b.ev.suggestion === null && /l’ultimo è del lunedì 4 maggio/.test(b.ev.blockedReason ?? '') && /dal lunedì 11 maggio/.test(b.ev.blockedReason ?? ''), '15.6+5', `fine seduta ${sp('2026-03-30')} (prima seduta che esegue) → ${leva(b.ev)} · «${String(b.ev.blockedReason)}»`);
    rigaF(c.ev.suggestion?.lever === 'load' && c.ev.suggestion.nextState.loadKg === 5, '15.7+5', `chiusa il ${sp('2026-03-26')} a 2,5, fine seduta ${sp('2026-04-02')} → ${leva(c.ev)} · «${String(c.ev.blockedReason)}»`); }
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
    rigaF(x.ev.suggestion === null && /giovedì 19 marzo/.test(x.ev.blockedReason ?? '') && /dal giovedì 26 marzo/.test(x.ev.blockedReason ?? ''), '13.8', `push-up tempo accettato 03-16, giovedì 19-19-19 → ${leva(x.ev)} · «${String(x.ev.blockedReason)}»`); }
  caso('13.9', 'v:scendi-di-livello', rev(3, [S('pre', '2026-02-23', PU, 2, [1]), S('s', '2026-03-17', PU, 2, [19, 19, 19]), S('b', '2026-03-18', PU, 3, [9, 9, 9]), S('a', '2026-03-19', PU, 3, [9, 9, 9])], st(PU, 3), [R('2026-03-17', st(PU, 2), st(PU, 3), 'accepted', 's')], '2026-03-23'));
  const s1310 = [preT, S('z', '2026-03-17', TR, 6, [8, 8, 8]), S('b', '2026-03-24', TR, 6, [8, 8, 8], { kg: 2.5 }), S('a', '2026-03-26', TR, 6, [8, 8, 8], { kg: 2.5 })];
  caso('13.10', 'fermi:sette-giorni', rev(4, s1310, ESA(2.5), [], '2026-03-30', T12), (t) => /martedì 31 marzo/.test(t));
  caso('13.11', 'v:aggiungi-peso', rev(4, s1310, ESA(2.5), [], '2026-03-31', T12));
}

/* ===================================================== R15 (T-13) ===== */
console.log('--- R15 (curl a martello: stato {12, +2, +2}, scelta di lunedì 23 «al massimo 14,5», ultima chiusa giovedì 19 a 12) ---');
const auStr = (xs: readonly { date: string; cosa: string }[]): string => xs.map((x) => `${x.date} «${x.cosa}»`).join(' · ') || 'nessuno';
const AUM = (P as Record<string, unknown>)['aumenti'] as ((s: ExerciseSlug, d: readonly DecisioneRegistrata[], x: readonly LoggedSession[], c?: LoggedSession | null) => { date: string; cosa: string }[]) | undefined;
const aum = (slug: ExerciseSlug, dec: DecisioneRegistrata[], ses: LoggedSession[], c: LoggedSession | null = null) => (AUM === undefined ? [] : AUM(slug, dec, ses, c));
type ARx = { date: string; cosa: string; dal: string } | null;
{
  const pre = S('pre', '2026-02-23', CU, null, [1], { kg: 12 });
  const g19 = S('g19', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 });
  const c = R('2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14.5), 'accepted', 'revisione-3:curl');
  const con26 = (kg: number) => [pre, g19, S('g26', '2026-03-26', CU, null, [8, 8, 8], { kg })];
  const riga = (id: string, ses: LoggedSession[], dec: DecisioneRegistrata[], oggi: string, attese: [string, RegExp][], dal: string | null) => {
    const xs = aum(CU, dec, ses); const ar = aumentoRecente(CU, dec, ses, oggi) as ARx;
    const rif = recenteRif(aumentiRif(CU, dec, ses), oggi);
    const ok = xs.length === attese.length && attese.every(([d, re]) => xs.some((x) => x.date === d && re.test(x.cosa))) && (ar?.dal ?? null) === dal && (rif === undefined ? null : piu(rif.date, 7)) === dal;
    rigaF(ok, id, `aumenti: ${auStr(xs)} · R13 oggi ${oggi}: ${ar === null ? 'nessuno' : `dal ${ar.dal}`} · riferimento: ${rif === undefined ? 'nessuno' : `dal ${piu(rif.date, 7)}`} (atteso ${String(dal)})`);
  };
  riga('15.1', con26(14), [c], '2026-03-31', [['2026-03-26', /^carico 12 → 14 kg, scelta del lunedì 23 marzo$/]], '2026-04-02');
  riga('15.2', con26(14.5), [c], '2026-03-31', [['2026-03-26', /^carico 12 → 14,5 kg, scelta del lunedì 23 marzo$/]], '2026-04-02');
  riga('15.3', con26(16), [c], '2026-03-31', [['2026-03-23', /^manubrio successivo scelto, al massimo 14,5 kg$/], ['2026-03-26', /^peso scritto da te, 12 → 16 kg$/]], '2026-04-02');
  /* 15.4 = L19 (Q2 di `14`), D-20 b: l'eccentrica scelta nel riepilogo del 16 conta dalla prima seduta dopo, il 19 */
  { const st2 = [S('pre', '2026-02-23', TR, 6, [1], { kg: 2.5 }), S('p', '2026-03-16', TR, 6, [8, 8, 8], { kg: 0 }), S('q', '2026-03-19', TR, 6, [8, 8, 8], { kg: 2.5 })];
    const tempoRec = R('2026-03-16', st(TR, 6, 2.5, 1, 2), st(TR, 6, 2.5, 2, 2), 'accepted', 'p');
    const xs = aum(TR, [tempoRec], st2); const ar = aumentoRecente(TR, [tempoRec], st2, '2026-03-24') as ARx; const rif = recenteRif(aumentiRif(TR, [tempoRec], st2), '2026-03-24');
    const ok = xs.some((x) => x.date === '2026-03-19' && /^peso scritto da te, 0 → 2,5 kg$/.test(x.cosa)) && xs.some((x) => /eccentrica/.test(x.cosa) && x.date === '2026-03-19') && ar?.dal === '2026-03-26' && rif !== undefined && piu(rif.date, 7) === '2026-03-26';
    rigaF(ok, '15.4', `Q2/L19: aumenti ${auStr(xs)} · il 03-24 R13 ${ar === null ? 'nessuno' : `dal ${ar.dal}`} (atteso dal 26; riferimento ${rif === undefined ? '-' : piu(rif.date, 7)})`); }
  /* 15.8-15.9 gradino */
  { const preP = S('pre', '2026-02-23', PU, 2, [1]); const p19 = S('p19', '2026-03-19', PU, 2, [18, 18, 18]);
    const cl = R('2026-03-23', st(PU, 2), st(PU, 3), 'accepted', 'revisione-3:push-up');
    const x8 = aum(PU, [cl], [preP, p19, S('p26', '2026-03-26', PU, 3, [12, 12, 12])]);
    rigaF(x8.length === 1 && x8[0]!.date === '2026-03-26' && /^livello 2 → 3, scelta del lunedì 23 marzo$/.test(x8[0]!.cosa), '15.8', `aumenti: ${auStr(x8)}`);
    const x9 = aum(PU, [cl], [preP, p19, S('p26', '2026-03-26', PU, 4, [12, 12, 12])]);
    rigaF(x9.length === 2 && x9.some((x) => x.date === '2026-03-23' && /^livello 2 → 3$/.test(x.cosa)) && x9.some((x) => x.date === '2026-03-26' && /^livello scritto da te, 2 → 4$/.test(x.cosa)), '15.9', `aumenti: ${auStr(x9)}`); }
  /* 15.10 scelta nel riepilogo della seduta X del 19 */
  { const cx = R('2026-03-19', st(CU, null, 12, 2, 2), st(CU, null, 14.5), 'accepted', 'g19');
    const xs = aum(CU, [cx], [pre, g19, S('g23', '2026-03-23', CU, null, [8, 8, 8], { kg: 14 })]);
    rigaF(xs.length === 1 && xs[0]!.date === '2026-03-23' && /scelta del giovedì 19 marzo/.test(xs[0]!.cosa), '15.10', `aumenti: ${auStr(xs)}`); }
  /* 15.11 revisione accettata la sera del 23, seduta del mattino chiusa a 12 */
  { const xs = aum(CU, [c], [pre, g19, S('m23', '2026-03-23', CU, null, [10, 10, 10], { kg: 12 }), S('g26', '2026-03-26', CU, null, [8, 8, 8], { kg: 14 })]);
    rigaF(xs.length === 1 && xs[0]!.date === '2026-03-26' && /^carico 12 → 14 kg/.test(xs[0]!.cosa), '15.11', `aumenti: ${auStr(xs)}`); }
  riga('15.13', [pre, g19], [c], '2026-03-27', [['2026-03-23', /^manubrio successivo scelto, al massimo 14,5 kg$/]], '2026-03-30');
  riga('15.14', [pre, g19, S('z24', '2026-03-24', CU, null, [8, 8, 8], { kg: 0 }), S('g26', '2026-03-26', CU, null, [8, 8, 8], { kg: 14 })], [c], '2026-03-31', [['2026-03-26', /^carico 12 → 14 kg, scelta del lunedì 23 marzo$/]], '2026-04-02');
  riga('15.15', con26(14), [R('2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14.5), 'postponed', 'revisione-3:curl')], '2026-03-31', [['2026-03-26', /^peso scritto da te, 12 → 14 kg$/]], '2026-04-02');
  rigaF(true, '15.12', 'NON COPERTO: serve il record `lapsed` (rilascio B)');
}

/* ===================================================== R16 (T-11) ===== */
console.log('--- R16 (push-up al 2, 12-18; scarico in W6) ---');
{
  const pre = S('pre', '2026-02-23', PU, 2, [1]);
  const r1 = rev(6, [pre, S('b', '2026-04-06', PU, 2, [18, 18], { week: 6 }), S('a', '2026-04-09', PU, 2, [18, 18], { week: 6 }), S('n', '2026-04-13', PU, 2, [18, 18, 18], { week: 7 })], st(PU, 2), [], '2026-04-13');
  caso('16.1', 'fermi:scarico', r1, (t) => t.includes('«Le due sedute lette sono di scarico (lunedì 6 aprile e giovedì 9 aprile): niente aumenti da quei numeri. Si riprende con due sedute piene. Rifatto lunedì 13 aprile: 18-18-18.»'));
  const r2 = rev(6, [pre, S('b', '2026-04-02', PU, 2, [18, 18, 18], { week: 5 }), S('a', '2026-04-06', PU, 2, [18, 18], { week: 6 }), S('n', '2026-04-13', PU, 2, [18, 18, 18], { week: 7 })], st(PU, 2), [], '2026-04-13');
  caso('16.2', 'fermi:scarico-coppia', r2, (t) => /Una delle due sedute lette è di scarico \(lunedì 6 aprile\): niente aumenti da quei numeri\. Si riprende con due sedute piene\. Rifatto lunedì 13 aprile: 18-18-18\.»/.test(t));
  caso('16.3', 'rimandati:smentito', rev(6, [pre, S('b', '2026-04-06', PU, 2, [18, 18], { week: 6 }), S('a', '2026-04-09', PU, 2, [18, 18], { week: 6 }), S('n', '2026-04-13', PU, 2, [17, 16, 16], { week: 7 })], st(PU, 2), [], '2026-04-13'));
  rigaF(true, '16.4', 'NON COSTRUIBILE: E⁺ contiene i valori della coppia, quindi «tutte sopra il massimo» in E⁺ implica lo stesso in E, e con un gradino sopra E è già lo scavalco. Coperto in generale da A (famiglie) e da B R11');
  caso('16.5', 'fermi:scarico', rev(5, [pre, S('b', '2026-03-30', PU, 2, [18, 18, 18]), S('a', '2026-04-02', PU, 2, [18, 18, 18]), S('n', '2026-04-06', PU, 2, [18, 18], { week: 6 })], st(PU, 2), [], '2026-04-06'), (t) => t.includes('Settimana di scarico: niente aumenti, anche con il massimo chiuso. Si riprende dopo lo scarico. Rifatto lunedì 6 aprile: 18-18.'));
  const preT = S('pre', '2026-02-23', TR, 6, [1]);
  caso('16.6', 'fermi:sette-giorni', rev(4, [preT, S('z', '2026-03-17', TR, 6, [8, 8, 8]), S('b', '2026-03-24', TR, 6, [8, 8, 8], { kg: 2.5 }), S('a', '2026-03-26', TR, 6, [8, 8, 8], { kg: 2.5 }), S('n', '2026-03-30', TR, 6, [8, 8, 8], { kg: 2.5 })], st(TR, 6, 2.5, 2, 2), [], '2026-03-30', T12), (t) => /martedì 31 marzo.*Rifatto lunedì 30 marzo: 8-8-8\./.test(t));
}

/* ===================================================== R17 (T-12) ===== */
console.log('--- R17 ---');
{
  const po = [S('b', '2026-03-19', PO, null, [15, 15, 15])];
  const x1 = fs(PO, st(PO, null, 0, 2, 2), [15, 15, 15], '2026-03-26', po, [R('2026-03-20', st(PO, null, 0, 2, 1), st(PO, null, 0, 2, 2))]);
  rigaF(x1.ev.suggestion === null && /^Hai esaurito tutte le leve disponibili su questo esercizio/.test(x1.ev.blockedReason ?? ''), '17.1', `L21: pull-over esaurito, pausa accettata il 20 → «${String(x1.ev.blockedReason)}»`);
  /* 17.2 (appendice §3, T-20): curl, pausa accettata nel riepilogo di lunedì 23 (record con il sessionLogId della seduta
     del 23), giovedì 26 in corso, massimo chiuso, tempo sì, eccentrica ancora disponibile. R13 dal registro. */
  { const g23 = S('g23', '2026-03-23', CU, null, [10, 10, 10], { kg: 12 });
    const x2 = fs(CU, st(CU, null, 12, 1, 1), [10, 10, 10], '2026-03-26', [S('pre', '2026-02-23', CU, null, [1], { kg: 12 }), S('g19', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 }), g23], [R('2026-03-23', st(CU, null, 12, 1, 0), st(CU, null, 12, 1, 1), 'accepted', 'g23')]);
    rigaF(x2.ev.suggestion === null && x2.ev.blockedReason === 'Un aumento per esercizio ogni 7 giorni: l’ultimo è del giovedì 26 marzo (pausa +1"). Il prossimo si può proporre dal giovedì 2 aprile: oggi resta tutto com’è.', '17.2', `curl, pausa accettata il 23 (seduta g23), fine seduta 26 → ${leva(x2.ev)} · «${String(x2.ev.blockedReason)}»`); }
  /* 17.3-17.4: push-up 2-0-1-0, tempo e pausa esauriti {2, +3, +2}; pausa scelta nel riepilogo del 20, prima seduta dopo il 23 → R13 dal 30 */
  const L = st(PU, 2, 0, 3, 2);
  const pausa20 = R('2026-03-20', st(PU, 2, 0, 3, 1), L, 'accepted', 'x20');
  const x3 = fs(PU, L, [18, 18, 18], '2026-03-26', [S('a', '2026-03-10', PU, 1, [18, 18, 18]), S('b', '2026-03-14', PU, 2, [18, 18, 18]), S('x20', '2026-03-20', PU, 2, [18, 18, 18]), S('c', '2026-03-23', PU, 2, [18, 18, 18])], [pausa20]);
  rigaF(x3.ev.suggestion === null && /Un aumento per esercizio ogni 7 giorni/.test(x3.ev.blockedReason ?? '') && /dal lunedì 30 marzo/.test(x3.ev.blockedReason ?? ''), '17.3', `R7 dal 28, R13 dal 30 → «${String(x3.ev.blockedReason)}»`);
  const x4 = fs(PU, L, [18, 18, 18], '2026-03-26', [S('a', '2026-03-10', PU, 1, [18, 18, 18]), S('b', '2026-03-19', PU, 2, [18, 18, 18]), S('x20', '2026-03-20', PU, 2, [18, 18, 18]), S('c', '2026-03-23', PU, 2, [18, 18, 18])], [pausa20]);
  rigaF(x4.ev.suggestion === null && !/7 giorni/.test(x4.ev.blockedReason ?? '') && /giovedì 2 aprile/.test(x4.ev.blockedReason ?? ''), '17.4', `R7 dal 2 aprile, R13 dal 30 → «${String(x4.ev.blockedReason)}»`);
  /* 17.5-17.6 revisione R10a (1): trazioni al 4, 9-9-9 sopra il massimo; zavorra scritta 0 → 2,5 il 18 (R13 dal 25) */
  const tr4 = (inizio: string) => [S('l3', '2026-03-02', TR, 3, [8, 8, 8]), S('i', inizio, TR, 4, [9, 9, 9]), S('b', '2026-03-18', TR, 4, [9, 9, 9], { kg: 2.5 }), S('a', '2026-03-20', TR, 4, [9, 9, 9], { kg: 2.5 })];
  caso('17.5', 'fermi:sette-giorni', rev(3, tr4('2026-03-10'), st(TR, 4, 2.5), [], '2026-03-23', T12), (t) => /mercoledì 25 marzo/.test(t));
  caso('17.6', 'inAttesa', rev(3, tr4('2026-03-12'), st(TR, 4, 2.5), [], '2026-03-23', T12));
  /* 17.7 alMassimo variante, R7 libero, R13 dalla pausa scelta il 23 ed eseguita il 24 → dal 31 */
  caso('17.7', 'alMassimo:variante', rev(4, [S('p', '2026-03-02', PU, 2, [18, 18, 18]), S('b', '2026-03-24', PU, 2, [18, 18, 18]), S('a', '2026-03-26', PU, 2, [18, 18, 18])], L, [R('2026-03-23', st(PU, 2, 0, 3, 1), L, 'accepted', 'revisione-3:push-up')], '2026-03-30'), (t) => t.includes('Un aumento per esercizio ogni 7 giorni: si può proporre dal martedì 31 marzo.'));
  /* 17.8 alMassimo tempo con R13 (zavorra scritta 0 → 2,5 il 24) */
  caso('17.8', 'alMassimo:tempo', rev(4, [S('p', '2026-03-12', TR, 6, [8, 8, 8]), S('b', '2026-03-24', TR, 6, [8, 8, 8], { kg: 2.5 }), S('a', '2026-03-26', TR, 6, [8, 8, 8], { kg: 2.5 })], st(TR, 6, 2.5), [], '2026-03-30', T12), (t) => t.includes('Un aumento per esercizio ogni 7 giorni: non prima del martedì 31 marzo.'));
  const x9 = fs(TR, st(TR, 6, 0, 2, 2), [8, 8, 8], '2026-03-12', [S('pre', '2026-02-23', TR, 6, [1])], [], { tests: T12 });
  rigaF(x9.ev.suggestion === null && !/esaurito tutte le leve/.test(x9.ev.blockedReason ?? '') && /settimana/i.test(x9.ev.blockedReason ?? ''), '17.9', `settimana 2, trazioni al 6 esaurite → «${String(x9.ev.blockedReason)}»`);
  const x10 = fs(PO, st(PO, null, 0, 2, 2), [15, 15, 15], '2026-03-26', [S('b', '2026-03-12', PO, null, [15, 15, 15])], []);
  rigaF(x10.ev.suggestion === null && /^Hai esaurito tutte le leve/.test(x10.ev.blockedReason ?? ''), '17.10', `«${String(x10.ev.blockedReason)}»`);
}

/* ===================================================== R14b (T-14) ==== */
console.log('--- R14b ---');
const salva = (draft: LoggedSession, L: ExerciseState): ExerciseState => statesToSave(syncStatesFromLog({ ...draft, status: 'completed' }, new Map([[L.exercise, L]])), new Map())[0] ?? L;
{
  const preC = S('pre', '2026-02-23', CU, null, [1], { kg: 12 }); const c19 = S('g19', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 });
  const fr = (ev: ReturnType<typeof evaluateProgression>): string => String((ev as unknown as Record<string, unknown>)['fuoriStato'] ?? 'assente');
  const b1 = fs(CU, st(CU, null, 12, 2, 2), [10, 10, 10], '2026-03-26', [preC, c19], [], { kg: 10 });
  rigaF(b1.ev.suggestion === null && b1.ev.blockedReason === 'Oggi hai usato 10 kg e lo stato era 12 kg: da qui comanda quello che hai scritto, e tempo e pausa tornano a quelli della scheda. Il prossimo passo si valuta dalla prossima seduta a 10 kg.' && sintesi(salva(b1.draft, st(CU, null, 12, 2, 2))) === sintesi(st(CU, null, 10)), 'b.1', `→ ${leva(b1.ev)} (${fr(b1.ev)}) «${String(b1.ev.blockedReason)}» · chiusura ${sintesi(salva(b1.draft, st(CU, null, 12, 2, 2)))}`);
  const preT = S('pre', '2026-02-23', TR, 6, [1], { kg: 2.5 }); const t19 = S('t19', '2026-03-19', TR, 6, [8, 8, 8], { kg: 2.5 });
  const b2 = fs(TR, st(TR, 6, 2.5), [8, 8, 8], '2026-03-26', [preT, t19], [], { kg: 0, tests: T12 });
  rigaF(b2.ev.suggestion === null && /^Oggi hai usato 0 kg e lo stato era 2,5 kg: da qui comanda quello che hai scritto\. Il prossimo passo si valuta dalla prossima seduta a 0 kg\.$/.test(b2.ev.blockedReason ?? '') && salva(b2.draft, st(TR, 6, 2.5)).loadKg === 0, 'b.2', `→ ${leva(b2.ev)} «${String(b2.ev.blockedReason)}» · chiusura ${sintesi(salva(b2.draft, st(TR, 6, 2.5)))}`);
  const b3 = fs(CU, st(CU, null, 12), [10, 10, 10], '2026-03-26', [preC, c19], [], { kg: 14 });
  rigaF(b3.ev.suggestion === null && /peso scritto da te, 12 → 14 kg/.test(b3.ev.blockedReason ?? '') && fr(b3.ev) !== 'r14b', 'b.3', `→ ${leva(b3.ev)} (${fr(b3.ev)}) «${String(b3.ev.blockedReason)}»`);
  const b4 = fs(CU, st(CU, null, 12), [10, 10, 10], '2026-03-26', [preC, c19], [], { kg: 12 });
  rigaF(b4.ev.suggestion?.lever === 'tempo', 'b.4', `allo stato → ${leva(b4.ev)}`);
  const preP = S('pre', '2026-02-23', PU, 3, [1]);
  const b5 = fs(PU, st(PU, 3), [18, 18, 18], '2026-03-26', [preP, S('p19', '2026-03-19', PU, 3, [12, 12, 12])], [], { livello: 2 });
  rigaF(b5.ev.suggestion === null && b5.ev.blockedReason === 'Oggi hai fatto il livello 2 e lo stato era il 3: da qui comanda quello che hai scritto. Il prossimo passo si valuta dalla prossima seduta al livello 2.', 'b.5', `→ ${leva(b5.ev)} «${String(b5.ev.blockedReason)}»`);
  /* b.6: lo stesso esercizio in due blocchi (nel circuito non succede: fixture con un blocco fittizio) */
  const b6a = fs(CU, st(CU, null, 12), [10, 10, 10], '2026-03-26', [preC, c19], [], { kg: 10, caricoSeduta: 12 });
  const b6b = fs(CU, st(CU, null, 12), [10, 10, 10], '2026-03-26', [preC, c19], [], { kg: 12, caricoSeduta: 12 });
  const due: LoggedSession = { ...b6b.draft, exercises: [{ ...b6b.draft.exercises[0]! }, { ...b6a.draft.exercises[0]!, blockCode: 'B1bis' }] };
  const dopo6 = salva(due, st(CU, null, 12));
  rigaF(b6a.ev.suggestion === null && b6a.ev.blockedReason === 'In questo blocco hai usato 10 kg invece di 12 kg: le leve si valutano solo sulle serie fatte allo stato, che resta 12 kg.' && b6b.ev.suggestion?.lever === 'tempo' && dopo6.loadKg === 12, 'b.6', `blocco a 10 → «${String(b6a.ev.blockedReason)}» · blocco a 12 → ${leva(b6b.ev)} · chiusura (12 poi 10) ${sintesi(dopo6)}`);
  const b7 = fs(CU, st(CU, null, 0), [10, 10, 10], '2026-03-26', [S('z', '2026-03-19', CU, null, [10, 10, 10], { kg: 0 })], [], { kg: 0 });
  rigaF(b7.ev.suggestion?.lever === 'tempo', 'b.7', `inherent, stato 0, voce 0 → ${leva(b7.ev)}`);
  const b8 = fs(CU, st(CU, null, 12, 2, 2), [10, 10, 10], '2026-03-26', [preC, c19], [], { kg: 0 });
  console.log(`F NC      b.8    R14e (rilascio B). Oggi: → ${leva(b8.ev)} «${String(b8.ev.blockedReason)}» · chiusura ${sintesi(salva(b8.draft, st(CU, null, 12, 2, 2)))} (L2 aperto)`);
  const PK = 'pike-pushup-piedi-rialzati' as ExerciseSlug;
  const b9a = fs(PK, st(PK, 2), [8, 8, 8], '2026-03-26', [S('pre', '2026-02-23', PK, 2, [1]), S('k19', '2026-03-19', PK, 2, [8, 8, 8])], [], { kg: 5 });
  const b9b = fs(PK, st(PK, 2), [8, 8, 8], '2026-03-26', [S('pre', '2026-02-23', PK, 2, [1]), S('k19', '2026-03-19', PK, 2, [8, 8, 8])], [], { kg: 0, livello: 1 });
  rigaF(b9a.ev.suggestion !== null && b9b.ev.suggestion === null && /livello 1 e lo stato era il 2/.test(b9b.ev.blockedReason ?? ''), 'b.9', `forbidden, 5 kg scritti al gradino dello stato → ${leva(b9a.ev)} · gradino 1 → «${String(b9b.ev.blockedReason)}»`);
  const b10 = fs(TR, st(TR, 6, 2.5, 1, 2), [8, 8, 8], '2026-03-16', [S('pre', '2026-02-23', TR, 6, [1], { kg: 2.5 })], [], { kg: 0, tests: T12 });
  rigaF(b10.ev.suggestion === null, 'b.10', `ingresso di L19, il 16 a 0 kg con lo stato a 2,5 → ${leva(b10.ev)} «${String(b10.ev.blockedReason)}»`);
  /* Caso della sessione principale: prima seduta su un manubrio, stato iniziale a 0 kg (initialExerciseState) */
  const p1 = fs(CU, st(CU, null, 0), [10, 10, 10], '2026-03-05', [], [], { kg: 10 });
  console.log(`F INFO    b.P1   prima seduta curl a 10 kg, stato 0 kg → ${leva(p1.ev)} «${String(p1.ev.blockedReason)}» · chiusura ${sintesi(salva(p1.draft, st(CU, null, 0)))}`);
  const MO = 'goblet-squat' as ExerciseSlug;
  const p2 = fs(MO, st(MO, null, 0), [18, 18, 18], '2026-03-05', [], [], { kg: 16 });
  console.log(`F INFO    b.P2   prima seduta goblet a 16 kg, stato 0 kg → ${leva(p2.ev)} «${String(p2.ev.blockedReason)}»`);
}

/* =========================================================== B1 ======= */
/* Righe dell'appendice 2026-11-20 e delle decisioni D-21 (a), D-23 (a). Attesi scritti dal testo, non dal codice. */
const salvaN = (draft: LoggedSession, L: ExerciseState): ExerciseState => statesToSave(syncStatesFromLog({ ...draft, status: 'completed' }, new Map([[L.exercise, L]])), new Map())[0] ?? L;
const BU = 'bulgarian-split-squat' as ExerciseSlug;
console.log('--- L23 (T-17): una data dopo oggi non sparisce ---');
{
  /* 15.16, date originali (mondo 668): W2, revisione aperta domenica 22; coppia in W2 al gradino 6; salita 5 → 6
     accettata venerdì 20; una seduta chiusa porta la data lunedì 23, al 6. Tempo e pausa esauriti come nel mondo 668
     (e2 p1): senza L23 la revisione arriva al carico. */
  const Lb = st(BU, 6, 0, 2, 1);
  const salita = R('2026-03-20', st(BU, 5, 0, 2, 1), Lb, 'accepted', 's20');
  const coppia = [S('b09', '2026-03-09', BU, 6, [10, 10, 10]), S('b12', '2026-03-12', BU, 6, [10, 10, 10])];
  const futura = S('b23', '2026-03-23', BU, 6, [10, 10, 10]);
  caso('15.16', 'fermi:sette-giorni', rev(2, [...coppia, futura], Lb, [salita], '2026-03-22'), (t) => /lunedì 23 marzo \(livello 5 → 6, scelta del venerdì 20 marzo\)/.test(t) && /dal lunedì 30 marzo/.test(t));
  const xs = aum(BU, [salita], [...coppia, futura]); const ar = aumentoRecente(BU, [salita], [...coppia, futura], '2026-03-22');
  rigaF(xs.some((a) => a.date === '2026-03-23' && /^livello 5 → 6, scelta del venerdì 20 marzo$/.test(a.cosa)) && arDal(ar) === '2026-03-30', '15.16a', `aumenti: ${auStr(xs)} · R13 il 22: dal ${String(arDal(ar))}`);
  /* 15.16′: le date della prova della sessione principale (W3, revisione lunedì 23, seduta che esegue martedì 24) */
  const coppia3 = [S('b16', '2026-03-16', BU, 6, [10, 10, 10]), S('b19', '2026-03-19', BU, 6, [10, 10, 10])];
  caso('15.16′', 'fermi:sette-giorni', rev(3, [...coppia3, S('b24', '2026-03-24', BU, 6, [10, 10, 10])], Lb, [salita], '2026-03-23'), (t) => /martedì 24 marzo \(livello 5 → 6, scelta del venerdì 20 marzo\)/.test(t) && /dal martedì 31 marzo/.test(t));
  /* 15.17, 15.18 */
  const pre = S('pre', '2026-02-23', CU, null, [1], { kg: 12 }); const g19 = S('g19', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 });
  const riga2 = (id: string, ses: LoggedSession[], dec: DecisioneRegistrata[], oggi: string, attese: [string, RegExp][], dal: string): void => {
    const ys = aum(CU, dec, ses); const a = aumentoRecente(CU, dec, ses, oggi); const rif = recenteRif(aumentiRif(CU, dec, ses), oggi);
    const ok = attese.every(([dd, re]) => ys.some((y) => y.date === dd && re.test(y.cosa))) && arDal(a) === dal && rif !== undefined && piu(rif.date, 7) === dal;
    rigaF(ok, id, `aumenti: ${auStr(ys)} · R13 oggi ${oggi}: dal ${String(arDal(a))} · riferimento ${rif === undefined ? '-' : piu(rif.date, 7)} (atteso ${dal})`);
  };
  riga2('15.17', [pre, g19, S('g23', '2026-03-23', CU, null, [10, 10, 10], { kg: 14 })], [], '2026-03-22', [['2026-03-23', /^peso scritto da te, 12 → 14 kg$/]], '2026-03-30');
  riga2('15.18', [pre, g19], [R('2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14.5), 'accepted', 'revisione-3:curl')], '2026-03-22', [['2026-03-23', /^manubrio successivo scelto, al massimo 14,5 kg$/]], '2026-03-30');
}

console.log('--- L24 (T-18): il gradino della seduta è il più alto; R14b su voce e seduta ---');
{
  const prePU = S('pre', '2026-02-23', PU, 2, [1]); const p19 = S('p19', '2026-03-19', PU, 2, [18, 18, 18]);
  const L241 = st(PU, 2, 0, 1, 0);
  const X: VoceBozza = { code: 'A2', livello: 2, valori: [18, 18, 18] }; const Y: VoceBozza = { code: 'A2bis', livello: 3, valori: [10, 10, 10] };
  for (const [id, voci] of [['24.1', [X, Y]], ['24.2', [Y, X]]] as const) {
    const x = fsN(PU, L241, [...voci], '2026-03-26', [prePU, p19], []);
    const iX = voci.indexOf(X); const chiusura = salvaN(x.draft, L241);
    const ok = x.livS === 3 && x.livR === 3 && x.evs.every((e) => e.suggestion === null) && /livello scritto da te, 2 → 3/.test(x.evs[iX]!.blockedReason ?? '') && /giovedì 26 marzo/.test(x.evs[iX]!.blockedReason ?? '') && sintesi(chiusura) === sintesi(st(PU, 3));
    rigaF(ok, id, `v_livello codice ${String(x.livS)} riferimento ${String(x.livR)} · ${x.evs.map((e, i) => `${x.draft.exercises[i]!.blockCode} → ${leva(e)} «${String(e.blockedReason)}»`).join(' · ')} · chiusura ${sintesi(chiusura)} (D-23: liv 3 e0 p0)`);
  }
  const x3 = fsN(PU, st(PU, 3), [{ code: 'A2', livello: 3, valori: [18, 18, 18] }, { code: 'A2bis', livello: 2, valori: [19, 19, 19] }], '2026-03-26', [S('pre', '2026-02-23', PU, 3, [1]), S('p19', '2026-03-19', PU, 3, [12, 12, 12])], []);
  const c3 = salvaN(x3.draft, st(PU, 3));
  rigaF(x3.evs[0]!.suggestion?.lever === 'tempo' && x3.evs[1]!.suggestion === null && x3.evs[1]!.blockedReason === 'In questo blocco hai fatto il livello 2 invece del 3: le leve si valutano solo sulle serie fatte allo stato, che resta il livello 3.' && sintesi(c3) === sintesi(st(PU, 3)), '24.3', `X al 3 → ${leva(x3.evs[0]!)} · Y al 2 → «${String(x3.evs[1]!.blockedReason)}» · chiusura ${sintesi(c3)}`);
  const preC = S('pre', '2026-02-23', CU, null, [1], { kg: 12 }); const c19 = S('g19', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 });
  const x4 = fsN(CU, st(CU, null, 12), [{ code: 'B1', kg: 12, valori: [10, 10, 10] }, { code: 'B1bis', kg: 14, valori: [10, 10, 10] }], '2026-03-26', [preC, c19], []);
  const c4 = salvaN(x4.draft, st(CU, null, 12));
  rigaF(x4.evs.every((e) => e.suggestion === null && /peso scritto da te, 12 → 14 kg/.test(e.blockedReason ?? '')) && sintesi(c4) === sintesi(st(CU, null, 14)), '24.4', `${x4.evs.map((e) => `«${String(e.blockedReason)}»`).join(' · ')} · chiusura ${sintesi(c4)}`);
  const x5 = fsN(CU, st(CU, null, 0), [{ code: 'B1', kg: 10, valori: [10, 10, 10] }, { code: 'B1bis', kg: 0, valori: [10, 10, 10] }], '2026-03-05', [], []);
  const c5 = salvaN(x5.draft, st(CU, null, 0));
  rigaF(x5.evs.every((e) => e.suggestion === null && e.blockedReason === 'Primo peso scritto su questo esercizio: 10 kg. Da qui si parte: le leve si valutano dalla prossima seduta a 10 kg.') && sintesi(c5) === sintesi(st(CU, null, 10)), '24.5', `${x5.evs.map((e, i) => `voce ${String(i + 1)} → ${leva(e)} «${String(e.blockedReason)}»`).join(' · ')} · chiusura ${sintesi(c5)}`);
  /* 24.6 sui 4 circuiti: con una voce per esercizio, il gradino della seduta è quello della voce */
  let diversi = 0;
  for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) for (const lv of [1, 2, 3, 4, 5, 6, null] as (LevelIndex | null)[]) {
    const voce1: LoggedExercise = { blockCode: b.code, exercise: b.exercise, variantLabel: 'x', level: lv, tempoRespected: true, sets: [{ setIndex: 1, side: null, value: 8, rir: 1, loadKg: 0, heartRate: null, note: null }], note: null };
    if (livelloVociP !== undefined && livelloVociP([voce1]) !== livRif([voce1])) diversi += 1;
    if (livelloVociP !== undefined && livelloVociP([{ ...voce1, sets: [] }]) !== null) diversi += 1;
  }
  rigaF(livelloVociP !== undefined && diversi === 0, '24.6a', `una voce per blocco, 4 circuiti, gradini 1-6 e null: livelloVoci ≠ riferimento ${String(diversi)} (voce senza serie ⇒ null)`);
}

console.log('--- M21 (T-19): primo peso scritto ---');
{
  const M21 = (v: string, scheda: boolean): string => `Primo peso scritto su questo esercizio: ${v} kg. Da qui si parte${scheda ? ', con tempo e pausa della scheda' : ''}: le leve si valutano dalla prossima seduta a ${v} kg.`;
  const x1 = fs(CU, st(CU, null, 0), [10, 10, 10], '2026-03-05', [], [], { kg: 10 });
  const c1 = salvaN(x1.draft, st(CU, null, 0));
  rigaF(x1.ev.suggestion === null && x1.ev.blockedReason === M21('10', false) && sintesi(c1) === sintesi(st(CU, null, 10)), '21.1', `→ ${leva(x1.ev)} «${String(x1.ev.blockedReason)}» · chiusura ${sintesi(c1)}`);
  const z02 = S('z02', '2026-03-02', CU, null, [10, 10, 10], { kg: 0 }); const z05 = S('z05', '2026-03-05', CU, null, [10, 10, 10], { kg: 0 });
  const ecc = R('2026-03-02', st(CU, null, 0), st(CU, null, 0, 1, 0), 'accepted', 'z02');
  const x2 = fs(CU, st(CU, null, 0, 1, 0), [10, 10, 10], '2026-03-12', [z02, z05], [ecc], { kg: 10 });
  const c2 = salvaN(x2.draft, st(CU, null, 0, 1, 0));
  rigaF(x2.ev.suggestion === null && x2.ev.blockedReason === M21('10', true) && sintesi(c2) === sintesi(st(CU, null, 10)), '21.2', `→ ${leva(x2.ev)} «${String(x2.ev.blockedReason)}» · chiusura ${sintesi(c2)}`);
  const x3 = fs(CU, st(CU, null, 0), [10, 10, 10], '2026-03-09', [S('a', '2026-03-02', CU, null, [10, 10, 10], { kg: 12 }), S('b', '2026-03-05', CU, null, [10, 10, 10], { kg: 0 })], [], { kg: 12 });
  rigaF(x3.ev.suggestion === null && /^Oggi hai usato 12 kg e lo stato era 0 kg: da qui comanda quello che hai scritto/.test(x3.ev.blockedReason ?? ''), '21.3', `12, poi 0 (stato 0), poi 12 → «${String(x3.ev.blockedReason)}»`);
  const x4 = fs(TR, st(TR, 6), [8, 8, 8], '2026-03-26', [S('pre', '2026-02-23', TR, 6, [1]), S('t19', '2026-03-19', TR, 6, [8, 8, 8])], [], { kg: 2.5, tests: T12 });
  rigaF(x4.ev.suggestion === null && !/^Primo peso/.test(x4.ev.blockedReason ?? '') && /peso scritto da te, 0 → 2,5 kg/.test(x4.ev.blockedReason ?? ''), '21.4', `trazioni (allowed), stato 0, seduta a 2,5 → «${String(x4.ev.blockedReason)}»`);
  const x5 = fs(CU, st(CU, null, 10), [10, 10, 10], '2026-03-09', [{ ...x1.draft, status: 'completed' }], [], { kg: 10 });
  rigaF(x5.ev.suggestion?.lever === 'tempo', '21.5', `dopo 21.1, seduta a 10 → ${leva(x5.ev)}`);
}

console.log('--- 16.4′ (R16) ---');
{
  const w11 = S('w11', '2026-03-11', PU, 2, [18, 18, 18]); const w18 = S('w18', '2026-03-18', PU, 2, [18, 18, 18]);
  caso('16.4′', 'rimandati:smentito', rev(3, [w11, w18, S('l23', '2026-03-23', PU, 2, [18, 18, 17])], st(PU, 2), [], '2026-03-24'));
  caso('16.4′b', 'alMassimo:tempo', rev(3, [w11, w18], st(PU, 2), [], '2026-03-24'));
}

console.log('--- D-21 (a) (T-21): a fine seduta niente leve in salita nella settimana prima dello scarico ---');
{
  const L = st(PU, 2);
  const casi: [string, string, string | null][] = [
    ['21a.W4', '2026-03-26', null], ['21a.W5', '2026-03-30', TESTO_D21], ['21a.W5d', '2026-04-05', TESTO_D21], ['21a.W6', '2026-04-09', TESTO_E4], ['21a.W7', '2026-04-13', null],
    ['21a.W11', '2026-05-14', TESTO_D21], ['21a.W12', '2026-05-18', TESTO_E4], ['21a.W13', '2026-05-25', null], ['21a.W16', '2026-06-18', null], ['21a.W17', '2026-06-25', TESTO_D21], ['21a.W18', '2026-06-29', TESTO_E4],
  ];
  for (const [id, date, atteso] of casi) {
    const valori = SCARICO.has(settDi(date)) ? [18, 18] : [18, 18, 18];
    const x = fs(PU, L, valori, date, [S('prec', piu(date, -7), PU, 2, [18, 18, 18])], []);
    const ok = atteso === null ? x.ev.suggestion?.lever === 'tempo' : x.ev.suggestion === null && x.ev.blockedReason === atteso;
    rigaF(ok, id, `W${String(settDi(date))} ${date} push-up al 2 chiuso → ${leva(x.ev)} · «${String(x.ev.blockedReason)}»`);
  }
  const x = fs(PO, st(PO, null, 0, 2, 2), [15, 15, 15], '2026-04-02', [S('b', '2026-03-26', PO, null, [15, 15, 15])], []);
  rigaF(x.ev.suggestion === null && x.ev.blockedReason === TESTO_D21, '21a.R17c', `pull-over esaurito in W5: il testo D-21 vince su «leve finite» → «${String(x.ev.blockedReason)}»`);
}

console.log('--- Domanda 5: vie per un aumento in salita nelle settimane 5 e 6 ---');
{
  const ESA = (kg = 0) => st(TR, 6, kg, 2, 2);
  const coppia = [S('pre', '2026-02-23', TR, 6, [1]), S('b', '2026-03-19', TR, 6, [8, 8, 8]), S('a', '2026-03-26', TR, 6, [8, 8, 8])];
  const lun = rev(4, coppia, ESA(), [], '2026-03-30', T12); const dom = rev(4, coppia, ESA(), [], '2026-04-05', T12);
  const r5 = rev(5, [...coppia, S('c', '2026-03-30', TR, 6, [8, 8, 8]), S('d', '2026-04-02', TR, 6, [8, 8, 8])], ESA(), [], '2026-04-06', T12);
  rigaF(r5.e.cat === 'fermi:scarico', 'Q5.rev5', `revisione W5 (aperta in W6) → ${r5.e.cat}`);
  console.log(`F INFO    Q5.R1  revisione W4 aperta lunedì 30 marzo (W5): ${lun.e.cat} ${lun.e.dopo ?? ''} · aperta domenica 5 aprile (W5, ultimo giorno utile): ${dom.e.cat} ${dom.e.dopo ?? ''}`);
  const acc = R('2026-04-05', ESA(), ESA(2.5), 'accepted', 'revisione-4:trazioni');
  const x = fs(TR, ESA(2.5), [8, 8], '2026-04-06', coppia, [acc], { tests: T12, kg: 2.5 });
  console.log(`F INFO    Q5.R1e scelta del 5 aprile eseguita alla prima seduta dopo, lunedì 6 aprile (W6, scarico), a 2,5 kg → fine seduta: ${leva(x.ev)} «${String(x.ev.blockedReason)}» · R13 dal ${String(arDal(x.ar))}`);
  const y = fs(PU, st(PU, 2), [18, 18, 18], '2026-03-29', [S('p', '2026-03-22', PU, 2, [18, 18, 18])], []);
  console.log(`F INFO    Q5.R2  fine seduta domenica 29 marzo (W4) → ${leva(y.ev)}: si esegue alla prima seduta dopo; se l'esercizio torna lunedì 6 aprile, è in W6`);
}

console.log('--- D-23 (a) (T-23): gradino cambiato a mano ---');
{
  const prePU3 = S('pre', '2026-02-23', PU, 3, [1]); const p19 = S('p19', '2026-03-19', PU, 3, [12, 12, 12]);
  const L = st(PU, 3, 0, 2, 2);
  const giu = fs(PU, L, [18, 18, 18], '2026-03-26', [prePU3, p19], [], { livello: 2 });
  const cg = salvaN(giu.draft, L);
  rigaF(giu.ev.suggestion === null && giu.ev.blockedReason === 'Oggi hai fatto il livello 2 e lo stato era il 3: da qui comanda quello che hai scritto, e tempo e pausa tornano a quelli della scheda. Il prossimo passo si valuta dalla prossima seduta al livello 2.' && sintesi(cg) === sintesi(st(PU, 2)), '23.2', `{3, +2, +2} scritto al 2 → «${String(giu.ev.blockedReason)}» · chiusura ${sintesi(cg)}`);
  const ug = fs(PU, L, [15, 15, 15], '2026-03-26', [prePU3, p19], []);
  rigaF(sintesi(salvaN(ug.draft, L)) === sintesi(L), '23.3', `{3, +2, +2} scritto al 3 → chiusura ${sintesi(salvaN(ug.draft, L))} (bonus invariati)`);
  const L2 = st(PU, 2, 0, 1, 1);
  const su = fs(PU, L2, [18, 18, 18], '2026-03-26', [S('pre', '2026-02-23', PU, 2, [1]), S('p19', '2026-03-19', PU, 2, [18, 18, 18])], [], { livello: 3 });
  const cs = salvaN(su.draft, L2);
  rigaF(su.ev.suggestion === null && /livello scritto da te, 2 → 3/.test(su.ev.blockedReason ?? '') && sintesi(cs) === sintesi(st(PU, 3)), '23.4', `{2, +1, +1} scritto al 3 → «${String(su.ev.blockedReason)}» · chiusura ${sintesi(cs)}`);
  const Lc = st(CU, null, 12, 2, 2);
  const mc = fs(CU, Lc, [10, 10, 10], '2026-03-26', [S('pre', '2026-02-23', CU, null, [1], { kg: 12 }), S('g19', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 })], [], { kg: 14 });
  rigaF(sintesi(salvaN(mc.draft, Lc)) === sintesi(st(CU, null, 14)), '23.5', `manubrio 12 → 14 a mano, {12, +2, +2} → ${sintesi(salvaN(mc.draft, Lc))} (decisione 2026-11-16, invariata)`);
}

/* ===================================================== R18 (T-10) ===== */
console.log('--- R18 (minimo della stazione) ---');
const blocco = (sid: Sid, code: string): ProgramBlock => findCircuitSession(sid)!.blocks.find((b) => b.code === code)!;
/* Riferimento dal testo di R18: Δrip dalle fasi e-p, tetti 5" e 2", X non si allunga; n = minimo del range o activationReps; lati = 2 se per lato eseguito. */
const deltaRip = (tut: string, s: ExerciseState | undefined): number => {
  if (s === undefined) return 0;
  const f = tut.split('-'); if (f.length !== 4 || f.some((x) => x !== 'X' && !/^\d+$/.test(x))) return 0;
  const su = (x: string, b: number, cap: number): number => (x === 'X' ? 0 : Math.max(0, Math.min(cap, Number(x) + b) - Number(x)));
  return su(f[0]!, s.eccentricBonusSeconds, MAX_ECC) + su(f[1]!, s.bottomPauseBonusSeconds, MAX_PAUSA);
};
const nMin = (b: ProgramBlock): number | null => (b.prescription.kind === 'reps' ? b.prescription.min : b.prescription.kind === 'myo-reps' ? (b.prescription as { activationReps: number }).activationReps : null);
const minimoRif = (b: ProgramBlock, lato: boolean, s: ExerciseState | undefined): number => { const base = minWorkSeconds(b, getExercise(b.exercise), lato); const n = nMin(b); return n === null ? base : base + deltaRip(b.tut, s) * n * (lato ? 2 : 1); };
const MWS = minWorkSeconds as unknown as (b: ProgramBlock, e: ReturnType<typeof getExercise>, lato: boolean, s?: ExerciseState) => number;
{
  const A1 = blocco('circuito-1', 'A1'); const A2 = blocco('circuito-1', 'A2'); const HT = blocco('circuito-4', 'A1');
  const r18 = (id: string, b: ProgramBlock, lato: boolean, s: ExerciseState | undefined, atteso: number): void => {
    const e = MWS(b, getExercise(b.exercise), lato, s); const r = minimoRif(b, lato, s);
    rigaF(e === atteso && r === atteso, id, `${b.exercise} ${b.tut} ${s === undefined ? 'senza stato' : `e+${String(s.eccentricBonusSeconds)} p+${String(s.bottomPauseBonusSeconds)}`} → engine ${String(e)}, riferimento ${String(r)}, atteso ${String(atteso)}`);
  };
  r18('18.1', A1, false, st(TR, 3), 30); r18('18.2', A1, false, st(TR, 3, 0, 1, 0), 36); r18('18.3', A1, false, st(TR, 3, 0, 2, 0), 42); r18('18.4', A1, false, st(TR, 3, 0, 2, 2), 54);
  const BU = 'bulgarian-split-squat' as ExerciseSlug;
  r18('18.5', A2, true, st(BU, 2, 0, 1, 0), 116); r18('18.6', A2, true, st(BU, 2, 0, 0, 2), 116);
  const RDL = blocco('circuito-2', 'A2');
  const senzaWs: ProgramBlock = { ...RDL, workSeconds: undefined, tut: '3-0-1-0', prescription: { kind: 'reps', min: 8, max: 12 } } as ProgramBlock;
  r18('18.7', senzaWs, false, st(RDL.exercise, null, 0, 1, 0), 40);
  rigaF(MWS(senzaWs, getExercise(senzaWs.exercise), false) === 32, '18.7b', `stesso blocco senza stato: ${String(MWS(senzaWs, getExercise(senzaWs.exercise), false))} (era 32)`);
  const ecc4: ProgramBlock = { ...RDL, tut: '4-0-1-0' } as ProgramBlock;
  rigaF(MWS(ecc4, getExercise(ecc4.exercise), false, st(RDL.exercise, null, 0, 2, 0)) - MWS(ecc4, getExercise(ecc4.exercise), false) === 1 * 8, '18.8', `eccentrica 4", bonus +2 → Δ ${String((MWS(ecc4, getExercise(ecc4.exercise), false, st(RDL.exercise, null, 0, 2, 0)) - MWS(ecc4, getExercise(ecc4.exercise), false)) / 8)} per ripetizione (atteso 1)`);
  const eccX: ProgramBlock = { ...RDL, tut: 'X-1-1-0' } as ProgramBlock;
  rigaF(MWS(eccX, getExercise(eccX.exercise), false, st(RDL.exercise, null, 0, 3, 1)) - MWS(eccX, getExercise(eccX.exercise), false) === 8, '18.9', `eccentrica X, pausa +1 → Δ ${String((MWS(eccX, getExercise(eccX.exercise), false, st(RDL.exercise, null, 0, 3, 1)) - MWS(eccX, getExercise(eccX.exercise), false)) / 8)} (atteso 1, solo dalla pausa)`);
  const ctrl: ProgramBlock = { ...RDL, tut: 'controllato' } as ProgramBlock; const HH = blocco('circuito-3', 'B3');
  rigaF(MWS(ctrl, getExercise(ctrl.exercise), false, st(RDL.exercise, null, 0, 2, 2)) === MWS(ctrl, getExercise(ctrl.exercise), false) && MWS(HH, getExercise(HH.exercise), false, st(HH.exercise, 3, 0, 2, 2)) === MWS(HH, getExercise(HH.exercise), false), '18.10', 'TUT «controllato» e «isometrico» con bonus: invariato');
  const SC = blocco('circuito-1', 'B3');
  rigaF(MWS(SC, getExercise(SC.exercise), true, st(SC.exercise, null, 0, 2, 2)) === MWS(SC, getExercise(SC.exercise), true), '18.11', `prescrizione a secondi (suitcase carry): ${String(MWS(SC, getExercise(SC.exercise), true, st(SC.exercise, null, 0, 2, 2)))} = ${String(MWS(SC, getExercise(SC.exercise), true))}`);
  const HTs = st(HT.exercise, 3, 0, 1, 0);
  rigaF(blockPerSide(HT, new Map([[HT.exercise, HTs]])) && MWS(HT, getExercise(HT.exercise), true, HTs) === 170 + 15 * 2, '18.12', `hip thrust al 3 (monopodalico), e+1 → ${String(MWS(HT, getExercise(HT.exercise), true, HTs))} (atteso 200)`);
  rigaF(MWS(A1, getExercise(A1.exercise), false) === 30, '18.13', 'senza stato: 30');
  /* 18.14-18.16 sul piano guidato dei 4 circuiti */
  let diversi15 = 0; let diversi14 = 0; let diversi16 = 0; let stimaDiversa = 0; const durate: string[] = [];
  for (const s of CIRCUIT_SESSIONS) {
    const zero = new Map<ExerciseSlug, ExerciseState>(); const max = new Map<ExerciseSlug, ExerciseState>(); const maxHT = new Map<ExerciseSlug, ExerciseState>();
    for (const b of s.blocks) {
      const ex = getExercise(b.exercise); const t = fasi(b.tut);
      const eM = t === null || t.e === 'X' ? 0 : Math.max(0, MAX_ECC - t.e); const pM = t === null || t.p === 'X' ? 0 : Math.max(0, MAX_PAUSA - t.p);
      zero.set(ex.slug, st(ex.slug, ex.defaultLevel, 0)); max.set(ex.slug, st(ex.slug, ex.defaultLevel, 0, eM, pM));
      maxHT.set(ex.slug, st(ex.slug, ex.slug === 'hip-thrust-panca-bilaterale' ? 3 : ex.defaultLevel, 0, eM, pM));
      const lato = blockPerSide(b, zero);
      if (MWS(b, ex, lato, zero.get(ex.slug)) !== MWS(b, ex, lato)) diversi15 += 1;
    }
    for (const [w, stati] of [[4, max], [4, maxHT]] as const) {
      const piano = buildGuidedPlan(s, w, stati); const scarico = buildGuidedPlan(s, 6, stati); const base = buildGuidedPlan(s, w, zero);
      let delta = 0;
      for (const p of piano) {
        if (p.kind !== 'work') continue;
        const b = s.blocks.find((x) => x.code === p.blockCode)!; const ex = getExercise(b.exercise);
        const atteso = minimoRif(b, p.step.perSide, stati.get(ex.slug)); const panoramica = MWS(b, ex, blockPerSide(b, stati), stati.get(ex.slug));
        if (p.workSeconds !== atteso || p.workSeconds !== panoramica) diversi16 += 1;
        const q = scarico.find((x) => x.kind === 'work' && x.blockCode === p.blockCode);
        if (q !== undefined && q.kind === 'work' && q.workSeconds !== p.workSeconds) diversi14 += 1;
        const z = base.find((x) => x.kind === 'work' && x.id === p.id);
        if (z !== undefined && z.kind === 'work') delta += p.workSeconds - z.workSeconds;
      }
      if (estimatedSeconds(piano) - estimatedSeconds(base) !== delta) stimaDiversa += 1;
      const mmss = (x: number): string => `${String(Math.floor(x / 60))}:${String(x % 60).padStart(2, '0')}`;
      durate.push(`${s.id}${stati === maxHT ? ' (hip thrust al 3)' : ''}: ${mmss(estimatedSeconds(base))} → ${mmss(estimatedSeconds(piano))}`);
    }
  }
  rigaF(diversi15 === 0, '18.15', `bonus 0, tutti i blocchi dei 4 circuiti: ${String(diversi15)} diversi dal minimo di oggi`);
  rigaF(diversi14 === 0, '18.14', `scarico (settimana 6) contro settimana 4, stessi stati ai bonus massimi: ${String(diversi14)} stazioni con un minimo diverso`);
  rigaF(diversi16 === 0 && stimaDiversa === 0, '18.16', `piano guidato = riferimento = formula della panoramica: ${String(diversi16)} stazioni diverse; stima ≠ base + somma dei minimi: ${String(stimaDiversa)}`);
  console.log(`R-6 durata stimata (settimana 4), bonus 0 → tutti ai massimi: ${durate.join(' · ')}`);
}

/* ===================================================== R19 (T-22) ===== */
console.log('--- R19 (T-22, D-22 a): tetto di 55 minuti a fine seduta ---');
type Circ = (typeof CIRCUIT_SESSIONS)[number];
type Stati = Map<ExerciseSlug, ExerciseState>;
const C4 = findCircuitSession('circuito-4')! as Circ; const C1 = findCircuitSession('circuito-1')! as Circ;
/* durata di riferimento (§7: settimana piena, riscaldamento compreso): struttura del piano dal prodotto con gli stessi
   gradini e i bonus a 0, più i secondi dei bonus dal testo di R18 (Δrip × n × lati; 18.16 verifica che il piano faccia lo stesso). */
const durRif = (c: Circ, s: Stati): number => {
  const zero: Stati = new Map([...s].map(([k, x]) => [k, { ...x, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 }]));
  const piano = buildGuidedPlan(c, 4, zero);
  let tot = estimatedSeconds(piano);
  for (const p of piano) {
    if (p.kind !== 'work') continue;
    const b = c.blocks.find((x) => x.code === p.blockCode)!; const n = nMin(b);
    if (n !== null) tot += deltaRip(b.tut, s.get(b.exercise)) * n * (p.step.perSide ? 2 : 1);
  }
  return tot;
};
/* la misura del riepilogo (SessionSummary: buildGuidedPlan(program, 1, stati)) */
const durP = (c: Circ, s: Stati): number => estimatedSeconds(buildGuidedPlan(c, 1, s));
const bonusMax = (b: ProgramBlock): { e: number; p: number } => { const t = fasi(b.tut); return { e: t === null || t.e === 'X' ? 0 : Math.max(0, MAX_ECC - t.e), p: t === null || t.p === 'X' ? 0 : Math.max(0, MAX_PAUSA - t.p) }; };
const statiDi = (c: Circ, f: (b: ProgramBlock) => Partial<ExerciseState> = () => ({})): Stati => {
  const m: Stati = new Map();
  for (const b of c.blocks) { const ex = getExercise(b.exercise); m.set(ex.slug, { ...st(ex.slug, ex.defaultLevel, ex.loadPolicy === 'inherent' ? 10 : 0), ...f(b) }); }
  return m;
};
const passo = (s: ExerciseState, leva: 'tempo' | 'pausa'): ExerciseState => (leva === 'tempo' ? { ...s, eccentricBonusSeconds: s.eccentricBonusSeconds + 1 } : { ...s, bottomPauseBonusSeconds: s.bottomPauseBonusSeconds + 1 });
const giudicati = (c: Circ): ProgramBlock[] => c.blocks.filter((b) => b.excludeFromReview !== true && getExercise(b.exercise).measurement === 'reps');
/* fine seduta di un blocco del circuito come il riepilogo, al massimo del range, allo stato, con R19 sugli stati dati */
const storiaDi = (slug: ExerciseSlug, L: ExerciseState, inizio = '2026-03-02'): LoggedSession[] => [inizio, '2026-03-12', '2026-03-19'].map((dd, i) => S(`h${String(i)}`, dd, slug, L.level, [vDi(slug).max, vDi(slug).max, vDi(slug).max], { kg: L.loadKg }));
const fineR19 = (c: Circ, slug: ExerciseSlug, riep: Stati, conTetto = true) => {
  const L = riep.get(slug)!;
  return fs(slug, L, [vDi(slug).max, vDi(slug).max, vDi(slug).max], '2026-03-26', storiaDi(slug, L), [], { kg: L.loadKg, tests: T12, ...(conTetto ? { durataCon: (s: ExerciseState) => durP(c, new Map(riep).set(s.exercise, s)) } : {}) });
};
const tempoDi = (ev: ReturnType<typeof evaluateProgression>, leva: 'tempo' | 'iso-pause') => ev.levers.find((x) => x.lever === leva);
const rnd19 = mulberry32(5519);
const casuale = (c: Circ, livelli = false): Stati => statiDi(c, (b) => { const m = bonusMax(b); const ex = getExercise(b.exercise); return { eccentricBonusSeconds: Math.floor(rnd19() * (m.e + 1)), bottomPauseBonusSeconds: Math.floor(rnd19() * (m.p + 1)), ...(livelli && ex.pattern !== null ? { level: (1 + Math.floor(rnd19() * 6)) as LevelIndex } : {}) }; });
{
  /* R19.0: la misura del riepilogo = la durata di riferimento, settimana 1 = settimana piena */
  let diversi = 0; let prove = 0;
  for (const c of CIRCUIT_SESSIONS as readonly Circ[]) for (let i = 0; i < 300; i += 1) { const s = casuale(c, i % 2 === 0); prove += 1; if (durP(c, s) !== durRif(c, s)) diversi += 1; }
  rigaF(diversi === 0 && DURATA_CODICE === TETTO, 'R19.0', `durata del riepilogo (settimana 1) ≠ riferimento (settimana piena + R18): ${String(diversi)} su ${String(prove)} stati casuali · tetto nel codice ${String(DURATA_CODICE)} s`);
  /* R19.1: soglia. Stati casuali di circuito-4; per ogni blocco a ripetizioni col tempo libero: il caso che attraversa il
     tetto col passo più piccolo e quello che ci arriva più vicino da sotto (≤ vale ancora). */
  let sopra: { s: Stati; slug: ExerciseSlug; d: number } | null = null; let sotto: { s: Stati; slug: ExerciseSlug; d: number } | null = null;
  for (let i = 0; i < 6000; i += 1) {
    const s = casuale(C4);
    for (const b of giudicati(C4)) {
      const L = s.get(b.exercise)!; if (L.eccentricBonusSeconds >= bonusMax(b).e) continue;
      const d0 = durRif(C4, s); const d1 = durRif(C4, new Map(s).set(b.exercise, passo(L, 'tempo')));
      if (d0 <= TETTO && d1 > TETTO && (sopra === null || d1 < sopra.d)) sopra = { s, slug: b.exercise, d: d1 };
      if (d1 <= TETTO && (sotto === null || d1 > sotto.d)) sotto = { s, slug: b.exercise, d: d1 };
    }
  }
  if (sopra !== null) { const x = fineR19(C4, sopra.slug, sopra.s); const t = tempoDi(x.ev, 'tempo');
    rigaF(t?.available === false && t.reason === TESTO_R19 && x.ev.suggestion?.lever !== 'tempo', 'R19.1', `circuito-4, ${sopra.slug}: col passo di tempo la seduta va a ${mmss(sopra.d)} → tempo ${String(t?.available)} «${String(t?.reason)}» · proposta ${leva(x.ev)}`); }
  else rigaF(false, 'R19.1', 'nessuno stato costruito');
  if (sotto !== null) { const x = fineR19(C4, sotto.slug, sotto.s);
    rigaF(x.ev.suggestion?.lever === 'tempo', 'R19.1b', `circuito-4, ${sotto.slug}: col passo di tempo la seduta va a ${mmss(sotto.d)} (≤ 55:00) → ${leva(x.ev)}`); }
  /* R19.2: circuito-1 ai massimi meno un passo: come prima */
  const max1 = statiDi(C1, (b) => ({ eccentricBonusSeconds: bonusMax(b).e, bottomPauseBonusSeconds: bonusMax(b).p }));
  const pu = 'curl-martello-manubri' as ExerciseSlug; const meno1 = new Map(max1).set(pu, { ...max1.get(pu)!, eccentricBonusSeconds: max1.get(pu)!.eccentricBonusSeconds - 1 });
  const x2 = fineR19(C1, pu, meno1);
  rigaF(x2.ev.suggestion?.lever === 'tempo', 'R19.2', `circuito-1 ai massimi (${mmss(durRif(C1, max1))}) meno un passo di curl → ${leva(x2.ev)}`);
  /* R19.3: σ′ — due blocchi che stanno ciascuno sotto il tetto ma non insieme: il secondo del riepilogo si ferma */
  let coppia: { s: Stati; a: ExerciseSlug; b: ExerciseSlug } | null = null;
  const gc4 = giudicati(C4);
  for (let i = 0; i < 6000 && coppia === null; i += 1) {
    const s = casuale(C4);
    for (let ia = 0; ia < gc4.length && coppia === null; ia += 1) for (let ib = ia + 1; ib < gc4.length && coppia === null; ib += 1) {
      const A = gc4[ia]!; const B = gc4[ib]!; const LA = s.get(A.exercise)!; const LB = s.get(B.exercise)!;
      if (LA.eccentricBonusSeconds >= bonusMax(A).e || LB.eccentricBonusSeconds >= bonusMax(B).e) continue;
      const sA = new Map(s).set(A.exercise, passo(LA, 'tempo')); const sB = new Map(s).set(B.exercise, passo(LB, 'tempo')); const sAB = new Map(sA).set(B.exercise, passo(LB, 'tempo'));
      if (durRif(C4, sA) <= TETTO && durRif(C4, sB) <= TETTO && durRif(C4, sAB) > TETTO) coppia = { s, a: A.exercise, b: B.exercise };
    }
  }
  if (coppia !== null) {
    const riep: Stati = new Map(coppia.s);
    const xa = fineR19(C4, coppia.a, riep);
    if (xa.ev.suggestion?.lever === 'tempo' || xa.ev.suggestion?.lever === 'iso-pause') riep.set(coppia.a, xa.ev.suggestion.nextState);
    const xb = fineR19(C4, coppia.b, riep); const xbSolo = fineR19(C4, coppia.b, new Map(coppia.s));
    rigaF(xa.ev.suggestion?.lever === 'tempo' && tempoDi(xb.ev, 'tempo')?.available === false && tempoDi(xbSolo.ev, 'tempo')?.available === true, 'R19.3', `σ′: ${coppia.a} → ${leva(xa.ev)}; poi ${coppia.b} → tempo ${String(tempoDi(xb.ev, 'tempo')?.available)} (da solo: ${String(tempoDi(xbSolo.ev, 'tempo')?.available)}) · durate ${mmss(durRif(C4, coppia.s))} → ${mmss(durRif(C4, riep))}`);
  } else rigaF(false, 'R19.3', 'coppia non trovata');
  /* R19.4: hip thrust al 2 con tempo e pausa fermati dal tetto: la variante resta proponibile (§7) e porta la seduta oltre */
  const HT = 'hip-thrust-panca-bilaterale' as ExerciseSlug; const htB = C4.blocks.find((b) => b.exercise === HT)!;
  let pieno = statiDi(C4);
  for (let giro = 0; giro < 20; giro += 1) for (const b of gc4) { if (b.exercise === HT) continue; for (const lv of ['tempo', 'pausa'] as const) { const L = pieno.get(b.exercise)!; const m = bonusMax(b); if ((lv === 'tempo' ? L.eccentricBonusSeconds < m.e : L.bottomPauseBonusSeconds < m.p)) { const nuovo = new Map(pieno).set(b.exercise, passo(L, lv)); if (durRif(C4, nuovo) <= TETTO) pieno = nuovo; } } }
  const htT = durRif(C4, new Map(pieno).set(HT, passo(pieno.get(HT)!, 'tempo'))); const htP = durRif(C4, new Map(pieno).set(HT, passo(pieno.get(HT)!, 'pausa')));
  const xv = fineR19(C4, HT, pieno);
  const dopoV = xv.ev.suggestion === null ? null : durRif(C4, new Map(pieno).set(HT, xv.ev.suggestion.nextState));
  rigaF(htT > TETTO && htP > TETTO && xv.ev.suggestion?.lever === 'variant' && xv.ev.suggestion.nextState.level === 3, 'R19.4', `circuito-4 riempito fino a ${mmss(durRif(C4, pieno))} (hip thrust al 2, bonus 0; il suo passo di tempo porterebbe a ${mmss(htT)}, di pausa a ${mmss(htP)}) → ${leva(xv.ev)} · seduta dopo la variante: ${dopoV === null ? '-' : mmss(dopoV)}`);
  console.log(`INFO D5   durata più lunga costruita con R19 (tempo e pausa fino al tetto, poi hip thrust 2 → 3): ${dopoV === null ? '-' : mmss(dopoV)}; hip thrust 2 → 3 a bonus 0 vale ${mmss(durRif(C4, new Map(statiDi(C4)).set(HT, { ...statiDi(C4).get(HT)!, level: 3 })) - durRif(C4, statiDi(C4)))}`);
  /* R19.R: la revisione (R10a 2-3) dice «la prossima leva è il tempo … te la propone il riepilogo», il riepilogo non la propone (R19 solo a fine seduta) */
  const MP = 'military-press-manubri' as ExerciseSlug;
  let caso19: Stati | null = null;
  for (let i = 0; i < 6000 && caso19 === null; i += 1) { const s = casuale(C4); const L = s.get(MP)!; if (L.eccentricBonusSeconds < bonusMax(blocco('circuito-4', 'A3')).e && durRif(C4, s) <= TETTO && durRif(C4, new Map(s).set(MP, passo(L, 'tempo'))) > TETTO) caso19 = s; }
  if (caso19 !== null) {
    const L = caso19.get(MP)!;
    /* C: la revisione con la durata, come Home e Revisione a f7f945d (revC); in produzione senza */
    const rv = revC(4, [S('pre', '2026-02-23', MP, null, [1], { kg: 10 }), S('b', '2026-03-19', MP, null, [15, 15, 15], { kg: 10 }), S('a', '2026-03-26', MP, null, [15, 15, 15], { kg: 10 })], caso19, MP, [], '2026-03-30');
    const fsum = fineR19(C4, MP, caso19);
    const promessa = rv.e.cat === 'alMassimo:tempo' && /te la propone il riepilogo di fine seduta/.test(rv.testo);
    const fermato = tempoDi(fsum.ev, 'tempo')?.available === false;
    rigaF(!(promessa && fermato), 'R19.R', `circuito-4 a ${mmss(durRif(C4, caso19))}, military press ${sintesi(L)}: revisione → ${rv.e.cat} «${rv.testo.slice(0, 120)}…» · riepilogo allo stesso stato → tempo ${String(tempoDi(fsum.ev, 'tempo')?.available)}, proposta ${leva(fsum.ev)} «${String(fsum.ev.blockedReason)}»`);
  }
  /* R19.L: plank con trascinamento (manubrio fuori da D-19, senza scala): con tempo e pausa fermati dal tetto il riepilogo dice «leve finite» */
  const PK = 'plank-trascinamento-kb' as ExerciseSlug; const pkB = blocco('circuito-4', 'B3');
  let casoPK: Stati | null = null;
  for (let i = 0; i < 6000 && casoPK === null; i += 1) { const s = casuale(C4); const L = s.get(PK)!; if (L.eccentricBonusSeconds < bonusMax(pkB).e && L.bottomPauseBonusSeconds < bonusMax(pkB).p && durRif(C4, s) <= TETTO && durRif(C4, new Map(s).set(PK, passo(L, 'tempo'))) > TETTO && durRif(C4, new Map(s).set(PK, passo(L, 'pausa'))) > TETTO) casoPK = s; }
  if (casoPK !== null) { const x = fineR19(C4, PK, casoPK); console.log(`F INFO    R19.L  circuito-4 a ${mmss(durRif(C4, casoPK))}, plank ${sintesi(casoPK.get(PK)!)} (tempo e pausa liberi, fermati dal tetto) → ${leva(x.ev)} «${String(x.ev.blockedReason)}» · tempo «${String(tempoDi(x.ev, 'tempo')?.reason)}»`); }
  void htB;
}

{
  /* Q5 (R10c-1 + reset del manubrio): manubrio accettato in revisione, alla seduta dopo il player
     guidato propone il peso della seduta scorsa (12) e l'atleta non lo cambia. Cosa resta nello stato? */
  const prima = st(CU, null, 12, 2, 2);
  const accettato = st(CU, null, 14.5, 0, 0);
  const seduta: LoggedSession = S('q5', '2026-03-26', CU, null, [10, 10, 10], { kg: 12 });
  /* B2: la chiusura dell'app toglie la scelta (R14). In produzione Dz è null e resta la sincronizzazione. */
  const cQ5 = { id: 'q5c', date: '2026-03-23', exercise: CU, decision: 'accepted' as const, stateBefore: prima, stateAfter: accettato, sessionLogId: 'revisione-3:curl', blockCode: 'B1', lever: 'load' };
  const tQ5 = Dz === null ? [] : Dz.decadenze(seduta, [cQ5] as never, [S('g19', '2026-03-19', CU, null, [10, 10, 10], { kg: 12 })], new Map([[CU, accettato]]));
  const salvato = tQ5[0]?.stato ?? statesToSave(syncStatesFromLog(seduta, new Map([[CU, accettato]])), new Map())[0] ?? accettato;
  rigaF(!(salvato.loadKg === prima.loadKg && salvato.eccentricBonusSeconds < prima.eccentricBonusSeconds), 'Q5', `prima ${sintesi(prima)} · accettato ${sintesi(accettato)} · seduta scritta a 12 kg (precompilati dal player) → salvato ${sintesi(salvato)}`);
}

/* ======================================================= B2 · F ======= */
/* Inserito in `17-b2.mts` dopo Q5. Riferimento scritto dal testo di
   training/reports/2026-11-18-training.md (R14, rev. 2026-11-20) e 2026-11-21-training.md §1 (D-19 b),
   non da decadenza.ts. */
console.log('--- B2 · R14a/c/e (T-15), R14d (T-16 rev.), D-19 b (T-24): righe della specifica ---');
console.log(`decadenza.ts nel codice: ${Dz === null ? 'assente' : 'presente'} · manubrioDopo nel codice: ${typeof (P as Record<string, unknown>)['manubrioDopo']}`);
type Reg = DecisioneRegistrata & { id: string; blockCode: string; lever: string; sessionLogId: string };
function RI(id: string, date: string, before: ExerciseState, after: ExerciseState, sessionLogId: string, lever = 'load', decision: 'accepted' | 'postponed' | 'lapsed' = 'accepted', ref?: string): Reg {
  return { id, date, exercise: before.exercise, decision, stateBefore: before, stateAfter: after, sessionLogId, blockCode: vDi(before.exercise).code, lever, ...(ref === undefined ? {} : { ref }) } as Reg;
}
type Tolta = { exercise: ExerciseSlug; scelta: { id: string }; stato: ExerciseState; record: Reg; testo: string };
function decadenzeApp(S0: LoggedSession, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[], stati: ReadonlyMap<ExerciseSlug, ExerciseState>): Tolta[] {
  return Dz === null ? [] : (Dz.decadenze(S0, dec as never, sessions, stati) as unknown as Tolta[]);
}
function idTolti(t: readonly Tolta[]): Set<string> { return new Set(t.map((x) => x.scelta.id)); }
function tolteDi(dec: readonly DecisioneRegistrata[]): Set<string> { return new Set(dec.flatMap((r) => (r.decision === 'lapsed' && r.ref !== undefined ? [r.ref] : []))); }
const bon = (s: ExerciseState): string => `e${String(s.eccentricBonusSeconds)} p${String(s.bottomPauseBonusSeconds)}`;
const giornoIt = (x: string): string => { const dt = new Date(`${x}T12:00:00Z`); return `${['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][dt.getUTCDay()]!} ${String(dt.getUTCDate())} ${['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'][dt.getUTCMonth()]!}`; };
const kgIt = (x: number): string => `${String(x).replace('.', ',')} kg`;

/* Sincronizzazione dal testo (regole approvate, non da draft.ts): gradino = il più alto scritto (L24), peso = il massimo
   scritto; forbidden: il peso resta; R14e: inherent a 0 kg con lo stato a peso ⇒ il peso resta; niente cambiato ⇒ stato
   di prima; manubrio cambiato a mano (Alessio 2026-11-16) o gradino cambiato (D-23 a) ⇒ tempo e pausa a 0. */
function syncRif(voci: readonly LoggedExercise[], before: ExerciseState): ExerciseState {
  const pol = getExercise(before.exercise).loadPolicy;
  const con = voci.filter((x) => x.exercise === before.exercise && x.sets.length > 0);
  if (con.length === 0) return before;
  const maxKg = kgMax(con);
  const load = pol === 'forbidden' ? before.loadKg : pol === 'inherent' && maxKg === 0 && before.loadKg > 0 ? before.loadKg : maxKg;
  const level = (livRif(con) ?? before.level) as LevelIndex | null;
  if (level === before.level && load === before.loadKg) return before;
  const reset = (pol === 'inherent' && load !== before.loadKg) || level !== before.level;
  return { ...before, level, loadKg: load, ...(reset ? { eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 } : {}) };
}
/* Notazione comune di R14: scelta in salita in attesa a S, dal testo. */
function attesaRif(slug: ExerciseSlug, L: ExerciseState, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[], S0: LoggedSession) {
  const pol = getExercise(slug).loadPolicy;
  const tolte = tolteDi(dec);
  const uguale = (a: ExerciseState, b: ExerciseState): boolean => sintesi(a) === sintesi(b);
  const cand = (dec as Reg[]).filter((r) => r.exercise === slug && r.decision === 'accepted' && !tolte.has(r.id ?? '') && r.sessionLogId !== S0.id && uguale(L, r.stateAfter));
  const c = cand.sort((a, b) => (a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1)).at(-1);
  if (c === undefined) return null;
  const carico = pol !== 'forbidden' && c.stateAfter.loadKg > c.stateBefore.loadKg;
  const livello = !carico && c.stateBefore.level !== null && c.stateAfter.level !== null && c.stateAfter.level > c.stateBefore.level;
  if (!carico && !livello) return null;
  const B = carico ? c.stateBefore.loadKg : c.stateBefore.level!;
  const T = carico ? c.stateAfter.loadKg : c.stateAfter.level!;
  const val = (s: LoggedSession): number | null => {
    const voci = s.exercises.filter((x) => x.exercise === slug && x.sets.length > 0);
    if (voci.length === 0) return null;
    if (carico) { const k = kgMax(voci); return pol === 'inherent' && k === 0 && L.loadKg > 0 ? null : k; }
    return livRif(voci);
  };
  const D = sessions.some((s) => s.status === 'completed' && s.id !== S0.id && s.id !== c.sessionLogId && s.date >= c.date && val(s) !== null && val(s) !== B);
  if (D) return null;
  return { c, carico, B, T, vS: val(S0) };
}
/* Il testo R14a dal testo della specifica (11-18 «Testi», D-19 b per <cosa>); per livello con v < B la specifica non ha
   testo: si controlla solo che dica il vero (più sotto). */
function cosaRif(c: Reg): string {
  if (c.stateAfter.loadKg > c.stateBefore.loadKg) {
    if (getExercise(c.exercise).loadPolicy !== 'inherent') return `carico ${String(c.stateBefore.loadKg).replace('.', ',')} → ${kgIt(c.stateAfter.loadKg)}`;
    return MANUBRI_RIF.some((x) => Math.abs(x - c.stateAfter.loadKg) < 1e-9) ? `manubrio successivo, ${String(c.stateBefore.loadKg).replace('.', ',')} → ${kgIt(c.stateAfter.loadKg)}` : `manubrio successivo, al massimo ${kgIt(c.stateAfter.loadKg)}`;
  }
  return `livello ${String(c.stateBefore.level)} → ${String(c.stateAfter.level)}`;
}
function testoR14aRif(a: NonNullable<ReturnType<typeof attesaRif>>, v: number): string | null {
  const { c, carico, B, T } = a;
  const diversi = bon(c.stateBefore) !== bon(c.stateAfter);
  const conB = c.stateBefore.eccentricBonusSeconds > 0 || c.stateBefore.bottomPauseBonusSeconds > 0;
  const g = `la scelta del ${giornoIt(c.date)}`;
  if (carico && v === B) return `Oggi hai usato ${kgIt(B)}, il peso di prima: ${g} (${cosaRif(c)}) non è stata eseguita e si toglie.${diversi ? ` Tempo e pausa tornano a quelli che avevi su ${kgIt(B)}.` : ''} Il prossimo passo si valuta dalla prossima seduta.`;
  if (carico) return `Oggi hai usato ${kgIt(v)}, meno di prima: ${g} (${cosaRif(c)}) non è stata eseguita e si toglie. Da qui comanda quello che hai scritto${getExercise(c.exercise).loadPolicy === 'inherent' && conB ? ': tempo e pausa tornano a quelli della scheda' : ''}.`;
  if (v === B) return `Oggi hai fatto il livello ${String(B)}, quello di prima: ${g} (livello ${String(B)} → ${String(T)}) non è stata eseguita e si toglie.${diversi ? ` Tempo e pausa tornano a quelli che avevi al livello ${String(B)}.` : ''} Il prossimo passo si valuta dalla prossima seduta.`;
  return null;
}
/* Verità del testo sullo stato salvato: ogni frase su tempo e pausa deve corrispondere a quello che si salva. */
function veritaTesto(testo: string, c: Reg, salvato: ExerciseState): string | null {
  const suB = / Tempo e pausa tornano a quelli che avevi (su|al livello) /.test(testo);
  const scheda = /: tempo e pausa tornano a quelli della scheda\.$/.test(testo);
  if (suB && bon(salvato) !== bon(c.stateBefore)) return `dice «tempo e pausa di prima» (${bon(c.stateBefore)}), salva ${bon(salvato)}`;
  if (scheda && bon(salvato) !== 'e0 p0') return `dice «della scheda», salva ${bon(salvato)}`;
  if (!suB && !scheda && bon(salvato) !== bon(c.stateAfter)) return `non dice niente su tempo e pausa: nel player erano ${bon(c.stateAfter)}, si salva ${bon(salvato)}`;
  return null;
}
/* il riepilogo come SessionSummary a 0d85597: decadenze prima, R14a sull'esercizio, R13 senza le scelte tolte */
type OpzB2 = { kg?: number; livello?: LevelIndex | null; tempo?: boolean | null; id?: string; week?: number; tests?: Map<TestId, TestResult> };
function riepB2(slug: ExerciseSlug, L: ExerciseState, valori: number[], date: string, storia: LoggedSession[], reg: Reg[], o: OpzB2 = {}) {
  const v = vDi(slug); const ex = getExercise(slug); const tests = o.tests ?? VUOTO;
  const id = o.id ?? `S-${date}`;
  const draft: LoggedSession = { ...S(id, date, slug, o.livello === undefined ? L.level : o.livello, valori, { kg: o.kg ?? L.loadKg, tempo: o.tempo, week: o.week }), status: 'in-progress' };
  const tolte = decadenzeApp(draft, reg, storia, new Map([[slug, L]]));
  const it = idTolti(tolte);
  const logged = draft.exercises[0]!;
  const stessi = draft.exercises.filter((x) => x.exercise === slug);
  const input = { block: v.block, exercise: ex, state: L, logged, range: resolveBlockRange(v.block, ex, tests), week: draft.week, currentMaxReps: v.pattern === null ? null : (tests.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(slug, L.level, storia, date, draft), rientro: null, aumentoRecente: aumentoRecente(slug, reg.filter((r) => r.sessionLogId !== draft.id && !it.has(r.id)), storia, date, draft), caricoMassimoSeduta: kgMax(stessi), livelloMassimoSeduta: livelloVociP === undefined ? undefined : livelloVociP(stessi), pesoScrittoPrima: storia.some((s) => s.status === 'completed' && s.id !== draft.id && s.exercises.some((x) => x.exercise === slug && x.sets.some((y) => y.loadKg > 0))), decaduta: tolte.find((t) => t.exercise === slug)?.testo ?? null } as Parameters<typeof evaluateProgression>[0];
  const ev = evaluateProgression(input);
  return { draft, tolte, ev, input };
}
/* la chiusura come GuidedSession.chiudi a 0d85597 (in produzione: niente decadenze, si sincronizza e basta) */
function chiudiB2(draft: LoggedSession, reg: Reg[], storia: LoggedSession[], L: ExerciseState, accettata: ExerciseState | null = null) {
  const stati = new Map([[L.exercise, L]]);
  const tolte = decadenzeApp(draft, reg, storia, stati);
  const tolti = new Set(tolte.map((t) => t.exercise));
  let stato = L;
  const acc = new Map<ExerciseSlug, ExerciseState>(); if (accettata !== null) acc.set(L.exercise, accettata);
  for (const s of statesToSave(syncStatesFromLog(draft, stati), acc)) if (!tolti.has(s.exercise)) stato = s;
  if (accettata !== null && !tolti.has(L.exercise)) stato = accettata;
  for (const t of tolte) stato = t.stato;
  return { stato, records: tolte.map((t) => t.record), tolte, chiusa: { ...draft, status: 'completed' } as LoggedSession };
}
const nonReps = (ev: ReturnType<typeof evaluateProgression>, motivo: string): boolean => ev.levers.every((x) => x.lever === 'reps' || !x.available) && motivo !== '';
const fsB2 = (ev: ReturnType<typeof evaluateProgression>): string => String((ev as unknown as Record<string, unknown>)['fuoriStato'] ?? 'assente');
const MAXC = [vDi(CU).max, vDi(CU).max, vDi(CU).max];
const OSST: string[] = [];
{
  /* Base (Q5 di quality, specifica 11-18 «Prove R14»): curl a martello, stato {12, +2″, +2″} esauriti; revisione di
     lunedì 23 accettata: c = 12 → «al massimo 14,5 kg» (scelta vecchia, D19.14); ultima chiusa giovedì 19 a 12 kg. */
  const preC = S('pre', '2026-02-23', CU, null, [1], { kg: 12 });
  const g19 = S('g19', '2026-03-19', CU, null, MAXC, { kg: 12 });
  const B0 = st(CU, null, 12, 2, 2); const T0 = st(CU, null, 14.5);
  const c = RI('c23', '2026-03-23', B0, T0, 'revisione-3:curl-martello-manubri');
  const storia = [preC, g19];
  const giu = (testo: string | null | undefined): string => `«${String(testo)}»`;
  /* 14.1 (M18) */
  const r1 = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c], { kg: 12, id: 'S26' });
  const k1 = chiudiB2(r1.draft, [c], storia, T0);
  const t141 = 'Oggi hai usato 12 kg, il peso di prima: la scelta del lunedì 23 marzo (manubrio successivo, al massimo 14,5 kg) non è stata eseguita e si toglie. Tempo e pausa tornano a quelli che avevi su 12 kg. Il prossimo passo si valuta dalla prossima seduta.';
  const rec = k1.records[0];
  const recOk = k1.records.length === 1 && rec !== undefined && rec.decision === 'lapsed' && rec.ref === 'c23' && sintesi(rec.stateBefore) === sintesi(T0) && sintesi(rec.stateAfter) === sintesi(B0) && rec.date === '2026-03-26' && rec.sessionLogId === 'S26' && rec.blockCode === c.blockCode && rec.lever === c.lever;
  const reg1: Reg[] = [c, ...k1.records]; const storia1 = [...storia, k1.chiusa];
  /* lunedì 30 a 12 con il massimo chiuso: settimana 4 passata a mano (il 30 è W5, D-21 lo fermerebbe) */
  const r30 = riepB2(CU, k1.stato, MAXC, '2026-03-30', storia1, reg1, { kg: 12, id: 'S30', week: 4 });
  rigaF(r1.ev.suggestion === null && r1.ev.blockedReason === t141 && fsB2(r1.ev) === 'r14a' && nonReps(r1.ev, t141) && sintesi(k1.stato) === sintesi(B0) && recOk && r30.ev.suggestion?.lever === 'load' && sintesi(r30.ev.suggestion.nextState) === sintesi(st(CU, null, 14)) && r30.input.aumentoRecente === null,
    '14.1', `riepilogo 26 → ${leva(r1.ev)} (${fsB2(r1.ev)}) ${giu(r1.ev.blockedReason)} · chiusura ${sintesi(k1.stato)} · record ${k1.records.map((x) => `${x.decision} ref ${String(x.ref)} ${sintesi(x.stateBefore)}→${sintesi(x.stateAfter)} ${x.date} ${x.sessionLogId}`).join(';') || 'nessuno'} · lunedì 30 → ${leva(r30.ev)}, R13 ${JSON.stringify(r30.input.aumentoRecente)}`);
  /* 14.2-14.4 */
  const r2 = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c], { kg: 14, id: 'S26' }); const k2 = chiudiB2(r2.draft, [c], storia, T0);
  rigaF(r2.tolte.length === 0 && k2.records.length === 0 && sintesi(k2.stato) === sintesi(st(CU, null, 14)) && /l.ultimo è del giovedì 26 marzo \(carico 12 → 14 kg, scelta del lunedì 23 marzo\)\. Il prossimo si può proporre dal giovedì 2 aprile/.test(r2.ev.blockedReason ?? ''), '14.2', `26 a 14 → tolte ${String(r2.tolte.length)} · chiusura ${sintesi(k2.stato)} · ${giu(r2.ev.blockedReason)}`);
  const r3 = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c], { kg: 14.5, id: 'S26' }); const k3 = chiudiB2(r3.draft, [c], storia, T0);
  rigaF(r3.tolte.length === 0 && k3.records.length === 0 && sintesi(k3.stato) === sintesi(T0), '14.3', `26 a 14,5 → tolte ${String(r3.tolte.length)} · chiusura ${sintesi(k3.stato)}`);
  const r4 = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c], { kg: 16, id: 'S26' }); const k4 = chiudiB2(r4.draft, [c], storia, T0);
  const a4 = aum(CU, [c], [...storia, k4.chiusa]); const ar4 = aumentoRecente(CU, [c], [...storia, k4.chiusa], '2026-03-31') as ARx;
  rigaF(r4.tolte.length === 0 && sintesi(k4.stato) === sintesi(st(CU, null, 16)) && a4.length === 2 && a4.some((x) => x.date === '2026-03-23' && x.cosa === 'manubrio successivo scelto, al massimo 14,5 kg') && a4.some((x) => x.date === '2026-03-26' && x.cosa === 'peso scritto da te, 12 → 16 kg') && ar4?.dal === '2026-04-02', '14.4', `26 a 16 → chiusura ${sintesi(k4.stato)} · aumenti ${auStr(a4)} · R13 dal ${String(ar4?.dal)}`);
  /* 14.5 */
  const r5 = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c], { kg: 10, id: 'S26' }); const k5 = chiudiB2(r5.draft, [c], storia, T0);
  const t145 = 'Oggi hai usato 10 kg, meno di prima: la scelta del lunedì 23 marzo (manubrio successivo, al massimo 14,5 kg) non è stata eseguita e si toglie. Da qui comanda quello che hai scritto: tempo e pausa tornano a quelli della scheda.';
  rigaF(r5.ev.blockedReason === t145 && r5.ev.suggestion === null && k5.records.length === 1 && sintesi(k5.stato) === sintesi(st(CU, null, 10)), '14.5', `26 a 10 → ${giu(r5.ev.blockedReason)} · chiusura ${sintesi(k5.stato)} · record ${String(k5.records.length)}`);
  /* 14.6 */
  const r6 = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c], { kg: 0, id: 'S26' }); const k6 = chiudiB2(r6.draft, [c], storia, T0);
  const t146 = 'Peso non scritto: lo stato resta 14,5 kg. Scrivi il peso la prossima volta: senza, su questo esercizio le leve non si valutano.';
  const storia6 = [...storia, k6.chiusa];
  const ancora = Dz === null ? null : Dz.sceltaInAttesa(CU, [c] as never, storia6, k6.stato, 'S30');
  const r6b = riepB2(CU, k6.stato, MAXC, '2026-03-30', storia6, [c], { kg: 12, id: 'S30', week: 4 }); const k6b = chiudiB2(r6b.draft, [c], storia6, k6.stato);
  rigaF(r6.tolte.length === 0 && fsB2(r6.ev) === 'r14e' && r6.ev.blockedReason === t146 && nonReps(r6.ev, t146) && sintesi(k6.stato) === sintesi(T0) && k6.records.length === 0 && ancora?.scelta.id === 'c23' && k6b.records.length === 1 && sintesi(k6b.stato) === sintesi(B0) && r6b.ev.blockedReason === t141.replace('Oggi', 'Oggi'), '14.6', `26 a 0 → ${fsB2(r6.ev)} ${giu(r6.ev.blockedReason)} · chiusura ${sintesi(k6.stato)} · in attesa ${String(ancora?.scelta.id)} · lunedì 30 a 12 → ${sintesi(k6b.stato)}, record ${String(k6b.records.length)}`);
  /* 14.7 zavorra */
  { const esa = bonusMax(vDi(TR).block);
    const Bz = st(TR, 6, 2.5, esa.e, esa.p); const Tz = st(TR, 6, 5, esa.e, esa.p);
    const cz = RI('cz', '2026-03-23', Bz, Tz, 'revisione-3:trazioni');
    const preT = S('pre', '2026-02-23', TR, 6, [1], { kg: 2.5 }); const t19 = S('t19', '2026-03-19', TR, 6, [vDi(TR).max, vDi(TR).max, vDi(TR).max], { kg: 2.5 });
    const rz = riepB2(TR, Tz, [vDi(TR).max, vDi(TR).max, vDi(TR).max], '2026-03-26', [preT, t19], [cz], { kg: 2.5, id: 'T26', tests: T12 }); const kz = chiudiB2(rz.draft, [cz], [preT, t19], Tz);
    const rv = rev(4, [preT, t19, kz.chiusa], kz.stato, [cz, ...kz.records], '2026-03-30', T12);
    rigaF(kz.records.length === 1 && sintesi(kz.stato) === sintesi(Bz) && rv.e.cat !== 'rimandati:decaduta' && rv.e.cat === rv.f.cat, '14.7', `trazioni 2,5 → 5, 26 a 2,5 → chiusura ${sintesi(kz.stato)}, record ${String(kz.records.length)} · revisione W4: engine ${rv.e.cat} ${rv.e.dopo ?? ''} · riferimento ${rv.f.cat}`); }
  /* OSS-T: con R14a closedRange è false e il riepilogo non chiede «Hai tenuto il tempo?» (SessionSummary: la domanda è
     dentro `evaluation.closedRange ?`). Il player scrive solo `false`: la seduta S resta con tempo null. Dove R14c non
     scatta (zavorra; gradino con bonus uguali) la coppia (19, 26) «vale» (14.7), ma con il tempo null la revisione dice
     «manca la risposta sul tempo… a fine seduta rispondi alla domanda», una domanda che a S non c'era. */
  { const esa = bonusMax(vDi(TR).block);
    const Bz = st(TR, 6, 2.5, esa.e, esa.p); const Tz = st(TR, 6, 5, esa.e, esa.p);
    const cz = RI('czt', '2026-03-23', Bz, Tz, 'revisione-3:trazioni');
    const preT = S('pre', '2026-02-23', TR, 6, [1], { kg: 2.5 }); const t19 = S('t19', '2026-03-19', TR, 6, [vDi(TR).max, vDi(TR).max, vDi(TR).max], { kg: 2.5 });
    const rz = riepB2(TR, Tz, [vDi(TR).max, vDi(TR).max, vDi(TR).max], '2026-03-26', [preT, t19], [cz], { kg: 2.5, id: 'T26', tests: T12, tempo: null }); const kz = chiudiB2(rz.draft, [cz], [preT, t19], Tz);
    const rv = rev(4, [preT, t19, kz.chiusa], kz.stato, [cz, ...kz.records], '2026-03-30', T12);
    const domanda = rz.ev.closedRange;
    OSST.push(`zavorra 2,5 → 5 tolta il 26: domanda sul tempo nel riepilogo del 26 ${domanda ? 'sì' : 'no'} · revisione W4 → ${rv.e.cat} «${rv.r.verdicts.find((x) => x.exercise === TR)?.change ?? ''}»`);
    const preP = S('pre', '2026-02-23', PU, 2, [1]); const p19 = S('p19', '2026-03-19', PU, 2, [18, 18, 18]);
    const cl = RI('clt', '2026-03-23', st(PU, 2), st(PU, 3), 'revisione-3:push-up', 'variant');
    const rl = riepB2(PU, st(PU, 3), [18, 18, 18], '2026-03-26', [preP, p19], [cl], { livello: 2, id: 'P26', tempo: null }); const kl = chiudiB2(rl.draft, [cl], [preP, p19], st(PU, 3));
    const rv2 = rev(4, [preP, p19, kl.chiusa], kl.stato, [cl, ...kl.records], '2026-03-30');
    OSST.push(`push-up 2 → 3 (bonus 0) tolta il 26: domanda sul tempo ${rl.ev.closedRange ? 'sì' : 'no'} · revisione W4 → ${rv2.e.cat} «${rv2.r.verdicts.find((x) => x.exercise === PU)?.change ?? ''}»`); }
  /* 14.8 gradino, R14c */
  { const preP = S('pre', '2026-02-23', PU, 2, [1]); const p19 = S('p19', '2026-03-19', PU, 2, [vDi(PU).max, vDi(PU).max, vDi(PU).max]);
    const Bl = st(PU, 2, 0, 1, 0); const Tl = st(PU, 3);
    const cl = RI('cl', '2026-03-23', Bl, Tl, 'revisione-3:push-up', 'variant');
    const rl = riepB2(PU, Tl, [vDi(PU).max, vDi(PU).max, vDi(PU).max], '2026-03-26', [preP, p19], [cl], { livello: 2, id: 'P26' }); const kl = chiudiB2(rl.draft, [cl], [preP, p19], Tl);
    const rv = rev(4, [preP, p19, kl.chiusa], kl.stato, [cl, ...kl.records], '2026-03-30');
    const tR14c = 'giovedì 26 marzo la scelta del lunedì 23 marzo (livello 2 → 3) non è stata eseguita e tempo e pausa sono tornati a quelli di prima. Le sedute lette non sono a questo stato: si giudica quando avrai due sedute allo stato di adesso.';
    const tl8 = 'Oggi hai fatto il livello 2, quello di prima: la scelta del lunedì 23 marzo (livello 2 → 3) non è stata eseguita e si toglie. Tempo e pausa tornano a quelli che avevi al livello 2. Il prossimo passo si valuta dalla prossima seduta.';
    rigaF(kl.records.length === 1 && sintesi(kl.stato) === sintesi(Bl) && rl.ev.blockedReason === tl8 && rv.e.cat === 'rimandati:decaduta' && rv.f.cat === 'rimandati:decaduta' && rv.r.rimandati.some((x) => x.testo === tR14c), '14.8', `push-up 2 → 3, 26 al 2 → ${giu(rl.ev.blockedReason)} · chiusura ${sintesi(kl.stato)} · revisione W4: engine ${rv.e.cat} · riferimento ${rv.f.cat} · ${rv.r.rimandati.map((x) => `«${x.testo}»`).join(' ')}`); }
  /* 14.9 scelta di fine seduta del 19, lunedì 23 a 12 */
  { const c9 = RI('c19', '2026-03-19', B0, T0, 'g19');
    const r9 = riepB2(CU, T0, MAXC, '2026-03-23', storia, [c9], { kg: 12, id: 'S23' }); const k9 = chiudiB2(r9.draft, [c9], storia, T0);
    rigaF(k9.records.length === 1 && k9.records[0]!.date === '2026-03-23' && sintesi(k9.stato) === sintesi(B0) && fsB2(r9.ev) === 'r14a', '14.9', `scelta nel riepilogo del 19, lunedì 23 a 12 → chiusura ${sintesi(k9.stato)} · record ${k9.records.map((x) => x.date).join(',') || 'nessuno'}`); }
  /* 14.10 scelta nata nel riepilogo di S */
  { const cS = RI('cS', '2026-03-26', B0, T0, 'S26');
    const r10 = riepB2(CU, B0, MAXC, '2026-03-26', storia, [], { kg: 12, id: 'S26' });
    const k10 = chiudiB2(r10.draft, [cS], storia, T0, T0);
    rigaF(k10.records.length === 0 && sintesi(k10.stato) === sintesi(T0), '14.10', `accettata nel riepilogo di S → chiusura ${sintesi(k10.stato)}, record ${String(k10.records.length)}`); }
  /* 14.11 revisione accettata mentre S è in corso */
  { const c11 = RI('c26r', '2026-03-26', B0, T0, 'revisione-4:curl');
    const draft = { ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 12 }), status: 'in-progress' as const };
    const k11 = chiudiB2(draft, [c11], storia, T0);
    const r11 = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c11], { kg: 12, id: 'S26' });
    rigaF(k11.records.length === 1 && sintesi(k11.stato) === sintesi(B0) && /^Oggi hai usato 12 kg, il peso di prima: la scelta del giovedì 26 marzo \(manubrio successivo, al massimo 14,5 kg\)/.test(r11.ev.blockedReason ?? ''), '14.11', `chiusura ${sintesi(k11.stato)} · record ${String(k11.records.length)} · riepilogo ricalcolato ${giu(r11.ev.blockedReason)}`); }
  /* 14.12 due sedute il 26 */
  { const ka = chiudiB2({ ...S('a26', '2026-03-26', CU, null, MAXC, { kg: 12 }), status: 'in-progress' }, [c], storia, T0);
    const regA: Reg[] = [c, ...ka.records]; const stA = [...storia, ka.chiusa];
    const kb = chiudiB2({ ...S('b26', '2026-03-26', CU, null, MAXC, { kg: 14 }), status: 'in-progress' }, regA, stA, ka.stato);
    const a12 = aum(CU, regA, [...stA, kb.chiusa]);
    rigaF(ka.records.length === 1 && kb.records.length === 0 && sintesi(kb.stato) === sintesi(st(CU, null, 14)) && a12.length === 1 && a12[0]!.date === '2026-03-26' && a12[0]!.cosa === 'peso scritto da te, 12 → 14 kg', '14.12', `prima a 12: record ${String(ka.records.length)}, ${sintesi(ka.stato)} · seconda a 14: ${sintesi(kb.stato)} · aumenti ${auStr(a12)}`); }
  /* 14.13 stato diverso da c.stateAfter */
  { const L13 = st(CU, null, 13);
    const k13 = chiudiB2({ ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 12 }), status: 'in-progress' }, [c], storia, L13);
    const oggi = statesToSave(syncStatesFromLog({ ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 12 }), status: 'in-progress' }, new Map([[CU, L13]])), new Map())[0] ?? L13;
    rigaF(k13.records.length === 0 && sintesi(k13.stato) === sintesi(oggi), '14.13', `stato {13} ≠ c.stateAfter → record ${String(k13.records.length)}, chiusura ${sintesi(k13.stato)} = sincronizzazione ${sintesi(oggi)}`); }
  /* 14.14, 14.15, 14.16: repository vero su MemoryStore (Firestore e Dexie non eseguiti) */
  try {
    const { ShadowRepository } = await import('../../src/db/repository.ts');
    const { MemoryStore } = await import('../../src/db/store.ts');
    const BK = await import('../../src/db/backup.ts');
    class Rotto extends MemoryStore { putTogether(): Promise<void> { return Promise.reject(new Error('scrittura fallita')); } }
    /* 14.14 */
    const repoR = new ShadowRepository(new Rotto());
    await repoR.store.put('suggestions', c); await repoR.saveExerciseState(T0); await repoR.saveSession(preC); await repoR.saveSession(g19);
    const d26 = { ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 12 }), status: 'in-progress' as const };
    const tl = decadenzeApp(d26, await repoR.listSuggestions() as never, await repoR.listSessions(), new Map([[CU, await repoR.getExerciseState(CU)]]));
    let errore = '';
    for (const t of tl) await repoR.recordDecision(t.record as never, t.stato).catch((e: Error) => { errore = e.message; });
    await repoR.saveSession({ ...d26, status: 'completed' });
    const dopoR = await repoR.listSuggestions(); const statoR = await repoR.getExerciseState(CU);
    const att = Dz === null ? null : Dz.sceltaInAttesa(CU, dopoR as never, await repoR.listSessions(), statoR, 'S30');
    rigaF(tl.length === 1 && errore === 'scrittura fallita' && !dopoR.some((x) => x.decision === 'lapsed') && sintesi(statoR) === sintesi(T0) && att?.scelta.id === 'c23', '14.14', `tolte ${String(tl.length)} · errore «${errore}» · dopo: lapsed ${String(dopoR.filter((x) => x.decision === 'lapsed').length)}, stato ${sintesi(statoR)} · alla chiusura dopo in attesa: ${String(att?.scelta.id)} (unitario: MemoryStore, non Firestore)`);
    /* 14.15 */
    const repo = new ShadowRepository(new MemoryStore());
    await repo.store.put('suggestions', c); await repo.saveExerciseState(T0); await repo.saveSession(preC); await repo.saveSession(g19);
    const regVecchio = await repo.listSuggestions(); const statoVecchio = await repo.getExerciseState(CU); const sesVecchie = await repo.listSessions();
    for (const t of decadenzeApp(d26, regVecchio as never, sesVecchie, new Map([[CU, statoVecchio]]))) await repo.recordDecision(t.record as never, t.stato);
    /* ricarica fra riepilogo e «Salva e chiudi», o doppio tocco: dati vecchi in memoria ⇒ stesso record; dati nuovi ⇒ niente */
    for (const t of decadenzeApp(d26, regVecchio as never, sesVecchie, new Map([[CU, statoVecchio]]))) await repo.recordDecision(t.record as never, t.stato);
    const nuovi = decadenzeApp(d26, await repo.listSuggestions() as never, await repo.listSessions(), new Map([[CU, await repo.getExerciseState(CU)]]));
    await repo.saveSession({ ...d26, status: 'completed' });
    const lap = (await repo.listSuggestions()).filter((x) => x.decision === 'lapsed');
    rigaF(lap.length === 1 && nuovi.length === 0 && sintesi(await repo.getExerciseState(CU)) === sintesi(B0), '14.15', `record lapsed dopo due chiusure: ${String(lap.length)} · ricalcolo con i dati salvati: ${String(nuovi.length)} · stato ${sintesi(await repo.getExerciseState(CU))}`);
    /* 14.16 */
    const json = BK.serializeBackup(await BK.exportBackup(repo));
    const repo2 = new ShadowRepository(new MemoryStore());
    let errImp = '';
    try { await BK.importBackup(repo2, BK.parseBackup(json)); } catch (e) { errImp = (e as Error).message; }
    const reg2 = await repo2.listSuggestions(); const ses2 = await repo2.listSessions();
    const lap2 = reg2.filter((x) => x.decision === 'lapsed');
    const r13a = JSON.stringify(aumentoRecente(CU, await repo.listSuggestions(), await repo.listSessions(), '2026-03-30'));
    const r13b = JSON.stringify(aumentoRecente(CU, reg2, ses2, '2026-03-30'));
    const aa = auStr(aum(CU, await repo.listSuggestions() as never, await repo.listSessions())); const ab = auStr(aum(CU, reg2 as never, ses2));
    rigaF(errImp === '' && lap2.length === 1 && lap2[0]!.ref === 'c23' && r13a === r13b && aa === ab, '14.16', `import ${errImp === '' ? 'riuscito' : `fallito: ${errImp}`} · lapsed ${String(lap2.length)} ref ${String(lap2[0]?.ref)} · R13 il 30 prima ${r13a} dopo ${r13b} · aumenti prima ${aa} dopo ${ab}`);
    globalThis.__B2_BACKUP = json;
  } catch (e) {
    rigaF(false, '14.14', `repository non eseguibile: ${(e as Error).message}`);
  }
  /* 14.17 */
  { const rvA = rev(4, storia1, k1.stato, reg1, '2026-03-30');
    const s30 = S('s30', '2026-03-30', CU, null, MAXC, { kg: 12 }); const s02 = S('s02', '2026-04-02', CU, null, MAXC, { kg: 12 });
    const rvB = rev(5, [...storia1, s30, s02], k1.stato, reg1, '2026-04-06');
    rigaF(rvA.e.cat === 'rimandati:decaduta' && rvA.f.cat === 'rimandati:decaduta' && rvB.e.cat !== 'rimandati:decaduta' && rvB.e.cat === rvB.f.cat, '14.17', `revisione W4 (oggi lunedì 30) → engine ${rvA.e.cat} · riferimento ${rvA.f.cat} · ${rvA.r.rimandati.map((x) => `«${x.testo}»`).join(' ')} · con 30 e 2 aprile a {12, +2, +2}, W5 → engine ${rvB.e.cat} · riferimento ${rvB.f.cat}`); }
  /* 15.12 */
  { const a = aum(CU, reg1, [...storia1, S('s30', '2026-03-30', CU, null, MAXC, { kg: 14 })]);
    rigaF(a.length === 1 && a[0]!.date === '2026-03-30' && a[0]!.cosa === 'peso scritto da te, 12 → 14 kg', '15.12', `c tolta (14.1), lunedì 30 a 14 → aumenti ${auStr(a)}`); }
  /* b.8 (R14e) e L2 */
  { const rb = riepB2(CU, B0, MAXC, '2026-03-26', storia, [], { kg: 0, id: 'S26' }); const kb = chiudiB2(rb.draft, [], storia, B0);
    rigaF(fsB2(rb.ev) === 'r14e' && rb.ev.blockedReason === 'Peso non scritto: lo stato resta 12 kg. Scrivi il peso la prossima volta: senza, su questo esercizio le leve non si valutano.' && sintesi(kb.stato) === sintesi(B0), 'b.8', `stato {12, +2, +2}, voce a 0 kg → ${fsB2(rb.ev)} ${giu(rb.ev.blockedReason)} · chiusura ${sintesi(kb.stato)} (L2: prima {0, 0, 0})`); }
  /* R14a livello con v < B (testo non in specifica): dice il vero? */
  { const preP = S('pre', '2026-02-23', PU, 3, [1]); const p19 = S('p19', '2026-03-19', PU, 3, [18, 18, 18]);
    for (const [id, Bl] of [['R14a.v<B (bonus)', st(PU, 3, 0, 1, 0)], ['R14a.v<B (senza bonus)', st(PU, 3)]] as const) {
      const cl = RI(`cl-${id}`, '2026-03-23', Bl, st(PU, 4), 'revisione-3:push-up', 'variant');
      const rl = riepB2(PU, st(PU, 4), [18, 18, 18], '2026-03-26', [preP, p19], [cl], { livello: 2, id: 'P26' }); const kl = chiudiB2(rl.draft, [cl], [preP, p19], st(PU, 4));
      const atteso = `Oggi hai fatto il livello 2, sotto quello di prima: la scelta del lunedì 23 marzo (livello 3 → 4) non è stata eseguita e si toglie. Da qui comanda quello che hai scritto${Bl.eccentricBonusSeconds > 0 ? ': tempo e pausa tornano a quelli della scheda' : ''}.`;
      const vero = rl.ev.blockedReason === null ? 'nessun testo' : veritaTesto(rl.ev.blockedReason, cl, kl.stato);
      rigaF(rl.ev.blockedReason === atteso && vero === null && sintesi(kl.stato) === sintesi(st(PU, 2)) && kl.records.length === 1, id, `push-up 3 → 4 (prima ${bon(Bl)}), 26 al 2 → ${giu(rl.ev.blockedReason)} · chiusura ${sintesi(kl.stato)} · verità: ${vero ?? 'sì'}`);
    } }
  /* R14a su un blocco senza range: il testo compare, nessuna leva oltre le ripetizioni */
  { const r = riepB2(CU, T0, MAXC, '2026-03-26', storia, [c], { kg: 12, id: 'S26' });
    const ev = evaluateProgression({ ...r.input, range: { kind: 'none' } } as never);
    rigaF(ev.blockedReason === t141 && ev.closedRange === false && fsB2(ev) === 'r14a' && ev.suggestion === null && nonReps(ev, t141), 'R14a.nr', `blocco senza range → ${fsB2(ev)} closedRange ${String(ev.closedRange)} ${giu(ev.blockedReason)}`); }
}

console.log('--- B2 · D-19 (b) ---');
{
  const MD = (P as Record<string, unknown>)['manubrioDopo'] as ((v: number, e?: readonly number[]) => { tipo: string; kg?: number }) | undefined;
  const md = (v: number, e?: readonly number[]): string => { if (MD === undefined) return 'assente'; const x = e === undefined ? MD(v) : MD(v, e); return x.tipo === 'successivo' ? String(x.kg) : x.tipo; };
  rigaF([3, 9, 10, 12, 22].map((x) => md(x)).join(',') === '4,10,12,14,24', 'D19.1', `3, 9, 10, 12, 22 → ${[3, 9, 10, 12, 22].map((x) => md(x)).join(', ')}`);
  rigaF([24, 0, 2, 11, 14.5, 26].map((x) => md(x)).join(',') === 'cima,mai-scritto,fuori-elenco,fuori-elenco,fuori-elenco,fuori-elenco', 'D19.2', `24, 0, 2, 11, 14,5, 26 → ${[24, 0, 2, 11, 14.5, 26].map((x) => md(x)).join(', ')}`);
  rigaF(md(4, [4, 8]) === 'oltre-s2', 'D19.3', `manubrioDopo(4, [4, 8]) → ${md(4, [4, 8])}`);
  { const M = (Metodo as Record<string, unknown>)['MANUBRI_KG'] as readonly number[] | undefined;
    const ok = M !== undefined && M.join(',') === MANUBRI_RIF.join(',') && M.every((x, i) => x > 0 && (i === 0 || (x > M[i - 1]! && x - M[i - 1]! <= 2.5)));
    rigaF(ok, 'D19.4', `MANUBRI_KG = ${M === undefined ? 'assente' : `[${M.join(', ')}]`} · decisione D-19 (b): [${MANUBRI_RIF.join(', ')}]`); }
  const pre = (kg: number) => S('pre', '2026-02-23', CU, null, [1], { kg });
  const s19 = (kg: number) => S('g19', '2026-03-19', CU, null, MAXC, { kg });
  const fine = (kg: number, extra: Reg[] = [], date = '2026-03-26', week?: number) => riepB2(CU, st(CU, null, kg, 2, 2), MAXC, date, [pre(kg), s19(kg)], extra, { kg, id: `F${String(kg)}`, ...(week === undefined ? {} : { week }) });
  const testoCambio = (B: number, N: number): string => `Passa al manubrio da ${kgIt(N)}: oggi usi ${kgIt(B)}. Tempo e pausa tornano a quelli della scheda. Nel player il peso parte da ${kgIt(B)}: quando prendi quello da ${kgIt(N)}, scrivilo in ogni serie. Da lì in poi comanda quello che scrivi.`;
  const f5 = fine(10); rigaF(f5.ev.suggestion?.lever === 'load' && f5.ev.suggestion.change === testoCambio(10, 12) && sintesi(f5.ev.suggestion.nextState) === sintesi(st(CU, null, 12)), 'D19.5', `{10} → ${leva(f5.ev)} «${String(f5.ev.suggestion?.change)}»`);
  const f6 = fine(3); rigaF(f6.ev.suggestion?.lever === 'load' && f6.ev.suggestion.change === testoCambio(3, 4) && sintesi(f6.ev.suggestion.nextState) === sintesi(st(CU, null, 4)), 'D19.6', `{3} → ${leva(f6.ev)} «${String(f6.ev.suggestion?.change)}»`);
  { const p23 = RI('p23', '2026-03-23', st(CU, null, 24, 2, 1), st(CU, null, 24, 2, 2), 'revisione-3:curl', 'iso-pause');
    const f7 = riepB2(CU, st(CU, null, 24, 2, 2), MAXC, '2026-03-26', [pre(24), s19(24), S('g24', '2026-03-24', CU, null, MAXC, { kg: 24 })], [p23], { kg: 24, id: 'F24' });
    const lv = f7.ev.levers.find((x) => x.lever === 'load');
    rigaF(f7.ev.suggestion === null && lv?.reason === '24 kg è il manubrio più pesante che hai: il manubrio non sale più.' && f7.ev.blockedReason === 'Hai esaurito tutte le leve disponibili su questo esercizio: 24 kg è il manubrio più pesante che hai. Serve un cambio di programmazione, non un altro giro.', 'D19.7', `{24} con pausa accettata il 23 → leva load «${String(lv?.reason)}» · «${String(f7.ev.blockedReason)}»`); }
  const f8 = fine(14.5); rigaF(f8.ev.suggestion === null && f8.ev.blockedReason === '14,5 kg non è fra i tuoi manubri: scrivi nel player il peso che usi davvero, e il prossimo si calcola da lì.', 'D19.8', `{14,5} → «${String(f8.ev.blockedReason)}»`);
  { const f9 = riepB2(CU, st(CU, null, 0, 2, 2), MAXC, '2026-03-26', [pre(0), s19(0)], [], { kg: 0, id: 'F0' });
    rigaF(f9.ev.suggestion === null && f9.ev.blockedReason === 'Peso mai scritto su questo esercizio: scrivi nel player il manubrio che usi, e il prossimo si calcola da lì.', 'D19.9', `{0}, seduta a 0 → ${fsB2(f9.ev)} «${String(f9.ev.blockedReason)}»`); }
  { const f10 = riepB2(CU, st(CU, null, 14.5, 2, 2), MAXC, '2026-03-12', [pre(14.5), S('g05', '2026-03-05', CU, null, MAXC, { kg: 14.5 })], [], { kg: 14.5, id: 'F10' });
    rigaF(f10.ev.suggestion === null && /^Fino alla settimana 3 il manubrio non si cambia/.test(f10.ev.blockedReason ?? ''), 'D19.10', `{14,5} in settimana 2 → «${String(f10.ev.blockedReason)}»`); }
  const sedRev = (kg: number) => [pre(kg), S('r12', '2026-03-12', CU, null, MAXC, { kg }), S('r19', '2026-03-19', CU, null, MAXC, { kg })];
  { const x = rev(3, sedRev(10), st(CU, null, 10, 2, 2), [], '2026-03-23'); const v = x.r.verdicts.find((y) => y.exercise === CU);
    rigaF(x.e.cat === 'v:aggiungi-peso' && x.f.cat === x.e.cat && x.e.dopo === x.f.dopo && v?.change === testoCambio(10, 12) && sintesi(v.stateAfter) === sintesi(st(CU, null, 12)), 'D19.11', `revisione W3 a 10 → engine ${x.e.cat} (${String(x.e.dopo)}) · riferimento ${x.f.cat} (${String(x.f.dopo)}) · «${String(v?.change)}»`); }
  { const x24 = rev(3, sedRev(24), st(CU, null, 24, 2, 2), [], '2026-03-23'); const x145 = rev(3, sedRev(14.5), st(CU, null, 14.5, 2, 2), [], '2026-03-23');
    const t24 = x24.r.alMassimo.find((y) => y.exercise === CU)?.testo; const t145 = x145.r.alMassimo.find((y) => y.exercise === CU)?.testo;
    rigaF(x24.e.cat === 'alMassimo:leve-finite' && x24.f.cat === x24.e.cat && t24 === 'Hai esaurito le leve su questo esercizio: 24 kg è il manubrio più pesante che hai. Serve un cambio di programmazione, non un altro giro.' && x145.e.cat === 'alMassimo:manubrio' && x145.f.cat === x145.e.cat && t145 === 'massimo chiuso su tutte le serie. 14,5 kg non è fra i tuoi manubri: scrivi nel player il peso che usi davvero, e il prossimo si calcola da lì.', 'D19.12', `{24} → ${x24.e.cat}/${x24.f.cat} «${String(t24)}» · {14,5} → ${x145.e.cat}/${x145.f.cat} «${String(t145)}»`); }
  { const c13 = RI('c13', '2026-03-23', st(CU, null, 10, 2, 2), st(CU, null, 12), 'revisione-3:curl');
    const a = aum(CU, [c13], [pre(10), s19(10)]); const ar = aumentoRecente(CU, [c13], [pre(10), s19(10)], '2026-03-27') as ARx;
    rigaF(a.length === 1 && a[0]!.date === '2026-03-23' && a[0]!.cosa === 'manubrio successivo scelto, 10 → 12 kg' && ar?.dal === '2026-03-30', 'D19.13', `aumenti ${auStr(a)} · R13 il 27: dal ${String(ar?.dal)}`); }
  { const a = aum(CU, [RI('c14', '2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14.5), 'revisione-3:curl')], [pre(12), s19(12)]);
    rigaF(a.length === 1 && a[0]!.cosa === 'manubrio successivo scelto, al massimo 14,5 kg', 'D19.14', `scelta vecchia → ${auStr(a)}`); }
  { const c15 = RI('c15', '2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14), 'revisione-3:curl');
    const k = chiudiB2({ ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 14 }), status: 'in-progress' }, [c15], [pre(12), s19(12)], st(CU, null, 14));
    const a = aum(CU, [c15], [pre(12), s19(12), k.chiusa]); const ar = aumentoRecente(CU, [c15], [pre(12), s19(12), k.chiusa], '2026-03-31') as ARx;
    rigaF(a.length === 1 && a[0]!.date === '2026-03-26' && a[0]!.cosa === 'carico 12 → 14 kg, scelta del lunedì 23 marzo' && ar?.dal === '2026-04-02' && sintesi(k.stato) === sintesi(st(CU, null, 14)), 'D19.15', `aumenti ${auStr(a)} · dal ${String(ar?.dal)} · stato ${sintesi(k.stato)}`); }
  { const c16 = RI('c16', '2026-03-23', st(CU, null, 10, 2, 2), st(CU, null, 12), 'revisione-3:curl');
    const k = chiudiB2({ ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 11 }), status: 'in-progress' }, [c16], [pre(10), s19(10)], st(CU, null, 12));
    const a = aum(CU, [c16], [pre(10), s19(10), k.chiusa]);
    const dopo = riepB2(CU, st(CU, null, 11, 2, 2), MAXC, '2026-04-02', [pre(10), s19(10), k.chiusa], [c16], { kg: 11, id: 'S02', week: 4 });
    rigaF(k.records.length === 0 && a.length === 1 && a[0]!.cosa === 'carico 10 → 11 kg, scelta del lunedì 23 marzo' && sintesi(k.stato) === sintesi(st(CU, null, 11)) && dopo.ev.suggestion === null && dopo.ev.blockedReason === '11 kg non è fra i tuoi manubri: scrivi nel player il peso che usi davvero, e il prossimo si calcola da lì.', 'D19.16', `26 a 11 → ${auStr(a)}, stato ${sintesi(k.stato)} · dopo, {11} esaurito → «${String(dopo.ev.blockedReason)}»`); }
  { const c17 = RI('c17', '2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14), 'revisione-3:curl');
    const k = chiudiB2({ ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 14.5 }), status: 'in-progress' }, [c17], [pre(12), s19(12)], st(CU, null, 14));
    const a = aum(CU, [c17], [pre(12), s19(12), k.chiusa]); const ar = aumentoRecente(CU, [c17], [pre(12), s19(12), k.chiusa], '2026-03-31') as ARx;
    rigaF(a.length === 2 && a.some((x) => x.date === '2026-03-23' && x.cosa === 'manubrio successivo scelto, 12 → 14 kg') && a.some((x) => x.date === '2026-03-26' && x.cosa === 'peso scritto da te, 12 → 14,5 kg') && sintesi(k.stato) === sintesi(st(CU, null, 14.5)) && ar?.dal === '2026-04-02', 'D19.17', `aumenti ${auStr(a)} · stato ${sintesi(k.stato)} · dal ${String(ar?.dal)}`); }
  { const c18 = RI('c18', '2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14), 'revisione-3:curl');
    const r = riepB2(CU, st(CU, null, 14), MAXC, '2026-03-26', [pre(12), s19(12)], [c18], { kg: 12, id: 'S26' }); const k = chiudiB2(r.draft, [c18], [pre(12), s19(12)], st(CU, null, 14));
    rigaF(r.ev.blockedReason === 'Oggi hai usato 12 kg, il peso di prima: la scelta del lunedì 23 marzo (manubrio successivo, 12 → 14 kg) non è stata eseguita e si toglie. Tempo e pausa tornano a quelli che avevi su 12 kg. Il prossimo passo si valuta dalla prossima seduta.' && sintesi(k.stato) === sintesi(st(CU, null, 12, 2, 2)), 'D19.18', `«${String(r.ev.blockedReason)}» · stato ${sintesi(k.stato)}`); }
  /* D19.19-D19.20: il peso del player come lo compone GuidedSession (PassoLavoro): kgDalloStato = B del manubrio in attesa,
     altrimenti lo stato; poi pesoIniziale(inherent, kgDalloStato, volta scorsa). Più il controllo statico della composizione. */
  { const PI = (await import('../../src/engine/draft.ts') as Record<string, unknown>)['pesoIniziale'] as ((a: boolean, b: number, c: number) => number) | undefined;
    const MA = Dz === null ? undefined : Dz.manubrioInAttesa;
    const c19 = RI('c19b', '2026-03-23', st(CU, null, 12, 2, 2), st(CU, null, 14), 'revisione-3:curl');
    const ma = MA === undefined ? null : MA(CU, [c19] as never, [pre(12), s19(12)], st(CU, null, 14), 'S26');
    const kgP = (prec: number) => (PI === undefined ? NaN : PI(true, ma?.B ?? 14, prec));
    const { readFileSync } = await import('node:fs');
    const gs = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
    const composto = /const kgDalloStato =\s*contesto\.manubriInAttesa\.get\([^)]*\)\?\.B \?\?\s*contesto\.states\.get\([^)]*\)\?\.loadKg \?\?\s*0;/.test(gs) && /pesoIniziale\(stazione\?\.esercizio\.loadPolicy === 'inherent', kgDalloStato, suggerito\?\.loadKg \?\? 0\)/.test(gs);
    const testo19 = 'Manubrio scelto: 14 kg. Il peso parte da 12 kg, quello di prima: se prendi quello da 14 kg, scrivilo in ogni serie. Se resti a 12 kg la scelta si toglie e tempo e pausa tornano come prima.';
    rigaF(ma?.B === 12 && ma.testo === testo19 && kgP(12) === 12 && kgP(0) === 12 && composto, 'D19.19', `in attesa 12 → 14: B ${String(ma?.B)} · peso con la volta scorsa a 12: ${String(kgP(12))}, senza volta scorsa: ${String(kgP(0))} · composizione in GuidedSession: ${String(composto)} · «${String(ma?.testo)}»`);
    const cz = RI('cz20', '2026-03-23', st(TR, 6, 2.5, 2, 2), st(TR, 6, 5, 2, 2), 'revisione-3:trazioni');
    const mz = MA === undefined ? 'assente' : MA(TR, [cz] as never, [], st(TR, 6, 5, 2, 2), 'T26');
    rigaF(mz === null && PI !== undefined && PI(false, 5, 2.5) === 5, 'D19.20', `zavorra 2,5 → 5 in attesa: manubrioInAttesa ${JSON.stringify(mz)} · peso ${String(PI === undefined ? 'assente' : PI(false, 5, 2.5))}`);
    const app = readFileSync('src/ui/App.tsx', 'utf8');
    const { ARCHIVED_SESSIONS } = await import('../../src/data/sessions.ts');
    const archManubri = (ARCHIVED_SESSIONS as readonly ProgramBlock[][] as never as { blocks: ProgramBlock[] }[]).flatMap((s) => s.blocks).filter((b) => LEVA_D19.has(b.exercise)).length;
    rigaF(/eCircuito\(route\.sessionId\)\s*\?\s*\(\s*<GuidedSession/.test(app) && archManubri === 0, 'D19.21', `NON APPLICABILE: SessionScreen apre solo le sedute fuori circuito (App.tsx), e nelle sedute archiviate i blocchi con un manubrio di D-19 sono ${String(archManubri)}`); }
}

/* P14 — proprietà su fixture casuali: decadenze del codice = predicato del testo; stato salvato = sincronizzazione da
   c.stateBefore; record; testo R14a = testo della specifica, e vero sullo stato salvato. Più syncStatesFromLog = syncRif. */
const P14 = { casi: 0, decadute: 0, perV: new Map<string, number>(), diversi: [] as string[], testi: [] as string[], verita: [] as string[], sync: [] as string[], syncCasi: 0, nessunNumeroSale: [] as string[] };
{
  const r14 = mulberry32(1414);
  const pk = <T,>(xs: readonly T[]): T => xs[Math.floor(r14() * xs.length)]!;
  const ES14 = [CU, 'military-press-manubri', 'rematore-manubrio-un-braccio', 'stacco-rumeno-manubri', TR, 'dip-parallele-anelli', PU, 'hip-thrust-panca-bilaterale', 'bulgarian-split-squat'] as ExerciseSlug[];
  const N14 = Number(process.env['P14'] ?? 20000);
  for (let n = 0; n < N14 && Dz !== null; n += 1) {
    const slug = pk(ES14); const v = vDi(slug); const pol = getExercise(slug).loadPolicy;
    const liv = v.pattern === null ? null : ((1 + Math.floor(r14() * 5)) as LevelIndex);
    const kgB = pol === 'forbidden' ? 0 : pk(pol === 'inherent' ? [3, 8, 10, 12, 14, 0, 7] : [0, 2.5, 5]);
    const before = st(slug, liv, kgB, Math.floor(r14() * 3), Math.floor(r14() * 3));
    const sulCarico = pol !== 'forbidden' && (v.pattern === null || r14() < 0.5);
    const after: ExerciseState = sulCarico
      ? { ...before, loadKg: kgB + (pol === 'inherent' ? pk([1, 2, 2, 2.5]) : 2.5), ...(pol === 'inherent' ? { eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 } : {}) }
      : { ...before, level: ((liv ?? 1) + 1) as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0 };
    const B = sulCarico ? before.loadKg : before.level!; const T = sulCarico ? after.loadKg : after.level!;
    const cDate = d(g('2026-03-09') + Math.floor(r14() * 14));
    const valore = (): number => { const u = r14(); return u < 0.35 ? B : u < 0.5 ? Math.max(sulCarico ? 0 : 1, B - (sulCarico ? pk([1, 2, 2.5]) : 1)) : u < 0.65 ? T : u < 0.75 ? (B + T) / 2 : u < 0.85 ? T + (sulCarico ? 2 : 1) : sulCarico ? 0 : B; };
    const sed = (id: string, date: string, x: number, status: LoggedSession['status'] = 'completed'): LoggedSession => {
      const kg = sulCarico ? x : before.loadKg; const lv = sulCarico ? (r14() < 0.05 && liv !== null && liv > 1 ? ((liv - 1) as LevelIndex) : liv) : (Math.min(6, Math.max(1, Math.round(x))) as LevelIndex);
      const kg2 = !sulCarico && pol !== 'forbidden' && r14() < 0.05 ? kg + 2 : kg;
      return S(id, date, slug, lv, [v.max, v.max], { kg: kg2, status });
    };
    const storia: LoggedSession[] = [sed(`h${String(n)}a`, piu(cDate, -5), B)];
    const nDopo = pk([0, 0, 1, 1, 2]);
    for (let i = 0; i < nDopo; i += 1) storia.push(sed(`h${String(n)}b${String(i)}`, piu(cDate, 1 + i), valore(), r14() < 0.85 ? 'completed' : 'abandoned'));
    const sDate = piu(cDate, 3 + nDopo);
    const Sid = `S${String(n)}`;
    const cSes = pk([`revisione-x:${slug}`, `revisione-x:${slug}`, storia[0]!.id, Sid, `h${String(n)}b0`]);
    const c0 = RI(`c${String(n)}`, cDate, before, after, cSes, sulCarico ? 'load' : 'variant');
    const reg: Reg[] = [c0];
    if (r14() < 0.08) reg.push(RI(`l${String(n)}`, cDate, after, before, 'x', c0.lever, 'lapsed', c0.id));
    if (r14() < 0.08) reg.push(RI(`k${String(n)}`, piu(cDate, -3), st(slug, liv, kgB, 0, 0), before, 'revisione-y', 'tempo'));
    const L = r14() < 0.9 ? after : { ...after, eccentricBonusSeconds: after.eccentricBonusSeconds + 1 };
    const vS = valore();
    const S0: LoggedSession = { ...sed(Sid, sDate, vS), status: 'in-progress' };
    if (r14() < 0.1) S0.exercises.push({ ...sed(Sid, sDate, valore()).exercises[0]!, blockCode: `${v.code}bis` });
    P14.casi += 1;
    const tolte = decadenzeApp(S0, reg, storia, new Map([[slug, L]]));
    const a = attesaRif(slug, L, reg, storia, S0);
    const decRif = a !== null && a.vS !== null && a.vS <= a.B;
    const t = tolte.find((x) => x.exercise === slug);
    const tag = `P14 #${String(n)} ${slug} c ${sintesi(before)}→${sintesi(after)} (${c0.sessionLogId}) stato ${sintesi(L)} S ${S0.exercises.map((x) => `liv ${String(x.level)} kg ${String(kgMax([x]))}`).join('+')}`;
    if ((t !== undefined) !== decRif) { P14.diversi.push(`${tag}: codice ${t === undefined ? 'non decade' : 'decade'}, testo ${decRif ? 'decade' : 'non decade'}`); continue; }
    if (t === undefined || a === null) continue;
    P14.decadute += 1;
    const vv = a.vS!;
    const kV = vv === a.B ? 'v = B' : 'v < B'; P14.perV.set(`${a.carico ? 'carico' : 'livello'} ${kV}`, (P14.perV.get(`${a.carico ? 'carico' : 'livello'} ${kV}`) ?? 0) + 1);
    const atteso = syncRif(S0.exercises, a.c.stateBefore);
    const rr = t.record;
    if (sintesi(t.stato) !== sintesi(atteso) || rr.decision !== 'lapsed' || rr.ref !== a.c.id || sintesi(rr.stateBefore) !== sintesi(a.c.stateAfter) || sintesi(rr.stateAfter) !== sintesi(t.stato) || rr.date !== S0.date || rr.sessionLogId !== S0.id) P14.diversi.push(`${tag}: stato ${sintesi(t.stato)} (testo ${sintesi(atteso)}) · record ${rr.decision} ${String(rr.ref)} ${sintesi(rr.stateBefore)}→${sintesi(rr.stateAfter)}`);
    const sale = a.carico ? t.stato.loadKg > a.B : (t.stato.level ?? 0) > a.B;
    if (sale) P14.nessunNumeroSale.push(`${tag}: ${sintesi(t.stato)}`);
    const tr = testoR14aRif(a, vv);
    if (tr !== null && tr !== t.testo) P14.testi.push(`${tag}: «${t.testo}» ≠ specifica «${tr}»`);
    const vero = veritaTesto(t.testo, a.c, t.stato);
    if (vero !== null && P14.verita.length < 2000) P14.verita.push(`${tag}: ${vero} · «${t.testo}»`);
  }
  /* syncStatesFromLog = syncRif su ingressi casuali (R14e, L2, D-23, manubrio cambiato, L24) */
  for (let n = 0; n < N14; n += 1) {
    const slug = pk(ES14); const v = vDi(slug); const pol = getExercise(slug).loadPolicy;
    const L = st(slug, v.pattern === null ? null : ((1 + Math.floor(r14() * 6)) as LevelIndex), pol === 'forbidden' ? 0 : pk([0, 2.5, 3, 10, 12, 14.5]), Math.floor(r14() * 3), Math.floor(r14() * 3));
    const voce = (): LoggedExercise => S('y', '2026-03-26', slug, v.pattern === null ? null : (r14() < 0.7 ? L.level : ((1 + Math.floor(r14() * 6)) as LevelIndex)), [v.max], { kg: pol === 'forbidden' ? 0 : r14() < 0.5 ? L.loadKg : pk([0, 2.5, 4, 10, 12]) }).exercises[0]!;
    const voci = r14() < 0.2 ? [voce(), { ...voce(), blockCode: `${v.code}bis` }] : [voce()];
    const sess: LoggedSession = { id: 'y', date: '2026-03-26', week: 4, sessionId: v.sid, status: 'in-progress', exercises: voci, note: null };
    const codice = syncStatesFromLog(sess, new Map([[slug, L]])).find((x) => x.exercise === slug) ?? L;
    const rif = syncRif(voci, L);
    P14.syncCasi += 1;
    if (sintesi(codice) !== sintesi(rif) && P14.sync.length < 200) P14.sync.push(`${slug} stato ${sintesi(L)} voci ${voci.map((x) => `liv ${String(x.level)} kg ${String(kgMax([x]))}`).join('+')}: codice ${sintesi(codice)} ≠ testo ${sintesi(rif)}`);
  }
}

/* Rollback a e30cdc6 (domanda 5 della sessione principale): il codice di produzione su un registro con record `lapsed`. */
const ROLL: string[] = [];
if (process.env['ROLLBACK'] !== undefined) {
  const R0 = process.env['ROLLBACK'];
  try {
    const Pv = (await import(`${R0}/src/engine/progression.ts`)) as typeof P;
    const Rv = (await import(`${R0}/src/engine/review.ts`)) as { reviewWeek: typeof reviewWeek };
    const Dv = (await import(`${R0}/src/engine/draft.ts`)) as Record<string, unknown>;
    const Bv = (await import(`${R0}/src/db/backup.ts`)) as Record<string, unknown>;
    const preC = S('pre', '2026-02-23', CU, null, [1], { kg: 12 }); const g19 = S('g19', '2026-03-19', CU, null, MAXC, { kg: 12 });
    const B0 = st(CU, null, 12, 2, 2); const T0 = st(CU, null, 14.5);
    const c = RI('c23', '2026-03-23', B0, T0, 'revisione-3:curl-martello-manubri');
    const k1 = chiudiB2({ ...S('S26', '2026-03-26', CU, null, MAXC, { kg: 12 }), status: 'in-progress' }, [c], [preC, g19], T0);
    const reg = [c, ...k1.records]; const ses = [preC, g19, k1.chiusa];
    const AUMv = (Pv as Record<string, unknown>)['aumenti'] as (s: ExerciseSlug, d: readonly DecisioneRegistrata[], x: readonly LoggedSession[]) => { date: string; cosa: string }[];
    ROLL.push(`aumenti (e30cdc6) dopo 14.1: ${auStr(AUMv(CU, reg, ses))} · nuovo codice: ${auStr(aum(CU, reg, ses))}`);
    for (const oggi of ['2026-03-27', '2026-03-30']) ROLL.push(`R13 il ${oggi}: e30cdc6 ${JSON.stringify((Pv as Record<string, unknown> as { aumentoRecente: AR })['aumentoRecente'](CU, reg, ses, oggi))} · nuovo ${JSON.stringify(aumentoRecente(CU, reg, ses, oggi))}`);
    const rv = Rv.reviewWeek({ week: 4, sessions: ses, states: new Map([[CU, k1.stato]]), tests: VUOTO, weekEnd: fineSett(4), today: '2026-03-30', decisioni: reg });
    const rn = reviewWeek({ week: 4, sessions: ses, states: new Map([[CU, k1.stato]]), tests: VUOTO, weekEnd: fineSett(4), today: '2026-03-30', decisioni: reg });
    const desc = (r: ReturnType<typeof reviewWeek>): string => [...daEngine(r)].map(([x, e]) => `${x} ${e.cat} ${e.dopo ?? ''}`).join(' · ') + ' ' + r.verdicts.map((x) => `«${x.change.slice(0, 90)}»`).join(' ');
    ROLL.push(`revisione W4 il 30, stato {12, +2, +2}, coppia (19, 26) con il 26 fatto a +0″/+0″: e30cdc6 → ${desc(rv)} · nuovo → ${desc(rn)}`);
    const SDv = Dv['sessionDecisions'] as (id: string, r: readonly unknown[], l: readonly unknown[], s: ReadonlyMap<ExerciseSlug, ExerciseState>) => { decided: Set<string>; accepted: Map<string, ExerciseState> };
    const sdv = SDv('S26', reg, [], new Map([[CU, k1.stato]]));
    ROLL.push(`sessionDecisions(S26) e30cdc6: decisi ${[...sdv.decided].join(',') || '—'} · accettate ${[...sdv.accepted.keys()].join(',') || '—'} (S26 è chiusa: nessuna schermata la riapre)`);
    const json = (globalThis as Record<string, unknown>)['__B2_BACKUP'] as string | undefined;
    if (json !== undefined) { let esito = 'importabile'; try { (Bv['parseBackup'] as (j: string) => unknown)(json); } catch (e) { esito = `rifiutato: ${(e as Error).message}`; } ROLL.push(`backup esportato da B2 con un record lapsed, letto da e30cdc6: ${esito}`); }
  } catch (e) { ROLL.push(`non eseguibile: ${(e as Error).message}`); }
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
const P1519 = { conFuturi: 0, confronti: 0, a: [] as string[], b: [] as string[], aAltre: 0, bAltre: 0 };
const MONDI = Number(process.env['MONDI'] ?? 2000);
const A2 = { confronti: 0, esiti: 0, conTetto: 0, cat: new Map<string, number>(), tipi: new Map<string, number>(), diff: [] as string[], testi: 0, testiEs: [] as string[], m227n: 0, m227: 0, m227es: [] as string[], p: nuovoM22P() };
for (let n = 0; n < MONDI; n += 1) {
  const { states, tests, sessions, decisioni } = mondo(rnd, n);
  if (process.env['DEBUG_MONDO'] === String(n)) {
    const sl = process.env['DEBUG_ES'] as ExerciseSlug;
    console.log(`MONDO ${String(n)} stato ${sintesi(states.get(sl)!)}`);
    for (const x of [...sessions].sort(ordina)) for (const y of x.exercises.filter((z) => z.exercise === sl)) console.log(`  seduta ${x.id} ${x.date} W${String(x.week)} ${x.status} liv ${String(y.level)} kg ${String(kgMax([y]))} valori ${y.sets.map((q) => q.value).join(',')} tempo ${String(y.tempoRespected)}`);
    for (const r of decisioni.filter((z) => z.exercise === sl)) console.log(`  scelta ${r.date} ${r.decision} ${sintesi(r.stateBefore)} → ${sintesi(r.stateAfter)} ${String(r.sessionLogId)}`);
    console.log(`  aumenti (riferimento): ${aumentiRif(sl, decisioni, sessions).map((a) => `${a.date} ${a.cosa}`).join(' · ')}`);
    const senza = sessions.filter((x) => x.date <= fineSett(2));
    console.log(`  aumenti senza le sedute dopo fine(W2): ${aumentiRif(sl, decisioni, senza).map((a) => `${a.date} ${a.cosa}`).join(' · ')}`);
  }
  for (let W = 1; W <= 8; W += 1) {
    const weekEnd = fineSett(W);
    for (const off of [0, 1, 3, 7, 8]) {
      const today = piu(weekEnd, off);
      const r = reviewWeek({ week: W, sessions, states, tests, weekEnd, today, decisioni });
      const f = riferimento(W, sessions, states, tests, weekEnd, today, decisioni);
      confronti += 1;
      const e = daEngine(r);
      const testa = `mondo ${String(n)} W${String(W)} oggi ${today}`;
      /* 15.19 (L23): (b) con un aumento datato dopo oggi, R13 ferma e dal ≥ d + 7; (a) con tutte le date ≤ oggi, uguale alla produzione */
      for (const slug of perSlug.keys()) {
        const xs = aum(slug, decisioni, sessions); if (xs.length === 0) continue;
        const ar = aumentoRecente(slug, decisioni, sessions, today) as ARx;
        const futuri = xs.filter((x) => x.date > today);
        if (futuri.length > 0) {
          P1519.conFuturi += 1;
          const dmax = futuri.map((x) => x.date).sort().at(-1)!;
          if (ar === null || ar.dal < piu(dmax, 7)) { if (P1519.b.length < 50) P1519.b.push(`${testa} ${slug}: aumento del ${dmax}, R13 ${ar === null ? 'nessuno' : `dal ${ar.dal}`}`); else P1519.bAltre += 1; }
        } else if (Pp !== null) {
          P1519.confronti += 1;
          const ap = ((Pp as Record<string, unknown>)['aumentoRecente'] as AR)(slug, decisioni, sessions, today);
          if (JSON.stringify(ap ?? null) !== JSON.stringify(ar)) { if (P1519.a.length < 50) P1519.a.push(`${testa} ${slug}: produzione ${JSON.stringify(ap)} ≠ ${JSON.stringify(ar)}`); else P1519.aAltre += 1; }
        }
      }
      if (r.stato !== f.stato) diff.push(`${testa}: stato ${r.stato} ≠ ${f.stato}`);
      if (r.sessionsCounted !== f.sessionsCounted) diff.push(`${testa}: sessionsCounted ${String(r.sessionsCounted)} ≠ ${String(f.sessionsCounted)}`);
      if (r.setsCounted !== f.setsCounted) diff.push(`${testa}: setsCounted ${String(r.setsCounted)} ≠ ${String(f.setsCounted)}`);
      for (const slug of new Set([...e.keys(), ...f.per.keys()])) {
        esiti += 1;
        const a = e.get(slug); const b = f.per.get(slug);
        categorie.set(b?.cat ?? 'assente', (categorie.get(b?.cat ?? 'assente') ?? 0) + 1);
        if (a?.cat !== b?.cat || (a?.dopo ?? '') !== (b?.dopo ?? '')) diff.push(`${testa} ${slug}: engine ${a?.cat ?? 'assente'} ${a?.dopo ?? ''} ≠ testo ${b?.cat ?? 'assente'} ${b?.dopo ?? ''}`);
      }
      /* A2 (M22): la stessa revisione con la durata, come Home e Revisione a f7f945d, contro il riferimento in due giri */
      if (durataApp !== undefined || process.env['A2'] === '1') {
        const r2 = reviewWeek({ week: W, sessions, states, tests, weekEnd, today, decisioni, ...(durataApp === undefined ? {} : { durata: durataApp }) } as Parameters<typeof reviewWeek>[0]);
        const f2 = riferimentoM22(W, sessions, states, tests, weekEnd, today, decisioni);
        const e2 = daEngine(r2);
        A2.confronti += 1;
        for (const slug of new Set([...e2.keys(), ...f2.per.keys()])) {
          A2.esiti += 1;
          const a = e2.get(slug); const b = f2.per.get(slug);
          if (b?.tetto === true) { A2.conTetto += 1; A2.cat.set(b.cat, (A2.cat.get(b.cat) ?? 0) + 1); }
          if (a?.cat !== b?.cat || (a?.dopo ?? '') !== (b?.dopo ?? '')) { const k = `engine ${a?.cat ?? 'assente'} ≠ testo ${b?.cat ?? 'assente'}${b?.pesoFuori === true ? ' [peso mai scritto o fuori elenco, col tetto]' : ''}`; A2.tipi.set(k, (A2.tipi.get(k) ?? 0) + 1); if (A2.diff.length < 200) A2.diff.push(`${testa} ${slug} ${sintesi(states.get(slug)!)}: ${k}`); }
          else if (b !== undefined) {
            const am = r2.alMassimo.find((x) => x.exercise === slug); const vd = r2.verdicts.find((x) => x.exercise === slug);
            let tOk = true;
            if (b.cat === 'alMassimo:tetto') tOk = am?.testo.startsWith(TESTO_TETTO_REV) ?? false; /* «Rifatto …» in coda quando ci sono sedute dopo fine(W) */
            else if (b.cat === 'alMassimo:variante') tOk = (am?.testo.startsWith(FRASE_VARIANTE_TETTO) ?? false) === (b.tetto === true);
            else if (b.cat === 'v:aggiungi-peso' && getExercise(slug).loadPolicy === 'inherent') tOk = (vd?.evidence.endsWith(EVIDENZA_TETTO) ?? false) === (b.tetto === true);
            if (!tOk) { A2.testi += 1; if (A2.testiEs.length < 6) A2.testiEs.push(`${testa} ${slug} ${b.cat} tetto ${String(b.tetto === true)}: «${am?.testo ?? vd?.evidence ?? ''}»`); }
          }
          /* M22.7: fuori dal circuito 4 l'uscita è identica a quella senza durata */
          if (perSlug.get(slug)?.sid !== 'circuito-4') { A2.m227n += 1; if (serialEs(r2, slug) !== serialEs(r, slug)) { A2.m227 += 1; if (A2.m227es.length < 4) A2.m227es.push(`${testa} ${slug}`); } }
        }
        m22P(A2.p, r2, states, W, today, sessions, decisioni, tests, testa);
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
          if (vv.policy === 'inherent') { D19P.rev += 1; const dk = v.stateAfter.loadKg - L.loadKg; if (!inElenco(L.loadKg) || !inElenco(v.stateAfter.loadKg) || !(Math.abs(dk - 1) < 1e-9 || Math.abs(dk - 2) < 1e-9)) prop.push(`D19.P ${testa} ${v.exercise}: ${String(L.loadKg)} → ${String(v.stateAfter.loadKg)} kg`); }
          else if (v.stateAfter.loadKg - L.loadKg !== 2.5) prop.push(`S2 ${testa} ${v.exercise}: passo ${String(v.stateAfter.loadKg - L.loadKg)} kg`);
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

/* -------- osservazione di ogni fine seduta simulata (C, C2, C2R) -------- */
const E7: string[] = [];
const E4ESEC = { tot: 0, scarico: 0, perFonte: new Map<string, number>(), es: [] as string[] };
const W56: string[] = []; const RV56: string[] = []; const S1exec: string[] = [];
const alloStato = (slug: ExerciseSlug, voce: LoggedExercise, L: ExerciseState): boolean => {
  const ex = getExercise(slug);
  return (ex.pattern === null || voce.level === L.level) && (ex.loadPolicy === 'forbidden' || kgMax([voce]) === L.loadKg);
};
interface Oss { valutate: number; nuove: number; prod: number; sparite: number; spariteAllo: number; spariteNonR14b: number; comparse: number; mancate: number; abusive: number; fuori: number; cause: Map<string, number>; es: string[]; r13: string[]; d21: Map<number, number>; d21tot: number; p246: string[]; m21: number; d23: number }
const OSS = new Map<string, Oss>();
const chiave = (e: ReturnType<typeof evaluateProgression>): string => (e.suggestion === null ? 'nessuna' : `${e.suggestion.lever} ${sintesi(e.suggestion.nextState)}`);
function osserva(tag: string, slug: ExerciseSlug, L: ExerciseState, logged: LoggedExercise, input: Parameters<typeof evaluateProgression>[0], ev: ReturnType<typeof evaluateProgression>, draft: LoggedSession, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[], date: string, tipoKg = '-'): void {
  const o = OSS.get(tag) ?? { valutate: 0, nuove: 0, prod: 0, sparite: 0, spariteAllo: 0, spariteNonR14b: 0, comparse: 0, mancate: 0, abusive: 0, fuori: 0, cause: new Map(), es: [], r13: [], d21: new Map(), d21tot: 0, p246: [], m21: 0, d23: 0 };
  OSS.set(tag, o);
  o.valutate += 1;
  const allo = alloStato(slug, logged, L);
  const fuori = (ev as unknown as Record<string, unknown>)['fuoriStato'] === 'r14b';
  if (fuori) o.fuori += 1;
  if (ev.suggestion !== null) o.nuove += 1;
  if (ev.suggestion !== null && !allo) { o.mancate += 1; if (o.es.length < 6) o.es.push(`MANCATA ${draft.id} ${slug} stato ${sintesi(L)} voce kg ${String(kgMax([logged]))} liv ${String(logged.level)} → ${leva(ev)}`); }
  if (fuori && allo) { o.abusive += 1; if (o.es.length < 6) o.es.push(`ABUSIVA ${draft.id} ${slug} stato ${sintesi(L)}`); }
  /* D-21 e E4: nessuna leva in salita a fine seduta in scarico né nella settimana prima */
  if (ev.suggestion !== null && (SCARICO.has(input.week) || SCARICO.has(input.week + 1))) W56.push(`${tag} ${draft.id} ${date} W${String(input.week)} ${slug} → ${leva(ev)}`);
  const rif = recenteRif(aumentiRif(slug, dec.filter((x) => x.sessionLogId !== draft.id), sessions, draft), date);
  const ar = input.aumentoRecente;
  if ((rif === undefined) !== (ar === null) || (rif !== undefined && ar !== null && rif.date !== ar.date)) { if (o.r13.length < 1000) o.r13.push(`${draft.id} ${date} ${slug}: engine ${ar === null ? '-' : `${ar.date} «${ar.cosa}»`} ≠ riferimento ${rif === undefined ? '-' : `${rif.date} ${rif.cosa}`}`); }
  if (ev.blockedReason?.startsWith('Primo peso scritto') === true) o.m21 += 1;
  if (Pp !== null) {
    const evp = Pp.evaluateProgression(input);
    if (evp.suggestion !== null) o.prod += 1;
    /* 24.6 + conteggio D-21: sullo stesso ingresso (una voce per esercizio) l'esito è quello della produzione, salvo D-21 (settimane 5, 11, 17), il testo M21 e la parte D-23 del testo R14b livello */
    const d21 = ev.suggestion === null && ev.blockedReason === TESTO_D21 && SCARICO.has(input.week + 1);
    if (chiave(evp) !== chiave(ev)) {
      if (d21 && evp.suggestion !== null) { o.d21tot += 1; o.d21.set(input.week, (o.d21.get(input.week) ?? 0) + 1); }
      else if (o.p246.length < 400) o.p246.push(`${draft.id} ${date} W${String(input.week)} ${slug} stato ${sintesi(L)}: produzione ${chiave(evp)} «${String(evp.blockedReason)}» ≠ ${chiave(ev)} «${String(ev.blockedReason)}»`);
    } else if (evp.blockedReason !== ev.blockedReason) {
      const m21 = ev.blockedReason?.startsWith('Primo peso scritto su questo esercizio: ') === true && evp.blockedReason?.startsWith('Oggi hai usato ') === true;
      const d23 = (evp.blockedReason ?? '').replace(': da qui comanda quello che hai scritto.', ': da qui comanda quello che hai scritto, e tempo e pausa tornano a quelli della scheda.') === ev.blockedReason;
      if (d23) o.d23 += 1;
      if (!(m21 || d21 || d23) && o.p246.length < 400) o.p246.push(`${draft.id} ${date} W${String(input.week)} ${slug}: testo produzione «${String(evp.blockedReason)}» ≠ «${String(ev.blockedReason)}»`);
    }
    if (evp.suggestion !== null && ev.suggestion === null) {
      o.sparite += 1;
      if (!fuori) o.spariteNonR14b += 1;
      if (allo) o.spariteAllo += 1;
    }
    if (evp.suggestion === null && ev.suggestion !== null) o.comparse += 1;
  }
}
function s1Esecuzione(tag: string, slug: ExerciseSlug, sessions: readonly LoggedSession[]): void {
  let prec: number | null = null; let ultima: string | null = null;
  for (const s of sessions.filter((x) => x.status === 'completed').slice().sort(ordina)) {
    const v = livRif(s.exercises.filter((x) => x.exercise === slug));
    if (v === null) continue;
    if (prec !== null && v > prec) { if (ultima !== null && g(s.date) - g(ultima) < 14) S1exec.push(`${tag}: salite eseguite il ${ultima} e il ${s.date}`); ultima = s.date; }
    prec = v;
  }
}
function e7(tag: string, slug: ExerciseSlug, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[]): void {
  const ord = new Map(sessions.map((x, n) => [x.id, n]));
  const primaDel = (date: string): number => { const n = sessions.findIndex((x) => x.date >= date); return n === -1 ? sessions.length : n; };
  const posScelta = (a: AumentoRif): number => (a.ref !== undefined && ord.has(a.ref) ? ord.get(a.ref)! + 0.5 : primaDel(a.scelta!) - 0.5);
  const pos = (a: AumentoRif): number => (a.sid !== undefined && ord.has(a.sid) ? ord.get(a.sid)! : a.scelta !== undefined ? posScelta(a) : primaDel(a.date));
  /* E4 all'esecuzione, ogni via: scelta in salita accettata fuori scarico ed eseguita alla prima seduta dopo, in scarico */
  for (const c of dec) {
    if (c.exercise !== slug || c.decision !== 'accepted' || tolteDi(dec).has(c.id ?? '')) continue;
    const su = c.stateAfter.eccentricBonusSeconds > c.stateBefore.eccentricBonusSeconds || c.stateAfter.bottomPauseBonusSeconds > c.stateBefore.bottomPauseBonusSeconds || c.stateAfter.loadKg > c.stateBefore.loadKg || (c.stateAfter.level ?? 0) > (c.stateBefore.level ?? 0);
    if (!su) continue;
    const fineSeduta = ord.has(c.sessionLogId ?? '');
    const dopo = sessions[fineSeduta ? ord.get(c.sessionLogId!)! + 1 : primaDel(c.date)];
    E4ESEC.tot += 1;
    if (dopo !== undefined && SCARICO.has(dopo.week) && !SCARICO.has(settDi(c.date))) {
      E4ESEC.scarico += 1;
      const k = `${fineSeduta ? 'fine seduta' : 'revisione'} in W${String(settDi(c.date))}`;
      E4ESEC.perFonte.set(k, (E4ESEC.perFonte.get(k) ?? 0) + 1);
      if (E4ESEC.es.length < 4) E4ESEC.es.push(`${tag}: ${k}, scelta il ${c.date}, eseguita il ${dopo.date} (W${String(dopo.week)}, scarico)`);
    }
  }
  const au = aumentiRif(slug, dec, sessions);
  for (const j of au) {
    if (j.fonte !== 'registro' || j.scelta === undefined) continue;
    for (const i of au) {
      if (i === j || pos(i) >= posScelta(j)) continue;
      if (g(j.date) - g(i.date) < 7) { E7.push(`${tag}: ${j.cosa} (scelta ${j.scelta}, conta dal ${j.date}) a ${String(g(j.date) - g(i.date))} giorni da ${i.cosa} (${i.fonte}, ${i.date})`); break; }
    }
  }
}
/* gli ingressi B1 della fine seduta, come li passa il riepilogo */
const ingressoB1 = (slug: ExerciseSlug, draft: LoggedSession, sessions: readonly LoggedSession[]) => {
  const stessi = draft.exercises.filter((x) => x.exercise === slug);
  return { caricoMassimoSeduta: kgMax(stessi), livelloMassimoSeduta: livelloVociP === undefined ? undefined : livelloVociP(stessi), pesoScrittoPrima: sessions.some((s) => s.status === 'completed' && s.id !== draft.id && s.exercises.some((x) => x.exercise === slug && x.sets.some((y) => y.loadKg > 0))) };
};


/* ============================================== B2 · osservazione ===== */
const CAL = { sedute: 0, aggiungi: 0, conR13: 0, scarico: 0, settPrima: 0, r14a: 0, fuoriElenco: 0, tempoNonSi: 0, perEs: new Map<string, number>(), es: [] as string[] };
const B2 = { revConf: 0, revConLapsed: 0, revDecaduta: 0, revDiff: [] as string[], lapsed: 0, valutate: 0, r14a: 0, r14aKo: [] as string[], predicato: [] as string[], m18: [] as string[], numeri: [] as string[], verita: [] as string[] };
function osservaB2(tag: string, slug: ExerciseSlug, L: ExerciseState, ev: ReturnType<typeof evaluateProgression>, tolte: readonly Tolta[], draft: LoggedSession, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[]): void {
  B2.valutate += 1;
  /* B14 (nuovo, preesistente): il riquadro di calibrazione del riepilogo (SessionSummary: calibrateLoad su ogni blocco con
     un peso scritto) dice «Aggiungi 2,5 kg» senza i cancelli delle leve: R13, E4/D-21, S3, D-19 (b), R14a. */
  { const voci = draft.exercises.filter((x) => x.exercise === slug && x.sets.length > 0);
    for (const voce of voci) {
      const kgV = kgMax([voce]); if (kgV <= 0) continue;
      CAL.sedute += 1;
      const cal = calDaMostrare === undefined ? calibrateLoad(voce.sets, kgV) : calDaMostrare('circuit', voce.sets, kgV);
      if (cal === null || cal.adjustment !== 'increase' || cal.message === null) continue;
      CAL.aggiungi += 1; CAL.perEs.set(slug, (CAL.perEs.get(slug) ?? 0) + 1);
      const r13 = /7 giorni/.test(ev.blockedReason ?? '');
      if (r13) CAL.conR13 += 1;
      if (SCARICO.has(draft.week)) CAL.scarico += 1;
      if (SCARICO.has(draft.week + 1)) CAL.settPrima += 1;
      if (fsB2(ev) === 'r14a') CAL.r14a += 1;
      if (voce.tempoRespected !== true) CAL.tempoNonSi += 1;
      if (getExercise(slug).loadPolicy === 'inherent' && !inElenco(cal.suggestedKg)) CAL.fuoriElenco += 1;
      if (CAL.es.length < 4 && (r13 || SCARICO.has(draft.week))) CAL.es.push(`${tag} ${draft.id} ${draft.date} W${String(draft.week)} ${slug} ${String(kgV)} kg, ripetizioni ${voce.sets.map((x) => x.value).join('-')}: «${cal.message}» · riepilogo: «${String(ev.blockedReason ?? (ev.suggestion === null ? '' : ev.suggestion.title))}»`);
    } }
  /* D19.P: ogni proposta nuova di manubrio è il successivo dell'elenco, +1 o +2 kg, mai da fuori elenco o da 0 */
  const sg = ev.suggestion;
  if (sg !== null && sg.lever === 'load' && getExercise(slug).loadPolicy === 'inherent') {
    D19P.fs += 1;
    const dk = sg.nextState.loadKg - L.loadKg;
    if (!inElenco(L.loadKg) || !inElenco(sg.nextState.loadKg) || !(Math.abs(dk - 1) < 1e-9 || Math.abs(dk - 2) < 1e-9)) D19P.viol.push(`${tag} ${draft.id} ${slug}: ${String(L.loadKg)} → ${String(sg.nextState.loadKg)} kg`);
  }
  const t = tolte.find((x) => x.exercise === slug);
  const a = attesaRif(slug, L, dec, sessions, draft);
  const decRif = a !== null && a.vS !== null && a.vS <= a.B;
  if ((t !== undefined) !== decRif && B2.predicato.length < 400) B2.predicato.push(`${tag} ${draft.id} ${draft.date} ${slug} stato ${sintesi(L)}: codice ${t === undefined ? 'non toglie' : 'toglie'}, testo ${decRif ? 'toglie' : 'non toglie'}`);
  if (t !== undefined) {
    B2.r14a += 1;
    if (ev.suggestion !== null || fsB2(ev) !== 'r14a' || ev.blockedReason !== t.testo) B2.r14aKo.push(`${tag} ${draft.id} ${slug}: ${leva(ev)} ${fsB2(ev)}`);
    const atteso = syncRif(draft.exercises, (t as unknown as { scelta: Reg }).scelta.stateBefore);
    if (sintesi(atteso) !== sintesi(t.stato)) B2.numeri.push(`${tag} ${draft.id} ${slug}: stato ${sintesi(t.stato)} ≠ testo ${sintesi(atteso)}`);
    const vero = veritaTesto(t.testo, (t as unknown as { scelta: Reg }).scelta, t.stato);
    if (vero !== null && B2.verita.length < 400) B2.verita.push(`${tag} ${draft.id} ${slug}: ${vero} · «${t.testo}»`);
  }
  /* M18: una scelta di manubrio in attesa, seduta al peso di prima ⇒ alla chiusura tempo e pausa non si perdono */
  if (a !== null && a.carico && getExercise(slug).loadPolicy === 'inherent' && a.vS === a.B && t === undefined) B2.m18.push(`${tag} ${draft.id} ${slug}: manubrio in attesa, seduta a ${String(a.B)} kg, non tolta`);
}

/* ============================================================ C ======= */
const viol: string[] = []; const s1: string[] = []; const s2: string[] = [];
const sim = mulberry32(16);
const SIM_ES = [TR, PU, CU, 'military-press-manubri', 'rematore-manubrio-un-braccio', 'hip-thrust-panca-bilaterale', 'dip-parallele-anelli', 'curl-panca-inclinata', PO, 'bulgarian-split-squat'] as ExerciseSlug[];
const ATLETI = Number(process.env['ATLETI'] ?? 400);
const testsSim = new Map<TestId, TestResult>([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 }], ['dip' as TestId, { testId: 'dip' as TestId, date: '2026-02-23', week: 0, value: 14 }]]);
let aumentiApp = 0; let aumentiMano = 0; let sedC = 0;
for (let run = 0; run < ATLETI; run += 1) {
  const slug = SIM_ES[run % SIM_ES.length]!; const v = vDi(slug); const ex = getExercise(slug);
  const passi = [[2], [3], [4], [7], [1, 2, 4], [0, 3, 4]][Math.floor(run / SIM_ES.length) % 6]!;
  let L: ExerciseState = { exercise: slug, level: v.pattern === null ? null : (v.pattern === 'vertical-pull' || v.pattern === 'dip' ? 5 : 4) as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: v.policy === 'forbidden' ? 0 : 10 };
  const sessions: LoggedSession[] = []; const dec: DecisioneRegistrata[] = [];
  const eventi: { date: string; tipo: string; fonte: 'app' | 'mano'; id: string }[] = [];
  let giorno = g(INIZIO); let k = 0; let rivista = 0;
  while (giorno < g(INIZIO) + 7 * SETT) {
    const date = d(giorno); const week = settDi(date);
    for (let W = rivista + 1; W < week; W += 1) {
      if (date <= piu(fineSett(W), 7)) {
        const r = reviewWeek({ week: W, sessions, states: new Map([[slug, L]]), tests: testsSim, weekEnd: fineSett(W), today: date, decisioni: dec }); { const f = riferimento(W, sessions, new Map([[slug, L]]), testsSim, fineSett(W), date, dec).per.get(slug); const e = daEngine(r).get(slug); B2.revConf += 1; if (dec.some((x) => x.exercise === slug && x.decision === 'lapsed')) B2.revConLapsed += 1; if ((e?.cat ?? '-') !== (f?.cat ?? '-') || (e?.dopo ?? '') !== (f?.dopo ?? '')) B2.revDiff.push(`W${String(W)} ${date} ${slug}: engine ${e?.cat ?? '-'} ${e?.dopo ?? ''} ≠ testo ${f?.cat ?? '-'} ${f?.dopo ?? ''}`); if (e?.cat === 'rimandati:decaduta') B2.revDecaduta += 1; }
        const ver = r.verdicts.find((x) => x.exercise === slug);
        if (ver !== undefined) {
          if ((ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso') && SCARICO.has(W + 1)) RV56.push(`C run ${String(run)} revisione W${String(W)} del ${date}: ${ver.kind}`);
          dec.push({ id: nuovoId(), date, exercise: slug, decision: 'accepted', stateBefore: ver.stateBefore, stateAfter: ver.stateAfter, sessionLogId: `revisione-${String(W)}:${slug}` });
          if (ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso') { eventi.push({ date, tipo: ver.kind, fonte: 'app', id: `rev${String(W)}`, cid: dec.at(-1)!.id }); aumentiApp += 1; }
          L = ver.stateAfter;
        }
      }
      rivista = W;
    }
    const mano = v.policy !== 'forbidden' && sessions.length > 0 && sim() < 0.08;
    const kg = mano ? L.loadKg + (v.policy === 'inherent' ? 2 : 2.5) : L.loadKg;
    const sopra = sim() < 0.7 ? v.max + (sim() < 0.3 ? 1 : 0) : v.max - 1;
    const giri = SCARICO.has(week) ? 2 : 3;
    const draft: LoggedSession = { ...S(`r${String(run)}-${String(k).padStart(3, '0')}`, date, slug, L.level, Array.from({ length: giri }, () => sopra), { kg, tempo: sim() < 0.9 ? true : null }), status: 'in-progress' };
    const logged = draft.exercises[0]!;
    if (mano) { eventi.push({ date, tipo: `peso ${String(L.loadKg)}→${String(kg)}`, fonte: 'mano', id: draft.id }); aumentiMano += 1; }
    const tolte = decadenzeApp(draft, dec, sessions, new Map([[slug, L]])); const input = { block: v.block, exercise: ex, state: L, logged, range: resolveBlockRange(v.block, ex, testsSim), week, currentMaxReps: v.pattern === null ? null : (testsSim.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(slug, L.level, sessions, date, draft), rientro: null, aumentoRecente: aumentoRecente(slug, dec.filter((x) => x.sessionLogId !== draft.id && !idTolti(tolte).has(x.id ?? '')), sessions, date, draft), ...ingressoB1(slug, draft, sessions), decaduta: tolte.find((t) => t.exercise === slug)?.testo ?? null } as Parameters<typeof evaluateProgression>[0];
    const ev = evaluateProgression(input); sedC += 1;
    osservaB2('C', slug, L, ev, tolte, draft, dec, sessions); osserva('C', slug, L, logged, input, ev, draft, dec.filter((x) => !idTolti(tolte).has(x.id ?? '')), sessions, date, mano ? 'su' : 'proposto');
    const accettate = new Map<ExerciseSlug, ExerciseState>();
    if (ev.suggestion !== null) {
      dec.push({ id: nuovoId(), date, exercise: slug, decision: 'accepted', stateBefore: L, stateAfter: ev.suggestion.nextState, sessionLogId: draft.id });
      eventi.push({ date, tipo: ev.suggestion.lever, fonte: 'app', id: draft.id, cid: dec.at(-1)!.id }); aumentiApp += 1;
      accettate.set(slug, ev.suggestion.nextState);
    }
    const chiusa: LoggedSession = { ...draft, status: 'completed' };
    sessions.push(chiusa);
    { const tl = decadenzeApp(draft, dec, sessions, new Map([[slug, L]])); const tolti = new Set(tl.map((t) => t.exercise)); for (const nuovo of statesToSave(syncStatesFromLog(chiusa, new Map([[slug, L]])), accettate)) if (!tolti.has(nuovo.exercise)) L = nuovo; for (const t of tl) { dec.push(t.record); B2.lapsed += 1; L = t.stato; accettate.delete(t.exercise); } }
    L = accettate.get(slug) ?? L;
    const passo = passi[k % passi.length]!;
    giorno += passo === 0 ? 0 : passo; k += 1;
    if (passo === 0 && k > 300) break;
  }
  for (const e of eventi.filter((x) => x.fonte === 'app' && !tolteDi(dec).has((x as { cid?: string }).cid ?? ''))) {
    const altro = eventi.find((x) => eventi.indexOf(x) < eventi.indexOf(e) && !tolteDi(dec).has((x as { cid?: string }).cid ?? '') && g(e.date) - g(x.date) < 7);
    if (altro !== undefined) viol.push(`run ${String(run)} ${slug} passi ${passi.join('/')}: ${e.tipo} il ${e.date} dopo ${altro.tipo} (${altro.fonte}) il ${altro.date}`);
  }
  const salite = eventi.filter((x) => (x.tipo === 'sali-di-livello' || x.tipo === 'variant') && !tolteDi(dec).has((x as { cid?: string }).cid ?? ''));
  for (let i = 1; i < salite.length; i += 1) if (g(salite[i]!.date) - g(salite[i - 1]!.date) < 14) s1.push(`run ${String(run)} ${slug}: ${salite[i - 1]!.date} e ${salite[i]!.date}`);
  const carichi = eventi.filter((x) => x.fonte === 'app' && (x.tipo === 'aggiungi-peso' || x.tipo === 'load') && !tolteDi(dec).has((x as { cid?: string }).cid ?? ''));
  for (let i = 1; i < carichi.length; i += 1) if (g(carichi[i]!.date) - g(carichi[i - 1]!.date) < 7) s2.push(`run ${String(run)} ${slug}: ${carichi[i - 1]!.date} e ${carichi[i]!.date}`);
  s1Esecuzione(`C run ${String(run)} ${slug}`, slug, sessions);
  e7(`C run ${String(run)} ${slug}`, slug, dec, sessions);
}

/* ===================================================== C2 e C2R ====== */
/* C2 come in `15` (stato iniziale 0 kg, peso del player, manubrio a B/T−0,5/T, pesi su e giù a mano, gradino sotto lo
   stato 4%); C2R uguale con sedute più rade (8-11 giorni), per le scelte eseguite una settimana dopo. */
const C2conti = new Map<string, { aumenti: number; viol: string[]; s1: string[]; sedute: number }>();
function simulaC2(tag: string, seme: number, schemi: number[][]): void {
  const sim2 = mulberry32(seme);
  const conti = { aumenti: 0, viol: [] as string[], s1: [] as string[], sedute: 0 }; C2conti.set(tag, conti);
  for (let run = 0; run < ATLETI; run += 1) {
    const slug = SIM_ES[run % SIM_ES.length]!; const v = vDi(slug); const ex = getExercise(slug);
    const passi = schemi[Math.floor(run / SIM_ES.length) % schemi.length]!;
    let L: ExerciseState = { exercise: slug, level: v.pattern === null ? null : (v.pattern === 'vertical-pull' || v.pattern === 'dip' ? 5 : 4) as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 };
    const sessions: LoggedSession[] = []; const dec: DecisioneRegistrata[] = [];
    const eventi: { date: string; tipo: string; fonte: 'app' | 'mano'; id: string }[] = [];
    let giorno = g(INIZIO); let k = 0; let rivista = 0; let ultimoKg = 0;
    while (giorno < g(INIZIO) + 7 * SETT) {
      const date = d(giorno); const week = settDi(date);
      for (let W = rivista + 1; W < week; W += 1) {
        if (date <= piu(fineSett(W), 7)) {
          const r = reviewWeek({ week: W, sessions, states: new Map([[slug, L]]), tests: testsSim, weekEnd: fineSett(W), today: date, decisioni: dec }); { const f = riferimento(W, sessions, new Map([[slug, L]]), testsSim, fineSett(W), date, dec).per.get(slug); const e = daEngine(r).get(slug); B2.revConf += 1; if (dec.some((x) => x.exercise === slug && x.decision === 'lapsed')) B2.revConLapsed += 1; if ((e?.cat ?? '-') !== (f?.cat ?? '-') || (e?.dopo ?? '') !== (f?.dopo ?? '')) B2.revDiff.push(`W${String(W)} ${date} ${slug}: engine ${e?.cat ?? '-'} ${e?.dopo ?? ''} ≠ testo ${f?.cat ?? '-'} ${f?.dopo ?? ''}`); if (e?.cat === 'rimandati:decaduta') B2.revDecaduta += 1; }
          const ver = r.verdicts.find((x) => x.exercise === slug);
          if (ver !== undefined) {
            if ((ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso') && SCARICO.has(W + 1)) RV56.push(`${tag} run ${String(run)} revisione W${String(W)} del ${date}: ${ver.kind}`);
            dec.push({ id: nuovoId(), date, exercise: slug, decision: 'accepted', stateBefore: ver.stateBefore, stateAfter: ver.stateAfter, sessionLogId: `revisione-${String(W)}:${slug}` });
            if (ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso') { eventi.push({ date, tipo: ver.kind, fonte: 'app', id: `rev${String(W)}`, cid: dec.at(-1)!.id }); conti.aumenti += 1; }
            L = ver.stateAfter;
          }
        }
        rivista = W;
      }
      const inherent = v.policy === 'inherent'; const forbidden = v.policy === 'forbidden';
      let kg = forbidden ? 0 : inherent && ultimoKg > 0 ? ultimoKg : L.loadKg > 0 ? L.loadKg : ultimoKg;
      let tipoKg = 'proposto';
      if (inherent && sessions.length === 0) { kg = 10; tipoKg = 'prima'; }
      else if (inherent && L.loadKg > ultimoKg && ultimoKg > 0) { const u = sim2(); kg = u < 0.4 ? ultimoKg : u < 0.8 ? Math.max(ultimoKg + 0.5, L.loadKg - 0.5) : L.loadKg; tipoKg = 'manubrio'; }
      else if (!forbidden && sessions.length > 0) { const u = sim2(); if (u < 0.06) { kg += inherent ? 2 : 2.5; tipoKg = 'su'; } else if (u < 0.11) { kg = Math.max(inherent ? 2 : 0, kg - (inherent ? 2 : 2.5)); tipoKg = 'giu'; } }
      const livello = v.pattern !== null && L.level !== null && L.level > 1 && sim2() < 0.04 ? ((L.level - 1) as LevelIndex) : L.level;
      const prec = sessions.at(-1); const kgPrec = prec === undefined ? null : kgMax(prec.exercises.filter((x) => x.exercise === slug));
      if (tipoKg === 'su' || (kgPrec !== null && kg > kgPrec && tipoKg !== 'manubrio' && !(inherent && kgPrec === 0))) { eventi.push({ date, tipo: `peso ${String(kgPrec)}→${String(kg)}`, fonte: 'mano', id: `r${String(run)}-${String(k).padStart(3, '0')}` }); }
      const sopra = sim2() < 0.7 ? v.max + (sim2() < 0.3 ? 1 : 0) : v.max - 1;
      const giri = SCARICO.has(week) ? 2 : 3;
      const draft: LoggedSession = { ...S(`r${String(run)}-${String(k).padStart(3, '0')}`, date, slug, livello, Array.from({ length: giri }, () => sopra), { kg, tempo: sim2() < 0.9 ? true : null }), status: 'in-progress' };
      const logged = draft.exercises[0]!;
      const tolte = decadenzeApp(draft, dec, sessions, new Map([[slug, L]])); const input = { block: v.block, exercise: ex, state: L, logged, range: resolveBlockRange(v.block, ex, testsSim), week, currentMaxReps: v.pattern === null ? null : (testsSim.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(slug, L.level, sessions, date, draft), rientro: null, aumentoRecente: aumentoRecente(slug, dec.filter((x) => x.sessionLogId !== draft.id && !idTolti(tolte).has(x.id ?? '')), sessions, date, draft), ...ingressoB1(slug, draft, sessions), decaduta: tolte.find((t) => t.exercise === slug)?.testo ?? null } as Parameters<typeof evaluateProgression>[0];
      const ev = evaluateProgression(input); conti.sedute += 1;
      osservaB2(tag, slug, L, ev, tolte, draft, dec, sessions); osserva(tag, slug, L, logged, input, ev, draft, dec.filter((x) => !idTolti(tolte).has(x.id ?? '')), sessions, date, tipoKg);
      if (process.env['DEBUG_RUN2'] === `${tag}:${String(run)}`) console.log(`DBG ${draft.id} ${date} W${String(week)} stato ${sintesi(L)} scritto kg ${String(kg)} (${tipoKg}) liv ${String(livello)} valori ${String(sopra)} → ${leva(ev)} · ${String(ev.blockedReason)}`);
      const accettate = new Map<ExerciseSlug, ExerciseState>();
      if (ev.suggestion !== null) {
        dec.push({ id: nuovoId(), date, exercise: slug, decision: 'accepted', stateBefore: L, stateAfter: ev.suggestion.nextState, sessionLogId: draft.id });
        eventi.push({ date, tipo: ev.suggestion.lever, fonte: 'app', id: draft.id, cid: dec.at(-1)!.id }); conti.aumenti += 1;
        accettate.set(slug, ev.suggestion.nextState);
      }
      const chiusa: LoggedSession = { ...draft, status: 'completed' };
      sessions.push(chiusa);
      if (!forbidden) ultimoKg = kg;
      { const tl = decadenzeApp(draft, dec, sessions, new Map([[slug, L]])); const tolti = new Set(tl.map((t) => t.exercise)); for (const nuovo of statesToSave(syncStatesFromLog(chiusa, new Map([[slug, L]])), accettate)) if (!tolti.has(nuovo.exercise)) L = nuovo; for (const t of tl) { dec.push(t.record); B2.lapsed += 1; L = t.stato; accettate.delete(t.exercise); } }
      L = accettate.get(slug) ?? L;
      const passo = passi[k % passi.length]!;
      giorno += passo === 0 ? 0 : passo; k += 1;
      if (passo === 0 && k > 300) break;
    }
    for (const e of eventi.filter((x) => x.fonte === 'app' && !tolteDi(dec).has((x as { cid?: string }).cid ?? ''))) {
      const altro = eventi.find((x) => eventi.indexOf(x) < eventi.indexOf(e) && !tolteDi(dec).has((x as { cid?: string }).cid ?? '') && g(e.date) - g(x.date) < 7);
      if (altro !== undefined) conti.viol.push(`run ${String(run)} ${slug}: ${e.tipo} il ${e.date} dopo ${altro.tipo} (${altro.fonte}) il ${altro.date}`);
    }
    const salite = eventi.filter((x) => (x.tipo === 'sali-di-livello' || x.tipo === 'variant') && !tolteDi(dec).has((x as { cid?: string }).cid ?? ''));
    for (let i = 1; i < salite.length; i += 1) if (g(salite[i]!.date) - g(salite[i - 1]!.date) < 14) conti.s1.push(`run ${String(run)} ${slug}: ${salite[i - 1]!.date} e ${salite[i]!.date}`);
    s1Esecuzione(`${tag} run ${String(run)} ${slug}`, slug, sessions);
    e7(`${tag} run ${String(run)} ${slug}`, slug, dec, sessions);
  }
}
simulaC2('C2', 1620, [[2], [3], [4], [7], [1, 2, 4], [0, 3, 4]]);
simulaC2('C2R', 1621, [[8], [9], [10], [11], [5, 9], [6, 10]]);

/* ======================================================== C · F ======= */
console.log('--- C (f7f945d): M22 (T-25), L25 (T-26), L26 (T-27), B14 ---');
/* fine seduta in W+1 sugli stati σ, il blocco chiuso al massimo con il tempo rispettato (M22.P, §2) */
function fineM22(c: Circ, slug: ExerciseSlug, sigma: Stati, W: number, oggi: string, sessions: readonly LoggedSession[], dec: readonly DecisioneRegistrata[], tests: ReadonlyMap<TestId, TestResult>) {
  const v = perSlug.get(slug)!; const ex = getExercise(slug); const L = sigma.get(slug)!;
  const lato = blockPerSide(v.block, sigma);
  const sets: LoggedSet[] = [];
  for (let s = 1; s <= v.block.sets; s += 1) for (const side of (lato ? ['left', 'right'] : [null]) as ('left' | 'right' | null)[]) sets.push({ setIndex: s, side, value: v.max, rir: 1, loadKg: L.loadKg, heartRate: null, note: null });
  const voce: LoggedExercise = { blockCode: v.code, exercise: slug, variantLabel: 'm22', level: L.level, tempoRespected: true, sets, note: null };
  const draft: LoggedSession = { id: `m22p-${oggi}-${slug}`, date: oggi, week: W + 1, sessionId: v.sid, status: 'in-progress', exercises: [voce], note: null };
  const pesoScrittoPrima = sessions.some((s) => s.status === 'completed' && s.exercises.some((x) => x.exercise === slug && x.sets.some((y) => y.loadKg > 0)));
  return evaluateProgression({ block: v.block, exercise: ex, state: L, logged: voce, range: resolveBlockRange(v.block, ex, tests), week: W + 1, currentMaxReps: v.pattern === null ? null : (tests.get(testBaseline(v.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(slug, L.level, sessions, oggi, draft), rientro: null, aumentoRecente: aumentoRecente(slug, dec, sessions, oggi, draft), caricoMassimoSeduta: L.loadKg, livelloMassimoSeduta: L.level, pesoScrittoPrima, decaduta: null, durataCon: (s: ExerciseState) => durP(c, new Map(sigma).set(s.exercise, s)) } as Parameters<typeof evaluateProgression>[0]);
}
type ContoM22P = { i: number; ii: number; iii: number; iv: number; esclusi: number; viol: string[]; perTipo: Map<string, number>; r13: number; r13es: string[] };
function nuovoM22P(): ContoM22P { return { i: 0, ii: 0, iii: 0, iv: 0, esclusi: 0, viol: [], perTipo: new Map(), r13: 0, r13es: [] }; }
/* M22.P (§2): (i) alMassimo tempo o pausa ⇒ la leva è disponibile, oppure R13 la ferma con la stessa data; (ii) aggiungi-peso ⇒
   stessa leva, stesso nextState; (iii) tetto ⇒ R17c (4). Esclusi i casi fermati a fine seduta da E4 (D-21): W+1 o W+2 di scarico. */
function m22P(K: ContoM22P, r: ReturnType<typeof reviewWeek>, stati: ReadonlyMap<ExerciseSlug, ExerciseState>, W: number, oggi: string, sessions: readonly LoggedSession[], dec: readonly DecisioneRegistrata[], tests: ReadonlyMap<TestId, TestResult>, tag: string): void {
  const casi: { slug: ExerciseSlug; tipo: string; testo: string; next?: ExerciseState }[] = [];
  for (const a of r.alMassimo) if (a.motivo === 'tempo' || a.motivo === 'pausa' || (a.motivo as string) === 'tetto' || a.motivo === 'variante') casi.push({ slug: a.exercise, tipo: a.motivo, testo: a.testo });
  for (const v of r.verdicts) if (v.kind === 'aggiungi-peso') casi.push({ slug: v.exercise, tipo: 'peso', testo: v.evidence, next: v.stateAfter });
  for (const caso of casi) {
    const cc = (CIRCUIT_SESSIONS as readonly Circ[]).find((x) => x.blocks.some((b) => b.exercise === caso.slug && b.excludeFromReview !== true));
    if (cc === undefined || !perSlug.has(caso.slug)) continue;
    if (SCARICO.has(W + 1) || SCARICO.has(W + 2)) { K.esclusi += 1; continue; }
    const base = statiRev(cc, stati, tests);
    const sigma: Stati = new Map(base);
    for (const v of r.verdicts) if (v.kind === 'sali-di-livello' && v.exercise !== caso.slug && base.has(v.exercise)) { if (durRif(cc, new Map(base).set(v.exercise, v.stateAfter)) > durRif(cc, base)) sigma.set(v.exercise, v.stateAfter); }
    const ev = fineM22(cc, caso.slug, sigma, W, oggi, sessions, dec, tests);
    const L = sigma.get(caso.slug)!;
    let ok = true; let k = '';
    if (caso.tipo === 'tempo' || caso.tipo === 'pausa') {
      K.i += 1; k = 'i';
      const lv = ev.levers.find((x) => x.lever === (caso.tipo === 'tempo' ? 'tempo' : 'iso-pause'));
      if (lv?.available !== true) {
        /* (i) «oppure R13 la ferma con la stessa data»; se R13 la ferma ma la revisione non dice nessuna data, si conta a parte */
        const dRev = /non prima del ([^.]+)\./.exec(caso.testo)?.[1];
        const motivo = `${lv?.reason ?? ''} ${ev.blockedReason ?? ''}`;
        const r13 = /7 giorni/.test(motivo);
        if (r13 && dRev !== undefined && motivo.includes(dRev)) ok = true;
        else if (r13) {
          K.r13 += 1;
          if (K.r13es.length < 4) { const dr = (aumentoRecente(caso.slug, dec, sessions, oggi) as { date?: string; dal?: string } | null); const vv = perSlug.get(caso.slug)!; const bz: LoggedSession = { id: 'x', date: oggi, week: W + 1, sessionId: vv.sid, status: 'in-progress', exercises: [{ blockCode: vv.code, exercise: caso.slug, variantLabel: 'x', level: L.level, tempoRespected: true, sets: [{ setIndex: 1, side: null, value: vv.max, rir: 1, loadKg: L.loadKg, heartRate: null, note: null }], note: null }], note: null }; const df = (aumentoRecente(caso.slug, dec, sessions, oggi, bz) as { date?: string; dal?: string } | null);
            K.r13es.push(`${tag} W${String(W)} ${oggi} ${caso.slug}: revisione «…${caso.testo.slice(-60)}» (R13 in revisione: ${dr === null ? 'nessuno' : `${String(dr.date)} dal ${String(dr.dal)}`}) · riepilogo «${(ev.blockedReason ?? '').slice(0, 130)}» (R13 con la seduta: ${df === null ? 'nessuno' : `${String(df.date)} dal ${String(df.dal)}`})`); }
        } else ok = false;
      }
    } else if (caso.tipo === 'peso') {
      K.ii += 1; k = 'ii';
      ok = ev.suggestion?.lever === 'load' && sintesi(ev.suggestion.nextState) === sintesi(caso.next!);
    } else if (caso.tipo === 'tetto') {
      K.iii += 1; k = 'iii';
      ok = ev.suggestion === null && ev.blockedReason === TESTO_R17C4;
    } else {
      /* (iv), informativo: variante con la frase del tetto ⇒ il riepilogo propone la variante o la ferma per R7/R13 */
      if (!caso.testo.startsWith(FRASE_VARIANTE_TETTO)) continue;
      K.iv += 1; k = 'iv';
      ok = ev.suggestion?.lever === 'variant' || ev.levers.some((x) => x.lever === 'variant' && x.available);
      if (!ok && ev.suggestion === null && /gradino|7 giorni/.test(ev.blockedReason ?? '')) ok = true;
    }
    if (!ok) { const chiave = `${k}:${caso.tipo}→${ev.suggestion === null ? `nessuna «${(ev.blockedReason ?? '').slice(0, 60)}»` : ev.suggestion.lever}`; K.perTipo.set(chiave, (K.perTipo.get(chiave) ?? 0) + 1); if (K.viol.length < 400) K.viol.push(`${tag} W${String(W)} ${oggi} ${caso.slug} ${sintesi(L)} [${k}] revisione ${caso.tipo} «${caso.testo.slice(0, 90)}» · riepilogo W${String(W + 1)} (σ ${mmss(durRif(cc, sigma))}) → ${leva(ev)} «${String(ev.blockedReason).slice(0, 140)}»`); }
  }
}
type RevC = { e: Esito; f: Esito; r: ReturnType<typeof reviewWeek>; testo: string };
function revC(W: number, sessions: LoggedSession[], stati: Stati, slug: ExerciseSlug, dec: DecisioneRegistrata[] = [], today?: string, tests: Map<TestId, TestResult> = VUOTO): RevC {
  const weekEnd = fineSett(W); const t = today ?? piu(weekEnd, 1);
  const r = reviewWeek({ week: W, sessions, states: stati, tests, weekEnd, today: t, decisioni: dec, ...(durataApp === undefined ? {} : { durata: durataApp }) } as Parameters<typeof reviewWeek>[0]);
  const e = daEngine(r).get(slug) ?? { cat: 'assente' };
  const f = riferimentoM22(W, sessions, stati, tests, weekEnd, t, dec).per.get(slug) ?? { cat: 'assente' };
  const testo = [...r.verdicts.filter((x) => x.exercise === slug).map((x) => `«${x.title}» ${x.change} | ${x.evidence}`), ...r.alMassimo.filter((x) => x.exercise === slug).map((x) => `«${x.testo}»`)].join(' ');
  return { e, f, r, testo };
}
/* riepilogo del circuito 4 come SessionSummary a f7f945d: σ′ da tetto.ts; in produzione σ′ di 0d85597 (tempo e pausa sopra) */
function bozzaC4(id: string, date: string, stati: Stati, livelli: Map<ExerciseSlug, LevelIndex | null> = new Map(), pesi: Map<ExerciseSlug, number> = new Map()): LoggedSession {
  const exercises: LoggedExercise[] = [];
  for (const b of C4.blocks) {
    if (b.excludeFromReview === true) continue;
    const ex = getExercise(b.exercise); const L = stati.get(ex.slug)!;
    const range = resolveBlockRange(b, ex, T12); if (range.kind !== 'range') continue;
    const lato = blockPerSide(b, stati); const sets: LoggedSet[] = [];
    for (let s = 1; s <= b.sets; s += 1) for (const side of (lato ? ['left', 'right'] : [null]) as ('left' | 'right' | null)[]) sets.push({ setIndex: s, side, value: range.range.max, rir: 1, loadKg: pesi.get(ex.slug) ?? L.loadKg, heartRate: null, note: null });
    exercises.push({ blockCode: b.code, exercise: ex.slug, variantLabel: 'c', level: livelli.has(ex.slug) ? livelli.get(ex.slug)! : L.level, tempoRespected: true, sets, note: null });
  }
  return { id, date, week: settDi(date), sessionId: 'circuito-4', status: 'in-progress', exercises, note: null };
}
function storiaC4(stati: Stati, date = '2026-03-02', id = 'st'): LoggedSession { return { ...bozzaC4(id, date, stati), status: 'completed' }; }
function riepilogoC4(draft: LoggedSession, stati: Stati, dec: readonly DecisioneRegistrata[], storia: readonly LoggedSession[]) {
  const out = new Map<string, ReturnType<typeof evaluateProgression>>();
  const tolte = decadenzeApp(draft, dec, storia, stati);
  const tt = Tt === null ? null : Tt.tettoDelRiepilogo(Tt.statiDellaChiusura(draft, stati, dec as never, storia), (s) => durP(C4, new Map(s)));
  const vecchio: Stati = new Map(stati);
  for (const b of C4.blocks) {
    const logged = draft.exercises.find((x) => x.blockCode === b.code); if (logged === undefined || logged.sets.length === 0) continue;
    const ex = getExercise(b.exercise); const L = stati.get(ex.slug)!;
    const ev = evaluateProgression({ block: b, exercise: ex, state: L, logged, range: resolveBlockRange(b, ex, T12), week: draft.week, currentMaxReps: ex.pattern === null ? null : (T12.get(testBaseline(ex.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(ex.slug, L.level, storia, draft.date, draft), rientro: null, aumentoRecente: aumentoRecente(ex.slug, dec.filter((x) => x.sessionLogId !== draft.id && !idTolti(tolte).has(x.id ?? '')), storia, draft.date, draft), ...ingressoB1(ex.slug, draft, storia), decaduta: tolte.find((t) => t.exercise === ex.slug)?.testo ?? null, durataCon: tt !== null ? tt.durataCon : (s: ExerciseState) => durP(C4, new Map(vecchio).set(s.exercise, s)) } as Parameters<typeof evaluateProgression>[0]);
    if (tt !== null) { if (ev.suggestion !== null) tt.proposta(ev.suggestion.nextState); }
    else if (ev.suggestion !== null && (ev.suggestion.lever === 'tempo' || ev.suggestion.lever === 'iso-pause')) vecchio.set(ex.slug, ev.suggestion.nextState);
    out.set(b.code, ev);
  }
  return { out, tolte };
}
{
  const HTc = 'hip-thrust-panca-bilaterale' as ExerciseSlug; const MPc = 'military-press-manubri' as ExerciseSlug;
  const RMc = 'rematore-manubrio-un-braccio' as ExerciseSlug; const PKc = 'plank-trascinamento-kb' as ExerciseSlug;
  const DPc = 'dip-panche-piedi-rialzati' as ExerciseSlug; const CPc = 'curl-panca-inclinata' as ExerciseSlug;
  const bm = (slug: ExerciseSlug): { e: number; p: number } => bonusMax(C4.blocks.find((b) => b.exercise === slug)!);
  const passiOltre = (s: Stati, slug: ExerciseSlug): boolean => durRif(C4, new Map(s).set(slug, passo(s.get(slug)!, 'tempo'))) > TETTO && durRif(C4, new Map(s).set(slug, passo(s.get(slug)!, 'pausa'))) > TETTO;
  const cerca = (f: (s: Stati) => boolean, prep: (s: Stati) => void = () => {}, n = 40000): Stati | null => { for (let i = 0; i < n; i += 1) { const s = casuale(C4); prep(s); if (f(s)) return s; } return null; };
  const sesDi = (slug: ExerciseSlug, L: ExerciseState, valori: number[], liv: LevelIndex | null = L.level): LoggedSession[] => [S(`${slug}-p`, '2026-03-02', slug, liv, valori.map(() => vDi(slug).max), { kg: L.loadKg, tempo: true }), S(`${slug}-q`, '2026-03-12', slug, liv, valori.map(() => vDi(slug).max), { kg: L.loadKg, tempo: true }), S(`${slug}-b`, '2026-03-19', slug, liv, valori, { kg: L.loadKg, tempo: true }), S(`${slug}-a`, '2026-03-26', slug, liv, valori, { kg: L.loadKg, tempo: true })];
  const mx = (slug: ExerciseSlug): number[] => [vDi(slug).max, vDi(slug).max, vDi(slug).max];
  console.log(`INFO      durataDellaSedutaDi ${durataApp === undefined ? 'ASSENTE' : 'presente'} · tetto.ts ${Tt === null ? 'ASSENTE' : 'presente'} · calibrazioneDaMostrare ${calDaMostrare === undefined ? 'ASSENTE' : 'presente'} · DEVIAZIONI_NOTA ${DEV_NOTA === undefined ? 'ASSENTE' : String(DEV_NOTA.length)}`);
  /* M22.0: la durata della revisione (durataDellaSedutaDi) = riferimento (§2: circuito che contiene l'esercizio, iniziali per chi manca) */
  { let diversi = 0; let prove = 0; const es: string[] = [];
    for (let i = 0; i < 400; i += 1) for (const c of CIRCUIT_SESSIONS as readonly Circ[]) { const s = casuale(c, i % 2 === 0); if (i % 3 === 0) for (const k of [...s.keys()].slice(0, 3)) s.delete(k);
      for (const b of c.blocks.filter((x) => x.excludeFromReview !== true)) { prove += 1; const a = durataApp === undefined ? null : durataApp(b.exercise, s); const f = Math.max(...circuitiDi(b.exercise).map((cc) => durRif(cc, statiRev(cc, s, VUOTO)))); if (a !== f) { diversi += 1; if (es.length < 3) es.push(`${c.id} ${b.exercise}: app ${String(a)} rif ${String(f)}`); } } }
    rigaF(diversi === 0, 'M22.0', `durataDellaSedutaDi = durata di riferimento della revisione: ${String(diversi)} diversi su ${String(prove)} (stati casuali, a volte con esercizi mancanti) ${es.join(' · ')}`); }
  /* M22.1: circuito-4 sotto il tetto, military press {10, e1, p0} con i passi di tempo e pausa oltre: revisione W4 → manubrio */
  const mp0 = st(MPc, null, 10, 1, 0);
  const s1 = cerca((s) => durRif(C4, s) <= TETTO && passiOltre(s, MPc), (s) => { s.set(MPc, mp0); });
  if (s1 !== null) {
    const x = revC(4, [S('pre', '2026-02-23', MPc, null, [1], { kg: 10 }), S('b', '2026-03-19', MPc, null, [15, 15, 15], { kg: 10, tempo: true }), S('a', '2026-03-26', MPc, null, [15, 15, 15], { kg: 10, tempo: true })], s1, MPc, [], '2026-03-30');
    const fsum = fineR19(C4, MPc, s1);
    const ok = x.e.cat === 'v:aggiungi-peso' && x.f.cat === 'v:aggiungi-peso' && x.e.dopo === x.f.dopo && /Passa al manubrio da 12 kg/.test(x.testo) && x.testo.endsWith(EVIDENZA_TETTO) && fsum.ev.suggestion?.lever === 'load' && sintesi(fsum.ev.suggestion.nextState) === x.e.dopo;
    rigaF(ok, 'M22.1', `circuito-4 a ${mmss(durRif(C4, s1))}, military press ${sintesi(mp0)}: revisione → ${x.e.cat} (${x.e.dopo ?? ''}) · riferimento ${x.f.cat} · ${x.testo.slice(0, 200)} · riepilogo allo stesso stato → ${leva(fsum.ev)}`);
  } else rigaF(false, 'M22.1', 'stato non trovato');
  /* M22.2: plank con trascinamento, passi di tempo e pausa oltre il tetto: revisione `tetto` col testo; riepilogo R17c (4) */
  const pk0 = st(PKc, null, 10, 0, 0);
  const s2s = cerca((s) => durRif(C4, s) <= TETTO && passiOltre(s, PKc), (s) => { s.set(PKc, pk0); });
  if (s2s !== null) {
    const x = revC(4, [S('pre', '2026-02-23', PKc, null, [1], { kg: 10 }), ...sesDi(PKc, pk0, mx(PKc)).slice(2)], s2s, PKc, [], '2026-03-30');
    const fsum = fineR19(C4, PKc, s2s);
    rigaF(x.e.cat === 'alMassimo:tetto' && x.f.cat === 'alMassimo:tetto' && x.testo === `«${TESTO_TETTO_REV}»` && fsum.ev.suggestion === null && fsum.ev.blockedReason === TESTO_R17C4, 'M22.2', `circuito-4 a ${mmss(durRif(C4, s2s))}, plank ${sintesi(pk0)}: revisione → ${x.e.cat} · riferimento ${x.f.cat} · ${x.testo.slice(0, 160)} · riepilogo → ${leva(fsum.ev)} «${String(fsum.ev.blockedReason).slice(0, 120)}»`);
  } else rigaF(false, 'M22.2', 'stato non trovato');
  /* M22.3: dip su panche (scala), variante aperta, tempo oltre il tetto: revisione `variante` con la frase; riepilogo variante */
  const dp0 = st(DPc, 1, 0, 0, 0);
  const s3 = cerca((s) => durRif(C4, s) <= TETTO && passiOltre(s, DPc), (s) => { s.set(DPc, dp0); });
  if (s3 !== null) {
    const x = revC(4, sesDi(DPc, dp0, mx(DPc)), s3, DPc, [], '2026-03-30');
    const fsum = fineR19(C4, DPc, s3);
    rigaF(x.e.cat === 'alMassimo:variante' && x.f.cat === 'alMassimo:variante' && x.testo.startsWith(`«${FRASE_VARIANTE_TETTO}`) && fsum.ev.suggestion?.lever === 'variant', 'M22.3', `circuito-4 a ${mmss(durRif(C4, s3))}, dip ${sintesi(dp0)}: revisione → ${x.e.cat} · ${x.testo.slice(0, 200)} · riepilogo → ${leva(fsum.ev)}`);
  } else rigaF(false, 'M22.3', 'stato non trovato');
  /* M22.4: hip thrust sali-di-livello 2 → 3 nella stessa revisione e military press al massimo: il passo sta sotto il tetto
     da solo, sopra con l'hip thrust su una gamba ⇒ military press va a (6); senza la salita (controllo) resta tempo */
  const ht2 = st(HTc, 2, 0, 0, 0);
  const s4 = cerca((s) => { const con = new Map(s).set(HTc, { ...ht2, level: 3 as LevelIndex }); return !passiOltre(s, MPc) && passiOltre(con, MPc); }, (s) => { s.set(MPc, mp0); s.set(HTc, ht2); });
  if (s4 !== null) {
    const sesHT = [S('h0', '2026-03-02', HTc, 2, mx(HTc), { kg: 0, tempo: true }), S('h1', '2026-03-12', HTc, 2, mx(HTc), { kg: 0, tempo: true }), S('h2', '2026-03-19', HTc, 2, mx(HTc).map((y) => y + 1), { kg: 0, tempo: true }), S('h3', '2026-03-26', HTc, 2, mx(HTc).map((y) => y + 1), { kg: 0, tempo: true })];
    const sesHTno = [S('h0', '2026-03-02', HTc, 2, mx(HTc), { kg: 0, tempo: true }), S('h1', '2026-03-12', HTc, 2, mx(HTc), { kg: 0, tempo: true }), S('h2', '2026-03-19', HTc, 2, [vDi(HTc).min, vDi(HTc).min, vDi(HTc).min], { kg: 0, tempo: true }), S('h3', '2026-03-26', HTc, 2, [vDi(HTc).min, vDi(HTc).min, vDi(HTc).min], { kg: 0, tempo: true })];
    const sesMP = [S('pre', '2026-02-23', MPc, null, [1], { kg: 10 }), S('b', '2026-03-19', MPc, null, [15, 15, 15], { kg: 10, tempo: true }), S('a', '2026-03-26', MPc, null, [15, 15, 15], { kg: 10, tempo: true })];
    const x = revC(4, [...sesHT, ...sesMP], s4, MPc, [], '2026-03-30'); const xh = daEngine(x.r).get(HTc);
    const y = revC(4, [...sesHTno, ...sesMP], s4, MPc, [], '2026-03-30');
    rigaF(xh?.cat === 'v:sali-di-livello' && x.e.cat === 'v:aggiungi-peso' && x.f.cat === 'v:aggiungi-peso' && y.e.cat === 'alMassimo:tempo' && y.f.cat === 'alMassimo:tempo', 'M22.4', `circuito-4 a ${mmss(durRif(C4, s4))} (con hip thrust al 3: ${mmss(durRif(C4, new Map(s4).set(HTc, { ...ht2, level: 3 as LevelIndex })))}): hip thrust → ${xh?.cat ?? '-'}; military press → ${x.e.cat} (rif ${x.f.cat}) · controllo senza la salita → ${y.e.cat} (rif ${y.f.cat})`);
  } else rigaF(false, 'M22.4', 'stato non trovato');
  if (s1 !== null) {
    /* M22.5: fine seduta in settimana 2, tempo oltre il tetto: R17c (2), il motivo della settimana */
    const f5 = fs(MPc, mp0, [15, 15, 15], '2026-03-11', [S('p0', '2026-03-02', MPc, null, [15, 15, 15], { kg: 10, tempo: true })], [], { kg: 10, tests: T12, durataCon: (s: ExerciseState) => durP(C4, new Map(s1).set(s.exercise, s)) });
    rigaF(f5.ev.suggestion === null && /Fino alla settimana 3/.test(f5.ev.blockedReason ?? '') && f5.ev.blockedReason !== TESTO_R17C4, 'M22.5', `settimana ${String(f5.draft.week)}, military press ${sintesi(mp0)} a ${mmss(durRif(C4, s1))}: → ${leva(f5.ev)} «${String(f5.ev.blockedReason).slice(0, 120)}»`);
    /* M22.6: military press {12,5}, tempo oltre il tetto: R17c (3) a fine seduta; e la revisione sullo stesso stato */
    const mp6 = st(MPc, null, 12.5, 1, 0); const s6 = new Map(s1).set(MPc, mp6);
    const f6 = fineR19(C4, MPc, s6);
    const x6 = revC(4, [S('pre', '2026-02-23', MPc, null, [1], { kg: 12.5 }), S('b', '2026-03-19', MPc, null, [15, 15, 15], { kg: 12.5, tempo: true }), S('a', '2026-03-26', MPc, null, [15, 15, 15], { kg: 12.5, tempo: true })], s6, MPc, [], '2026-03-30');
    rigaF(f6.ev.suggestion === null && /12,5 kg non è fra i tuoi manubri/.test(f6.ev.blockedReason ?? ''), 'M22.6', `fine seduta military press ${sintesi(mp6)}: → ${leva(f6.ev)} «${String(f6.ev.blockedReason).slice(0, 110)}»`);
    rigaF(x6.e.cat === x6.f.cat, 'M22.6r', `stessa military press ${sintesi(mp6)} in revisione W4: engine ${x6.e.cat} · riferimento ${x6.f.cat} (peso fuori elenco col tetto) · ${x6.testo.slice(0, 150)}`);
  }
  /* M22.7b: nei circuiti 1-3 nessuno stato, a nessun gradino, supera il tetto (somma delle stazioni, verificata sul piano intero) */
  for (const c of (CIRCUIT_SESSIONS as readonly Circ[]).filter((x) => x.id !== 'circuito-4')) {
    const base = statiDi(c); const d0 = durRif(c, base); let somma = d0; const peggio: Stati = new Map(base);
    for (const b of c.blocks.filter((x) => x.excludeFromReview !== true)) {
      const ex = getExercise(b.exercise); const m = bonusMax(b); let best = -1e9; let bestS: ExerciseState = base.get(ex.slug)!;
      const livelli = ex.pattern === null ? [ex.defaultLevel] : ([1, 2, 3, 4, 5, 6] as LevelIndex[]).filter((l) => !getProgressionStep(ex.pattern!, l).eccentricOnly);
      for (const l of livelli) { const s = { ...base.get(ex.slug)!, level: l, eccentricBonusSeconds: m.e, bottomPauseBonusSeconds: m.p }; const dd = durRif(c, new Map(base).set(ex.slug, s)) - d0; if (dd > best) { best = dd; bestS = s; } }
      somma += best; peggio.set(ex.slug, bestS);
    }
    rigaF(somma === durRif(c, peggio) && somma <= TETTO, 'M22.7b', `${c.id}: lo stato più lungo raggiungibile (ogni esercizio al gradino più lungo, tempo e pausa al massimo) dura ${mmss(durRif(c, peggio))} (somma delle stazioni ${mmss(somma)}) ≤ 55:00: R19 non può fermare niente, revisione e riepilogo identici`);
  }
  /* L25: riepiloghi del circuito 4 come l'app */
  const passoA = (s: Stati, slug: ExerciseSlug): Stati => new Map(s).set(slug, passo(s.get(slug)!, 'tempo'));
  const tempoA2 = (o: Map<string, ReturnType<typeof evaluateProgression>>, code = 'A2') => o.get(code)?.levers.find((x) => x.lever === 'tempo');
  /* L25.1: hip thrust A1 al 2 con tempo e pausa esauriti che propone 2 → 3; il passo di A2 sta sotto il tetto solo senza la variante */
  const ht1 = st(HTc, 2, 0, bm(HTc).e, bm(HTc).p);
  const l1 = cerca((s) => (s.get(RMc)!.eccentricBonusSeconds < bm(RMc).e) && durRif(C4, passoA(s, RMc)) <= TETTO && durRif(C4, passoA(new Map(s).set(HTc, st(HTc, 3, 0, 0, 0)), RMc)) > TETTO, (s) => { s.set(HTc, ht1); });
  if (l1 !== null) {
    const { out } = riepilogoC4(bozzaC4('l251', '2026-03-26', l1), l1, [], [storiaC4(l1)]);
    const a1 = out.get('A1'); const t2 = tempoA2(out);
    rigaF(a1?.suggestion?.lever === 'variant' && t2?.available === false && t2.reason === TESTO_R19 && out.get('A2')?.suggestion?.lever !== 'tempo', 'L25.1', `circuito-4 a ${mmss(durRif(C4, l1))}: A1 → ${a1 === undefined ? '-' : leva(a1)}; A2 tempo ${String(t2?.available)} «${String(t2?.reason).slice(0, 60)}» → ${out.get('A2') === undefined ? '-' : leva(out.get('A2')!)}`);
  } else rigaF(false, 'L25.1', 'stato non trovato');
  /* L25.2: A2 propone il manubrio (accorcia); A3 sopra il tetto solo senza contarlo ⇒ A3 fermo (guardia contro la correzione ingenua) */
  let l2: { s: Stati; out: Map<string, ReturnType<typeof evaluateProgression>> } | null = null;
  for (let i = 0; i < 40000 && l2 === null; i += 1) {
    const s = casuale(C4); s.set(RMc, st(RMc, null, 10, bm(RMc).e, bm(RMc).p)); s.set(HTc, { ...s.get(HTc)!, eccentricBonusSeconds: bm(HTc).e, bottomPauseBonusSeconds: bm(HTc).p });
    if (s.get(MPc)!.eccentricBonusSeconds >= bm(MPc).e) continue;
    const base = new Map(s); const d3 = durRif(C4, passoA(base, MPc)); const d3m = durRif(C4, passoA(new Map(base).set(RMc, st(RMc, null, 12, 0, 0)), MPc));
    if (!(d3 > TETTO && d3m <= TETTO)) continue;
    const { out } = riepilogoC4(bozzaC4('l252', '2026-03-26', s), s, [], [storiaC4(s)]);
    if (out.get('A2')?.suggestion?.lever === 'load' && out.get('A1')?.suggestion?.lever !== 'tempo' && out.get('A1')?.suggestion?.lever !== 'iso-pause') l2 = { s, out };
  }
  if (l2 !== null) { const t3 = tempoA2(l2.out, 'A3'); rigaF(t3?.available === false && t3.reason === TESTO_R19, 'L25.2', `A2 → ${leva(l2.out.get('A2')!)}; A3 tempo ${String(t3?.available)} (col manubrio di A2 contato starebbe sotto il tetto) · A1 → ${leva(l2.out.get('A1')!)}`); }
  else rigaF(false, 'L25.2', 'stato non trovato');
  /* L25.3: hip thrust scritto a mano al 3 con lo stato al 2 (D-23 ⇒ {3,0,0} alla chiusura): A2 fermo */
  const ht3 = st(HTc, 2, 0, 1, 1);
  const l3 = cerca((s) => (s.get(RMc)!.eccentricBonusSeconds < bm(RMc).e) && durRif(C4, passoA(s, RMc)) <= TETTO && durRif(C4, passoA(new Map(s).set(HTc, st(HTc, 3, 0, 0, 0)), RMc)) > TETTO, (s) => { s.set(HTc, ht3); });
  if (l3 !== null) {
    const { out } = riepilogoC4(bozzaC4('l253', '2026-03-26', l3, new Map([[HTc, 3 as LevelIndex]])), l3, [], [storiaC4(l3)]);
    const t2 = tempoA2(out);
    rigaF(t2?.available === false && t2.reason === TESTO_R19, 'L25.3', `hip thrust scritto al 3 (stato ${sintesi(ht3)}), circuito a ${mmss(durRif(C4, l3))}: A2 tempo ${String(t2?.available)} → ${leva(out.get('A2')!)}`);
  } else rigaF(false, 'L25.3', 'stato non trovato');
  /* L25.4: B1 curl su panca inclinata con una scelta in attesa {10,+2,+2} → {12,0,0}; la seduta a 10 kg la toglie (base {10,2,2}): A2 fermo */
  const cpPrima = st(CPc, null, 10, 2, 2); const cpDopo = st(CPc, null, 12, 0, 0);
  const l4 = cerca((s) => (s.get(RMc)!.eccentricBonusSeconds < bm(RMc).e) && durRif(C4, passoA(s, RMc)) <= TETTO && durRif(C4, passoA(new Map(s).set(CPc, cpPrima), RMc)) > TETTO, (s) => { s.set(CPc, cpDopo); });
  if (l4 !== null) {
    const reg = [RI('l254', '2026-03-23', cpPrima, cpDopo, 'revisione-3:curl-panca-inclinata', 'load')];
    const storia = [storiaC4(new Map(l4).set(CPc, cpPrima), '2026-03-19', 'st19')];
    const { out, tolte } = riepilogoC4(bozzaC4('l254', '2026-03-26', l4, new Map(), new Map([[CPc, 10]])), l4, reg, storia);
    const t2 = tempoA2(out);
    rigaF(tolte.some((t) => t.exercise === CPc) && t2?.available === false && t2.reason === TESTO_R19, 'L25.4', `scelta del curl tolta: ${String(tolte.map((t) => `${t.exercise} → ${sintesi(t.stato)}`).join(', ') || 'nessuna')}; circuito a ${mmss(durRif(C4, l4))}: A2 tempo ${String(t2?.available)} → ${leva(out.get('A2')!)}`);
  } else rigaF(false, 'L25.4', 'stato non trovato');
  /* L25.5: circuito-4 già oltre il tetto, hip thrust al 3 che chiude il massimo: variante 3 → 4 (D5) */
  const l5 = statiDi(C4, (b) => ({ eccentricBonusSeconds: bonusMax(b).e, bottomPauseBonusSeconds: bonusMax(b).p })); l5.set(HTc, st(HTc, 3, 0, 0, 0));
  { const { out } = riepilogoC4(bozzaC4('l255', '2026-03-26', l5), l5, [], [storiaC4(l5)]); const a1 = out.get('A1');
    rigaF(durRif(C4, l5) > TETTO && a1?.suggestion?.lever === 'variant' && a1.suggestion.nextState.level === 4, 'L25.5', `circuito-4 a ${mmss(durRif(C4, l5))}, hip thrust ${sintesi(l5.get(HTc)!)} → ${a1 === undefined ? '-' : leva(a1)}`); }
  /* L26.1-L26.4 */
  const c4n = findCircuitSession('circuito-4')!.note ?? null;
  rigaF(c4n === NOTA_C4, 'L26.1', `nota di circuito-4 = testo esatto del §4: ${String(c4n === NOTA_C4)}`);
  let noteF: Record<string, string | null> | null = null;
  try {
    const src = execFileSync('git', ['show', 'f63c9f1:src/data/circuit.ts'], { encoding: 'utf8' });
    noteF = {}; const ids = [...src.matchAll(/id: '(circuito-\d)'/g)].map((m) => m[1]!);
    for (const id of ids) { const i0 = src.indexOf(`id: '${id}'`); const i1 = (() => { const n = ids.indexOf(id) + 1; return n < ids.length ? src.indexOf(`id: '${ids[n]!}'`) : src.length; })(); const pezzo = src.slice(i0, i1); const m = /\n\s+note: '((?:[^'\\]|\\.)*)'/.exec(pezzo); noteF[id] = m === null ? null : m[1]!.replace(/\\'/g, "'"); }
  } catch { noteF = null; }
  if (noteF === null) console.log('F NC      L26.2  NON COPERTO: git show f63c9f1 non eseguibile da questa radice');
  else {
    const applica = (id: string, nota: string | null): string | null => { const dv = (DEV_NOTA ?? []).find((x) => x.sessione === id && x.scheda === nota); return dv === undefined ? nota : dv.app; };
    const diversi = CIRCUIT_SESSIONS.filter((s) => (s.note ?? null) !== applica(s.id, noteF![s.id] ?? null)).map((s) => s.id);
    const orfane = (DEV_NOTA ?? []).filter((x) => x.scheda !== (noteF![x.sessione] ?? null)).map((x) => x.sessione);
    const testFile = readFileSync(new URL('../../src/data/circuit.test.ts', import.meta.url), 'utf8');
    const nonNelTest = Object.entries(noteF).filter(([, n]) => n !== null && !testFile.includes(n.replace(/"/g, '"'))).map(([id]) => id);
    rigaF(DEV_NOTA !== undefined && diversi.length === 0 && orfane.length === 0 && nonNelTest.length === 0, 'L26.2', `note di f63c9f1 (prima trascrizione, non la scheda): ${Object.entries(noteF).map(([id, n]) => `${id} ${n === null ? 'null' : `${String(n.length)} car.`}`).join(' · ')} · app ≠ f63c9f1 + DEVIAZIONI_NOTA: ${diversi.join(',') || 'nessuna'} · voci orfane: ${orfane.join(',') || 'nessuna'} · NOTE_SCHEDA del test = f63c9f1: ${nonNelTest.length === 0 ? 'sì' : `no (${nonNelTest.join(',')})`}`);
    const m4 = (DEV_NOTA ?? []).find((x) => x.sessione === 'circuito-4');
    rigaF(m4 !== undefined && (noteF['circuito-4'] ?? '').includes('due stazioni unilaterali') === (m4.motivo.includes('Le stazioni per lato del Tri-set A sono due solo dal gradino 3 dell’hip thrust: nell’app si parte a due gambe.')), 'L26.2b', `motivo di circuito-4 con la frase sulle stazioni per lato: ${String(m4?.motivo.includes('Le stazioni per lato') ?? false)}`);
    console.log('F NC      L26.2s NON COPERTO: le note contro la scheda originale. Nel repository non c’è: f63c9f1 è la prima trascrizione, non una seconda indipendente');
  }
  /* L26.3: i minuti della nota. 55 = tetto; 59 = tempo e pausa fino al tetto sugli altri, hip thrust al 2 a bonus 0, poi {3,0,0} */
  let pieno = statiDi(C4);
  for (let giro = 0; giro < 30; giro += 1) for (const b of giudicati(C4)) { if (b.exercise === HTc) continue; for (const lv of ['tempo', 'pausa'] as const) { const L = pieno.get(b.exercise)!; const m = bonusMax(b); if (lv === 'tempo' ? L.eccentricBonusSeconds < m.e : L.bottomPauseBonusSeconds < m.p) { const nuovo = new Map(pieno).set(b.exercise, passo(L, lv)); if (durRif(C4, nuovo) <= TETTO) pieno = nuovo; } } }
  const d59 = durRif(C4, new Map(pieno).set(HTc, st(HTc, 3, 0, 0, 0)));
  let primaHT = new Map(statiDi(C4)).set(HTc, st(HTc, 2, 0, bm(HTc).e, bm(HTc).p)) as Stati;
  for (let giro = 0; giro < 30; giro += 1) for (const b of giudicati(C4)) { if (b.exercise === HTc) continue; for (const lv of ['tempo', 'pausa'] as const) { const L = primaHT.get(b.exercise)!; const m = bonusMax(b); if (lv === 'tempo' ? L.eccentricBonusSeconds < m.e : L.bottomPauseBonusSeconds < m.p) { const nuovo = new Map(primaHT).set(b.exercise, passo(L, lv)); if (durRif(C4, nuovo) <= TETTO) primaHT = nuovo; } } }
  const d56 = durRif(C4, new Map(primaHT).set(HTc, st(HTc, 3, 0, 0, 0)));
  /* estremo teorico: dopo l'ultimo passo di tempo o pausa (σ ≤ tetto) solo cambi di gradino; guadagno massimo per esercizio */
  const guadagni: string[] = []; let gTot = 0;
  for (const b of giudicati(C4)) { const ex = getExercise(b.exercise); if (ex.pattern === null) continue; const b0 = statiDi(C4); const d0 = durRif(C4, b0); let gmax = 0; let lmax = 0; let gmin = 1e9;
    for (const l of [1, 2, 3, 4, 5, 6] as LevelIndex[]) { if (getProgressionStep(ex.pattern, l).eccentricOnly) continue; const dd = durRif(C4, new Map(b0).set(ex.slug, { ...b0.get(ex.slug)!, level: l })) - d0; if (dd > gmax) { gmax = dd; lmax = l; } if (dd < gmin) gmin = dd; }
    if (gmax - gmin > 0) { guadagni.push(`${ex.slug} +${String(gmax - gmin)} s (al ${String(lmax)})`); gTot += gmax - gmin; } }
  const minuti = [...(c4n ?? '').matchAll(/(\d+) minuti/g)].map((m) => Number(m[1]));
  rigaF(Math.round(d59 / 60) === 59 && minuti.every((n) => n === 55 || n === Math.round(d59 / 60)) && Math.round((TETTO + gTot) / 60) === 59, 'L26.3', `nota: ${minuti.join(', ')} minuti · costruito (altri fino al tetto ${mmss(durRif(C4, pieno))}, poi hip thrust {3,0,0}): ${mmss(d59)} · se l'hip thrust accumula prima tempo e pausa: ${mmss(d56)} · estremo teorico tetto + guadagni di gradino dopo l'ultimo passo: ${mmss(TETTO + gTot)} (${guadagni.join(', ') || 'nessuno'})`);
  /* L26.4: durate a bonus 0; la nota del circuito 2 senza «la più corta» */
  const durate = (CIRCUIT_SESSIONS as readonly Circ[]).map((c) => ({ id: c.id, d: durRif(c, statiDi(c)) }));
  const corta = [...durate].sort((a, b) => a.d - b.d)[0]!;
  const c2n = findCircuitSession('circuito-2')!.note ?? '';
  rigaF(corta.id === 'circuito-3' && c2n === NOTA_C2_APP && (DEV_NOTA ?? []).some((x) => x.sessione === 'circuito-2' && x.motivo.includes('la seduta più corta è la 3')), 'L26.4', `a bonus 0: ${durate.map((x) => `${x.id} ${mmss(x.d)}`).join(' · ')} · più corta ${corta.id} · nota di circuito-2: «${c2n.slice(0, 50)}…»`);
  /* B14 */
  const kinds = new Set(CIRCUIT_SESSIONS.map((s) => (s as { kind?: string }).kind));
  const setsB14 = (v: number[], kg: number): LoggedSet[] => v.map((x, i) => ({ setIndex: i + 1, side: null, value: x, rir: 1, loadKg: kg, heartRate: null, note: null }));
  const cal12 = calDaMostrare === undefined ? calibrateLoad(setsB14([12, 12, 12], 12), 12) : calDaMostrare('circuit', setsB14([12, 12, 12], 12), 12);
  const cal3 = calDaMostrare === undefined ? calibrateLoad(setsB14([3, 3, 3], 12), 12) : calDaMostrare('circuit', setsB14([3, 3, 3], 12), 12);
  const summaryTsx = readFileSync(new URL('../../src/ui/session/SessionSummary.tsx', import.meta.url), 'utf8');
  rigaF(kinds.size === 1 && kinds.has('circuit') && cal12 === null && /calibrazioneDaMostrare\(program\.kind, logged\.sets, summary\.maxLoadKg\)/.test(summaryTsx) && !/calibrateLoad\(/.test(summaryTsx), 'B14.1', `sedute del circuito: kind ${[...kinds].join(',')} · 12-12-12 a 12 kg nel circuito → ${cal12 === null ? 'nessun riquadro' : `«${String(cal12.message)}»`} · il riepilogo passa program.kind: ${String(/calibrazioneDaMostrare\(program\.kind/.test(summaryTsx))}`);
  console.log(`F INFO    B14.2  nel circuito, 3-3-3 a 12 kg → ${cal3 === null ? 'nessun riquadro (sparisce anche «troppo pesante, togli 2,5 kg»)' : `«${String(cal3.message)}»`} · programma archiviato (kind strength), 12-12-12: ${calDaMostrare === undefined ? '-' : String(calDaMostrare('strength', setsB14([12, 12, 12], 12), 12)?.message)}`);
}

/* ============================================================ C3 ====== */
/* C (f7f945d): un circuito intero per atleta, riepilogo e revisione come l'app.
   - riepilogo: σ′ dal codice (tetto.ts: statiDellaChiusura + tettoDelRiepilogo, come SessionSummary); in produzione (Tt
     null) σ′ di 0d85597 (stati di prima + tempo e pausa proposti sopra);
   - σ′ di riferimento dal §3: base = toEvaluate → syncRif → decadenze; poi, nell'ordine dei blocchi, le proposte sopra su
     altri esercizi che allungano (durRif); confronto a due lati su ogni leva di tempo e pausa;
   - revisione con `durata: durataDellaSedutaDi` (Home e Revisione); confronto con riferimentoM22; M22.7 (circuiti 1-3: uscita
     intera identica a quella senza durata); M22.P con la fine seduta rifatta in W+1;
   - L25.P1: prefisso delle proposte accettate, nell'ordine dei blocchi, dalla base della chiusura: dopo ogni passo di tempo
     o pausa ≤ tetto; sedute che chiudono oltre il tetto, per causa;
   - R-14: S2, S5, D19.P, R13, E4 e R10a (tempo e pausa liberi solo oltre il tetto) sui carichi della revisione.
   C3: tutto accettato (come 17). C3R: accetto 60%, scelta in salita non eseguita alla seduta dopo 25%, gradino scritto a
   mano ±1 8%. */
const C3 = { e7: 0 };
type ContiC3 = { sedute: number; prop: number; r19: number; varianti: number; max: Map<string, number>; sigmaConfr: number; sigmaR19: number; sigmaDiff: string[]; p1: string[]; p1passi: number; chiuseOltre: Map<string, number>; chiuseOltreEs: string[]; crossing: number; rev: number; revDiff: string[]; revTipi: Map<string, number>; tettoRev: number; m227n: number; m227: string[]; p: ContoM22P; carico: { n: number; viol: string[] }; s1mano: number; s1app: string[]; decad: number; manuali: number; rifiuti: number; s5occ: number; s5: string[] };
const C3conti = new Map<string, ContiC3>();
const ATLETI3 = Number(process.env['ATLETI3'] ?? 40);
function caricoRev(K: ContiC3, ver: ReturnType<typeof reviewWeek>['verdicts'][number], r: ReturnType<typeof reviewWeek>, c: Circ, stati: Stati, dec: readonly DecisioneRegistrata[], sessions: readonly LoggedSession[], oggi: string, W: number, tag: string): void {
  K.carico.n += 1;
  const vv = perSlug.get(ver.exercise)!; const L = ver.stateBefore;
  const q = `${tag} W${String(W)} ${oggi} ${ver.exercise} ${sintesi(L)} → ${sintesi(ver.stateAfter)}`;
  if (varianteLibera(vv, L)) K.carico.viol.push(`S5 ${q}: carico con la variante disponibile`);
  if (vv.policy === 'inherent') { const dk = ver.stateAfter.loadKg - L.loadKg; if (!inElenco(L.loadKg) || !inElenco(ver.stateAfter.loadKg) || !(Math.abs(dk - 1) < 1e-9 || Math.abs(dk - 2) < 1e-9)) K.carico.viol.push(`D19.P ${q}`); }
  else if (ver.stateAfter.loadKg - L.loadKg !== 2.5) K.carico.viol.push(`S2 ${q}: passo ${String(ver.stateAfter.loadKg - L.loadKg)} kg`);
  const rec = recenteRif(aumentiRif(ver.exercise, dec, sessions), oggi); if (rec !== undefined) K.carico.viol.push(`S2/R13 ${q}: aumento del ${rec.date} (${rec.cosa})`);
  if (SCARICO.has(W + 1)) K.carico.viol.push(`E4 ${q}`);
  /* R10a con M22: tempo o pausa ancora liberi solo se il loro passo, con le salite che allungano, supera il tetto */
  const base = statiRev(c, stati, testsSim); const sigma: Stati = new Map(base);
  for (const v of r.verdicts) if (v.kind === 'sali-di-livello' && v.exercise !== ver.exercise && base.has(v.exercise) && durRif(c, new Map(base).set(v.exercise, v.stateAfter)) > durRif(c, base)) sigma.set(v.exercise, v.stateAfter);
  for (const lv of ['tempo', 'pausa'] as const) {
    if (!(lv === 'tempo' ? tempoLibero(vv, L) : pausaLibera(vv, L))) continue;
    const dd = durRif(c, new Map(sigma).set(ver.exercise, passo(L, lv)));
    if (dd <= TETTO) K.carico.viol.push(`R10a ${q}: ${lv} libero e sotto il tetto (${mmss(dd)})`);
  }
}
function simulaC3(tag: string, seme: number, nAtleti: number, opz: { accetta: number; nonEsegue: number; manuale: number }): void {
  const rn = mulberry32(seme);
  const K: ContiC3 = { sedute: 0, prop: 0, r19: 0, varianti: 0, max: new Map(), sigmaConfr: 0, sigmaR19: 0, sigmaDiff: [], p1: [], p1passi: 0, chiuseOltre: new Map(), chiuseOltreEs: [], crossing: 0, rev: 0, revDiff: [], revTipi: new Map(), tettoRev: 0, m227n: 0, m227: [], p: nuovoM22P(), carico: { n: 0, viol: [] }, s1mano: 0, s1app: [], decad: 0, manuali: 0, rifiuti: 0, s5occ: 0, s5: [] };
  C3conti.set(tag, K);
  for (const c of CIRCUIT_SESSIONS as readonly Circ[]) {
    const gb = c.blocks.filter((b) => b.excludeFromReview !== true);
    for (let run = 0; run < nAtleti; run += 1) {
      const passi = [[3, 4], [2, 5], [7], [3], [2, 2, 3]][run % 5]!;
      const stati: Stati = new Map();
      for (const b of c.blocks) { const ex = getExercise(b.exercise); stati.set(ex.slug, st(ex.slug, ex.defaultLevel, 0)); }
      const sessions: LoggedSession[] = []; const dec: DecisioneRegistrata[] = [];
      const pendenti = new Map<ExerciseSlug, ExerciseState>();
      const aMano = new Set<string>();
      let giorno = g(INIZIO); let k = 0; let rivista = 0;
      const tg = `${tag} ${c.id} run ${String(run)}`;
      while (giorno < g(INIZIO) + 7 * SETT) {
        const date = d(giorno); const week = settDi(date);
        for (let W = rivista + 1; W < week; W += 1) {
          if (date <= piu(fineSett(W), 7)) {
            const inp = { week: W, sessions, states: stati, tests: testsSim, weekEnd: fineSett(W), today: date, decisioni: dec };
            const r = reviewWeek({ ...inp, ...(durataApp === undefined ? {} : { durata: durataApp }) } as Parameters<typeof reviewWeek>[0]);
            const r0 = reviewWeek(inp);
            const e = daEngine(r); const f = riferimentoM22(W, sessions, stati, testsSim, fineSett(W), date, dec);
            K.rev += 1;
            for (const slug of new Set([...e.keys(), ...f.per.keys()])) {
              const a = e.get(slug); const b = f.per.get(slug);
              if (a?.cat === 'alMassimo:tetto') K.tettoRev += 1;
              if (a?.cat !== b?.cat || (a?.dopo ?? '') !== (b?.dopo ?? '')) { const kk = `engine ${a?.cat ?? '-'} ≠ testo ${b?.cat ?? '-'}`; K.revTipi.set(kk, (K.revTipi.get(kk) ?? 0) + 1); if (K.revDiff.length < 50) K.revDiff.push(`${tg} W${String(W)} ${date} ${slug} ${sintesi(stati.get(slug)!)}: ${kk} ${a?.dopo ?? ''} / ${b?.dopo ?? ''}`); }
              if (c.id !== 'circuito-4') { K.m227n += 1; if (serialEs(r, slug) !== serialEs(r0, slug)) K.m227.push(`${tg} W${String(W)} ${date} ${slug}`); }
            }
            m22P(K.p, r, stati, W, date, sessions, dec, testsSim, tg);
            const statiRevisione: Stati = new Map(stati);
            for (const ver of r.verdicts) {
              if ((ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso') && SCARICO.has(W + 1)) RV56.push(`${tg} revisione W${String(W)}: ${ver.kind}`);
              if (ver.kind === 'aggiungi-peso') caricoRev(K, ver, r, c, statiRevisione, dec, sessions, date, W, tg);
              if (rn() >= opz.accetta) { K.rifiuti += 1; dec.push({ id: nuovoId(), date, exercise: ver.exercise, decision: 'postponed', stateBefore: ver.stateBefore, stateAfter: ver.stateAfter, sessionLogId: `revisione-${String(W)}:${ver.exercise}` }); continue; }
              dec.push({ id: nuovoId(), date, exercise: ver.exercise, decision: 'accepted', stateBefore: ver.stateBefore, stateAfter: ver.stateAfter, sessionLogId: `revisione-${String(W)}:${ver.exercise}` });
              if (ver.kind === 'sali-di-livello' || ver.kind === 'aggiungi-peso') pendenti.set(ver.exercise, ver.stateBefore);
              stati.set(ver.exercise, ver.stateAfter);
            }
          }
          rivista = W;
        }
        const id = `${tag}-${c.id}-${String(run)}-${String(k).padStart(3, '0')}`;
        const exercises: LoggedExercise[] = [];
        for (const b of gb) {
          const ex = getExercise(b.exercise); const L = stati.get(ex.slug)!;
          const range = resolveBlockRange(b, ex, testsSim);
          if (range.kind !== 'range') continue;
          const valore = rn() < 0.75 ? range.range.max + (rn() < 0.3 ? 1 : 0) : range.range.max - 1;
          const giri = SCARICO.has(week) ? Math.max(1, Math.round(b.sets / 2)) : b.sets;
          let kg = ex.loadPolicy === 'forbidden' ? 0 : ex.loadPolicy === 'inherent' && L.loadKg === 0 ? 10 : L.loadKg;
          let livello = L.level;
          const prima = pendenti.get(ex.slug);
          if (prima !== undefined && rn() < opz.nonEsegue) { if (ex.loadPolicy !== 'forbidden' && prima.loadKg > 0) kg = prima.loadKg; livello = prima.level; aMano.add(`${ex.slug}|${date}`); }
          else if (ex.pattern !== null && L.level !== null && rn() < opz.manuale) { const nl = vicino(ex.pattern, L.level, rn() < 0.5 ? 1 : -1); if (nl !== null) { livello = nl as LevelIndex; K.manuali += 1; aMano.add(`${ex.slug}|${date}`); } }
          const sets: LoggedSet[] = [];
          for (let s = 1; s <= giri; s += 1) for (const side of (blockPerSide(b, stati) ? ['left', 'right'] : [null]) as ('left' | 'right' | null)[]) sets.push({ setIndex: s, side, value: valore, rir: 1, loadKg: kg, heartRate: null, note: null });
          exercises.push({ blockCode: b.code, exercise: ex.slug, variantLabel: 'c3', level: livello, tempoRespected: rn() < 0.9 ? true : null, sets, note: null });
        }
        pendenti.clear();
        const draft: LoggedSession = { id, date, week, sessionId: c.id, status: 'in-progress', exercises, note: null };
        const tolte = decadenzeApp(draft, dec, sessions, stati);
        K.decad += tolte.length;
        /* σ′ dell'app (SessionSummary a f7f945d) o di produzione */
        const tt = Tt === null ? null : Tt.tettoDelRiepilogo(Tt.statiDellaChiusura(draft, stati, dec as never, sessions), (s) => durP(c, new Map(s)));
        const vecchio: Stati = new Map(stati);
        /* σ′ di riferimento (§3) */
        const baseRif: Stati = new Map(stati);
        for (const [slug, L] of stati) baseRif.set(slug, syncRif(exercises, L));
        for (const t of tolte) baseRif.set(t.exercise, t.stato);
        const sopra: ExerciseState[] = [];
        const accettateOrd: { lever: string; next: ExerciseState }[] = [];
        const accettate: Stati = new Map();
        for (const b of c.blocks) {
          const logged = exercises.find((x) => x.blockCode === b.code);
          if (logged === undefined || logged.sets.length === 0) continue;
          const ex = getExercise(b.exercise); const L = stati.get(ex.slug)!;
          const input = { block: b, exercise: ex, state: L, logged, range: resolveBlockRange(b, ex, testsSim), week, currentMaxReps: ex.pattern === null ? null : (testsSim.get(testBaseline(ex.pattern)?.testId as TestId)?.value ?? null), salita: salitaConsentita(ex.slug, L.level, sessions, date, draft), rientro: null, aumentoRecente: aumentoRecente(ex.slug, dec.filter((x) => x.sessionLogId !== id && !idTolti(tolte).has(x.id ?? '')), sessions, date, draft), ...ingressoB1(ex.slug, draft, sessions), decaduta: tolte.find((t) => t.exercise === ex.slug)?.testo ?? null, durataCon: tt !== null ? tt.durataCon : (s: ExerciseState) => durP(c, new Map(vecchio).set(s.exercise, s)) } as Parameters<typeof evaluateProgression>[0];
          const ev = evaluateProgression(input);
          osservaB2(tag, ex.slug, L, ev, tolte, draft, dec, sessions);
          for (const lv of ev.levers) {
            if (lv.lever !== 'tempo' && lv.lever !== 'iso-pause') continue;
            if (!lv.available && lv.reason !== TESTO_R19) continue;
            const sig: Stati = new Map(baseRif);
            for (const p of sopra) { if (p.exercise === ex.slug) continue; if (durRif(c, new Map(sig).set(p.exercise, p)) > durRif(c, sig)) sig.set(p.exercise, p); }
            sig.set(ex.slug, passo(L, lv.lever === 'tempo' ? 'tempo' : 'pausa'));
            const dd = durRif(c, sig);
            K.sigmaConfr += 1; if (!lv.available) K.sigmaR19 += 1;
            if (lv.available && dd > TETTO) K.sigmaDiff.push(`${tg} ${date} ${ex.slug} ${lv.lever}: disponibile, σ′ di riferimento ${mmss(dd)}`);
            if (!lv.available && dd <= TETTO) K.sigmaDiff.push(`${tg} ${date} ${ex.slug} ${lv.lever}: fermato da R19, σ′ di riferimento ${mmss(dd)}`);
          }
          const sg = ev.suggestion;
          if (tt !== null) { if (sg !== null) tt.proposta(sg.nextState); }
          else if (sg !== null && (sg.lever === 'tempo' || sg.lever === 'iso-pause')) vecchio.set(ex.slug, sg.nextState);
          if (ev.levers.some((x) => !x.available && x.reason === TESTO_R19)) K.r19 += 1;
          const varianteAperta = ex.loadPolicy === 'allowed' && ex.pattern !== null && L.level !== null && vicino(ex.pattern, L.level, 1) !== null;
          if (varianteAperta && ev.levers.some((x) => !x.available && x.reason === TESTO_R19)) K.s5occ += 1;
          if (varianteAperta && sg?.lever === 'load') K.s5.push(`S5 ${tg} ${date} ${ex.slug} liv ${String(L.level)}: zavorra con la variante aperta`);
          if (sg?.lever === 'load' && ex.loadPolicy !== 'inherent' && sg.nextState.loadKg - L.loadKg > 2.5) K.s5.push(`S2 ${tg} ${date} ${ex.slug}: passo ${String(sg.nextState.loadKg - L.loadKg)} kg`);
          if (sg !== null && (SCARICO.has(week) || SCARICO.has(week + 1))) W56.push(`${tg} ${date} W${String(week)} ${ex.slug} → ${leva(ev)}`);
          if (sg === null) continue;
          K.prop += 1; sopra.push(sg.nextState);
          if (rn() >= opz.accetta) { K.rifiuti += 1; continue; }
          if (sg.lever === 'variant') K.varianti += 1;
          dec.push({ id: nuovoId(), date, exercise: ex.slug, decision: 'accepted', stateBefore: L, stateAfter: sg.nextState, sessionLogId: id });
          accettate.set(ex.slug, sg.nextState); accettateOrd.push({ lever: sg.lever, next: sg.nextState });
          if (sg.lever === 'load' || sg.lever === 'variant') pendenti.set(ex.slug, L);
        }
        /* L25.P1: prefisso delle accettate dalla base della chiusura */
        const pref: Stati = new Map(baseRif); let ultimoTP = -1; const lunghe: number[] = [];
        accettateOrd.forEach((a, i) => {
          const primaD = durRif(c, pref); pref.set(a.next.exercise, a.next);
          if (a.lever === 'tempo' || a.lever === 'iso-pause') { K.p1passi += 1; ultimoTP = i; const dd = durRif(c, pref); if (dd > TETTO) K.p1.push(`${tg} ${date}: dopo il passo di ${a.lever} su ${a.next.exercise} la seduta è ${mmss(dd)}`); }
          if (a.lever === 'variant' && durRif(c, pref) > primaD) lunghe.push(i);
        });
        const chiusa: LoggedSession = { ...draft, status: 'completed' };
        sessions.push(chiusa);
        const primaDur = durRif(c, stati);
        const tl3 = decadenzeApp(draft, dec, sessions, stati); const tolti3 = new Set(tl3.map((t) => t.exercise));
        for (const nuovo of statesToSave(syncStatesFromLog(chiusa, stati), accettate)) { if (tolti3.has(nuovo.exercise)) continue; stati.set(nuovo.exercise, nuovo); }
        for (const t of tl3) { dec.push(t.record); B2.lapsed += 1; stati.set(t.exercise, t.stato); accettate.delete(t.exercise); }
        for (const [slug, x] of accettate) stati.set(slug, x);
        K.sedute += 1;
        const dur = durRif(c, stati);
        if (dur > (K.max.get(c.id) ?? 0)) K.max.set(c.id, dur);
        if (dur > TETTO) {
          const causa = ultimoTP >= 0 && !lunghe.some((x) => x > ultimoTP) ? 'L25.P1: passo di tempo o pausa e nessuna variante che allunga dopo' : primaDur > TETTO ? 'già sopra prima della seduta' : lunghe.length > 0 ? 'variante che allunga (D5)' : 'altro: gradino scritto a mano o scelta tolta';
          K.chiuseOltre.set(causa, (K.chiuseOltre.get(causa) ?? 0) + 1);
          if (primaDur <= TETTO) K.crossing += 1;
          if ((causa.startsWith('L25') || causa.startsWith('altro')) && K.chiuseOltreEs.length < 6) K.chiuseOltreEs.push(`${tg} ${date}: ${mmss(primaDur)} → ${mmss(dur)} · ${causa}`);
        }
        const passoG = passi[k % passi.length]!; giorno += passoG; k += 1;
      }
      for (const b of gb) {
        const n0 = E7.length; e7(`${tg} ${b.exercise}`, b.exercise, dec, sessions); C3.e7 += E7.length - n0;
        if (aMano.size === 0) { s1Esecuzione(`${tg} ${b.exercise}`, b.exercise, sessions); continue; }
        /* C3R: le salite eseguite a meno di 14 giorni, separate fra quelle in cui c'è un gradino scritto a mano e le altre */
        let prec: number | null = null; let ultima: string | null = null; let manoPrima = false; let precData: string | null = null;
        for (const s of sessions.filter((x) => x.status === 'completed').slice().sort(ordina)) {
          const v = livRif(s.exercises.filter((x) => x.exercise === b.exercise)); if (v === null) continue;
          const mano = aMano.has(`${b.exercise}|${s.date}`) || (precData !== null && aMano.has(`${b.exercise}|${precData}`));
          if (prec !== null && v > prec) { if (ultima !== null && g(s.date) - g(ultima) < 14) { if (mano || manoPrima) K.s1mano += 1; else K.s1app.push(`${tg} ${b.exercise}: salite eseguite il ${ultima} e il ${s.date}`); } ultima = s.date; manoPrima = mano; }
          prec = v; precData = s.date;
        }
      }
    }
  }
}
simulaC3('C3', 2211, ATLETI3, { accetta: 1, nonEsegue: 0, manuale: 0 });
simulaC3('C3R', 2212, ATLETI3, { accetta: 0.6, nonEsegue: 0.25, manuale: 0.08 });

/* ======================================================= riepilogo ==== */
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
console.log(`15.19 (b) esercizi con un aumento datato dopo oggi: ${String(P1519.conFuturi)} · R13 assente o dal < d + 7: ${String(P1519.b.length + P1519.bAltre)}`);
for (const x of P1519.b.slice(0, 4)) console.log(`      ${x}`);
console.log(`15.19 (a) con tutte le date ≤ oggi, confronti con la produzione: ${Pp === null ? 'NON ESEGUITO (senza PROD)' : `${String(P1519.confronti)}, diversi ${String(P1519.a.length + P1519.aAltre)}`}`);
for (const x of P1519.a.slice(0, 4)) console.log(`      ${x}`);
console.log(`16.P coppie E, E⁺ entrambe in salita (riferimento, mondi di A): ${String(P16conti.coppie)} · tipo diverso: ${String(P16.length)}`);
for (const x of P16.slice(0, 4)) console.log(`      ${x}`);
console.log(`C — ${String(ATLETI)} atleti, ${String(SETT)} settimane, ${String(sedC)} sedute: aumenti proposti e accettati ${String(aumentiApp)}, pesi alzati a mano ${String(aumentiMano)}`);
console.log(`    13.P: ${String(viol.length)} · S1 sulle proposte: ${String(s1.length)} · S2 due carichi dell'app a meno di 7 giorni: ${String(s2.length)}`);
for (const x of [...viol.slice(0, 6), ...s1.slice(0, 4), ...s2.slice(0, 4)]) console.log(`      ${x}`);
for (const [tag, c] of C2conti) {
  console.log(`${tag} — ${String(ATLETI)} atleti, ${String(SETT)} settimane, ${String(c.sedute)} sedute: aumenti proposti e accettati ${String(c.aumenti)} · 13.P: ${String(c.viol.length)} · S1 sulle proposte: ${String(c.s1.length)}`);
  for (const x of [...c.viol.slice(0, 4), ...c.s1.slice(0, 4)]) console.log(`      ${x}`);
}
console.log(`S1 all'esecuzione (D-20: salite eseguite a meno di 14 giorni), C + C2 + C2R + C3: ${String(S1exec.length)}`);
for (const x of S1exec.slice(0, 6)) console.log(`      ${x}`);
console.log(`E7 — un aumento ogni 7 giorni contato all'esecuzione (D-20), C + C2 + C2R + C3: ${String(E7.length)} (C3 ${String(C3.e7)})`);
for (const x of E7.slice(0, 8)) console.log(`      ${x}`);
console.log(`D-21 · leve di fine seduta in scarico o nella settimana prima: ${String(W56.length)} · verdetti in salita della revisione con W+1 di scarico: ${String(RV56.length)}`);
for (const x of [...W56.slice(0, 6), ...RV56.slice(0, 4)]) console.log(`      ${x}`);
console.log(`E4 all'esecuzione, ogni via: scelte in salita accettate ${String(E4ESEC.tot)}, eseguite alla prima seduta dopo in scarico ${String(E4ESEC.scarico)} · per via: ${[...E4ESEC.perFonte].map(([x, m]) => `${x} ${String(m)}`).join(' · ') || '—'}`);
for (const x of E4ESEC.es) console.log(`      ${x}`);
let r13tot = 0; let mancTot = 0; let abuTot = 0; let p246tot = 0;
for (const [tag, o] of OSS) {
  r13tot += o.r13.length; mancTot += o.mancate; abuTot += o.abusive; p246tot += o.p246.length;
  console.log(`R14b ${tag}: fine seduta ${String(o.valutate)} · proposte ${String(o.nuove)}${Pp === null ? '' : ` (produzione sullo stesso ingresso: ${String(o.prod)})`} · M21 ${String(o.m21)} · proposta su voce non allo stato ${String(o.mancate)} · R14b su voce allo stato ${String(o.abusive)} · R13 engine ≠ riferimento ${String(o.r13.length)}`);
  if (Pp !== null) {
    console.log(`    D-21: proposte della produzione tolte ${String(o.d21tot)} (${[...o.d21].sort((a, b) => a[0] - b[0]).map(([w, m]) => `W${String(w)} ${String(m)}`).join(' · ') || '—'}) · testo D-23 ${String(o.d23)} · 24.6 differenze non spiegate: ${String(o.p246.length)} · sparite ${String(o.sparite)} · comparse ${String(o.comparse)}`);
    for (const x of o.p246.slice(0, 6)) console.log(`      24.6 ${x}`);
  }
  for (const x of [...o.es, ...o.r13.slice(0, 6)]) console.log(`      ${x}`);
}
for (const [tag, K] of C3conti) {
  console.log(`${tag} — circuito intero come l'app: ${String(ATLETI3)} atleti per circuito, ${String(SETT)} settimane, ${String(K.sedute)} sedute, ${String(K.prop)} proposte, ${String(K.r19)} leve fermate da R19, ${String(K.varianti)} varianti accettate · rifiuti ${String(K.rifiuti)} · scelte tolte ${String(K.decad)} · gradini scritti a mano ${String(K.manuali)}`);
  console.log(`    L25 σ′ codice ≠ riferimento del §3 (a due lati): ${String(K.sigmaDiff.length)} su ${String(K.sigmaConfr)} leve di tempo e pausa (fermate da R19: ${String(K.sigmaR19)})`);
  for (const x of K.sigmaDiff.slice(0, 6)) console.log(`      ${x}`);
  console.log(`    L25.P1 prefisso: passi di tempo o pausa accettati ${String(K.p1passi)}, oltre il tetto dopo il passo ${String(K.p1.length)} · sedute chiuse oltre il tetto per causa: ${[...K.chiuseOltre].map(([x, m]) => `${x} ${String(m)}`).join(' · ') || '—'} · attraversamenti (sotto prima, sopra dopo) ${String(K.crossing)}`);
  for (const x of [...K.p1.slice(0, 4), ...K.chiuseOltreEs]) console.log(`      ${x}`);
  console.log(`    durata massima dopo una seduta: ${[...K.max].map(([x, m]) => `${x} ${mmss(m)}`).join(' · ')}`);
  console.log(`    revisione con durata ≠ riferimento in due giri: ${String(K.revDiff.length)} su ${String(K.rev)} revisioni · alMassimo «tetto» ${String(K.tettoRev)} · per tipo: ${[...K.revTipi].map(([x, m]) => `${x} ${String(m)}`).join(' · ') || '—'}`);
  for (const x of K.revDiff.slice(0, 4)) console.log(`      ${x}`);
  console.log(`    M22.7 circuiti 1-3, uscita della revisione con e senza durata: diversi ${String(K.m227.length)} su ${String(K.m227n)}`);
  for (const x of K.m227.slice(0, 3)) console.log(`      ${x}`);
  console.log(`    M22.P: (i) tempo/pausa ${String(K.p.i)} · (ii) manubrio ${String(K.p.ii)} · (iii) tetto ${String(K.p.iii)} · (iv, info) variante col tetto ${String(K.p.iv)} · esclusi E4/D-21 ${String(K.p.esclusi)} · violazioni ${String(K.p.viol.length)} ${[...K.p.perTipo].map(([x, m]) => `${x} ${String(m)}`).join(' · ')}`);
  for (const x of K.p.viol.slice(0, 5)) console.log(`      ${x}`);
  console.log(`    M22.P (i) a parte: R13 ferma la leva a fine seduta, la revisione non dice nessuna data: ${String(K.p.r13)}`);
  for (const x of K.p.r13es) console.log(`      ${x}`);
  console.log(`    R-14 carichi della revisione: ${String(K.carico.n)} · violazioni S2/S5/D19.P/R13/E4/R10a ${String(K.carico.viol.length)} · fine seduta: S5/S2 ${String(K.s5.length)} (occasioni ${String(K.s5occ)})`);
  for (const x of [...K.carico.viol.slice(0, 5), ...K.s5.slice(0, 3)]) console.log(`      ${x}`);
  if (K.manuali > 0) { console.log(`    S1 all'esecuzione con gradini scritti a mano: salite a meno di 14 giorni con un gradino scritto a mano in mezzo ${String(K.s1mano)} (fuori dalle regole) · senza ${String(K.s1app.length)}`); for (const x of K.s1app.slice(0, 4)) console.log(`      ${x}`); }
}
console.log(`A2 — revisioni dei mondi con la durata (come Home e Revisione): ${String(A2.confronti)} revisioni, ${String(A2.esiti)} esiti, col tetto (riferimento) ${String(A2.conTetto)}: ${[...A2.cat].map(([x, m]) => `${x} ${String(m)}`).join(' · ') || '—'}`);
console.log(`    differenze engine ≠ riferimento in due giri: ${String([...A2.tipi.values()].reduce((t, x) => t + x, 0))} · ${[...A2.tipi].map(([x, m]) => `${String(m)} × ${x}`).join(' · ') || '—'}`);
for (const x of A2.diff.slice(0, 5)) console.log(`      es. ${x}`);
console.log(`    testi del §2 (tetto, variante, evidenza del manubrio) diversi: ${String(A2.testi)} · M22.7 esercizi dei circuiti 1-3 con uscita diversa da quella senza durata: ${String(A2.m227)} su ${String(A2.m227n)}`);
for (const x of [...A2.testiEs, ...A2.m227es]) console.log(`      ${x}`);
console.log(`    M22.P nei mondi: (i) ${String(A2.p.i)} · (ii) ${String(A2.p.ii)} · (iii) ${String(A2.p.iii)} · (iv) ${String(A2.p.iv)} · esclusi ${String(A2.p.esclusi)} · violazioni ${String(A2.p.viol.length)} ${[...A2.p.perTipo].map(([x, m]) => `${x} ${String(m)}`).join(' · ')}`);
for (const x of A2.p.viol.slice(0, 5)) console.log(`      ${x}`);
console.log(`    M22.P (i) informativo nei mondi: R13 a fine seduta senza la data in revisione ${String(A2.p.r13)}`);
for (const x of A2.p.r13es) console.log(`      ${x}`);
console.log(`\nB2 · P14 su fixture casuali: ${String(P14.casi)} casi, ${String(P14.decadute)} scelte tolte (${[...P14.perV].map(([x, m]) => `${x} ${String(m)}`).join(' · ')}) · decadenze ≠ testo: ${String(P14.diversi.length)} · testo R14a ≠ specifica: ${String(P14.testi.length)} · testo che non dice il vero sullo stato salvato: ${String(P14.verita.length)} · un numero che sale: ${String(P14.nessunNumeroSale.length)}`);
for (const x of [...P14.diversi.slice(0, 6), ...P14.testi.slice(0, 4), ...P14.nessunNumeroSale.slice(0, 4)]) console.log(`      ${x}`);
{ const tipi = new Map<string, number>(); for (const x of P14.verita) { const k = x.replace(/^P14 #\d+ (\S+) .*?: (dice|non dice)/, '$1: $2').replace(/ · «.*$/, '').replace(/[\d,.]+ kg/g, 'X kg'); tipi.set(k, (tipi.get(k) ?? 0) + 1); } for (const [k, m] of [...tipi].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`      verità ${String(m)} × ${k}`); for (const x of P14.verita.slice(0, 4)) console.log(`      es. ${x}`); console.log(`      verità per tipo: dice «di prima» ${String(P14.verita.filter((x) => x.includes('dice «tempo e pausa di prima»')).length)} · dice «della scheda» ${String(P14.verita.filter((x) => x.includes('dice «della scheda»')).length)} · non dice ${String(P14.verita.filter((x) => x.includes('non dice niente')).length)} · con il gradino della seduta sotto quello della scelta ${String(P14.verita.filter((x) => { const m = /c liv (\d) .* S liv (\d)/.exec(x); return m !== null && Number(m[2]) < Number(m[1]); }).length)}`); }
console.log(`B2 · syncStatesFromLog = sincronizzazione del testo (R14e, L2, D-23, manubrio cambiato, L24): ${String(P14.syncCasi)} ingressi, diversi ${String(P14.sync.length)}`);
for (const x of P14.sync.slice(0, 6)) console.log(`      ${x}`);
console.log(`B2 · simulazioni (C, C2, C2R, C3): fine seduta ${String(B2.valutate)} · scelte tolte e record lapsed ${String(B2.lapsed)} · R14a nel riepilogo ${String(B2.r14a)}, sbagliati ${String(B2.r14aKo.length)} · predicato R14 codice ≠ testo ${String(B2.predicato.length)} · stato salvato ≠ sincronizzazione da c.stateBefore ${String(B2.numeri.length)} · M18 (manubrio in attesa a B non tolto) ${String(B2.m18.length)} · testo non vero ${String(B2.verita.length)}`);
for (const x of [...B2.r14aKo.slice(0, 4), ...B2.predicato.slice(0, 6), ...B2.numeri.slice(0, 4), ...B2.m18.slice(0, 4), ...B2.verita.slice(0, 4)]) console.log(`      ${x}`);
console.log(`B2 · revisioni nelle simulazioni C e C2 confrontate con il riferimento (R14c, D-19 b, R13 senza le scelte tolte): ${String(B2.revConf)}, con un record lapsed nel registro ${String(B2.revConLapsed)}, rimandati «decaduta» ${String(B2.revDecaduta)} · diverse ${String(B2.revDiff.length)}`);
for (const x of B2.revDiff.slice(0, 6)) console.log(`      ${x}`);
console.log(`B2 · D19.P: proposte di manubrio in revisione ${String(D19P.rev)} (violazioni in B), a fine seduta ${String(D19P.fs)}, violazioni ${String(D19P.viol.length)}`);
for (const x of D19P.viol.slice(0, 6)) console.log(`      ${x}`);
for (const x of OSST) console.log(`B2 · OSS-T ${x}`);
console.log(`B14 · riquadro di calibrazione «Aggiungi 2,5 kg» nelle simulazioni: voci con un peso scritto ${String(CAL.sedute)} · «Aggiungi» ${String(CAL.aggiungi)} · di cui con R13 attivo nello stesso riepilogo ${String(CAL.conR13)}, in settimana di scarico ${String(CAL.scarico)}, nella settimana prima dello scarico (D-21) ${String(CAL.settPrima)}, con R14a ${String(CAL.r14a)}, senza un «sì» sul tempo ${String(CAL.tempoNonSi)}, manubrio fuori elenco ${String(CAL.fuoriElenco)} · per esercizio: ${[...CAL.perEs].map(([x, m]) => `${x} ${String(m)}`).join(' · ')}`);
for (const x of CAL.es) console.log(`      ${x}`);
if (ROLL.length > 0) { console.log('B2 · rollback a e30cdc6 con un registro che contiene `lapsed`:'); for (const x of ROLL) console.log(`      ${x}`); }
const nB2 = B2.revDiff.length + P14.diversi.length + P14.testi.length + P14.nessunNumeroSale.length + P14.sync.length + B2.r14aKo.length + B2.predicato.length + B2.numeri.length + B2.m18.length + D19P.viol.length;
if (nB2 > 0) process.exitCode = 1;
const nP1519 = P1519.a.length + P1519.aAltre + P1519.b.length + P1519.bAltre;
if (difettiF + diff.length + prop.length + viol.length + s2.length + S1exec.length + E7.length + r13tot + mancTot + abuTot + p246tot + nP1519 + P16.length + W56.length + RV56.length + [...C3conti.values()].reduce((t, K) => t + K.sigmaDiff.length + K.p1.length + K.revDiff.length + K.m227.length + K.p.viol.length + K.carico.viol.length + K.s5.length + K.s1app.length, 0) + [...A2.tipi.values()].reduce((t, x) => t + x, 0) + A2.testi + A2.m227 + A2.p.viol.length + [...C2conti.values()].reduce((t, c) => t + c.viol.length, 0) > 0) process.exitCode = 1;
