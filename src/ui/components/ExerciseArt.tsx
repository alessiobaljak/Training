import { REPDB_ART, REPDB_STEP_ART } from '../../data/exercise-art.ts';
import { getExercise } from '../../data/exercises.ts';
import { artFor } from '../../engine/media.ts';
import type { LevelIndex } from '../../types/index.ts';

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

/* Una figura per gradino: `npm run svg` ne genera una per ognuno dei 102. */
const STEP_SVG_MODULES: Record<string, unknown> = import.meta.glob('../../assets/steps/*.svg', {
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
const STEP_SVG_BY_SLUG = byFileName(STEP_SVG_MODULES, /\.svg$/);
const PHOTO_BY_FILE = byFileName(PHOTO_MODULES, /$^/);

/** Gli indirizzi dei fotogrammi, vuoto quando quella voce non ne ha. */
function framesFor(chiave: string, tabella: Readonly<Record<string, { readonly frames: readonly string[] }>>): string[] {
  const art = tabella[chiave];
  if (art === undefined) return [];
  return art.frames.flatMap((file) => {
    const url = PHOTO_BY_FILE.get(file);
    return url === undefined ? [] : [url];
  });
}

export function hasExerciseArt(slug: string): boolean {
  return framesFor(slug, REPDB_ART as Record<string, { frames: readonly string[] }>).length > 0 ||
    SVG_BY_SLUG.has(slug);
}

export function ExerciseArt({
  slug,
  level = null,
  label,
  caption: mostraDidascalia = true,
  compact = false,
}: {
  readonly slug: string;
  /** Gradino attuale: la figura segue quello, non l'esercizio. */
  readonly level?: LevelIndex | null;
  readonly label?: string;
  /**
   * La didascalia sotto la figura.
   *
   * `false` sulle miniature. «Inizio e fine del range» dentro un riquadro da
   * 56 px non si legge, esce dal riquadro e si sovrappone al testo della riga
   * sotto: nella scheda ogni esercizio aveva tre righe di didascalia rotta
   * addosso al proprio nome. Una didascalia che non si legge non è una
   * didascalia, è un difetto.
   */
  readonly caption?: boolean;
  /**
   * Altezza contenuta, per stare accanto a un cronometro.
   *
   * A tutta larghezza una figura occupa metà dello schermo: va bene sulla
   * pagina dell'esercizio, non durante la serie, dove sotto devono starci il
   * conto e i campi da riempire senza dover scorrere.
   */
  readonly compact?: boolean;
}) {
  const bersaglio = artFor(getExercise(slug), level);
  const frames =
    bersaglio.kind === 'step'
      ? framesFor(bersaglio.key, REPDB_STEP_ART)
      : framesFor(bersaglio.key, REPDB_ART as Record<string, { frames: readonly string[] }>);
  const didascalia =
    label ?? (frames.length === 1 ? 'La posizione da tenere' : 'Inizio e fine del range');

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
              className={`min-w-0 flex-1 rounded-xl bg-white ${compact ? 'max-h-36 object-contain' : ''}`}
            />
          ))}
        </div>
        {mostraDidascalia ? (
          <figcaption className="mt-2 text-center text-xs text-dim">{didascalia}</figcaption>
        ) : null}
      </figure>
    );
  }

  const markup =
    bersaglio.kind === 'step'
      ? STEP_SVG_BY_SLUG.get(bersaglio.key)
      : SVG_BY_SLUG.get(bersaglio.key);
  if (markup === undefined) return null;

  return (
    <figure className="m-0">
      {/*
        Il contenuto è codice del progetto generato da npm run svg, non input
        dell'utente, quindi inserirlo come markup è sicuro.
      */}
      <div
        className={`w-full text-ink [&>svg]:block ${
          compact
            ? '[&>svg]:mx-auto [&>svg]:h-36 [&>svg]:w-auto [&>svg]:max-w-full'
            : '[&>svg]:h-auto [&>svg]:w-full'
        }`}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      {mostraDidascalia ? (
        <figcaption className="mt-2 text-center text-xs text-dim">{didascalia}</figcaption>
      ) : null}
    </figure>
  );
}
