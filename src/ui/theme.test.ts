import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isThemeChoice, THEME_CHOICES, THEME_LABELS } from './theme.ts';

/**
 * I colori si controllano con i numeri, non con l'occhio.
 *
 * Il tema è passato dallo scuro al chiaro, e un tema chiaro fatto scambiando i
 * valori del tema scuro è illeggibile: sul buio le superfici vicine sono più
 * chiare del fondo e le marche dei grafici pure, sul chiaro succede il
 * contrario. Questi controlli leggono `src/index.css` — la palette vera, non
 * una copia — e misurano ogni coppia che l'app disegna davvero.
 *
 * La soglia è quella delle WCAG: 4.5:1 per il testo, 3:1 per il confine di un
 * controllo che si tocca. Non sono numeri da ufficio conformità: l'app si usa
 * in palestra, con il telefono a terra e la luce che arriva da dove capita.
 */



/** I token `--color-*` dichiarati dentro un blocco che inizia con `apertura`. */
function palette(apertura: string): Record<string, string> {
  const inizio = CSS.indexOf(apertura);
  if (inizio < 0) throw new Error(`Blocco non trovato: ${apertura}`);
  const fine = CSS.indexOf('\n}', inizio);
  const corpo = CSS.slice(inizio, fine);
  const token: Record<string, string> = {};
  for (const [, nome, valore] of corpo.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) {
    if (nome !== undefined && valore !== undefined) token[nome] = valore.toLowerCase();
  }
  return token;
}

/*
 * Il foglio vero, letto dal disco.
 *
 * `import '../index.css?raw'` sembrava più pulito, ma sotto Vitest i CSS
 * arrivano svuotati: il test passava leggendo una stringa vuota, cioè non
 * controllava niente. Il tipo di verde peggiore.
 */
const CSS = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

const CHIARO = palette('@theme {');
const SCURO = palette(":root[data-theme='dark'] {");

function canale(componente: number): number {
  const s = componente / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): readonly [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as unknown as [number, number, number];
}

function luminanza(hex: string): number {
  const [r, g, b] = rgb(hex).map(canale) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrasto(a: string, b: string): number {
  const la = luminanza(a);
  const lb = luminanza(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Un colore con opacità steso sopra uno sfondo pieno, come lo compone il browser. */
function sovrapposto(hex: string, alfa: number, sfondo: string): string {
  const sopra = rgb(hex);
  const sotto = rgb(sfondo);
  const fuso = sopra.map((c, i) => Math.round(c * alfa + (sotto[i] ?? 0) * (1 - alfa)));
  return `#${fuso.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const TEMI: ReadonlyArray<readonly [string, Record<string, string>]> = [
  ['chiaro', CHIARO],
  ['scuro', SCURO],
];

const SFONDI = ['canvas', 'surface', 'panel'] as const;
const TESTI = ['ink', 'dim', 'accent', 'good', 'warn', 'danger'] as const;

describe('palette', () => {
  it('i due temi dichiarano gli stessi token', () => {
    // Un token che manca allo scuro non è un colore mancante: è il valore del
    // tema chiaro che resta acceso in mezzo al buio.
    expect(Object.keys(SCURO).sort()).toEqual(Object.keys(CHIARO).sort());
    expect(Object.keys(CHIARO).length).toBeGreaterThan(14);
  });

  it('nessun token è uguale nei due temi, tranne dove è voluto', () => {
    const uguali = Object.keys(CHIARO).filter((nome) => CHIARO[nome] === SCURO[nome]);
    expect(uguali).toEqual([]);
  });
});

describe.each(TEMI)('contrasto nel tema %s', (nome, tema) => {
  it.each(TESTI)('il testo %s si legge su tutte le superfici', (testo) => {
    for (const sfondo of SFONDI) {
      const misura = contrasto(tema[testo] ?? '', tema[sfondo] ?? '');
      expect(misura, `${nome}: ${testo} su ${sfondo} = ${misura.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('le pastiglie colorate si leggono sulla propria tinta al 15%', () => {
    for (const tinta of ['accent', 'good', 'warn', 'danger'] as const) {
      for (const sfondo of ['surface', 'canvas'] as const) {
        const dietro = sovrapposto(tema[tinta] ?? '', 0.15, tema[sfondo] ?? '');
        const misura = contrasto(tema[tinta] ?? '', dietro);
        expect(misura, `${nome}: ${tinta} su ${tinta}/15 sopra ${sfondo} = ${misura.toFixed(2)}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('il pulsante principale si legge', () => {
    expect(contrasto(tema['accent-ink'] ?? '', tema.accent ?? '')).toBeGreaterThanOrEqual(4.5);
  });

  it('il bordo di un controllo che si tocca si vede su ogni superficie', () => {
    for (const sfondo of SFONDI) {
      const misura = contrasto(tema['line-strong'] ?? '', tema[sfondo] ?? '');
      expect(misura, `${nome}: line-strong su ${sfondo} = ${misura.toFixed(2)}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('il bordo decorativo si vede, senza pesare quanto quello dei controlli', () => {
    const suSurface = contrasto(tema.line ?? '', tema.surface ?? '');
    expect(suSurface).toBeGreaterThanOrEqual(1.15);
    expect(suSurface).toBeLessThan(contrasto(tema['line-strong'] ?? '', tema.surface ?? ''));
  });

  it('le marche dei grafici si staccano dalla card su cui sono disegnate', () => {
    for (const marca of ['mark', 'set-1', 'set-2', 'set-3', 'set-4'] as const) {
      const misura = contrasto(tema[marca] ?? '', tema.surface ?? '');
      expect(misura, `${nome}: ${marca} su surface = ${misura.toFixed(2)}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('la rampa delle serie è monotona, e ogni gradino si distingue dal vicino', () => {
    /*
     * Una rampa che cambia verso a metà non si legge come una scala: le
     * colonne di una serie sembrerebbero appartenere a due gruppi diversi. Il
     * verso non è prescritto — in tutti e due i temi va dal chiaro allo scuro,
     * ed è una scelta, non una legge — ma dev'essere uno solo.
     */
    const rampa = ['set-1', 'set-2', 'set-3', 'set-4'].map((token) => luminanza(tema[token] ?? ''));
    const primo = rampa[0] ?? 0;
    const secondo = rampa[1] ?? 0;
    const verso = Math.sign(secondo - primo);
    expect(verso, `${nome}: i primi due gradini sono identici`).not.toBe(0);

    for (const [indice, valore] of rampa.slice(1).entries()) {
      const prima = rampa[indice] ?? 0;
      expect(
        Math.sign(valore - prima),
        `${nome}: il gradino ${String(indice + 2)} torna indietro invece di proseguire`,
      ).toBe(verso);
    }
  });
});

describe('scelta del tema', () => {
  it('le tre scelte hanno tutte un’etichetta', () => {
    for (const scelta of THEME_CHOICES) {
      expect(THEME_LABELS[scelta], scelta).toBeTruthy();
    }
    expect(THEME_CHOICES).toHaveLength(3);
  });

  it('non accetta un valore che non è una scelta', () => {
    // Quello che c'è in `localStorage` lo può aver scritto una versione
    // precedente, o una mano: non è un dato di cui fidarsi.
    expect(isThemeChoice('chiaro')).toBe(true);
    expect(isThemeChoice('dark')).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
    expect(isThemeChoice(2)).toBe(false);
  });
});

describe('confini del codice dell’app', () => {
  /*
   * Aggiungere i tipi di Node al progetto dell'app serve a questo file, che
   * gira sotto Vitest e legge il foglio di stile dal disco. Il resto dell'app
   * finisce dentro un bundle per il browser, dove `node:fs` non esiste: un
   * import così non fallirebbe a compilare, fallirebbe sul telefono.
   */
  function sorgenti(cartella: string): string[] {
    return readdirSync(cartella, { withFileTypes: true }).flatMap((voce) => {
      const percorso = join(cartella, voce.name);
      if (voce.isDirectory()) return sorgenti(percorso);
      return /\.tsx?$/.test(voce.name) && !/\.test\.tsx?$/.test(voce.name) ? [percorso] : [];
    });
  }

  it('fuori dai test nessun modulo importa da node:', () => {
    const radice = new URL('../../src', import.meta.url).pathname;
    const colpevoli = sorgenti(radice).filter((percorso) =>
      /from 'node:/.test(readFileSync(percorso, 'utf8')),
    );
    expect(colpevoli).toEqual([]);
  });
});
