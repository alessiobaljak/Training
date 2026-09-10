/**
 * Volume settimanale per gruppo muscolare, contro la fascia del metodo.
 *
 * Una sola tinta per tutte le barre: i gruppi muscolari non hanno un ordine,
 * e colorarli per grandezza raddoppierebbe l'informazione che la lunghezza già
 * dà. Sopra o sotto la fascia si legge dalla posizione rispetto alla banda e
 * dall'etichetta, mai dal colore da solo.
 */
export interface TargetBarDatum {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly status: 'under' | 'in' | 'over';
}

export interface TargetBarsProps {
  readonly bars: readonly TargetBarDatum[];
  readonly target: { readonly min: number; readonly max: number };
  readonly caption: string;
}

const STATUS_TEXT: Record<TargetBarDatum['status'], string> = {
  under: 'sotto',
  in: 'in fascia',
  over: 'sopra',
};

export function TargetBars({ bars, target, caption }: TargetBarsProps) {
  const scaleTop = Math.max(target.max * 1.25, ...bars.map((bar) => bar.value)) || 1;
  const percent = (value: number): number => Math.min(100, (value / scaleTop) * 100);

  return (
    <div>
      <div className="relative">
        {/* Banda di riferimento, dietro alle barre. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 border-x border-good/30 bg-good/10"
          style={{
            left: `${String(percent(target.min))}%`,
            width: `${String(percent(target.max) - percent(target.min))}%`,
          }}
        />

        <ul className="relative space-y-3">
          {bars.map((bar) => (
            <li key={bar.key}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-dim">{bar.label}</span>
                <span className="tabular shrink-0 text-dim">
                  <span className="font-semibold text-ink">{bar.value}</span> · {STATUS_TEXT[bar.status]}
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full">
                <div
                  className="h-full rounded-r-sm bg-[var(--color-mark)]"
                  style={{ width: `${String(percent(bar.value))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-dim">{caption}</p>
    </div>
  );
}
