import type { Exercise } from '../types/index.ts';

/**
 * Link ai video, l'unico punto del codice che ne costruisce uno.
 *
 * Nel codebase non esiste nessun URL di video specifico. L'app apre due cose
 * sole: una ricerca YouTube composta a runtime dalla `videoQuery`
 * dell'esercizio, che non può rompersi, e il link che l'utente ha incollato.
 */

export const YOUTUBE_SEARCH_BASE = 'https://www.youtube.com/results?search_query=';

export function youtubeSearchUrl(query: string): string {
  return `${YOUTUBE_SEARCH_BASE}${encodeURIComponent(query.trim())}`;
}

/**
 * Solo http e https.
 *
 * L'URL incollato dall'utente finisce nell'attributo href di un link: uno
 * schema `javascript:` o `data:` diventerebbe codice eseguibile al tap. Il
 * controllo va fatto qui, prima di salvare, non al momento di renderizzare.
 */
export function isSafeExternalUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

/** Ripulisce l'URL incollato. `null` quando non è utilizzabile. */
export function normalizeVideoUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!isSafeExternalUrl(trimmed)) return null;
  return new URL(trimmed).toString();
}

export type VideoLinkKind = 'custom' | 'search';

export interface VideoLink {
  readonly kind: VideoLinkKind;
  readonly url: string;
  readonly label: string;
  readonly hint: string;
}

/**
 * Il link da aprire per un esercizio: quello dell'utente se c'è, altrimenti
 * la ricerca precompilata.
 */
export function resolveVideoLink(exercise: Exercise, customUrl: string | null): VideoLink {
  const normalized = customUrl === null ? null : normalizeVideoUrl(customUrl);
  if (normalized !== null) {
    return {
      kind: 'custom',
      url: normalized,
      label: 'Apri il mio video',
      hint: 'Link salvato da te per questo esercizio.',
    };
  }
  return {
    kind: 'search',
    url: youtubeSearchUrl(exercise.videoQuery),
    label: 'Cerca un video',
    hint: 'Ricerca su YouTube. Quando trovi un video che ti convince, salvalo in “Il mio video”.',
  };
}
