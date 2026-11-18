import { useMemo, useState } from 'react';
import { findExercise } from '../../data/exercises.ts';
import { findAnySession } from '../../data/sessions.ts';
import { csvFileName, sessionsToCsv } from '../../db/csv.ts';
import { filterLogRows, logRows, loggedExerciseSlugs } from '../../engine/history.ts';
import { addDays, formatDayShort, formatNumber, plural, todayIso } from '../../engine/dates.ts';
import { downloadTextFile } from '../download.ts';
import { useSessions } from '../hooks/useData.ts';
import { Button, Card, Screen } from '../components/primitives.tsx';
import type { LogRow } from '../../engine/history.ts';

/**
 * Il diario: una scheda per seduta, le serie scritte come le hai fatte.
 *
 * Prima era la tabella a tredici colonne del foglio Log_Allenamenti, larga
 * 1175 pixel su un telefono da 390: per leggere quante trazioni avevi fatto
 * martedì bisognava scorrere di lato oltre la data, la settimana, la seduta,
 * l'esercizio e la variante, e a quel punto la data non si vedeva più. Le
 * tredici colonne restano dove servono, nel CSV che si apre in Excel.
 */

const PERIODS = [
  { key: 'all', label: 'Tutto', days: null },
  { key: '4w', label: '4 settimane', days: 28 },
  { key: '12w', label: '12 settimane', days: 84 },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

interface Gruppo {
  readonly sessionLogId: string;
  readonly date: string;
  readonly week: number;
  readonly sessionName: string;
  readonly lavoro: readonly LogRow[];
  /** Finitura e decompressione: si dice che ci sono state, non si elencano. */
  readonly accessorie: readonly LogRow[];
  readonly note: string | null;
}

function raggruppa(rows: readonly LogRow[], note: ReadonlyMap<string, string | null>): Gruppo[] {
  const gruppi = new Map<string, Gruppo>();
  for (const row of rows) {
    const programma = findAnySession(row.sessionId);
    const blocco = programma?.blocks.find((block) => block.code === row.blockCode);
    const accessoria = blocco?.excludeFromReview === true;
    const esistente = gruppi.get(row.sessionLogId) ?? {
      sessionLogId: row.sessionLogId,
      date: row.date,
      week: row.week,
      sessionName: row.sessionName,
      lavoro: [],
      accessorie: [],
      note: note.get(row.sessionLogId) ?? null,
    };
    gruppi.set(row.sessionLogId, {
      ...esistente,
      lavoro: accessoria ? esistente.lavoro : [...esistente.lavoro, row],
      accessorie: accessoria ? [...esistente.accessorie, row] : esistente.accessorie,
    });
  }
  return [...gruppi.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function Riga({ row }: { readonly row: LogRow }) {
  const esercizio = findExercise(row.exercise);
  const unita = esercizio?.measurement === 'seconds' ? '″' : '';
  /* «Liv. 2 · Bulgarian split squat» sotto «Bulgarian split squat» ripete il nome: resta il livello. */
  const variante = row.variantLabel.endsWith(row.exerciseName)
    ? row.level === null || row.variantLabel === row.exerciseName
      ? null
      : `Liv. ${String(row.level)}`
    : row.variantLabel;
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block text-sm leading-snug">
          <span className="mr-2 font-mono text-xs text-accent">{row.blockCode}</span>
          {row.exerciseName}
        </span>
        {variante === null ? null : <span className="block text-xs text-dim">{variante}</span>}
      </span>
      <span className="tabular shrink-0 text-right">
        <span className="block text-sm font-semibold">
          {row.setLabels.map((label) => `${label}${unita}`).join(' · ')}
        </span>
        {row.loadKg > 0 ? <span className="block text-xs text-dim">{formatNumber(row.loadKg)} kg</span> : null}
      </span>
    </li>
  );
}

export function LogScreen() {
  const sessions = useSessions();
  const [exercise, setExercise] = useState<string>('');
  const [period, setPeriod] = useState<PeriodKey>('all');

  const all = useMemo(() => logRows(sessions ?? []), [sessions]);
  const slugs = useMemo(() => loggedExerciseSlugs(sessions ?? []), [sessions]);

  const days = PERIODS.find((entry) => entry.key === period)?.days ?? null;
  const rows = useMemo(
    () =>
      filterLogRows(all, {
        ...(exercise === '' ? {} : { exercise }),
        ...(days === null ? {} : { from: addDays(todayIso(), -days) }),
      }),
    [all, exercise, days],
  );
  const note = useMemo(
    () => new Map((sessions ?? []).map((session) => [session.id, session.note])),
    [sessions],
  );
  const gruppi = useMemo(() => raggruppa(rows, note), [rows, note]);

  if (sessions === undefined) {
    return (
      <Screen title="Diario">
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const exportFiltered = (): void => {
    const ids = new Set(rows.map((row) => row.sessionLogId));
    const filtered = sessions.filter((session) => ids.has(session.id));
    downloadTextFile(csvFileName(todayIso()), sessionsToCsv(filtered), 'text/csv');
  };

  const today = todayIso();

  return (
    <Screen title="Diario" subtitle={plural(gruppi.length, 'seduta', 'sedute')}>
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
              className={`min-h-12 flex-1 rounded-full border text-sm font-semibold ${
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

      {gruppi.length === 0 ? (
        <Card tone="muted" className="mt-4">
          <p className="text-sm leading-relaxed text-dim">
            {all.length === 0
              ? 'Ancora niente. Il diario si riempie da solo mentre registri le serie nella seduta.'
              : 'Nessuna seduta con questi filtri.'}
          </p>
        </Card>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {gruppi.map((gruppo) => (
              <li key={gruppo.sessionLogId}>
                <Card>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold">{gruppo.sessionName}</p>
                    <p className="tabular shrink-0 text-xs text-dim">
                      {formatDayShort(gruppo.date, today)} · sett. {gruppo.week}
                    </p>
                  </div>
                  {gruppo.lavoro.length > 0 ? (
                    <ul className="mt-1 divide-y divide-line">
                      {gruppo.lavoro.map((row) => (
                        <Riga key={`${row.sessionLogId}-${row.blockCode}`} row={row} />
                      ))}
                    </ul>
                  ) : null}
                  {gruppo.accessorie.length > 0 ? (
                    <p className="mt-2 text-xs text-dim">
                      {exercise === ''
                        ? `Finitura e decompressione: ${plural(gruppo.accessorie.length, 'stazione', 'stazioni')}.`
                        : null}
                    </p>
                  ) : null}
                  {exercise !== '' && gruppo.lavoro.length === 0
                    ? (
                      <ul className="mt-1 divide-y divide-line">
                        {gruppo.accessorie.map((row) => (
                          <Riga key={`${row.sessionLogId}-${row.blockCode}`} row={row} />
                        ))}
                      </ul>
                    )
                    : null}
                  {gruppo.note === null || gruppo.note === '' ? null : (
                    <p className="mt-2 border-t border-line pt-2 text-sm leading-relaxed text-dim">
                      {gruppo.note}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>

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
