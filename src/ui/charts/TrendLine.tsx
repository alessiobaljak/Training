import { useState } from 'react';
import { AXIS_FONT, GRID, INK_DIM, MARK, SURFACE, niceTicks } from './theme.ts';

/**
 * Andamento del peso: la media mobile è la linea, i dati giornalieri sono
 * puntini grigi dietro.
 *
 * È una forma a enfasi, non due serie alla pari: il singolo dato del giorno
 * non significa niente da solo, e disegnarlo con la stessa forza della media
 * inviterebbe a leggerlo. Resta come contesto, per far vedere quanto oscilla.
 *
 * L'asse verticale non parte da zero. Su un peso corporeo lo zero
 * schiaccerebbe una variazione reale di due chili in una linea piatta: qui la
 * scala è l'intervallo dei dati con un margine, e i valori sono scritti
 * sull'asse.
 */

export interface TrendPoint {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly average: number;
  /** `true` quando la finestra della media è piena: il valore è confrontabile. */
  readonly complete: boolean;
}

export interface TrendLineProps {
  readonly points: readonly TrendPoint[];
  readonly unit: string;
  readonly title: string;
  readonly valueLabel: string;
  readonly averageLabel: string;
}

/*
 * Sistema di coordinate fisso, scalato alla larghezza del contenitore.
 * Uno scorrimento orizzontale porterebbe fuori schermo le etichette dell'asse
 * verticale, e un grafico di pesi senza i numeri sull'asse non si legge.
 */
const WIDTH = 340;
const HEIGHT = 190;
const PAD = { top: 16, right: 40, bottom: 30, left: 38 };

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function TrendLine({ points, unit, title, valueLabel, averageLabel }: TrendLineProps) {
  const [picked, setPicked] = useState<string | null>(null);

  if (points.length === 0) {
    return <p className="text-sm text-dim">Ancora nessuna misura registrata.</p>;
  }

  const values = points.flatMap((point) => [point.value, point.average]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const margin = Math.max(0.5, (high - low) * 0.25);
  const bottom = round1(low - margin);
  const top = round1(high + margin);
  const span = top - bottom || 1;

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const step = points.length < 2 ? plotWidth : plotWidth / (points.length - 1);

  const x = (index: number): number =>
    PAD.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number): number => PAD.top + plotHeight * (1 - (value - bottom) / span);

  const ticks = niceTicks(top - bottom, 3).map((offset) => round1(bottom + offset)).filter((tick) => tick <= top);

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${String(x(index))} ${String(y(point.average))}`)
    .join(' ');

  const last = points.at(-1);
  const active = points.find((point) => point.key === picked) ?? last ?? null;

  /* Etichette sull'asse solo ogni tanto: una per punto si sovrapporrebbe. */
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div>
      <div>
        <svg
          viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
          role="img"
          aria-label={title}
          className="block h-auto w-full"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />
              <text
                x={PAD.left - 6}
                y={y(tick) + 3}
                textAnchor="end"
                fontSize={AXIS_FONT}
                fill={INK_DIM}
                className="tabular"
              >
                {tick}
              </text>
            </g>
          ))}

          {points.map((point, index) => (
            <circle key={`dot-${point.key}`} cx={x(index)} cy={y(point.value)} r={2.5} fill={INK_DIM} opacity={0.7} />
          ))}

          <path d={line} fill="none" stroke={MARK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {last !== undefined ? (
            <>
              <circle cx={x(points.length - 1)} cy={y(last.average)} r={6} fill={SURFACE} />
              <circle cx={x(points.length - 1)} cy={y(last.average)} r={4} fill={MARK} />
              <text
                x={x(points.length - 1) + 9}
                y={y(last.average) + 3}
                fontSize={AXIS_FONT}
                fill={INK_DIM}
                className="tabular"
              >
                {last.average}
              </text>
            </>
          ) : null}

          {points.map((point, index) =>
            index % labelEvery === 0 || index === points.length - 1 ? (
              <text
                key={`label-${point.key}`}
                x={x(index)}
                y={HEIGHT - PAD.bottom + 14}
                textAnchor="middle"
                fontSize={AXIS_FONT}
                fill={INK_DIM}
                className="tabular"
              >
                {point.label}
              </text>
            ) : null,
          )}

          {points.map((point, index) => (
            <rect
              key={`hit-${point.key}`}
              x={x(index) - step / 2}
              y={PAD.top}
              width={step}
              height={plotHeight + 16}
              fill="transparent"
              onClick={() => { setPicked(point.key); }}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dim">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded-full bg-[var(--color-mark)]" />
          {averageLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-dim)]" />
          {valueLabel}
        </span>
      </div>

      {active !== null ? (
        <p className="mt-2 text-sm">
          <span className="font-semibold">{active.label}</span>
          <span className="text-dim">
            {' '}
            · {active.value} {unit} il giorno · media {active.average} {unit}
            {active.complete ? '' : ' su finestra incompleta'}
          </span>
        </p>
      ) : null}
    </div>
  );
}
