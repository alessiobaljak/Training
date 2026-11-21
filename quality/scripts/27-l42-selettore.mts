/*
 * 27 — L42: il gradino scelto a mano nel VariantPicker di SessionScreen (R23, D-23), e il peso precompilato
 *      dopo un cambio di gradino a 0 kg (player di SessionScreen e player guidato). training-quality, 2026-11-21,
 *      commit 3c4a8d7 contro 9c62f84. Nessun browser, nessun emulatore.
 *
 * Uso, dalla radice di un `git archive`: node --experimental-strip-types quality/scripts/27-l42-selettore.mts
 * Attesi dal testo di R23 (training/reports/2026-11-21-training-anelli-figure.md §3; BOUNDARIES limiti 1.6:
 * «sotto il 6 nessun kg prescritto dall'app») e da D-23 (a), riscritti qui, non dal codice che li produce.
 * Lo handler e la composizione del peso si leggono in modo statico: se non sono né quelli di 3c4a8d7 né quelli
 * di 9c62f84, la riga è INFO «da riscrivere», mai OK. Righe «OK» / «NO» / «INFO».
 */
import { readFileSync } from 'node:fs';
import { EXERCISES, getExercise } from '../../src/data/exercises.ts';
import { findCircuitSession } from '../../src/data/circuit.ts';
import * as Draft from '../../src/engine/draft.ts';
import type { ExerciseSlug, ExerciseState, LevelIndex, LoggedExercise, LoggedSession } from '../../src/types/index.ts';

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
  pesoIniziale?: (inerente: boolean, dalloStato: number, volta: number) => number;
  statoDopoCambioAMano?: (e: unknown, s: ExerciseState, l: LevelIndex | null) => ExerciseState;
};

const serie = (v: number[], kg = 0) => v.map((x, i) => ({ setIndex: i + 1, side: null, value: x, rir: null, loadKg: kg, heartRate: null, note: null }));
const voce = (code: string, slug: ExerciseSlug, level: LevelIndex | null, v: number[], kg = 0) => ({ blockCode: code, exercise: slug, variantLabel: 'fixture', level, tempoRespected: true, sets: serie(v, kg), note: null });
const seduta = (id: string, date: string, week: number, sessionId: string, ex: unknown[], status = 'completed') => ({ id, date, week, sessionId, status, exercises: ex, note: null }) as unknown as LoggedSession;
const st = (slug: string, level: number | null, kg = 0, e = 0, p = 0): ExerciseState => ({ exercise: slug as ExerciseSlug, level: level as LevelIndex, eccentricBonusSeconds: e, bottomPauseBonusSeconds: p, loadKg: kg });
const s4 = (x: ExerciseState | undefined | null): string => (x == null ? 'null' : `{${String(x.level)}, ${String(x.loadKg)} kg, +${String(x.eccentricBonusSeconds)}″/+${String(x.bottomPauseBonusSeconds)}″}`);
const ZERO = (l: number): string => `{${String(l)}, 0 kg, +0″/+0″}`;

const TZ = 'trazioni-prona-presa-media' as ExerciseSlug;
const tz = getExercise(TZ);
const c1 = findCircuitSession('circuito-1')!;
const A1 = c1.blocks.find((b) => b.exercise === TZ);
riga(tz.loadPolicy === 'allowed' && tz.pattern !== null && A1 !== undefined, '27.0', `fixture: ${TZ} loadPolicy ${tz.loadPolicy}, scala ${String(tz.pattern)}, blocco ${A1?.code ?? '-'} di circuito-1`);
const CODE = A1?.code ?? 'A1';

/* ---------------------------------------------------------------- lo handler del selettore */
console.log('=== 27.A · VariantPicker di SessionScreen: lo stato salvato subito ===');
const ss = readFileSync('src/ui/session/SessionScreen.tsx', 'utf8');
const handler = (/onChange=\{\(level, label\) => \{[\s\S]*?confirmExercise\(([^;]*)\);/.exec(ss)?.[1] ?? '(non trovato)').trim();
const nuovoH = handler === 'statoDopoCambioAMano(exercise, exerciseState, level)' && D.statoDopoCambioAMano !== undefined;
const vecchioH = handler === '{ ...exerciseState, level: level ?? exerciseState.level }';
/* `exercise` dello handler deve essere l'esercizio dello stato: tutti e due da block.exercise dello stesso blocco */
const stessoEsercizio = /const exercise = getExercise\(block\.exercise\);/.test(ss) && /const exerciseState = states\.get\(block\.exercise\);/.test(ss);
riga(nuovoH || vecchioH ? nuovoH && stessoEsercizio : null, '27.1', `handler: confirmExercise(${handler}); esercizio e stato dallo stesso block.exercise: ${String(stessoEsercizio)}${nuovoH || vecchioH ? '' : ' — NON RICONOSCIUTO, da riscrivere'}`);
const picker = (e: unknown, s: ExerciseState, l: LevelIndex | null): ExerciseState | null =>
  nuovoH ? D.statoDopoCambioAMano!(e, s, l) : vecchioH ? { ...s, level: l ?? s.level } : null;

const casi: [string, ExerciseState, LevelIndex | null, string][] = [
  ['27.2', st(TZ, 6, 5, 2, 2), 5 as LevelIndex, ZERO(5)], // discesa a mano dal 6 con zavorra (R23 + D-23)
  ['27.3', st(TZ, 6, 0, 2, 2), 5 as LevelIndex, ZERO(5)], // a 0 kg: solo tempo e pausa
  ['27.4', st(TZ, 3, 5, 1, 1), 4 as LevelIndex, ZERO(4)], // salita a mano con kg scritti sotto il 6
  ['27.5', st(TZ, 5, 5, 2, 2), 6 as LevelIndex, ZERO(6)], // al 6: «la zavorra riparte da zero»
  ['27.6', st(TZ, 6, 5, 2, 2), 1 as LevelIndex, ZERO(1)], // salto di più gradini
];
for (const [id, prima, l, atteso] of casi) {
  const dopo = picker(tz, prima, l);
  riga(dopo === null ? null : s4(dopo) === atteso, id, `${s4(prima)} → gradino ${String(l)} ⇒ ${s4(dopo)} (atteso ${atteso})`);
}
{
  const prima = st(TZ, 6, 5, 2, 2);
  const stesso = picker(tz, prima, 6 as LevelIndex);
  const nullo = picker(tz, prima, null);
  riga(stesso === null ? null : s4(stesso) === s4(prima) && s4(nullo) === s4(prima), '27.7', `stesso gradino ⇒ ${s4(stesso)}; livello null (solo etichetta) ⇒ ${s4(nullo)} (atteso invariato ${s4(prima)})`);
}
{
  /* manubri: nessun esercizio inherent ha una scala; la guardia si prova sul primo inherent con un gradino finto */
  const inh = EXERCISES.find((x) => x.loadPolicy === 'inherent');
  const forb = EXERCISES.find((x) => x.loadPolicy === 'forbidden' && x.pattern !== null);
  const g = inh === undefined ? null : picker(inh, st(inh.slug, 2, 12, 2, 2), 3 as LevelIndex);
  const f = forb === undefined ? null : picker(forb, st(forb.slug, 3, 0, 2, 2), 2 as LevelIndex);
  riga(g === null ? null : s4(g) === '{3, 12 kg, +0″/+0″}', '27.8', `inherent (${inh?.slug ?? '-'}) 12 kg +2/+2, 2 → 3 ⇒ ${s4(g)} (atteso {3, 12 kg, +0″/+0″}: peso tenuto, D-23); inherent con scala: ${String(EXERCISES.filter((x) => x.loadPolicy === 'inherent' && x.pattern !== null).length)}`);
  riga(f === null ? null : s4(f) === ZERO(2), '27.9', `forbidden con scala (${forb?.slug ?? '-'}) 3 → 2 ⇒ ${s4(f)} (atteso ${ZERO(2)})`);
}
{
  /* andata e ritorno nello stesso selettore: 6 → 5 → 6 */
  const prima = st(TZ, 6, 5, 2, 2);
  const a = picker(tz, prima, 5 as LevelIndex);
  const b = a === null ? null : picker(tz, a, 6 as LevelIndex);
  riga(null, '27.10', `andata e ritorno 6 → 5 → 6 da ${s4(prima)} ⇒ ${s4(b)}: il ritorno al gradino di partenza non restituisce kg né bonus (direzione prudente; domanda)`);
}

/* ---------------------------------------------------------------- la seduta dopo il selettore */
console.log('=== 27.B · stessa seduta: peso precompilato dopo il selettore e chiusura ===');
/* la seduta della settimana scorsa, stesso blocco: al 6 con 5 kg (il caso di 4o) */
const scorsa = seduta('s3', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 6 as LevelIndex, [5, 5, 5], 5)]);
const oggi = new Map(c1.blocks.map((b) => [b.code, b.exercise as ExerciseSlug]));
const past = D.lastLoggedByBlock([scorsa], 'circuito-1', 'oggi', oggi).get(CODE);
const kgDalLog = D.suggestedSetValue(past, 1, null)?.loadKg ?? 0;
const compSS = /const kgDalLog = suggestedSetValue\(past, step\.setIndex, step\.perSide \? 'left' : null\)\?\.loadKg \?\? 0;/.test(ss)
  && /const kgDalloStato = exerciseState\?\.loadKg \?\? 0;/.test(ss) && /loadKg: kgDalloStato > 0 \? kgDalloStato : kgDalLog,/.test(ss);
riga(compSS ? null : null, '27.11', `composizione del peso in SessionScreen riconosciuta (kgDalloStato > 0 ? kgDalloStato : kgDalLog): ${String(compSS)}; volta scorsa ${String(kgDalLog)} kg al gradino ${String(past?.level)}`);
{
  const dopo = picker(tz, st(TZ, 6, 5, 2, 2), 5 as LevelIndex);
  const pre = dopo === null || !compSS ? null : (dopo.loadKg > 0 ? dopo.loadKg : kgDalLog);
  riga(pre === null ? null : pre === 0, '27.12', `dopo il selettore 6 → 5 lo stato è ${s4(dopo)}; il campo Peso parte da ${String(pre)} kg (atteso 0: sotto il 6 nessun kg proposto, R23)`);
  if (dopo !== null && pre !== null) {
    /* l'atleta lascia il campo com'è: tre serie al 5 con il peso precompilato; poi la chiusura di SessionScreen */
    const giorno = seduta('s4', '2026-03-24', 4, 'circuito-1', [voce(CODE, TZ, 5 as LevelIndex, [6, 6, 6], pre)], 'in-progress');
    const fin = D.statesToSave(D.syncStatesFromLog(giorno, new Map([[TZ, dopo]])), new Map()).find((x) => x.exercise === TZ) ?? dopo;
    riga(s4(fin) === ZERO(5), '27.13', `serie al 5 con il peso lasciato com'è (${String(pre)} kg), chiusura ⇒ ${s4(fin)} (atteso ${ZERO(5)}, come 23.7a e 4o vi sullo stesso diario)`);
    const scritto0 = seduta('s4b', '2026-03-24', 4, 'circuito-1', [voce(CODE, TZ, 5 as LevelIndex, [6, 6, 6], 0)], 'in-progress');
    const fin0 = D.statesToSave(D.syncStatesFromLog(scritto0, new Map([[TZ, dopo]])), new Map()).find((x) => x.exercise === TZ) ?? dopo;
    riga(s4(fin0) === ZERO(5), '27.14', `positivo: serie al 5 con il peso portato a 0 a mano, chiusura ⇒ ${s4(fin0)} (atteso ${ZERO(5)})`);
  }
}

/* ---------------------------------------------------------------- la seduta dopo un cambio R23, player guidato */
console.log('=== 27.C · seduta successiva nel player guidato, dopo ogni via di R23 (stato a 0 kg, volta scorsa a 5 kg) ===');
const gs = readFileSync('src/ui/session/GuidedSession.tsx', 'utf8');
const compGS = (/const kgDalloStato =\s*contesto\.manubriInAttesa\.get\([^)]*\)\?\.B \?\?\s*contesto\.states\.get\([^)]*\)\?\.loadKg \?\?\s*0;/.test(gs) || /const kgDalloStato = contesto\.states\.get\([^)]*\)\?\.loadKg \?\? 0;/.test(gs))
  && /pesoIniziale\(stazione\?\.esercizio\.loadPolicy === 'inherent', kgDalloStato, suggerito\?\.loadKg \?\? 0\)/.test(gs)
  && /const suggerito = suggestedSetValue\(passato, step\.step\.setIndex, perSide \? 'left' : null\);/.test(gs)
  && /const comune = \{ rir: null, loadKg: kg,/.test(gs) && D.pesoIniziale !== undefined;
riga(null, '27.15', `composizione del peso nel player guidato riconosciuta (pesoIniziale(inherent, stato, volta scorsa); la serie registra kg anche se non lo tocchi): ${String(compGS)}`);
/* gli stati dopo ogni via sono quelli che il nucleo 4o verifica (v14 i-ii, v15 iii-vi): qui conta solo che siano a 0 kg */
const vie: [string, ExerciseState, LoggedSession][] = [
  ['scendi-di-livello 6 → 5 (B18)', st(TZ, 5), scorsa],
  ['riparti-dal-test 6 → 1 (R9b)', st(TZ, 1), scorsa],
  ['sali-di-livello 5 → 6 (R23)', st(TZ, 6), seduta('s3s', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 5 as LevelIndex, [9, 9, 9], 5)])],
  ['leva variante 3 → 4 (R23)', st(TZ, 4), seduta('s3v', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 3 as LevelIndex, [9, 9, 9], 5)])],
  ['selettore 6 → 5 (L42), seduta dopo', st(TZ, 5), scorsa],
];
let i = 16;
for (const [via, stato, ultima] of vie) {
  const p = D.lastLoggedByBlock([ultima], 'circuito-1', 'n', oggi).get(CODE);
  const sug = D.suggestedSetValue(p, 1, null)?.loadKg ?? 0;
  const pre = !compGS ? null : D.pesoIniziale!(false, stato.loadKg, sug);
  const id = `27.${String(i)}`;
  i += 1;
  if (pre === null) { riga(null, id, `${via}: composizione non riconosciuta, da riscrivere`); continue; }
  const giorno = seduta(`g${id}`, '2026-03-24', 4, 'circuito-1', [voce(CODE, TZ, stato.level, [6, 6, 6], pre)], 'in-progress');
  const fin = D.statesToSave(D.syncStatesFromLog(giorno, new Map([[TZ, stato]])), new Map()).find((x) => x.exercise === TZ) ?? stato;
  const ok = pre === 0 && s4(fin) === s4(stato);
  riga(ok, id, `${via}: stato ${s4(stato)}, volta scorsa al ${String(p?.level)} con ${String(sug)} kg → campo Peso ${String(pre)} kg; lasciato com'è, chiusura ⇒ ${s4(fin)} (atteso 0 kg e ${s4(stato)})`);
}
{
  /* positivo: senza kg la volta scorsa il campo parte da 0 e lo stato resta */
  const p0 = D.lastLoggedByBlock([seduta('z', '2026-03-17', 3, 'circuito-1', [voce(CODE, TZ, 6 as LevelIndex, [5, 5, 5], 0)])], 'circuito-1', 'n', oggi).get(CODE);
  const pre0 = !compGS ? null : D.pesoIniziale!(false, 0, D.suggestedSetValue(p0, 1, null)?.loadKg ?? 0);
  riga(pre0 === null ? null : pre0 === 0, `27.${String(i)}`, `positivo: volta scorsa a 0 kg, stato ${ZERO(5)} → campo Peso ${String(pre0)} kg (atteso 0)`);
  i += 1;
  /* positivo: al 6, stato con zavorra accettata, il campo parte dallo stato (A18) */
  const pre6 = !compGS ? null : D.pesoIniziale!(false, 7.5, kgDalLog);
  riga(pre6 === null ? null : pre6 === 7.5, `27.${String(i)}`, `positivo: al 6 con zavorra accettata 7,5 kg e volta scorsa 5 kg → campo Peso ${String(pre6)} kg (atteso 7,5, A18)`);
}
console.log(`\nNO: ${String(no)}`);
