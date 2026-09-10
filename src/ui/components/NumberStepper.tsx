import { useId } from 'react';

/**
 * Campo numerico con pulsanti grandi.
 *
 * La tastiera del telefono in palestra è il modo più veloce per sbagliare una
 * cifra: i pulsanti fanno il grosso, il campo resta per correggere. Lo step è
 * un parametro perché la zavorra deve muoversi solo di 2,5 kg alla volta.
 */
export interface NumberStepperProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;
  readonly hint?: string;
  readonly disabled?: boolean;
}

export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  hint,
  disabled = false,
}: NumberStepperProps) {
  const id = useId();

  const clamp = (next: number): number => Math.min(max, Math.max(min, next));
  const round = (next: number): number => Math.round(next * 100) / 100;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-dim">
          {label}
        </label>
        {hint !== undefined && hint !== '' ? <span className="text-xs text-dim">{hint}</span> : null}
      </div>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          aria-label={`Diminuisci ${label}`}
          disabled={disabled || value <= min}
          onClick={() => {
            onChange(round(clamp(value - step)));
          }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-3xl font-semibold active:bg-line disabled:opacity-30"
        >
          −
        </button>

        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            value={String(value)}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              onChange(Number.isFinite(parsed) ? round(clamp(parsed)) : min);
            }}
            className="tabular h-16 w-full rounded-2xl border border-line bg-surface text-center text-3xl font-semibold text-ink disabled:opacity-40"
          />
          {unit !== undefined && unit !== '' ? (
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-dim">
              {unit}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={`Aumenta ${label}`}
          disabled={disabled || value >= max}
          onClick={() => {
            onChange(round(clamp(value + step)));
          }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-3xl font-semibold active:bg-line disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
