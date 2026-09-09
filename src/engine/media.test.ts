import { describe, expect, it } from 'vitest';
import {
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
