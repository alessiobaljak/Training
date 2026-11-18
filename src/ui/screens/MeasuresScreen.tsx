import { useMemo, useState } from 'react';
import { repository } from '../../db/repository.ts';
import {
  fromWaistEntries,
  fromWeightEntries,
  movingAverage,
  weeklyAverages,
} from '../../engine/metrics.ts';
import { addDays, startOfWeek, todayIso } from '../../engine/dates.ts';
import { WEEKDAY_LABELS } from '../../types/index.ts';
import { useWaists, useWeights } from '../hooks/useData.ts';
import { Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import { NumberStepper } from '../components/NumberStepper.tsx';
import { TrendLine } from '../charts/TrendLine.tsx';
import type { TrendPoint } from '../charts/TrendLine.tsx';
import type { WeekdayIndex } from '../../types/index.ts';

/**
 * Misure.
 *
 * Il numero grande è la media a 7 giorni, non il peso di stamattina: il dato
 * singolo oscilla di un chilo per l'acqua, il sale e l'ora del giorno, e
 * leggerlo come progresso porta a decisioni sbagliate. Il valore giornaliero
 * è un campo da riempire, non un risultato.
 *
 * Qui non c'è nessun obiettivo di peso, nessun conteggio e nessuna azione
 * suggerita: solo registrazione e andamento.
 */

const WEEKDAYS: readonly WeekdayIndex[] = [1, 2, 3, 4, 5, 6, 7];

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day ?? ''}/${month ?? ''}`;
}

function formatDelta(delta: number | null, unit: string): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${String(delta)} ${unit}`;
}

export function MeasuresScreen() {
  const weights = useWeights();
  const waists = useWaists();

  const today = todayIso();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  /*
   * Bozza locale: il database viene scritto quando il numero è definitivo,
   * non a ogni cifra digitata.
   */
  const [weightDraft, setWeightDraft] = useState<number | null>(null);
  const [waistDraft, setWaistDraft] = useState<number | null>(null);

  const weekStart = useMemo(() => addDays(startOfWeek(today), weekOffset * 7), [today, weekOffset]);

  const weightByDate = useMemo(
    () => new Map((weights ?? []).map((entry) => [entry.date, entry.kg])),
    [weights],
  );

  const trend = useMemo<TrendPoint[]>(() => {
    const points = movingAverage(fromWeightEntries(weights ?? []));
    return points.map((point) => ({
      key: point.date,
      label: shortDate(point.date),
      value: point.value,
      average: point.average,
      complete: point.complete,
    }));
  }, [weights]);

  const weightWeeks = useMemo(() => weeklyAverages(fromWeightEntries(weights ?? [])), [weights]);
  const waistWeeks = useMemo(() => weeklyAverages(fromWaistEntries(waists ?? [])), [waists]);

  if (weights === undefined || waists === undefined) {
    return (
      <Screen title="Misure">
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const latestAverage = trend.at(-1) ?? null;
  const latestWeek = weightWeeks.at(-1) ?? null;
  const lastWaist = waists.at(-1) ?? null;
  const latestWaistWeek = waistWeeks.at(-1) ?? null;

  const lastKnownWeight = weights.at(-1)?.kg ?? 75;
  const draftWeight = weightDraft ?? weightByDate.get(selectedDate) ?? lastKnownWeight;
  const draftWaist = waistDraft ?? lastWaist?.cm ?? 85;

  const rows = [...new Set([...weightWeeks.map((w) => w.weekStart), ...waistWeeks.map((w) => w.weekStart)])]
    .sort()
    .reverse();

  return (
    <Screen title="Misure" subtitle="Peso a digiuno e girovita">
      <div className="space-y-4">
        <Card tone="accent">
          <p className="text-sm text-dim">Media a 7 giorni</p>
          <p className="mt-1 text-6xl font-semibold">
            {latestAverage === null ? '—' : latestAverage.average}
            {latestAverage === null ? '' : <span className="ml-2 text-2xl text-dim">kg</span>}
          </p>
          <p className="mt-2 text-sm text-dim">
            {latestWeek === null
              ? 'Registra il peso per qualche giorno e la media comincia a dire qualcosa.'
              : `Settimana del ${shortDate(latestWeek.weekStart)} · ${formatDelta(latestWeek.delta, 'kg')} rispetto ${latestWeek.comparedTo === null ? 'a prima' : `alla settimana del ${shortDate(latestWeek.comparedTo)}`}`}
          </p>
          {latestAverage !== null && !latestAverage.complete ? (
            <p className="mt-2 text-xs text-warn">
              Finestra non ancora piena: servono sette giorni di misure perché la media sia
              confrontabile.
            </p>
          ) : null}
        </Card>

        <SectionTitle>Peso del giorno</SectionTitle>
        <Card>
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" onClick={() => { setWeekOffset((value) => value - 1); }}>
              ‹
            </Button>
            <p className="text-sm font-semibold">
              {weekOffset === 0 ? 'Questa settimana' : `Settimana del ${shortDate(weekStart)}`}
            </p>
            <Button
              variant="secondary"
              disabled={weekOffset >= 0}
              onClick={() => { setWeekOffset((value) => Math.min(0, value + 1)); }}
            >
              ›
            </Button>
          </div>

          <ul data-testid="week-strip" className="mt-4 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday) => {
              const date = addDays(weekStart, weekday - 1);
              const value = weightByDate.get(date);
              const isSelected = date === selectedDate;
              const isFuture = date > today;
              return (
                <li key={date}>
                  <button
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      setSelectedDate(date);
                      setWeightDraft(null);
                    }}
                    aria-pressed={isSelected}
                    className={`flex min-h-16 w-full flex-col items-center justify-center rounded-2xl border text-xs ${
                      isSelected
                        ? 'border-accent bg-accent/20 text-ink'
                        : value === undefined
                          ? 'border-line-strong bg-panel text-dim'
                          : 'border-good/40 bg-panel text-ink'
                    } disabled:opacity-30`}
                  >
                    <span className="text-dim">{WEEKDAY_LABELS[weekday].slice(0, 1)}</span>
                    <span className="tabular mt-1 font-semibold">{value ?? '—'}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <NumberStepper
              label={`Peso del ${shortDate(selectedDate)}`}
              value={draftWeight}
              onChange={setWeightDraft}
              onCommit={(next) => {
                setWeightDraft(null);
                void repository.saveWeight({ date: selectedDate, kg: next });
              }}
              unit="kg"
              step={0.1}
              min={30}
              max={250}
              hint="a digiuno, dopo il bagno"
            />
          </div>

          {weightByDate.has(selectedDate) ? (
            <div className="mt-3">
              <Button
                full
                variant="ghost"
                onClick={() => {
                  setWeightDraft(null);
                  void repository.deleteWeight(selectedDate);
                }}
              >
                Cancella la misura del {shortDate(selectedDate)}
              </Button>
            </div>
          ) : null}
        </Card>

        <SectionTitle>Andamento</SectionTitle>
        <Card>
          <TrendLine
            points={trend}
            unit="kg"
            title="Peso giornaliero e media a 7 giorni"
            valueLabel="Peso del giorno"
            averageLabel="Media a 7 giorni"
          />
        </Card>

        <SectionTitle>Girovita</SectionTitle>
        <Card>
          <p className="text-4xl font-semibold">
            {lastWaist === null ? '—' : lastWaist.cm}
            {lastWaist === null ? '' : <span className="ml-2 text-xl text-dim">cm</span>}
          </p>
          <p className="mt-1 text-sm text-dim">
            {latestWaistWeek === null
              ? 'Misura all’ombelico, sempre alla stessa ora.'
              : `${formatDelta(latestWaistWeek.delta, 'cm')} rispetto alla misura precedente`}
          </p>
          <div className="mt-4">
            <NumberStepper
              label={`Girovita del ${shortDate(today)}`}
              value={draftWaist}
              onChange={setWaistDraft}
              onCommit={(next) => {
                setWaistDraft(null);
                void repository.saveWaist({ date: today, cm: next });
              }}
              unit="cm"
              step={0.5}
              min={40}
              max={200}
              hint="all’ombelico"
            />
          </div>
        </Card>

        {rows.length > 0 ? (
          <>
            <SectionTitle>Settimana per settimana</SectionTitle>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-dim">
                      <th className="py-2 pr-3 font-medium">Settimana</th>
                      <th className="py-2 pr-3 font-medium">Media</th>
                      <th className="py-2 pr-3 font-medium">Delta</th>
                      <th className="py-2 pr-3 font-medium">Girovita</th>
                      <th className="py-2 font-medium">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {rows.map((week) => {
                      const weight = weightWeeks.find((entry) => entry.weekStart === week);
                      const waist = waistWeeks.find((entry) => entry.weekStart === week);
                      return (
                        <tr key={week} className="border-t border-line">
                          <td className="py-2 pr-3 whitespace-nowrap">{shortDate(week)}</td>
                          <td className="py-2 pr-3 font-semibold text-ink">{weight?.average ?? '—'}</td>
                          <td className="py-2 pr-3 text-dim">{formatDelta(weight?.delta ?? null, '')}</td>
                          <td className="py-2 pr-3">{waist?.average ?? '—'}</td>
                          <td className="py-2 text-dim">{formatDelta(waist?.delta ?? null, '')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : null}

        <Notice>
          Qui non c’è nessun obiettivo di peso e nessuna azione suggerita. Il peso di stamattina
          oscilla di un chilo per acqua, sale e ora del giorno: l’unico numero che significa
          qualcosa è la media, e serve a vedere un andamento, non a giudicare una giornata.
        </Notice>
      </div>
    </Screen>
  );
}
