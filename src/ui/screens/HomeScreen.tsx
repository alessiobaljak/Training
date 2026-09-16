import { useState } from 'react';
import { getSession, getSessionForWeekday, isRestDay } from '../../data/program.ts';
import { getExercise } from '../../data/exercises.ts';
import { daysBetween, isoWeekday, todayIso } from '../../engine/dates.ts';
import type { NextTraining } from '../../engine/schedule.ts';
import { getWeekState, isRetestDue, nextTrainingDay, programWeek } from '../../engine/schedule.ts';
import { totalWorkSets } from '../../engine/rest.ts';
import type { LoggedSession, ProgramSession } from '../../types/index.ts';
import { WEEKDAY_LABELS } from '../../types/index.ts';
import { repository } from '../../db/repository.ts';
import { navigate } from '../router.ts';
import { useIsOnboarded, useSessions, useSettings } from '../hooks/useData.ts';
import { useSnapshots } from '../hooks/useSnapshots.ts';
import { Badge, Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';

/** Quante serie sono finite nel registro, su tutti gli esercizi. */
function countSets(session: LoggedSession | null): number {
  if (session === null) return 0;
  return session.exercises.reduce((total, entry) => total + entry.sets.length, 0);
}

/**
 * Home: che giorno è, cosa si fa oggi, un pulsante solo.
 *
 * Senza un giro di test completo la schermata resta chiusa e porta ai test.
 * Mostrare un programma con range calcolati sui numeri di esempio della scheda
 * sarebbe peggio che non mostrare niente.
 */
export function HomeScreen() {
  const onboarded = useIsOnboarded();
  const settings = useSettings();
  const sessions = useSessions();
  const snapshots = useSnapshots();
  /* Quale seduta fuori posto sta aspettando conferma di eliminazione. */
  const [daEliminare, setDaEliminare] = useState<string | null>(null);

  const today = todayIso();
  const weekday = isoWeekday(today);

  if (onboarded === undefined || settings === undefined) {
    return (
      <Screen title="Shadow">
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  if (!onboarded) {
    return (
      <Screen title="Shadow" subtitle="Settimana 0">
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
  const week = startDate === null ? 1 : programWeek(startDate, today);
  const notStartedYet = week === 0 && startDate !== null;
  const weekState = getWeekState(Math.max(1, week));
  const session = getSessionForWeekday(weekday);
  const retestDue = isRetestDue(week, weekday);

  /*
   * La Home parla della seduta che il calendario prescrive per oggi.
   *
   * Prima guardava «una qualunque seduta registrata oggi»: bastava una Lower A
   * finita di mercoledì perché la Home dicesse «Lower A è finita, domani Upper
   * B» e la corsa del mercoledì sparisse del tutto. Il giorno ha una seduta
   * sua, e il suo stato è quello: da fare, aperta, finita.
   */
  const dateOggi = sessions?.filter((entry) => entry.date === today) ?? [];
  const diOggi = session === null ? [] : dateOggi.filter((entry) => entry.sessionId === session.id);
  const doneToday = diOggi.find((entry) => entry.status === 'completed') ?? null;
  const openToday = diOggi.find((entry) => entry.status === 'in-progress') ?? null;
  const setsToday = countSets(doneToday ?? openToday);

  /*
   * Tutto il resto che sta in giro: sedute registrate oggi che non sono quella
   * di oggi, e sedute rimaste aperte in altri giorni. Vanno viste e va potuto
   * farci qualcosa, altrimenti restano lì per sempre a sporcare lo storico.
   */
  const fuoriPosto = [
    ...dateOggi.filter((entry) => session === null || entry.sessionId !== session.id),
    ...(sessions ?? []).filter(
      (entry) => entry.date !== today && entry.status === 'in-progress',
    ),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const next = nextTrainingDay(today);
  const nextSession = getSessionForWeekday(next.weekday);

  /* Il pulsante apre la seduta di oggi secondo il calendario, non altre. */
  const apriSessione = session?.id ?? null;

  /*
   * Le copie contano quelle automatiche, non l'ultimo file scaricato a mano.
   *
   * Prima questa scheda leggeva `lastBackupAt`, che si aggiorna solo quando si
   * scarica il file dalle Impostazioni: con i dati su Firebase e una copia
   * presa da sola ogni giorno, restava per sempre su «Mai fatto. I dati vivono
   * solo su questo telefono», che non era più vero né utile.
   */
  const lastSnapshot = snapshots?.[0] ?? null;
  const backupAgeDays = lastSnapshot === null ? null : daysBetween(lastSnapshot.id, today);

  return (
    <Screen
      title={WEEKDAY_LABELS[weekday]}
      subtitle={`${notStartedYet ? 'Settimana 0' : `Settimana ${String(week)}`} · ${today}`}
      footer={
        apriSessione === null ? undefined : (
          <div className="pb-1">
            <Button
              full
              size="xl"
              variant={doneToday !== null || notStartedYet ? 'secondary' : 'primary'}
              onClick={() => { navigate({ name: 'session', sessionId: apriSessione }); }}
            >
              {doneToday !== null
                ? 'Riapri la seduta di oggi'
                : openToday !== null
                  ? 'Riprendi la seduta'
                  : notStartedYet
                    ? 'Inizia comunque oggi'
                    : 'Inizia'}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{notStartedYet ? 'Settimana 0' : `Settimana ${String(week)}`}</Badge>
          {!notStartedYet && weekState.isDeload ? <Badge tone="warn">Scarico</Badge> : null}
          {!notStartedYet && weekState.isRetestWeek ? <Badge tone="good">Ritest</Badge> : null}
        </div>

        {notStartedYet ? (
          <Notice>
            Test finiti. La settimana 1 parte lunedì {startDate}. Da qui a lì non c’è niente da
            fare: il primo blocco della prima settimana va affrontato riposato.
          </Notice>
        ) : null}

        {/*
          Sedute fuori posto: registrate oggi ma non di oggi, oppure rimaste
          aperte in altri giorni.

          Prima questa scheda aveva un pulsante «Riprendi» che apriva la seduta
          *di oggi* con quel nome, non quella vecchia: premerlo su una Lower A
          di ieri creava una Lower A di oggi, e la Home finiva per dire «Lower A
          è finita» in un giorno di corsa. Qui non si riprende niente: si vede
          cosa c'è e lo si archivia o si elimina. Lo storico completo sta nel
          Log.
        */}
        {fuoriPosto.length > 0 ? (
          <Card tone="warn">
            <p className="text-sm font-semibold">
              {fuoriPosto.length === 1 ? 'Una seduta fuori posto' : 'Sedute fuori posto'}
            </p>
            <p className="mt-1 text-sm text-dim">
              Non fanno parte del programma di oggi. Puoi archiviarle o eliminarle.
            </p>
            <ul className="mt-3 space-y-2">
              {fuoriPosto.map((entry) => {
                const serie = countSets(entry);
                const inCorso = entry.status === 'in-progress';
                return (
                  <li key={entry.id} className="rounded-xl border border-line bg-panel p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {getSession(entry.sessionId).name}
                        </p>
                        <p className="tabular mt-1 text-xs text-dim">
                          {entry.date} · {serie === 0 ? 'nessuna serie' : `${String(serie)} serie`}
                        </p>
                      </div>
                      <Badge tone={inCorso ? 'warn' : 'neutral'}>
                        {inCorso ? 'Aperta' : 'Chiusa'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {inCorso && serie > 0 ? (
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

        {retestDue ? (
          <Notice tone="warn">
            Fine settimana {week}: è il momento del ritest dei massimali. Da lì l’app ricalcola tutti
            i range.
            <div className="mt-3">
              <Button variant="secondary" onClick={() => { navigate({ name: 'onboarding' }); }}>
                Rifai i test
              </Button>
            </div>
          </Notice>
        ) : null}

        {!notStartedYet && weekState.banner !== null ? (
          <Notice tone={weekState.isDeload ? 'warn' : 'accent'}>{weekState.banner}</Notice>
        ) : null}

        {doneToday !== null ? (
          <Card tone="accent">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-good">
                  {session?.name ?? 'Seduta'} è finita
                </p>
                <p className="mt-1 text-sm text-dim">
                  {setsToday === 0
                    ? 'Chiusa senza serie registrate.'
                    : `${String(setsToday)} serie registrate oggi.`}
                </p>
              </div>
              <Badge tone="good">Fatta</Badge>
            </div>
            <NextTrainingBlock next={next} nextSession={nextSession} />
          </Card>
        ) : openToday !== null ? (
          <Card tone="accent">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold">{session?.name ?? 'Seduta'}</p>
                <p className="mt-1 text-sm text-dim">
                  {setsToday === 0
                    ? 'Aperta, ancora nessuna serie registrata.'
                    : `${String(setsToday)} serie registrate. La seduta è ancora aperta: chiudila dalla schermata della seduta per archiviarla.`}
                </p>
              </div>
              <Badge tone="warn">Aperta</Badge>
            </div>
          </Card>
        ) : session === null ? (
          <Card>
            <p className="text-lg font-semibold">
              {isRestDay(weekday) ? 'Riposo completo' : 'Nessuna seduta oggi'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-dim">
              Domenica non si allena. Il recupero non è tempo perso: è la parte in cui l’adattamento
              avviene davvero.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold">{session.name}</p>
                <p className="mt-1 text-sm text-dim">{session.focus}</p>
              </div>
              <Badge>{session.estimatedMinutes}′</Badge>
            </div>

            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <p className="text-dim">Blocchi</p>
                <p className="tabular text-lg font-semibold">{session.blocks.length}</p>
              </div>
              <div>
                <p className="text-dim">Serie</p>
                <p className="tabular text-lg font-semibold">
                  {totalWorkSets(session, Math.max(1, week))}
                </p>
              </div>
            </div>

            {session.warmup.length > 0 ? (
              <>
                <SectionTitle>Warm-up</SectionTitle>
                <ul className="space-y-1 text-sm text-dim">
                  {session.warmup.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}

            <SectionTitle>Blocchi</SectionTitle>
            <ul className="space-y-1 text-sm">
              {session.blocks.map((block) => (
                <li key={block.code} className="flex gap-3">
                  <span className="w-8 shrink-0 font-mono text-accent">{block.code}</span>
                  <span className="flex-1 truncate">{getExercise(block.exercise).name}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card
          tone={
            snapshots === undefined
              ? 'muted'
              : backupAgeDays === null || backupAgeDays > 14
                ? 'warn'
                : 'muted'
          }
        >
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
      </div>
    </Screen>
  );
}

/**
 * Quando si torna in palestra.
 *
 * Conta i giorni invece di dare per scontato che il riposo sia sempre e solo
 * la domenica: se un giorno di riposo cambia, questo testo resta vero.
 */
function NextTrainingBlock({
  next,
  nextSession,
}: {
  readonly next: NextTraining;
  readonly nextSession: ProgramSession | null;
}) {
  const quando = next.inDays === 1 ? 'Domani' : WEEKDAY_LABELS[next.weekday];
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-xs tracking-wide text-dim uppercase">Prossimo allenamento</p>
      <p className="mt-1 text-lg font-semibold">
        {quando}
        {nextSession === null ? '' : ` · ${nextSession.name}`}
      </p>
      <p className="mt-1 text-sm text-dim">
        {next.inDays === 1
          ? `${WEEKDAY_LABELS[next.weekday]} ${next.date}.`
          : `${WEEKDAY_LABELS[next.weekday]} ${next.date}, tra ${String(next.inDays)} giorni. Il recupero è parte del programma.`}
      </p>
    </div>
  );
}
