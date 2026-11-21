/*
 * library-drift — LIBRARY.md contro il codice (R12). Non guarda immagini.
 * Uso, dalla radice del repo:
 *   node --experimental-strip-types media/scripts/library-drift.mts
 * Stampa: righe RepDB non più in uso e non `ritirata`, voci del codice senza
 * riga, SVG che l'app nasconde (FIGURE_SENZA_IMMAGINE) e non `ritirata`.
 * Nessuna riga stampata = registro allineato.
 */
import { readFileSync, existsSync } from 'node:fs';
import * as Art from '../../src/data/exercise-art.ts';
const lib = readFileSync('media/LIBRARY.md', 'utf8').split('\n');
const map = new Map<string, string[]>();
for (const [k, v] of Object.entries(Art.REPDB_ART as Record<string, any>)) map.set(k, v.frames);
for (const [k, v] of Object.entries(Art.REPDB_STEP_ART as Record<string, any>)) map.set(k, v.frames);
const senza = Art.FIGURE_SENZA_IMMAGINE;
const seenPairs = new Set<string>();
lib.forEach((l, i) => {
  const c = l.split('|').map((s) => s.trim());
  if (c.length < 9 || c[3] !== 'RepDB') return;
  const id = c[1], file = c[6].split('/').at(-1)!, st = c[5];
  seenPairs.add(`${id}::${file}`);
  const frames = map.get(id) ?? [];
  const ok = frames.includes(file) && existsSync('src/assets/exercises-repdb/' + file) && !senza.has(id);
  if (!ok && st !== 'ritirata') console.log(`riga ${i + 1}\t${id}\t${file}\t${st}\tmappa=${frames.join(',') || '-'}\tsenza=${senza.has(id)}\tfile=${existsSync('src/assets/exercises-repdb/' + file)}`);
});
for (const [k, fr] of map) for (const f of fr) if (!seenPairs.has(`${k}::${f}`)) console.log(`NON REGISTRATA\t${k}\t${f}`);
lib.forEach((l, i) => {
  const c = l.split('|').map((s) => s.trim());
  if (c.length < 9 || c[3] !== 'generata') return;
  if (senza.has(c[1]) && c[5] !== 'ritirata') console.log(`SVG NASCOSTA riga ${i + 1}\t${c[1]}\t${c[5]}`);
});
