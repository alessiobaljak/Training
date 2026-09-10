import { existsSync, readdirSync } from 'node:fs';

const BROWSER_ROOT = '/opt/pw-browsers';

/**
 * Trova un Chromium già installato.
 *
 * Playwright cerca una versione precisa e fallisce se sul disco c'è una
 * build diversa da quella che si aspetta. Qui prendiamo qualunque Chromium
 * presente: agli script serve un browser, non una versione.
 */
export function findChromium() {
  const fromEnv = process.env['CHROMIUM_PATH'];
  if (typeof fromEnv === 'string' && fromEnv !== '' && existsSync(fromEnv)) return fromEnv;

  if (!existsSync(BROWSER_ROOT)) return undefined;

  const entries = readdirSync(BROWSER_ROOT).filter((entry) => entry.startsWith('chromium'));

  // Il browser completo prima dello headless shell: serve un service worker.
  const ordered = [
    ...entries.filter((entry) => !entry.includes('headless')).sort().reverse(),
    ...entries.filter((entry) => entry.includes('headless')).sort().reverse(),
  ];

  const candidates = ordered
    .flatMap((entry) => [
      `${BROWSER_ROOT}/${entry}/chrome-linux/chrome`,
      `${BROWSER_ROOT}/${entry}/chrome-linux/headless_shell`,
      `${BROWSER_ROOT}/${entry}/chrome-headless-shell-linux64/chrome-headless-shell`,
    ]);

  return candidates.find((path) => existsSync(path));
}

/** Opzioni di launch per Playwright, vuote se il browser è dove se lo aspetta. */
export function launchOptions() {
  const executablePath = findChromium();
  return executablePath === undefined ? {} : { executablePath };
}
