/**
 * Parametri comuni ai grafici.
 *
 * I colori delle marche sono passati per lo script di validazione della skill
 * dataviz contro la superficie delle card: banda di luminosità, soglia di
 * croma, separazione per daltonismo e contrasto. La rampa delle serie è
 * ordinale, non categorica, perché S1-S4 hanno un ordine: la serie 4 viene
 * dopo la 3, non è un'altra categoria.
 */

export const MARK = 'var(--color-mark)';
export const GRID = 'var(--color-line)';
export const SURFACE = 'var(--color-surface)';
export const INK_DIM = 'var(--color-dim)';

/** Rampa ordinale S1 → S4, dal chiaro allo scuro. */
export const SET_RAMP: readonly string[] = [
  'var(--color-set-1)',
  'var(--color-set-2)',
  'var(--color-set-3)',
  'var(--color-set-4)',
];

export function setColor(index: number): string {
  return SET_RAMP[Math.min(index, SET_RAMP.length - 1)] ?? MARK;
}

/** Spessore massimo di una colonna: oltre, la barra riempie tutto e urla. */
export const MAX_BAR = 24;

/** Spazio in colore superficie che separa i segmenti di una pila. */
export const SURFACE_GAP = 2;

export const AXIS_FONT = 10;

/** Ticks arrotondati a numeri leggibili. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((value) => value >= raw) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(Math.round(value * 100) / 100);
  return ticks;
}

/**
 * Rettangolo con i due angoli superiori arrotondati e la base squadrata.
 * È la forma prescritta per la testa di una colonna: 4 px sopra, niente sotto.
 */
export function topRoundedPath(x: number, y: number, width: number, height: number, radius = 4): string {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  return [
    `M ${String(x)} ${String(y + height)}`,
    `L ${String(x)} ${String(y + r)}`,
    `A ${String(r)} ${String(r)} 0 0 1 ${String(x + r)} ${String(y)}`,
    `L ${String(x + width - r)} ${String(y)}`,
    `A ${String(r)} ${String(r)} 0 0 1 ${String(x + width)} ${String(y + r)}`,
    `L ${String(x + width)} ${String(y + height)}`,
    'Z',
  ].join(' ');
}
