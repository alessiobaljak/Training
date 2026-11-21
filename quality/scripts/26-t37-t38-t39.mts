/*
 * 26 — T-37 (rematore agli anelli), T-38 (R23, la zavorra a ogni cambio di gradino), T-39 (`testAllaData` rev.),
 *      sul codice, senza browser né emulatore. training-quality, 2026-11-21, commit 9d7b20f contro 22f3d31.
 *
 * Uso, dalla radice di un `git archive`: node --experimental-strip-types quality/scripts/26-t37-t38-t39.mts
 * Gli attesi vengono dal testo della specifica (training/reports/2026-11-21-training-anelli-figure.md §2-§4,
 * criteri 37.x, 23.x, 9.30-9.38) riscritti qui, non dal codice che li produce. Le righe «N …» sono normalizzate
 * (nomi dei gradini e degli esercizi sostituiti da segnaposto) e si confrontano fra le due radici con `diff`.
 * Righe «OK» / «NO» / «INFO». Positivo: lo stesso file su 22f3d31 deve dare «NO» dove la regola è nuova.
 */
import { existsSync, readFileSync } from 'node:fs';
import { CIRCUIT_SESSIONS, findCircuitSession } from '../../src/data/circuit.ts';
import { EXERCISES, getExercise } from '../../src/data/exercises.ts';
import { getProgressionScale, getProgressionStep } from '../../src/data/progressions.ts';
import { getTest, testBaseline } from '../../src/data/tests.ts';
import * as Dev from '../../src/data/deviations.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import * as Prog from '../../src/engine/progression.ts';
import * as Draft from '../../src/engine/draft.ts';
import * as Hist from '../../src/engine/history.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import * as Repo from '../../src/db/repository.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedSession, TestId, TestResult } from '../../src/types/index.ts';

let no = 0;
const riga = (ok: boolean | null, id: string, testo: string): void => {
  if (ok === false) no += 1;
  console.log(`${ok === null ? 'INFO' : ok ? 'OK  ' : 'NO  '} ${id.padEnd(7)} ${testo}`);
};
const P = Prog as unknown as {
  startingLevel: (e: unknown, t: ReadonlyMap<TestId, TestResult>) => number | null;
  initialExerciseState: (e: unknown, t?: ReadonlyMap<TestId, TestResult>) => ExerciseState;
  evaluateProgression: (i: unknown) => { suggestion: { lever: string; change: string; nextState: ExerciseState } | null };
  salitaConsentita: (slug: ExerciseSlug, l: LevelIndex | null, s: readonly LoggedSession[], oggi: string, bozza?: LoggedSession) => unknown;
  applyLever: (l: string, i: unknown) => ExerciseState;
  MAX_ECCENTRIC_SECONDS: number; MAX_ISO_PAUSE_SECONDS: number;
  zavorraDopoIlCambio?: (e: unknown, s: ExerciseState, l: number | null) => { loadKg: number; clausola: string | null };
};
const D = Draft as unknown as {
  syncStatesFromLog(s: LoggedSession, m: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statesToSave(x: readonly ExerciseState[], a: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statiDaFissare?: (s: readonly LoggedSession[], g: ReadonlySet<ExerciseSlug>, c: (x: ExerciseSlug) => ExerciseState | undefined) => ExerciseState[];
  variantLabelFor(e: unknown, s: ExerciseState): string;
};
type Proposta = { verdict: { exercise: ExerciseSlug; kind: string; change: string; stateBefore: ExerciseState; stateAfter: ExerciseState } };
type R = {
  saveTestResult(r: TestResult): Promise<unknown>; getExerciseState(s: ExerciseSlug): Promise<ExerciseState>;
  saveExerciseState(s: ExerciseState): Promise<unknown>; saveSession(s: LoggedSession): Promise<unknown>;
  getConfirmedStates(s: readonly ExerciseSlug[]): Promise<ReadonlySet<ExerciseSlug>>;
  listExerciseStates(): Promise<ExerciseState[]>; listTestResults(): Promise<TestResult[]>;
  fissaStatiMancanti?: () => Promise<number>; archiviaSeduta?: (s: LoggedSession) => Promise<number>;
  proposteRitest?: () => Promise<Proposta[]>;
};
const nuovo = (): R => new (Repo as unknown as { ShadowRepository: new () => R }).ShadowRepository();

const serie = (v: number[], kg = 0) => v.map((x, i) => ({ setIndex: i + 1, side: null, value: x, rir: null, loadKg: kg, heartRate: null, note: null }));
const voce = (code: string, slug: ExerciseSlug, level: LevelIndex | null, v: number[], kg = 0, label = 'fixture') => ({ blockCode: code, exercise: slug, variantLabel: label, level, tempoRespected: true, sets: serie(v, kg), note: null });
const seduta = (id: string, date: string, week: number, sessionId: string, ex: unknown[], status = 'completed') => ({ id, date, week, sessionId, status, exercises: ex, note: null }) as unknown as LoggedSession;
const prova = (testId: string, date: string, week: number, value: number) => ({ testId, date, week, value, left: null, right: null }) as unknown as TestResult;
const st = (slug: string, level: number | null, kg = 0, e = 0, p = 0): ExerciseState => ({ exercise: slug as ExerciseSlug, level: level as LevelIndex, eccentricBonusSeconds: e, bottomPauseBonusSeconds: p, loadKg: kg });
const s4 = (x: ExerciseState | undefined | null): string => (x == null ? 'null' : `{${String(x.level)}, ${String(x.loadKg)} kg, +${String(x.eccentricBonusSeconds)}″/+${String(x.bottomPauseBonusSeconds)}″}`);

/* Normalizzazione per il confronto fra radici: i nomi cambiano per T-37, i numeri no. */
const NOMI: [string, string][] = [];
for (const p of ['horizontal-pull'] as const) for (let l = 1; l <= 6; l += 1) NOMI.push([getProgressionStep(p, l as LevelIndex).name, `<hp${String(l)}>`]);
for (const e of EXERCISES) if (e.pattern === 'horizontal-pull') NOMI.push([e.name, `<${e.slug}>`]);
const norm = (x: unknown): string => { let s = JSON.stringify(x); for (const [a, b] of NOMI.sort((u, v) => v[0].length - u[0].length)) s = s.split(a).join(b); return s; };

/* =========================================================== T-37 */
console.log('=== T-37 · rematore agli anelli ===');
const RI = 'rematore-inverso-trx' as ExerciseSlug;
{
  const nomi: Record<string, string> = { 'rematore-inverso-trx': 'Rematore inverso', 'rematore-inverso-trx-piedi-rialzati': 'Rematore inverso piedi rialzati', 'rematore-trx-monobraccio': 'Rematore inverso monobraccio' };
  const fuori = Object.entries(nomi).filter(([s, n]) => getExercise(s as ExerciseSlug).name !== n).map(([s]) => `${s} = «${getExercise(s as ExerciseSlug).name}»`);
  riga(fuori.length === 0, '37.1', `slug esistenti e nomi esatti: ${fuori.length === 0 ? 'sì (3)' : fuori.join(' | ')}`);

  const cue = ['Agli anelli, un po’ più larghi delle spalle, presa prona: palmi rivolti verso i piedi. Corpo teso in linea dalle caviglie alla testa, talloni a terra.',
    'L’inclinazione decide la difficoltà: più orizzontale sei, più è dura. A braccia distese le cinghie stanno verticali.',
    'Tira con i gomiti larghi, a metà fra i fianchi e la linea delle spalle, e stringi le scapole. Gli anelli non si allargano e non oscillano.',
    'Errore tipico: bacino che cede verso il basso, che scarica il lavoro sulle braccia.',
    'Ripetizione valida: anelli all’altezza del petto con le scapole strette, ritorno a braccia distese senza perdere la linea.'];
  const e = getExercise(RI);
  const cueOk = JSON.stringify(e.cues) === JSON.stringify(cue);
  const pr = getExercise('rematore-inverso-trx-piedi-rialzati' as ExerciseSlug).cues[2] === 'Pausa di 1" con le mani alle costole, scapole strette.';
  const mb = getExercise('rematore-trx-monobraccio' as ExerciseSlug);
  const mbOk = mb.cues[0] === 'Una presa sola, piedi leggermente più larghi per stabilizzare.' && mb.videoQuery === 'single arm inverted row proper form tutorial';
  const vq = e.videoQuery === 'wide grip ring row proper form tutorial';
  /* testi della trazione orizzontale che l'atleta legge: nomi, cue, gradini, etichette del diario, test, note dei blocchi */
  const testi: [string, string][] = [];
  for (const x of EXERCISES.filter((y) => y.pattern === 'horizontal-pull')) {
    testi.push([`${x.slug}.name`, x.name]); x.cues.forEach((c, i) => testi.push([`${x.slug}.cue${String(i + 1)}`, c]));
    for (let l = 1; l <= 6; l += 1) testi.push([`${x.slug}.etichetta${String(l)}`, D.variantLabelFor(x, st(x.slug, l))]);
  }
  for (const s of getProgressionScale('horizontal-pull').steps) testi.push([`gradino${String(s.level)}`, s.name]);
  const t = getTest('inverted-row-trx' as TestId) as unknown as { label: string; note?: string };
  testi.push(['test.label', t.label], ['test.note', t.note ?? '']);
  for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) if (getExercise(b.exercise).pattern === 'horizontal-pull') {
    for (const [k, v] of Object.entries(b)) if (typeof v === 'string' && !['code', 'group', 'pairing', 'exercise', 'tut', 'rir'].includes(k)) testi.push([`${s.id}/${b.code}.${k}`, v]);
  }
  const trx = testi.filter(([, v]) => /TRX|manigli/i.test(v));
  riga(cueOk && pr && mbOk && vq && trx.length === 0, '37.2', `cue del rematore esatti ${String(cueOk)}; piedi rialzati cue 3 ${String(pr)}; monobraccio cue 1 e videoQuery ${String(mbOk)}; videoQuery ${String(vq)}; testi con «TRX» o «maniglie» su ${String(testi.length)}: ${trx.length === 0 ? '0' : trx.map(([k, v]) => `${k} «${v}»`).join(' | ')}`);

  const attesi = ['Rematore agli anelli a 60°', 'Rematore agli anelli a 45°', 'Rematore agli anelli orizzontale', 'Piedi rialzati + pausa 1"', 'Rematore monobraccio agli anelli', 'Rematore monobraccio piedi rialzati'];
  const steps = getProgressionScale('horizontal-pull').steps;
  const nomiOk = steps.map((s) => s.name).join('|') === attesi.join('|');
  riga(nomiOk, '37.3', `gradini: ${steps.map((s) => `${String(s.level)} «${s.name}»`).join(' · ')}`);
  console.log(`N 37.3 ${norm(steps.map((s) => ({ l: s.level, slug: s.slug, perSide: s.perSide, ecc: s.eccentricOnly })))}`);

  const td = getTest('inverted-row-trx' as TestId) as unknown as { id: string; exercise: string; label: string; note?: string; measurement: string; plannedSets: number; perSide: boolean };
  const nota = 'Agli anelli a 45°, con la presa larga della seduta. Conta solo le ripetizioni con il corpo in linea e gli anelli al petto.';
  const tb = JSON.stringify(testBaseline('horizontal-pull'));
  const onb = readFileSync('src/ui/screens/OnboardingScreen.tsx', 'utf8');
  const mostra = /\{test\.note !== undefined \? <Notice[^>]*>\{test\.note\}<\/Notice> : null\}/.test(onb);
  riga(td.id === 'inverted-row-trx' && td.exercise === RI && td.label === 'Rematore inverso' && td.note === nota && tb === '{"testId":"inverted-row-trx","level":2,"measurement":"reps"}' && mostra, '37.4',
    `id ${td.id}, esercizio ${td.exercise}, etichetta «${td.label}», nota esatta ${String(td.note === nota)}, testBaseline ${tb}, onboarding mostra test.note (statico) ${String(mostra)}`);
  console.log(`N 37.4 ${norm({ m: td.measurement, s: td.plannedSets, ps: td.perSide })}`);

  const lv = (M: number | null) => P.startingLevel(e, M === null ? new Map() : new Map([['inverted-row-trx' as TestId, prova('inverted-row-trx', '2026-03-02', 0, M)]]));
  const r1 = [lv(10), lv(9), lv(null), lv(0), lv(30)];
  riga(r1[0] === 2 && r1[1] === 1 && r1[2] === 1 && r1[3] === 1 && r1[4] === 2, '37.5', `R1 su S2 A3 (soglia 8 + RIR 2 = 10): M=10 ⇒ ${String(r1[0])}, M=9 ⇒ ${String(r1[1])}, nessuno ⇒ ${String(r1[2])}, M=0 ⇒ ${String(r1[3])}, M=30 ⇒ ${String(r1[4])} (attesi 2, 1, 1, 1, 2)`);
}
/* 37.6: nessuna migrazione; stessa uscita delle regole su una storia di sole sedute al TRX */
{
  const repo = nuovo();
  const salvato = st(RI, 3, 0, 1, 1);
  await repo.saveExerciseState(salvato);
  const letto = await repo.getExerciseState(RI);
  riga(JSON.stringify(letto) === JSON.stringify(salvato), '37.6a', `stato salvato ${s4(salvato)} riletto ${s4(letto)}`);
  const blk = findCircuitSession('circuito-2')!.blocks.find((b) => b.code === 'A3')!;
  const tests = new Map([['inverted-row-trx' as TestId, prova('inverted-row-trx', '2026-03-02', 0, 12)]]);
  const storie: [string, number, number[]][] = [['sopra', 2, [11, 11, 11]], ['dentro', 2, [9, 9, 9]], ['sotto', 2, [6, 6, 6]], ['sopra-3', 3, [11, 11, 11]], ['sotto-1', 1, [5, 5, 5]]];
  for (const [nome, L, v] of storie) {
    const sedute = [seduta('a', '2026-03-10', 2, 'circuito-2', [voce('A3', RI, L as LevelIndex, v, 0, `Liv. ${String(L)} · Rematore TRX`)]), seduta('b', '2026-03-17', 3, 'circuito-2', [voce('A3', RI, L as LevelIndex, v, 0, `Liv. ${String(L)} · Rematore TRX`)])];
    const r = reviewWeek({ week: 3, sessions: sedute, states: new Map([[RI, st(RI, L)]]), tests, weekEnd: '2026-03-22', today: '2026-03-23', decisioni: [] } as never) as unknown as Record<string, unknown>;
    console.log(`N 37.6r ${nome} ${norm(r)}`);
    const bozza = seduta('c', '2026-03-24', 4, 'circuito-2', [voce('A3', RI, L as LevelIndex, v)], 'in-progress');
    const ev = P.evaluateProgression({ block: blk, exercise: getExercise(RI), state: st(RI, L), logged: (bozza.exercises as unknown[])[0], range: resolveBlockRange(blk, getExercise(RI), tests), week: 4, currentMaxReps: null,
      salita: P.salitaConsentita(RI, L as LevelIndex, sedute, '2026-03-24', bozza), rientro: null, aumentoRecente: null });
    console.log(`N 37.6e ${nome} ${norm(ev)}`);
  }
  riga(null, '37.6b', 'revisione ed evaluateProgression su 5 storie di sole sedute al TRX: righe «N 37.6r/e», da confrontare fra le due radici');
}
/* 37.7: il diario tiene l'etichetta scritta il giorno della seduta */
{
  const vecchia = seduta('v', '2026-03-10', 2, 'circuito-2', [voce('A3', RI, 2 as LevelIndex, [9, 9, 9], 0, 'Liv. 2 · Rematore TRX a 45°')]);
  const righe = (Hist as unknown as { logRows: (s: LoggedSession[]) => { variantLabel: string; exerciseName: string }[] }).logRows([vecchia]);
  const lr = righe[0];
  const log = readFileSync('src/ui/screens/LogScreen.tsx', 'utf8');
  const mostraVecchia = lr !== undefined && lr.variantLabel === 'Liv. 2 · Rematore TRX a 45°' && !lr.variantLabel.endsWith(lr.exerciseName) && /: row\.variantLabel;/.test(log);
  riga(mostraVecchia, '37.7', `logRows: «${lr?.exerciseName ?? '-'}» · «${lr?.variantLabel ?? '-'}»; LogScreen mostra la variantLabel salvata quando non finisce col nome (statico) ${String(/: row\.variantLabel;/.test(log))}`);
}
/* 37.8: figure (il dettaglio è in `19`); qui solo le chiavi della lista */
{
  const Art = await import('../../src/data/exercise-art.ts') as unknown as { FIGURE_SENZA_IMMAGINE: ReadonlyMap<string, string>; REPDB_ART: Record<string, unknown>; REPDB_STEP_ART: Record<string, unknown> };
  const chiavi = ['rematore-inverso-trx', ...[1, 2, 3, 4, 5, 6].map((l) => `horizontal-pull-l${String(l)}`)];
  const fuoriLista = chiavi.filter((k) => !Art.FIGURE_SENZA_IMMAGINE.has(k));
  const inRepdb = chiavi.filter((k) => k in Art.REPDB_ART || k in Art.REPDB_STEP_ART);
  const svg = ['src/assets/exercises/rematore-inverso-trx.svg', ...[1, 2, 3, 5].map((l) => `src/assets/steps/horizontal-pull-l${String(l)}.svg`)].map((f) => [f, existsSync(f) ? (/aria-label="([^"]*)"/.exec(readFileSync(f, 'utf8'))?.[1] ?? '') : 'assente'] as const);
  riga(fuoriLista.length === 0 && inRepdb.length === 0, '37.8', `chiavi fuori da FIGURE_SENZA_IMMAGINE: ${fuoriLista.join(', ') || 'nessuna'}; ancora in REPDB: ${inRepdb.join(', ') || 'nessuna'}; titoli SVG: ${svg.map(([f, t]) => `${f.split('/').at(-1)!} «${t}»`).join(' · ')}`);
}
/* 37.9: deviazioni */
{
  const dv = (Dev as unknown as { DEVIAZIONI: { scheda: string; app: string }[] }).DEVIAZIONI;
  const dg = (Dev as unknown as { DEVIAZIONI_GRADINO: { schema: string; livello: number; scheda: string; app: string }[] }).DEVIAZIONI_GRADINO;
  const tre = [['Rematore inverso TRX', 'Rematore inverso'], ['Rematore inverso TRX piedi rialzati', 'Rematore inverso piedi rialzati'], ['Rematore TRX monobraccio', 'Rematore inverso monobraccio']].filter(([a, b]) => !dv.some((d) => d.scheda === a && d.app === b));
  const grad = [1, 2, 3, 5].filter((l) => !dg.some((d) => d.schema === 'horizontal-pull' && d.livello === l && d.app === getProgressionStep('horizontal-pull', l as LevelIndex).name));
  riga(tre.length === 0 && grad.length === 0, '37.9', `deviazioni dei tre esercizi mancanti: ${tre.length === 0 ? '0' : tre.map((x) => x[0]).join(', ')}; dei gradini 1, 2, 3, 5 mancanti: ${grad.length === 0 ? '0' : grad.join(', ')}`);
}

/* =========================================================== T-38 */
console.log('=== T-38 · R23 ===');
const TZ = 'trazioni-prona-presa-media' as ExerciseSlug;
const PU = 'push-up' as ExerciseSlug;
const PULL12 = new Map([['pull-up' as TestId, prova('pull-up', '2026-02-23', 0, 12)]]);
const PUSH30 = new Map([['push-up' as TestId, prova('push-up', '2026-02-23', 0, 30)]]);
const SOTTO = 'la zavorra si toglie: sotto l’ultimo gradino il programma non la usa';
const ZERO = 'la zavorra riparte da zero: all’ultimo gradino è il programma a proporla';
type V = { kind: string; change: string; stateAfter: ExerciseState; exercise: ExerciseSlug };
const rev = (slug: ExerciseSlug, sid: string, code: string, L: number, kg: number, v: number[], tests: ReadonlyMap<TestId, TestResult>, e = 0, p = 0): V | undefined => {
  /* R7: la prima seduta al gradino il 03-02, così la salita non aspetta i 14 giorni (in range: nessun verdetto da sola) */
  const pres = findCircuitSession(sid as never)!.blocks.find((b) => b.code === code)!.prescription as { min: number };
  const coppia = [seduta('r-', '2026-03-02', 1, sid, [voce(code, slug, L as LevelIndex, [pres.min, pres.min, pres.min], kg)]),
    ...['2026-03-11', '2026-03-18'].map((d, i) => seduta(`r${String(i)}`, d, 2 + i, sid, [voce(code, slug, L as LevelIndex, v, kg)]))];
  const r = reviewWeek({ week: 3, sessions: coppia, states: new Map([[slug, st(slug, L, kg, e, p)]]), tests, weekEnd: '2026-03-22', today: '2026-03-23', decisioni: [] } as never) as unknown as { verdicts: V[] };
  return r.verdicts.find((x) => x.exercise === slug);
};
const testo = (L: number, g: number, base: string, cl: string | null) => `Livello ${String(L)} → ${String(g)}. ${base}${cl === null ? '' : `; ${cl}`}.`;
const GIU = 'Tempo e pause tornano a quelli della scheda';
const SU = 'Si riparte dal minimo del range, al tempo della scheda';
{
  const v1 = rev(TZ, 'circuito-1', 'A1', 6, 5, [3, 3, 3], PULL12, 2, 2);
  riga(v1?.kind === 'scendi-di-livello' && s4(v1.stateAfter) === '{5, 0 kg, +0″/+0″}' && v1.change === testo(6, 5, GIU, SOTTO), '23.1', `trazioni 6, 5 kg, +2/+2, 3-3-3 ×2 → ${v1?.kind ?? '-'} ${s4(v1?.stateAfter)} «${v1?.change ?? ''}»`);
  const v2 = rev(PU, 'circuito-3', 'A2', 2, 10, [9, 9, 9], PUSH30);
  riga(v2?.kind === 'scendi-di-livello' && s4(v2.stateAfter) === '{1, 0 kg, +0″/+0″}' && v2.change === testo(2, 1, GIU, SOTTO), '23.2', `push-up 2, 10 kg, 9-9-9 ×2 → ${v2?.kind ?? '-'} ${s4(v2?.stateAfter)} «${v2?.change ?? ''}»`);
  const v3 = rev(TZ, 'circuito-1', 'A1', 3, 5, [9, 9, 9], PULL12);
  riga(v3?.kind === 'sali-di-livello' && s4(v3.stateAfter) === '{4, 0 kg, +0″/+0″}' && v3.change === testo(3, 4, SU, SOTTO), '23.3', `trazioni 3, 5 kg, 9-9-9 ×2 → ${v3?.kind ?? '-'} ${s4(v3?.stateAfter)} «${v3?.change ?? ''}»`);
  const v4 = rev(TZ, 'circuito-1', 'A1', 5, 5, [9, 9, 9], PULL12);
  riga(v4?.kind === 'sali-di-livello' && s4(v4.stateAfter) === '{6, 0 kg, +0″/+0″}' && v4.change === testo(5, 6, SU, ZERO), '23.4', `trazioni 5, 5 kg, 9-9-9 ×2 → ${v4?.kind ?? '-'} ${s4(v4?.stateAfter)} «${v4?.change ?? ''}»`);
  /* 23.5 leva variant a fine seduta (tempo e pausa al massimo, così la leva è la variante) */
  const blk = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'A1')!;
  const fine = (kg: number) => {
    const stato = st(TZ, 3, kg, P.MAX_ECCENTRIC_SECONDS, P.MAX_ISO_PAUSE_SECONDS);
    const bozza = seduta('f', '2026-03-24', 4, 'circuito-1', [voce('A1', TZ, 3 as LevelIndex, [9, 9, 9], kg)], 'in-progress');
    return P.evaluateProgression({ block: blk, exercise: getExercise(TZ), state: stato, logged: (bozza.exercises as unknown[])[0], range: resolveBlockRange(blk, getExercise(TZ), PULL12), week: 4, currentMaxReps: 12,
      salita: P.salitaConsentita(TZ, 3 as LevelIndex, [seduta('f0', '2026-03-02', 1, 'circuito-1', [voce('A1', TZ, 3 as LevelIndex, [6, 6, 6], kg)])], '2026-03-24', bozza), rientro: null, aumentoRecente: null }).suggestion;
  };
  const f5 = fine(5);
  riga(f5?.lever === 'variant' && f5.nextState.loadKg === 0 && f5.nextState.level === 4 && f5.change.endsWith(`riparti dal minimo del range; ${SOTTO}.`), '23.5', `fine seduta trazioni 3, 5 kg, tempo e pausa al massimo, 9-9-9 → leva ${f5?.lever ?? '-'} ${s4(f5?.nextState)} «${f5?.change ?? ''}»`);
  /* 23.6 R9b dal 6 con 5 kg */
  const Rt = await import('../../src/engine/ritest.ts') as unknown as { propostaRitest: (s: ExerciseSlug, x: ExerciseState, r: TestResult) => Proposta | null };
  const p6 = Rt.propostaRitest(TZ, st(TZ, 6, 5, 2, 2), prova('pull-up', '2026-04-11', 6, 5));
  riga(p6 !== null && s4(p6.verdict.stateAfter) === '{1, 0 kg, +0″/+0″}' && p6.verdict.change === testo(6, 1, GIU, SOTTO), '23.6', `R9b trazioni 6, 5 kg, ritest 5 → ${s4(p6?.verdict.stateAfter)} «${p6?.verdict.change ?? ''}»`);
  /* 23.7 a mano: (a) la chiusura con un gradino scritto diverso dallo stato; (b) il VariantPicker di SessionScreen, modellato */
  const giu7 = seduta('m', '2026-03-24', 4, 'circuito-1', [voce('A1', TZ, 5 as LevelIndex, [6, 6, 6], 5)]);
  const a7 = D.syncStatesFromLog(giu7, new Map([[TZ, st(TZ, 6, 5, 2, 2)]])).find((x) => x.exercise === TZ);
  riga(s4(a7) === '{5, 0 kg, +0″/+0″}', '23.7a', `chiusura, stato {6, 5 kg, +2/+2}, gradino scritto 5 con 5 kg → ${s4(a7)}`);
  const ss = readFileSync('src/ui/session/SessionScreen.tsx', 'utf8');
  const handler = /onChange=\{\(level, label\) => \{[\s\S]*?confirmExercise\(([^;]*)\);/.exec(ss)?.[1] ?? '(non trovato)';
  const tieneTutto = handler.trim() === '{ ...exerciseState, level: level ?? exerciseState.level }';
  /* modello: lo handler salva subito lo stato (salva = true); alla chiusura syncStatesFromLog parte da quello */
  const dopoHandler = tieneTutto ? { ...st(TZ, 6, 5, 2, 2), level: 5 as LevelIndex } : null;
  const chiusura = dopoHandler === null ? null : D.statesToSave(D.syncStatesFromLog(giu7, new Map([[TZ, dopoHandler]])), new Map());
  const finale = dopoHandler === null ? null : chiusura!.find((x) => x.exercise === TZ) ?? dopoHandler;
  riga(dopoHandler === null ? null : s4(finale) === '{5, 0 kg, +0″/+0″}', '23.7b', `VariantPicker di SessionScreen: onChange → confirmExercise(${handler.trim()}); modellato: {6, 5 kg, +2/+2}, scelto il 5, serie a 5 kg → salvato subito ${s4(dopoHandler)}, dopo la chiusura ${s4(finale)} (atteso {5, 0 kg, +0″/+0″}, 23.7; L42)`);
  /* 23.8 a 0 kg i testi (righe N, confronto fra radici) */
  const t0 = [rev(TZ, 'circuito-1', 'A1', 6, 0, [3, 3, 3], PULL12, 2, 2)?.change, rev(PU, 'circuito-3', 'A2', 2, 0, [9, 9, 9], PUSH30)?.change, rev(TZ, 'circuito-1', 'A1', 3, 0, [9, 9, 9], PULL12)?.change, rev(TZ, 'circuito-1', 'A1', 5, 0, [9, 9, 9], PULL12)?.change, fine(0)?.change, Rt.propostaRitest(TZ, st(TZ, 6, 0, 2, 2), prova('pull-up', '2026-04-11', 6, 5))?.verdict.change];
  console.log(`N 23.8 ${JSON.stringify(t0)}`);
  riga(t0.every((x) => x !== undefined && !/zavorra/.test(x)), '23.8', `a 0 kg nessun testo nomina la zavorra (6 testi; identità con la produzione: righe «N 23.8»)`);
  /* 23.9 manubri */
  const inerenti = EXERCISES.filter((x) => x.loadPolicy === 'inherent');
  const g9 = P.zavorraDopoIlCambio === undefined ? null : P.zavorraDopoIlCambio(inerenti[0], st(inerenti[0]!.slug, 2, 12), 3);
  riga(g9 === null ? null : g9.loadKg === 12 && g9.clausola === null, '23.9', `guardia sui manubri (${inerenti[0]?.slug ?? '-'} 12 kg, gradino 2 → 3): ${g9 === null ? 'funzione assente' : `${String(g9.loadKg)} kg, clausola ${String(g9.clausola)}`}; esercizi inherent con una scala: ${String(inerenti.filter((x) => x.pattern !== null).length)}`);
}
/* 23.P proprietà: ogni cambio di gradino proposto o eseguito dall'app porta la zavorra a 0 sugli `allowed` */
{
  let seme = 2026112123;
  const rnd = (n: number): number => { seme = (seme * 1103515245 + 12345) % 2147483648; return Math.floor(seme / 65536) % n; };
  const KG = [0, 2.5, 5, 10];
  const giudicati: { slug: ExerciseSlug; sid: string; code: string; min: number; max: number }[] = [];
  for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) {
    const e = getExercise(b.exercise);
    if (b.excludeFromReview === true || e.pattern === null || e.loadPolicy !== 'allowed' || b.prescription.kind !== 'reps') continue;
    if (giudicati.some((x) => x.slug === b.exercise)) continue;
    giudicati.push({ slug: b.exercise, sid: s.id, code: b.code, min: b.prescription.min, max: b.prescription.max });
  }
  const TESTS = new Map<TestId, TestResult>();
  for (const id of ['pull-up', 'dip', 'push-up', 'pike-push-up', 'bulgarian-split-squat', 'hollow-hold', 'inverted-row-trx', 'nordic-curl']) TESTS.set(id as TestId, prova(id, '2026-02-23', 0, 30));
  let cambi = 0, conKg = 0; const viol: string[] = [];
  const Rt = await import('../../src/engine/ritest.ts') as unknown as { propostaRitest: (s: ExerciseSlug, x: ExerciseState, r: TestResult) => Proposta | null };
  for (let k = 0; k < 3000; k += 1) {
    const g = giudicati[rnd(giudicati.length)]!;
    const L = 1 + rnd(6); const kg = KG[rnd(KG.length)]!; const e = rnd(3); const p = rnd(3);
    const val = [g.min - 3, g.min - 1, g.max + 1, g.max + 3][rnd(4)]!;
    const v = rev(g.slug, g.sid, g.code, L, kg, [val, val, val], TESTS, e, p);
    const esamina = (via: string, prima: ExerciseState, dopo: ExerciseState | undefined, change: string) => {
      if (dopo === undefined || dopo.level === prima.level) return;
      cambi += 1; if (prima.loadKg > 0) conKg += 1;
      if (dopo.loadKg !== 0) viol.push(`${via} ${g.slug} ${s4(prima)} → ${s4(dopo)}`);
      if (prima.loadKg > 0 && !/zavorra/.test(change)) viol.push(`${via} ${g.slug} testo muto «${change}»`);
      if (prima.loadKg === 0 && /zavorra/.test(change)) viol.push(`${via} ${g.slug} a 0 kg nomina la zavorra`);
    };
    if (v !== undefined) esamina('revisione', st(g.slug, L, kg, e, p), v.stateAfter, v.change);
    const pt = testBaseline(getExercise(g.slug).pattern!);
    if (pt !== null) { const pr = Rt.propostaRitest(g.slug, st(g.slug, L, kg, e, p), prova(pt.testId, '2026-04-11', 6, rnd(2) === 0 ? 0 : 1 + rnd(6))); if (pr !== null) esamina('R9b', pr.verdict.stateBefore, pr.verdict.stateAfter, pr.verdict.change); }
    const scritto = 1 + rnd(6);
    const sy = D.syncStatesFromLog(seduta('y', '2026-03-24', 4, g.sid, [voce(g.code, g.slug, scritto as LevelIndex, [g.min, g.min], kg)]), new Map([[g.slug, st(g.slug, L, kg, e, p)]])).find((x) => x.exercise === g.slug);
    if (sy !== undefined && sy.level !== L) { cambi += 1; if (kg > 0) conKg += 1; if (sy.loadKg !== 0) viol.push(`chiusura ${g.slug} ${s4(st(g.slug, L, kg, e, p))} → ${s4(sy)}`); }
  }
  riga(viol.length === 0 && conKg > 0, '23.P', `3.000 storie: ${String(cambi)} cambi di gradino (revisione, R9b, chiusura), ${String(conKg)} con kg prima; violazioni ${String(viol.length)}${viol.length === 0 ? '' : `: ${viol.slice(0, 4).join(' | ')}`}`);
}

/* =========================================================== T-39 */
console.log('=== T-39 · testAllaData ===');
/* R1 riga 8 riscritta dal testo (come nel nucleo e in `25`) */
const SOLO_ECC: Record<string, number[]> = { 'vertical-pull': [2], 'vertical-push': [3], dip: [2], 'posterior-chain': [2, 3, 4] };
const ecc = (p: string, l: number): boolean => (SOLO_ECC[p] ?? []).includes(l);
const primo = (p: string): number => { for (let c = 1; c <= 6; c += 1) if (!ecc(p, c)) return c; return 1; };
const giuDi = (p: string, L: number): number => { for (let c = L - 1; c >= 1; c -= 1) if (!ecc(p, c)) return c; return 1; };
const rirMax = (r: string): number => (r === '—' ? 0 : Number(r.split('-').at(-1)));
type Riga = { slug: ExerciseSlug; pattern: string; testId: TestId; Lt: number; soglia: number; code: string; sid: string };
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
    righe.push({ slug: b.exercise, pattern: e.pattern, testId: t.testId, Lt: t.level, soglia: Math.max(...soglie), code: B[0]!.y.code, sid: B[0]!.sid });
  }
}
const r1 = (r: Riga, M: number | undefined): number => (M === undefined || M <= 0 ? primo(r.pattern) : M >= r.soglia ? r.Lt : giuDi(r.pattern, r.Lt));
const r9b = (r: Riga, L: number, M: number): number | null => (M > 0 && M < r.soglia && L > giuDi(r.pattern, r.Lt) ? giuDi(r.pattern, r.Lt) : M === 0 && L > primo(r.pattern) ? primo(r.pattern) : null);

/* Una via: storia, poi lo stato fissato e la proposta R9b. `ordine`: il ritest dello stesso giorno prima o dopo la seduta. */
async function via(nome: 'archivia' | 'migrazione', r: Riga, M0: number | undefined, M1: number | undefined, dataM1: string, ultima: string, ordine: 'prima' | 'dopo'):
  Promise<{ fissato: number | null; proposta: number | null; logged: number | null } | null> {
  const repo = nuovo();
  if (nome === 'archivia' ? repo.archiviaSeduta === undefined : repo.fissaStatiMancanti === undefined) return null;
  if (M0 !== undefined) await repo.saveTestResult(prova(r.testId, '2026-03-01', 0, M0));
  const ritest = async () => { if (M1 !== undefined) await repo.saveTestResult(prova(r.testId, dataM1, dataM1 === '2026-03-01' ? 0 : 6, M1)); };
  if (ordine === 'prima' && dataM1 <= ultima) await ritest();
  const L = (await repo.getExerciseState(r.slug)).level;
  if (nome === 'migrazione') {
    /* storia chiusa come prima di R9c: nessuno stato salvato */
    if (ultima !== '2026-03-04') await repo.saveSession(seduta('m0', '2026-03-04', 1, r.sid, [voce(r.code, r.slug, L, [6, 6, 6])]));
    await repo.saveSession(seduta('m1', ultima, ultima === '2026-03-01' ? 1 : 6, r.sid, [voce(r.code, r.slug, L, [6, 6, 6])]));
    if (ordine === 'dopo' || dataM1 > ultima) await ritest();
    await repo.fissaStatiMancanti!();
  } else {
    const aperta = seduta('a1', ultima, ultima === '2026-03-01' ? 1 : 6, r.sid, [voce(r.code, r.slug, L, [6, 6, 6])], 'in-progress');
    await repo.saveSession(aperta);
    if (ordine === 'dopo' || dataM1 > ultima) await ritest();
    await repo.archiviaSeduta!(aperta);
  }
  const salvati = await repo.listExerciseStates();
  const fissato = salvati.find((x) => x.exercise === r.slug)?.level ?? null;
  const proposte = repo.proposteRitest === undefined ? [] : await repo.proposteRitest();
  const pr = proposte.find((x) => x.verdict.exercise === r.slug);
  return { fissato, proposta: pr === undefined ? null : pr.verdict.stateAfter.level, logged: L };
}
const TZr = righe.find((x) => x.slug === TZ)!;
riga(TZr !== undefined && TZr.soglia === 8 && TZr.Lt === 3, 'R1', `trazioni: soglia ${String(TZr?.soglia)}, Lt ${String(TZr?.Lt)}; ${String(righe.length)} esercizi con la riga 8 (${righe.map((x) => x.slug).join(', ')})`);
for (const nome of ['archivia', 'migrazione'] as const) for (const ordine of ['prima', 'dopo'] as const) {
  const a = await via(nome, TZr, 8, 4, '2026-04-11', '2026-04-11', ordine);
  riga(a === null ? null : a.fissato === 3 && a.proposta === 1, `9.30${nome[0]}${ordine[0]}`, `${nome}, ritest ${ordine} la seduta: test 03-01 M=8, ritest 04-11 M=4, ultima seduta 04-11 (fatta al ${String(a?.logged)}) → fissato ${String(a?.fissato)}, proposta ${String(a?.proposta)} (attesi 3 e 3 → 1)`);
  const b = await via(nome, TZr, 4, 9, '2026-04-11', '2026-04-11', ordine);
  riga(b === null ? null : b.fissato === 1 && b.proposta === null, `9.31${nome[0]}${ordine[0]}`, `${nome}, ritest ${ordine}: test M=4, ritest 04-11 M=9 → fissato ${String(b?.fissato)}, proposta ${String(b?.proposta)} (attesi 1, nessuna)`);
  const c = await via(nome, TZr, undefined, 8, '2026-03-01', '2026-03-01', ordine);
  riga(c === null ? null : c.fissato === 3, `9.37${nome[0]}${ordine[0]}`, `${nome}: test d'ingresso e prima seduta il 03-01 (M=8), nessun test prima → fissato ${String(c?.fissato)} (atteso 3)`);
  const d = await via(nome, TZr, 8, 4, '2026-04-12', '2026-04-11', ordine);
  riga(d === null ? null : d.fissato === 3 && d.proposta === 1, `9.38${nome[0]}${ordine[0]}`, `${nome}: ritest 04-12 M=4, ultima seduta 04-11 → fissato ${String(d?.fissato)}, proposta ${String(d?.proposta)} (attesi 3, R9b 3 → 1)`);
}
/* 9.29 estesa: griglia esercizio × M0 × M1 × via × ordine, test e seduta lo stesso giorno */
{
  let casi = 0, salite = 0, senzaProposta = 0, diversi = 0, proposteInPiu = 0, sottoEseguito = 0, sopraEseguito = 0, sopraSenza = 0, sopraSenzaRagg = 0; const es: string[] = []; const esSotto: string[] = []; const esSopra: string[] = [];
  for (const r of righe) for (const M0 of [undefined, 0, r.soglia - 1, r.soglia]) for (const M1 of [0, r.soglia - 1, r.soglia, r.soglia + 3]) for (const nome of ['archivia', 'migrazione'] as const) for (const ordine of ['prima', 'dopo'] as const) {
    const x = await via(nome, r, M0, M1, '2026-04-11', '2026-04-11', ordine);
    if (x === null || x.fissato === null) continue;
    casi += 1;
    const atteso = M0 !== undefined ? r1(r, M0) : r1(r, M1);
    if (x.fissato !== atteso) { diversi += 1; if (es.length < 4) es.push(`${r.slug} M0=${String(M0)} M1=${String(M1)} ${nome}/${ordine}: fissato ${String(x.fissato)}, atteso ${String(atteso)}`); }
    if (M0 !== undefined && x.fissato > r1(r, M0)) salite += 1;
    const pa = M0 === undefined ? null : r9b(r, x.fissato, M1);
    if (x.fissato > r1(r, M1) && x.proposta !== pa) senzaProposta += 1;
    if (pa === null && x.proposta !== null) proposteInPiu += 1;
    /* scarti dal gradino eseguito quel giorno (informativo: la specifica ne dichiara uno solo, il ritest peggiore prima della seduta) */
    if (x.logged !== null && x.fissato < x.logged && x.proposta === null) { sottoEseguito += 1; if (esSotto.length < 3) esSotto.push(`${r.slug} M0=${String(M0)} M1=${String(M1)} ${nome}/${ordine}: eseguito ${String(x.logged)}, fissato ${String(x.fissato)}`); }
    if (x.logged !== null && x.fissato > x.logged) { if (x.proposta !== null && x.proposta <= x.logged) sopraEseguito += 1; else { sopraSenza += 1; if (M0 !== undefined || ordine !== 'dopo') sopraSenzaRagg += 1; if (esSopra.length < 4) esSopra.push(`${r.slug} M0=${String(M0)} M1=${String(M1)} ${nome}/${ordine}: eseguito ${String(x.logged)}, fissato ${String(x.fissato)}, proposta ${String(x.proposta)}`); } }
  }
  riga(null, '9.29s', `scarti dal gradino eseguito il giorno della seduta: fissato sotto, senza proposta né testo, ${String(sottoEseguito)}${esSotto.length === 0 ? '' : ` (es. ${esSotto.join(' | ')})`}; fissato sopra con la proposta R9b fino al gradino eseguito ${String(sopraEseguito)}; fissato sopra SENZA proposta (salita senza R5 né R7: S1/S3) ${String(sopraSenza)}, di cui con un risultato precedente o con il test prima della seduta ${String(sopraSenzaRagg)}${esSopra.length === 0 ? '' : ` (es. ${esSopra.join(' | ')})`}`);
  riga(diversi === 0 && salite === 0 && senzaProposta === 0 && proposteInPiu === 0, '9.29e', `${String(casi)} casi (7 esercizi × 4 M0 × 4 M1 × 2 vie × 2 ordini, ritest e seduta il 04-11): fissato ≠ regola ${String(diversi)}; salite per un risultato dello stesso giorno con uno precedente ${String(salite)}; fissato sopra R1(giorno) senza la proposta R9b attesa ${String(senzaProposta)}; proposte in più ${String(proposteInPiu)}${es.length === 0 ? '' : ` · es. ${es.join(' | ')}`}`);
  /* per test: un test con un risultato precedente, un altro solo lo stesso giorno */
  const repo = nuovo();
  const DP = righe.find((x) => x.slug === 'dip-parallele-anelli')!;
  if (repo.fissaStatiMancanti !== undefined) {
    await repo.saveTestResult(prova('pull-up', '2026-03-01', 0, 4));
    await repo.saveTestResult(prova('pull-up', '2026-04-11', 6, 12));
    await repo.saveTestResult(prova('dip', '2026-04-11', 6, 12));
    await repo.saveSession(seduta('mx', '2026-04-11', 6, 'circuito-1', [voce('A1', TZ, 1 as LevelIndex, [6, 6, 6]), voce('A3', DP.slug, 3 as LevelIndex, [6, 6, 6])]));
    await repo.fissaStatiMancanti();
    const s = await repo.listExerciseStates();
    const lt = s.find((x) => x.exercise === TZ)?.level; const ld = s.find((x) => x.exercise === DP.slug)?.level;
    riga(lt === 1 && ld === DP.Lt, '9.29m', `per test: trazioni (03-01 M=4, 04-11 M=12) → ${String(lt)} (atteso 1); dip (solo 04-11 M=12) → ${String(ld)} (atteso ${String(DP.Lt)})`);
  }
}
console.log(`\nRighe NO: ${String(no)}`);
if (no > 0) process.exitCode = 1;
