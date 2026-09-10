import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
const SW_TEMPLATE = fileURLToPath(new URL('./scripts/sw-template.js', import.meta.url));

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Emette `sw.js` con dentro l'elenco esatto dei file di questo build.
 *
 * Il service worker è scritto a mano in `scripts/sw-template.js`: qui ci
 * limitiamo a sostituire i due segnaposto. Nessuna libreria di mezzo, così
 * quello che finisce sul telefono è leggibile riga per riga.
 */
function serviceWorker(): Plugin {
  return {
    name: 'shadow-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const version = createHash('sha256');
      const files = new Set<string>(['./', './index.html']);

      for (const name of Object.keys(bundle).sort()) {
        const entry = bundle[name];
        if (entry === undefined) continue;
        files.add(`./${entry.fileName}`);
        version.update(entry.fileName);
        version.update(entry.type === 'chunk' ? entry.code : toBuffer(entry.source));
      }

      // I file di public/ non passano dal bundle: Vite li copia e basta.
      for (const path of listFiles(PUBLIC_DIR).sort()) {
        const name = relative(PUBLIC_DIR, path).split('\\').join('/');
        files.add(`./${name}`);
        version.update(name);
        version.update(readFileSync(path));
      }

      const source = readFileSync(SW_TEMPLATE, 'utf8')
        .replace('__VERSION__', version.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify([...files].sort(), null, 2));

      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

function toBuffer(source: string | Uint8Array): Uint8Array {
  return typeof source === 'string' ? new TextEncoder().encode(source) : source;
}

export default defineConfig({
  // Percorsi relativi: l'app deve funzionare anche servita da una sottocartella.
  base: './',
  plugins: [react(), tailwindcss(), serviceWorker()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
