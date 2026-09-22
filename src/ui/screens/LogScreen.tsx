import { useMemo, useState } from 'react';
import { LOG_CSV_COLUMNS } from '../../data/reference.ts';
import { findExercise } from '../../data/exercises.ts';
import { csvFileName, sessionsToCsv } from '../../db/csv.ts';
import { filterLogRows, logRows, loggedExerciseSlugs } from '../../engine/history.ts';
import { addDays, todayIso } from '../../engine/dates.ts';
import { downloadTextFile } from '../download.ts';
import { useSessions } from '../hooks/useData.ts';
import { Button, Card, Screen } from '../components/primitives.tsx';
import type { LogRow } from '../../engine/history.ts';

/**
 * Storico degli allenamenti, con le stesse tredici colonne del foglio
 * Log_Allenamenti. La tabella scorre in orizzontale dentro il proprio
 * contenitore: tredici colonne non stanno su un telefono, e comprimerle
 * significherebbe troncare i numeri.
 */

const PERIODS = [
  { key: 'all', label: 'Tutto', days: null },
  { key: '4w', label: '4 settimane', days: 28 },
  { key: '12w', label: '12 settimane', days: 84 },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

function cellsOf(row: LogRow): string[] {
  const reps = [...row.setLabels.slice(0, 3)];
  const rest = row.setLabels.slice(3);
  reps.push(rest.join('+'));
  while (reps.length < 4) reps.push('');

  return [
    row.date,
    String(row.week),
    row.sessionName,
    row.exerciseName,
    row.variantLabel,
    row.loadKg > 0 ? String(row.loadKg) : '',
    ...reps.slice(0, 4),
    row.meanRir === null ? '' : String(row.meanRir),
    String(row.total),
    row.note ?? '',
  ];
}

export function LogScreen() {
  const sessions = useSessions();
  const [exercise, setExercise] = useState<string>('');
  const [period, setPeriod] = useState<PeriodKey>('all');

  const all = useMemo(() => logRows(sessions ?? []), [sessions]);
  const slugs = useMemo(() => loggedExerciseSlugs(sessions ?? []), [sessions]);

  const days = PERIODS.find((entry) => entry.key === period)?.days ?? null;
  const filter = {
    ...(exercise === '' ? {} : { exercise }),
    ...(days === null ? {} : { from: addDays(todayIso(), -days) }),
  };
  const rows = useMemo(() => filterLogRows(all, filter), [all, exercise, days]);

  if (sessions === undefined) {
    return (
      <Screen title="Log">
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const exportFiltered = (): void => {
    const ids = new Set(rows.map((row) => row.sessionLogId));
    const filtered = (sessions).filter((session) => ids.has(session.id));
    downloadTextFile(csvFileName(todayIso()), sessionsToCsv(filtered), 'text/csv');
  };

  return (
    <Screen title="Log" subtitle={`${String(rows.length)} righe`}>
      {/* Un'unica riga di filtri sopra tutto quello che filtra. */}
      <div className="space-y-3">
        <select
          value={exercise}
          onChange={(event) => { setExercise(event.target.value); }}
          className="min-h-14 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-ink"
          aria-label="Filtra per esercizio"
        >
          <option value="">Tutti gli esercizi</option>
          {slugs.map((slug) => (
            <option key={slug} value={slug}>
              {findExercise(slug)?.name ?? slug}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {PERIODS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => { setPeriod(entry.key); }}
              aria-pressed={period === entry.key}
              className={`min-h-12 flex-1 rounded-xl border text-sm font-semibold ${
                period === entry.key
                  ? 'border-accent bg-accent/20 text-ink'
                  : 'border-line-strong bg-panel text-dim'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card tone="muted" className="mt-4">
          <p className="text-sm leading-relaxed text-dim">
            Nessuna riga con questi filtri. Il log si riempie da solo mano a mano che registri le
            serie nel player.
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-4 -mx-4 overflow-x-auto px-4">
            <table className="min-w-max text-left text-xs">
              <thead>
                <tr className="text-dim">
                  {LOG_CSV_COLUMNS.map((column) => (
                    <th key={column} className="px-2 py-2 font-medium whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular">
                {rows.map((row) => (
                  <tr key={`${row.sessionLogId}-${row.blockCode}`} className="border-t border-line">
                    {cellsOf(row).map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`px-2 py-2 whitespace-nowrap ${
                          cellIndex === 3 || cellIndex === 11 ? 'font-semibold text-ink' : 'text-dim'
                        }`}
                      >
                        {cell === '' ? '—' : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Button full variant="secondary" size="lg" onClick={exportFiltered}>
              Esporta in CSV quello che vedi
            </Button>
          </div>
        </>
      )}
    </Screen>
  );
}
