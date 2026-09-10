import { useEffect, useId, useState } from 'react';

/**
 * Campo numerico con pulsanti grandi.
 *
 * La tastiera del telefono in palestra è il modo più veloce per sbagliare una
 * cifra: i pulsanti fanno il grosso, il campo resta per correggere. Lo step è
 * un parametro perché la zavorra deve muoversi solo di 2,5 kg alla volta.
 *
 * Il minimo si applica quando si esce dal campo, non a ogni tasto: con un
 * minimo di 30 kg, digitare "80" verrebbe corretto in 30 al primo carattere e
 * il numero diventerebbe impossibile da scrivere.
 */
export interface NumberStepperProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
  /**
   * Chiamato solo quando il valore è definitivo: uscita dal campo o tocco sui
   * pulsanti. Serve a non scrivere sul database una cifra alla volta mentre
   * si digita.
   */
  readonly onCommit?: (value: number) => void;
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
  onCommit,
  min = 0,
  max = 999,
  step = 1,
  unit,
  hint,
  disabled = false,
}: NumberStepperProps) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);

  /* Fuori dall'editing il campo segue il valore che arriva dall'alto. */
  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  const round = (next: number): number => Math.round(next * 100) / 100;
  const clamp = (next: number): number => Math.min(max, Math.max(min, next));

  const commit = (raw: string): void => {
    const parsed = Number(raw);
    const next = Number.isFinite(parsed) && raw.trim() !== '' ? round(clamp(parsed)) : min;
    setText(String(next));
    onChange(next);
    onCommit?.(next);
  };

  const nudge = (delta: number): void => {
    const next = round(clamp(value + delta));
    setText(String(next));
    onChange(next);
    onCommit?.(next);
  };

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
          onClick={() => { nudge(-step); }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-3xl font-semibold active:bg-line disabled:opacity-30"
        >
          −
        </button>

        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            value={text}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            onFocus={() => { setEditing(true); }}
            onChange={(event) => {
              const raw = event.target.value;
              setText(raw);
              const parsed = Number(raw);
              /*
               * Mentre si scrive si applica solo il massimo: il minimo
               * aspetta l'uscita dal campo, altrimenti "8" diventa il minimo
               * prima di poter scrivere "80".
               */
              if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
                onChange(round(Math.min(max, parsed)));
              }
            }}
            onBlur={(event) => {
              setEditing(false);
              commit(event.target.value);
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
          onClick={() => { nudge(step); }}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-3xl font-semibold active:bg-line disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
