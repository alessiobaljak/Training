/**
 * Genera le icone della PWA da un unico marchio vettoriale.
 *
 * Il marchio è la scala di progressione: sei barre che salgono, l'ultima
 * accesa. Nessuna risorsa esterna, nessun font: solo forme, così l'icona
 * resta identica su ogni telefono.
 *
 *   node scripts/generate-icons.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { launchOptions } from './chromium.mjs';

const OUT = 'public/icons';

const CANVAS = '#0b0f14';
const BAR = '#3987e5';
const BAR_TOP = '#4cc2ff';

/**
 * Costruisce il marchio dentro un riquadro di lato `span` centrato in `size`.
 *
 * Per le icone maskable il sistema operativo ritaglia un cerchio di diametro
 * pari all'80% del lato: il marchio deve stare dentro quel cerchio, quindi il
 * riquadro non può superare il diametro diviso radice di due.
 */
function mark(size, span) {
  const bars = 6;
  const gapRatio = 0.62; // larghezza barra / passo
  const step = span / (bars - (1 - gapRatio));
  const width = step * gapRatio;
  const left = (size - span) / 2;
  const bottom = (size + span) / 2;
  const radius = width / 2;

  const shortest = span * 0.24;
  const rects = [];
  for (let index = 0; index < bars; index += 1) {
    const height = shortest + ((span - shortest) * index) / (bars - 1);
    const x = left + index * step;
    const y = bottom - height;
    const fill = index === bars - 1 ? BAR_TOP : BAR;
    rects.push(
      `<rect x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(height)}" rx="${round(radius)}" fill="${fill}"/>`,
    );
  }
  return rects.join('');
}

function round(value) {
  return Math.round(value * 100) / 100;
}

/** `safeZone` true = marchio ristretto per il ritaglio circolare delle icone maskable. */
function icon(size, { safeZone = false } = {}) {
  const span = safeZone ? size * 0.8 * Math.SQRT1_2 : size * 0.66;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `<rect width="${size}" height="${size}" fill="${CANVAS}"/>`,
    mark(size, span),
    '</svg>',
  ].join('');
}

const FILES = [
  { name: 'icon-192.png', size: 192, safeZone: false },
  { name: 'icon-512.png', size: 512, safeZone: false },
  { name: 'icon-maskable-192.png', size: 192, safeZone: true },
  { name: 'icon-maskable-512.png', size: 512, safeZone: true },
  // iOS ignora il manifest per la schermata Home e usa solo questa.
  { name: 'apple-touch-icon.png', size: 180, safeZone: false },
];

mkdirSync(OUT, { recursive: true });

writeFileSync(`${OUT}/favicon.svg`, `${icon(512)}\n`);

const browser = await chromium.launch(launchOptions());
try {
  for (const file of FILES) {
    const page = await browser.newPage({
      viewport: { width: file.size, height: file.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${CANVAS}}svg{display:block}</style>${icon(file.size, { safeZone: file.safeZone })}`,
    );
    await page.screenshot({ path: `${OUT}/${file.name}`, omitBackground: false });
    await page.close();
    console.log(`${file.name} (${file.size}px)`);
  }
} finally {
  await browser.close();
}

console.log(`favicon.svg\n${FILES.length + 1} file in ${OUT}/`);
