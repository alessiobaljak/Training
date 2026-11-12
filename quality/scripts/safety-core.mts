/*
 * NUCLEO DI SICUREZZA — gli 8 casi che release-gate esegue a ogni rilascio.
 *
 * Esecuzione, dalla radice del progetto:
 *   node --experimental-strip-types quality/scripts/safety-core.mts
 *
 * Uscita: una riga per caso, `PASS` / `FALLITO` / `NON COPERTO`, poi il
 * riepilogo. Codice di uscita 1 se almeno un caso è FALLITO o NON COPERTO.
 *
 * Regola: NON COPERTO non è PASS. Un caso che non si può eseguire perché la
 * funzione non esiste resta NON COPERTO finché la funzione non esiste.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CIRCUIT_SESSIONS, findCircuitSession } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { startingLevel } from '../../src/engine/progression.ts';
import { testBaseline } from '../../src/data/tests.ts';
import { evaluateProgression } from '../../src/engine/progression.ts';
import { resolveBlockRange } from '../../src/engine/ranges.ts';
import { reviewWeek } from '../../src/engine/review.ts';
import { buildGuidedPlan } from '../../src/engine/circuit.ts';
import { summarizeExercise } from '../../src/engine/metrics.ts';
import { calibrateLoad } from '../../src/engine/loading.ts';
import type {
  ExerciseSlug, LevelIndex, LoggedExercise, LoggedSession, LoggedSet, TestId, TestResult,
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
function seduta(id: string, week: number, sessionId: LoggedSession['sessionId'], e: LoggedExercise[], note: string | null = null): LoggedSession {
  return { id, date: '2026-02-02', week, sessionId, status: 'completed', exercises: e, note };
}
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
  const r = reviewWeek({ week: 3, sessions: [s], states: new Map(), tests: VUOTO });
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
      const p = b.prescription;
      const min = p.kind === 'reps' || p.kind === 'seconds' ? p.min : null;
      if (min !== null && risultato.value < min) {
        incompatibili.push(`${s.id}/${b.code} ${slug}: test ${prova.testId} = ${String(risultato.value)} misurato al gradino ${String(livello)}, il blocco chiede ${String(min)}${p.kind === 'seconds' ? '"' : ''} allo stesso gradino${b.excludeFromReview === true ? ' (blocco escluso dalla revisione: R1 riga 2 lo lascia al gradino della scheda)' : ''}`);
      }
    }
  }

  const esito2: Esito = sopraLoZero.length > 0 || diversiDaR1.length > 0 || incompatibili.length > 0 ? 'FALLITO' : 'PASS';
  const coda = `2a zero o assente → gradino 1: ${sopraLoZero.length === 0 ? 'rispettato' : sopraLoZero.join(' | ')}. 2b app = R1 (PROGRAM_RULES §3, riscritta dal testo): ${diversiDaR1.length === 0 ? `coincide su ${String(prescritti.size)} esercizi prescritti` : diversiDaR1.join(' | ')}. 2c S7 minima (stesso gradino del test, valore sotto il minimo del blocco): ${incompatibili.length === 0 ? 'nessun caso' : `${String(incompatibili.length)} blocchi → ${incompatibili.join(' | ')}`}. S7 approvata da Alessio il 2026-11-12; R1 è la regola di training-designer (PROGRAM_RULES §3).`;

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

  /* 4a — S3: nessuna salita senza tempo rispettato. */
  {
    /* v5: anche `null`. Dal 2d84d87 il player guidato non scrive più «sì» da solo:
       senza risposta dell'atleta nel riepilogo il blocco resta a `null`. */
    for (const tempo of [false, null] as const) {
      const s = seduta('sc4a', 2, 'circuito-2', [esercizio('A3', 'rematore-inverso-trx', sets([19, 19, 19]), tempo, 2)]);
      const r = reviewWeek({ week: 2, sessions: [s], states: new Map([['rematore-inverso-trx', stato('rematore-inverso-trx', 2)]]), tests: VUOTO });
      if (r.verdicts.some((v) => v.kind === 'sali-di-livello')) violazioni.push(`S3: salita di gradino proposta con tempoRespected=${String(tempo)}`);
    }
  }

  /* 4b — S5: la zavorra non scavalca la variante. */
  {
    const s = seduta('sc4b', 3, 'circuito-1', [esercizio('A1', 'trazioni-prona-presa-media', sets([8, 8, 8]), true, 1)]);
    const r = reviewWeek({ week: 3, sessions: [s], states: new Map([['trazioni-prona-presa-media', stato('trazioni-prona-presa-media', 1)]]), tests: VUOTO });
    if (r.verdicts.some((v) => v.kind === 'aggiungi-peso')) violazioni.push('S5: zavorra proposta al gradino 1, con la variante ancora disponibile');
  }

  /* 4c — S1: non più di un gradino ogni 2 settimane. */
  {
    let livello: LevelIndex = 1;
    let salite = 0;
    for (let w = 1; w <= 3; w += 1) {
      const s = seduta(`sc4c${String(w)}`, w, 'circuito-3', [esercizio('A2', 'push-up', sets([19, 19, 19]), true, livello)]);
      const r = reviewWeek({ week: w, sessions: [s], states: new Map([['push-up', stato('push-up', livello)]]), tests: VUOTO });
      const v = r.verdicts.find((x) => x.kind === 'sali-di-livello');
      if (v === undefined) break;
      salite += 1;
      livello = (v.stateAfter.level ?? livello) as LevelIndex;
    }
    if (salite > 2) violazioni.push(`S1: ${String(salite)} salite di gradino in 3 settimane consecutive`);
  }

  /* 4d — S4: nessun verdetto da una sola seduta. */
  {
    const s = seduta('sc4d', 2, 'circuito-1', [esercizio('A2', 'bulgarian-split-squat', [...sets([13, 13], { side: 'left' }), ...sets([13, 13], { side: 'right' })], true, 1)]);
    const r = reviewWeek({ week: 2, sessions: [s], states: new Map([['bulgarian-split-squat', stato('bulgarian-split-squat', 1)]]), tests: VUOTO });
    if (r.verdicts.length > 0) violazioni.push('S4: verdetto emesso da 2 serie per lato di una sola seduta');
  }

  /* 4e — S2: il passo della zavorra resta 2,5 kg. */
  {
    const block = findCircuitSession('circuito-1')!.blocks.find((b) => b.code === 'A1')!;
    const ex = getExercise('chin-up-presa-supina-stretta');
    const ev = evaluateProgression({
      block, exercise: ex, state: stato('chin-up-presa-supina-stretta', 6, 5),
      logged: esercizio('A1', 'chin-up-presa-supina-stretta', sets([10, 10, 10], { rir: 0, kg: 5 }), true, 6),
      range: resolveBlockRange(block, ex, VUOTO), week: 4, currentMaxReps: 12,
    });
    const kg = ev.suggestion?.nextState.loadKg ?? 5;
    if (ev.suggestion?.lever === 'load' && kg - 5 !== 2.5) violazioni.push(`S2: passo di zavorra ${String(kg - 5)} kg invece di 2,5`);
  }

  /* 4f — un blocco escluso dalla revisione non produce verdetti. */
  {
    const s = seduta('sc4f', 1, 'circuito-1', [esercizio('F1', 'kb-swing', sets([12, 11, 12]), true, null)]);
    const r = reviewWeek({ week: 1, sessions: [s], states: new Map(), tests: VUOTO });
    if (r.verdicts.length > 0) violazioni.push(`excludeFromReview ignorato: verdetto "${r.verdicts[0]!.kind}" sulla finitura metabolica`);
  }

  /* 4g — T2: mai più di un gradino ESEGUIBILE alla volta (salto dei solo eccentrici, R1/PROGRESSION §5). */
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
      const s = seduta(`sc4g${nome}`, 3, sid, [esercizio(code, slug, sets([sopra, sopra, sopra]), true, da)]);
      const r = reviewWeek({ week: 3, sessions: [s], states: new Map([[slug, stato(slug, da)]]), tests: VUOTO });
      const v = r.verdicts.find((x) => x.kind === 'sali-di-livello');
      const a = v?.stateAfter.level ?? null;
      if (a !== null && a !== atteso) violazioni.push(`T2: ${nome} da ${String(da)} a ${String(a)}, atteso ${String(atteso)} (un solo gradino eseguibile)`);
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
    });
    if (ev.suggestion !== null) violazioni.push(`S10: leva «${ev.suggestion.lever}» proposta senza nessun «sì» sul tempo`);
    const player = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
    const scritture = [...player.matchAll(/setTempoRespected\(([^;]*?)\)\s*[;:]/gs)].map((m) => m[1]!.replace(/\s+/g, ' '));
    const nonFalse = scritture.filter((a) => !/,\s*false\s*$/.test(a));
    if (scritture.length === 0) violazioni.push('S10: nessuna scrittura di tempoRespected trovata nel player guidato: controllo da riscrivere');
    if (nonFalse.length > 0) violazioni.push(`S10: il player guidato scrive tempoRespected con un valore diverso da false: ${nonFalse.join(' | ')}`);
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
  const impronta = (note: string | null, etichetta: string): string => {
    const l: LoggedExercise = {
      blockCode: 'A1', exercise: ex.slug, variantLabel: etichetta, level: 3, tempoRespected: true,
      sets: sets([10, 10, 10], { rir: 1, kg: 5, note }), note,
    };
    const ev = evaluateProgression({ block, exercise: ex, state: stato(ex.slug, 3, 5), logged: l, range: resolveBlockRange(block, ex, VUOTO), week: 4, currentMaxReps: null });
    /* v5: anche LoggedSession.note. Fino alla v4 la nota della seduta era
       dichiarata in SAFETY_CORE.md ma non veniva iniettata. */
    const r = reviewWeek({ week: 4, sessions: [seduta('sc7', 4, 'circuito-1', [l], note)], states: new Map([[ex.slug, stato(ex.slug, 3, 5)]]), tests: VUOTO });
    return JSON.stringify({
      t: ev.triggered, lv: ev.suggestion?.lever, st: ev.suggestion?.nextState, lev: ev.levers.map((x) => [x.lever, x.available]),
      sm: summarizeExercise(l), cal: calibrateLoad(l.sets, 5),
      rv: r.verdicts.map((v) => [v.kind, v.lever, v.stateAfter]), ir: r.inRange, am: r.alMassimo,
    });
  };
  const base = impronta(null, 'Liv. 3 · Trazioni complete');
  const cambiati = ATTACCHI.filter((a) => impronta(a, 'Liv. 3 · Trazioni complete') !== base || impronta(null, a) !== base);
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
