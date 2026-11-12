/*
 * 07 — Il tempo «misurato» dal player guidato (commit 03c7395..47c7f6d).
 *
 * Domanda: `tempoRespected` adesso vale `cronometro >= workSeconds`, con il
 * cronometro che parte da solo alla fine del recupero. Quanto si discosta da
 * «il TUT prescritto è stato rispettato su tutte le serie» (PROGRESSION §1)?
 *
 * Ricalcolo INDIPENDENTE: TUT e range dai dati di src/data/circuit.ts, con la
 * mia lettura della notazione (X = 1", come la scheda conta la durata).
 * Dell'engine importo solo `buildGuidedPlan` per leggere il `workSeconds` che
 * il player usa davvero, e lo confronto con quello del dato.
 *
 * Esecuzione: node --experimental-strip-types quality/scripts/07-player-tempo.mts
 */
import { CIRCUIT_SESSIONS } from '../../src/data/circuit.ts';
import { getExercise } from '../../src/data/exercises.ts';
import { buildGuidedPlan } from '../../src/engine/circuit.ts';
import type { ExerciseState } from '../../src/types/index.ts';

function perRep(tut: string): number | null {
  if (!/^[0-9X]-[0-9X]-[0-9X]-[0-9X]$/.test(tut)) return null;
  return tut.split('-').map((d) => (d === 'X' ? 1 : Number(d))).reduce((a, b) => a + b, 0);
}

/* Secondi non di lavoro che il cronometro conta comunque: presa, appoggio,
   i tocchi sullo stepper dopo l'ultima ripetizione. Tre ipotesi. */
const NON_LAVORO = [0, 5, 10];

type Riga = {
  dove: string; es: string; tut: string; r: number; min: number; max: number; lati: number;
  ws: number; wsPlayer: number | null; servonoMin: number; servonoMax: number; servonoSopra: number;
};
const righe: Riga[] = [];

for (const s of CIRCUIT_SESSIONS) {
  /* stati al gradino della scheda: il workSeconds del player al gradino prescritto */
  const stati = new Map<string, ExerciseState>();
  for (const b of s.blocks) {
    const e = getExercise(b.exercise);
    stati.set(b.exercise, { exercise: b.exercise, level: e.defaultLevel, eccentricBonusSeconds: 0, bottomPauseBonusSeconds: 0, loadKg: 0 });
  }
  const piano = buildGuidedPlan(s, 1, stati as never);
  for (const b of s.blocks) {
    if (b.excludeFromReview === true) continue;
    const p = b.prescription;
    if (p.kind !== 'reps') continue;
    const r = perRep(b.tut);
    if (r === null) continue;
    const lati = b.perSide ? 2 : 1;
    const wsPlayer = piano.find((x) => x.kind === 'work' && (x as { blockCode: string }).blockCode === b.code) as { workSeconds: number } | undefined;
    righe.push({
      dove: `${s.id}/${b.code}`, es: b.exercise, tut: b.tut, r, min: p.min, max: p.max, lati,
      ws: b.workSeconds ?? 0, wsPlayer: wsPlayer?.workSeconds ?? null,
      servonoMin: p.min * r * lati, servonoMax: p.max * r * lati, servonoSopra: (p.max + 1) * r * lati,
    });
  }
}

console.log('=== workSeconds del player vs TUT × ripetizioni (blocchi giudicati, a ripetizioni) ===');
console.log('dove            esercizio                            TUT     s/rip  range  lati  ws(dato) ws(player)  TUT×min TUT×max TUT×(max+1)');
for (const x of righe) {
  console.log(`${x.dove.padEnd(15)} ${x.es.padEnd(36)} ${x.tut.padEnd(7)} ${String(x.r).padStart(5)}  ${`${x.min}-${x.max}`.padEnd(6)} ${String(x.lati).padStart(4)}  ${String(x.ws).padStart(8)} ${String(x.wsPlayer).padStart(10)}  ${String(x.servonoMin).padStart(7)} ${String(x.servonoMax).padStart(7)} ${String(x.servonoSopra).padStart(11)}`);
}

console.log('\n=== GONFIA: chi chiude max+1 ripetizioni (innesco della salita) più veloce del TUT, e il cronometro dice «tempo tenuto» ===');
console.log('Ritmo minimo che passa il controllo, in secondi per ripetizione, contro quello prescritto.');
let gonfia = 0;
for (const x of righe) {
  const cells: string[] = [];
  let colpito = false;
  for (const nl of NON_LAVORO) {
    const passa = Math.max(0, x.ws - nl) / ((x.max + 1) * x.lati);
    cells.push(`+${String(nl)}s non lavoro → ${passa.toFixed(2)} s/rip (${Math.round((passa / x.r) * 100)}% del TUT)`);
    if (passa < x.r) colpito = true;
  }
  if (colpito) gonfia += 1;
  console.log(`${colpito ? 'SÌ' : 'no'}  ${x.dove.padEnd(15)} ${x.es.padEnd(36)} TUT ${String(x.r)} s/rip · ${cells.join(' · ')}`);
}

console.log('\n=== SGONFIA: chi chiude il massimo del range al TUT esatto, e il cronometro dice «chiusa prima del tempo minimo» ===');
let sgonfia = 0;
for (const x of righe) {
  const cells: string[] = [];
  let colpito = false;
  for (const nl of NON_LAVORO) {
    const durata = x.servonoMax + nl;
    const no = durata < x.ws;
    if (no && nl === 0) colpito = true;
    cells.push(`+${String(nl)}s → ${String(durata)}s ${no ? '< ' : '>= '}${String(x.ws)} ${no ? 'FALSO NO' : 'ok'}`);
  }
  if (colpito) sgonfia += 1;
  console.log(`${colpito ? 'SÌ' : 'no'}  ${x.dove.padEnd(15)} ${x.es.padEnd(36)} ${cells.join(' · ')}`);
}

console.log(`\nBlocchi giudicati a ripetizioni con TUT numerico: ${String(righe.length)}`);
console.log(`Il controllo lascia passare un ritmo più veloce del TUT all'innesco della salita: ${String(gonfia)} su ${String(righe.length)}`);
console.log(`Il controllo boccia chi tiene il TUT esatto al massimo del range, senza secondi di non lavoro: ${String(sgonfia)} su ${String(righe.length)}`);
const diversi = righe.filter((x) => x.wsPlayer !== null && x.wsPlayer !== x.ws);
console.log(`workSeconds del player diverso dal dato al gradino della scheda: ${String(diversi.length)} ${diversi.map((x) => `${x.dove} ${String(x.ws)}→${String(x.wsPlayer)}`).join(' | ')}`);
