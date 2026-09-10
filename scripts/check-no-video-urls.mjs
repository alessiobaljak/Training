#!/usr/bin/env node
/**
 * Nessun URL di video hardcodato nel codebase.
 *
 * Un ID YouTube scritto a memoria è quasi sempre morto o punta al video
 * sbagliato. L'app apre solo due cose: una ricerca YouTube precompilata,
 * costruita a runtime dalla `videoQuery` dell'esercizio, e il link che
 * l'utente ha salvato da sé in IndexedDB.
 *
 * Uscita 0 se pulito, 1 se trova qualcosa.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '.vite']);
const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.json',
  '.webmanifest',
  '.html',
  '.css',
  '.svg',
  '.md',
]);

/** L'unica base URL consentita: una ricerca, mai un video specifico. */
const ALLOWED = ['https://www.youtube.com/results?search_query='];

const FORBIDDEN = [
  { name: 'video YouTube diretto', re: /youtube\.com\/(watch|embed|shorts|v)\b/i },
  { name: 'link youtu.be', re: /youtu\.be\//i },
  { name: 'ID YouTube in una stringa', re: /\bvideoId\b|\byoutubeId\b/i },
  { name: 'file video o GIF remoto', re: /https?:\/\/[^\s'"`]+\.(gif|mp4|webm|mov)\b/i },
  { name: 'CDN di GIF', re: /(giphy|tenor|gfycat)\.com/i },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (SCANNED_EXTENSIONS.has(extname(entry))) {
      yield full;
    }
  }
}

const problems = [];

for (const file of walk(ROOT)) {
  if (file.endsWith('scripts/check-no-video-urls.mjs')) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    let haystack = line;
    for (const allowed of ALLOWED) haystack = haystack.split(allowed).join('');
    for (const { name, re } of FORBIDDEN) {
      if (re.test(haystack)) {
        problems.push(`${relative(ROOT, file)}:${index + 1}  ${name}\n    ${line.trim()}`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`Trovati ${problems.length} riferimenti a video hardcodati:\n`);
  console.error(problems.join('\n'));
  console.error('\nUsa una query di ricerca (Exercise.videoQuery), non un URL.');
  process.exit(1);
}

console.log('Nessun URL di video hardcodato.');
