import { useState } from 'react';
import { AXIS_FONT, GRID, INK_DIM, MAX_BAR, SURFACE_GAP, niceTicks, setColor, topRoundedPath } from './theme.ts';

/**
 * Ripetizioni per serie e in totale, seduta dopo seduta.
 *
 * L'altezza della colonna è il totale, i segmenti sono le singole serie: un
 * grafico solo risponde a entrambe le domande. Le linee verticali segnano i
 * cambi di livello e di zavorra, senza le quali un salto di variante
 * sembrerebbe un crollo invece che la prova che il carico è aumentato.
 */

export interface ColumnDatum {
  readonly key: string;
  /** Etichetta breve sull'asse, per esempio "14/9". */
  readonly label: string;
  /** Valore di ogni serie, dalla prima all'ultima. */
  readonly segments: readonly number[];
  readonly total: number;
  /** Annotazione da mostrare come linea verticale. */
  readonly marker: string | null;
  /** Riga di dettaglio mostrata quando la colonna è selezionata. */
  readonly detail: string;
}

export interface StackedColumnsProps {
  readonly columns: readonly ColumnDatum[];
  readonly unit: string;
  readonly title: string;
}

const PAD = { top: 18, right: 12, bottom: 34, left: 30 };
const HEIGHT = 200;
const SLOT = 34;

export function StackedColumns({ columns, unit, title }: StackedColumnsProps) {
  const [picked, setPicked] = useState<string | null>(null);

  if (columns.length === 0) {
    return <p className="text-sm text-dim">Nessuna serie registrata su questo esercizio.</p>;
  }

  const maxSets = columns.reduce((max, column) => Math.max(max, column.segments.length), 0);
  const maxTotal = columns.reduce((max, column) => Math.max(max, column.total), 0);
  const ticks = niceTicks(maxTotal);
  const scaleTop = ticks.at(-1) ?? maxTotal;

  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const width = PAD.left + PAD.right + columns.length * SLOT;
  const y = (value: number): number => PAD.top + plotHeight * (1 - value / (scaleTop || 1));

  /*
   * La selezione ripiega sull'ultima colonna quando la chiave scelta non
   * appartiene ai dati correnti: cambiando esercizio le chiavi cambiano tutte,
   * e uno stato rimasto indietro lascerebbe il grafico senza dettaglio.
   */
  const active = columns.find((column) => column.key === picked) ?? columns.at(-1) ?? null;
  const selected = active?.key ?? null;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${String(width)} ${String(HEIGHT)}`}
          role="img"
          aria-label={title}
          className="block"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={GRID}
                strokeWidth={1}
              />
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

          {columns.map((column, index) => {
            const slotX = PAD.left + index * SLOT;
            const barWidth = Math.min(MAX_BAR, SLOT - 10);
            const x = slotX + (SLOT - barWidth) / 2;
            const isActive = column.key === selected;

            let cursor = PAD.top + plotHeight;
            const shapes = column.segments.map((value, setIndex) => {
              const height = Math.max(0, (value / (scaleTop || 1)) * plotHeight - SURFACE_GAP);
              const top = cursor - height;
              cursor = top - SURFACE_GAP;
              const isTop = setIndex === column.segments.length - 1;
              return { setIndex, top, height, isTop };
            });

            return (
              <g key={column.key}>
                {column.marker !== null ? (
                  <>
                    <line
                      x1={slotX}
                      x2={slotX}
                      y1={PAD.top - 10}
                      y2={PAD.top + plotHeight}
                      stroke={INK_DIM}
                      strokeWidth={1}
                    />
                    <text
                      x={index > columns.length - 3 ? slotX - 3 : slotX + 3}
                      y={PAD.top - 4}
                      textAnchor={index > columns.length - 3 ? 'end' : 'start'}
                      fontSize={AXIS_FONT}
                      fill={INK_DIM}
                    >
                      {column.marker}
                    </text>
                  </>
                ) : null}

                {shapes.map((shape) =>
                  shape.height <= 0 ? null : shape.isTop ? (
                    <path
                      key={shape.setIndex}
                      d={topRoundedPath(x, shape.top, barWidth, shape.height)}
                      fill={setColor(shape.setIndex)}
                    />
                  ) : (
                    <rect
                      key={shape.setIndex}
                      x={x}
                      y={shape.top}
                      width={barWidth}
                      height={shape.height}
                      fill={setColor(shape.setIndex)}
                    />
                  ),
                )}

                <text
                  x={slotX + SLOT / 2}
                  y={HEIGHT - PAD.bottom + 14}
                  textAnchor="middle"
                  fontSize={AXIS_FONT}
                  fill={INK_DIM}
                  className="tabular"
                >
                  {column.label}
                </text>

                {/* Area toccabile larga quanto lo slot, non quanto la barra. */}
                <rect
                  x={slotX}
                  y={PAD.top - 12}
                  width={SLOT}
                  height={plotHeight + 26}
                  fill="transparent"
                  onClick={() => { setPicked(column.key); }}
                  style={{ cursor: 'pointer' }}
                />
                {isActive ? (
                  <rect
                    x={slotX + 6}
                    y={HEIGHT - PAD.bottom + 20}
                    width={SLOT - 12}
                    height={3}
                    rx={1.5}
                    fill="var(--color-accent)"
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dim">
        {Array.from({ length: maxSets }, (_unused, index) => (
          <span key={index} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: setColor(index) }}
            />
            Serie {index + 1}
          </span>
        ))}
      </div>

      {active !== null ? (
        <p className="mt-2 text-sm">
          <span className="font-semibold">{active.label}</span>
          <span className="text-dim"> · {active.detail}</span>
        </p>
      ) : null}

      <details className="mt-3">
        <summary className="min-h-12 cursor-pointer py-3 text-sm text-dim">
          Vedi i numeri in tabella
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-dim">
                <th className="py-1 pr-3 font-medium">Data</th>
                {Array.from({ length: maxSets }, (_unused, index) => (
                  <th key={index} className="py-1 pr-3 font-medium">
                    S{index + 1}
                  </th>
                ))}
                <th className="py-1 pr-3 font-medium">Totale</th>
                <th className="py-1 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {columns.map((column) => (
                <tr key={column.key} className="border-t border-line">
                  <td className="py-1 pr-3 whitespace-nowrap">{column.label}</td>
                  {Array.from({ length: maxSets }, (_unused, index) => (
                    <td key={index} className="py-1 pr-3">
                      {column.segments[index] ?? '—'}
                    </td>
                  ))}
                  <td className="py-1 pr-3 font-semibold">
                    {column.total} {unit}
                  </td>
                  <td className="py-1 text-dim">{column.marker ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
