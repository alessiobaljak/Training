/*
 * 19 — Quale figura vede l'atleta, per ogni esercizio e per ogni gradino.
 *
 * Riscrive in modo indipendente la decisione di `ExerciseArt.tsx` (che non si
 * può importare in node: usa `import.meta.glob`) e la applica a tutto ciò che
 * l'app rende raggiungibile: ogni esercizio del catalogo (la Libreria li
 * elenca tutti), con `level` nullo e con ogni gradino della sua scala (la
 * scheda esercizio li rende tutti toccabili).
 *
 * Uso, dalla radice di un `git archive` del commit da misurare:
 *   node --experimental-strip-types quality/scripts/19-figure.mts > out.tsv
 * Colonne: esercizio, livello, chiave, tipo, cosa si vede.
 * Non guarda nessuna immagine: legge solo mappe e nomi di file.
 */
import { existsSync } from 'node:fs';
import * as Art from '../../src/data/exercise-art.ts';
import { EXERCISES } from '../../src/data/exercises.ts';
import { getProgressionScale } from '../../src/data/progressions.ts';
import { artFor } from '../../src/engine/media.ts';

type Frames = { readonly source: string; readonly frames: readonly string[] };
const senza: ReadonlyMap<string, string> =
  (Art as unknown as { FIGURE_SENZA_IMMAGINE?: ReadonlyMap<string, string> }).FIGURE_SENZA_IMMAGINE ??
  new Map();
const stepArt = Art.REPDB_STEP_ART as Readonly<Record<string, Frames>>;
const exArt = Art.REPDB_ART as Readonly<Record<string, Frames | undefined>>;

function mostra(kind: 'exercise' | 'step', key: string): string {
  if (senza.has(key)) return 'NESSUNA (lista)';
  const tab = kind === 'step' ? stepArt : exArt;
  const voce = tab[key];
  if (voce !== undefined) {
    const presenti = voce.frames.filter((f) => existsSync(`src/assets/exercises-repdb/${f}`));
    if (presenti.length > 0) return `FOTO ${voce.source} (${String(presenti.length)})`;
  }
  const svg = kind === 'step' ? `src/assets/steps/${key}.svg` : `src/assets/exercises/${key}.svg`;
  if (existsSync(svg)) return `SVG ${svg.replace('src/assets/', '')}`;
  return 'NESSUNA (manca)';
}

const righe: string[] = [];
const slugEsercizi = new Set(EXERCISES.map((e) => e.slug));
for (const e of EXERCISES) {
  const livelli: (number | null)[] = [null];
  if (e.pattern !== null) {
    for (const s of getProgressionScale(e.pattern).steps) livelli.push(s.level);
  }
  for (const l of livelli) {
    const t = artFor(e, l as never);
    const proprio = l !== null && l === e.defaultLevel ? '*' : '';
    righe.push([e.slug, `${l === null ? '-' : String(l)}${proprio}`, t.key, t.kind, mostra(t.kind, t.key)].join('\t'));
  }
}
for (const r of righe) console.log(r);
/* Collisioni di nomi fra esercizi e gradini: la lista non distingue il tipo. */
for (const e of EXERCISES) {
  if (e.pattern === null) continue;
  for (const s of getProgressionScale(e.pattern).steps) {
    if (slugEsercizi.has(s.slug)) console.error(`COLLISIONE ${s.slug}`);
  }
}
for (const k of senza.keys()) {
  const esiste = slugEsercizi.has(k) || EXERCISES.some((e) => e.pattern !== null && getProgressionScale(e.pattern).steps.some((s) => s.slug === k));
  if (!esiste) console.error(`CHIAVE ORFANA ${k}`);
}
