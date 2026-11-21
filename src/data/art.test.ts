import { describe, expect, it } from 'vitest';
import { EXERCISES } from './exercises.ts';
import { ART_ATTRIBUTION, FIGURE_SENZA_IMMAGINE, REPDB_ART, REPDB_STEP_ART } from './exercise-art.ts';
import { PROGRESSION_SCALES } from './progressions.ts';

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

const STEP_MODULES: Record<string, unknown> = import.meta.glob('../assets/steps/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const STEP_ART: ReadonlyMap<string, string> = new Map(
  Object.entries(STEP_MODULES).flatMap(([path, value]) => {
    const file = path.split('/').at(-1);
    if (file === undefined || typeof value !== 'string') return [];
    return [[file.replace(/\.svg$/, ''), value] as const];
  }),
);

/** I file delle illustrazioni RepDB, caricati come li carica l'app. */
const PHOTOS: Record<string, unknown> = import.meta.glob('../assets/exercises-repdb/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
});

const PHOTO_FILES: ReadonlySet<string> = new Set(
  Object.keys(PHOTOS).map((path) => path.split('/').at(-1) ?? ''),
);

/*
 * I controlli di qualità valgono per tutte le figure, di esercizio e di
 * gradino: sono generate dallo stesso script e finiscono nella stessa app.
 */
const TUTTE: ReadonlyMap<string, string> = new Map([...ART, ...STEP_ART]);

describe('illustrazioni degli esercizi', () => {
  it('ce n’è una per ogni esercizio dell’anagrafica, senza orfane', () => {
    const slugs = new Set(EXERCISES.map((exercise) => exercise.slug));
    const drawn = new Set(ART.keys());
    expect([...slugs].filter((slug) => !drawn.has(slug))).toEqual([]);
    expect([...drawn].filter((slug) => !slugs.has(slug))).toEqual([]);
    expect(ART.size).toBe(EXERCISES.length);
  });

  it('usano currentColor, così seguono il tema senza duplicare la palette', () => {
    for (const [slug, markup] of TUTTE) {
      expect(markup, slug).toContain('currentColor');
      expect(markup, slug).not.toMatch(/#[0-9a-f]{3,6}/i);
    }
  });

  it('hanno tutte la stessa tela, così nessuna appare più grande delle altre', () => {
    for (const [slug, markup] of TUTTE) {
      expect(markup, slug).toContain('viewBox="0 0 210 110"');
    }
  });

  it('portano un testo alternativo che descrive il movimento', () => {
    for (const [slug, markup] of TUTTE) {
      const label = /aria-label="([^"]+)"/.exec(markup)?.[1] ?? '';
      expect(label.length, slug).toBeGreaterThan(12);
      expect(markup, slug).toContain('<title>');
    }
  });

  it('non contengono script né risorse da scaricare', () => {
    for (const [slug, markup] of TUTTE) {
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

describe('illustrazioni RepDB', () => {
  it('ogni mappatura punta a file che esistono davvero', () => {
    // Senza questo, rinominare o dimenticare un file lascerebbe l'esercizio a
    // mani vuote senza che niente se ne accorga fino alla palestra.
    for (const [slug, art] of [...Object.entries(REPDB_ART), ...Object.entries(REPDB_STEP_ART)]) {
      expect(art, slug).toBeDefined();
      for (const file of art?.frames ?? []) {
        expect(PHOTO_FILES.has(file), `${slug} -> ${file}`).toBe(true);
      }
    }
  });

  it('ogni mappatura di gradino riguarda un gradino che esiste', () => {
    const gradini = new Set(
      PROGRESSION_SCALES.flatMap((scala) => scala.steps.map((step) => step.slug)),
    );
    for (const slug of Object.keys(REPDB_STEP_ART)) {
      expect(gradini.has(slug), slug).toBe(true);
    }
  });

  it('ogni mappatura riguarda un esercizio che esiste', () => {
    const slugs = new Set<string>(EXERCISES.map((exercise) => exercise.slug));
    for (const slug of Object.keys(REPDB_ART)) {
      expect(slugs.has(slug), slug).toBe(true);
    }
  });

  it('non ci sono immagini copiate e mai usate', () => {
    const usate = new Set(
      [...Object.values(REPDB_ART), ...Object.values(REPDB_STEP_ART)].flatMap(
        (art) => art?.frames ?? [],
      ),
    );
    // Il termine 3 della licenza vieta di ridistribuire l'archivio: nel
    // progetto stanno solo le immagini che l'app mostra davvero.
    expect([...PHOTO_FILES].filter((file) => !usate.has(file))).toEqual([]);
  });

  it('nessuna figura di gradino è orfana di un gradino', () => {
    const gradini = new Set(
      PROGRESSION_SCALES.flatMap((scala) => scala.steps.map((step) => step.slug)),
    );
    expect([...STEP_ART.keys()].filter((slug) => !gradini.has(slug))).toEqual([]);
  });

  it('ogni gradino di ogni scala ha la sua figura', () => {
    /*
     * È il controllo che tiene in piedi «la figura segue il gradino»: se un
     * gradino restasse scoperto, l'app non avrebbe niente da mostrare a chi
     * sta proprio lì, e il ripiego sarebbe di nuovo il disegno di un altro
     * esercizio.
     */
    for (const scala of PROGRESSION_SCALES) {
      for (const step of scala.steps) {
        const coperto = step.slug in REPDB_STEP_ART || STEP_ART.has(step.slug) || FIGURE_SENZA_IMMAGINE.has(step.slug);
        expect(coperto, step.slug).toBe(true);
      }
    }
  });

  it('ogni esercizio ha un disegno, da una fonte o dall’altra', () => {
    for (const exercise of EXERCISES) {
      const coperto = exercise.slug in REPDB_ART || ART.has(exercise.slug) || FIGURE_SENZA_IMMAGINE.has(exercise.slug);
      expect(coperto, exercise.slug).toBe(true);
    }
  });

  it('l’attribuzione richiesta dalla licenza è presente e punta a RepDB', () => {
    expect(ART_ATTRIBUTION.href).toBe('https://repdb.co');
    expect(ART_ATTRIBUTION.text).toContain('RepDB');
  });
});

describe('figure senza immagine, per scelta (audit 2026-11-21)', () => {
  it('ogni voce è un esercizio o un gradino vero, con il suo motivo, e non ha una foto RepDB', () => {
    const gradini = new Set(PROGRESSION_SCALES.flatMap((scala) => scala.steps.map((step) => step.slug)));
    const esercizi = new Set(EXERCISES.map((exercise) => exercise.slug));
    for (const [chiave, motivo] of FIGURE_SENZA_IMMAGINE) {
      expect(gradini.has(chiave) || esercizi.has(chiave), chiave).toBe(true);
      expect(motivo.length, chiave).toBeGreaterThan(10);
      expect(chiave in REPDB_ART || chiave in REPDB_STEP_ART, chiave).toBe(false);
    }
  });

  it('37.8 · il rematore è agli anelli: nessuna foto con il TRX o la sbarra, finché il media lead non ne verifica una', () => {
    expect(REPDB_ART['rematore-inverso-trx']).toBeUndefined();
    expect(REPDB_STEP_ART['horizontal-pull-l1']).toBeUndefined();
    expect(FIGURE_SENZA_IMMAGINE.has('rematore-inverso-trx')).toBe(true);
    expect(FIGURE_SENZA_IMMAGINE.has('horizontal-pull-l1')).toBe(true);
  });

  it('la verticale libera non compare dove la scheda chiede il muro', () => {
    for (const art of [...Object.values(REPDB_ART), ...Object.values(REPDB_STEP_ART)]) {
      expect(art?.source).not.toBe('handstand-push-ups');
    }
  });
});
