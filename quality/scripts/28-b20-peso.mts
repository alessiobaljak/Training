/*
 * 28 — B20: il peso precompilato dopo un cambio di gradino, con la guardia `kgDellaVoltaScorsa` (bcb9e5e) e senza
 *      (9c62f84, 3c4a8d7). training-quality, 2026-11-21h. Nessun browser, nessun emulatore.
 *
 * Uso, dalla radice di un `git archive`: node --experimental-strip-types quality/scripts/28-b20-peso.mts
 * Riprende 27.12-27.14 e 27.16-27.22 con le due composizioni (vecchia e nuova), poi i bordi della guardia.
 * Attesi dal testo: R23 e limiti 1.6 («sotto il 6 nessun kg prescritto dall'app»), A18 (al 6 il campo parte dallo
 * stato), R14d/R-7 (manubri: il campo lasciato com'è non alza mai un numero), D-23 (manubri: il peso resta), S5.
 * Le composizioni dei due player si leggono in modo statico su sorgente normalizzato (senza commenti né spazi):
 * se non sono né la vecchia né la nuova, la riga è INFO «da riscrivere», mai OK. Righe «OK» / «NO» / «INFO».
 */
import { readFileSync } from 'node:fs';
import { EXERCISES, getExercise } from '../../src/data/exercises.ts';
import { findCircuitSession } from '../../src/data/circuit.ts';
import * as Draft from '../../src/engine/draft.ts';
import type { Exercise, ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession } from '../../src/types/index.ts';

let no = 0;
const riga = (ok: boolean | null, id: string, testo: string): void => {
  if (ok === false) no += 1;
  console.log(`${ok === null ? 'INFO' : ok ? 'OK  ' : 'NO  '} ${id.padEnd(7)} ${testo}`);
};
const D = Draft as unknown as {
  syncStatesFromLog(s: LoggedSession, m: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statesToSave(x: readonly ExerciseState[], a: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  lastLoggedByBlock(s: readonly LoggedSession[], id: string, ex: string, oggi?: ReadonlyMap<string, ExerciseSlug>): ReadonlyMap<string, LoggedExercise>;
  suggestedSetValue(p: LoggedExercise | undefined, i: number, side: null): { loadKg: number } | undefined;
  buildDraftSession(p: unknown): LoggedSession;
  pesoIniziale?: (inerente: boolean, dalloStato: number, volta: number) => number;
  kgDellaVoltaScorsa?: (e: Exercise, p: LoggedExercise | undefined, kg: number, l: LevelIndex | null) => number;
};

const serie = (v: number[], kg = 0) => v.map((x, i) => ({ setIndex: i + 1, side: null, value: x, rir: null, loadKg: kg, heartRate: null, note: null }));
const voce = (code: string, slug: ExerciseSlug, level: LevelIndex | null | undefined, v: number[], kg = 0): Record<string, unknown> => {
  const x: Record<string, unknown> = { blockCode: code, exercise: slug, variantLabel: 'fixture', level, tempoRespected: true, sets: serie(v, kg), note: null };
  if (level === undefined) delete x['level'];
  return x;
};
const seduta = (id: string, date: string, week: number, sessionId: string, ex: unknown[], status = 'completed') => ({ id, date, week, sessionId, status, exercises: ex, note: null }) as unknown as LoggedSession;
const st = (slug: string, level: number | null, kg = 0, e = 0, p = 0): ExerciseState => ({ exercise: slug as ExerciseSlug, level: level as LevelIndex, eccentricBonusSeconds: e, bottomPauseBonusSeconds: p, loadKg: kg });
const s4 = (x: ExerciseState | undefined | null): string => (x == null ? 'null' : `{${String(x.level)}, ${String(x.loadKg)} kg, +${String(x.eccentricBonusSeconds)}″/+${String(x.bottomPauseBonusSeconds)}″}`);
const ZERO = (l: number): string => `{${String(l)}, 0 kg, +0″/+0″}`;

/* ---------------------------------------------------------------- composizioni, lette in modo statico */
const norma = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1').replace(/\s+/g, '');
const ss = norma(readFileSync('src/ui/session/SessionScreen.tsx', 'utf8'));
const gs = norma(readFileSync('src/ui/session/GuidedSession.tsx', 'utf8'));
const SS_COMUNE = ss.includes('constexercise=getExercise(block.exercise);') && ss.includes('constexerciseState=states.get(block.exercise);')
  && ss.includes('constpast=previous.get(block.code);') && ss.includes('constkgDalloStato=exerciseState?.loadKg??0;')
  && ss.includes('loadKg:kgDalloStato>0?kgDalloStato:kgDalLog,');
const SS_V = ss.includes("constkgDalLog=suggestedSetValue(past,step.setIndex,step.perSide?'left':null)?.loadKg??0;");
const SS_N = ss.includes("constkgDalLog=kgDellaVoltaScorsa(exercise,past,suggestedSetValue(past,step.setIndex,step.perSide?'left':null)?.loadKg??0,exerciseState?.level??null,);");
const compSS: 'vecchia' | 'nuova' | null = !SS_COMUNE ? null : SS_N && D.kgDellaVoltaScorsa !== undefined ? 'nuova' : SS_V ? 'vecchia' : null;
const GS_COMUNE = gs.includes('constkgDalloStato=contesto.manubriInAttesa.get(stazione?.esercizio.slug??step.exercise)?.B??contesto.states.get(stazione?.esercizio.slug??step.exercise)?.loadKg??0;')
  && gs.includes("constsuggerito=suggestedSetValue(passato,step.step.setIndex,perSide?'left':null);")
  && gs.includes('constpassato=contesto.previous.get(step.blockCode);') && gs.includes('constcomune={rir:null,loadKg:kg,')
  && gs.includes('constgradino=findLoggedExercise(draft,step.blockCode)?.level??states.get(esercizio.slug)?.level??null;')
  && D.pesoIniziale !== undefined;
const GS_V = gs.includes("useState(pesoIniziale(stazione?.esercizio.loadPolicy==='inherent',kgDalloStato,suggerito?.loadKg??0),)")
  || gs.includes("useState(pesoIniziale(stazione?.esercizio.loadPolicy==='inherent',kgDalloStato,suggerito?.loadKg??0))");
const GS_N = gs.includes("useState(pesoIniziale(stazione?.esercizio.loadPolicy==='inherent',kgDalloStato,stazione===null?0:kgDellaVoltaScorsa(stazione.esercizio,passato,suggerito?.loadKg??0,contesto.states.get(stazione.esercizio.slug)?.level??stazione.gradino,),),)");
const compGS: 'vecchia' | 'nuova' | null = !GS_COMUNE ? null : GS_N && D.kgDellaVoltaScorsa !== undefined ? 'nuova' : GS_V ? 'vecchia' : null;
riga(null, '28.0', `composizione riconosciuta: SessionScreen ${String(compSS)}, player guidato ${String(compGS)}`);

const c1 = findCircuitSession('circuito-1')!;
const oggi = new Map(c1.blocks.map((b) => [b.code, b.exercise as ExerciseSlug]));
const TZ = 'trazioni-prona-presa-media' as ExerciseSlug;
const tz = getExercise(TZ);
const CODE = c1.blocks.find((b) => b.exercise === TZ)?.code ?? 'A1';

/* il campo Peso della prima serie, come lo compone ciascun player (stato assente ammesso) */
const volta = (ultima: LoggedSession, code: string): LoggedExercise | undefined => D.lastLoggedByBlock([ultima], 'circuito-1', 'oggi', oggi).get(code);
function campoSS(ex: Exercise, stato: ExerciseState | undefined, p: LoggedExercise | undefined): number | null {
  if (compSS === null) return null;
  const sug = D.suggestedSetValue(p, 1, null)?.loadKg ?? 0;
  const dalLog = compSS === 'nuova' ? D.kgDellaVoltaScorsa!(ex, p, sug, stato?.level ?? null) : sug;
  const dalloStato = stato?.loadKg ?? 0;
  return dalloStato > 0 ? dalloStato : dalLog;
}
function campoGS(ex: Exercise, stato: ExerciseState | undefined, p: LoggedExercise | undefined, code: string, attesaB?: number): number | null {
  if (compGS === null) return null;
  const sug = D.suggestedSetValue(p, 1, null)?.loadKg ?? 0;
  /* stazione.gradino: il gradino della bozza (buildDraftSession) prima dello stato */
  const states = new Map(stato === undefined ? [] : [[ex.slug, stato]]);
  const bozza = D.buildDraftSession({ id: 'oggi', date: '2026-03-24', week: 4, session: c1, states, previous: new Map(p === undefined ? [] : [[code, p]]) });
  const gradino = bozza.exercises.find((x) => x.blockCode === code)?.level ?? stato?.level ?? null;
  const dalLog = compGS === 'nuova' ? D.kgDellaVoltaScorsa!(ex, p, sug, stato?.level ?? gradino) : sug;
  return D.pesoIniziale!(ex.loadPolicy === 'inherent', attesaB ?? stato?.loadKg ?? 0, dalLog);
}
const chiudi = (slug: ExerciseSlug, code: string, livello: LevelIndex | null, kg: number, stato: ExerciseState | undefined): ExerciseState | undefined => {
  const giorno = seduta('c', '2026-03-24', 4, 'circuito-1', [voce(code, slug, livello, [6, 6, 6], kg)], 'in-progress');
  const prima = new Map(stato === undefined ? [] : [[slug, stato]]);
  return D.statesToSave(D.syncStatesFromLog(giorno, prima), new Map()).find((x) => x.exercise === slug) ?? stato;
};

/* ---------------------------------------------------------------- B · stessa seduta del selettore (27.12-27.14) */
console.log('=== 28.B · SessionScreen, stessa seduta del selettore 6 → 5 (stato {5, 0}), volta scorsa al 6 con 5 kg ===');
const scorsa6 = seduta('s3', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 6 as LevelIndex, [5, 5, 5], 5)]);
{
  const dopo = st(TZ, 5);
  const pre = campoSS(tz, dopo, volta(scorsa6, CODE));
  riga(pre === null ? null : pre === 0, '28.12', `campo Peso ${String(pre)} kg (atteso 0: R23, limiti 1.6)  [27.12]`);
  if (pre !== null) {
    const fin = chiudi(TZ, CODE, 5 as LevelIndex, pre, dopo);
    riga(s4(fin) === ZERO(5), '28.13', `serie al 5 col peso lasciato com'è, chiusura ⇒ ${s4(fin)} (atteso ${ZERO(5)})  [27.13]`);
    const fin0 = chiudi(TZ, CODE, 5 as LevelIndex, 0, dopo);
    riga(s4(fin0) === ZERO(5), '28.14', `positivo: peso portato a 0 a mano, chiusura ⇒ ${s4(fin0)} (atteso ${ZERO(5)})  [27.14]`);
  }
}

/* ---------------------------------------------------------------- C · seduta dopo ogni via di R23, tutti e due i player */
console.log('=== 28.C · seduta successiva dopo ogni via di R23 (stato a 0 kg, volta scorsa a 5 kg al gradino di prima) ===');
const vie: [string, string, ExerciseState, LoggedSession][] = [
  ['16', 'scendi-di-livello 6 → 5 (B18)', st(TZ, 5), scorsa6],
  ['17', 'riparti-dal-test 6 → 1 (R9b)', st(TZ, 1), scorsa6],
  ['18', 'sali-di-livello 5 → 6 (R23)', st(TZ, 6), seduta('s3s', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 5 as LevelIndex, [9, 9, 9], 5)])],
  ['19', 'leva variante 3 → 4 (R23)', st(TZ, 4), seduta('s3v', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 3 as LevelIndex, [9, 9, 9], 5)])],
  ['20', 'selettore 6 → 5 (L42), seduta dopo', st(TZ, 5), scorsa6],
];
for (const [n, via, stato, ultima] of vie) {
  const p = volta(ultima, CODE);
  for (const [chi, f] of [['guidato', campoGS(tz, stato, p, CODE)], ['SessionScreen', campoSS(tz, stato, p)]] as const) {
    const id = `28.${n}${chi === 'guidato' ? 'g' : 's'}`;
    if (f === null) { riga(null, id, `${via}, ${chi}: composizione non riconosciuta, da riscrivere`); continue; }
    const fin = chiudi(TZ, CODE, stato.level, f, stato);
    riga(f === 0 && s4(fin) === s4(stato), id, `${via}, ${chi}: stato ${s4(stato)}, volta scorsa al ${String(p?.level)} con 5 kg → campo ${String(f)} kg; chiusura ⇒ ${s4(fin)} (atteso 0 kg e ${s4(stato)})  [27.${n}]`);
  }
}
{
  const p0 = volta(seduta('z', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 6 as LevelIndex, [5, 5, 5], 0)]), CODE);
  const a = campoGS(tz, st(TZ, 5), p0, CODE);
  const b = campoSS(tz, st(TZ, 5), p0);
  riga(a === null || b === null ? null : a === 0 && b === 0, '28.21', `positivo: volta scorsa a 0 kg, stato ${ZERO(5)} → campo ${String(a)} / ${String(b)} kg (atteso 0 / 0)  [27.21]`);
  const p6 = volta(scorsa6, CODE);
  const a6 = campoGS(tz, st(TZ, 6, 7.5), p6, CODE);
  const b6 = campoSS(tz, st(TZ, 6, 7.5), p6);
  riga(a6 === null || b6 === null ? null : a6 === 7.5 && b6 === 7.5, '28.22', `positivo: al 6 con 7,5 kg accettati, volta scorsa al 6 con 5 → campo ${String(a6)} / ${String(b6)} kg (atteso 7,5 / 7,5, A18)  [27.22]`);
}

/* ---------------------------------------------------------------- D · i bordi della guardia */
console.log('=== 28.D · bordi della guardia (guidato / SessionScreen) ===');
{
  /* D1 la porta di servizio allo stesso gradino, al 6: stato a 0 kg, volta scorsa al 6 con 5 kg */
  const p = volta(scorsa6, CODE);
  const a = campoGS(tz, st(TZ, 6), p, CODE);
  const b = campoSS(tz, st(TZ, 6), p);
  riga(a === null || b === null ? null : a === 5 && b === 5, '28.30', `al 6, stato {6, 0 kg}, volta scorsa al 6 con 5 kg → ${String(a)} / ${String(b)} kg (atteso 5 / 5: stesso gradino, la volta scorsa vale; al 6 la zavorra è ammessa)`);
  /* D2 stesso gradino sotto il 6 con kg scritti a mano: domanda (b) al designer, aperta */
  const p5 = volta(seduta('s5', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 5 as LevelIndex, [6, 6, 6], 5)]), CODE);
  const a5 = campoGS(tz, st(TZ, 5), p5, CODE);
  const b5 = campoSS(tz, st(TZ, 5), p5);
  const fin5 = a5 === null ? null : chiudi(TZ, CODE, 5 as LevelIndex, a5, st(TZ, 5));
  riga(null, '28.31', `sotto il 6 allo stesso gradino, stato {5, 0 kg}, volta scorsa al 5 con 5 kg scritti a mano → ${String(a5)} / ${String(b5)} kg; lasciato com'è, chiusura ⇒ ${s4(fin5)} (domanda (b) al designer, aperta: scostamento possibile da limiti 1.6)`);
  /* D3 manubri: il peso vale sempre, anche con un «gradino» diverso nella voce (non esiste, si forza) */
  const CM = 'curl-martello-manubri' as ExerciseSlug;
  const cm = getExercise(CM);
  const codeCM = c1.blocks.find((b) => b.exercise === CM)?.code ?? 'B1';
  const pm = volta(seduta('m', '2026-03-17', 3, 'circuito-1', [voce(codeCM, CM, null, [10, 10, 10], 12)]), codeCM);
  const pmx = volta(seduta('mx', '2026-03-17', 3, 'circuito-1', [voce(codeCM, CM, 2 as LevelIndex, [10, 10, 10], 12)]), codeCM);
  const m1 = [campoGS(cm, st(CM, null, 12), pm, codeCM), campoSS(cm, st(CM, null, 12), pm)];
  const m2 = [campoGS(cm, st(CM, null, 14.5), pmx, codeCM), campoSS(cm, st(CM, null, 0), pmx)];
  const m3 = campoGS(cm, st(CM, null, 14.5), pm, codeCM, 12);
  riga(m1.includes(null) ? null : m1[0] === 12 && m1[1] === 12, '28.32', `manubri ${CM} (${cm.loadPolicy}), stato 12, volta scorsa 12 → ${m1.join(' / ')} kg (atteso 12 / 12, D-23)`);
  riga(m2.includes(null) ? null : m2[0] === 12 && m2[1] === 12, '28.33', `manubri, voce della volta scorsa con un gradino forzato a 2, stato senza gradino: guidato con stato 14,5 accettato → ${String(m2[0])} (atteso 12, R14d: si parte dal peso vero); SessionScreen con stato 0 → ${String(m2[1])} (atteso 12: la volta scorsa vale sempre)`);
  riga(m3 === null ? null : m3 <= 12, '28.34', `R-7 (4j): manubrio scelto 12 → 14,5 e non preso (B = 12), volta scorsa 12 → guidato ${String(m3)} kg (atteso ≤ 12)`);
  /* D4 l'unico `allowed` senza scala: gradino null da tutte e due le parti */
  const senza = EXERCISES.filter((x) => x.loadPolicy === 'allowed' && x.pattern === null);
  for (const e of senza) {
    const code = c1.blocks.find((b) => b.exercise === e.slug)?.code ?? 'X1';
    const sessioneDove = code === 'X1' ? 'nessun blocco in circuito-1: voce su X1' : `circuito-1/${code}`;
    const pe = D.lastLoggedByBlock([seduta('e', '2026-03-17', 3, 'circuito-1', [voce(code, e.slug, null, [8, 8, 8], 5)])], 'circuito-1', 'oggi').get(code);
    const ae = campoGS(e, st(e.slug, null, 0), pe, code);
    const be = campoSS(e, st(e.slug, null, 0), pe);
    riga(ae === null || be === null ? null : ae === 5 && be === 5, '28.35', `${e.slug} (allowed, senza scala; ${sessioneDove}), stato {null, 0 kg}, volta scorsa null con 5 kg → ${String(ae)} / ${String(be)} kg (atteso 5 / 5: nessun cambio di gradino)`);
  }
  /* D5 storico senza gradino sulla voce (null o chiave assente) */
  for (const [n, liv, nome] of [['36', null, 'level: null'], ['37', undefined, 'chiave level assente']] as const) {
    const pv = volta(seduta(`v${n}`, '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, liv, [5, 5, 5], 5)]), CODE);
    const a0 = campoGS(tz, st(TZ, 6), pv, CODE);
    const b0 = campoSS(tz, st(TZ, 6), pv);
    const a1 = campoGS(tz, st(TZ, 6, 5), pv, CODE);
    const b1 = campoSS(tz, st(TZ, 6, 5), pv);
    riga(null, `28.${n}`, `storico vecchio (${nome}), trazioni al 6, volta scorsa 5 kg: stato {6, 0 kg} → ${String(a0)} / ${String(b0)} kg; stato {6, 5 kg} → ${String(a1)} / ${String(b1)} kg (prima della guardia: 5 / 5 tutte e due)`);
  }
  /* D6 stato assente, volta scorsa al gradino di default con kg: i due player devono dire la stessa cosa */
  const dl = tz.defaultLevel;
  const pd = volta(seduta('d', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, dl, [5, 5, 5], 5)]), CODE);
  const ad = campoGS(tz, undefined, pd, CODE);
  const bd = campoSS(tz, undefined, pd);
  riga(ad === null || bd === null ? null : ad === bd, '28.38', `stato assente, volta scorsa al gradino di default ${String(dl)} con 5 kg → guidato ${String(ad)} kg, SessionScreen ${String(bd)} kg (atteso: lo stesso numero nei due player)`);
}

/* ---------------------------------------------------------------- E · griglia: mai sopra, e a gradino diverso solo lo stato */
console.log('=== 28.E · griglia sugli allowed con scala: gradino di oggi 1-6 × gradino della volta scorsa 1-6/null × kg ===');
{
  const conScala = EXERCISES.filter((x) => x.loadPolicy === 'allowed' && x.pattern !== null);
  let casi = 0;
  const sopra: string[] = [];
  const diverso: string[] = [];
  for (const e of conScala) {
    const code = 'G1';
    for (const L of [1, 2, 3, 4, 5, 6] as LevelIndex[]) for (const P of [1, 2, 3, 4, 5, 6, null] as (LevelIndex | null)[]) for (const K of [0, 2.5, 5]) for (const S of [0, 5]) {
      const p = D.lastLoggedByBlock([seduta('g', '2026-03-17', 3, 'circuito-1', [voce(code, e.slug, P, [6, 6, 6], K)])], 'circuito-1', 'oggi').get(code);
      const stato = st(e.slug, L, S);
      for (const [chi, f] of [['g', campoGS(e, stato, p, code)], ['s', campoSS(e, stato, p)]] as const) {
        if (f === null) continue;
        casi += 1;
        if (f > Math.max(S, K)) sopra.push(`${e.slug} ${chi} L${String(L)} P${String(P)} K${String(K)} S${String(S)} → ${String(f)}`);
        if (P !== L && f !== S) diverso.push(`${e.slug} ${chi} L${String(L)} P${String(P)} K${String(K)} S${String(S)} → ${String(f)}`);
      }
    }
  }
  riga(casi === 0 ? null : sopra.length === 0, '28.40', `${String(conScala.length)} esercizi, ${String(casi)} campi: sopra max(stato, volta scorsa) ${String(sopra.length)}${sopra.length > 0 ? ` (primi: ${sopra.slice(0, 3).join(' | ')})` : ''}`);
  riga(casi === 0 ? null : diverso.length === 0, '28.41', `gradino della volta scorsa diverso da oggi ⇒ il campo è lo stato: eccezioni ${String(diverso.length)}${diverso.length > 0 ? ` (prime: ${diverso.slice(0, 3).join(' | ')})` : ''}`);
}
console.log(`\nNO: ${String(no)}`);
