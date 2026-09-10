import { describe, expect, it } from 'vitest';
import { EXERCISES } from './exercises.ts';

/**
 * Le illustrazioni sono generate da `npm run svg`. Questi test verificano che
 * il risultato committato copra l'anagrafica e resti utilizzabile dall'app.
 *
 * Il caricamento passa dallo stesso meccanismo che usa l'app, non dal file
 * system: se cambiasse il modo in cui le SVG arrivano nel bundle, questi test
 * se ne accorgerebbero.
 */
const MODULES: Record<string, unknown> = import.meta.glob('../assets/exercises/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const ART: ReadonlyMap<string, string> = new Map(
  Object.entries(MODULES).flatMap(([path, value]) => {
    const file = path.split('/').at(-1);
    if (file === undefined || typeof value !== 'string') return [];
    return [[file.replace(/\.svg$/, ''), value] as const];
  }),
);

describe('illustrazioni degli esercizi', () => {
  it('ce n’è una per ogni esercizio dell’anagrafica, senza orfane', () => {
    const slugs = new Set(EXERCISES.map((exercise) => exercise.slug));
    const drawn = new Set(ART.keys());
    expect([...slugs].filter((slug) => !drawn.has(slug))).toEqual([]);
    expect([...drawn].filter((slug) => !slugs.has(slug))).toEqual([]);
    expect(ART.size).toBe(EXERCISES.length);
  });

  it('usano currentColor, così seguono il tema senza duplicare la palette', () => {
    for (const [slug, markup] of ART) {
      expect(markup, slug).toContain('currentColor');
      expect(markup, slug).not.toMatch(/#[0-9a-f]{3,6}/i);
    }
  });

  it('hanno tutte la stessa tela, così nessuna appare più grande delle altre', () => {
    for (const [slug, markup] of ART) {
      expect(markup, slug).toContain('viewBox="0 0 210 110"');
    }
  });

  it('portano un testo alternativo che descrive il movimento', () => {
    for (const [slug, markup] of ART) {
      const label = /aria-label="([^"]+)"/.exec(markup)?.[1] ?? '';
      expect(label.length, slug).toBeGreaterThan(12);
      expect(markup, slug).toContain('<title>');
    }
  });

  it('non contengono script né risorse da scaricare', () => {
    for (const [slug, markup] of ART) {
      expect(markup, slug).not.toContain('<script');
      expect(markup, slug).not.toContain('href');
      expect(markup, slug).not.toContain('<image');
      // Il namespace SVG è l'unico indirizzo ammesso: è una dichiarazione,
      // non una risorsa da scaricare. L'app deve funzionare in aereo.
      const addresses = markup.match(/https?:\/\/[^"']+/g) ?? [];
      expect(new Set(addresses), slug).toEqual(new Set(['http://www.w3.org/2000/svg']));
    }
  });
});
