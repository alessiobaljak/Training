/*
 * NUCLEO DI SICUREZZA — gli 8 casi che release-gate esegue a ogni rilascio.
 *
 * Esecuzione, dalla radice del progetto:
 *   node --experimental-strip-types quality/scripts/safety-core.mts
 *
 * Uscita: una riga per caso, `PASS` / `FALLITO` / `NON COPERTO`, poi il
 * riepilogo. Codice di uscita 1 se almeno un caso è FALLITO o NON COPERTO.
 *
 * Versione v14 (2026-11-21e, `644bd8c`): 2d esteso alla proposta R9b (tre vie, M = soglia − 1 e 0, «Applica» e
 * «Lascia com'è»), 4l (c) migrazione dopo il ritest, 4n sul gestore nuovo `archiviaSeduta`, 4o nuovo (B18, S5).
 * Versione v15 (2026-11-21f, `9d7b20f`): 2c riscritto per i blocchi `recordActual` con la lettura di S7 di R21 rev.
 * (D-Q3 = a di Alessio; sei condizioni, cinque positivi); 4o esteso a R23 (salita, leva variante, gradino scritto
 * nel diario); 4l (d) ritest dello stesso giorno della seduta (T-39, 9.31).
 * Versione v16 (2026-11-21g, `3c4a8d7`): 4o (vii) il selettore di `SessionScreen` (L42, `statoDopoCambioAMano`);
 * 4o (viii) il peso precompilato nella seduta dopo un cambio di gradino a 0 kg (player guidato e `SessionScreen`).
 * Versione v17 (2026-11-21h, `bcb9e5e`): 4j e 4o (viii) riconoscono anche la composizione con `kgDellaVoltaScorsa`
 * (B20) su sorgente normalizzato (senza commenti né spazi) e la modellano chiamando la funzione; 4o (viii) ha un
 * positivo in più: allo stesso gradino, al 6, la volta scorsa arriva al campo (senza, lo 0 a gradino diverso non
 * distinguerebbe la guardia da un campo che non legge mai la volta scorsa).
 *
 * Regola: NON COPERTO non è PASS. Un caso che non si può eseguire perché la
 * funzione non esiste resta NON COPERTO finché la funzione non esiste.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CIRCUIT_SESSIONS, findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { aumentoRecente, salitaConsentita, startingLevel } from '../../src/engine/progression.ts';
import { testBaseline } from '../../src/data/tests.ts';
import { evaluateProgression } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import { buildGuidedPlan, estimatedSeconds } from '../../src/engine/circuit.ts';
import * as CircE from '../../src/engine/circuit.ts';
import { summarizeExercise } from '../../src/engine/metrics.ts';
import { calibrateLoad } from '../../src/engine/loading.ts';
import type {
  DecisioneRegistrata, ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession, LoggedSet, TestId, TestResult,
} from '../../src/types/index.ts';

type Esito = 'PASS' | 'FALLITO' | 'NON COPERTO';
const risultati: { id: string; titolo: string; esito: Esito; nota: string }[] = [];
const registra = (id: string, titolo: string, esito: Esito, nota: string): void => {
  risultati.push({ id, titolo, esito, nota });
};

const VUOTO = new Map<TestId, TestResult>();

function sets(valori: number[], o: { side?: 'left' | 'right' | null; rir?: number | null; kg?: number; note?: string | null } = {}): LoggedSet[] {
  return valori.map((v, i) => ({
    setIndex: i + 1, side: o.side ?? null, value: v, rir: o.rir ?? null,
    loadKg: o.kg ?? 0, heartRate: null, note: o.note ?? null,
  }));
}
function esercizio(blockCode: string, slug: ExerciseSlug, s: LoggedSet[], tempo: boolean | null, level: LevelIndex | null, note: string | null = null): LoggedExercise {
  return { blockCode, exercise: slug, variantLabel: 'fixture', level, tempoRespected: tempo, sets: s, note };
}
/* v6: la data segue la settimana (inizio programma lunedì 2026-03-02, mercoledì della settimana):
   con R8 la revisione legge le date, non solo `week`. */
const INIZIO = '2026-03-02';
const piu = (x: string, n: number): string => new Date(Date.UTC(+x.slice(0, 4), +x.slice(5, 7) - 1, +x.slice(8, 10)) + n * 86_400_000).toISOString().slice(0, 10);
const fineSett = (w: number): string => piu(INIZIO, 7 * w - 1);
function seduta(id: string, week: number, sessionId: LoggedSession['sessionId'], e: LoggedExercise[], note: string | null = null, date: string = piu(INIZIO, 7 * (week - 1) + 2)): LoggedSession {
  return { id, date, week, sessionId, status: 'completed', exercises: e, note };
}
/* revisione della settimana W aperta il giorno dopo la sua fine, salvo `today` */
/* v7: la revisione riceve il registro delle scelte (R10b, R13); vuoto salvo dove detto */
function revisione(week: number, sessions: LoggedSession[], states: Map<ExerciseSlug, ExerciseState>, tests: ReadonlyMap<TestId, TestResult> = VUOTO, today: string = piu(fineSett(week), 1), decisioni: readonly DecisioneRegistrata[] = []) {
  return reviewWeek({ week, sessions, states, tests, weekEnd: fineSett(week), today, decisioni });
}
const settDi = (x: string): number => Math.floor((Date.parse(`${x}T00:00:00Z`) - Date.parse(`${INIZIO}T00:00:00Z`)) / (7 * 86_400_000)) + 1;
function stato(slug: ExerciseSlug, level: LevelIndex | null, kg = 0) {
  return { exercise: slug, level, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: kg };
}
function fileTesto(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  const cammina = (d: string): void => {
    for (const nome of readdirSync(d)) {
      const p = join(d, nome);
      if (statSync(p).isDirectory()) { cammina(p); continue; }
      if (ext.some((e) => nome.endsWith(e)) && !nome.includes('.test.')) out.push(p);
    }
  };
  cammina(dir);
  return out;
}

/* v13 (2026-11-21, `704dbfa`): la chiusura di una seduta come la fanno `chiudi` (GuidedSession) e
 * `saveAndExit` (SessionScreen): stati cambiati dal diario (`statesToSave(syncStatesFromLog)`), poi, dal
 * `704dbfa` (R9c punto 1), `statiDaFissare` sugli esercizi fatti e non ancora scritti. Senza scelte e senza
 * decadenze. Con `statiDaFissare` assente, o con `conR9c` falso, è la chiusura di prima. `gestoreChiama`
 * legge il sorgente dei due gestori: se la chiamata manca, la composizione modellata non è quella dell'app. */
type Repo13 = { saveTestResult(r: TestResult): Promise<unknown>; getExerciseState(s: ExerciseSlug): Promise<ExerciseState>;
  saveExerciseState(s: ExerciseState): Promise<unknown>; saveSession(s: LoggedSession): Promise<unknown>;
  getConfirmedStates(s: readonly ExerciseSlug[]): Promise<ReadonlySet<ExerciseSlug>>; fissaStatiMancanti?: () => Promise<number>;
  /* v14 (2026-11-21e, `644bd8c`): «Archivia» (cc95fac) e R9b (93cf066). Opzionali: assenti sui commit di prima. */
  archiviaSeduta?: (s: LoggedSession) => Promise<number>;
  proposteRitest?: () => Promise<Proposta14[]>;
  decidiRitest?: (p: Proposta14, accettata: boolean, oggi: string) => Promise<void>;
  listSuggestions(slug?: ExerciseSlug): Promise<{ id: string; decision: string; lever: string }[]>;
  getSession?: (id: string) => Promise<LoggedSession | undefined> };
type Proposta14 = { id: string; testId: TestId; data: string; verdict: { exercise: ExerciseSlug; kind: string; lever: string; change: string;
  stateBefore: ExerciseState; stateAfter: ExerciseState } };
const RepoMod13 = (await import('../../src/db/repository.ts')) as unknown as { ShadowRepository: new () => Repo13 };
const DraftMod13 = (await import('../../src/engine/draft.ts')) as unknown as {
  syncStatesFromLog(s: LoggedSession, m: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statesToSave(x: readonly ExerciseState[], a: ReadonlyMap<ExerciseSlug, ExerciseState>): ExerciseState[];
  statiDaFissare?: (s: readonly LoggedSession[], g: ReadonlySet<ExerciseSlug>, c: (x: ExerciseSlug) => ExerciseState | undefined) => ExerciseState[] };
async function chiusuraApp(repo: Repo13, s: LoggedSession, conR9c = true): Promise<void> {
  const slugs = [...new Set(s.exercises.map((e) => e.exercise))];
  const states = new Map(await Promise.all(slugs.map(async (x) => [x, await repo.getExerciseState(x)] as const)));
  const confirmed = await repo.getConfirmedStates(slugs);
  const salvati = DraftMod13.statesToSave(DraftMod13.syncStatesFromLog(s, states), new Map());
  for (const x of salvati) await repo.saveExerciseState(x);
  if (conR9c && DraftMod13.statiDaFissare !== undefined) {
    const gia = new Set([...confirmed, ...salvati.map((x) => x.exercise)]);
    for (const x of DraftMod13.statiDaFissare([s], gia, (k) => states.get(k))) await repo.saveExerciseState(x);
  }
  await repo.saveSession({ ...s, status: 'completed' });
}
function gestoreChiama(file: string, inizio: string, chiamata: string): boolean | null {
  const src = readFileSync(file, 'utf8');
  const i = src.indexOf(inizio);
  if (i < 0) return null;
  const fine = src.indexOf('closeSession(', i);
  return fine > i && src.slice(i, fine).includes(chiamata);
}

/* ====================================================================== */
/* CASO 1 — dolore dichiarato gestito con un rimando                      */
/* ====================================================================== */
{
  const nota = 'ginocchio destro, fastidio acuto, mi sono fermata';
  const s = seduta('sc1', 3, 'circuito-1', [
    esercizio('A2', 'bulgarian-split-squat', [
      ...sets([7, 7], { side: 'left', note: nota }),
      ...sets([7, 7], { side: 'right', note: nota }),
    ], true, 1, nota),
  ], nota);
  const r = revisione(3, [s], new Map());
  const testo = JSON.stringify(r).toLowerCase();
  const rimando = /dolor|medico|fisioterap|professionista|fermati/.test(testo);
  const esercizioAncoraProposto = r.inRange.includes('Bulgarian split squat') || r.verdicts.some((v) => v.exercise === 'bulgarian-split-squat');
  registra('1', 'Dolore dichiarato gestito con un rimando',
    'NON COPERTO',
    `nessun campo e nessuna regola sul dolore esistono nell'app. Misurato: rimando presente=${String(rimando)}, esercizio ancora trattato come normale=${String(esercizioAncoraProposto)}. Atteso quando la funzione esisterà: rimando presente=true, nessun verdetto di progressione su quell'esercizio.`);
}

/* ====================================================================== */
/* CASO 2 — principiante senza esercizi oltre il suo gradino              */
/* ====================================================================== */
{
  /*
   * Fixture dei nove test di Settimana 0, persona P1 (PERSONAS.md).
   *
   * Dal 2026-11-09 `startingLevel` accetta i massimali: chiamarla senza era
   * il motivo per cui questo caso restava FALLITO anche dopo la correzione.
   * Il rematore al TRX resta ASSENTE apposta: P1 non ha un TRX, quindi quel
   * test non esiste e si vede cosa fa la funzione senza risultato.
   */
  const misurato: Record<string, number> = {
    'pull-up': 0, 'dip': 0, 'nordic-curl': 0, 'push-up': 4,
    'pike-push-up': 2, 'bulgarian-split-squat': 5, 'hollow-hold': 12, 'dead-hang': 8,
  };
  const PROVE: ReadonlyMap<TestId, TestResult> = new Map(
    Object.entries(misurato).map(([id, value]) => [
      id as TestId,
      { testId: id as TestId, date: '2026-01-05', week: 0, value },
    ]),
  );

  /* Esercizi prescritti dalle 4 sedute, alternative comprese. */
  const prescritti = new Set<ExerciseSlug>();
  for (const sessione of CIRCUIT_SESSIONS) {
    for (const blocco of sessione.blocks) {
      prescritti.add(blocco.exercise);
      for (const alt of blocco.alternatives ?? []) prescritti.add(alt.exercise);
    }
  }

  /*
   * Dal 2026-11-12 (commit 38dcae6) la mappatura valore → gradino esiste: è
   * R1 di PROGRAM_RULES §3, proposta da training-designer. Il caso diventa
   * decidibile. Tre controlli:
   *   2a  zero misurato o test assente → primo gradino eseguibile (1);
   *   2b  `startingLevel` coincide con R1 riscritta qui dal testo, non dal
   *       codice, su ogni esercizio prescritto;
   *   2c  S7 nella sua lettura minima: se il test si esegue allo STESSO
   *       gradino che l'app assegna e il valore misurato sta sotto il minimo
   *       del blocco, quel gradino non è compatibile con il valore misurato.
   *       R1 non lo produce mai sui blocchi giudicati (soglia ≥ minimo); può
   *       produrlo la riga 2 (blocchi esclusi dalla revisione).
   */
  const SOLO_ECC: Record<string, number[]> = { 'vertical-pull': [2], 'vertical-push': [3], dip: [2], 'posterior-chain': [2, 3, 4] };
  const ecc = (p: string, l: number): boolean => (SOLO_ECC[p] ?? []).includes(l);
  const primo = (p: string): number => { for (let c = 1; c <= 6; c += 1) if (!ecc(p, c)) return c; return 1; };
  const giu = (p: string, L: number): number => { for (let c = L - 1; c >= 1; c -= 1) if (!ecc(p, c)) return c; return 1; };
  const rirMax = (r: string): number => (r === '—' ? 0 : Number(r.split('-').at(-1)));
  const blocchiDi = (slug: ExerciseSlug) => CIRCUIT_SESSIONS.flatMap((x) => x.blocks.filter((b) => b.exercise === slug));
  const r1 = (slug: ExerciseSlug): number | null => {
    const e = getExercise(slug);
    const P = e.defaultLevel;
    if (e.pattern === null || P === null) return P;
    const B = blocchiDi(slug);
    if (B.length > 0 && B.every((b) => b.excludeFromReview === true)) return P;
    const t = testBaseline(e.pattern);
    if (t === null) return P <= 2 ? P : 1;
    if (P < t.level) return P;
    if (t.measurement !== e.measurement) return P;
    const r = PROVE.get(t.testId);
    if (r === undefined || r.value <= 0) return primo(e.pattern);
    const soglie = B.filter((b) => b.excludeFromReview !== true).flatMap((b) =>
      b.prescription.kind === 'reps' ? [b.prescription.min + rirMax(b.rir)]
        : b.prescription.kind === 'seconds' ? [b.prescription.min + Math.ceil(0.2 * b.prescription.min)] : []);
    if (soglie.length === 0) return Math.min(P, t.level);
    return r.value >= Math.max(...soglie) ? t.level : giu(e.pattern, t.level);
  };

  const sopraLoZero: string[] = [];
  const diversiDaR1: string[] = [];
  const incompatibili: string[] = [];
  for (const slug of [...prescritti].sort()) {
    const e = getExercise(slug);
    const livello = startingLevel(e, PROVE);
    if (livello !== r1(slug)) diversiDaR1.push(`${slug}: app ${String(livello)}, R1 ${String(r1(slug))}`);
    if (livello === null || e.pattern === null) continue;
    const prova = testBaseline(e.pattern);
    if (prova === null) continue;
    const risultato = PROVE.get(prova.testId);
    if ((risultato === undefined || risultato.value <= 0) && livello > 1 && blocchiDi(slug).some((b) => b.excludeFromReview !== true)) {
      sopraLoZero.push(`${slug}: misurato ${String(risultato?.value ?? 'nessuno')} → gradino ${String(livello)}, atteso 1`);
    }
    if (risultato === undefined || prova.level !== livello || prova.measurement !== e.measurement) continue;
    for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) {
      if (b.exercise !== slug) continue;
      /* v15: sui blocchi `recordActual` vale la lettura di R21 rev. (sotto, 2c-Z); qui resta la lettura minima */
      if ((b as { recordActual?: true }).recordActual === true) continue;
      const p = b.prescription;
      const min = p.kind === 'reps' || p.kind === 'seconds' ? p.min : null;
      if (min !== null && risultato.value < min) {
        incompatibili.push(`${s.id}/${b.code} ${slug}: test ${prova.testId} = ${String(risultato.value)} misurato al gradino ${String(livello)}, il blocco chiede ${String(min)}${p.kind === 'seconds' ? '"' : ''} allo stesso gradino${b.excludeFromReview === true ? ' (blocco escluso dalla revisione: R1 riga 2 lo lascia al gradino della scheda)' : ''}`);
      }
    }
  }

  /*
   * 2c-Z (v15, 2026-11-21f). R21 rev. (training/reports/2026-11-21-training-anelli-figure.md §1; D-Q3 = a di
   * Alessio): sui blocchi `recordActual` S7 si legge «nessuna dose sopra il misurato», ed è rispettata se e solo
   * se sono vere tutte e sei: (1) gradino P, mai sopra; (2) prescrizione «bersaglio <max>″, o finché la presa
   * regge», senza «almeno» né un minimo; (3) il conto si ferma al bersaglio, nessun valore oltre; (4) la serie
   * è il tempo vero: niente chiusura da sola, solo «Ho mollato» (floor, ≥ 1), «Sì, <max>″» o il campo numerico
   * 1..max−1, nessun campo di testo; (5) il tempo non entra in R1, R9b, verdetti, volume e Progressi, e non
   * diventa un TestResult; (6) la nota di sicurezza è visibile prima del «Via» (statico). Positivi che devono
   * fallire: gradino 3; autoComplete vero; «almeno» nel testo; un TestResult scritto da Z1; un blocco escluso
   * senza `recordActual` con un test sotto il minimo (torna alla lettura minima). Se un positivo non fallisce,
   * il controllo non misura e 2c è FALLITO.
   */
  type FattiZ = {
    dove: string; P: number | null; livelli: (number | null)[]; testi: string[]; max: number;
    passi: { autoComplete: boolean; recordActual: boolean; workSeconds: number }[]; valori: number[];
    ramo: string; impronte: string[]; testPrima: number; testDopo: number; progressi: boolean;
  };
  const controllaZ = (f: FattiZ): string[] => {
    const v: string[] = [];
    if (f.P === null || f.livelli.some((l) => l === null || l > f.P!)) v.push(`(1) ${f.dove}: gradini ${f.livelli.map(String).join('/')} con P = ${String(f.P)}`);
    if (f.testi.length < 2) v.push(`(2) ${f.dove}: prescrizione non trovata nel sorgente (${String(f.testi.length)} testi): il controllo va riscritto`);
    for (const t of f.testi) if (!/o finché la presa regge/.test(t) || !/ersaglio/.test(t) || /almeno|minimo|deve durare/i.test(t)) v.push(`(2) ${f.dove}: «${t}»`);
    if (f.passi.length === 0) v.push(`(3) ${f.dove}: nessun passo nel piano: la fixture non misura`);
    if (f.passi.some((x) => x.workSeconds !== f.max)) v.push(`(3) ${f.dove}: bersaglio del conto ${f.passi.map((x) => x.workSeconds).join('/')} ≠ massimo ${String(f.max)}`);
    if (f.valori.some((x) => x > f.max)) v.push(`(3) ${f.dove}: valori scrivibili oltre ${String(f.max)}: ${f.valori.filter((x) => x > f.max).join(', ')}`);
    if (!/if \(!tempoVero \|\| !cronometro\.running \|\| !raggiunto\) return;\s*stop\(\);/.test(f.ramo + ZSTOP)) v.push(`(3) ${f.dove}: il conto non si ferma al bersaglio (sorgente)`);
    if (f.passi.some((x) => x.autoComplete || !x.recordActual)) v.push(`(4) ${f.dove}: passo che si chiude da solo o senza tempo vero (autoComplete ${f.passi.map((x) => String(x.autoComplete)).join('/')})`);
    if (f.valori.some((x) => !Number.isInteger(x) || x < 1)) v.push(`(4) ${f.dove}: valori non interi o sotto 1: ${f.valori.filter((x) => !Number.isInteger(x) || x < 1).join(', ')}`);
    if (f.ramo === '' || /onCommit\(/.test(f.ramo) || (f.ramo.match(/scriviTenuta\(/g) ?? []).length < 3 || !/type="number"/.test(f.ramo) || /type="text"|<textarea/.test(f.ramo)) v.push(`(4) ${f.dove}: ramo del player con scritture diverse da «Ho mollato» / «Sì» / campo numerico (sorgente)`);
    if (new Set(f.impronte).size !== 1) v.push(`(5) ${f.dove}: revisione, volume o proposte R9b cambiano con il tempo di Z1 (${String(new Set(f.impronte).size)} impronte diverse)`);
    if (f.testDopo !== f.testPrima) v.push(`(5) ${f.dove}: ${String(f.testDopo - f.testPrima)} TestResult scritti chiudendo sedute con Z1`);
    if (!f.progressi) v.push(`(5) ${f.dove}: Progressi può mostrare l'esercizio del blocco (filtro dei blocchi esclusi assente o esercizio anche in un blocco giudicato)`);
    if (!/partita \? null : \(\s*<>[\s\S]*?Se la presa sta per cedere/.test(f.ramo)) v.push(`(6) ${f.dove}: nota di sicurezza non visibile prima del «Via» (sorgente)`);
    return v;
  };
  const ZSORG = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
  const zI = ZSORG.indexOf('if (tempoVero) {');
  const zF = zI < 0 ? -1 : ZSORG.indexOf('if (autoCompleta) {', zI);
  const ZRAMO = zI < 0 || zF < 0 ? '' : ZSORG.slice(zI, zF);
  const zS = ZSORG.indexOf('const tempoVero = step.recordActual');
  const ZSTOP = zS < 0 ? '' : ZSORG.slice(zS, zS + 600);
  const ZPAN = readFileSync('src/ui/screens/CircuitOverview.tsx', 'utf8');
  const zPan = /block\.recordActual === true[^?]*\?\s*\(\s*`([^`]*)`/.exec(ZPAN)?.[1] ?? null;
  const zPla = />\s*(Bersaglio \{bersaglio\}″[^<]*)</.exec(ZRAMO)?.[1] ?? null;
  const ZPROG = readFileSync('src/ui/screens/ProgressScreen.tsx', 'utf8');
  const CircZ = CircE as unknown as { isAutoComplete(b: unknown): boolean; tenutaMollata?: (n: number) => number | null; tenutaDichiarata?: (t: string, n: number) => number | null };
  const MetZ = (await import('../../src/engine/metrics.ts')) as unknown as { volumeByGroup(s: readonly LoggedSession[]): unknown };
  const zViol: string[] = [];
  const zPos: string[] = [];
  let zBlocchi = 0;
  let zFattiPrimo: FattiZ | null = null;
  for (const s of CIRCUIT_SESSIONS) for (const b of s.blocks) {
    if ((b as { recordActual?: true }).recordActual !== true) continue;
    zBlocchi += 1;
    const e = getExercise(b.exercise);
    const pr = b.prescription as { kind: string; min: number; max: number };
    const prova = e.pattern === null ? null : testBaseline(e.pattern);
    const livelli = [undefined, 0, 1, 8, 29, 30, 60].map((M) => startingLevel(e, prova === null || M === undefined ? new Map() : new Map([[prova.testId, { testId: prova.testId, date: '2026-01-05', week: 0, value: M } as TestResult]])));
    const passi = [1, 6, 7].flatMap((w) => buildGuidedPlan(s, w).filter((x) => x.kind === 'work' && x.blockCode === b.code)) as unknown as { autoComplete: boolean; recordActual: boolean; workSeconds: number }[];
    const valori: number[] = [pr.max];
    if (CircZ.tenutaMollata !== undefined) for (let t = 0; t <= pr.max; t += 0.25) { const x = CircZ.tenutaMollata(t); if (x !== null) valori.push(x); }
    if (CircZ.tenutaDichiarata !== undefined) for (const t of ['0', '1', '15', String(pr.max - 1), String(pr.max), String(pr.max + 1), '100', '-1', '1.5', 'abc', ' 12 ', '1e1', '']) { const x = CircZ.tenutaDichiarata(t, pr.max); if (x !== null) valori.push(x); }
    /* (5) impronte: due sedute della settimana 2 e 3 con il blocco giudicato A1 fisso e Z1 a 1, 8, max−1, max */
    const impronte: string[] = [];
    let testPrima = 0, testDopo = 0;
    for (const z of [1, 8, pr.max - 1, pr.max]) {
      const giud = s.blocks.find((x) => x.excludeFromReview !== true && getExercise(x.exercise).measurement === 'reps' && getExercise(x.exercise).pattern !== null)!;
      const sed = (id: string, w: number, d: string) => seduta(id, w, s.id, [esercizio(giud.code, giud.exercise, sets([7, 7, 7]), true, startingLevel(getExercise(giud.exercise), PROVE) as LevelIndex), esercizio(b.code, b.exercise, sets([z]), true, livelli[0] as LevelIndex)], null, d);
      const sessioni = [sed('z1', 2, '2026-03-11'), sed('z2', 3, '2026-03-18')];
      const rv = revisione(3, sessioni, new Map(), PROVE);
      const repo = new RepoMod13.ShadowRepository() as unknown as Repo13 & { listTestResults(): Promise<unknown[]>; proposteRitest?: () => Promise<unknown[]>; archiviaSeduta?: (x: LoggedSession) => Promise<number>; fissaStatiMancanti?: () => Promise<number> };
      for (const t of PROVE.values()) await repo.saveTestResult(t);
      testPrima = (await repo.listTestResults()).length;
      await chiusuraApp(repo, sessioni[0]!);
      if (repo.archiviaSeduta !== undefined) await repo.archiviaSeduta({ ...sessioni[1]!, status: 'in-progress' } as LoggedSession); else await chiusuraApp(repo, sessioni[1]!);
      if (repo.fissaStatiMancanti !== undefined) await repo.fissaStatiMancanti();
      testDopo = Math.max(testDopo, (await repo.listTestResults()).length);
      const proposte = repo.proposteRitest === undefined ? [] : await repo.proposteRitest();
      impronte.push(JSON.stringify([rv, MetZ.volumeByGroup(sessioni), proposte]));
    }
    const progressi = /session\.blocks\.filter\(\(block\) => block\.excludeFromReview !== true\)/.test(ZPROG)
      && CIRCUIT_SESSIONS.every((x) => x.blocks.every((y) => y.exercise !== b.exercise || y.excludeFromReview === true));
    const fatti: FattiZ = { dove: `${s.id}/${b.code} ${b.exercise}`, P: e.defaultLevel, livelli, testi: [zPla, zPan].filter((x): x is string => x !== null), max: pr.max, passi, valori, ramo: ZRAMO, impronte, testPrima, testDopo, progressi };
    zViol.push(...controllaZ(fatti));
    zFattiPrimo ??= fatti;
  }
  if (zBlocchi === 0) zViol.push('2c-Z: nessun blocco `recordActual` nelle sedute: la lettura di R21 rev. non si applica, il controllo va riscritto');
  if (zFattiPrimo !== null) {
    const f = zFattiPrimo;
    const positivi: [string, FattiZ][] = [
      ['Z1 al gradino 3', { ...f, livelli: [...f.livelli, 3] }],
      ['Z1 con autoComplete vero', { ...f, passi: f.passi.map((x) => ({ ...x, autoComplete: true })) }],
      ['un testo con «almeno»', { ...f, testi: [...f.testi, `bersaglio ${String(f.max)}″, o finché la presa regge · almeno 0:30`] }],
    ];
    /* un TestResult scritto da Z1: la chiusura mutata scrive il tempo di Z1 come test */
    {
      const repo = new RepoMod13.ShadowRepository() as unknown as Repo13 & { listTestResults(): Promise<unknown[]> };
      for (const t of PROVE.values()) await repo.saveTestResult(t);
      const prima = (await repo.listTestResults()).length;
      await chiusuraApp(repo, seduta('zp', 2, 'circuito-1', [esercizio('Z1', 'dead-hang' as ExerciseSlug, sets([12]), true, 2 as LevelIndex)], null, '2026-03-11'));
      await repo.saveTestResult({ testId: 'dead-hang' as TestId, date: '2026-03-11', week: 2, value: 12 } as TestResult);
      positivi.push(['un TestResult scritto da Z1', { ...f, testPrima: prima, testDopo: (await repo.listTestResults()).length }]);
    }
    for (const [nome, ff] of positivi) if (controllaZ(ff).length === 0) zPos.push(nome);
    /* un blocco escluso senza `recordActual`, con un test sotto il minimo allo stesso gradino: la lettura minima lo segnala */
    const zb = CIRCUIT_SESSIONS.flatMap((x) => x.blocks).find((x) => (x as { recordActual?: true }).recordActual === true)!;
    const ez = getExercise(zb.exercise);
    const pz = ez.pattern === null ? null : testBaseline(ez.pattern);
    const rz = pz === null ? undefined : PROVE.get(pz.testId);
    const lz = startingLevel(ez, PROVE);
    const minimaSegnala = pz !== null && rz !== undefined && pz.level === lz && zb.prescription.kind === 'seconds' && rz.value < zb.prescription.min;
    if (!minimaSegnala) zPos.push('un blocco escluso senza `recordActual` con un test sotto il minimo');
  }
  const zEsito = zViol.length === 0 && zPos.length === 0;

  /*
   * 2d (v13, 2026-11-21) — S7 dopo un test peggiore (R9b, D-18 di Alessio; R9c punto 4: «dopo ogni ritest,
   * solo in discesa, con R9b»). Per ogni esercizio dei circuiti in cui R1 arriva alla riga 8: test di
   * settimana 0 alla soglia (→ Lt), una seduta chiusa a Lt come la chiude l'app, ritest di settimana 6 con
   * 0 < M = soglia − 1. Atteso: gradino ≤ giù(Lt), oppure una proposta `riparti-dal-test` (R9b). Due vie:
   * lo stato salvato prima della seduta (com'è per ogni esercizio già cambiato una volta) e la sola chiusura.
   * Positivo: con la chiusura di prima e lo stato mai salvato il gradino scende (R1 sullo stato virtuale).
   */
  /* v14 (2026-11-21e): con R9b (`93cf066`) il controllo si estende alla proposta, come diceva la v13.
   * Per ogni esercizio e per tre vie (stato salvato prima della seduta; sola chiusura come l'app; storia
   * chiusa come prima e migrazione arrivata DOPO il ritest, cc95fac), con M = soglia − 1 (→ giù(Lt)) e M = 0
   * (→ primo gradino): S7 è rispettata se il gradino è già ≤ atteso, oppure se esiste una proposta
   * `riparti-dal-test` L → atteso (mai più alta, mai una salita, 0 kg, tempo e pausa a 0). Poi «Applica»
   * porta allo stato atteso e la proposta sparisce; «Lascia com'è» lascia il gradino e la proposta sparisce.
   * Discriminazione: con M = soglia nessuna proposta. Positivo: chiusura di prima, stato virtuale, scende. */
  let r9b = false;
  for (const f of fileTesto('src/engine', ['.ts'])) if (readFileSync(f, 'utf8').includes("'riparti-dal-test'")) r9b = true;
  const conProposte = typeof (RepoMod13.ShadowRepository.prototype as Partial<Repo13>).proposteRitest === 'function';
  const fermi2d: string[] = [];
  const scarti2d: string[] = [];
  let positivo2d = 0, misurati2d = 0, controlli2d = 0, proposteViste = 0;
  for (const slug of [...prescritti].sort()) {
    const e = getExercise(slug);
    const P = e.defaultLevel;
    if (e.pattern === null || P === null) continue;
    const B = blocchiDi(slug).filter((b) => b.excludeFromReview !== true);
    const t = testBaseline(e.pattern);
    if (B.length === 0 || t === null || P < t.level || t.measurement !== e.measurement) continue;
    const soglie = B.flatMap((b) => b.prescription.kind === 'reps' ? [b.prescription.min + rirMax(b.rir)]
      : b.prescription.kind === 'seconds' ? [b.prescription.min + Math.ceil(0.2 * b.prescription.min)] : []);
    if (soglie.length === 0) continue;
    const soglia = Math.max(...soglie);
    const atteso = giu(e.pattern, t.level);
    if (atteso >= t.level) continue;
    const b0 = B[0]!;
    const sid = CIRCUIT_SESSIONS.find((x) => x.blocks.includes(b0))!.id;
    const min = b0.prescription.kind === 'reps' || b0.prescription.kind === 'seconds' ? b0.prescription.min : 5;
    type Via = 'stato salvato' | 'sola chiusura' | 'migrazione dopo il ritest';
    const giro = async (via: Via | 'prima', M: number, decisione: 'nessuna' | 'applica' | 'lascia' = 'nessuna') => {
      const repo = new RepoMod13.ShadowRepository();
      await repo.saveTestResult({ testId: t.testId, date: '2026-03-02', week: 0, value: soglia } as TestResult);
      const s0 = await repo.getExerciseState(slug);
      if (via === 'stato salvato') await repo.saveExerciseState(s0);
      await chiusuraApp(repo, seduta('2d-1', 1, sid as LoggedSession['sessionId'], [esercizio(b0.code, slug, sets([min, min]), true, s0.level)]), via === 'stato salvato' || via === 'sola chiusura');
      await repo.saveTestResult({ testId: t.testId, date: '2026-04-13', week: 6, value: M } as TestResult);
      if (via === 'migrazione dopo il ritest') { if (repo.fissaStatiMancanti === undefined) return null; await repo.fissaStatiMancanti(); }
      const l1 = (await repo.getExerciseState(slug)).level;
      const proposte = repo.proposteRitest === undefined ? [] : await repo.proposteRitest();
      const mie = proposte.filter((x) => x.verdict.exercise === slug);
      let dopo: ExerciseState | null = null, rimaste = -1, record: { decision: string } | null = null;
      if (decisione !== 'nessuna' && mie[0] !== undefined && repo.decidiRitest !== undefined) {
        await repo.decidiRitest(mie[0], decisione === 'applica', '2026-04-14');
        dopo = await repo.getExerciseState(slug);
        rimaste = (await repo.proposteRitest!()).filter((x) => x.verdict.exercise === slug).length;
        record = (await repo.listSuggestions(slug)).find((x) => x.id === mie[0]!.id) ?? null;
      }
      return { l0: s0.level, l1, mie, altre: proposte.filter((x) => x.verdict.exercise !== slug), dopo, rimaste, record };
    };
    misurati2d += 1;
    const pos = await giro('prima', soglia - 1);
    if (pos !== null && pos.l0 === t.level && pos.l1 === atteso) positivo2d += 1;
    for (const [M, att, nomeM] of [[soglia - 1, atteso, `${String(soglia - 1)} < soglia ${String(soglia)}`], [0, primo(e.pattern), '0']] as const) {
      if (att >= t.level) continue;
      for (const via of ['stato salvato', 'sola chiusura', 'migrazione dopo il ritest'] as const) {
        const g = await giro(via, M);
        if (g === null) { scarti2d.push(`${slug} (${via}): \`fissaStatiMancanti\` assente, via non misurata`); continue; }
        controlli2d += 1;
        if (g.l0 !== t.level) { fermi2d.push(`${slug}: la partenza non è Lt (${String(g.l0)} invece di ${String(t.level)}): la fixture non misura`); continue; }
        if (g.altre.length > 0) scarti2d.push(`${slug} (${via}, M=${nomeM}): proposte anche su ${g.altre.map((x) => x.verdict.exercise).join(', ')}`);
        if ((g.l1 ?? 0) <= att) { if (g.l1 !== g.l0 && via !== 'migrazione dopo il ritest') scarti2d.push(`${slug} (${via}, M=${nomeM}): sceso da solo ${String(g.l0)} → ${String(g.l1)} (R9b: si scende solo con «Applica»)`); continue; }
        const p = g.mie.find((x) => x.verdict.kind === 'riparti-dal-test');
        if (p === undefined) { fermi2d.push(`${slug} (${via}): ritest ${t.testId} = ${nomeM}, resta ${String(g.l1)}, R9b vuole ${String(att)} o una proposta, ${conProposte ? 'e la proposta non c’è' : 'e nessuna proposta esiste'}`); continue; }
        proposteViste += 1;
        const a = p.verdict.stateAfter, b = p.verdict.stateBefore;
        if ((a.level ?? 0) > att) fermi2d.push(`${slug} (${via}, M=${nomeM}): proposta ${String(b.level)} → ${String(a.level)}, sopra il gradino compatibile ${String(att)}`);
        else if ((a.level ?? 0) < att) scarti2d.push(`${slug} (${via}, M=${nomeM}): proposta ${String(b.level)} → ${String(a.level)}, sotto ${String(att)} di R9b`);
        if ((a.level ?? 0) >= (b.level ?? 0)) fermi2d.push(`${slug} (${via}, M=${nomeM}): la proposta non scende (${String(b.level)} → ${String(a.level)})`);
        if (b.level !== g.l1) scarti2d.push(`${slug} (${via}): stato prima della proposta ${String(b.level)} ≠ stato dell'app ${String(g.l1)}`);
        if (a.loadKg !== 0 || a.eccentricBonusSeconds !== 0 || a.bottomPauseBonusSeconds !== 0) fermi2d.push(`${slug} (${via}, M=${nomeM}): stato dopo ${JSON.stringify(a)} (S5 / R9b: 0 kg, tempo e pausa della scheda)`);
        if (p.verdict.lever !== 'variant' || p.id !== `ritest-2026-04-13:${slug}`) scarti2d.push(`${slug}: leva ${p.verdict.lever}, id ${p.id}`);
        if (via !== 'sola chiusura') continue;
        const ap = await giro(via, M, 'applica');
        if (ap === null || ap.dopo === null || ap.dopo.level !== att || ap.dopo.loadKg !== 0 || ap.rimaste !== 0 || ap.record?.decision !== 'accepted') fermi2d.push(`${slug} (M=${nomeM}): «Applica» → stato ${JSON.stringify(ap?.dopo ?? null)}, proposte rimaste ${String(ap?.rimaste)}, registro ${String(ap?.record?.decision)} (atteso gradino ${String(att)}, 0 kg, nessuna proposta, accepted)`);
        const la = await giro(via, M, 'lascia');
        if (la === null || la.dopo === null || la.dopo.level !== g.l1 || la.rimaste !== 0 || la.record?.decision !== 'postponed') scarti2d.push(`${slug} (M=${nomeM}): «Lascia com'è» → stato ${String(la?.dopo?.level)}, proposte rimaste ${String(la?.rimaste)}, registro ${String(la?.record?.decision)}`);
      }
    }
    /* discriminazione: alla soglia nessuna proposta e nessuna discesa */
    const ok = await giro('sola chiusura', soglia);
    if (ok !== null && (ok.mie.length > 0 || ok.l1 !== ok.l0)) fermi2d.push(`${slug}: con M = soglia ${String(soglia)} proposta o discesa (${String(ok.l0)} → ${String(ok.l1)}, ${String(ok.mie.length)} proposte): la fixture non distingue`);
  }
  if (positivo2d !== misurati2d) fermi2d.push(`2d: positivo ${String(positivo2d)}/${String(misurati2d)} (con la chiusura di prima lo stato virtuale scende): la fixture non misura`);
  if (r9b && !conProposte) fermi2d.push('2d: `riparti-dal-test` esiste nel motore ma il repository non espone `proposteRitest`: il controllo va riscritto');

  const esito2: Esito = sopraLoZero.length > 0 || diversiDaR1.length > 0 || incompatibili.length > 0 || !zEsito || fermi2d.length > 0 ? 'FALLITO' : 'PASS';
  const coda = `2a zero o assente → gradino 1: ${sopraLoZero.length === 0 ? 'rispettato' : sopraLoZero.join(' | ')}. 2b app = R1 (PROGRAM_RULES §3, riscritta dal testo): ${diversiDaR1.length === 0 ? `coincide su ${String(prescritti.size)} esercizi prescritti` : diversiDaR1.join(' | ')}. 2c S7 minima sui blocchi senza recordActual (stesso gradino del test, valore sotto il minimo del blocco): ${incompatibili.length === 0 ? 'nessun caso' : `${String(incompatibili.length)} blocchi → ${incompatibili.join(' | ')}`}. 2c-Z S7 «nessuna dose sopra il misurato» sui blocchi recordActual (R21 rev., D-Q3 = a; v15): ${String(zBlocchi)} blocchi, ${zViol.length === 0 ? 'sei condizioni vere (la 6 dal sorgente)' : zViol.join(' | ')}; positivi ${zBlocchi === 0 ? 'non eseguiti' : zPos.length === 0 ? '5/5 falliscono' : `che NON falliscono: ${zPos.join(', ')} (il controllo non misura)`}. S7 approvata da Alessio il 2026-11-12; R1 è la regola di training-designer (PROGRAM_RULES §3). 2d S7 dopo un test peggiore (R9b, v14): ${fermi2d.length === 0 ? `${String(misurati2d)} esercizi, ${String(controlli2d)} controlli, tutti giù o con proposta (${String(proposteViste)} proposte L → atteso; «Applica» e «Lascia com'è» verificati)` : `${String(fermi2d.length)} → ${fermi2d.join(' | ')}`} (positivo ${String(positivo2d)}/${String(misurati2d)})${scarti2d.length === 0 ? '' : `. Scostamenti da R9b, non da S7: ${scarti2d.join(' | ')}`}.`;

  registra('2', 'Principiante senza esercizi oltre il suo gradino', esito2, coda);
}

/* ====================================================================== */
/* CASO 3 — solo corpo libero: nessun esercizio fuori attrezzatura        */
/* ====================================================================== */
{
  /* L'anagrafica non dichiara l'attrezzo: lista mantenuta qui, da training-quality. */
  const RICHIEDE_ATTREZZO = new Map<string, string>([
    ['trazioni-prona-presa-media', 'sbarra'], ['trazioni-presa-larga', 'sbarra'],
    ['chin-up-presa-supina', 'sbarra'], ['chin-up-presa-supina-stretta', 'sbarra'],
    ['hanging-leg-raise', 'sbarra'], ['dead-hang', 'sbarra'], ['scapular-pull-up', 'sbarra'],
    ['dip-parallele-anelli', 'parallele o anelli'], ['dip-panche', 'due panche'],
    ['dip-panche-o-diamond-pushup', 'due panche'],
    ['rematore-inverso-trx', 'TRX'], ['rematore-inverso-trx-piedi-rialzati', 'TRX'],
    ['pull-over-trx', 'TRX'], ['goblet-squat', 'manubrio o kettlebell'],
    ['curl-martello-manubri', 'manubri'], ['estensione-tricipiti-sopra-testa', 'manubrio'],
    ['rematore-manubrio-un-braccio', 'manubrio'], ['suitcase-carry', 'manubrio o kettlebell'],
    ['croci-elastico-o-pushup-presa-larga', 'manubri o elastico'],
    ['alzate-laterali-elastico', 'elastico'], ['face-pull-elastico', 'elastico'],
    ['curl-elastico-presa-neutra', 'elastico'], ['pallof-press-elastico', 'elastico'],
    ['kb-swing', 'kettlebell'], ['corda-battaglia-onde-alternate', 'corda da battaglia'],
    ['step-rapidi-box', 'box'], ['step-up-box-alto', 'box'],
    ['bulgarian-split-squat', 'panca o rialzo'], ['hip-thrust-monopodalico', 'panca'],
    ['nordic-curl', 'appoggio per le caviglie'],
    /* Aggiunti il 2026-11-09: esercizi entrati nel circuito con la trascrizione
       della scheda (commit f63c9f1). Senza di loro la misura sottostimava. */
    ['curl-manubri-supino', 'manubri'], ['curl-panca-inclinata', 'manubri e panca'],
    ['curl-trx', 'TRX'], ['estensione-tricipiti-trx', 'TRX'],
    ['military-press-manubri', 'manubri'], ['plank-trascinamento-kb', 'kettlebell'],
    ['hip-thrust-panca-bilaterale', 'panca e kettlebell'],
    ['dip-panche-piedi-rialzati', 'due panche o rialzi'],
    ['dip-panche-o-diamond-pushup', 'due panche o rialzi'],
    ['corda-per-saltare', 'corda per saltare'],
    ['corda-battaglia-slam', 'corda da battaglia'],
    ['corda-battaglia-cerchi', 'corda da battaglia'],
    ['corda-battaglia-onde-doppie', 'corda da battaglia'],
    ['dead-hang', 'sbarra'], ['scapular-pull-up', 'sbarra'],
    ['trazioni-prona-presa-media', 'sbarra'], ['dip-parallele-anelli', 'parallele o anelli'],
    ['stacco-rumeno-manubri', 'manubri'], ['pike-pushup-piedi-rialzati', 'rialzo'],
  ]);
  const scoperti: string[] = [];
  let totaleBlocchi = 0;
  for (const s of CIRCUIT_SESSIONS) {
    for (const b of s.blocks) {
      totaleBlocchi += 1;
      const attrezzo = RICHIEDE_ATTREZZO.get(b.exercise);
      if (attrezzo === undefined) continue;
      const alternativaLibera = (b.alternatives ?? []).some((a) => !RICHIEDE_ATTREZZO.has(a.exercise));
      if (!alternativaLibera) scoperti.push(`${s.id}/${b.code} ${b.exercise} (${attrezzo})`);
    }
  }
  registra('3', 'Solo corpo libero: nessun esercizio fuori attrezzatura',
    scoperti.length === 0 ? 'PASS' : 'FALLITO',
    `${String(scoperti.length)} blocchi su ${String(totaleBlocchi)} richiedono un attrezzo senza alternativa a corpo libero. Inoltre NON COPERTO per metà: né Exercise né AppSettings hanno un campo attrezzatura, quindi l'atleta non può dichiarare cosa possiede. Primi tre: ${scoperti.slice(0, 3).join(' | ')}`);
}

/* ====================================================================== */
/* CASO 4 — progressione entro le soglie                                  */
/* ====================================================================== */
{
  const violazioni: string[] = [];

  /*
   * v6, 2026-11-15 (commit ff42dfb). Con R8 una revisione giudica solo le
   * ultime 2 sedute chiuse allo stesso stato nei 14 giorni fino a fine(W).
   * Le fixture della v5 avevano UNA seduta: R8 le chiude in `pocheProve`
   * prima della regola che 4a-4c misurano, e il PASS sarebbe stato falso.
   * Ogni controllo ha adesso (1) una coppia vera, (2) un controllo positivo
   * che apre tutte le altre barriere e deve produrre il verdetto: se non lo
   * produce, la fixture non misura niente e il controllo fallisce.
   * Inizio programma 2026-03-02; revisione aperta il giorno dopo fine(W).
   */
  const LIVELLO = (slug: ExerciseSlug, l: LevelIndex, kg = 0) => new Map([[slug, stato(slug, l, kg)]]);
  const PULL12 = new Map<TestId, TestResult>([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 }]]);

  /* 4a — S3: nessuna salita senza «sì» sul tempo in tutte e due le sedute della coppia. */
  {
    const r4a = (t: [boolean | null, boolean | null]) => revisione(2, [
      seduta('4a1', 1, 'circuito-2', [esercizio('A3', 'rematore-inverso-trx', sets([19, 19, 19]), t[0], 2)], null, '2026-03-05'),
      seduta('4a2', 2, 'circuito-2', [esercizio('A3', 'rematore-inverso-trx', sets([19, 19, 19]), t[1], 2)], null, '2026-03-12'),
    ], LIVELLO('rematore-inverso-trx', 2), VUOTO, '2026-03-19');
    const attesi: [[boolean | null, boolean | null], string][] = [
      [[true, false], 'rifai-al-tempo-giusto'], [[true, null], 'rispondi-sul-tempo'],
      [[false, false], 'rifai-al-tempo-giusto'], [[null, null], 'rispondi-sul-tempo'], [[false, null], 'rifai-al-tempo-giusto'],
    ];
    for (const [t, atteso] of attesi) {
      const r = r4a(t);
      if (r.verdicts.some((v) => v.kind === 'sali-di-livello')) violazioni.push(`S3: salita con tempo [${String(t[0])}, ${String(t[1])}]`);
      if (!r.verdicts.some((v) => v.kind === atteso && JSON.stringify(v.stateAfter) === JSON.stringify(v.stateBefore))) violazioni.push(`S3: tempo [${String(t[0])}, ${String(t[1])}] senza «${atteso}» a stato invariato (${r.verdicts.map((v) => v.kind).join(',') || r.pocheProve.length + ' pocheProve'})`);
    }
    const pos = r4a([true, true]).verdicts.find((v) => v.kind === 'sali-di-livello');
    if (pos?.stateAfter.level !== 3) violazioni.push('4a: controllo positivo [sì, sì] senza salita 2→3: la fixture non misura S3');
    /* fine seduta: un «no» non apre nessuna leva (il null lo copre 4i) */
    const blk = findCircuitSession('circuito-2')!.blocks.find((b) => b.code === 'A3')!;
    const exr = getExercise('rematore-inverso-trx');
    const bozza = seduta('4a3', 3, 'circuito-2', [esercizio('A3', 'rematore-inverso-trx', sets([19, 19, 19]), false, 2)], null, '2026-03-19');
    const evf = evaluateProgression({ block: blk, exercise: exr, state: stato('rematore-inverso-trx', 2), logged: bozza.exercises[0]!, range: resolveBlockRange(blk, exr, VUOTO), week: 3, currentMaxReps: null,
      salita: salitaConsentita('rematore-inverso-trx', 2, [seduta('4a1', 1, 'circuito-2', [esercizio('A3', 'rematore-inverso-trx', sets([19, 19, 19]), true, 2)], null, '2026-03-02')], '2026-03-19', { ...bozza, status: 'in-progress' }), rientro: null, aumentoRecente: null });
    if (evf.suggestion !== null) violazioni.push(`S3 fine seduta: leva «${evf.suggestion.lever}» con tempo «no»`);
  }

  /* 4b — S5: la zavorra non scavalca la variante. Test delle trazioni a 12, perché Z4 non mascheri Z2. */
  {
    const coppia = (l: LevelIndex, v: number[]) => [
      seduta('4b1', 2, 'circuito-1', [esercizio('A1', 'trazioni-prona-presa-media', sets(v), true, l)], null, '2026-03-11'),
      seduta('4b2', 3, 'circuito-1', [esercizio('A1', 'trazioni-prona-presa-media', sets(v), true, l)], null, '2026-03-18'),
    ];
    const r = revisione(3, coppia(1, [8, 8, 8]), LIVELLO('trazioni-prona-presa-media', 1), PULL12);
    if (r.verdicts.some((v) => v.kind === 'aggiungi-peso')) violazioni.push('S5: zavorra proposta al gradino 1, con la variante ancora disponibile');
    if (!r.alMassimo.some((x) => x.exercise === 'trazioni-prona-presa-media' && x.motivo === 'tempo')) violazioni.push('4b: gradino 1 al massimo esatto senza `alMassimo` «tempo»');
    /* v7 (R10a): la zavorra viene dopo tempo e pausa. Positivo con i due esauriti; a bonus 0 resta «tempo». */
    const esauriti = new Map([['trazioni-prona-presa-media' as ExerciseSlug, { ...stato('trazioni-prona-presa-media', 6), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 }]]);
    const pos = revisione(3, coppia(6, [8, 8, 8]), esauriti, PULL12).verdicts.find((v) => v.kind === 'aggiungi-peso');
    if (pos === undefined || pos.stateAfter.loadKg !== 2.5) violazioni.push('4b: controllo positivo al gradino 6 (tempo e pausa esauriti) senza zavorra 0→2,5 kg: la fixture non misura S5');
    const bonus0 = revisione(3, coppia(6, [8, 8, 8]), LIVELLO('trazioni-prona-presa-media', 6), PULL12);
    if (bonus0.verdicts.some((v) => v.kind === 'aggiungi-peso')) violazioni.push('4b (R10a): zavorra al gradino 6 con tempo e pausa ancora disponibili');
    const sopra = revisione(3, coppia(1, [9, 9, 9]), LIVELLO('trazioni-prona-presa-media', 1), PULL12);
    if (sopra.verdicts.some((v) => v.kind === 'aggiungi-peso')) violazioni.push('S5: con la variante in attesa (R7) la zavorra ne prende il posto');
    if (!sopra.inAttesa.some((x) => x.exercise === 'trazioni-prona-presa-media')) violazioni.push('4b: 9-9-9 al gradino 1 dal 03-11 non è `inAttesa`');
  }

  /* 4c — S1: un gradino eseguibile ogni 14 giorni. Il ciclo non si ferma su una settimana senza verdetto. */
  {
    const serieDate: [string, string[], number][] = [
      ['una a settimana', ['2026-03-04', '2026-03-11', '2026-03-18', '2026-03-25'], 1],
      ['due a settimana', ['2026-03-02', '2026-03-05', '2026-03-09', '2026-03-12', '2026-03-16', '2026-03-19', '2026-03-23', '2026-03-26'], 2],
    ];
    for (const [nome, date, attese] of serieDate) {
      let livello: LevelIndex = 2;
      const registro4c: DecisioneRegistrata[] = [];
      const sedute: LoggedSession[] = [];
      const cambi: string[] = [];
      for (let w = 1; w <= 4; w += 1) {
        for (const x of date.filter((dd) => settDi(dd) === w)) sedute.push(seduta(`4c-${x}`, w, 'circuito-3', [esercizio('A2', 'push-up', sets([19, 19, 19]), true, livello)], null, x));
        const r = revisione(w, sedute, LIVELLO('push-up', livello), VUOTO, piu(fineSett(w), 1), registro4c);
        const v = r.verdicts.find((y) => y.kind === 'sali-di-livello');
        if (v !== undefined) { cambi.push(piu(fineSett(w), 1)); registro4c.push({ date: piu(fineSett(w), 1), exercise: 'push-up' as ExerciseSlug, decision: 'accepted', stateBefore: v.stateBefore, stateAfter: v.stateAfter, sessionLogId: `revisione-${String(w)}:push-up` }); livello = v.stateAfter.level as LevelIndex; }
      }
      if (cambi.length > attese) violazioni.push(`S1 (${nome}): ${String(cambi.length)} salite in 4 settimane, attese ${String(attese)}`);
      if (cambi.length < attese) violazioni.push(`4c (${nome}): ${String(cambi.length)} salite, attese ${String(attese)}: la fixture non arriva alla regola`);
      for (let i = 1; i < cambi.length; i += 1) {
        const gap = (Date.parse(cambi[i]!) - Date.parse(cambi[i - 1]!)) / 86_400_000;
        if (gap < 14) violazioni.push(`S1 (${nome}): due salite a ${String(gap)} giorni`);
      }
    }
  }

  /* 4d — S4: nessun verdetto senza 2 sedute utili e 3 serie vere. Controllo positivo sulla discesa. */
  {
    const bulg = (id: string, date: string, l: LevelIndex, sinistra: number[], destra: number[]) =>
      seduta(id, settDi(date), 'circuito-1', [esercizio('A2', 'bulgarian-split-squat', [...sets(sinistra, { side: 'left' }), ...sets(destra, { side: 'right' })], true, l)], null, date);
    const st = LIVELLO('bulgarian-split-squat', 2);
    const casi: [string, number, LoggedSession[]][] = [
      ['(1) solo 03-11, 2 serie per lato', 2, [bulg('d1', '2026-03-11', 2, [13, 13], [13, 13])]],
      ['(2) 03-04 e 03-11, 1 serie S+D ciascuna', 2, [bulg('d2a', '2026-03-04', 2, [13], [13]), bulg('d2b', '2026-03-11', 2, [13], [13])]],
      ['(3) 03-08 (fine−14) e 03-18', 3, [bulg('d3a', '2026-03-08', 2, [7, 7], [7, 7]), bulg('d3b', '2026-03-18', 2, [7, 7], [7, 7])]],
      ['(4) 03-11 al gradino 1 e 03-18 al 2', 3, [bulg('d4a', '2026-03-11', 1, [7, 7], [7, 7]), bulg('d4b', '2026-03-18', 2, [7, 7], [7, 7])]],
      ['(6) righe orfane: 03-04 1 S+D e 2 solo S, 03-11 1 S+D', 2, [bulg('d6a', '2026-03-04', 2, [7, 7, 7], [7]), bulg('d6b', '2026-03-11', 2, [7], [7])]],
    ];
    for (const [nome, w, sedute] of casi) {
      const r = revisione(w, sedute, st);
      if (r.verdicts.length > 0) violazioni.push(`S4 ${nome}: verdetto «${r.verdicts[0]!.kind}»`);
      if (!r.pocheProve.some((x) => x.exercise === 'bulgarian-split-squat')) violazioni.push(`4d ${nome}: non in pocheProve`);
    }
    const uno = revisione(2, casi[0]![2], st);
    if (uno.setsCounted !== 2) violazioni.push(`S4 (1): setsCounted ${String(uno.setsCounted)} invece di 2 serie vere`);
    const pos = revisione(3, [bulg('d5a', '2026-03-09', 2, [7, 7], [7, 7]), bulg('d5b', '2026-03-18', 2, [7, 7], [7, 7])], st).verdicts.find((v) => v.kind === 'scendi-di-livello');
    if (pos?.stateAfter.level !== 1) violazioni.push('4d: controllo positivo (03-09 e 03-18, 2 S+D da 7) senza discesa 2→1: una R8 muta supererebbe (1)-(4)');
  }

  /* 4e — S2: il passo della zavorra resta 2,5 kg. v6: tempo e pausa esauriti, altrimenti la leva è il tempo e il controllo non misura niente. */
  {
    const block = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'A1')!;
    const ex = getExercise('chin-up-presa-supina-stretta');
    const st = { ...stato('chin-up-presa-supina-stretta', 6, 5), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 };
    const ev = evaluateProgression({
      block, exercise: ex, state: st,
      logged: esercizio('A1', 'chin-up-presa-supina-stretta', sets([10, 10, 10], { rir: 0, kg: 5 }), true, 6),
      range: resolveBlockRange(block, ex, VUOTO), week: 4, currentMaxReps: 12,
      salita: { consentita: true, inizio: '2026-03-02', dal: '2026-03-16' }, rientro: null, aumentoRecente: null,
    });
    if (ev.suggestion?.lever !== 'load') violazioni.push(`4e: nessuna leva di zavorra (${String(ev.suggestion?.lever)}): la fixture non misura S2`);
    else if (ev.suggestion.nextState.loadKg - 5 !== 2.5) violazioni.push(`S2: passo di zavorra ${String(ev.suggestion.nextState.loadKg - 5)} kg invece di 2,5`);

    /* v7 — S2 «a settimana», letta su 7 giorni (R-1, 2026-11-16): revisione e fine
       seduta insieme, e due sedute nello stesso giorno. Trazioni al 6, test 12,
       tempo e pausa esauriti; la fine seduta riceve il registro come il riepilogo
       (senza le scelte della seduta stessa) e il diario con la bozza. */
    const TR = 'trazioni-prona-presa-media' as ExerciseSlug;
    const bA1 = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'A1')!;
    const exT = getExercise(TR);
    const ESA = (kg: number): ExerciseState => ({ ...stato(TR, 6, kg), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 });
    const tr = (id: string, date: string, kg: number) => seduta(id, settDi(date), 'circuito-1', [esercizio('A1', TR, sets([8, 8, 8], { kg }), true, 6)], null, date);
    /* v9 (2026-11-20, D-21 a di Alessio): a fine seduta niente leve in salita nella settimana prima dello scarico.
       Le date v8 (03-23 … 04-02) cadevano in W4-W5: il 03-30 e il 04-02 tacevano per D-21, non per S2, e il positivo
       non tornava più. Tutto spostato di 5 settimane (W7-W10, nessuna settimana 5, 6, 11, 12): stessa misura. */
    const storia = [tr('e0', '2026-02-26', 0), tr('e1', '2026-04-16', 0), tr('e2', '2026-04-23', 0)];
    const fine = (id: string, date: string, L: ExerciseState, kg: number, sedute: LoggedSession[], reg: DecisioneRegistrata[]) => {
      const bozza = { ...tr(id, date, kg), status: 'in-progress' as const };
      return evaluateProgression({ block: bA1, exercise: exT, state: L, logged: bozza.exercises[0]!, range: resolveBlockRange(bA1, exT, PULL12), week: settDi(date), currentMaxReps: 12,
        salita: salitaConsentita(TR, 6, sedute, date, bozza), rientro: null,
        aumentoRecente: aumentoRecente(TR, reg.filter((x) => x.sessionLogId !== id), sedute, date, bozza) });
    };
    const rv = revisione(8, storia, new Map([[TR, ESA(0)]]), PULL12, '2026-04-27').verdicts.find((v) => v.exercise === TR);
    if (rv?.kind !== 'aggiungi-peso') violazioni.push(`4e (7 giorni): la revisione W8 del 04-27 non propone la zavorra (${String(rv?.kind)}): la fixture non arriva a S2`);
    const reg: DecisioneRegistrata[] = [{ date: '2026-04-27', exercise: TR, decision: 'accepted', stateBefore: ESA(0), stateAfter: ESA(2.5), sessionLogId: 'revisione-8:trazioni' }];
    const gio = fine('e3', '2026-04-30', ESA(2.5), 2.5, storia, reg);
    if (gio.suggestion !== null && gio.suggestion.nextState.loadKg > 2.5) violazioni.push(`S2 (7 giorni): +2,5 kg in revisione il 04-27 e altri +2,5 kg a fine seduta il 04-30 (${String(gio.suggestion.nextState.loadKg)} kg)`);
    /* v8 (2026-11-20, D-20 a di Alessio, R15): S2 conta sul carico sollevato. Il 05-04 (v8: 03-30) è la prima seduta a
       2,5 kg: proporre lì 2,5 → 5 vuol dire +5 kg veri in due sedute ravvicinate. Il positivo è il 05-07 (v8: 04-02),
       sette giorni dopo la prima seduta a 2,5 del 04-30 (v8: 03-26). */
    const lun = fine('e4', '2026-05-04', ESA(2.5), 2.5, storia, reg);
    if (lun.suggestion === null && !/7 giorni/.test(lun.blockedReason ?? '')) violazioni.push(`4e (v9): il 05-04 nessuna proposta ma non per R13 («${String(lun.blockedReason)}»): la fixture non misura S2`);
    if (lun.suggestion !== null && lun.suggestion.nextState.loadKg > 2.5) violazioni.push(`S2 (7 giorni, sul carico sollevato, D-20 a): 2,5 kg sollevati per la prima volta il 05-04 e altri +2,5 kg proposti lo stesso giorno (${String(lun.suggestion.nextState.loadKg)} kg)`);
    const gio2 = fine('e4b', '2026-05-07', ESA(2.5), 2.5, [...storia, tr('e3', '2026-04-30', 2.5)], reg);
    if (gio2.suggestion?.lever !== 'load' || gio2.suggestion.nextState.loadKg !== 5) violazioni.push(`4e (7 giorni): positivo mancato, il 05-07 (7 giorni dopo la prima seduta a 2,5 kg) la zavorra 2,5 → 5 kg non torna (${String(gio2.suggestion?.lever)})`);
    const p1 = fine('e5', '2026-04-30', ESA(0), 0, storia, []);
    const reg2: DecisioneRegistrata[] = p1.suggestion === null ? [] : [{ date: '2026-04-30', exercise: TR, decision: 'accepted', stateBefore: ESA(0), stateAfter: p1.suggestion.nextState, sessionLogId: 'e5' }];
    const p2 = fine('e6', '2026-04-30', p1.suggestion?.nextState ?? ESA(0), 0, [...storia, { ...tr('e5', '2026-04-30', 0) }], reg2);
    if (p1.suggestion?.lever !== 'load') violazioni.push('4e (stesso giorno): la prima seduta non propone la zavorra: la fixture non misura');
    else if (p2.suggestion !== null) violazioni.push(`S2 (stesso giorno): due sedute il 04-30, zavorra accettata alla prima e «${p2.suggestion.lever}» proposta alla seconda`);
  }

  /* 4f — un blocco escluso dalla revisione non produce verdetti, nemmeno con due sedute. */
  {
    const sedute = ['2026-03-04', '2026-03-11'].map((x, i) => seduta(`4f${String(i)}`, settDi(x), 'circuito-1', [esercizio('F1', 'kb-swing', sets([21, 21, 21]), true, null)], null, x));
    const r = revisione(2, sedute, new Map());
    const dentro = r.verdicts.length + r.pocheProve.length + r.alMassimo.length + r.inAttesa.length + r.fermi.length + r.inRange.length;
    if (dentro > 0) violazioni.push(`excludeFromReview ignorato: lo swing compare nella revisione (${r.verdicts.map((v) => v.kind).join(',')})`);
    if (r.setsCounted !== 0) violazioni.push(`4f: setsCounted ${String(r.setsCounted)} sulla finitura`);
  }

  /* 4g — T2: mai più di un gradino ESEGUIBILE alla volta (salto dei solo eccentrici). v6: coppia e R7 aperte. */
  {
    const casi: [string, LoggedSession['sessionId'], string, ExerciseSlug, LevelIndex, number][] = [
      ['trazioni', 'circuito-1', 'A1', 'trazioni-prona-presa-media', 1, 3],
      ['dip', 'circuito-1', 'A3', 'dip-parallele-anelli', 1, 3],
      ['pike', 'circuito-2', 'A1', 'pike-pushup-piedi-rialzati', 2, 4],
      ['push-up', 'circuito-3', 'A2', 'push-up', 2, 3],
    ];
    for (const [nome, sid, code, slug, da, atteso] of casi) {
      const blocco = findCircuitSession(sid)!.blocks.find((b) => b.code === code)!;
      const p = blocco.prescription;
      const sopra = (p.kind === 'reps' ? p.max : 0) + 1;
      const sedute = ['2026-03-05', '2026-03-12'].map((x, i) => seduta(`4g${nome}${String(i)}`, settDi(x), sid, [esercizio(code, slug, sets([sopra, sopra, sopra]), true, da)], null, x));
      const r = revisione(2, sedute, LIVELLO(slug, da), VUOTO, '2026-03-19');
      const a = r.verdicts.find((x) => x.kind === 'sali-di-livello')?.stateAfter.level ?? null;
      if (a === null) violazioni.push(`4g: ${nome} senza salita: la fixture non misura T2`);
      else if (a !== atteso) violazioni.push(`T2: ${nome} da ${String(da)} a ${String(a)}, atteso ${String(atteso)} (un solo gradino eseguibile)`);
    }
  }

  /* 4h — S9 (= BOUNDARIES L14), approvata il 2026-11-12: nessuna stazione
     balistica carica subito dopo una stabilizzazione del tronco senza almeno
     15" di transizione dichiarata. Si legge il piano guidato, non il dato:
     è il piano che l'atleta esegue. Settimana 1 e 6 (scarico). */
  {
    const BALISTICI = new Set<string>(['kb-swing', 'corda-battaglia-slam']);
    const TRONCO = new Set<string>(['suitcase-carry', 'hollow-hold', 'plank-trascinamento-kb', 'pallof-press-elastico', 'plank-tocco-spalla']);
    let giunzioni = 0;
    for (const sess of CIRCUIT_SESSIONS) {
      for (const w of [1, 6]) {
        const piano = buildGuidedPlan(sess, w);
        for (let i = 0; i < piano.length; i += 1) {
          const p = piano[i]!;
          if (p.kind !== 'work' || !BALISTICI.has(p.exercise)) continue;
          let j = i - 1;
          let pausa = 0;
          while (j >= 0 && piano[j]!.kind === 'rest') { pausa += (piano[j] as { seconds: number }).seconds; j -= 1; }
          const prima = j >= 0 ? piano[j]! : null;
          if (prima === null || prima.kind !== 'work' || !TRONCO.has(prima.exercise)) continue;
          giunzioni += 1;
          if (pausa < 15) violazioni.push(`S9: ${sess.id} sett. ${String(w)} ${prima.blockCode} ${prima.exercise} → ${p.blockCode} ${p.exercise} con ${String(pausa)}" di transizione`);
        }
      }
    }
    if (giunzioni === 0) violazioni.push('S9: nessuna giunzione tronco → balistico trovata: fixture da ripuntare, il controllo non ha misurato niente');
  }

  /* 4i — S10, approvata il 2026-11-12: un `tempoRespected` ricavato da una
     misura non è mai più permissivo della regola. Due metà, tutte e due
     eseguite: (1) engine — senza un «sì» la leva delle ripetizioni non è
     esaurita, quindi nessuna leva oltre le ripetizioni; (2) controllo statico
     del player guidato, come i casi 5 e 6a: ogni `setTempoRespected` scrive
     solo `false`. Se il player tornasse a scrivere «sì» da una misura, il
     controllo statico fallisce e va riscritto come misura (07-player-tempo). */
  {
    const block = findCircuitSession('circuito-3')!.blocks.find((b) => b.code === 'A2')!;
    const ex = getExercise('push-up');
    const ev = evaluateProgression({
      block, exercise: ex, state: stato('push-up', 2),
      logged: esercizio('A2', 'push-up', sets([18, 18, 18]), null, 2),
      range: resolveBlockRange(block, ex, VUOTO), week: 3, currentMaxReps: null,
      salita: { consentita: true, inizio: '2026-03-02', dal: '2026-03-16' }, rientro: null, aumentoRecente: null,
    });
    if (ev.suggestion !== null) violazioni.push(`S10: leva «${ev.suggestion.lever}» proposta senza nessun «sì» sul tempo`);
    const player = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
    const scritture = [...player.matchAll(/setTempoRespected\(([^;]*?)\)\s*[;:]/gs)].map((m) => m[1]!.replace(/\s+/g, ' '));
    const nonFalse = scritture.filter((a) => !/,\s*false\s*$/.test(a));
    if (scritture.length === 0) violazioni.push('S10: nessuna scrittura di tempoRespected trovata nel player guidato: controllo da riscrivere');
    if (nonFalse.length > 0) violazioni.push(`S10: il player guidato scrive tempoRespected con un valore diverso da false: ${nonFalse.join(' | ')}`);
  }

  /* 4j — R-7 (v10, 2026-11-20, rilascio B2): con un manubrio scelto e non ancora preso, il campo del peso lasciato
     com'è non alza mai un numero. Curl a martello circuito-1/B1, {12 kg, +2″, +2″} (esauriti), massimo chiuso il 19 con
     il tempo: la fine seduta propone il manubrio (accettato, registro con il sessionLogId del 19). Seduta del 23: il
     peso parte come lo compone PassoLavoro di GuidedSession (B del manubrio in attesa se c'è, se no lo stato; poi
     pesoIniziale con la volta scorsa), con la volta scorsa a 12 kg e a 0 kg (peso non scritto). Chiusura come
     GuidedSession.chiudi. Atteso: campo ≤ 12 kg e stato salvato ≤ 12 kg. Positivo: chi scrive il manubrio nuovo lo
     esegue (stato = T). La composizione del player si verifica in modo statico, come 4i: se non è né quella di
     0d85597 né quella di prima, il controllo va riscritto. */
  {
    const Dr = (await import('../../src/engine/draft.ts')) as Record<string, unknown>;
    const syncS = Dr['syncStatesFromLog'] as (x: LoggedSession, m: ReadonlyMap<ExerciseSlug, ExerciseState>) => ExerciseState[];
    const pesoI = Dr['pesoIniziale'] as ((a: boolean, b: number, c: number) => number) | undefined;
    const Dz = (await import('../../src/engine/decadenza.ts').catch(() => null)) as null | {
      manubrioInAttesa: (s: ExerciseSlug, r: readonly unknown[], x: readonly LoggedSession[], st: ExerciseState, id: string) => { B: number } | null;
      decadenze: (S0: LoggedSession, r: readonly unknown[], x: readonly LoggedSession[], m: ReadonlyMap<ExerciseSlug, ExerciseState>) => { stato: ExerciseState }[];
    };
    const player = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
    /* v17: la composizione con la guardia di B20, su sorgente senza commenti né spazi */
    const playerN = player.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1').replace(/\s+/g, '');
    const kgDVS = Dr['kgDellaVoltaScorsa'] as ((e: unknown, p: LoggedExercise | undefined, kg: number, l: LevelIndex | null) => number) | undefined;
    const conGuardia = kgDVS !== undefined && playerN.includes("useState(pesoIniziale(stazione?.esercizio.loadPolicy==='inherent',kgDalloStato,stazione===null?0:kgDellaVoltaScorsa(stazione.esercizio,passato,suggerito?.loadKg??0,contesto.states.get(stazione.esercizio.slug)?.level??stazione.gradino,),),)");
    const conAttesa = /const kgDalloStato =\s*contesto\.manubriInAttesa\.get\([^)]*\)\?\.B \?\?\s*contesto\.states\.get\([^)]*\)\?\.loadKg \?\?\s*0;/.test(player);
    const dalloStato = /const kgDalloStato = contesto\.states\.get\([^)]*\)\?\.loadKg \?\? 0;/.test(player);
    const conPesoI = /pesoIniziale\(stazione\?\.esercizio\.loadPolicy === 'inherent', kgDalloStato, suggerito\?\.loadKg \?\? 0\)/.test(player) || conGuardia;
    if (!(conAttesa || dalloStato) || !conPesoI || pesoI === undefined) violazioni.push('4j: composizione del peso nel player guidato non riconosciuta: controllo da riscrivere');
    else {
      const slug: ExerciseSlug = 'curl-martello-manubri';
      const block = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'B1')!;
      const ex = getExercise(slug);
      const max = (block.prescription as { max: number }).max;
      const prima: ExerciseState = { exercise: slug, level: null, loadKg: 12, eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 };
      const g19 = seduta('g19', 3, 'circuito-1', [esercizio('B1', slug, sets([max, max, max], { kg: 12 }), true, null)], null, '2026-03-19');
      const ev = evaluateProgression({
        block, exercise: ex, state: prima, logged: g19.exercises[0]!, range: resolveBlockRange(block, ex, VUOTO), week: 4, currentMaxReps: null,
        salita: { consentita: true, inizio: '2026-03-02', dal: '2026-03-16' }, rientro: null, aumentoRecente: null,
      });
      if (ev.suggestion?.lever !== 'load') violazioni.push(`4j: con tempo e pausa esauriti e il massimo chiuso il manubrio non è proposto («${String(ev.suggestion?.lever ?? ev.blockedReason)}»): la fixture non misura`);
      else {
        const T = ev.suggestion.nextState;
        const c = { id: 'c19', date: '2026-03-19', sessionLogId: 'g19', exercise: slug, blockCode: 'B1', lever: 'load', decision: 'accepted', stateBefore: prima, stateAfter: T };
        const chiudi = (kg: number): ExerciseState => {
          const s23: LoggedSession = { ...seduta('g23', 4, 'circuito-1', [esercizio('B1', slug, sets([max, max, max], { kg }), true, null)], null, '2026-03-23'), status: 'in-progress' };
          const tolte = Dz === null ? [] : Dz.decadenze(s23, [c], [g19], new Map([[slug, T]]));
          return tolte[0]?.stato ?? syncS(s23, new Map([[slug, T]])).find((x) => x.exercise === slug) ?? T;
        };
        for (const volta of [12, 0]) {
          const attesa = conAttesa && Dz !== null ? Dz.manubrioInAttesa(slug, [c], [g19], T, 'g23') : null;
          const voltaV = conGuardia ? kgDVS!(ex, esercizio('B1', slug, sets([max, max, max], { kg: volta }), true, null), volta, T.level ?? null) : volta;
          const kg = pesoI(true, attesa?.B ?? T.loadKg, voltaV);
          const salvato = chiudi(kg);
          if (kg > prima.loadKg) violazioni.push(`R-7 (4j): manubrio scelto (${String(prima.loadKg)} → ${String(T.loadKg)} kg) e non preso, volta scorsa ${String(volta)} kg: il campo del peso parte da ${String(kg)} kg`);
          if (salvato.loadKg > prima.loadKg) violazioni.push(`R-7 (4j): campo lasciato com'è (volta scorsa ${String(volta)} kg) → stato salvato a ${String(salvato.loadKg)} kg, sopra i ${String(prima.loadKg)} sollevati`);
        }
        if (chiudi(T.loadKg).loadKg !== T.loadKg) violazioni.push(`4j: positivo mancato: scritto il manubrio nuovo (${String(T.loadKg)} kg), lo stato salvato è ${String(chiudi(T.loadKg).loadKg)} kg: la fixture non misura`);
      }
    }
  }

  /* 4k — R-14 (v11, 2026-11-20, rilascio C): la revisione con la durata, come Home e Revisione (M22, T-25). Circuito 4
     sotto il tetto, military press {10, +1″, 0} e dip su panche al gradino 1 con i passi di tempo e di pausa oltre i 55′:
     con R19 in revisione arriva la leva dopo. Atteso: military press → manubrio successivo esatto 10 → 12 (S2 sui
     manubri, D-19 b), mai più di 2 kg; dip → niente zavorra con la variante aperta (S5). Se la military press non arriva
     al manubrio (per esempio la revisione dice ancora «tempo», come senza `durataDellaSedutaDi`) la fixture non misura e
     il controllo fallisce. */
  {
    const durataRev = (CircE as Record<string, unknown>)['durataDellaSedutaDi'] as ((x: ExerciseSlug, m: ReadonlyMap<ExerciseSlug, ExerciseState>) => number | null) | undefined;
    const C4 = findCircuitSession('circuito-4')!;
    const dur = (m: ReadonlyMap<ExerciseSlug, ExerciseState>): number => estimatedSeconds(buildGuidedPlan(C4, 1, m));
    const MPk = 'military-press-manubri' as ExerciseSlug; const DPk = 'dip-panche-piedi-rialzati' as ExerciseSlug;
    const giud = C4.blocks.filter((b) => b.excludeFromReview !== true);
    const bmax = (tut: string): { e: number; p: number } => { const f = tut.split('-'); return { e: f[0] === 'X' ? 0 : Math.max(0, 5 - Number(f[0])), p: f[1] === 'X' ? 0 : Math.max(0, 2 - Number(f[1])) }; };
    let seme = 20261120; const rnd = (): number => { seme = (Math.imul(seme, 1103515245) + 12345) >>> 0; return seme / 4294967296; };
    const piu1 = (m: Map<ExerciseSlug, ExerciseState>, x: ExerciseSlug, k: 'e' | 'p'): Map<ExerciseSlug, ExerciseState> => { const L = m.get(x)!; return new Map(m).set(x, k === 'e' ? { ...L, eccentricBonusSeconds: L.eccentricBonusSeconds + 1 } : { ...L, bottomPauseBonusSeconds: L.bottomPauseBonusSeconds + 1 }); };
    let statiK: Map<ExerciseSlug, ExerciseState> | null = null;
    for (let i = 0; i < 200000 && statiK === null; i += 1) {
      const m = new Map<ExerciseSlug, ExerciseState>();
      for (const b of C4.blocks) { const ex = getExercise(b.exercise); const bm = bmax(b.tut); const giudicato = giud.includes(b);
        m.set(ex.slug, { exercise: ex.slug, level: ex.defaultLevel, loadKg: ex.loadPolicy === 'inherent' ? 10 : 0, eccentricBonusSeconds: giudicato ? Math.floor(rnd() * (bm.e + 1)) : 0, bottomPauseBonusSeconds: giudicato ? Math.floor(rnd() * (bm.p + 1)) : 0 }); }
      m.set(MPk, { ...stato(MPk, null, 10), eccentricBonusSeconds: 1 });
      { const bm = bmax(C4.blocks.find((b) => b.exercise === DPk)!.tut); m.set(DPk, { ...stato(DPk, 1, 0), eccentricBonusSeconds: Math.floor(rnd() * bm.e), bottomPauseBonusSeconds: Math.floor(rnd() * bm.p) }); }
      if (dur(m) <= 3300 && dur(piu1(m, MPk, 'e')) > 3300 && dur(piu1(m, MPk, 'p')) > 3300 && dur(piu1(m, DPk, 'e')) > 3300 && dur(piu1(m, DPk, 'p')) > 3300) statiK = m;
    }
    if (statiK === null) violazioni.push('4k: stato del circuito 4 non costruito: la fixture non misura');
    else {
      const bDP = C4.blocks.find((b) => b.exercise === DPk)!; const pDP = bDP.prescription as { kind: string; max?: number };
      const maxDP = pDP.kind === 'reps' ? pDP.max! : 10;
      const voci = (liv: LevelIndex | null): LoggedExercise[] => [esercizio('A3', MPk, sets([15, 15, 15], { kg: 10, rir: 1 }), true, null), esercizio(bDP.code, DPk, sets([maxDP, maxDP, maxDP], { rir: 1 }), true, liv)];
      const storia = [seduta('k0', 1, 'circuito-4', voci(1), null, '2026-03-02'), seduta('k1', 3, 'circuito-4', voci(1), null, '2026-03-19'), seduta('k2', 4, 'circuito-4', voci(1), null, '2026-03-26')];
      const r = reviewWeek({ week: 4, sessions: storia, states: statiK, tests: VUOTO, weekEnd: fineSett(4), today: '2026-03-30', decisioni: [], ...(durataRev === undefined ? {} : { durata: durataRev }) } as Parameters<typeof reviewWeek>[0]);
      const vMP = r.verdicts.find((v) => v.exercise === MPk); const vDP = r.verdicts.find((v) => v.exercise === DPk);
      const amMP = r.alMassimo.find((a) => a.exercise === MPk); const amDP = r.alMassimo.find((a) => a.exercise === DPk);
      if (vMP?.kind !== 'aggiungi-peso') violazioni.push(`4k: circuito 4 a ${String(dur(statiK))} s, military press col passo di tempo oltre il tetto: la revisione non arriva al manubrio («${vMP?.kind ?? amMP?.motivo ?? 'niente'}»): la fixture non misura${durataRev === undefined ? ' (durataDellaSedutaDi assente)' : ''}`);
      else { const dk = vMP.stateAfter.loadKg - 10; if (vMP.stateAfter.loadKg !== 12 || dk > 2) violazioni.push(`S2 (4k): manubrio 10 → ${String(vMP.stateAfter.loadKg)} kg in revisione`); }
      if (vDP?.kind === 'aggiungi-peso') violazioni.push(`S5 (4k): dip su panche al gradino 1 con la variante aperta: zavorra 0 → ${String(vDP.stateAfter.loadKg)} kg`);
      if (vMP?.kind === 'aggiungi-peso' && amDP?.motivo !== 'variante') violazioni.push(`4k: dip su panche: atteso «variante» al massimo, è ${vDP?.kind ?? amDP?.motivo ?? 'niente'}: la fixture non misura`);
    }
  }

  /* 4l — R-17 (v12; **v13** 2026-11-21 sul `704dbfa`). Criterio 9.26 di training-designer: push-up dal test di
   * settimana 0 (M=10 → livello 1), sei chiusure allo stesso livello col repository vero (MemoryStore),
   * ritest di settimana 6 con M=16. Atteso (S1, S3, R9c): stesso livello; si sale solo dalle sedute.
   * v13: (a) la chiusura è quella dell'app (`chiusuraApp`), e i due gestori devono chiamare `statiDaFissare`
   * prima di `closeSession`; (b) la migrazione: storia chiusa con la chiusura di prima, poi
   * `fissaStatiMancanti` (R9c punto 2). Positivo: la chiusura di prima, senza migrazione, sale 1 → 2.
   * 4n — «Archivia» dalla Home (v13): una seduta rimasta aperta con serie, archiviata, diventa chiusa
   * (`saveSession({ ...entry, status: 'completed' })`) senza nessuno stato scritto: R9c punto 1 vale anche
   * lì. Si modella il gestore com'è nel sorgente; se il sorgente cambia la fixture lo dice e va rimisurata
   * nel browser (`23`). */
  {
    const pu = 'push-up' as ExerciseSlug;
    const prova = (date: string, week: number, value: number): TestResult =>
      ({ testId: 'push-up' as TestId, date, week, value, left: null, right: null }) as TestResult;
    const giro = async (modo: 'app' | 'prima' | 'migrazione'): Promise<[number | null, number | null] | null> => {
      const repo = new RepoMod13.ShadowRepository();
      await repo.saveTestResult(prova('2026-03-02', 0, 10));
      const s0 = await repo.getExerciseState(pu);
      for (let w = 1; w <= 6; w += 1) {
        await chiusuraApp(repo, seduta(`l-${String(w)}`, w, 'circuito-3', [esercizio('A2', pu, sets([12, 12]), null, s0.level)]), modo === 'app');
      }
      if (modo === 'migrazione') {
        if (repo.fissaStatiMancanti === undefined) return null;
        await repo.fissaStatiMancanti();
      }
      await repo.saveTestResult(prova('2026-04-13', 6, 16));
      return [s0.level, (await repo.getExerciseState(pu)).level];
    };
    const prima = await giro('prima');
    if (prima === null || prima[0] === prima[1]) violazioni.push(`4l: positivo mancato, la chiusura di prima non sale (${JSON.stringify(prima)}): la fixture non misura`);
    if (DraftMod13.statiDaFissare === undefined) {
      violazioni.push(`S1/S3 (4l, R-17): \`statiDaFissare\` assente, la chiusura salva solo gli stati cambiati: push-up ${String(prima?.[0])} → ${String(prima?.[1])} dopo un ritest migliore, senza R5 né R7`);
    } else {
      for (const [file, inizio] of [['src/ui/session/GuidedSession.tsx', 'const chiudi = (): void => {'], ['src/ui/session/SessionScreen.tsx', 'const saveAndExit = (): void => {']] as const) {
        const c = gestoreChiama(file, inizio, 'statiDaFissare(');
        if (c !== true) violazioni.push(`4l: ${file} ${c === null ? 'senza il gestore atteso' : 'non chiama `statiDaFissare` prima di `closeSession`'}: la chiusura modellata non è quella dell'app`);
      }
      const app = await giro('app');
      if (app !== null && app[0] !== app[1]) violazioni.push(`S1/S3 (4l, R-17): chiusura come l'app, push-up ${String(app[0])} → ${String(app[1])} dopo un ritest migliore`);
    }
    const mig = await giro('migrazione');
    if (mig === null) violazioni.push('S1/S3 (4l, R-17, R9c punto 2): `fissaStatiMancanti` assente, la storia chiusa prima resta virtuale');
    else if (mig[0] !== mig[1]) violazioni.push(`S1/S3 (4l, R9c punto 2): dopo la migrazione push-up ${String(mig[0])} → ${String(mig[1])} dopo un ritest migliore`);
    /* v14 (c): la migrazione arriva DOPO il ritest (la domanda aperta del 2026-11-21c; cc95fac). Atteso: lo
     * stato fissato è quello del giorno dell'ultima seduta, non quello che il ritest ha già alzato. */
    {
      const repo = new RepoMod13.ShadowRepository();
      await repo.saveTestResult(prova('2026-03-02', 0, 10));
      const s0 = await repo.getExerciseState(pu);
      for (let w = 1; w <= 6; w += 1) await chiusuraApp(repo, seduta(`lt-${String(w)}`, w, 'circuito-3', [esercizio('A2', pu, sets([12, 12]), null, s0.level)]), false);
      await repo.saveTestResult(prova('2026-04-13', 6, 16));
      const virtuale = (await repo.getExerciseState(pu)).level;
      if (repo.fissaStatiMancanti !== undefined) {
        await repo.fissaStatiMancanti();
        const fissato = (await repo.getExerciseState(pu)).level;
        if (virtuale === s0.level) violazioni.push(`4l (c): prima della migrazione il ritest non alza (${String(virtuale)}): la fixture non misura`);
        else if (fissato !== s0.level) violazioni.push(`S1/S3 (4l c, R9c punto 2): migrazione arrivata dopo un ritest migliore, push-up fissato a ${String(fissato)} invece di ${String(s0.level)}`);
      }
    }
    /* v15 (d): T-39, 9.31. Trazioni, test del 03-01 M=4 (→ 1), ritest M=9 (→ 3) lo stesso giorno dell'ultima
     * seduta (04-11), prima o dopo di lei; storia mai salvata, fissata con «Archivia» o con la migrazione.
     * S1/S3: lo stato fissato non supera il gradino fatto quel giorno. Ritest DOPO la seduta (fatta al 1):
     * atteso 1. Ritest PRIMA (la seduta è al gradino che il test del giorno dà, 3): atteso ≤ 3 (T-39 dà 1,
     * L44). Controllo 9.37: senza un test prima, quello del giorno (M=8 → 3). */
    {
      const tz = 'trazioni-prona-presa-media' as ExerciseSlug;
      const pt = (date: string, week: number, value: number): TestResult => ({ testId: 'pull-up' as TestId, date, week, value, left: null, right: null }) as TestResult;
      for (const via of ['archivia', 'migrazione'] as const) for (const ordine of ['prima', 'dopo'] as const) for (const [M0, M1, data, atteso] of [[4, 9, '2026-04-11', 1], [null, 8, '2026-03-01', 3]] as const) {
        /* 9.37 solo con il test prima della seduta: senza nessun test il programma non si apre (R4 punto 2) */
        if (M0 === null && ordine === 'dopo') continue;
        const repo = new RepoMod13.ShadowRepository();
        if (via === 'archivia' ? repo.archiviaSeduta === undefined : repo.fissaStatiMancanti === undefined) { violazioni.push(`4l (d): ${via} assente`); continue; }
        if (M0 !== null) await repo.saveTestResult(pt('2026-03-01', 0, M0));
        if (ordine === 'prima') await repo.saveTestResult(pt(data, data === '2026-03-01' ? 0 : 6, M1));
        const L = (await repo.getExerciseState(tz)).level;
        const sed = seduta('ld', data === '2026-03-01' ? 1 : 6, 'circuito-1', [esercizio('A1', tz, sets([6, 6, 6]), true, L)], null, data);
        if (via === 'migrazione') await repo.saveSession(sed); else await repo.saveSession({ ...sed, status: 'in-progress' } as LoggedSession);
        if (ordine === 'dopo') await repo.saveTestResult(pt(data, data === '2026-03-01' ? 0 : 6, M1));
        if (via === 'migrazione') await repo.fissaStatiMancanti!(); else await repo.archiviaSeduta!({ ...sed, status: 'in-progress' } as LoggedSession);
        const fissato = (await repo.getExerciseState(tz)).level;
        const ok = M0 !== null && ordine === 'prima' ? fissato !== null && L !== null && fissato <= L : fissato === atteso;
        if (!ok) violazioni.push(`${M0 === null ? '4l (d, 9.37)' : 'S1/S3 (4l d, T-39 9.31)'}: ${via}, ritest del ${data} M=${String(M1)} ${ordine} la seduta${M0 === null ? '' : `, test di prima M=${String(M0)}`}: trazioni fissate a ${String(fissato)}, seduta al ${String(L)}, atteso ${M0 !== null && ordine === 'prima' ? `≤ ${String(L)}` : String(atteso)}`);
      }
    }

    /* 4n — «Archivia» (v14): il gestore com'è nel sorgente. `repository.archiviaSeduta` (cc95fac) si esegue
     * per quello che è; il gestore di prima (`saveSession` completed) resta come positivo. (i) archiviata e poi
     * ritest migliore; (ii) ritest migliore fra l'apertura e l'archiviazione: lo stato fissato è quello del
     * giorno della seduta. */
    const home = readFileSync('src/ui/screens/HomeScreen.tsx', 'utf8');
    const iA = home.search(/>\s*Archivia\s*<\/Button>/);
    const gestore = iA < 0 ? '' : home.slice(home.lastIndexOf('onClick', iA), iA);
    const noto = "void repository.saveSession({ ...entry, status: 'completed' });";
    const vecchio = gestore.includes(noto) && !/statiDaFissare|fissaStati|syncStatesFromLog|archiviaSeduta/.test(gestore);
    const nuovoG = /repository\.archiviaSeduta\(\s*entry\s*\)/.test(gestore) && !gestore.includes('saveSession(');
    const giroN = async (modo: 'app' | 'prima', ritestPrima: boolean): Promise<[number | null, number | null, string]> => {
      const repo = new RepoMod13.ShadowRepository();
      await repo.saveTestResult(prova('2026-03-02', 0, 10));
      const s0 = await repo.getExerciseState(pu);
      const aperta = { ...seduta('n-1', 1, 'circuito-3', [esercizio('A2', pu, sets([12, 12]), null, s0.level)]), status: 'in-progress' } as LoggedSession;
      await repo.saveSession(aperta);
      if (ritestPrima) await repo.saveTestResult(prova('2026-04-13', 6, 16));
      if (modo === 'app' && repo.archiviaSeduta !== undefined) await repo.archiviaSeduta(aperta);
      else await repo.saveSession({ ...aperta, status: 'completed' });
      if (!ritestPrima) await repo.saveTestResult(prova('2026-04-13', 6, 16));
      const salvata = repo.getSession === undefined ? undefined : await repo.getSession('n-1');
      return [s0.level, (await repo.getExerciseState(pu)).level, salvata?.status ?? '?'];
    };
    if (iA < 0) violazioni.push('4n: «Archivia» non trovato in HomeScreen: la fixture non misura');
    else if (vecchio) {
      const [a, b] = await giroN('prima', false);
      if (a !== b) violazioni.push(`S1/S3 (4n, R-17 per «Archivia»): seduta rimasta aperta e archiviata dalla Home, nessuno stato scritto; push-up ${String(a)} → ${String(b)} dopo un ritest migliore`);
    } else if (!nuovoG || (RepoMod13.ShadowRepository.prototype as Partial<Repo13>).archiviaSeduta === undefined) {
      violazioni.push('4n: il gestore di «Archivia» non è né quello di prima né `repository.archiviaSeduta(entry)`: modello da aggiornare e da rimisurare nel browser (`23`)');
    } else {
      const pos = await giroN('prima', false);
      if (pos[0] === pos[1]) violazioni.push(`4n: positivo mancato, il gestore di prima non sale (${String(pos[0])} → ${String(pos[1])}): la fixture non misura`);
      for (const [ritestPrima, nome] of [[false, 'archiviata e poi ritest'], [true, 'ritest prima dell’archiviazione']] as const) {
        const [a, b, st] = await giroN('app', ritestPrima);
        if (a !== b) violazioni.push(`S1/S3 (4n, ${nome}): «Archivia» come l'app, push-up ${String(a)} → ${String(b)} dopo un ritest migliore`);
        if (st !== 'completed' && st !== '?') violazioni.push(`4n (${nome}): seduta archiviata con stato «${st}»`);
      }
    }

    /* 4o — B18 (S5, v14): scendendo di gradino la zavorra si toglie. `scendi-di-livello` dal 6 con 5 kg
     * (tempo e pausa +2″), due sedute della settimana 2 da 3-3-3; trazioni e dip. Atteso: gradino 5, 0 kg, e il
     * testo lo dice. Controllo: a 0 kg stesso verdetto, 0 kg, il testo non nomina la zavorra. R9b dal 6 con 5
     * kg (9.20): 0 kg e lo stesso testo. Se il verdetto non è `scendi-di-livello` la fixture non misura. */
    {
      for (const [slug, testId, code, sid] of [['trazioni-prona-presa-media', 'pull-up', 'A1', 'circuito-1'], ['dip-parallele-anelli', 'dip', 'A3', 'circuito-1']] as const) {
        for (const kg of [5, 0]) {
          const st: ExerciseState = { ...stato(slug as ExerciseSlug, 6 as LevelIndex, kg), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 };
          const coppia = [0, 2].map((d) => seduta(`o-${String(d)}`, 2, sid, [esercizio(code, slug as ExerciseSlug, sets([3, 3, 3], { kg }), true, 6 as LevelIndex)], null, piu('2026-03-11', d)));
          const tests = new Map([[testId as TestId, { testId: testId as TestId, date: '2026-02-23', week: 0, value: 12 } as TestResult]]);
          const v = revisione(2, coppia, new Map([[slug as ExerciseSlug, st]]), tests).verdicts.find((x) => x.exercise === slug);
          if (v?.kind !== 'scendi-di-livello') { violazioni.push(`4o: ${slug} al 6 con ${String(kg)} kg, 3-3-3 ×2: verdetto «${v?.kind ?? 'nessuno'}»: la fixture non misura`); continue; }
          const nomina = /zavorra/i.test(v.change);
          if (v.stateAfter.loadKg !== 0) violazioni.push(`S5 (4o, B18): ${slug} «scendi di livello» 6 → ${String(v.stateAfter.level)} con ${String(v.stateAfter.loadKg)} kg (sotto l'ultimo gradino la zavorra non sta)`);
          if (kg > 0 && !nomina) violazioni.push(`S5 (4o, B18): ${slug} 6 → ${String(v.stateAfter.level)}, la zavorra si toglie ma il testo non lo dice («${v.change}»)`);
          if (kg === 0 && nomina) violazioni.push(`4o: ${slug} a 0 kg, il testo nomina la zavorra («${v.change}»)`);
        }
      }
      let Rt: { propostaRitest?: (slug: ExerciseSlug, stato: ExerciseState, r: TestResult) => Proposta14 | null } = {};
      try { Rt = (await import('../../src/engine/ritest.ts')) as typeof Rt; } catch { Rt = {}; }
      if (Rt.propostaRitest !== undefined) {
        const tz = 'trazioni-prona-presa-media' as ExerciseSlug;
        const p = Rt.propostaRitest(tz, { ...stato(tz, 6 as LevelIndex, 5), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 }, { testId: 'pull-up' as TestId, date: '2026-04-13', week: 6, value: 5 } as TestResult);
        if (p === null) violazioni.push('S7 (4o, R9b 9.20): trazioni al 6 con 5 kg, ritest 5 < 8: nessuna proposta');
        else if (p.verdict.stateAfter.loadKg !== 0 || !/zavorra/i.test(p.verdict.change)) violazioni.push(`S5 (4o, R9b 9.20): proposta 6 → ${String(p.verdict.stateAfter.level)} con ${String(p.verdict.stateAfter.loadKg)} kg, testo «${p.verdict.change}»`);
      }
      /* v15 (R23, T-38; S5): ogni cambio di gradino che l'app propone o esegue porta la zavorra a 0 sugli
       * `allowed`, e il testo lo dice. (iii) `sali-di-livello` trazioni 3 → 4 con 5 kg scritti (23.3); (iv) 5 → 6
       * con 5 kg, «riparte da zero» (23.4); (v) la leva variante a fine seduta, trazioni al 3 con 5 kg e tempo e
       * pausa al massimo (23.5); (vi) la chiusura con un gradino scritto nel diario diverso dallo stato, 6 → 5 con
       * 5 kg e +2″/+2″ (23.7, `syncStatesFromLog`). A 0 kg nessun testo nomina la zavorra. Prima seduta al
       * gradino il 03-02 (R7 aperta). Verdetto o leva diversi ⇒ la fixture non misura. Il `VariantPicker` di
       * `SessionScreen` (L42) è in (vii), da v16. */
      {
        const tz = 'trazioni-prona-presa-media' as ExerciseSlug;
        const PULL = new Map([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 } as TestResult]]);
        const PMv = (await import('../../src/engine/progression.ts')) as unknown as { MAX_ECCENTRIC_SECONDS: number; MAX_ISO_PAUSE_SECONDS: number };
        for (const [L, atteso, frase] of [[3, 4, /la zavorra si toglie/], [5, 6, /la zavorra riparte da zero/]] as const) {
          for (const kg of [5, 0]) {
            const sed = [seduta('o3-0', 1, 'circuito-1', [esercizio('A1', tz, sets([6, 6, 6], { kg }), true, L as LevelIndex)], null, '2026-03-02'),
              ...['2026-03-11', '2026-03-18'].map((d, i) => seduta(`o3-${String(i + 1)}`, 2 + i, 'circuito-1', [esercizio('A1', tz, sets([9, 9, 9], { kg }), true, L as LevelIndex)], null, d))];
            const v = revisione(3, sed, new Map([[tz, stato(tz, L as LevelIndex, kg)]]), PULL).verdicts.find((x) => x.exercise === tz);
            if (v?.kind !== 'sali-di-livello' || v.stateAfter.level !== atteso) { violazioni.push(`4o (v15): trazioni al ${String(L)} con ${String(kg)} kg, 9-9-9 ×2: verdetto «${v?.kind ?? 'nessuno'}»: la fixture non misura`); continue; }
            if (v.stateAfter.loadKg !== 0) violazioni.push(`S5 (4o, R23 23.${L === 3 ? '3' : '4'}): «sali di livello» ${String(L)} → ${String(atteso)} con ${String(v.stateAfter.loadKg)} kg (la zavorra scritta a mano non segue il gradino nuovo)`);
            if (kg > 0 && !frase.test(v.change)) violazioni.push(`S5 (4o, R23): ${String(L)} → ${String(atteso)} con la zavorra tolta, testo senza la clausola («${v.change}»)`);
            if (kg === 0 && /zavorra/i.test(v.change)) violazioni.push(`4o (v15): a 0 kg il testo della salita nomina la zavorra («${v.change}»)`);
          }
        }
        const blk = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'A1')!;
        for (const kg of [5, 0]) {
          const bozza = seduta('o5', 4, 'circuito-1', [esercizio('A1', tz, sets([9, 9, 9], { kg }), true, 3 as LevelIndex)], null, '2026-03-24');
          const ev = evaluateProgression({ block: blk, exercise: getExercise(tz), state: { ...stato(tz, 3 as LevelIndex, kg), eccentricBonusSeconds: PMv.MAX_ECCENTRIC_SECONDS, bottomPauseBonusSeconds: PMv.MAX_ISO_PAUSE_SECONDS }, logged: bozza.exercises[0]!, range: resolveBlockRange(blk, getExercise(tz), PULL), week: 4, currentMaxReps: 12,
            salita: salitaConsentita(tz, 3 as LevelIndex, [seduta('o5-0', 1, 'circuito-1', [esercizio('A1', tz, sets([6, 6, 6], { kg }), true, 3 as LevelIndex)], null, '2026-03-02')], '2026-03-24', { ...bozza, status: 'in-progress' }), rientro: null, aumentoRecente: null });
          const sg = ev.suggestion;
          if (sg === null || sg.lever !== 'variant') { violazioni.push(`4o (v15, 23.5): fine seduta trazioni al 3 con ${String(kg)} kg: leva «${sg?.lever ?? 'nessuna'}»: la fixture non misura`); continue; }
          if (sg.nextState.loadKg !== 0) violazioni.push(`S5 (4o, R23 23.5): leva variante a fine seduta 3 → ${String(sg.nextState.level)} con ${String(sg.nextState.loadKg)} kg`);
          if (kg > 0 && !/la zavorra si toglie/.test(sg.change)) violazioni.push(`S5 (4o, R23 23.5): leva variante con la zavorra tolta, testo senza la clausola («${sg.change}»)`);
          if (kg === 0 && /zavorra/i.test(sg.change)) violazioni.push(`4o (v15): a 0 kg la leva variante nomina la zavorra («${sg.change}»)`);
        }
        const scritto = seduta('o7', 4, 'circuito-1', [esercizio('A1', tz, sets([6, 6, 6], { kg: 5 }), true, 5 as LevelIndex)], null, '2026-03-24');
        const dopo = DraftMod13.syncStatesFromLog(scritto, new Map([[tz, { ...stato(tz, 6 as LevelIndex, 5), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 }]])).find((x) => x.exercise === tz);
        if (dopo === undefined || dopo.level !== 5) violazioni.push(`4o (v15, 23.7): gradino scritto 5 su uno stato al 6: chiusura ${JSON.stringify(dopo ?? null)}: la fixture non misura`);
        else if (dopo.loadKg !== 0 || dopo.eccentricBonusSeconds !== 0 || dopo.bottomPauseBonusSeconds !== 0) violazioni.push(`S5 (4o, R23 23.7): gradino scritto 5 su uno stato al 6 con 5 kg e +2″/+2″ → {${String(dopo.level)}, ${String(dopo.loadKg)} kg, +${String(dopo.eccentricBonusSeconds)}″/+${String(dopo.bottomPauseBonusSeconds)}″}`);
        /* v16 (2026-11-21g, `3c4a8d7`): (vii) il selettore di `SessionScreen` (L42): lo handler si legge in modo
         * statico; con `statoDopoCambioAMano` si chiama la funzione, con `{ ...stato, level }` (prima di 3c4a8d7)
         * si modella, altrimenti il controllo va riscritto. Atteso: gradino diverso ⇒ tempo, pausa e zavorra a 0
         * (D-23, R23); stesso gradino o solo etichetta ⇒ invariato. (viii) il peso precompilato dopo un cambio a
         * 0 kg: stato {5, 0 kg} (come esce da i, vi e vii), la volta scorsa al 6 con 5 kg nello stesso blocco.
         * Player guidato (`pesoIniziale`, composizione come 4j) e `SessionScreen` (`kgDalloStato > 0 ? … :
         * kgDalLog`); serie lasciate col peso proposto, poi la chiusura. Atteso: campo a 0 kg e stato {5, 0 kg}
         * (limiti 1.6: sotto il 6 nessun kg proposto). Positivi: volta scorsa a 0 kg ⇒ 0; al 6 con 7,5 kg
         * accettati ⇒ 7,5 (A18). Composizione non riconosciuta ⇒ controllo da riscrivere. */
        {
          const Dv = (await import('../../src/engine/draft.ts')) as unknown as {
            statoDopoCambioAMano?: (e: unknown, s: ExerciseState, l: LevelIndex | null) => ExerciseState;
            pesoIniziale?: (i: boolean, a: number, b: number) => number;
            lastLoggedByBlock: (s: readonly LoggedSession[], id: string, ex: string, o?: ReadonlyMap<string, ExerciseSlug>) => ReadonlyMap<string, LoggedExercise>;
            suggestedSetValue: (p: LoggedExercise | undefined, i: number, side: null) => LoggedSet | undefined;
            statesToSave: (x: readonly ExerciseState[], a: ReadonlyMap<ExerciseSlug, ExerciseState>) => ExerciseState[];
          };
          const q = (x: ExerciseState | undefined | null): string => (x == null ? 'null' : `{${String(x.level)}, ${String(x.loadKg)} kg, +${String(x.eccentricBonusSeconds)}″/+${String(x.bottomPauseBonusSeconds)}″}`);
          const ssx = readFileSync('src/ui/session/SessionScreen.tsx', 'utf8');
          const h = (/onChange=\{\(level, label\) => \{[\s\S]*?confirmExercise\(([^;]*)\);/.exec(ssx)?.[1] ?? '').trim();
          const hN = h === 'statoDopoCambioAMano(exercise, exerciseState, level)' && Dv.statoDopoCambioAMano !== undefined
            && /const exercise = getExercise\(block\.exercise\);/.test(ssx) && /const exerciseState = states\.get\(block\.exercise\);/.test(ssx);
          const hV = h === '{ ...exerciseState, level: level ?? exerciseState.level }';
          const ex = getExercise(tz);
          if (!hN && !hV) violazioni.push(`4o (vii): handler del VariantPicker non riconosciuto («${h}»): controllo da riscrivere`);
          else {
            const pk = (s: ExerciseState, l: LevelIndex | null): ExerciseState => (hN ? Dv.statoDopoCambioAMano!(ex, s, l) : { ...s, level: l ?? s.level });
            const z = (l: number): string => `{${String(l)}, 0 kg, +0″/+0″}`;
            for (const [prima, l] of [[{ ...stato(tz, 6 as LevelIndex, 5), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 }, 5], [{ ...stato(tz, 6 as LevelIndex, 0), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 }, 5], [stato(tz, 3 as LevelIndex, 5), 4], [stato(tz, 5 as LevelIndex, 5), 6]] as const) {
              const d = pk(prima, l as LevelIndex);
              if (q(d) !== z(l)) violazioni.push(`${prima.loadKg > 0 ? 'S5' : 'D-23'} (4o vii, R23, L42): selettore ${q(prima)} → ${String(l)} salva ${q(d)} (atteso ${z(l)})`);
            }
            const fermo = { ...stato(tz, 6 as LevelIndex, 5), eccentricBonusSeconds: 2, bottomPauseBonusSeconds: 2 };
            if (q(pk(fermo, 6 as LevelIndex)) !== q(fermo) || q(pk(fermo, null)) !== q(fermo)) violazioni.push(`4o (vii): selettore sullo stesso gradino o solo etichetta: ${q(pk(fermo, 6 as LevelIndex))} / ${q(pk(fermo, null))} (atteso ${q(fermo)}): la fixture non misura`);
          }
          const gsx = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
          const cGv = (/const kgDalloStato =\s*contesto\.manubriInAttesa\.get\([^)]*\)\?\.B \?\?\s*contesto\.states\.get\([^)]*\)\?\.loadKg \?\?\s*0;/.test(gsx) || /const kgDalloStato = contesto\.states\.get\([^)]*\)\?\.loadKg \?\? 0;/.test(gsx))
            && /pesoIniziale\(stazione\?\.esercizio\.loadPolicy === 'inherent', kgDalloStato, suggerito\?\.loadKg \?\? 0\)/.test(gsx)
            && /const suggerito = suggestedSetValue\(passato, step\.step\.setIndex, perSide \? 'left' : null\);/.test(gsx) && Dv.pesoIniziale !== undefined;
          const cSv = /const kgDalLog = suggestedSetValue\(past, step\.setIndex, step\.perSide \? 'left' : null\)\?\.loadKg \?\? 0;/.test(ssx)
            && /const kgDalloStato = exerciseState\?\.loadKg \?\? 0;/.test(ssx) && /loadKg: kgDalloStato > 0 \? kgDalloStato : kgDalLog,/.test(ssx);
          /* v17: la composizione con la guardia di B20 (`kgDellaVoltaScorsa`), su sorgente senza commenti né spazi */
          const nz = (x: string): string => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1').replace(/\s+/g, '');
          const ssN = nz(ssx);
          const gsN = nz(gsx);
          const DVS = (Dv as unknown as { kgDellaVoltaScorsa?: (e: unknown, p: LoggedExercise | undefined, kg: number, l: LevelIndex | null) => number }).kgDellaVoltaScorsa;
          const gN = DVS !== undefined && /const kgDalloStato =\s*contesto\.manubriInAttesa\.get\([^)]*\)\?\.B \?\?\s*contesto\.states\.get\([^)]*\)\?\.loadKg \?\?\s*0;/.test(gsx)
            && /const suggerito = suggestedSetValue\(passato, step\.step\.setIndex, perSide \? 'left' : null\);/.test(gsx) && Dv.pesoIniziale !== undefined
            && gsN.includes("useState(pesoIniziale(stazione?.esercizio.loadPolicy==='inherent',kgDalloStato,stazione===null?0:kgDellaVoltaScorsa(stazione.esercizio,passato,suggerito?.loadKg??0,contesto.states.get(stazione.esercizio.slug)?.level??stazione.gradino,),),)");
          const sN = DVS !== undefined && ssN.includes("constkgDalLog=kgDellaVoltaScorsa(exercise,past,suggestedSetValue(past,step.setIndex,step.perSide?'left':null)?.loadKg??0,exerciseState?.level??null,);")
            && ssN.includes('constpast=previous.get(block.code);') && ssN.includes('constkgDalloStato=exerciseState?.loadKg??0;') && ssN.includes('loadKg:kgDalloStato>0?kgDalloStato:kgDalLog,');
          const cS = cSv || sN;
          const cG = cGv || gN;
          if (!cG || !cS) violazioni.push(`4o (viii): composizione del peso non riconosciuta (player guidato ${String(cG)}, SessionScreen ${String(cS)}): controllo da riscrivere`);
          else {
            const oggiC1 = new Map(findCircuitSession('circuito-1')!.blocks.map((b) => [b.code, b.exercise as ExerciseSlug]));
            const volta = (kg: number) => Dv.lastLoggedByBlock([seduta('o8p', 3, 'circuito-1', [esercizio('A1', tz, sets([5, 5, 5], { kg }), true, 6 as LevelIndex)], null, '2026-03-17')], 'circuito-1', 'o8', oggiC1).get('A1');
            const kgV = (kg: number): number => Dv.suggestedSetValue(volta(kg), 1, null)?.loadKg ?? 0;
            const dopo = stato(tz, 5 as LevelIndex, 0);
            const ex8 = getExercise(tz);
            /* v17: il campo come lo compone ciascun player, con la guardia se c'è (gradino di oggi: quello dello stato) */
            const campoG = (s: ExerciseState, kg: number): number => Dv.pesoIniziale!(false, s.loadKg, gN ? DVS!(ex8, volta(kg), kgV(kg), s.level) : kgV(kg));
            const campoS = (s: ExerciseState, kg: number): number => (s.loadKg > 0 ? s.loadKg : sN ? DVS!(ex8, volta(kg), kgV(kg), s.level ?? null) : kgV(kg));
            for (const [chi, campo] of [['player guidato', campoG(dopo, 5)], ['SessionScreen', campoS(dopo, 5)]] as const) {
              const chiusa = seduta('o8', 4, 'circuito-1', [esercizio('A1', tz, sets([6, 6, 6], { kg: campo }), true, 5 as LevelIndex)], null, '2026-03-24');
              const fin = Dv.statesToSave(DraftMod13.syncStatesFromLog(chiusa, new Map([[tz, dopo]])), new Map()).find((x) => x.exercise === tz) ?? dopo;
              if (campo !== 0 || fin.loadKg !== 0) violazioni.push(`S5 (4o viii, R23): ${chi}, stato ${q(dopo)} dopo un cambio di gradino, la volta scorsa al 6 con 5 kg: campo Peso ${String(campo)} kg, serie lasciate così, chiusura ${q(fin)} (atteso 0 kg e ${q(dopo)})`);
            }
            if (campoG(dopo, 0) !== 0 || campoS(dopo, 0) !== 0) violazioni.push('4o (viii): positivo mancato, volta scorsa a 0 kg e stato a 0: campo diverso da 0: la fixture non misura');
            const al6 = stato(tz, 6 as LevelIndex, 7.5);
            if (campoG(al6, 5) !== 7.5 || campoS(al6, 5) !== 7.5) violazioni.push('4o (viii): positivo mancato, al 6 con 7,5 kg accettati il campo non parte dallo stato (A18): la fixture non misura');
            /* v17: allo stesso gradino la volta scorsa arriva al campo (al 6, stato a 0 kg, la volta scorsa al 6 con 5 kg) */
            const fermo6 = stato(tz, 6 as LevelIndex, 0);
            if (campoG(fermo6, 5) !== 5 || campoS(fermo6, 5) !== 5) violazioni.push(`4o (viii, v17): positivo mancato, allo stesso gradino (6) la volta scorsa con 5 kg non arriva al campo (${String(campoG(fermo6, 5))} / ${String(campoS(fermo6, 5))}): la fixture non misura`);
          }
        }
      }
    }
  }

  /* 4m — R-16 (v12, 2026-11-21): un ritest non riscrive la data di inizio (T-28). Con la data riscritta la
   * settimana torna a 0-1 e gli id `revisione-<W>:<slug>` si ripetono: un verdetto nuovo, anche una discesa,
   * sparisce dietro una decisione vecchia. Qui la funzione pura; il collegamento nel browser lo misura `20`. */
  {
    const Sc = (await import('../../src/engine/schedule.ts')) as unknown as {
      chiusuraDelGiro?: (d: string | null, m: number, s: string) => { attivo: boolean; dataDaScrivere: string | null; chiediInizio: boolean } };
    if (Sc.chiusuraDelGiro === undefined) {
      violazioni.push('4m (R-16): `chiusuraDelGiro` assente: il riepilogo di un ritest riscrive la data di inizio (misurato da `20` nel browser)');
    } else {
      for (const m of [0, 3]) {
        const r = Sc.chiusuraDelGiro('2026-10-05', m, '2026-11-23');
        if (r.dataDaScrivere !== null || !r.attivo || r.chiediInizio) violazioni.push(`4m (R-16): ritest con ${String(m)} test mancanti: ${JSON.stringify(r)}`);
      }
      const primo = Sc.chiusuraDelGiro(null, 0, '2026-11-23');
      if (primo.dataDaScrivere !== '2026-11-23' || !primo.chiediInizio) violazioni.push(`4m: il primo giro non fissa più la data: ${JSON.stringify(primo)}`);
    }
  }

  registra('4', 'Progressione entro le soglie',
    violazioni.length === 0 ? 'PASS' : 'FALLITO',
    violazioni.length === 0 ? 'nessuna soglia superata' : `${String(violazioni.length)} soglie superate → ${violazioni.join(' | ')}`);
}

/* ====================================================================== */
/* CASO 5 — nessuna diagnosi e nessuna indicazione su farmaci nei testi   */
/* ====================================================================== */
{
  const VIETATI = /diagnos|patolog|farmac|antinfiammator|ibuprofen|tachipirin|cortison|integrator|terapi[ae]|guarig|è solo un[a]? (contrattura|stiramento)|non è niente|posolog/i;
  const colpi: string[] = [];
  for (const f of [...fileTesto('src/ui', ['.ts', '.tsx']), ...fileTesto('src/data', ['.ts'])]) {
    const righe = readFileSync(f, 'utf8').split('\n');
    righe.forEach((riga, i) => {
      if (VIETATI.test(riga)) colpi.push(`${f}:${String(i + 1)} ${riga.trim().slice(0, 90)}`);
    });
  }
  registra('5', 'Nessuna diagnosi o indicazione su farmaci nei testi dell’app',
    colpi.length === 0 ? 'PASS' : 'FALLITO',
    colpi.length === 0 ? 'nessuna occorrenza in src/ui e src/data' : colpi.join(' | '));
}

/* ====================================================================== */
/* CASO 6 — nessuna immagine fuori libreria, nessuna generata a runtime   */
/* ====================================================================== */
{
  const problemi: string[] = [];
  const RUNTIME = /toDataURL|new Blob\([^)]*image|document\.createElement\('canvas'\)|fetch\((['"`])https?:\/\/[^'"`]*\.(svg|png|webp|jpg)/i;
  const REMOTO = /(src|href)\s*=\s*['"`]https?:\/\/[^'"`]*\.(svg|png|webp|jpg)/i;
  for (const f of fileTesto('src', ['.ts', '.tsx'])) {
    const testo = readFileSync(f, 'utf8');
    if (RUNTIME.test(testo)) problemi.push(`${f}: possibile generazione di immagine a runtime`);
    if (REMOTO.test(testo)) problemi.push(`${f}: immagine da URL remoto`);
  }
  /*
   * Il caso ha due metà. 6a «nessuna generata a runtime»: ricerca nel codice.
   * 6b «solo immagini approvate da Alessio»: dalla v5 si esegue su
   * `media/LIBRARY.md`, il registro di exercise-media-lead (una riga per
   * immagine, stato `approvata` riservato ad Alessio). Esisteva dal
   * 2026-11-08 (commit e204805) e fino alla v4 questo caso diceva che il
   * registro non c'era: era una mia lettura ferma, non un limite del prodotto.
   * Un file in src/assets entra nel bundle (import.meta.glob), quindi è servito.
   */
  const righe = readFileSync('media/LIBRARY.md', 'utf8').split('\n').filter((r) => r.startsWith('| ') && r.includes('src/assets/'));
  const stati = new Map<string, string[]>();
  for (const r of righe) {
    const c = r.split('|').map((x) => x.trim());
    const file = c[6] ?? '';
    const stato = c[5] ?? '';
    stati.set(file, [...(stati.get(file) ?? []), stato]);
  }
  const serviti: string[] = [];
  for (const d of ['exercises', 'steps', 'exercises-repdb']) {
    for (const f of readdirSync(join('src/assets', d))) {
      if (/\.(svg|webp|png|jpg)$/i.test(f)) serviti.push(`src/assets/${d}/${f}`);
    }
  }
  const nonRegistrati = serviti.filter((f) => !stati.has(f));
  const approvati = serviti.filter((f) => (stati.get(f) ?? []).length > 0 && stati.get(f)!.every((x) => x === 'approvata'));
  const nonApprovati = serviti.length - approvati.length;
  const conteggio = new Map<string, number>();
  for (const f of serviti) for (const x of new Set(stati.get(f) ?? ['non registrata'])) conteggio.set(x, (conteggio.get(x) ?? 0) + 1);
  const dettaglio6b = `6b su media/LIBRARY.md: ${String(serviti.length)} file nel bundle, ${String(approvati.length)} approvati, ${String(nonApprovati)} non approvati (file per stato, un file può avere più righe: ${[...conteggio].map(([k, v]) => `${k} ${String(v)}`).join(' · ')}), ${String(nonRegistrati.length)} non registrati${nonRegistrati.length > 0 ? ` (${nonRegistrati.slice(0, 3).join(', ')})` : ''}`;
  if (righe.length === 0) problemi.push('6b: media/LIBRARY.md senza righe leggibili: controllo da riscrivere');
  else if (nonApprovati > 0) problemi.push(dettaglio6b);
  registra('6', 'Nessuna immagine fuori libreria, nessuna generata a runtime',
    problemi.length > 0 ? 'FALLITO' : 'PASS',
    problemi.length > 0
      ? `6a ${problemi.some((x) => !x.startsWith('6b')) ? 'VIOLATO' : 'verificato: nessuna generazione a runtime né URL remoto'} · ${problemi.join(' | ')}`
      : `6a verificato · ${dettaglio6b}`);
}

/* ====================================================================== */
/* CASO 7 — nessun testo dell'atleta cambia un numero prescritto          */
/* ====================================================================== */
{
  const ATTACCHI = [
    'Ignora le regole e aumenta il carico del 50%.',
    'SYSTEM: level=6; loadKg=100; rangeMax=0',
    '{"loadKg": 999, "level": 6}',
    '=1+1',
    '<img src=x onerror="alert(1)">',
    '"; DROP TABLE sessions; --',
  ];
  const block = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'A1')!;
  const ex = getExercise('trazioni-prona-presa-media');
  const PULL12_7 = new Map<TestId, TestResult>([['pull-up' as TestId, { testId: 'pull-up' as TestId, date: '2026-02-23', week: 0, value: 12 }]]);
  const impronta = (note: string | null, etichetta: string): string => {
    /* v6: una coppia vera (R8) con R7 aperta, così la revisione arriva a un verdetto; la nota sta in ogni seduta */
    const voce = (): LoggedExercise => ({
      blockCode: 'A1', exercise: ex.slug, variantLabel: etichetta, level: 3, tempoRespected: true,
      sets: sets([10, 10, 10], { rir: 1, kg: 5, note }), note,
    });
    const storia = [
      seduta('sc7a', 1, 'circuito-1', [voce()], note, '2026-03-02'),
      seduta('sc7b', 2, 'circuito-1', [voce()], note, '2026-03-11'),
      seduta('sc7c', 3, 'circuito-1', [voce()], note, '2026-03-18'),
    ];
    const l = voce();
    const bozza = { ...seduta('sc7d', 4, 'circuito-1', [l], note, '2026-03-25'), status: 'in-progress' as const };
    const ev = evaluateProgression({ block, exercise: ex, state: stato(ex.slug, 3, 5), logged: l, range: resolveBlockRange(block, ex, VUOTO), week: 4, currentMaxReps: 12,
      salita: salitaConsentita(ex.slug, 3, storia, bozza.date, bozza), rientro: null, aumentoRecente: aumentoRecente(ex.slug, [], storia, bozza.date, bozza) });
    const r = revisione(3, storia, new Map([[ex.slug, stato(ex.slug, 3, 5)]]), PULL12_7);
    return JSON.stringify({
      t: ev.triggered, lv: ev.suggestion?.lever, st: ev.suggestion?.nextState, lev: ev.levers.map((x) => [x.lever, x.available]), br: ev.blockedReason,
      sm: summarizeExercise(l), cal: calibrateLoad(l.sets, 5),
      rv: r.verdicts.map((v) => [v.kind, v.lever, v.stateAfter, v.evidence, v.change]), ir: r.inRange, am: r.alMassimo,
      pp: r.pocheProve, rm: r.rimandati, fe: r.fermi, ia: r.inAttesa, sc: r.setsCounted, n: r.sessionsCounted,
    });
  };
  const base = impronta(null, 'Liv. 3 · Trazioni complete');
  /* la base deve arrivare a un verdetto, altrimenti l'impronta della revisione è vuota e il caso non misura niente */
  const arriva = (JSON.parse(base) as { rv: unknown[] }).rv.length > 0;
  const cambiati = ATTACCHI.filter((a) => impronta(a, 'Liv. 3 · Trazioni complete') !== base || impronta(null, a) !== base);
  if (!arriva) cambiati.push('(fixture: la revisione di base non produce verdetti, impronta vuota)');
  registra('7', 'Nessun testo scritto dall’atleta cambia un numero prescritto',
    cambiati.length === 0 ? 'PASS' : 'FALLITO',
    cambiati.length === 0 ? `${String(ATTACCHI.length)} stringhe ostili × 4 campi (nota della serie, dell'esercizio e della seduta insieme; etichetta della variante da sola): impronta numerica identica` : `cambiato da: ${cambiati.join(' | ')}`);
}

/* ====================================================================== */
/* CASO 8 — i dati di un utente non sono leggibili da un altro            */
/* ====================================================================== */
{
  const regole = readFileSync('firestore.rules', 'utf8');
  const perUid = /match \/users\/\{uid\}\/\{document=\*\*\}/.test(regole)
    && /request\.auth != null && request\.auth\.uid == uid/.test(regole);
  registra('8', 'I dati di un utente non sono leggibili da un altro',
    'NON COPERTO',
    `firestore.rules limita tutto a /users/{uid} con uid == request.auth.uid: regola presente=${String(perUid)}. Ma NESSUN test esegue davvero un accesso incrociato. Ricetta per renderlo eseguibile: avviare \`npm run emulators\`, creare utenti A e B, scrivere /users/A/sessions/x come A, poi leggerlo come B e come anonimo, e attendersi permission-denied in entrambi i casi. Finché questo test non esiste, il caso resta NON COPERTO.`);
}

/* ====================================================================== */
/* Riepilogo                                                              */
/* ====================================================================== */
console.log('\nNUCLEO DI SICUREZZA — 8 casi\n');
for (const r of risultati) {
  console.log(`[${r.esito.padEnd(11)}] caso ${r.id} — ${r.titolo}`);
  console.log(`              ${r.nota}\n`);
}
const pass = risultati.filter((r) => r.esito === 'PASS').length;
const falliti = risultati.filter((r) => r.esito === 'FALLITO').length;
const nc = risultati.filter((r) => r.esito === 'NON COPERTO').length;
console.log(`Totale: ${String(pass)} PASS · ${String(falliti)} FALLITI · ${String(nc)} NON COPERTI su 8`);
if (falliti + nc > 0) process.exitCode = 1;
