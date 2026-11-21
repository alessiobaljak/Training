/*
 * 22 — R9c (B16) e domanda 4 del designer, sul codice, senza browser.
 *
 * Parte A · domanda 4 (S5): `scendi-di-livello` tiene `loadKg`? Trazioni al gradino 6 con zavorra (tempo e
 *   pausa esauriti, come dopo R6/R10a), due sedute della settimana tutte sotto il minimo: verdetto e stato
 *   dopo. Controllo: stessa coppia a 0 kg. Seconda leva: dip al 6. Atteso (S5, R9b «sotto l'ultimo gradino
 *   la zavorra non sta»): stateAfter.loadKg = 0 quando il gradino scende sotto l'ultimo.
 * Parte B · 9.29 di training-designer (proprietà, non implementata nel commit): storie casuali di test e
 *   sedute, chiusura come l'app (`chiudi`/`saveAndExit` dal 704dbfa); dopo ogni test nessun esercizio con
 *   sedute chiuse ha un gradino più alto di prima. Seme fisso, ripetibile.
 * Parte C · lo specchio (R9c punto 4 + R9b): dopo un test peggiore nessun esercizio fatto scende, e non c'è
 *   proposta. Conta, per i 7 esercizi esposti, prima (chiusura di prima) e dopo (chiusura come l'app).
 * Uso, dalla radice di un `git archive`: node --experimental-strip-types quality/scripts/22-r9c.mts
 */
import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import { testResultSingle } from '../../src/engine/ranges.ts';
import { startingLevel } from '../../src/engine/progression.ts';
import * as Draft from '../../src/engine/draft.ts';
import * as Repo from '../../src/db/repository.ts';
import type { ExerciseSlug, ExerciseState, LoggedSession, TestId } from '../../src/types/index.ts';

const D = Draft as unknown as {
  syncStatesFromLog(s: LoggedSession, m: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statesToSave(x: readonly ExerciseState[], a: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statiDaFissare?: (s: readonly LoggedSession[], g: ReadonlySet<ExerciseSlug>, c: (x: ExerciseSlug) => ExerciseState | undefined) => ExerciseState[];
};
type R = { saveTestResult(r: unknown): Promise<unknown>; getExerciseState(s: ExerciseSlug): Promise<ExerciseState>;
  saveExerciseState(s: ExerciseState): Promise<unknown>; saveSession(s: LoggedSession): Promise<unknown>;
  getConfirmedStates(s: readonly ExerciseSlug[]): Promise<ReadonlySet<ExerciseSlug>> };
const nuovo = (): R => new (Repo as unknown as { ShadowRepository: new () => R }).ShadowRepository();
const serie = (v: number[]) => v.map((x, i) => ({ setIndex: i + 1, side: null, value: x, rir: 2, loadKg: 0, heartRate: null, note: null }));
const voce = (code: string, slug: string, level: number | null, v: number[], kg = 0) => ({
  blockCode: code, exercise: slug, variantLabel: 'fixture', level, tempoRespected: true,
  sets: serie(v).map((s) => ({ ...s, loadKg: kg })), note: null });
const seduta = (id: string, date: string, week: number, sessionId: string, ex: unknown[]) =>
  ({ id, date, week, sessionId, status: 'completed', exercises: ex, note: null }) as unknown as LoggedSession;

/* La chiusura dell'app: stati cambiati dal diario, poi (R9c) gli esercizi fatti e non ancora scritti. */
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

/* ---------------- A · domanda 4 ---------------- */
console.log('A · domanda 4: scendi-di-livello e zavorra (S5)');
for (const [slug, test, code, sid] of [['trazioni-prona-presa-media', 'pull-up', 'A1', 'circuito-1'], ['dip-parallele-anelli', 'dip', 'A3', 'circuito-1']] as const) {
  for (const kg of [5, 0]) {
    const st: ExerciseState = { exercise: slug as ExerciseSlug, level: 6 as never, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2, loadKg: kg };
    const coppia = [seduta('q1', '2026-03-11', 2, sid, [voce(code, slug, 6, [3, 3, 3], kg)]), seduta('q2', '2026-03-13', 2, sid, [voce(code, slug, 6, [3, 3, 3], kg)])];
    const tests = new Map([[test as TestId, testResultSingle(test as never, '2026-02-23', 0, 12)]]);
    const r = reviewWeek({ week: 2, sessions: coppia, states: new Map([[slug as ExerciseSlug, st]]), tests, weekEnd: '2026-03-15', today: '2026-03-16', decisioni: [] } as never);
    const v = r.verdicts.find((x) => x.exercise === slug);
    console.log(`  ${slug} gradino 6, ${String(kg)} kg, 3-3-3 ×2: ${v?.kind ?? 'nessun verdetto'} → stateAfter ${JSON.stringify(v?.stateAfter ?? null)}${v !== undefined ? ` · testo «${v.change}»` : ''}`);
  }
}

/* ---------------- B · 9.29 proprietà ---------------- */
const prove = ['pull-up', 'dip', 'push-up', 'inverted-row-trx', 'pike-push-up', 'bulgarian-split-squat', 'hollow-hold'];
const blocchi = CIRCUIT_SESSIONS.flatMap((s) => s.blocks.map((b) => ({ s: s.id, b })))
  .filter(({ b }) => b.excludeFromReview !== true)
  .filter(({ b }) => {
    const ex = getExercise(b.exercise);
    const lo = startingLevel(ex, new Map(prove.map((t) => [t, testResultSingle(t as never, '2026-03-02', 0, 1)])) as never);
    const hi = startingLevel(ex, new Map(prove.map((t) => [t, testResultSingle(t as never, '2026-03-02', 0, 999)])) as never);
    return lo !== hi;
  });
let seme = 20261121;
const SEME = seme;
const rnd = (n: number): number => { seme = (seme * 1103515245 + 12345) % 2147483648; return Math.floor(seme / 65536) % n; };
const VALORI = [0, 1, 3, 5, 8, 10, 12, 14, 16, 20, 30, 36, 45, 60];
/* Partenze basse (dove si può salire), ritest su tutto il campo: più storie esposte. */
const BASSI = [0, 1, 3, 5, 8, 10, 12];
for (const conR9c of [false, true]) {
  seme = SEME;
  let storie = 0, test = 0, salite = 0, discese = 0; const esempi: string[] = [];
  for (let k = 0; k < 1500; k += 1) {
    storie += 1;
    const repo = nuovo();
    const fatti = new Set<string>();
    let giorno = Date.UTC(2026, 2, 2);
    const data = () => new Date(giorno).toISOString().slice(0, 10);
    for (const t of prove) await repo.saveTestResult(testResultSingle(t as never, data(), 0, BASSI[rnd(BASSI.length)]!));
    for (let passo = 0; passo < 12; passo += 1) {
      giorno += 86_400_000 * (1 + rnd(4));
      if (rnd(4) === 0) {
        const prima = new Map(await Promise.all([...fatti].map(async (x) => [x, (await repo.getExerciseState(x as ExerciseSlug)).level] as const)));
        await repo.saveTestResult(testResultSingle(prove[rnd(prove.length)] as never, data(), 6, VALORI[rnd(VALORI.length)]!));
        test += 1;
        for (const [x, l] of prima) {
          const dopo = (await repo.getExerciseState(x as ExerciseSlug)).level;
          if ((dopo ?? 0) > (l ?? 0)) { salite += 1; if (esempi.length < 3) esempi.push(`${x} ${String(l)}→${String(dopo)}`); }
          if ((dopo ?? 0) < (l ?? 0)) discese += 1;
        }
      } else {
        const scelti = [blocchi[rnd(blocchi.length)]!, blocchi[rnd(blocchi.length)]!];
        const ex = await Promise.all(scelti.map(async ({ b }) => voce(b.code, b.exercise, (await repo.getExerciseState(b.exercise)).level, [b.prescription.kind === 'reps' || b.prescription.kind === 'seconds' ? b.prescription.min : 5, 5])));
        const uniq = ex.filter((e, i) => ex.findIndex((f) => f.exercise === e.exercise) === i);
        await chiudi(repo, seduta(`p${String(passo)}`, data(), 1 + passo, scelti[0]!.s, uniq), conR9c);
        for (const e of uniq) fatti.add(e.exercise);
      }
    }
  }
  console.log(`B · 9.29 ${conR9c ? 'chiusura come l\'app (R9c)' : 'chiusura di prima'}: ${String(storie)} storie, ${String(test)} test, salite dopo un test ${String(salite)}${esempi.length > 0 ? ` (es. ${esempi.join(', ')})` : ''}, discese automatiche ${String(discese)}`);
}

/* ---------------- C · specchio: test peggiore ---------------- */
for (const conR9c of [false, true]) {
  const fermi: string[] = []; const scesi: string[] = [];
  for (const { s, b } of blocchi) {
    const ex = getExercise(b.exercise);
    const repo = nuovo();
    const t = prove.find((p) => startingLevel(ex, new Map([[p, testResultSingle(p as never, '2026-03-02', 0, 999)]]) as never) !== startingLevel(ex, new Map() as never));
    if (t === undefined) continue;
    await repo.saveTestResult(testResultSingle(t as never, '2026-03-02', 0, 999));
    const l0 = (await repo.getExerciseState(b.exercise)).level;
    await chiudi(repo, seduta('c1', '2026-03-04', 1, s, [voce(b.code, b.exercise, l0, [b.prescription.kind === 'reps' || b.prescription.kind === 'seconds' ? b.prescription.min : 5])]), conR9c);
    await repo.saveTestResult(testResultSingle(t as never, '2026-04-13', 6, 1));
    const l1 = (await repo.getExerciseState(b.exercise)).level;
    (l1 === l0 ? fermi : scesi).push(`${b.exercise} ${String(l0)}→${String(l1)}`);
  }
  console.log(`C · ritest peggiore (M=1) dopo una seduta al gradino del test alto, ${conR9c ? 'chiusura come l\'app' : 'chiusura di prima'}: scendono ${String(scesi.length)} [${scesi.join(', ')}], restano ${String(fermi.length)} [${fermi.join(', ')}]; proposta R9b: ${'riparti-dal-test' in Draft ? '?' : 'nessuna funzione'}`);
}
