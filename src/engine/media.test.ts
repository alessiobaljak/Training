import { describe, expect, it } from 'vitest';
import { getProgressionStep } from '../data/progressions.ts';
import { isOwnLevel } from './progression.ts';
import {
  artFor,
  YOUTUBE_SEARCH_BASE,
  isSafeExternalUrl,
  normalizeVideoUrl,
  resolveVideoLink,
  youtubeSearchUrl,
} from './media.ts';
import { EXERCISES, getExercise } from '../data/exercises.ts';

describe('ricerca video', () => {
  it('compone una ricerca, mai un video specifico', () => {
    expect(youtubeSearchUrl('ring dip proper form tutorial')).toBe(
      `${YOUTUBE_SEARCH_BASE}ring%20dip%20proper%20form%20tutorial`,
    );
  });

  it('costruisce un link valido per ogni esercizio dell’anagrafica', () => {
    for (const exercise of EXERCISES) {
      const url = youtubeSearchUrl(exercise.videoQuery);
      expect(url.startsWith(YOUTUBE_SEARCH_BASE), exercise.slug).toBe(true);
      expect(() => new URL(url), exercise.slug).not.toThrow();
    }
  });
});

describe('link incollati dall’utente', () => {
  it('accetta http e https', () => {
    expect(isSafeExternalUrl('https://example.com/video')).toBe(true);
    expect(isSafeExternalUrl('http://example.com/video')).toBe(true);
  });

  it('rifiuta gli schemi che diventerebbero codice al tap', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeExternalUrl('JavaScript:alert(1)')).toBe(false);
  });

  it('rifiuta quello che non è nemmeno un indirizzo', () => {
    expect(isSafeExternalUrl('')).toBe(false);
    expect(isSafeExternalUrl('non un url')).toBe(false);
    expect(isSafeExternalUrl('example.com')).toBe(false);
  });

  it('normalizza togliendo gli spazi ai bordi', () => {
    expect(normalizeVideoUrl('  https://example.com/x  ')).toBe('https://example.com/x');
  });

  it('restituisce null su un link inutilizzabile', () => {
    expect(normalizeVideoUrl('')).toBeNull();
    expect(normalizeVideoUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('scelta del link da aprire', () => {
  const exercise = getExercise('dip-parallele-anelli');

  it('senza link personale apre la ricerca', () => {
    const link = resolveVideoLink(exercise, null);
    expect(link.kind).toBe('search');
    expect(link.url).toContain(YOUTUBE_SEARCH_BASE);
  });

  it('con un link personale apre quello', () => {
    const link = resolveVideoLink(exercise, 'https://example.com/dip');
    expect(link.kind).toBe('custom');
    expect(link.url).toBe('https://example.com/dip');
  });

  it('un link personale non valido non scavalca la ricerca', () => {
    const link = resolveVideoLink(exercise, 'javascript:alert(1)');
    expect(link.kind).toBe('search');
  });
});

describe('quale figura mostrare', () => {
  /*
   * Il difetto: al blocco A2 del giovedì il titolo diceva «Push-up archer»,
   * il gradino vero era il 3 — push-up declinati — e l'illustrazione mostrava
   * gli archer. Scendere di livello non cambiava niente di quello che si
   * vedeva, e la figura diceva una cosa falsa proprio a chi la guardava prima
   * di una serie.
   */
  const archer = getExercise('pushup-archer-o-pseudo-planche');

  it('sotto il gradino della scheda mostra la figura del gradino', () => {
    expect(archer.defaultLevel).toBe(5);
    expect(artFor(archer, 3)).toEqual({ kind: 'step', key: 'horizontal-push-l3' });
    expect(artFor(archer, 2)).toEqual({ kind: 'step', key: 'horizontal-push-l2' });
  });

  it('sul gradino della scheda mostra la figura dell’esercizio', () => {
    /*
     * Lì è più precisa: dice anche quello che il gradino non nomina, la presa
     * larga di una trazione o la panca di un dip.
     */
    expect(artFor(archer, 5)).toEqual({ kind: 'exercise', key: archer.slug });
  });

  it('fuori dalle scale resta la figura dell’esercizio', () => {
    const manubri = getExercise('alzate-laterali-elastico');
    expect(manubri.pattern).toBeNull();
    expect(artFor(manubri, null)).toEqual({ kind: 'exercise', key: manubri.slug });
    expect(artFor(manubri, 4)).toEqual({ kind: 'exercise', key: manubri.slug });
  });

  it('senza un livello non inventa un gradino', () => {
    expect(artFor(archer, null)).toEqual({ kind: 'exercise', key: archer.slug });
  });

  it('il gradino scelto è quello della scala dell’esercizio', () => {
    for (const livello of [1, 2, 3, 4, 5, 6] as const) {
      const atteso = getProgressionStep('horizontal-push', livello).slug;
      const risultato = artFor(archer, livello);
      if (livello === archer.defaultLevel) continue;
      expect(risultato).toEqual({ kind: 'step', key: atteso });
    }
  });
});

describe('chi ha ragione fra nome e gradino', () => {
  /*
   * Titolo e figura devono dire la stessa cosa: se il titolo scende al
   * gradino e l'immagine resta sull'esercizio, o viceversa, la schermata si
   * contraddice da sola. La regola è una, e sta in `isOwnLevel`.
   */
  const archer = getExercise('pushup-archer-o-pseudo-planche');
  const trazioni = getExercise('trazioni-presa-larga');

  it('sul proprio gradino comanda l’esercizio, sotto comanda il gradino', () => {
    expect(isOwnLevel(archer, 5)).toBe(true);
    expect(isOwnLevel(archer, 3)).toBe(false);
    expect(isOwnLevel(trazioni, 3)).toBe(true);
    expect(isOwnLevel(trazioni, 2)).toBe(false);
  });

  it('la figura segue la stessa regola del titolo, sempre', () => {
    for (const esercizio of [archer, trazioni]) {
      for (const livello of [1, 2, 3, 4, 5, 6] as const) {
        expect(artFor(esercizio, livello).kind, `${esercizio.slug} liv ${String(livello)}`).toBe(
          isOwnLevel(esercizio, livello) ? 'exercise' : 'step',
        );
      }
    }
  });

  it('fuori dalle scale comanda sempre l’esercizio', () => {
    expect(isOwnLevel(getExercise('alzate-laterali-elastico'), null)).toBe(true);
  });
});
