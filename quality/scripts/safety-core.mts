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

  /* 2a — zero misurato vuol dire gradino 1, l'unica metà scritta nel metodo. */
  const sopraLoZero: string[] = [];
  /* 2b — il tetto del test non si applica fra misure diverse: resta scoperto. */
  const fuoriMisura: string[] = [];
  /* 2c — nessun test registrato per quel pattern: nessun tetto dal valore. */
  const senzaTest: string[] = [];
  for (const slug of [...prescritti].sort()) {
    const e = getExercise(slug);
    const livello = startingLevel(e, PROVE);
    if (livello === null || e.pattern === null) continue;
    const prova = testBaseline(e.pattern);
    if (prova === null) continue;
    const risultato = PROVE.get(prova.testId);
    if (risultato === undefined) {
      if (livello > 1) senzaTest.push(`${slug}: test ${prova.testId} non registrato → gradino ${String(livello)}`);
      continue;
    }
    if (risultato.value <= 0 && livello > 1) {
      sopraLoZero.push(`${slug}: misurato ${String(risultato.value)} → gradino ${String(livello)}, atteso 1`);
      continue;
    }
    if (risultato.value > 0 && livello > prova.level) {
      fuoriMisura.push(`${slug}: misurato ${String(risultato.value)} (${prova.measurement}) → gradino ${String(livello)}, sopra il gradino ${String(prova.level)} dell'esercizio del test`);
    }
  }

  const coda = `2a zero → gradino 1: ${sopraLoZero.length === 0 ? 'rispettato su tutti gli esercizi prescritti' : `${String(sopraLoZero.length)} violazioni → ${sopraLoZero.join(' | ')}`}. 2b mappatura valore → gradino sopra lo zero: NON SCRITTA nel metodo, quindi «nessun esercizio sopra il gradino compatibile con il valore misurato» non è decidibile${fuoriMisura.length === 0 ? '' : `; fuori misura: ${fuoriMisura.join(' | ')}`}. 2c test non registrato (P1 non ha il TRX): ${senzaTest.length === 0 ? 'nessun esercizio sopra il gradino 1' : senzaTest.join(' | ')}.`;

  registra('2', 'Principiante senza esercizi oltre il suo gradino',
    sopraLoZero.length > 0 ? 'FALLITO' : 'NON COPERTO',
    coda);
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
    const s = seduta('sc4a', 2, 'circuito-2', [esercizio('A3', 'rematore-inverso-trx', sets([19, 19, 19]), false, 2)]);
    const r = reviewWeek({ week: 2, sessions: [s], states: new Map([['rematore-inverso-trx', stato('rematore-inverso-trx', 2)]]), tests: VUOTO });
    if (r.verdicts.some((v) => v.kind === 'sali-di-livello')) violazioni.push('S3: salita di gradino proposta con tempoRespected=false');
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
   * Il caso ha due metà. «Nessuna generata a runtime» è verificabile e oggi
   * passa. «Solo immagini approvate da Alessio» non è verificabile: non
   * esiste nessun registro delle approvazioni. Metà verificabile non fa un
   * PASS, quindi il caso resta NON COPERTO.
   */
  registra('6', 'Nessuna immagine fuori libreria, nessuna generata a runtime',
    problemi.length > 0 ? 'FALLITO' : 'NON COPERTO',
    problemi.length > 0
      ? problemi.join(' | ')
      : '6a nessuna generazione a runtime e nessun URL remoto: VERIFICATO, le figure arrivano da import.meta.glob su src/assets a build time. 6b «solo immagini approvate da Alessio»: NON VERIFICABILE, non esiste un registro delle approvazioni in /media/. Per renderlo eseguibile serve /media/REGISTRY.md con una riga per immagine (file, esercizio, data di approvazione) e un confronto con i file presenti in src/assets.');
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
    const r = reviewWeek({ week: 4, sessions: [seduta('sc7', 4, 'circuito-1', [l])], states: new Map([[ex.slug, stato(ex.slug, 3, 5)]]), tests: VUOTO });
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
    cambiati.length === 0 ? `${String(ATTACCHI.length)} stringhe ostili × 2 campi: impronta numerica identica` : `cambiato da: ${cambiati.join(' | ')}`);
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
