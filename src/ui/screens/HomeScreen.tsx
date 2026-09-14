import { getSession, getSessionForWeekday, isRestDay } from '../../data/program.ts';
import { getExercise } from '../../data/exercises.ts';
import { daysBetween, isoWeekday, todayIso } from '../../engine/dates.ts';
import type { NextTraining } from '../../engine/schedule.ts';
import { getWeekState, isRetestDue, nextTrainingDay, programWeek } from '../../engine/schedule.ts';
import { totalWorkSets } from '../../engine/rest.ts';
import type { LoggedSession, ProgramSession } from '../../types/index.ts';
import { WEEKDAY_LABELS } from '../../types/index.ts';
import { navigate } from '../router.ts';
import { useActiveSession, useIsOnboarded, useSessions, useSettings } from '../hooks/useData.ts';
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
  const activeSession = useActiveSession();
  const sessions = useSessions();
  const snapshots = useSnapshots();

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
   * Cosa è successo oggi.
   *
   * Prima la Home diceva «Inizia» anche a seduta finita, come se non fosse
   * successo niente. E se la seduta era solo lasciata aperta mostrava insieme
   * «Hai una seduta aperta» e «Inizia», che sono due cose diverse per lo
   * stesso giorno. Qui oggi ha un solo stato: da fare, aperta, finita.
   */
  const todaySessions = sessions?.filter((entry) => entry.date === today) ?? [];
  const doneToday = todaySessions.find((entry) => entry.status === 'completed') ?? null;
  const openToday = todaySessions.find((entry) => entry.status === 'in-progress') ?? null;
  const setsToday = countSets(doneToday ?? openToday);

  /*
   * Il nome esce dalla seduta registrata, non dal giorno della settimana.
   * Se una seduta viene aperta in un giorno diverso dal suo, la Home deve
   * dire quale seduta è stata fatta davvero.
   */
  const loggedToday = doneToday ?? openToday;
  const loggedName = loggedToday === null ? null : getSession(loggedToday.sessionId).name;

  /* Una seduta lasciata aperta in un altro giorno: quella sì va segnalata. */
  const staleSession =
    activeSession !== undefined && activeSession !== null && activeSession.date !== today
      ? activeSession
      : null;

  const next = nextTrainingDay(today);
  const nextSession = getSessionForWeekday(next.weekday);

  /*
   * Il pulsante riapre la seduta registrata oggi, non quella del calendario:
   * altrimenti «Riapri la seduta di oggi» ne aprirebbe un'altra.
   */
  const apriSessione = loggedToday?.sessionId ?? session?.id ?? null;

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

        {staleSession !== null ? (
          <Card tone="accent">
            <p className="text-sm font-semibold">Hai una seduta rimasta aperta</p>
            <p className="mt-1 text-sm text-dim">
              {staleSession.sessionId} del {staleSession.date}. I dati sono salvati: puoi
              riprenderla da dove l’hai lasciata.
            </p>
            <div className="mt-3">
              <Button
                variant="secondary"
                onClick={() => { navigate({ name: 'session', sessionId: staleSession.sessionId }); }}
              >
                Riprendi
              </Button>
            </div>
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
                  {loggedName ?? 'Seduta'} è finita
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
                <p className="text-2xl font-semibold">{loggedName ?? 'Seduta'}</p>
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
