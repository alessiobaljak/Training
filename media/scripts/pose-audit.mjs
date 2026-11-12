/*
 * Misure delle pose sugli SVG generati (REVIEW_CHECKLIST §4, GENERATOR_SPEC §4.2).
 * Sola lettura: non tocca il repo.
 *   node media/scripts/pose-audit.mjs src/assets/exercises src/assets/steps [--only slug,slug]
 *
 * Per ogni pannello stampa solo cio' che supera una soglia:
 *   E1 testa fuori asse  angolo (testa - collo) vs (collo - anca) > 40°
 *   E2 giunto nella testa gomito o mano a meno di r=6 dal centro della testa
 *   E3 braccio sulla testa segmento a meno di r=6; «sopra» se il braccio
 *      (spalla->mano) sta entro 40° dall'asse del tronco: e' la testa fra le
 *      braccia (verticale, hollow, rollout), posa corretta. Dagli SVG non si
 *      vede se `sh` era dichiarata: il generatore lo sa, qui si segnala
 *      «parte dal collo».
 *   L  proporzioni      stesso segmento (braccio, avambraccio, coscia, tibia)
 *      tra pannelli e tra lato vicino e lontano: il piu' corto < 80% del piu'
 *      lungo. Lo scorcio di un arto che esce dal piano e' legittimo, ma va
 *      giustificato nel commento dell'archetipo.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const R = 6;
const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(',')) : null;
const dirs = args.filter((a, i) => onlyIdx < 0 || (i !== onlyIdx && i !== onlyIdx + 1));

const pts = (s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.hypot(v[0], v[1]);
const dist = (a, b) => len(sub(a, b));
const segDist = (p, a, b) => {
  const ab = sub(b, a), ap = sub(p, a);
  const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1]) / (ab[0] ** 2 + ab[1] ** 2 || 1)));
  return dist(p, [a[0] + t * ab[0], a[1] + t * ab[1]]);
};
const ang = (u, v) => (Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v))))) * 180) / Math.PI;

for (const dir of dirs) {
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.svg')).sort()) {
    const slug = basename(f, '.svg');
    if (only && !only.has(slug)) continue;
    const notes = [];
    const seg = { braccio: [], avambraccio: [], coscia: [], tibia: [] };
    readFileSync(join(dir, f), 'utf8').split('<g transform="translate(').slice(1).forEach((raw, i) => {
      const body = raw.replace(/<g opacity="[^"]*">[\s\S]*?<\/g>/g, '');
      const c = body.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="6"/);
      if (!c) return;
      const p = `#${i + 1}`;
      const he = [Number(c[1]), Number(c[2])];
      const polys = [...body.matchAll(/<polyline points="([^"]+)"/g)].map((m) => pts(m[1]));
      const [ne, hi] = polys[0];
      const axis = sub(ne, hi);
      const isLeg = (q) => q[0][0] === hi[0] && q[0][1] === hi[1];
      const arms = polys.slice(1).filter((q) => !isLeg(q));
      const legs = polys.slice(1).filter(isLeg);
      const dev = ang(sub(he, ne), axis);
      if (dev > 40) notes.push(`${p} E1 testa fuori asse ${dev.toFixed(0)}°`);
      for (const a of arms) {
        if (dist(he, a[1]) < R || dist(he, a[2]) < R) notes.push(`${p} E2 gomito o mano dentro la testa`);
        const d = Math.min(segDist(he, a[0], a[1]), segDist(he, a[1], a[2]));
        if (d < R) {
          const over = ang(sub(a[2], a[0]), axis);
          const neck = a[0][0] === ne[0] && a[0][1] === ne[1];
          notes.push(`${p} E3 braccio a ${d.toFixed(1)} dalla testa, ${over <= 40 ? 'sopra la testa' : 'NON sopra la testa'} (${over.toFixed(0)}°)${neck ? ', parte dal collo' : ''}`);
        }
        seg.braccio.push([p, dist(a[0], a[1])]);
        seg.avambraccio.push([p, dist(a[1], a[2])]);
      }
      for (const l of legs) {
        seg.coscia.push([p, dist(l[0], l[1])]);
        seg.tibia.push([p, dist(l[1], l[2])]);
      }
    });
    for (const [name, list] of Object.entries(seg)) {
      if (list.length < 2) continue;
      const min = list.reduce((m, x) => (x[1] < m[1] ? x : m));
      const max = list.reduce((m, x) => (x[1] > m[1] ? x : m));
      if (min[1] < 0.8 * max[1]) notes.push(`L ${name} ${min[1].toFixed(0)} (${min[0]}) contro ${max[1].toFixed(0)} (${max[0]})`);
    }
    if (notes.length) console.log(`${basename(dir)}/${slug}\n  ${notes.join('\n  ')}`);
  }
}
