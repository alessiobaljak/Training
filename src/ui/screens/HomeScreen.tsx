import { useState } from 'react';
import { ACTIVE_SESSIONS, findAnySession } from '../../data/sessions.ts';
import { findCircuitSession } from '../../data/circuit.ts';
import { daysBetween, todayIso } from '../../engine/dates.ts';
import { buildGuidedPlan, estimatedSeconds } from '../../engine/circuit.ts';
import { IN_A_ROW_WARNING, rotationState } from '../../engine/rotation.ts';
import { getWeekState, programWeek } from '../../engine/schedule.ts';
import { pendingVerdicts, reviewWeek } from '../../engine/review.ts';
import { totalWorkSets } from '../../engine/rest.ts';
import { MUSCLE_GROUP_LABELS } from '../../types/index.ts';
import type { LoggedSession, ProgramSession } from '../../types/index.ts';
import { repository } from '../../db/repository.ts';
import { navigate } from '../router.ts';
import {
  useExerciseStates,
  useIsOnboarded,
  useLatestTests,
  useSessions,
  useSettings,
  useSuggestions,
} from '../hooks/useData.ts';
import { useSnapshots } from '../hooks/useSnapshots.ts';
import { Badge, Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';

/**
 * Home: cosa alleni adesso.
 *
 * Non c'è più un calendario, e con lui è sparita la domanda che il calendario
 * poneva — «è il giorno giusto?» — insieme a tutta la macchina per rispondere
 * di no. Le quattro sedute stanno in un ordine, si fanno in quell'ordine, e
 * «prossima» vuol dire la successiva all'ultima che hai chiuso: non oggi, non
 * martedì, la successiva.
 *
 * Quello che il calendario proteggeva resta protetto, ma letto dal diario:
 * quanti giorni di fila ti stai allenando, e se la seduta che stai per aprire
 * ricarica i muscoli di ieri. Sono conti, non divieti.
 */

function contaSerie(session: LoggedSession | null): number {
  if (session === null) return 0;
  return session.exercises.reduce((total, entry) => total + entry.sets.length, 0);
}

function durata(session: ProgramSession): string {
  const secondi = estimatedSeconds(buildGuidedPlan(session, 1));
  return `${String(Math.round(secondi / 60))}′`;
}

export function HomeScreen() {
  const onboarded = useIsOnboarded();
  const settings = useSettings();
  const sessions = useSessions();
  const exerciseStates = useExerciseStates();
  const latestTests = useLatestTests();
  const suggestions = useSuggestions();
  const snapshots = useSnapshots();
  const [daEliminare, setDaEliminare] = useState<string | null>(null);

  const today = todayIso();

  if (onboarded === undefined || settings === undefined) {
    return (
      <Screen title="Allenamento">
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  if (!onboarded) {
    return (
      <Screen title="Allenamento" subtitle="Settimana 0">
        <div className="space-y-4">
          <Notice tone="warn">
            Il programma è chiuso finché non hai fatto i nove test. I range di lavoro escono dai
            tuoi massimali: senza, sarebbero numeri inventati.
          </Notice>
          <Card tone="muted">
            <p className="text-sm leading-relaxed text-dim">
              Una serie sola per test, fino al cedimento della forma, con 4-5 minuti di recupero tra
              uno e l’altro. Puoi spezzare i test su più giorni: l’app riprende da dove hai lasciato.
            </p>
          </Card>
        </div>
        <div className="mt-6">
          <Button full size="xl" onClick={() => { navigate({ name: 'onboarding' }); }}>
            Vai ai test
          </Button>
        </div>
      </Screen>
    );
  }

  const startDate = settings.programStartDate;
  const week = startDate === null ? 1 : Math.max(1, programWeek(startDate, today));
  const weekState = getWeekState(week);

  const tutte = sessions ?? [];
  const rotazione = rotationState(today, tutte);
  const prossima = findCircuitSession(rotazione.next);

  /* Le sedute rimaste aperte, di oggi o di qualunque altro giorno. */
  const aperte = tutte
    .filter((entry) => entry.status === 'in-progress')
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  /* L'ultima volta che ciascuna seduta del programma è stata chiusa. */
  const ultimaVolta = new Map<string, string>();
  for (const entry of tutte) {
    if (entry.status !== 'completed') continue;
    const precedente = ultimaVolta.get(entry.sessionId);
    if (precedente === undefined || precedente < entry.date) {
      ultimaVolta.set(entry.sessionId, entry.date);
    }
  }

  const lastSnapshot = snapshots?.[0] ?? null;
  const backupAgeDays = lastSnapshot === null ? null : daysBetween(lastSnapshot.id, today);

  const settimanaChiusa = week - 1;
  const revisione =
    settimanaChiusa >= 1 &&
    sessions !== undefined &&
    exerciseStates !== undefined &&
    latestTests !== undefined
      ? reviewWeek({
          week: settimanaChiusa,
          sessions,
          states: new Map(exerciseStates.map((state) => [state.exercise, state])),
          tests: latestTests,
        })
      : null;
  const daDecidere =
    revisione === null || suggestions === undefined
      ? []
      : pendingVerdicts(revisione, new Set(suggestions.map((record) => record.id)));

  const ripetuti = rotazione.repeatedMuscles.map((gruppo) => MUSCLE_GROUP_LABELS[gruppo]);

  return (
    <Screen
      title="Allenamento"
      subtitle={`Settimana ${String(week)} · ${today}`}
      footer={
        prossima === undefined ? undefined : (
          <div className="pb-1">
            <Button
              full
              size="xl"
              onClick={() => { navigate({ name: 'scheda', sessionId: prossima.id }); }}
            >
              Apri {prossima.name}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">Settimana {week}</Badge>
          {weekState.isDeload ? <Badge tone="warn">Scarico</Badge> : null}
          {weekState.isRetestWeek ? <Badge tone="good">Ritest</Badge> : null}
          <Badge tone="neutral">4 sedute a settimana</Badge>
        </div>

        {daDecidere.length > 0 ? (
          <Card tone="accent">
            <p className="text-sm font-semibold">
              Settimana {settimanaChiusa} chiusa:{' '}
              {daDecidere.length === 1
                ? '1 cosa da cambiare'
                : `${String(daDecidere.length)} cose da cambiare`}
            </p>
            <ul className="mt-2 space-y-1">
              {daDecidere.slice(0, 3).map((verdict) => (
                <li key={verdict.exercise} className="text-sm leading-relaxed text-dim">
                  {verdict.title}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Button full onClick={() => { navigate({ name: 'review', week: settimanaChiusa }); }}>
                Rivedi la settimana
              </Button>
            </div>
          </Card>
        ) : null}

        {weekState.isDeload ? <Notice tone="warn">{weekState.banner}</Notice> : null}

        {/* -------------------------------------------------------------- */}
        {/* La prossima                                                     */}
        {/* -------------------------------------------------------------- */}
        {prossima !== undefined ? (
          <Card tone="accent">
            <p className="text-xs tracking-wide text-accent uppercase">Prossima</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-3xl leading-tight font-semibold">{prossima.name}</p>
                <p className="mt-1 text-sm text-dim">{prossima.focus}</p>
              </div>
              <Badge>{durata(prossima)}</Badge>
            </div>

            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <p className="text-dim">Serie</p>
                <p className="tabular text-lg font-semibold">{totalWorkSets(prossima, week)}</p>
              </div>
              <div>
                <p className="text-dim">Blocchi</p>
                <p className="tabular text-lg font-semibold">
                  {new Set(prossima.blocks.map((block) => block.group)).size}
                </p>
              </div>
              <div>
                <p className="text-dim">Ultima volta</p>
                <p className="tabular text-lg font-semibold">
                  {ultimaVolta.get(prossima.id) === undefined
                    ? 'mai'
                    : `${String(daysBetween(ultimaVolta.get(prossima.id) ?? today, today))} g fa`}
                </p>
              </div>
            </div>

            {/*
              Nessun divieto, due conti.

              Il calendario impediva di allenarsi cinque giorni di fila
              mettendoci in mezzo una domenica. Senza calendario quel limite
              non c'è, e la cosa giusta non è rimetterlo: è dire cosa stai per
              fare e lasciarti decidere.
            */}
            {ripetuti.length > 0 ? (
              <div className="mt-4">
                <Notice tone="warn">
                  {rotazione.daysSince === 0 ? 'Oggi' : 'Ieri'} hai già caricato{' '}
                  {ripetuti.join(', ').toLowerCase()}. Questa seduta li ricarica: il muscolo che non
                  ha riposato non cresce, si consuma.
                </Notice>
              </div>
            ) : null}
            {rotazione.inARow >= IN_A_ROW_WARNING ? (
              <div className="mt-3">
                <Notice tone="warn">
                  {rotazione.inARow} giorni di allenamento di fila. Il recupero non è tempo perso:
                  è la parte in cui l’adattamento avviene.
                </Notice>
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* -------------------------------------------------------------- */}
        {/* Tutte e quattro, sempre apribili                                */}
        {/* -------------------------------------------------------------- */}
        <div>
          <SectionTitle>Le quattro sedute</SectionTitle>
          <ul className="space-y-2">
            {ACTIVE_SESSIONS.map((session) => {
              const ultima = ultimaVolta.get(session.id);
              const attiva = session.id === rotazione.next;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => { navigate({ name: 'scheda', sessionId: session.id }); }}
                    className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                      attiva ? 'border-accent bg-accent/10' : 'border-line bg-panel active:bg-line'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">{session.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-dim">{session.focus}</span>
                    </span>
                    <span className="tabular shrink-0 text-right text-xs text-dim">
                      <span className="block">{durata(session)}</span>
                      <span className="block">
                        {ultima === undefined ? 'mai fatta' : `${String(daysBetween(ultima, today))} g fa`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-dim">
            Nessun giorno assegnato: aprile nell’ordine che vuoi. «Prossima» è solo la successiva a
            quella che hai chiuso per ultima.
          </p>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Sedute rimaste aperte                                           */}
        {/* -------------------------------------------------------------- */}
        {aperte.length > 0 ? (
          <Card tone="warn">
            <p className="text-sm font-semibold">
              {aperte.length === 1 ? 'Una seduta rimasta aperta' : 'Sedute rimaste aperte'}
            </p>
            <p className="mt-1 text-sm text-dim">
              Puoi riprenderle da dove le hai lasciate, archiviarle o eliminarle.
            </p>
            <ul className="mt-3 space-y-2">
              {aperte.map((entry) => {
                const serie = contaSerie(entry);
                const nome = findAnySession(entry.sessionId)?.name ?? entry.sessionId;
                return (
                  <li key={entry.id} className="rounded-xl border border-line bg-panel p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{nome}</p>
                        <p className="tabular mt-1 text-xs text-dim">
                          {entry.date} · {serie === 0 ? 'nessuna serie' : `${String(serie)} serie`}
                        </p>
                      </div>
                      <Badge tone="warn">Aperta</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.date === today ? (
                        <Button
                          onClick={() => {
                            navigate({ name: 'session', sessionId: entry.sessionId });
                          }}
                        >
                          Riprendi
                        </Button>
                      ) : null}
                      {serie > 0 ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            void repository.saveSession({ ...entry, status: 'completed' });
                          }}
                        >
                          Archivia
                        </Button>
                      ) : null}
                      <Button
                        variant="danger"
                        onClick={() => {
                          setDaEliminare((corrente) => (corrente === entry.id ? null : entry.id));
                        }}
                      >
                        Elimina
                      </Button>
                    </div>
                    {daEliminare === entry.id ? (
                      <div className="mt-3">
                        <Notice tone="warn">
                          {serie === 0
                            ? 'È vuota: eliminarla non perde niente.'
                            : `Elimini ${String(serie)} serie registrate il ${entry.date}. Non si torna indietro.`}
                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="danger"
                              onClick={() => {
                                setDaEliminare(null);
                                void repository.deleteSession(entry.id);
                              }}
                            >
                              Sì, eliminala
                            </Button>
                            <Button variant="ghost" onClick={() => { setDaEliminare(null); }}>
                              Annulla
                            </Button>
                          </div>
                        </Notice>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}

        {weekState.isRetestWeek ? (
          <Notice tone="warn">
            Settimana {week}: è il momento del ritest dei massimali. Da lì l’app ricalcola tutti i
            range.
            <div className="mt-3">
              <Button variant="secondary" onClick={() => { navigate({ name: 'onboarding' }); }}>
                Rifai i test
              </Button>
            </div>
          </Notice>
        ) : null}

        <Card tone={backupAgeDays === null || backupAgeDays > 14 ? 'warn' : 'muted'}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Copie di sicurezza</p>
              <p className="mt-1 text-sm text-dim">
                {snapshots === undefined
                  ? 'Controllo…'
                  : backupAgeDays === null
                    ? 'Nessuna copia ancora. Ne parte una da sola al primo avvio di domani.'
                    : backupAgeDays === 0
                      ? `Copia automatica di oggi. Ne restano ${String(snapshots.length)} da cui tornare indietro.`
                      : `Ultima copia ${String(backupAgeDays)} giorni fa. Ne restano ${String(snapshots.length)}.`}
              </p>
            </div>
            <Button variant="secondary" onClick={() => { navigate({ name: 'settings' }); }}>
              Apri
            </Button>
          </div>
        </Card>

        {/* Lo Shadow non sparisce: si legge nel diario. */}
        <p className="pb-2 text-center text-xs text-dim">
          Le sei sedute dello Shadow sono archiviate. Lo storico resta nel{' '}
          <button
            type="button"
            onClick={() => { navigate({ name: 'log' }); }}
            className="underline"
          >
            diario
          </button>
          .
        </p>
      </div>
    </Screen>
  );
}
