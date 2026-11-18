#!/usr/bin/env node
/**
 * Prove di stile delle figure (media/STYLE_TRIALS.md, 2026-11-18).
 *
 *   node scripts/style-trials.mjs
 *
 * Rende le direzioni A «Linea», B «Sagoma», C «Manichino» e C0 (C senza
 * traccia) sui sette esercizi del set di prova, in
 * `preview/stile-2026-11-18/`. Non tocca `src/assets/` e non importa il
 * generatore di produzione, che cancella quella cartella quando parte: le
 * pose sono copiate da `scripts/generate-exercise-svg.mjs` così come sono
 * oggi (§1.11, «si giudica lo stile, non le pose»).
 *
 * Nessun colore dentro gli SVG: ogni gruppo ha una classe `fig-*` e disegna
 * in `currentColor` (§1.2). Lo stacco fra strati è un ritaglio con `mask`,
 * mai una pennellata del colore di fondo (§1.3).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = new URL('../preview/stile-2026-11-18/', import.meta.url).pathname;
const PANEL = 100;
const GAP = 10;
const HEIGHT = 110;
const FLOOR = 102;
const CANVAS = 2 * PANEL + GAP;

/* -------------------------------------------------------------------------- */
/* Pose di oggi (copiate dal generatore)                                       */
/* -------------------------------------------------------------------------- */

const pavimento = { kind: 'floor' };
const sbarra = (y, from, to) => ({ kind: 'bar', y, from, to });
const panca = (x, y, w, h) => ({ kind: 'box', x, y, w, h });
const manubrio = (x, y, hand) => ({ kind: 'dumbbell', x, y, hand, layer: 'top' });
const campana = (x, y, hand) => ({ kind: 'kettlebell', x, y, hand, layer: 'front' });
const ancoraggio = { kind: 'rig', y: 10, from: 42, to: 58 };
const cinghia = (from, to, hand) => ({ kind: 'strap', from, to, hand, layer: 'front' });

const F = FLOOR - 2;
const SET = [
  {
    slug: 'scapular-pull-up',
    label: 'Scapular pull-up',
    view: 'front',
    difetto: 'nessuno (verificata)',
    panels: [
      {
        gear: [sbarra(12, 26, 74)],
        pose: { he: [50, 36], ne: [50, 44], hi: [50, 76], sh: [44, 46], el: [36, 30], ha: [34, 14], sh2: [56, 46], el2: [64, 30], ha2: [66, 14], kn: [46, 92], fo: [44, 100], kn2: [54, 92], fo2: [56, 100] },
      },
      {
        gear: [sbarra(12, 26, 74)],
        pose: { he: [50, 30], ne: [50, 38], hi: [50, 70], sh: [44, 40], el: [37, 28], ha: [34, 14], sh2: [56, 40], el2: [63, 28], ha2: [66, 14], kn: [46, 86], fo: [44, 96], kn2: [54, 86], fo2: [56, 96] },
      },
    ],
  },
  {
    slug: 'military-press-manubri',
    label: 'Military press con manubri',
    view: 'front',
    difetto: '§4.26: vista frontale (R3), i due manubri si leggono come una barra (R4)',
    panels: [
      {
        gear: [pavimento, manubrio(38, 38, 'ha'), manubrio(62, 38, 'ha2')],
        pose: { he: [50, 26], ne: [50, 34], hi: [50, 64], sh: [45, 36], el: [39, 46], ha: [38, 38], sh2: [55, 36], el2: [61, 46], ha2: [62, 38], kn: [48, 84], fo: [46, F], kn2: [54, 84], fo2: [56, F] },
      },
      {
        gear: [pavimento, manubrio(42, 10, 'ha'), manubrio(58, 10, 'ha2')],
        pose: { he: [50, 26], ne: [50, 34], hi: [50, 64], sh: [45, 36], el: [43, 24], ha: [42, 10], sh2: [55, 36], el2: [57, 24], ha2: [58, 10], kn: [48, 84], fo: [46, F], kn2: [54, 84], fo2: [56, F] },
      },
    ],
  },
  {
    slug: 'goblet-squat',
    label: 'Goblet squat',
    view: 'front',
    difetto: '§4.8: mezzo squat, vista frontale',
    panels: [
      {
        gear: [pavimento, campana(50, 36, 'ha')],
        pose: { he: [50, 22], ne: [50, 30], hi: [50, 62], el: [41, 44], ha: [45, 40], el2: [59, 44], ha2: [55, 40], kn: [48, 82], fo: [46, F], kn2: [54, 82], fo2: [56, F] },
      },
      {
        gear: [pavimento, campana(47, 50, 'ha')],
        pose: { he: [47, 34], ne: [47, 42], hi: [52, 76], el: [38, 58], ha: [42, 54], el2: [56, 58], ha2: [52, 54], kn: [36, 84], fo: [40, F], kn2: [64, 84], fo2: [62, F] },
      },
    ],
  },
  {
    slug: 'hollow-hold',
    label: 'Hollow hold',
    view: 'side',
    facing: 1,
    nessunPiede: true,
    difetto: '§4.27: corpo sospeso sopra il pavimento (R10)',
    panels: [
      {
        gear: [pavimento],
        pose: { he: [28, 68], ne: [36, 74], hi: [60, 88], sh: [36, 74], el: [22, 72], ha: [10, 70], kn: [76, 78], fo: [92, 68], kn2: [76, 82], fo2: [92, 72] },
      },
    ],
  },
  {
    slug: 'hip-thrust-panca-bilaterale',
    label: 'Hip thrust a due gambe',
    view: 'side',
    facing: 1,
    difetto: 'nessuno (verificata)',
    panels: [
      {
        gear: [pavimento, panca(6, 77, 24, FLOOR - 77), campana(51, 72, 'ha')],
        pose: { he: [21, 70], ne: [30, 73], hi: [49, 90], kn: [63, 76], fo: [76, F], kn2: [67, 79], fo2: [84, F], el: [40, 66], ha: [48, 71] },
      },
      {
        gear: [pavimento, panca(6, 77, 24, FLOOR - 77), campana(63, 60, 'ha')],
        pose: { he: [21, 70], ne: [30, 73], hi: [56, 73], kn: [76, 73], fo: [76, F], kn2: [80, 76], fo2: [84, F], el: [45, 63], ha: [59, 61] },
      },
    ],
  },
  {
    slug: 'pull-over-trx',
    label: 'Pull-over al TRX',
    view: 'side',
    facing: -1,
    difetto: '§4.24: collo a 66°, cinghie sul busto. Deve vedersi',
    panels: [
      {
        gear: [ancoraggio, pavimento, cinghia([50, 10], [32, 26], 'ha'), cinghia([50, 10], [35, 26], 'ha2')],
        pose: { he: [39, 48], ne: [47, 47], hi: [61, 70], el: [38, 32], ha: [32, 26], el2: [41, 34], ha2: [35, 26], kn: [63, 86], fo: [67, F], kn2: [67, 86], fo2: [71, F] },
      },
      {
        gear: [ancoraggio, pavimento, cinghia([50, 10], [43, 66], 'ha'), cinghia([50, 10], [46, 66], 'ha2')],
        pose: { he: [33, 42], ne: [37, 49], hi: [55, 71], el: [40, 59], ha: [43, 66], el2: [43, 59], ha2: [46, 66], kn: [57, 86], fo: [61, F], kn2: [61, 86], fo2: [65, F] },
      },
    ],
  },
  {
    slug: 'circonduzioni-spalle',
    label: 'Circonduzioni di spalla (controllo)',
    view: 'side',
    facing: -1,
    difetto: 'braccio a 6,0 dal centro della testa: deciderà Alessio',
    panels: [
      {
        gear: [pavimento],
        pose: { he: [47, 24], ne: [50, 32], hi: [50, 60], sh: [51, 34], kn: [50, 80], fo: [50, F], kn2: [53, 80], fo2: [54, F], el: [55, 47], ha: [58, 59] },
      },
      {
        gear: [pavimento],
        pose: { he: [47, 24], ne: [50, 32], hi: [50, 60], sh: [51, 34], kn: [50, 80], fo: [50, F], kn2: [53, 80], fo2: [54, F], el: [54, 20], ha: [56, 6] },
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Stili                                                                       */
/* -------------------------------------------------------------------------- */

const STYLES = {
  A: { name: 'A · Linea', limb: 6, torso: 8, headR: 6, joints: false, gearClass: 'fig-gear', foot: 6, ghost: false, sagoma: false },
  B: { name: 'B · Sagoma', limb: 6, torso: 8, headR: 6, joints: false, gearClass: 'fig-gear', foot: 8, ghost: false, sagoma: true },
  C: { name: 'C · Manichino', limb: 5, torso: 5, headR: 6, joints: true, gearClass: 'fig-gear-c', foot: 5, ghost: true, sagoma: false },
  C0: { name: 'C0 · Manichino senza traccia', limb: 5, torso: 5, headR: 6, joints: true, gearClass: 'fig-gear-c', foot: 5, ghost: false, sagoma: false },
};

const LAYER = { ground: 0, ghost: 1, far: 2, torso: 3, front: 4, nearLeg: 5, nearArm: 6, top: 7 };

/* -------------------------------------------------------------------------- */
/* Geometria                                                                   */
/* -------------------------------------------------------------------------- */

const r1 = (n) => Math.round(n * 100) / 100;
const pt = ([x, y]) => `${r1(x)},${r1(y)}`;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const along = (a, b, d) => {
  const l = dist(a, b) || 1;
  return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l];
};

/*
 * Un elemento disegnabile: sa disegnarsi in `currentColor` e, per le maschere,
 * in nero allargato di 2 unità per lato (lo stacco di §1.3).
 */
const line = (points, width, cap = 'round') => ({
  draw: (paint = 'currentColor', grow = 0) =>
    `<polyline points="${points.map(pt).join(' ')}" fill="none" stroke="${paint}" stroke-width="${r1(width + grow)}" stroke-linecap="${grow > 0 ? 'round' : cap}" stroke-linejoin="round"/>`,
});
const disc = ([x, y], r) => ({
  draw: (paint = 'currentColor', grow = 0) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r + grow / 2)}" fill="${paint}"/>`,
});
const ring = ([x, y], r, width) => ({
  draw: (paint = 'currentColor', grow = 0) =>
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="none" stroke="${paint}" stroke-width="${r1(width + grow)}"/>`,
});
const shape = (d, rounding = 0) => ({
  draw: (paint = 'currentColor', grow = 0) =>
    `<path d="${d}" fill="${paint}"${rounding + grow > 0 ? ` stroke="${paint}" stroke-width="${r1(rounding + grow)}" stroke-linejoin="round"` : ''}/>`,
});
const rect = (x, y, w, h, rx, filled, width = 3) => ({
  draw: (paint = 'currentColor', grow = 0) =>
    filled
      ? `<rect x="${r1(x - grow / 2)}" y="${r1(y - grow / 2)}" width="${r1(w + grow)}" height="${r1(h + grow)}" rx="${rx}" fill="${paint}"/>`
      : `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" fill="none" stroke="${paint}" stroke-width="${r1(width + grow)}"/>`,
});
const curve = (d, width) => ({
  draw: (paint = 'currentColor', grow = 0) =>
    `<path d="${d}" fill="none" stroke="${paint}" stroke-width="${r1(width + grow)}" stroke-linecap="round"/>`,
});

/** Capsula rastremata da `a` (raggio ra) a `b` (raggio rb): un segmento di B. */
function capsule(a, b, ra, rb) {
  const l = dist(a, b) || 1;
  const nx = -(b[1] - a[1]) / l;
  const ny = (b[0] - a[0]) / l;
  const p = (c, r, s) => [c[0] + nx * r * s, c[1] + ny * r * s];
  const quad = `M ${pt(p(a, ra, 1))} L ${pt(p(b, rb, 1))} L ${pt(p(b, rb, -1))} L ${pt(p(a, ra, -1))} Z`;
  const circles = `M ${r1(a[0] - ra)} ${r1(a[1])} a ${r1(ra)} ${r1(ra)} 0 1 0 ${r1(2 * ra)} 0 a ${r1(ra)} ${r1(ra)} 0 1 0 ${r1(-2 * ra)} 0 M ${r1(b[0] - rb)} ${r1(b[1])} a ${r1(rb)} ${r1(rb)} 0 1 0 ${r1(2 * rb)} 0 a ${r1(rb)} ${r1(rb)} 0 1 0 ${r1(-2 * rb)} 0`;
  return shape(`${quad} ${circles}`);
}

/* -------------------------------------------------------------------------- */
/* Costruzione di un pannello                                                  */
/* -------------------------------------------------------------------------- */

function figura(spec, pose, style) {
  const out = [];
  const add = (layer, cls, element) => out.push({ layer, cls, element });
  const sh = pose.sh ?? pose.ne;
  const sh2 = pose.sh2 ?? sh;
  const front = spec.view === 'front';
  const farCls = front ? 'fig-near' : 'fig-far';

  /* Tronco: piatto al collo, a 2 unità almeno dal bordo della testa. */
  const gapTesta = style.headR + 2 + (style.sagoma ? 3 : style.torso / 2);
  const inizio = dist(pose.he, pose.ne) >= gapTesta ? pose.ne : along(pose.ne, pose.hi, gapTesta - dist(pose.he, pose.ne));

  if (style.sagoma) {
    const larghezze = front ? [17, 13] : [11, 9];
    const l = dist(inizio, pose.hi) || 1;
    const nx = -(pose.hi[1] - inizio[1]) / l;
    const ny = (pose.hi[0] - inizio[0]) / l;
    const off = (c, w) => [[c[0] + (nx * (w - 6)) / 2, c[1] + (ny * (w - 6)) / 2], [c[0] - (nx * (w - 6)) / 2, c[1] - (ny * (w - 6)) / 2]];
    const top = along(inizio, pose.hi, 3);
    const [a1, a2] = off(top, larghezze[0]);
    const vita = along(inizio, pose.hi, l * 0.6);
    const [v1, v2] = off(vita, front ? 11 : 9);
    const [b1, b2] = off(pose.hi, larghezze[1]);
    add(LAYER.torso, 'fig-near', shape(`M ${pt(a1)} L ${pt(v1)} L ${pt(b1)} L ${pt(b2)} L ${pt(v2)} L ${pt(a2)} Z`, 6));
    add(LAYER.torso, 'fig-near', {
      draw: (paint = 'currentColor', grow = 0) =>
        `<ellipse cx="${pose.he[0]}" cy="${pose.he[1]}" rx="${r1(6 + grow / 2)}" ry="${r1(6.8 + grow / 2)}" fill="${paint}"/>`,
    });
  } else {
    add(LAYER.torso, 'fig-near', line([inizio, pose.hi], style.torso, 'butt'));
    add(LAYER.torso, 'fig-near', disc(pose.he, style.headR));
  }

  const arto = (layer, cls, punti, raggi) => {
    if (style.sagoma) {
      for (let i = 0; i < punti.length - 1; i += 1) {
        add(layer, cls, capsule(punti[i], punti[i + 1], raggi[i] / 2, raggi[i + 1] / 2));
      }
      add(layer, cls, disc(punti[punti.length - 1], 2.5));
    } else {
      add(layer, cls, line(punti, style.limb));
      if (style.joints) for (const j of punti.slice(0, -1)) add(layer, cls, disc(j, 4));
      if (style.joints) add(layer, cls, disc(punti[punti.length - 1], 3));
    }
  };
  const piede = (layer, cls, caviglia) => {
    if (spec.nessunPiede) return;
    if (FLOOR - caviglia[1] > 3 + 1) return;
    const verso = spec.facing ?? 1;
    if (front) {
      if (style.sagoma) {
        add(layer, cls, {
          draw: (paint = 'currentColor', grow = 0) =>
            `<ellipse cx="${caviglia[0]}" cy="${caviglia[1] + 1}" rx="${r1(4 + grow / 2)}" ry="${r1(2.5 + grow / 2)}" fill="${paint}"/>`,
        });
      }
      return;
    }
    if (style.sagoma) {
      const [x, y] = caviglia;
      add(layer, cls, shape(`M ${x} ${y - 2} L ${x + verso * 8} ${y + 1.5} L ${x} ${y + 1.5} Z`, 1));
    } else {
      add(layer, cls, line([caviglia, [caviglia[0] + verso * style.foot, caviglia[1]]], style.limb));
    }
  };

  if (pose.ha2) arto(LAYER.far, farCls, [sh2, pose.el2, pose.ha2], [6, 4.5, 3.5]);
  if (pose.fo2) {
    arto(LAYER.far, farCls, [pose.hi, pose.kn2, pose.fo2], [9, 6.5, 4.5]);
    piede(LAYER.far, farCls, pose.fo2);
  }
  if (pose.fo) {
    arto(LAYER.nearLeg, 'fig-near', [pose.hi, pose.kn, pose.fo], [9, 6.5, 4.5]);
    piede(LAYER.nearLeg, 'fig-near', pose.fo);
  }
  if (pose.ha) arto(LAYER.nearArm, 'fig-near', [sh, pose.el, pose.ha], [6, 4.5, 3.5]);
  return out;
}

function attrezzo(item, style, gearCls) {
  const pieno = !style.sagoma;
  const layer = item.layer === 'top' ? LAYER.top : item.layer === 'front' ? LAYER.front : LAYER.ground;
  const el = (cls, element) => ({ layer, cls, element });
  switch (item.kind) {
    case 'floor':
      return [el('fig-ground', line([[6, FLOOR], [94, FLOOR]], 3))];
    case 'bar':
      return [el(gearCls, line([[item.from, item.y], [item.to, item.y]], 4))];
    case 'box':
      return [el(gearCls, rect(item.x, item.y, item.w, item.h, 2, false, 3))];
    case 'rig':
      return [el(gearCls, line([[item.from, item.y], [item.to, item.y]], 3))];
    case 'dumbbell': {
      /* Una «I» coricata: due manubri vicini restano due, non una barra. */
      const { x, y } = item;
      const dischi = pieno
        ? [rect(x - 6.5, y - 4, 3, 8, 1, true), rect(x + 3.5, y - 4, 3, 8, 1, true)]
        : [rect(x - 6.5, y - 4, 3, 8, 1, false, 2), rect(x + 3.5, y - 4, 3, 8, 1, false, 2)];
      return [el(gearCls, line([[x - 5, y], [x + 5, y]], 3)), ...dischi.map((d) => el(gearCls, d))];
    }
    case 'kettlebell': {
      const { x, y } = item;
      return [
        el(gearCls, pieno ? disc([x, y + 6], 6) : ring([x, y + 6], 6, 3)),
        el(gearCls, curve(`M ${x - 4} ${y + 2} Q ${x} ${y - 5} ${x + 4} ${y + 2}`, 3)),
      ];
    }
    case 'strap': {
      const [hx, hy] = item.to;
      return [
        el(gearCls, line([item.from, item.to], 2.5)),
        el(gearCls, disc(item.from, 2.5)),
        el(gearCls, pieno ? rect(hx - 1.5, hy - 3, 3, 6, 1, true) : rect(hx - 1.5, hy - 3, 3, 6, 1, false, 1.5)),
      ];
    }
    default:
      return [];
  }
}

/** Il fantasma di C: i segmenti mossi di almeno 4 unità, dove stavano prima. */
function fantasma(prima, dopo, style, gearPrima, spec) {
  const out = [];
  const segmenti = [['ne', 'hi'], ['sh', 'el'], ['el', 'ha'], ['sh2', 'el2'], ['el2', 'ha2'], ['hi', 'kn'], ['kn', 'fo'], ['hi', 'kn2'], ['kn2', 'fo2']];
  const get = (pose, k) => (k === 'sh' ? pose.sh ?? pose.ne : k === 'sh2' ? pose.sh2 ?? pose.sh ?? pose.ne : pose[k]);
  for (const [a, b] of segmenti) {
    const pa = get(prima, a);
    const pb = get(prima, b);
    const qa = get(dopo, a);
    const qb = get(dopo, b);
    if (!pa || !pb || !qa || !qb) continue;
    if (dist(pa, qa) >= 4 || dist(pb, qb) >= 4) {
      out.push({ layer: LAYER.ghost, cls: 'fig-ghost', element: line([pa, pb], style.limb) });
    }
  }
  for (const item of gearPrima) {
    if (item.hand === undefined) continue;
    if (dist(prima[item.hand], dopo[item.hand]) < 4) continue;
    for (const e of attrezzo(item, style, 'fig-ghost')) out.push({ ...e, layer: LAYER.ghost });
  }
  void spec;
  return out;
}

function pannello(spec, index, style, styleKey) {
  const { pose, gear } = spec.panels[index];
  const gearCls = style.gearClass;
  let items = [...gear.flatMap((g) => attrezzo(g, style, gearCls)), ...figura(spec, pose, style)];
  if (style.ghost && index === 1) {
    items = [...items, ...fantasma(spec.panels[0].pose, pose, style, spec.panels[0].gear, spec)];
  }

  /*
   * Lo stacco: ogni strato dagli arti lontani in su è ritagliato da quelli
   * sopra, con 2 unità per lato. Mai gli appoggi, mai il fantasma; vicino alle
   * mani, alle spalle e all'anca il ritaglio si richiude, perché lì il corpo
   * si attacca a sé stesso o a ciò che impugna.
   */
  const giunti = [pose.hi, pose.sh ?? pose.ne, pose.sh2 ?? pose.sh ?? pose.ne, pose.ha, pose.ha2, pose.ne].filter(Boolean);
  const defs = [];
  const gruppi = [];
  const livelli = [...new Set(items.map((i) => i.layer))].sort((a, b) => a - b);
  for (const livello of livelli) {
    const qui = items.filter((i) => i.layer === livello);
    const sopra = items.filter((i) => i.layer > livello && i.layer >= LAYER.far);
    const taglia = livello >= LAYER.far && sopra.length > 0;
    const id = `cut-${spec.slug}-${styleKey}-p${index + 1}-${livello}`;
    if (taglia) {
      defs.push(
        `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="130"><rect x="-10" y="-10" width="120" height="130" fill="white"/>${sopra
          .map((s) => s.element.draw('black', 4))
          .join('')}${giunti.map((g) => `<circle cx="${g[0]}" cy="${g[1]}" r="5" fill="white"/>`).join('')}</mask>`,
      );
    }
    const perClasse = new Map();
    for (const item of qui) perClasse.set(item.cls, `${perClasse.get(item.cls) ?? ''}${item.element.draw()}`);
    const corpo = [...perClasse].map(([cls, svg]) => `<g class="${cls}">${svg}</g>`).join('');
    gruppi.push(taglia ? `<g mask="url(#${id})">${corpo}</g>` : corpo);
  }
  const well = style.sagoma ? `<rect class="fig-well" x="0" y="0" width="${PANEL}" height="${HEIGHT}" rx="10" fill="currentColor"/>` : '';
  const datiPosa = Object.entries(pose)
    .map(([k, v]) => `${k}:${v[0]},${v[1]}`)
    .join(' ');
  return `<defs>${defs.join('')}</defs>${well}<g data-pose="${datiPosa}" data-view="${spec.view}">${gruppi.join('')}</g>`;
}

function svg(spec, styleKey) {
  const style = STYLES[styleKey];
  const n = spec.panels.length;
  const offset = n === 1 ? (CANVAS - PANEL) / 2 : 0;
  const body = spec.panels
    .map((_, i) => `<g transform="translate(${offset + i * (PANEL + GAP)},0)">${pannello(spec, i, style, styleKey)}</g>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${HEIGHT}" data-panels="${n}" role="img" aria-label="${spec.label}"><title>${spec.label}</title>${body}</svg>`;
}

/* -------------------------------------------------------------------------- */
/* Uscita e anteprima                                                          */
/* -------------------------------------------------------------------------- */

const tokens = readFileSync(new URL('../media/style-trials/tokens.css', import.meta.url), 'utf8');
const prodotti = {};
for (const key of Object.keys(STYLES)) {
  mkdirSync(join(OUT, key), { recursive: true });
  for (const spec of SET) {
    const markup = svg(spec, key);
    writeFileSync(join(OUT, key, `${spec.slug}.svg`), `${markup}\n`, 'utf8');
    prodotti[`${key}/${spec.slug}`] = markup;
  }
}

/* Gli id delle maschere devono restare unici quando la stessa figura compare più volte. */
let istanza = 0;
const inline = (markup) => {
  istanza += 1;
  return markup.replaceAll('cut-', `i${String(istanza)}-cut-`);
};

const card = (key, spec, tema) => {
  const markup = prodotti[`${key}/${spec.slug}`];
  const grigio = key === 'C' ? ' grigio' : '';
  return `
  <div class="card" data-theme="${tema}">
    <div class="sotto"><p>Testo e una pillola sotto la card, perché il vetro abbia qualcosa da sfocare.</p><span class="pillola">Inizia</span></div>
    <div class="vetro">
      <div class="ex-art piena">${inline(markup)}</div>
      <div class="riga">
        <div class="ex-art compatta">${inline(markup)}</div>
        <div class="ex-art mini" data-panels="${spec.panels.length}">${inline(markup)}</div>
      </div>
      <div class="metro" data-svg="${encodeURIComponent(markup)}">
        <span>a 1,5 m (150 px)</span><canvas data-w="150"></canvas>
        <span>riflessi, sudore (100 px)</span><canvas data-w="100"></canvas>
      </div>
      ${grigio ? `<div class="ex-art piena grigio">${inline(markup)}</div><p class="nota">C in scala di grigi</p>` : ''}
    </div>
    <p class="didascalia">${spec.slug} · ${STYLES[key].name} · ${tema === 'light' ? 'chiaro' : 'scuro'}<br/>Difetto di posa noto: ${spec.difetto}</p>
  </div>`;
};

const righe = SET.map(
  (spec) => `
<section>
  <h2>${spec.label} <small>${spec.slug}</small></h2>
  <div class="direzioni">
    ${Object.keys(STYLES)
      .map((key) => `<div class="direzione"><h3>${STYLES[key].name}</h3>${card(key, spec, 'light')}${card(key, spec, 'dark')}</div>`)
      .join('')}
  </div>
</section>`,
).join('');

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Prove di stile delle figure — 2026-11-18</title>
<style>
${tokens}
:root { --surface-l: rgb(255 255 255 / 0.6); --surface-d: rgb(21 27 35 / 0.6); }
[data-theme='light'] { --canvas: #f2f5f9; --surface: var(--surface-l); --ink: #0f1720; --dim: #556375; --accent: #0a5cc0; --well: rgb(255 255 255 / 0.92); }
[data-theme='dark'] { --canvas: #0b0f14; --surface: var(--surface-d); --ink: #eef3f8; --dim: #9fb0c0; --accent: #4cc2ff; --well: rgb(21 27 35 / 0.92); }
body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: #e7ebf0; color: #0f1720; }
h1 { font-size: 20px; } h2 { font-size: 17px; margin: 32px 0 8px; } h2 small { color: #556375; font-weight: 400; }
h3 { font-size: 13px; margin: 0 0 6px; color: #556375; }
.direzioni { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; }
.direzione { flex: 0 0 auto; }
.card { position: relative; width: 390px; padding: 16px; margin-bottom: 12px; background: var(--canvas); border-radius: 16px; color: var(--ink); }
.sotto { position: absolute; left: 16px; right: 16px; bottom: 60px; height: 50%; color: var(--dim); font-size: 13px; }
.pillola { display: inline-block; padding: 8px 20px; border-radius: 999px; background: var(--accent); color: white; font-weight: 600; }
.vetro { position: relative; border-radius: 28px; padding: 16px 0; background: var(--surface); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgb(255 255 255 / 0.4); }
.ex-art { background: transparent; }
.ex-art .fig-well { color: var(--well); }
.piena svg { display: block; width: 358px; height: auto; }
.riga { display: flex; gap: 12px; align-items: flex-end; margin: 12px 0 0 0; }
.compatta svg { display: block; height: 144px; width: auto; }
.mini { width: 80px; height: 80px; overflow: hidden; }
.mini svg { height: 80px; width: auto; }
.mini[data-panels='2'] svg { transform: translateX(-${(80 * (PANEL + GAP)) / HEIGHT}px); }
.metro { display: grid; grid-template-columns: 1fr; gap: 4px; margin-top: 12px; font-size: 11px; color: var(--dim); }
.metro canvas { width: 358px; height: auto; display: block; }
.grigio { filter: grayscale(1); margin-top: 12px; }
.nota, .didascalia { font-size: 11px; color: var(--dim); margin: 6px 0 0; }
</style>
</head>
<body>
<h1>Prove di stile delle figure — 2026-11-18</h1>
<p>Fuori dall'app: niente qui entra nel bundle. Specifica in <code>media/STYLE_TRIALS.md</code>. Pose di oggi, invariate: i difetti di posa sono nelle didascalie.</p>
${righe}
<script>
for (const box of document.querySelectorAll('.metro')) {
  const card = box.closest('.card');
  const markup = decodeURIComponent(box.dataset.svg);
  const tmp = document.createElement('div');
  tmp.className = 'ex-art';
  tmp.innerHTML = markup;
  card.appendChild(tmp);
  for (const g of tmp.querySelectorAll('[class^="fig-"]')) g.setAttribute('color', getComputedStyle(g).color);
  tmp.querySelector('svg').setAttribute('color', getComputedStyle(tmp).color);
  const data = new XMLSerializer().serializeToString(tmp.querySelector('svg'));
  tmp.remove();
  const img = new Image();
  img.onload = () => {
    for (const canvas of box.querySelectorAll('canvas')) {
      const w = Number(canvas.dataset.w);
      canvas.width = w;
      canvas.height = Math.round((w * ${HEIGHT}) / ${CANVAS});
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
}
</script>
</body>
</html>
`;
writeFileSync(join(OUT, 'index.html'), html, 'utf8');

/* Il riepilogo per scegliere: una riga per esercizio, una colonna per direzione. */
const tabella = (tema) => `
<div class="foglio" data-theme="${tema}">
  <div class="intestazione"><span></span>${Object.keys(STYLES).map((k) => `<b>${STYLES[k].name}</b>`).join('')}</div>
  ${SET.map(
    (spec) => `<div class="fila"><span class="nome">${spec.label}</span>${Object.keys(STYLES)
      .map((k) => `<div class="cella ex-art">${inline(prodotti[`${k}/${spec.slug}`])}</div>`)
      .join('')}</div>`,
  ).join('')}
</div>`;
writeFileSync(
  join(OUT, 'riepilogo.html'),
  `<!doctype html><html lang="it"><head><meta charset="utf-8"/><title>Prove di stile — riepilogo</title><style>
${tokens}
[data-theme='light'] { --canvas: #eef2f7; --surface: rgb(255 255 255 / 0.72); --ink: #0f1720; --dim: #556375; --well: rgb(255 255 255 / 0.92); }
[data-theme='dark'] { --canvas: #0b0f14; --surface: rgb(30 39 50 / 0.66); --ink: #eef3f8; --dim: #9fb0c0; --well: rgb(21 27 35 / 0.92); }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
.foglio { background: var(--canvas); color: var(--ink); padding: 16px; }
.intestazione, .fila { display: grid; grid-template-columns: 150px repeat(4, 260px); gap: 12px; align-items: center; }
.intestazione b { font-size: 14px; }
.fila { margin-top: 10px; }
.nome { font-size: 13px; color: var(--dim); }
.cella { background: var(--surface); border-radius: 22px; padding: 8px; border: 1px solid rgb(255 255 255 / 0.4); }
.ex-art { background: var(--surface); }
.ex-art .fig-well { color: var(--well); }
.cella svg { display: block; width: 100%; height: auto; }
</style></head><body>${tabella('light')}${tabella('dark')}</body></html>
`,
  'utf8',
);
console.log(`Prove rese in ${OUT}: ${String(Object.keys(prodotti).length)} SVG e index.html.`);
