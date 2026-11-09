import { useMemo, useState } from 'react';
import { findExercise } from '../../data/exercises.ts';
import { MUSCLE_GROUP_LABELS, WEEKLY_SET_TARGET } from '../../types/index.ts';
import { exerciseHistory, loggedExerciseSlugs } from '../../engine/history.ts';
import { adherenceFromSessions, sessionsInWeek, volumeByGroup } from '../../engine/metrics.ts';
import { addDays, startOfWeek, todayIso } from '../../engine/dates.ts';
import { programWeek } from '../../engine/schedule.ts';
import { ACTIVE_SESSIONS } from '../../data/sessions.ts';
import { useSessions, useSettings } from '../hooks/useData.ts';
import { Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import { StackedColumns } from '../charts/StackedColumns.tsx';
import { TargetBars } from '../charts/TargetBars.tsx';
import type { ColumnDatum } from '../charts/StackedColumns.tsx';

/**
 * Progressi.
 *
 * Le sedute del programma attivo sono quattro: è il denominatore
 * dell'aderenza.
 */
const SESSIONS_PER_WEEK = ACTIVE_SESSIONS.length;

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day ?? ''}/${month ?? ''}`;
}

export function ProgressScreen() {
  const sessions = useSessions();
  const settings = useSettings();
  const [slug, setSlug] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState(0);

  const slugs = useMemo(() => loggedExerciseSlugs(sessions ?? []), [sessions]);
  const chosen = slug === '' ? (slugs[0] ?? '') : slug;

  const points = useMemo(
    () => (chosen === '' ? [] : exerciseHistory(sessions ?? [], chosen)),
    [sessions, chosen],
  );

  const columns = useMemo<ColumnDatum[]>(
    () =>
      points.map((point) => {
        const notes: string[] = [];
        if (point.levelChanged) notes.push(point.level === null ? 'variante' : `Liv. ${String(point.level)}`);
        if (point.loadChanged) notes.push(`${String(point.loadKg)} kg`);
        return {
          key: `${point.sessionLogId}-${point.blockCode}`,
          label: shortDate(point.date),
          segments: point.setTotals,
          total: point.total,
          marker: notes.length === 0 ? null : notes.join(' · '),
          detail: `${point.variantLabel} · ${point.setLabels.join(' · ')} · ${String(point.total)} totali${point.loadKg > 0 ? ` · ${String(point.loadKg)} kg` : ''}`,
        };
      }),
    [points],
  );

  const weekStart = useMemo(
    () => addDays(startOfWeek(todayIso()), weekOffset * 7),
    [weekOffset],
  );

  const volume = useMemo(
    () => volumeByGroup(sessionsInWeek(sessions ?? [], weekStart)),
    [sessions, weekStart],
  );

  if (sessions === undefined || settings === undefined) {
    return (
      <Screen title="Progressi">
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const start = settings.programStartDate;
  const weeksElapsed = start === null ? 0 : Math.max(0, programWeek(start, todayIso()));
  const adherence = adherenceFromSessions(sessions, SESSIONS_PER_WEEK, start, todayIso());

  return (
    <Screen title="Progressi">
      <div className="space-y-4">
        <SectionTitle>Aderenza</SectionTitle>
        <Card>
          {/*
            Il primo giorno non c'è ancora niente di dovuto, e «—» non lo
            dice: sembra un dato mancante. Senza giorni assegnati le quattro
            sedute stanno dentro sette come si vuole, quindi al primo giorno
            non si è in ritardo di nulla — ed è una risposta, non un buco.
          */}
          <p className="text-5xl font-semibold">
            {adherence.percent !== null
              ? `${String(adherence.percent)}%`
              : start === null
                ? '—'
                : 'in pari'}
          </p>
          <p className="mt-1 text-sm text-dim">
            {adherence.planned === 0 && start !== null
              ? 'Niente di dovuto finora: le quattro sedute stanno dentro i sette giorni come vuoi tu. '
              : null}
            {adherence.completed} sedute chiuse su {adherence.planned} previste fino a oggi.{' '}
            {weeksElapsed <= 1 ? 'Prima settimana' : `Settimana ${String(weeksElapsed)}`}, con la
            settimana in corso contata solo per i giorni già passati.
          </p>
        </Card>

        <SectionTitle>Andamento di un esercizio</SectionTitle>
        {slugs.length === 0 ? (
          <Card tone="muted">
            <p className="text-sm leading-relaxed text-dim">
              Ancora nessuna serie registrata. I grafici compaiono dopo il primo allenamento.
            </p>
          </Card>
        ) : (
          <Card>
            <select
              value={chosen}
              onChange={(event) => { setSlug(event.target.value); }}
              className="min-h-14 w-full rounded-2xl border border-line-strong bg-panel px-4 text-sm text-ink"
              aria-label="Scegli l’esercizio"
            >
              {slugs.map((entry) => (
                <option key={entry} value={entry}>
                  {findExercise(entry)?.name ?? entry}
                </option>
              ))}
            </select>

            <p className="mt-3 text-xs leading-relaxed text-dim">
              L’altezza è il totale, i segmenti sono le singole serie. Le linee verticali segnano i
              cambi di livello e di zavorra: senza, un salto di variante sembrerebbe un crollo.
            </p>

            <div className="mt-3">
              <StackedColumns
                columns={columns}
                unit="rip"
                title={`Ripetizioni per serie di ${findExercise(chosen)?.name ?? chosen}`}
              />
            </div>
          </Card>
        )}

        <SectionTitle>Volume settimanale</SectionTitle>
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

          <div className="mt-4">
            <TargetBars
              bars={volume.map((entry) => ({
                key: entry.group,
                label: MUSCLE_GROUP_LABELS[entry.group],
                value: entry.sets,
                status: entry.status,
              }))}
              target={WEEKLY_SET_TARGET}
              caption={`Serie piene sui gruppi primari, a metà su quelli secondari. La banda è il riferimento del metodo: ${String(WEEKLY_SET_TARGET.min)}-${String(WEEKLY_SET_TARGET.max)} serie a settimana per gruppo.`}
            />
          </div>
        </Card>

        <Notice>
          Il programma scritto a tavolino sfora la fascia su braccia e spalle e resta sotto su
          quadricipiti, core e polpacci. È una proprietà della scheda, non un errore di conteggio:
          questi numeri servono a vederla, non a nasconderla.
        </Notice>
      </div>
    </Screen>
  );
}
