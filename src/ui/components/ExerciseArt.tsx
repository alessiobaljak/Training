/**
 * Illustrazione di un esercizio.
 *
 * Le SVG sono generate da `npm run svg` e importate a build time: il contenuto
 * è codice del progetto, non input dell'utente, quindi inserirlo come markup è
 * sicuro. Usano `currentColor`, così seguono il tema senza duplicati.
 */
const MODULES: Record<string, unknown> = import.meta.glob('../../assets/exercises/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const BY_SLUG: ReadonlyMap<string, string> = new Map(
  Object.entries(MODULES).flatMap(([path, value]) => {
    const file = path.split('/').at(-1);
    if (file === undefined || typeof value !== 'string') return [];
    return [[file.replace(/\.svg$/, ''), value] as const];
  }),
);

export function hasExerciseArt(slug: string): boolean {
  return BY_SLUG.has(slug);
}

export function ExerciseArt({ slug, label }: { readonly slug: string; readonly label?: string }) {
  const markup = BY_SLUG.get(slug);
  if (markup === undefined) return null;

  return (
    <figure className="m-0">
      <div
        className="w-full text-ink [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <figcaption className="mt-2 text-center text-xs text-dim">
        {label ?? 'Inizio e fine del range'}
      </figcaption>
    </figure>
  );
}
