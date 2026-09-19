import { REPDB_ART } from '../../data/exercise-art.ts';

/**
 * Illustrazione di un esercizio.
 *
 * Due fonti, in ordine di preferenza.
 *
 * 1. I disegni di RepDB, che coprono trenta esercizi su trentanove. Sono
 *    illustrazioni vere, fatte da illustratori.
 * 2. Le figure schematiche generate da `npm run svg`, per i nove rimasti:
 *    quattro non sono esercizi e cinque RepDB non ce li ha.
 *
 * Le immagini sono importate a build time, quindi finiscono nel build con un
 * nome che porta l'hash del contenuto e vengono messe in cache dal service
 * worker insieme a tutto il resto: si vedono anche in modalità aereo.
 */

const SVG_MODULES: Record<string, unknown> = import.meta.glob('../../assets/exercises/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const PHOTO_MODULES: Record<string, unknown> = import.meta.glob(
  '../../assets/exercises-repdb/*.webp',
  { query: '?url', import: 'default', eager: true },
);

function byFileName(modules: Record<string, unknown>, strip: RegExp): ReadonlyMap<string, string> {
  return new Map(
    Object.entries(modules).flatMap(([path, value]) => {
      const file = path.split('/').at(-1);
      if (file === undefined || typeof value !== 'string') return [];
      return [[file.replace(strip, ''), value] as const];
    }),
  );
}

const SVG_BY_SLUG = byFileName(SVG_MODULES, /\.svg$/);
const PHOTO_BY_FILE = byFileName(PHOTO_MODULES, /$^/);

export type ArtVariant = 'primaria' | 'alternativa';

/** Gli indirizzi dei fotogrammi di una variante, vuoto se non ne ha. */
function framesFor(slug: string, variant: ArtVariant): string[] {
  const art = REPDB_ART[slug as keyof typeof REPDB_ART];
  if (art === undefined) return [];
  const scelta = variant === 'alternativa' ? art.alternative : art;
  return (scelta?.frames ?? []).flatMap((file) => {
    const url = PHOTO_BY_FILE.get(file);
    return url === undefined ? [] : [url];
  });
}

export function hasExerciseArt(slug: string): boolean {
  return framesFor(slug, 'primaria').length > 0 || SVG_BY_SLUG.has(slug);
}

export function ExerciseArt({
  slug,
  label,
  variant = 'primaria',
}: {
  readonly slug: string;
  readonly label?: string;
  readonly variant?: ArtVariant;
}) {
  const frames = framesFor(slug, variant);
  const caption = label ?? (frames.length === 1 ? 'La posizione da tenere' : 'Inizio e fine del range');

  if (frames.length > 0) {
    return (
      <figure className="m-0">
        <div className="flex gap-2">
          {frames.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={index === 0 ? 'Posizione di partenza' : 'Posizione di arrivo'}
              loading="lazy"
              className="min-w-0 flex-1 rounded-xl bg-white"
            />
          ))}
        </div>
        <figcaption className="mt-2 text-center text-xs text-dim">{caption}</figcaption>
      </figure>
    );
  }

  // Per l'alternativa non c'è ripiego: la figura schematica disegna la
  // variante principale e mostrarla qui direbbe una cosa falsa.
  if (variant === 'alternativa') return null;

  const markup = SVG_BY_SLUG.get(slug);
  if (markup === undefined) return null;

  return (
    <figure className="m-0">
      {/*
        Il contenuto è codice del progetto generato da npm run svg, non input
        dell'utente, quindi inserirlo come markup è sicuro.
      */}
      <div
        className="w-full text-ink [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <figcaption className="mt-2 text-center text-xs text-dim">{caption}</figcaption>
    </figure>
  );
}
