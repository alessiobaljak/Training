#!/usr/bin/env node
/**
 * Genera le illustrazioni degli esercizi.
 *
 * Figure schematiche e monocromatiche: due pose affiancate, inizio e fine del
 * range, oppure una sola posa per le isometrie e le attività continue. Servono
 * a togliere il dubbio su cosa si muove, non a insegnare la tecnica: quella
 * sta nei cue scritti.
 *
 * Le pose sono archetipi condivisi tra esercizi dello stesso gesto. A questa
 * fedeltà una figura diversa per ogni variante sarebbe rumore: la differenza
 * tra push-up a terra e push-up declinati la fa l'appoggio, che qui è un
 * parametro e non un disegno nuovo.
 *
 *   npm run svg
 */
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = new URL('../src/assets/exercises/', import.meta.url).pathname;
const STEPS_OUT = new URL('../src/assets/steps/', import.meta.url).pathname;

const PANEL = 100;
const GAP = 10;
const HEIGHT = 110;
const FLOOR = 102;

/* -------------------------------------------------------------------------- */
/* Primitive di disegno                                                        */
/* -------------------------------------------------------------------------- */

const poly = (points, width = 3) =>
  `<polyline points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

const head = ([x, y]) =>
  `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="currentColor" stroke-width="3"/>`;

const prop = (markup) => `<g opacity="0.32">${markup}</g>`;

const floor = (from = 4, to = 96) =>
  prop(`<line x1="${from}" y1="${FLOOR}" x2="${to}" y2="${FLOOR}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`);

const bar = (y, from = 22, to = 78) =>
  prop(`<line x1="${from}" y1="${y}" x2="${to}" y2="${y}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`);

const box = (x, y, w, h) =>
  prop(`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(2, h)}" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>`);

const wall = (x) =>
  prop(`<line x1="${x}" y1="6" x2="${x}" y2="${FLOOR}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`);

const band = (points) =>
  prop(`<polyline points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/>`);

const arrowUp = (x, y) =>
  prop(
    `<path d="M ${x} ${y} L ${x} ${y - 14} M ${x - 4} ${y - 9} L ${x} ${y - 14} L ${x + 4} ${y - 9}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  );

const strap = (from, to) =>
  prop(`<line x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}" stroke="currentColor" stroke-width="2"/>`);

/** Testa, tronco, un braccio, una gamba, più eventuali arti secondari. */
function figure(pose) {
  /* La spalla può staccarsi dal collo: appesi alla sbarra, un braccio che
     parte dal collo passa dentro la testa. */
  const shoulder = pose.sh ?? pose.ne;
  const shoulder2 = pose.sh2 ?? shoulder;
  const parts = [head(pose.he), poly([pose.ne, pose.hi])];
  if (pose.ha) parts.push(poly([shoulder, pose.el, pose.ha]));
  if (pose.ha2) parts.push(poly([shoulder2, pose.el2, pose.ha2], 3));
  if (pose.fo) parts.push(poly([pose.hi, pose.kn, pose.fo]));
  if (pose.fo2) parts.push(poly([pose.hi, pose.kn2, pose.fo2], 2));
  return parts.join('');
}

/**
 * Tutte le illustrazioni escono con la stessa larghezza, anche quelle a posa
 * singola: dentro lo stesso contenitore una tela larga la metà renderebbe la
 * figura il doppio più grande delle altre.
 */
const CANVAS = 2 * PANEL + GAP;

function render(panels, label) {
  const offset = panels.length === 1 ? (CANVAS - PANEL) / 2 : 0;
  const divider =
    panels.length > 1
      ? `<line x1="${PANEL + GAP / 2}" y1="8" x2="${PANEL + GAP / 2}" y2="${HEIGHT - 8}" stroke="currentColor" stroke-width="1" opacity="0.18"/>`
      : '';
  const body = panels
    .map((content, index) => `<g transform="translate(${offset + index * (PANEL + GAP)},0)">${content}</g>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${HEIGHT}" role="img" aria-label="${label}"><title>${label}</title>${divider}${body}</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Archetipi di posa                                                           */
/* -------------------------------------------------------------------------- */

const ARCHETYPES = {
  'hang-pull': () => [
    bar(12, 26, 74) +
      figure({
        he: [50, 34], ne: [50, 42], hi: [50, 74],
        sh: [44, 44], el: [36, 30], ha: [34, 14],
        sh2: [56, 44], el2: [64, 30], ha2: [66, 14],
        kn: [46, 88], fo: [44, 98], kn2: [54, 88], fo2: [56, 98],
      }),
    bar(12, 26, 74) +
      figure({
        he: [50, 22], ne: [50, 30], hi: [50, 62],
        sh: [44, 32], el: [30, 28], ha: [34, 14],
        sh2: [56, 32], el2: [70, 28], ha2: [66, 14],
        kn: [46, 78], fo: [44, 88], kn2: [54, 78], fo2: [56, 88],
      }),
  ],

  'hang-hold': () => [
    bar(12, 26, 74) +
      figure({
        he: [50, 34], ne: [50, 42], hi: [50, 74],
        sh: [44, 44], el: [36, 30], ha: [34, 14],
        sh2: [56, 44], el2: [64, 30], ha2: [66, 14],
        kn: [46, 90], fo: [44, 100], kn2: [54, 90], fo2: [56, 100],
      }),
  ],

  row: ({ elevated = false, oneArm = false } = {}) => {
    const rig =
      prop(`<line x1="42" y1="10" x2="58" y2="10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`) +
      strap([50, 10], [50, 32]);
    const support = elevated ? box(78, 74, 18, FLOOR - 74) : '';
    const footY = elevated ? 72 : FLOOR - 2;

    const start = {
      he: [26, elevated ? 62 : 54], ne: [34, elevated ? 66 : 58], hi: [62, elevated ? 70 : 74],
      el: [42, 46], ha: [50, 32], kn: [78, elevated ? 71 : 86], fo: [92, footY],
    };
    const end = {
      he: [30, elevated ? 50 : 42], ne: [38, elevated ? 54 : 46], hi: [64, elevated ? 68 : 70],
      el: [40, elevated ? 66 : 58], ha: [50, 32], kn: [80, elevated ? 70 : 84], fo: [92, footY],
    };
    if (!oneArm) {
      start.el2 = [44, 48]; start.ha2 = [50, 32];
      end.el2 = [42, elevated ? 68 : 60]; end.ha2 = [50, 32];
    }
    return [rig + floor() + support + figure(start), rig + floor() + support + figure(end)];
  },

  /*
   * `feet` alza i piedi (push-up declinati), `hands` alza le mani (push-up su
   * rialzo, il primo gradino della scala). Sono i due modi in cui la scala
   * cambia davvero la forma del gesto: tutto il resto — tempo, pause, zavorra
   * — non si vede in una figura.
   */
  pushup: ({ feet = 0, wide = false, hands = 0 } = {}) => {
    const footY = FLOOR - 2 - feet;
    const handY = FLOOR - 4 - hands;
    const handX = wide ? 20 : 28;
    const rise = feet > 0 ? box(76, footY - 2, 20, FLOOR - footY + 2) : '';
    const bench = hands > 0 ? box(handX - 10, handY - 2, 24, FLOOR - handY + 2) : '';
    const lift = hands > 0 ? Math.round(hands * 0.6) : 0;
    return [
      floor() + rise + bench + figure({ he: [26, 54 - lift], ne: [35, 58 - lift], hi: [64, 68 - Math.round(lift / 2)], el: [28, 76 - lift], ha: [handX, handY], kn: [82, 74], fo: [93, footY] }),
      floor() + rise + bench + figure({ he: [24, 76 - lift], ne: [34, 79 - lift], hi: [64, 84 - Math.round(lift / 2)], el: [24, 86 - lift], ha: [handX, handY], kn: [82, 88], fo: [93, footY] }),
    ];
  },

  pike: ({ feet = 18 } = {}) => {
    const footY = FLOOR - 2 - feet;
    const support = feet > 0 ? box(76, footY - 2, 20, FLOOR - footY + 2) : '';
    return [
      floor() + support + figure({ he: [24, 44], ne: [30, 51], hi: [58, 22], el: [22, 70], ha: [20, FLOOR - 4], kn: [78, 46], fo: [93, footY] }),
      floor() + support + figure({ he: [14, 84], ne: [24, 76], hi: [58, 24], el: [18, 86], ha: [24, FLOOR - 4], kn: [78, 48], fo: [93, footY] }),
    ];
  },

  /* Isometria: una posa sola, il corpo in linea sopra le mani contro il muro. */
  handstand: () => [
    wall(88) + floor() +
      figure({
        he: [60, 84], ne: [58, 76], hi: [56, 46],
        sh: [58, 76], el: [58, 90], ha: [58, FLOOR - 2],
        sh2: [58, 76], el2: [58, 90], ha2: [58, FLOOR - 2],
        kn: [56, 28], fo: [56, 10],
      }),
  ],

  hspu: () => [
    wall(90) + floor() +
      figure({
        he: [58, 68], ne: [50, 62], hi: [52, 36],
        sh: [50, 62], el: [46, 80], ha: [42, 98],
        sh2: [50, 62], el2: [58, 80], ha2: [62, 98],
        kn: [54, 20], fo: [58, 8],
      }),
    wall(90) + floor() +
      figure({
        he: [56, 90], ne: [50, 80], hi: [52, 52],
        sh: [50, 80], el: [34, 86], ha: [42, 98],
        sh2: [50, 80], el2: [70, 86], ha2: [62, 98],
        kn: [54, 32], fo: [58, 16],
      }),
  ],

  dip: () => {
    const rig = bar(52, 24, 76);
    return [
      rig + figure({ he: [46, 24], ne: [46, 32], hi: [50, 64], el: [42, 42], ha: [40, 51], kn: [64, 76], fo: [58, 92] }),
      rig + figure({ he: [46, 42], ne: [46, 50], hi: [52, 80], el: [30, 58], ha: [40, 51], kn: [66, 90], fo: [60, FLOOR - 4] }),
    ];
  },

  'bench-dip': ({ feet = 0 } = {}) => {
    const footY = FLOOR - 2 - feet;
    const support = feet > 0 ? box(76, footY - 2, 20, FLOOR - footY + 2) : '';
    const bench = box(10, 56, 22, FLOOR - 56);
    return [
      floor() + bench + support +
        figure({ he: [44, 28], ne: [44, 36], hi: [46, 66], el: [34, 46], ha: [30, 55], kn: [70, 72], fo: [92, footY] }),
      floor() + bench + support +
        figure({ he: [46, 48], ne: [46, 56], hi: [48, 82], el: [26, 60], ha: [30, 55], kn: [72, 86], fo: [92, footY] }),
    ];
  },

  'split-squat': ({ rearElevated = true } = {}) => {
    const benchY = 62;
    const support = rearElevated ? box(70, benchY, 26, FLOOR - benchY) : '';
    return [
      floor() + support +
        figure({ he: [44, 26], ne: [44, 34], hi: [46, 60], el: [40, 46], ha: [38, 58], kn: [40, 80], fo: [38, FLOOR - 2], kn2: [66, 76], fo2: [78, benchY - 2] }),
      floor() + support +
        figure({ he: [44, 44], ne: [44, 52], hi: [46, 76], el: [38, 62], ha: [36, 74], kn: [36, 88], fo: [38, FLOOR - 2], kn2: [64, 92], fo2: [78, benchY - 2] }),
    ];
  },

  /* `height` è l'altezza del box: è la progressione dello step-up. */
  'step-up': ({ height = 42 } = {}) => {
    const boxY = FLOOR - height;
    return [
      floor() + box(58, boxY, 34, FLOOR - boxY) +
        figure({ he: [40, 34], ne: [40, 42], hi: [40, 68], el: [34, 54], ha: [32, 66], kn: [56, 66], fo: [66, boxY - 2], kn2: [40, 84], fo2: [38, FLOOR - 2] }),
      floor() + box(58, boxY, 34, FLOOR - boxY) +
        figure({ he: [66, 12], ne: [66, 20], hi: [66, 44], el: [60, 32], ha: [58, 44], kn: [66, 52], fo: [66, boxY - 2], kn2: [76, 50], fo2: [82, 44] }),
    ];
  },

  sissy: () => [
    floor() + figure({ he: [50, 24], ne: [50, 32], hi: [50, 58], el: [58, 44], ha: [64, 52], kn: [50, 80], fo: [50, FLOOR - 2] }),
    floor() + figure({ he: [34, 34], ne: [40, 40], hi: [52, 60], el: [46, 50], ha: [58, 54], kn: [66, 78], fo: [50, FLOOR - 2] }),
  ],

  /* Isometria: una posa sola, perché non c'è un inizio e una fine da mostrare. */
  wallsit: () => [
    wall(26) + floor() +
      figure({
        he: [36, 38], ne: [36, 46], hi: [36, 72],
        sh: [36, 46], el: [46, 58], ha: [56, 68],
        kn: [72, 72], fo: [72, FLOOR - 2],
      }),
  ],

  shrimp: () => [
    floor() + figure({ he: [46, 24], ne: [46, 32], hi: [46, 60], el: [38, 44], ha: [34, 54], kn: [46, 80], fo: [46, FLOOR - 2], kn2: [62, 70], fo2: [70, 56] }),
    floor() + figure({ he: [38, 46], ne: [40, 54], hi: [48, 78], el: [30, 60], ha: [26, 70], kn: [40, 90], fo: [46, FLOOR - 2], kn2: [66, 96], fo2: [76, 82] }),
  ],

  nordic: () => [
    floor() + prop(`<rect x="70" y="${FLOOR - 12}" width="24" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>`) +
      figure({ he: [44, 26], ne: [44, 34], hi: [46, 66], el: [36, 48], ha: [34, 60], kn: [58, 86], fo: [80, FLOOR - 8] }),
    floor() + prop(`<rect x="70" y="${FLOOR - 12}" width="24" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>`) +
      figure({ he: [16, 56], ne: [24, 60], hi: [50, 74], el: [14, 76], ha: [10, 88], kn: [60, 88], fo: [80, FLOOR - 8] }),
  ],

  'hip-thrust': () => {
    const bench = box(6, 50, 26, FLOOR - 50);
    return [
      floor() + bench + arrowUp(62, 74) +
        figure({ he: [24, 42], ne: [34, 48], hi: [58, 84], kn: [76, 78], fo: [84, FLOOR - 2] }),
      floor() + bench +
        figure({ he: [24, 42], ne: [34, 48], hi: [60, 56], kn: [78, 74], fo: [84, FLOOR - 2] }),
    ];
  },

  rdl: () => [
    floor() + figure({ he: [48, 22], ne: [48, 30], hi: [48, 58], el: [44, 44], ha: [42, 56], kn: [50, 80], fo: [50, FLOOR - 2] }),
    floor() + figure({ he: [16, 52], ne: [26, 54], hi: [56, 58], el: [22, 70], ha: [20, 82], kn: [60, 80], fo: [58, FLOOR - 2], kn2: [76, 48], fo2: [92, 42] }),
  ],

  calf: ({ seated = false } = {}) => {
    if (seated) {
      const seatY = 66;
      return [
        floor() + box(16, seatY, 30, FLOOR - seatY) + box(74, FLOOR - 12, 20, 12) +
          figure({ he: [30, 30], ne: [30, 38], hi: [32, 64], el: [40, 50], ha: [50, 60], kn: [62, 64], fo: [80, FLOOR - 4] }),
        floor() + box(16, seatY, 30, FLOOR - seatY) + box(74, FLOOR - 12, 20, 12) +
          figure({ he: [30, 30], ne: [30, 38], hi: [32, 64], el: [40, 50], ha: [50, 60], kn: [62, 62], fo: [80, FLOOR - 20] }),
      ];
    }
    const stepY = FLOOR - 12;
    return [
      floor() + box(38, stepY, 34, 12) +
        figure({ he: [50, 22], ne: [50, 30], hi: [50, 58], el: [58, 44], ha: [64, 52], kn: [50, 80], fo: [50, FLOOR - 2] }),
      floor() + box(38, stepY, 34, 12) +
        figure({ he: [50, 14], ne: [50, 22], hi: [50, 50], el: [58, 36], ha: [64, 44], kn: [50, 72], fo: [50, stepY - 2] }),
    ];
  },

  hollow: () => [
    floor() +
      figure({
        he: [28, 68], ne: [36, 74], hi: [60, 88],
        sh: [36, 74], el: [22, 72], ha: [10, 70],
        kn: [76, 78], fo: [92, 68], kn2: [76, 82], fo2: [92, 72],
      }),
  ],

  lsit: () => [
    bar(FLOOR - 26, 34, 66) +
      figure({ he: [50, 26], ne: [50, 34], hi: [50, 62], el: [46, 50], ha: [44, FLOOR - 26], kn: [72, 62], fo: [92, 62] }),
  ],

  'leg-raise': () => [
    bar(12) +
      figure({ he: [55, 33], ne: [50, 41], sh: [48, 41], hi: [50, 72], el: [42, 27], ha: [38, 14], kn: [52, 86], fo: [50, 96] }),
    bar(12) +
      figure({ he: [53, 35], ne: [48, 43], sh: [46, 43], hi: [50, 70], el: [40, 28], ha: [38, 14], kn: [72, 64], fo: [92, 58] }),
  ],

  'ab-wheel': () => [
    floor() + prop(`<circle cx="30" cy="${FLOOR - 8}" r="8" fill="none" stroke="currentColor" stroke-width="3"/>`) +
      figure({ he: [56, 44], ne: [56, 52], hi: [60, 76], el: [44, 62], ha: [32, FLOOR - 12], kn: [78, 82], fo: [86, FLOOR - 2] }),
    floor() + prop(`<circle cx="12" cy="${FLOOR - 8}" r="8" fill="none" stroke="currentColor" stroke-width="3"/>`) +
      figure({ he: [34, 74], ne: [42, 78], hi: [66, 84], el: [26, 82], ha: [14, FLOOR - 12], kn: [80, 88], fo: [88, FLOOR - 2] }),
  ],

  'band-raise': () => [
    floor() + band([[36, FLOOR - 2], [40, 76], [44, 62]]) + band([[64, FLOOR - 2], [60, 76], [56, 62]]) +
      figure({ he: [50, 24], ne: [50, 32], hi: [50, 62], el: [46, 48], ha: [44, 62], el2: [54, 48], ha2: [56, 62], kn: [48, 82], fo: [46, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
    floor() + band([[36, FLOOR - 2], [30, 62], [24, 36]]) + band([[64, FLOOR - 2], [70, 62], [76, 36]]) +
      figure({ he: [50, 24], ne: [50, 32], hi: [50, 62], el: [36, 34], ha: [24, 36], el2: [64, 34], ha2: [76, 36], kn: [48, 82], fo: [46, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
  ],

  'face-pull': () => [
    floor() + band([[94, 30], [76, 32], [62, 34]]) +
      figure({ he: [50, 24], ne: [50, 32], hi: [50, 62], el: [56, 34], ha: [62, 34], kn: [48, 82], fo: [44, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
    floor() + band([[94, 30], [78, 22], [64, 18]]) +
      figure({ he: [46, 26], ne: [48, 34], hi: [50, 62], el: [60, 20], ha: [64, 18], kn: [48, 82], fo: [44, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
  ],

  curl: () => [
    floor() + band([[42, FLOOR - 2], [42, 76], [42, 62]]) + band([[58, FLOOR - 2], [58, 76], [58, 62]]) +
      figure({ he: [50, 24], ne: [50, 32], hi: [50, 62], el: [44, 48], ha: [42, 62], el2: [56, 48], ha2: [58, 62], kn: [48, 82], fo: [44, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
    floor() + band([[42, FLOOR - 2], [40, 70], [40, 42]]) + band([[58, FLOOR - 2], [60, 70], [60, 42]]) +
      figure({ he: [50, 24], ne: [50, 32], hi: [50, 62], el: [44, 48], ha: [40, 40], el2: [56, 48], ha2: [60, 40], kn: [48, 82], fo: [44, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
  ],

  fly: () => [
    floor() + band([[14, 40], [32, 44], [50, 46]]) + band([[86, 40], [68, 44], [50, 46]]) +
      figure({ he: [50, 24], ne: [50, 32], hi: [50, 62], el: [36, 40], ha: [22, 42], el2: [64, 40], ha2: [78, 42], kn: [48, 82], fo: [44, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
    floor() + band([[14, 40], [30, 50], [46, 46]]) + band([[86, 40], [70, 50], [54, 46]]) +
      figure({ he: [50, 24], ne: [50, 32], hi: [50, 62], el: [42, 42], ha: [46, 46], el2: [58, 42], ha2: [54, 46], kn: [48, 82], fo: [44, FLOOR - 2], kn2: [54, 82], fo2: [58, FLOOR - 2] }),
  ],

  run: () => [
    floor() +
      figure({ he: [48, 22], ne: [48, 30], hi: [50, 58], el: [38, 44], ha: [32, 34], el2: [60, 46], ha2: [66, 56], kn: [36, 76], fo: [26, 88], kn2: [64, 76], fo2: [72, FLOOR - 2] }),
  ],

  walk: () => [
    floor() +
      figure({ he: [48, 22], ne: [48, 30], hi: [50, 58], el: [42, 46], ha: [38, 60], el2: [58, 46], ha2: [62, 58], kn: [42, 80], fo: [36, FLOOR - 2], kn2: [60, 80], fo2: [66, FLOOR - 2] }),
  ],

  mobility: () => [
    floor() +
      figure({ he: [50, 26], ne: [50, 34], hi: [52, 62], el: [40, 24], ha: [30, 18], el2: [62, 26], ha2: [72, 20], kn: [42, 82], fo: [34, FLOOR - 2], kn2: [62, 82], fo2: [70, FLOOR - 2] }),
  ],
};

/* -------------------------------------------------------------------------- */
/* Mappa esercizio → archetipo                                                 */
/* -------------------------------------------------------------------------- */

const EXERCISES = {
  'trazioni-prona-presa-media': ['hang-pull', {}, 'Trazioni: braccia distese, poi mento sopra la sbarra'],
  'trazioni-presa-larga': ['hang-pull', {}, 'Trazioni presa larga: braccia distese, poi mento sopra la sbarra'],
  'chin-up-presa-supina-stretta': ['hang-pull', {}, 'Chin-up presa stretta: braccia distese, poi mento sopra la sbarra'],
  'chin-up-presa-supina': ['hang-pull', {}, 'Chin-up: braccia distese, poi mento sopra la sbarra'],
  'dead-hang': ['hang-hold', {}, 'Dead hang: sospensione a braccia distese'],
  'rematore-inverso-trx': ['row', {}, 'Rematore inverso: braccia distese, poi maniglie alle costole'],
  'rematore-inverso-trx-piedi-rialzati': ['row', { elevated: true }, 'Rematore piedi rialzati: corpo orizzontale, tirata alle costole'],
  'rematore-trx-monobraccio': ['row', { elevated: true, oneArm: true }, 'Rematore monobraccio: gomito al fianco'],
  'push-up': ['pushup', {}, 'Push-up: braccia distese, poi petto vicino a terra'],
  'pushup-archer-o-pseudo-planche': ['pushup', { wide: true }, 'Push-up archer: mani larghe, discesa su un braccio'],
  'croci-elastico-o-pushup-presa-larga': ['fly', {}, 'Croci con manubri: braccia aperte, poi mani davanti allo sterno'],
  'pike-pushup-piedi-rialzati': ['pike', { feet: 20 }, 'Pike push-up piedi rialzati: bacino alto, testa verso terra'],
  'negative-hspu-muro-o-pike-pushup': ['hspu', {}, 'Negative di HSPU al muro: discesa controllata in verticale'],
  'dip-parallele-anelli': ['dip', {}, 'Dip alle parallele: braccia distese, poi gomiti a 90 gradi'],
  'dip-panche-o-diamond-pushup': ['pushup', {}, 'Diamond push-up: braccia distese, poi petto vicino alle mani'],
  'dip-panche': ['bench-dip', {}, 'Dip tra due panche: braccia distese, poi gomiti a 90 gradi'],
  'dip-panche-piedi-rialzati': ['bench-dip', { feet: 24 }, 'Dip tra panche piedi rialzati: gomiti a 90 gradi'],
  'bulgarian-split-squat': ['split-squat', {}, 'Bulgarian split squat: in piedi, poi coscia parallela a terra'],
  'step-up-box-alto': ['step-up', {}, 'Step-up: piede sul box, poi in piedi sopra'],
  'sissy-squat': ['sissy', {}, 'Sissy squat: in piedi, poi ginocchia avanti con anca estesa'],
  'wall-sit': ['wallsit', {}, 'Wall sit: schiena al muro, cosce parallele a terra, ginocchia a 90 gradi'],
  'shrimp-squat-o-skater-squat': ['shrimp', {}, 'Shrimp squat: in piedi, poi ginocchio posteriore a terra'],
  'nordic-curl': ['nordic', {}, 'Nordic curl: busto eretto, poi discesa in blocco'],
  'hip-thrust-monopodalico': ['hip-thrust', {}, 'Hip thrust monopodalico: bacino in basso, poi anca estesa'],
  'single-leg-rdl': ['rdl', {}, 'Single-leg RDL: in piedi, poi busto e gamba libera in linea'],
  'calf-monopodalico-rialzo': ['calf', {}, 'Calf in piedi: tallone sotto il gradino, poi in punta'],
  'calf-monopodalico-seduto': ['calf', { seated: true }, 'Calf seduto: tallone giù, poi in punta'],
  'hollow-hold': ['hollow', {}, 'Hollow hold: lombare a terra, braccia e gambe distese'],
  'hanging-leg-raise': ['leg-raise', {}, 'Hanging leg raise: gambe distese, poi anche a 90 gradi'],
  'ab-wheel-o-rollout-trx': ['ab-wheel', {}, 'Ab wheel: in ginocchio, poi corpo esteso con lombare neutra'],
  'rollout-trx': ['ab-wheel', {}, 'Rollout al TRX: braccia tese davanti, poi oltre la testa con lombare neutra'],
  'l-sit': ['lsit', {}, 'L-sit: mani a terra, gambe distese davanti, spalle depresse'],
  'verticale-al-muro': ['handstand', {}, 'Verticale al muro: corpo in linea sopra le mani'],
  'alzate-laterali-elastico': ['band-raise', {}, 'Alzate laterali: braccia lungo i fianchi, poi all altezza delle spalle'],
  'face-pull-elastico': ['face-pull', {}, 'Face pull: braccia distese, poi gomiti alti verso la fronte'],
  'curl-elastico-presa-neutra': ['curl', {}, 'Curl con manubri: braccia distese, poi avambraccio flesso'],
  'camminata-mobilita-dinamica': ['walk', {}, 'Camminata con mobilità dinamica'],
  'corsa-continua-piano': ['run', {}, 'Corsa continua in piano'],
  'mobilita-anche-torace-spalle': ['mobility', {}, 'Mobilità di anche, torace e spalle'],
  'zona-2-conclusiva': ['run', {}, 'Zona 2 conclusiva'],
};


/* -------------------------------------------------------------------------- */
/* Mappa gradino → archetipo                                                   */
/* -------------------------------------------------------------------------- */

/*
 * Una figura per gradino, non per esercizio.
 *
 * Il disegno seguiva l'esercizio: al blocco A2 del giovedì il titolo diceva
 * «Push-up archer», il livello vero era il 3 — push-up declinati — e
 * l'illustrazione continuava a mostrare gli archer. Scendere di livello non
 * cambiava niente di quello che si vedeva.
 *
 * Molti gradini condividono la stessa posa, e non è una scorciatoia: fra
 * «trazioni complete» e «trazioni con pausa 1" in alto» il corpo fa la stessa
 * forma, la differenza è il tempo. La figura mostra la forma, il nome del
 * gradino dice il tempo. Dove invece cambia la forma — piedi a terra o
 * rialzati, due gambe o una, appoggio o libero — cambia anche il disegno.
 */
const STEPS = {
  /* Trazione verticale: la forma è una sola, cambia assistenza e tempo. */
  'vertical-pull-l1': ['hang-pull', {}, 'Trazioni assistite con elastico'],
  'vertical-pull-l2': ['hang-pull', {}, 'Trazioni negative: discesa lenta dalla presa alta'],
  'vertical-pull-l3': ['hang-pull', {}, 'Trazioni complete: braccia distese, poi mento sopra la sbarra'],
  'vertical-pull-l4': ['hang-pull', {}, 'Trazioni con pausa in alto'],
  'vertical-pull-l5': ['hang-pull', {}, 'Archer pull-up: salita spostata su un braccio'],
  'vertical-pull-l6': ['hang-pull', {}, 'Trazioni zavorrate'],

  /* Trazione orizzontale: cambiano l inclinazione, i piedi e le braccia. */
  'horizontal-pull-l1': ['row', {}, 'Rematore inverso con i piedi a terra'],
  'horizontal-pull-l2': ['row', {}, 'Rematore TRX a 45 gradi'],
  'horizontal-pull-l3': ['row', {}, 'Rematore TRX orizzontale'],
  'horizontal-pull-l4': ['row', { elevated: true }, 'Rematore con i piedi rialzati e pausa'],
  'horizontal-pull-l5': ['row', { oneArm: true }, 'Rematore monobraccio'],
  'horizontal-pull-l6': ['row', { elevated: true, oneArm: true }, 'Rematore monobraccio con i piedi rialzati'],

  /* Spinta orizzontale: cambiano appoggio, piedi e larghezza delle mani. */
  'horizontal-push-l1': ['pushup', { hands: 22 }, 'Push-up con le mani su un rialzo'],
  'horizontal-push-l2': ['pushup', {}, 'Push-up a terra'],
  'horizontal-push-l3': ['pushup', { feet: 22 }, 'Push-up declinati: piedi su un rialzo'],
  'horizontal-push-l4': ['pushup', {}, 'Pseudo-planche push-up: mani basse, spalle avanti'],
  'horizontal-push-l5': ['pushup', { wide: true }, 'Archer push-up: mani larghe, discesa su un braccio'],
  'horizontal-push-l6': ['pushup', {}, 'Push-up zavorrati'],

  /* Spinta verticale: dal pike alla verticale al muro. */
  'vertical-push-l1': ['pike', { feet: 0 }, 'Pike push-up con i piedi a terra'],
  'vertical-push-l2': ['pike', { feet: 20 }, 'Pike push-up con i piedi rialzati'],
  'vertical-push-l3': ['hspu', {}, 'Negative di HSPU al muro: solo la discesa'],
  'vertical-push-l4': ['hspu', {}, 'HSPU al muro parziali'],
  'vertical-push-l5': ['hspu', {}, 'HSPU al muro complete'],
  'vertical-push-l6': ['hspu', {}, 'HSPU con deficit'],

  /* Dip: panca, parallele, anelli. */
  'dip-l1': ['bench-dip', {}, 'Dip tra due panche'],
  'dip-l2': ['dip', {}, 'Dip negativi alle parallele: solo la discesa'],
  'dip-l3': ['dip', {}, 'Dip completi alle parallele'],
  'dip-l4': ['dip', {}, 'Dip con pausa in basso'],
  'dip-l5': ['dip', {}, 'Dip agli anelli'],
  'dip-l6': ['dip', {}, 'Dip zavorrati'],

  /* Squat monopodalico: dallo split squat al pistol. */
  'single-leg-squat-l1': ['split-squat', { rearElevated: false }, 'Split squat con il piede dietro a terra'],
  'single-leg-squat-l2': ['split-squat', {}, 'Bulgarian split squat: piede dietro sulla panca'],
  'single-leg-squat-l3': ['split-squat', {}, 'Bulgarian split squat con pausa in basso'],
  'single-leg-squat-l4': ['shrimp', {}, 'Skater squat: ginocchio dietro verso terra'],
  'single-leg-squat-l5': ['shrimp', {}, 'Shrimp squat: ginocchio dietro che tocca terra'],
  'single-leg-squat-l6': ['shrimp', {}, 'Pistol squat: accosciata su una gamba'],

  /* Catena posteriore: glute bridge e nordic curl. */
  'posterior-chain-l1': ['hip-thrust', {}, 'Glute bridge monopodalico a terra'],
  'posterior-chain-l2': ['nordic', {}, 'Nordic eccentrico assistito con elastico'],
  'posterior-chain-l3': ['nordic', {}, 'Nordic eccentrico completo'],
  'posterior-chain-l4': ['nordic', {}, 'Nordic eccentrico lento'],
  'posterior-chain-l5': ['nordic', {}, 'Nordic con risalita assistita'],
  'posterior-chain-l6': ['nordic', {}, 'Nordic completo'],

  /* Core: dal plank all ab wheel. */
  'core-l1': ['hollow', {}, 'Plank: corpo in linea sugli avambracci'],
  'core-l2': ['hollow', {}, 'Hollow hold con le ginocchia piegate'],
  'core-l3': ['hollow', {}, 'Hollow hold completo'],
  'core-l4': ['leg-raise', {}, 'Hanging knee raise: ginocchia al petto'],
  'core-l5': ['leg-raise', {}, 'Hanging leg raise: gambe distese'],
  'core-l6': ['ab-wheel', {}, 'Ab wheel completo'],

  /* Hip thrust: due gambe, poi una. */
  'hip-thrust-l1': ['hip-thrust', {}, 'Glute bridge a terra a due gambe'],
  'hip-thrust-l2': ['hip-thrust', {}, 'Hip thrust con le spalle sulla panca, due gambe'],
  'hip-thrust-l3': ['hip-thrust', {}, 'Glute bridge monopodalico a terra'],
  'hip-thrust-l4': ['hip-thrust', {}, 'Hip thrust monopodalico con le spalle sulla panca'],
  'hip-thrust-l5': ['hip-thrust', {}, 'Hip thrust monopodalico con pausa in alto'],
  'hip-thrust-l6': ['hip-thrust', {}, 'Hip thrust monopodalico zavorrato'],

  /* Hip hinge: il movimento d anca, a due gambe e poi a una. */
  'hip-hinge-l1': ['rdl', {}, 'Hip hinge a due gambe con il bastone'],
  'hip-hinge-l2': ['rdl', {}, 'Stacco rumeno a due gambe a corpo libero'],
  'hip-hinge-l3': ['rdl', {}, 'Stacco rumeno su una gamba con mano d appoggio'],
  'hip-hinge-l4': ['rdl', {}, 'Stacco rumeno su una gamba a corpo libero'],
  'hip-hinge-l5': ['rdl', {}, 'Stacco rumeno su una gamba con pausa in basso'],
  'hip-hinge-l6': ['rdl', {}, 'Stacco rumeno su una gamba zavorrato'],

  /* Polpacci: in piedi, due gambe o una. */
  'calf-l1': ['calf', {}, 'Calf a due gambe, range parziale'],
  'calf-l2': ['calf', {}, 'Calf a due gambe, range completo'],
  'calf-l3': ['calf', {}, 'Calf su una gamba, range parziale'],
  'calf-l4': ['calf', {}, 'Calf su una gamba, range completo'],
  'calf-l5': ['calf', {}, 'Calf su una gamba con pausa in basso'],
  'calf-l6': ['calf', {}, 'Calf su una gamba zavorrato'],

  /* Step-up: cambia l altezza del box. */
  'step-up-l1': ['step-up', { height: 16 }, 'Step-up su box a meta tibia'],
  'step-up-l2': ['step-up', { height: 24 }, 'Step-up su box all altezza del ginocchio'],
  'step-up-l3': ['step-up', { height: 28 }, 'Step-up con discesa lenta'],
  'step-up-l4': ['step-up', { height: 34 }, 'Step-up su box sopra il ginocchio'],
  'step-up-l5': ['step-up', { height: 34 }, 'Step-up con pausa in alto'],
  'step-up-l6': ['step-up', { height: 34 }, 'Step-up zavorrato'],

  /* Sissy squat: cambia l appoggio. */
  'sissy-squat-l1': ['sissy', {}, 'Sissy squat con due mani d appoggio'],
  'sissy-squat-l2': ['sissy', {}, 'Sissy squat con una mano d appoggio'],
  'sissy-squat-l3': ['sissy', {}, 'Sissy squat a corpo libero'],
  'sissy-squat-l4': ['sissy', {}, 'Sissy squat con pausa in basso'],
  'sissy-squat-l5': ['sissy', {}, 'Sissy squat a braccia incrociate'],
  'sissy-squat-l6': ['sissy', {}, 'Sissy squat con eccentrica lenta'],

  /* Verticale: dal plank a mani alte alla verticale libera. */
  'handstand-l1': ['pike', { feet: 0 }, 'Plank a mani alte contro il muro'],
  'handstand-l2': ['handstand', {}, 'Verticale al muro con la schiena al muro'],
  'handstand-l3': ['handstand', {}, 'Verticale al muro con la pancia al muro'],
  'handstand-l4': ['handstand', {}, 'Verticale al muro con una gamba staccata'],
  'handstand-l5': ['handstand', {}, 'Tentativi di verticale libera'],
  'handstand-l6': ['handstand', {}, 'Verticale libera tenuta'],

  /* Wall sit: cambia l angolo e il numero di gambe. */
  'wall-sit-l1': ['wallsit', {}, 'Wall sit sopra il parallelo'],
  'wall-sit-l2': ['wallsit', {}, 'Wall sit con le cosce parallele a terra'],
  'wall-sit-l3': ['wallsit', {}, 'Wall sit con le braccia incrociate'],
  'wall-sit-l4': ['wallsit', {}, 'Wall sit con una gamba sollevata'],
  'wall-sit-l5': ['wallsit', {}, 'Wall sit su una gamba'],
  'wall-sit-l6': ['wallsit', {}, 'Wall sit su una gamba con il piede su un rialzo'],

  /* L-sit: si sale aprendo le gambe. */
  'l-sit-l1': ['lsit', {}, 'Appoggio a terra con i piedi che sfiorano'],
  'l-sit-l2': ['lsit', {}, 'Tuck sit con le ginocchia al petto'],
  'l-sit-l3': ['lsit', {}, 'Advanced tuck con il bacino sotto'],
  'l-sit-l4': ['lsit', {}, 'L-sit con una gamba distesa'],
  'l-sit-l5': ['lsit', {}, 'L-sit completo'],
  'l-sit-l6': ['lsit', {}, 'L-sit ai parallettes'],

  /* Sospensione: la forma è una, cambia la presa. */
  'hang-l1': ['hang-hold', {}, 'Sospensione con i piedi che sfiorano terra'],
  'hang-l2': ['hang-hold', {}, 'Dead hang a due mani'],
  'hang-l3': ['hang-hold', {}, 'Dead hang con presa a pinza'],
  'hang-l4': ['hang-hold', {}, 'Dead hang a una mano con l altra sul polso'],
  'hang-l5': ['hang-hold', {}, 'Dead hang a una mano'],
  'hang-l6': ['hang-hold', {}, 'Dead hang a una mano su asciugamano'],
};

/* -------------------------------------------------------------------------- */

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(OUT)) {
  if (file.endsWith('.svg')) unlinkSync(join(OUT, file));
}

let count = 0;
for (const [slug, [archetype, options, label]] of Object.entries(EXERCISES)) {
  const build = ARCHETYPES[archetype];
  if (build === undefined) throw new Error(`Archetipo sconosciuto: ${archetype}`);
  writeFileSync(join(OUT, `${slug}.svg`), `${render(build(options), label)}\n`, 'utf8');
  count += 1;
}

mkdirSync(STEPS_OUT, { recursive: true });
for (const file of readdirSync(STEPS_OUT)) {
  if (file.endsWith('.svg')) unlinkSync(join(STEPS_OUT, file));
}

let steps = 0;
for (const [slug, [archetype, options, label]] of Object.entries(STEPS)) {
  const build = ARCHETYPES[archetype];
  if (build === undefined) throw new Error(`Archetipo sconosciuto: ${archetype}`);
  writeFileSync(join(STEPS_OUT, `${slug}.svg`), `${render(build(options), label)}\n`, 'utf8');
  steps += 1;
}

console.log(`Generate ${count} illustrazioni di esercizi e ${steps} di gradini.`);
