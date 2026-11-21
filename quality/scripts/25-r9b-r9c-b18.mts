/*
 * 25 — R9c completato (cc95fac), R9b (93cf066), B18 (7b28b13), sul codice, senza browser né emulatore.
 *
 * Uso, dalla radice di un `git archive`: node --experimental-strip-types quality/scripts/25-r9b-r9c-b18.mts
 * Seme fisso: ripetibile. Nessun campo di testo letto. Gli attesi vengono da R1/R9b riscritte qui dal testo
 * della specifica (training/reports/2026-11-21-training-b9-b10-m4.md §3), non dal codice che le produce.
 *
 * A · dettagli dei controlli del nucleo v14 (valori, testi), per il rapporto.
 * B · 9.29 di training-designer, prova di proprietà indipendente: storie casuali con chiusure del player,
 *     «Archivia», ritest di ogni segno, «Applica» / «Lascia com'è» e una migrazione che arriva in un momento
 *     qualunque (anche dopo un ritest) su una storia chiusa come prima. Dopo ogni ritest: (B1) nessun
 *     esercizio con sedute chiuse sale; (B2) nessuno scende da solo; (B3) ogni proposta attesa da R9b c'è,
 *     al gradino atteso, e nessuna proposta in più; dopo la migrazione e dopo «Archivia»: (B4) lo stato
 *     fissato è il gradino della seduta (quello che l'app mostrava quel giorno).
 * C · R7 e R13 dopo «Applica» (9.23): la discesa non conta come aumento; si risale 14 giorni dopo la prima
 *     seduta al gradino nuovo.
 * D · Catalogo: esercizi `inherent` con una scala (la guardia di B18 è raggiungibile?); `rigaOtto` contro R1
 *     riga 8 riscritta qui.
 */
import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { EXERCISES, getExercise } from '../../src/data/exercises.ts';
import { testBaseline } from '../../src/data/tests.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import * as Prog from '../../src/engine/progression.ts';
import * as Draft from '../../src/engine/draft.ts';
import * as Repo from '../../src/db/repository.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedSession, TestId, TestResult } from '../../src/types/index.ts';

type Proposta = { id: string; testId: TestId; data: string; verdict: { exercise: ExerciseSlug; kind: string; lever: string; title: string; evidence: string; change: string; stateBefore: ExerciseState; stateAfter: ExerciseState } };
type R = {
  saveTestResult(r: TestResult): Promise<unknown>; getExerciseState(s: ExerciseSlug): Promise<ExerciseState>;
  saveExerciseState(s: ExerciseState): Promise<unknown>; saveSession(s: LoggedSession): Promise<unknown>;
  getConfirmedStates(s: readonly ExerciseSlug[]): Promise<ReadonlySet<ExerciseSlug>>;
  listSuggestions(slug?: ExerciseSlug): Promise<{ id: string; decision: string; lever: string; exercise: ExerciseSlug; date: string; stateBefore: ExerciseState | null; stateAfter: ExerciseState | null }[]>;
  listSessions?: () => Promise<LoggedSession[]>;
  fissaStatiMancanti?: () => Promise<number>; archiviaSeduta?: (s: LoggedSession) => Promise<number>;
  proposteRitest?: () => Promise<Proposta[]>; decidiRitest?: (p: Proposta, a: boolean, oggi: string) => Promise<void>;
};
const nuovo = (): R => new (Repo as unknown as { ShadowRepository: new () => R }).ShadowRepository();
const D = Draft as unknown as {
  syncStatesFromLog(s: LoggedSession, m: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statesToSave(x: readonly ExerciseState[], a: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statiDaFissare?: (s: readonly LoggedSession[], g: ReadonlySet<ExerciseSlug>, c: (x: ExerciseSlug) => ExerciseState | undefined) => ExerciseState[];
};
const P = Prog as unknown as { aumenti?: (slug: ExerciseSlug, dec: readonly unknown[], s: readonly LoggedSession[]) => { date: string }[]; salitaConsentita: (slug: ExerciseSlug, l: LevelIndex | null, s: readonly LoggedSession[], oggi: string) => { consentita: boolean; inizio: string | null }; rigaOtto?: (e: unknown) => { testId: TestId; livelloTest: number; soglia: number; giu: number; primo: number; dove: string } | null };

const serie = (v: number[], kg = 0) => v.map((x, i) => ({ setIndex: i + 1, side: null, value: x, rir: null, loadKg: kg, heartRate: null, note: null }));
const voce = (code: string, slug: ExerciseSlug, level: LevelIndex | null, v: number[], kg = 0) => ({ blockCode: code, exercise: slug, variantLabel: 'fixture', level, tempoRespected: true, sets: serie(v, kg), note: null });
const seduta = (id: string, date: string, week: number, sessionId: string, ex: unknown[], status = 'completed') => ({ id, date, week, sessionId, status, exercises: ex, note: null }) as unknown as LoggedSession;
const prova = (testId: string, date: string, week: number, value: number) => ({ testId, date, week, value, left: null, right: null }) as unknown as TestResult;

/* La chiusura del player (chiudi / saveAndExit), letta dal sorgente nel nucleo v13-v14. */
async function chiudi(repo: R, s: LoggedSession, conR9c: boolean): Promise<void> {
  const slugs = [...new Set(s.exercises.map((e) => e.exercise))];
  const states = new Map(await Promise.all(slugs.map(async (x) => [x, await repo.getExerciseState(x)] as const)));
  const confirmed = await repo.getConfirmedStates(slugs);
  const salvati = D.statesToSave(D.syncStatesFromLog(s, states), new Map());
  for (const x of salvati) await repo.saveExerciseState(x);
  if (conR9c && D.statiDaFissare !== undefined) {
    const gia = new Set([...confirmed, ...salvati.map((x) => x.exercise)]);
    for (const x of D.statiDaFissare([s], gia, (k) => states.get(k))) await repo.saveExerciseState(x);
  }
  await repo.saveSession(s);
}

/* R1 riga 8 e R9b riscritte dal testo (come nel nucleo, caso 2). */
const SOLO_ECC: Record<string, number[]> = { 'vertical-pull': [2], 'vertical-push': [3], dip: [2], 'posterior-chain': [2, 3, 4] };
const ecc = (p: string, l: number): boolean => (SOLO_ECC[p] ?? []).includes(l);
const primo = (p: string): number => { for (let c = 1; c <= 6; c += 1) if (!ecc(p, c)) return c; return 1; };
const giu = (p: string, L: number): number => { for (let c = L - 1; c >= 1; c -= 1) if (!ecc(p, c)) return c; return 1; };
const rirMax = (r: string): number => (r === '—' ? 0 : Number(r.split('-').at(-1)));
type Riga = { slug: ExerciseSlug; pattern: string; testId: TestId; Lt: number; soglia: number; giu: number; primo: number; code: string; sid: string; min: number };
const righe: Riga[] = [];
{
  const visti = new Set<string>();
  for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) {
    if (visti.has(b.exercise)) continue; visti.add(b.exercise);
    const e = getExercise(b.exercise);
    if (e.pattern === null || e.defaultLevel === null) continue;
    const B = CIRCUIT_SESSIONS.flatMap((x) => x.blocks.filter((y) => y.exercise === b.exercise && y.excludeFromReview !== true).map((y) => ({ y, sid: x.id })));
    const t = testBaseline(e.pattern);
    if (B.length === 0 || t === null || e.defaultLevel < t.level || t.measurement !== e.measurement) continue;
    const soglie = B.flatMap(({ y }) => y.prescription.kind === 'reps' ? [y.prescription.min + rirMax(y.rir)] : y.prescription.kind === 'seconds' ? [y.prescription.min + Math.ceil(0.2 * y.prescription.min)] : []);
    if (soglie.length === 0) continue;
    const b0 = B[0]!;
    const min = b0.y.prescription.kind === 'reps' || b0.y.prescription.kind === 'seconds' ? b0.y.prescription.min : 5;
    righe.push({ slug: b.exercise, pattern: e.pattern, testId: t.testId, Lt: t.level, soglia: Math.max(...soglie), giu: giu(e.pattern, t.level), primo: primo(e.pattern), code: b0.y.code, sid: b0.sid, min });
  }
}
const r9bAtteso = (r: Riga, L: number | null, M: number): number | null => {
  if (L === null) return null;
  if (M > 0 && M < r.soglia && L > r.giu) return r.giu;
  if (M === 0 && L > r.primo) return r.primo;
  return null;
};

/* ---------------- D · catalogo ---------------- */
console.log('D · catalogo');
const inerentiConScala = EXERCISES.filter((e) => e.loadPolicy === 'inherent' && e.pattern !== null).map((e) => e.slug);
console.log(`  D1 esercizi \`inherent\` con una scala: ${String(inerentiConScala.length)}${inerentiConScala.length > 0 ? ` (${inerentiConScala.join(', ')})` : ''}`);
const nelleSedute = new Set(CIRCUIT_SESSIONS.flatMap((s) => s.blocks.map((b) => b.exercise)));
console.log(`  D1b di questi nelle sedute: ${inerentiConScala.filter((x) => nelleSedute.has(x)).join(', ') || 'nessuno'}`);
if (P.rigaOtto !== undefined) {
  const diff: string[] = [];
  const app = new Set<string>();
  for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) {
    const ro = P.rigaOtto(getExercise(b.exercise));
    if (ro !== null) app.add(b.exercise);
  }
  for (const r of righe) {
    const ro = P.rigaOtto(getExercise(r.slug));
    if (ro === null) { diff.push(`${r.slug}: app null`); continue; }
    if (ro.testId !== r.testId || ro.livelloTest !== r.Lt || ro.soglia !== r.soglia || ro.giu !== r.giu || ro.primo !== r.primo) diff.push(`${r.slug}: app ${JSON.stringify({ t: ro.testId, Lt: ro.livelloTest, s: ro.soglia, g: ro.giu, p: ro.primo })} contro ${JSON.stringify({ t: r.testId, Lt: r.Lt, s: r.soglia, g: r.giu, p: r.primo })}`);
  }
  const extra = [...app].filter((x) => !righe.some((r) => r.slug === x));
  console.log(`  D2 rigaOtto contro R1 riga 8 riscritta: ${String(righe.length)} esercizi (${righe.map((r) => `${r.slug} Lt ${String(r.Lt)} soglia ${String(r.soglia)} giù ${String(r.giu)} primo ${String(r.primo)}`).join('; ')}); differenze ${diff.length === 0 ? 'nessuna' : diff.join(' | ')}; in più nell'app ${extra.join(', ') || 'nessuno'}`);
} else console.log('  D2 rigaOtto assente');

/* ---------------- A · dettagli ---------------- */
console.log('A · dettagli');
for (const [slug, testId, code, sid] of [['trazioni-prona-presa-media', 'pull-up', 'A1', 'circuito-1'], ['dip-parallele-anelli', 'dip', 'A3', 'circuito-1']] as const) {
  for (const kg of [5, 0]) {
    const st: ExerciseState = { exercise: slug as ExerciseSlug, level: 6 as LevelIndex, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, loadKg: kg };
    const coppia = ['2026-03-11', '2026-03-13'].map((d, i) => seduta(`q${String(i)}`, d, 2, sid, [voce(code, slug as ExerciseSlug, 6 as LevelIndex, [3, 3, 3], kg)]));
    const r = reviewWeek({ week: 2, sessions: coppia, states: new Map([[slug as ExerciseSlug, st]]), tests: new Map([[testId as TestId, prova(testId, '2026-02-23', 0, 12)]]), weekEnd: '2026-03-15', today: '2026-03-16', decisioni: [] } as never);
    const v = r.verdicts.find((x) => x.exercise === slug);
    console.log(`  A1 ${slug} 6, ${String(kg)} kg, +2/+2, 3-3-3 ×2: ${v?.kind ?? '—'} → ${JSON.stringify(v?.stateAfter ?? null)} · «${v?.change ?? ''}»`);
  }
}
let Rt: { propostaRitest?: (s: ExerciseSlug, st: ExerciseState, r: TestResult) => Proposta | null } = {};
try { Rt = (await import('../../src/engine/ritest.ts')) as typeof Rt; } catch { Rt = {}; }
if (Rt.propostaRitest !== undefined) {
  const tz = 'trazioni-prona-presa-media' as ExerciseSlug;
  for (const [L, kg, M, w] of [[6, 5, 5, 6], [3, 0, 5, 6], [3, 0, 9, 6], [5, 0, 9, 6], [1, 0, 5, 6], [5, 0, 5, 6], [3, 0, 0, 6], [1, 0, 0, 6], [3, 0, 5, 0], [3, 0, 5, 2]] as const) {
    const p = Rt.propostaRitest(tz, { exercise: tz, level: L as LevelIndex, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, loadKg: kg }, prova('pull-up', '2026-04-11', w, M));
    console.log(`  A2 trazioni L=${String(L)} ${String(kg)} kg M=${String(M)} sett. ${String(w)}: ${p === null ? 'niente' : `${String(p.verdict.stateBefore.level)}→${String(p.verdict.stateAfter.level)} ${JSON.stringify(p.verdict.stateAfter)} · «${p.verdict.title}» · «${p.verdict.evidence}» · «${p.verdict.change}»`}`);
  }
  const hh = 'hollow-hold' as ExerciseSlug;
  for (const M of [30, 40, 35, 36]) {
    const p = Rt.propostaRitest(hh, { exercise: hh, level: 3 as LevelIndex, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 }, prova('hollow-hold', '2026-04-11', 6, M));
    console.log(`  A3 hollow L=3 M=${String(M)}″: ${p === null ? 'niente' : `3→${String(p.verdict.stateAfter.level)} · «${p.verdict.evidence}»`}`);
  }
} else console.log('  A2 ritest.ts assente');

/* ---------------- C · R7 e R13 dopo «Applica» ---------------- */
console.log('C · 9.23: R7 e R13 dopo «Applica»');
{
  const repo = nuovo();
  if (repo.proposteRitest === undefined || repo.decidiRitest === undefined) console.log('  R9b assente');
  else {
    const tz = 'trazioni-prona-presa-media' as ExerciseSlug;
    await repo.saveTestResult(prova('pull-up', '2026-03-02', 0, 8));
    const s0 = await repo.getExerciseState(tz);
    await chiudi(repo, seduta('c0', '2026-03-04', 1, 'circuito-1', [voce('A1', tz, s0.level, [6, 6, 6])]), true);
    await repo.saveTestResult(prova('pull-up', '2026-04-11', 6, 5));
    const p = (await repo.proposteRitest()).find((x) => x.verdict.exercise === tz)!;
    await repo.decidiRitest(p, true, '2026-04-12');
    const dopo = await repo.getExerciseState(tz);
    const dec = await repo.listSuggestions(tz);
    const sedute: LoggedSession[] = [seduta('c0', '2026-03-04', 1, 'circuito-1', [voce('A1', tz, s0.level, [6, 6, 6])])];
    const date = ['2026-04-13', '2026-04-16', '2026-04-20', '2026-04-23', '2026-04-27', '2026-04-30'];
    date.forEach((d, i) => sedute.push(seduta(`c${String(i + 1)}`, d, 7 + Math.floor(i / 2), 'circuito-1', [voce('A1', tz, dopo.level, [12, 12, 12])])));
    const au = P.aumenti === undefined ? null : P.aumenti(tz, dec as never, sedute);
    const giorni = ['2026-04-20', '2026-04-26', '2026-04-27', '2026-05-04'].map((g) => `${g}: ${String(P.salitaConsentita(tz, dopo.level as LevelIndex, sedute.filter((s) => s.date < g), g).consentita)}`);
    console.log(`  stato ${String(s0.level)} → ${JSON.stringify(dopo)}; registro ${JSON.stringify(dec.map((x) => [x.id, x.decision, x.lever]))}; aumenti contati ${au === null ? 'funzione assente' : JSON.stringify(au)}; R7 (prima seduta al ${String(dopo.level)} il 04-13): ${giorni.join(', ')}`);
  }
}

/* ---------------- B · 9.29 proprietà ---------------- */
let seme = 20261121;
const rnd = (n: number): number => { seme = (seme * 1103515245 + 12345) % 2147483648; return Math.floor(seme / 65536) % n; };
const VALORI = [0, 1, 3, 5, 7, 8, 9, 10, 12, 13, 14, 16, 20, 30, 35, 36, 45, 60];
const BASSI = [0, 3, 5, 8, 10, 14, 20, 36, 45];
const repoVero = nuovo();
const haR9b = repoVero.proposteRitest !== undefined;
const haArch = repoVero.archiviaSeduta !== undefined;
const haMig = repoVero.fissaStatiMancanti !== undefined;
console.log(`B · 9.29 (R9b ${String(haR9b)}, «Archivia» ${String(haArch)}, migrazione ${String(haMig)})`);
let storie = 0, ritest = 0, controlli = 0, proposteAttese = 0, archiviate = 0, migrazioni = 0, applica = 0;
const viol: Record<string, string[]> = { B1: [], B2: [], B3: [], B4: [] };
const nota = (k: string, x: string): void => { if (viol[k]!.length < 4) viol[k]!.push(x); else viol[k]!.push(''); };
for (let k = 0; k < 1200; k += 1) {
  storie += 1;
  const repo = nuovo();
  const fatti = new Map<ExerciseSlug, number | null>(); /* esercizio → gradino dell'ultima seduta */
  const vecchia = haMig && rnd(2) === 0; /* storia chiusa come prima, poi la migrazione */
  let migrata = !vecchia;
  let giorno = Date.UTC(2026, 2, 2);
  const data = (): string => new Date(giorno).toISOString().slice(0, 10);
  for (const t of new Set(righe.map((r) => r.testId))) await repo.saveTestResult(prova(t, data(), 0, BASSI[rnd(BASSI.length)]!));
  let aperta: LoggedSession | null = null;
  const verificaFissati = async (cosa: string, attesi: Map<ExerciseSlug, number | null>): Promise<void> => {
    for (const [x, l] of attesi) {
      const ora = (await repo.getExerciseState(x)).level;
      if (ora !== l) nota('B4', `${cosa}: ${x} fissato a ${String(ora)}, la seduta era al ${String(l)}`);
    }
  };
  for (let passo = 0; passo < 14; passo += 1) {
    giorno += 86_400_000 * (1 + rnd(4));
    const settimana = 1 + Math.floor((giorno - Date.UTC(2026, 2, 2)) / (7 * 86_400_000));
    const mossa = rnd(10);
    if (!migrata && (mossa === 9 || passo === 13)) {
      const salvatiPrima = new Set((await Promise.all([...fatti.keys()].map(async (x) => [x, (await repo.getConfirmedStates([x])).has(x)] as const))).filter(([, v]) => v).map(([x]) => x));
      await repo.fissaStatiMancanti!();
      migrata = true; migrazioni += 1;
      await verificaFissati('migrazione', new Map([...fatti].filter(([x]) => !salvatiPrima.has(x))));
      continue;
    }
    if (mossa <= 2) {
      /* ritest */
      const r = righe[rnd(righe.length)]!;
      const M = VALORI[rnd(VALORI.length)]!;
      const prima = new Map(await Promise.all([...fatti.keys()].map(async (x) => [x, (await repo.getExerciseState(x)).level] as const)));
      await repo.saveTestResult(prova(r.testId, data(), Math.max(1, settimana), M));
      ritest += 1;
      const proposte = haR9b ? await repo.proposteRitest!() : [];
      for (const [x, l] of prima) {
        controlli += 1;
        const dopo = (await repo.getExerciseState(x)).level;
        if (!migrata) continue; /* prima della migrazione la storia è quella dell'app di prima (R-17): non si giudica */
        if ((dopo ?? 0) > (l ?? 0)) nota('B1', `${x} ${String(l)}→${String(dopo)} dopo ${r.testId}=${String(M)}`);
        if ((dopo ?? 0) < (l ?? 0)) nota('B2', `${x} ${String(l)}→${String(dopo)} da solo dopo ${r.testId}=${String(M)}`);
        const rx = righe.find((y) => y.slug === x && y.testId === r.testId);
        if (rx === undefined) continue;
        const att = r9bAtteso(rx, dopo, M);
        const p = proposte.find((y) => y.verdict.exercise === x && y.data === data());
        if (att !== null) proposteAttese += 1;
        if (att === null && p !== undefined) nota('B3', `${x} L=${String(dopo)} M=${String(M)}: proposta ${String(p.verdict.stateAfter.level)} non attesa`);
        if (att !== null && (p === undefined || p.verdict.stateAfter.level !== att || p.verdict.stateAfter.loadKg !== 0)) nota('B3', `${x} L=${String(dopo)} M=${String(M)} soglia ${String(rx.soglia)}: atteso ${String(att)}, proposta ${p === undefined ? 'assente' : String(p.verdict.stateAfter.level)}`);
        if (p !== undefined && (p.verdict.stateAfter.level ?? 0) >= (p.verdict.stateBefore.level ?? 0)) nota('B1', `${x}: proposta che non scende ${String(p.verdict.stateBefore.level)}→${String(p.verdict.stateAfter.level)}`);
      }
      /* decisione a caso su metà delle proposte */
      for (const p of proposte) {
        if (rnd(2) === 0) continue;
        const acc = rnd(2) === 0;
        await repo.decidiRitest!(p, acc, data());
        if (acc) { applica += 1; fatti.set(p.verdict.exercise, p.verdict.stateAfter.level); }
      }
      continue;
    }
    const scelte = [righe[rnd(righe.length)]!, righe[rnd(righe.length)]!].filter((r, i, a) => a.findIndex((y) => y.slug === r.slug) === i);
    const ex = await Promise.all(scelte.map(async (r) => voce(r.code, r.slug, (await repo.getExerciseState(r.slug)).level, [r.min, r.min])));
    if (aperta !== null && haArch && migrata) {
      /* «Archivia» della seduta rimasta aperta (con o senza ritest in mezzo) */
      const salvatiPrima = new Set((await Promise.all(aperta.exercises.map(async (v) => [v.exercise, (await repo.getConfirmedStates([v.exercise])).has(v.exercise)] as const))).filter(([, v]) => v).map(([x]) => x));
      await repo.archiviaSeduta!(aperta);
      archiviate += 1;
      const attesi = new Map(aperta.exercises.filter((v) => !salvatiPrima.has(v.exercise)).map((v) => [v.exercise, v.level] as const));
      await verificaFissati('«Archivia»', attesi);
      for (const v of aperta.exercises) fatti.set(v.exercise, v.level);
      aperta = null;
      continue;
    }
    if (mossa === 3 && haArch && migrata && aperta === null) {
      aperta = seduta(`a${String(passo)}`, data(), settimana, scelte[0]!.sid, ex, 'in-progress');
      await repo.saveSession(aperta);
      continue;
    }
    await chiudi(repo, seduta(`p${String(passo)}`, data(), settimana, scelte[0]!.sid, ex), migrata);
    for (const e of ex) fatti.set(e.exercise, e.level);
  }
}
const conta = (k: string): string => `${String(viol[k]!.length)}${viol[k]!.filter((x) => x !== '').length > 0 ? ` (es. ${viol[k]!.filter((x) => x !== '').join('; ')})` : ''}`;
console.log(`  ${String(storie)} storie, ${String(ritest)} ritest, ${String(controlli)} controlli esercizio×ritest, ${String(proposteAttese)} proposte attese, ${String(applica)} «Applica», ${String(archiviate)} «Archivia», ${String(migrazioni)} migrazioni`);
console.log(`  B1 salite dopo un test: ${conta('B1')}`);
console.log(`  B2 discese da sole: ${conta('B2')}`);
console.log(`  B3 proposte R9b diverse dall'attesa: ${conta('B3')}`);
console.log(`  B4 stati fissati diversi dal gradino della seduta: ${conta('B4')}`);

/* ---------------- E · 9.25 e un esercizio mai fatto ---------------- */
console.log('E · 9.25 e R9c punto 3');
{
  const repo = nuovo();
  if (repo.proposteRitest === undefined) console.log('  R9b assente');
  else {
    const tz = 'trazioni-prona-presa-media' as ExerciseSlug;
    await repo.saveTestResult(prova('pull-up', '2026-03-02', 0, 8));
    const s0 = await repo.getExerciseState(tz);
    await chiudi(repo, seduta('e0', '2026-03-04', 1, 'circuito-1', [voce('A1', tz, s0.level, [6, 6, 6])]), true);
    await repo.saveTestResult(prova('pull-up', '2026-04-11', 6, 5));
    const p1 = (await repo.proposteRitest()).filter((x) => x.verdict.exercise === tz).map((x) => `${x.id} ${String(x.verdict.stateAfter.level)}`);
    await repo.saveTestResult(prova('pull-up', '2026-04-12', 6, 9));
    const p2 = (await repo.proposteRitest()).filter((x) => x.verdict.exercise === tz).map((x) => x.id);
    const l2 = (await repo.getExerciseState(tz)).level;
    console.log(`  9.25: dopo M=5 ${JSON.stringify(p1)}; rifatte il giorno dopo con M=9: proposte ${JSON.stringify(p2)}, gradino ${String(l2)} (atteso: nessuna proposta, gradino ${String(s0.level)})`);
    const r2 = nuovo();
    const dip = 'dip-parallele-anelli' as ExerciseSlug;
    await r2.saveTestResult(prova('dip', '2026-03-02', 0, 8));
    const d0 = (await r2.getExerciseState(dip)).level;
    await r2.saveTestResult(prova('dip', '2026-04-11', 6, 5));
    const d1 = (await r2.getExerciseState(dip)).level;
    const pd = (await r2.proposteRitest!()).filter((x) => x.verdict.exercise === dip).length;
    console.log(`  R9c punto 3: dip mai fatto, test 8 → ${String(d0)}, ritest 5 → ${String(d1)} (calcolato da R1), proposte ${String(pd)}`);
  }
}
