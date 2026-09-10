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

/*
 * Sistema di coordinate fisso, scalato alla larghezza del contenitore: con lo
 * scorrimento orizzontale le etichette dell'asse verticale finirebbero fuori
 * schermo proprio mentre si guardano i dati più recenti.
 */
const WIDTH = 340;
const HEIGHT = 200;
const PAD = { top: 18, right: 12, bottom: 34, left: 30 };

/** Oltre questo numero le colonne diventano illeggibili: si mostrano le ultime. */
const MAX_COLUMNS = 24;

export function StackedColumns({ columns, unit, title }: StackedColumnsProps) {
  const [picked, setPicked] = useState<string | null>(null);

  if (columns.length === 0) {
    return <p className="text-sm text-dim">Nessuna serie registrata su questo esercizio.</p>;
  }

  const hidden = Math.max(0, columns.length - MAX_COLUMNS);
  const shown = hidden === 0 ? columns : columns.slice(-MAX_COLUMNS);

  const maxSets = shown.reduce((max, column) => Math.max(max, column.segments.length), 0);
  const maxTotal = shown.reduce((max, column) => Math.max(max, column.total), 0);
  const ticks = niceTicks(maxTotal);
  const scaleTop = ticks.at(-1) ?? maxTotal;

  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const slot = (WIDTH - PAD.left - PAD.right) / shown.length;
  const barWidth = Math.max(3, Math.min(MAX_BAR, slot - 4));
  const y = (value: number): number => PAD.top + plotHeight * (1 - value / (scaleTop || 1));

  /*
   * La selezione ripiega sull'ultima colonna quando la chiave scelta non
   * appartiene ai dati correnti: cambiando esercizio le chiavi cambiano tutte,
   * e uno stato rimasto indietro lascerebbe il grafico senza dettaglio.
   */
  const active = shown.find((column) => column.key === picked) ?? shown.at(-1) ?? null;
  const selected = active?.key ?? null;

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
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
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

          {shown.map((column, index) => {
            const slotX = PAD.left + index * slot;
            const x = slotX + (slot - barWidth) / 2;
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
                      x={index > shown.length - 3 ? slotX - 3 : slotX + 3}
                      y={PAD.top - 4}
                      textAnchor={index > shown.length - 3 ? 'end' : 'start'}
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
                  x={slotX + slot / 2}
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
                  width={slot}
                  height={plotHeight + 26}
                  fill="transparent"
                  onClick={() => { setPicked(column.key); }}
                  style={{ cursor: 'pointer' }}
                />
                {isActive ? (
                  <rect
                    x={slotX + slot / 2 - barWidth / 2}
                    y={HEIGHT - PAD.bottom + 20}
                    width={barWidth}
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

      {hidden > 0 ? (
        <p className="mt-2 text-xs text-dim">
          Ultime {MAX_COLUMNS} sedute. Le {hidden} precedenti sono nella tabella qui sotto.
        </p>
      ) : null}

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
