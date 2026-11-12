/*
 * Foglio di contatto per la verifica delle figure (REVIEW_CHECKLIST §3).
 * Non tocca il repo: legge gli SVG e scrive un PNG dove gli dici.
 *   node media/scripts/contact-sheet.mjs out.png <colonne> <px> file.svg::didascalia ...
 */
import pw from '/home/user/Training/node_modules/playwright/index.js';
import { writeFileSync, readdirSync, existsSync } from 'node:fs';
const { chromium } = pw;
/* La versione di Chromium cambia con Playwright: si cerca, non si scrive a mano. */
const findChrome = () => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = '/opt/pw-browsers';
  for (const d of readdirSync(root).filter((n) => /^chromium-\d+$/.test(n)).sort().reverse()) {
    for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      if (existsSync(`${root}/${d}/${sub}`)) return `${root}/${d}/${sub}`;
    }
  }
  return '/usr/bin/google-chrome';
};
const [out, cols, tile, ...files] = process.argv.slice(2);
const cells = files.map((f) => {
  const [path, caption] = f.split('::');
  return `<figure><img src="file://${path}"><figcaption>${caption}</figcaption></figure>`;
}).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#fff;font:11px/1.3 system-ui,sans-serif;color:#000}
.grid{display:grid;grid-template-columns:repeat(${cols},${tile}px);gap:6px;padding:8px}
figure{margin:0;border:1px solid #ccc}
img{width:${tile}px;display:block;background:#fff}
figcaption{padding:2px 3px;background:#f2f2f2;word-break:break-all}
</style><div class="grid">${cells}</div>`;
const page_html = out.replace(/\.png$/, '.html');
writeFileSync(page_html, html);
const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: Number(cols) * (Number(tile) + 8) + 24, height: 600 }, deviceScaleFactor: 1 });
await page.goto('file://' + page_html);
await page.waitForLoadState('load');
await page.screenshot({ path: out, fullPage: true });
await browser.close();
