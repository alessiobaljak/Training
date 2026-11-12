import { useMemo, useState } from 'react';
import { findExercise } from '../../data/exercises.ts';
import { MUSCLE_GROUP_LABELS, WEEKLY_SET_TARGET } from '../../types/index.ts';
import { exerciseHistory, loggedExerciseSlugs } from '../../engine/history.ts';
import {
  adherenceFromSessions,
  plannedVolumeByGroup,
  sessionsInWeek,
  volumeByGroup,
} from '../../engine/metrics.ts';
import { addDays, formatDayShort, formatNumber, plural, startOfWeek, todayIso } from '../../engine/dates.ts';
import { programWeek } from '../../engine/schedule.ts';
import { ACTIVE_SESSIONS } from '../../data/sessions.ts';
import { CIRCUIT_SESSIONS } from '../../data/circuit.ts';
import { useSessions, useSettings } from '../hooks/useData.ts';
import { Button, Card, Screen, SectionTitle } from '../components/primitives.tsx';
import { StackedColumns } from '../charts/StackedColumns.tsx';
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

  /*
   * Nel menu solo gli esercizi che hanno un andamento da leggere, e
   * nell'ordine della scheda. Prima l'elenco era alfabetico e partiva da
   * «Apertura delle anche»: il primo grafico che si vedeva era una colonna
   * da sessanta secondi di stretching, cioè il numero che la scheda fissa e
   * che non può cambiare.
   */
  const slugs = useMemo(() => {
    const registrati = new Set(loggedExerciseSlugs(sessions ?? []));
    const ordine = CIRCUIT_SESSIONS.flatMap((session) =>
      session.blocks.filter((block) => block.excludeFromReview !== true).map((block) => block.exercise),
    );
    const inScheda = [...new Set(ordine)].filter((entry) => registrati.has(entry));
    const altri = [...registrati].filter(
      (entry) =>
        !ordine.includes(entry) &&
        !CIRCUIT_SESSIONS.some((session) => session.blocks.some((block) => block.exercise === entry)),
    );
    return [...inScheda, ...altri];
  }, [sessions]);
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
  const previsto = useMemo(() => plannedVolumeByGroup(CIRCUIT_SESSIONS), []);

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
            {plural(adherence.completed, 'seduta chiusa', 'sedute chiuse')} su {adherence.planned}{' '}
            {adherence.planned === 1 ? 'prevista' : 'previste'} fino a oggi.{' '}
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
            <Button
              variant="secondary"
              ariaLabel="Settimana precedente"
              onClick={() => { setWeekOffset((value) => value - 1); }}
            >
              ‹
            </Button>
            <p className="text-sm font-semibold">
              {weekOffset === 0 ? 'Questa settimana' : `Dal ${formatDayShort(weekStart)}`}
            </p>
            <Button
              variant="secondary"
              ariaLabel="Settimana seguente"
              disabled={weekOffset >= 0}
              onClick={() => { setWeekOffset((value) => Math.min(0, value + 1)); }}
            >
              ›
            </Button>
          </div>

          {/*
            Fatte contro previste dal programma, non contro la fascia.

            Prima ogni gruppo era confrontato con i 16-20 del metodo e
            colorato di conseguenza: con questa scheda sette gruppi su otto
            finivano «sotto» anche facendo tutto, perché la scheda ne prevede
            meno. Una schermata che dice «sotto» a chi ha fatto ogni serie
            insegna a non guardarla. La fascia sta più sotto, come
            riferimento.
          */}
          <ul className="mt-4 space-y-3">
            {previsto
              .filter((entry) => entry.sets > 0)
              .sort((x, y) => y.sets - x.sets)
              .map((entry) => {
                const fatte = volume.find((row) => row.group === entry.group)?.sets ?? 0;
                const quota = Math.min(100, (fatte / entry.sets) * 100);
                return (
                  <li key={entry.group}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-dim">{MUSCLE_GROUP_LABELS[entry.group]}</span>
                      <span className="tabular text-dim">
                        <span className="font-semibold text-ink">{formatNumber(fatte)}</span> di{' '}
                        {formatNumber(entry.sets)}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-panel">
                      <div
                        className="h-full rounded-full bg-[var(--color-mark)]"
                        style={{ width: `${String(quota)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-dim">
            Serie delle sedute chiuse, piene sui muscoli principali e a metà su quelli che
            aiutano. Finitura e decompressione non contano: non sono serie di allenamento.
          </p>
        </Card>

        <SectionTitle>Il programma e la fascia del metodo</SectionTitle>
        <Card tone="muted">
          <p className="text-sm leading-relaxed text-dim">
            Il metodo indica {WEEKLY_SET_TARGET.min}-{WEEKLY_SET_TARGET.max} serie a settimana per
            gruppo. Questa scheda le supera su{' '}
            {previsto
              .filter((entry) => entry.status === 'over')
              .map((entry) => MUSCLE_GROUP_LABELS[entry.group].toLowerCase())
              .join(', ') || 'nessun gruppo'}
            , ci sta su{' '}
            {previsto
              .filter((entry) => entry.status === 'in')
              .map((entry) => MUSCLE_GROUP_LABELS[entry.group].toLowerCase())
              .join(', ') || 'nessun gruppo'}{' '}
            e resta sotto su{' '}
            {previsto
              .filter((entry) => entry.status === 'under')
              .map((entry) => MUSCLE_GROUP_LABELS[entry.group].toLowerCase())
              .join(', ') || 'nessun gruppo'}
            .
          </p>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            È una proprietà della scheda, non di come ti alleni: braccia e vita sono la priorità, e
            sei stazioni a seduta non bastano a portare tutto il resto nella fascia.
          </p>
        </Card>
      </div>
    </Screen>
  );
}
