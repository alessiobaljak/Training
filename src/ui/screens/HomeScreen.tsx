import { getSessionForWeekday, isRestDay } from '../../data/program.ts';
import { getExercise } from '../../data/exercises.ts';
import { daysBetween, isoWeekday, todayIso } from '../../engine/dates.ts';
import { getWeekState, isRetestDue, programWeek } from '../../engine/schedule.ts';
import { totalWorkSets } from '../../engine/rest.ts';
import { WEEKDAY_LABELS } from '../../types/index.ts';
import { navigate } from '../router.ts';
import { useActiveSession, useIsOnboarded, useSettings } from '../hooks/useData.ts';
import { Badge, Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';

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

  const backupAgeDays =
    settings.lastBackupAt === null
      ? null
      : daysBetween(settings.lastBackupAt.slice(0, 10), today);

  return (
    <Screen
      title={WEEKDAY_LABELS[weekday]}
      subtitle={`${notStartedYet ? 'Settimana 0' : `Settimana ${String(week)}`} · ${today}`}
      footer={
        session === null ? undefined : (
          <div className="pb-1">
            <Button
              full
              size="xl"
              variant={notStartedYet ? 'secondary' : 'primary'}
              onClick={() => { navigate({ name: 'session', sessionId: session.id }); }}
            >
              {notStartedYet ? 'Inizia comunque oggi' : 'Inizia'}
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

        {activeSession !== undefined && activeSession !== null ? (
          <Card tone="accent">
            <p className="text-sm font-semibold">Hai una seduta aperta</p>
            <p className="mt-1 text-sm text-dim">
              {activeSession.sessionId} del {activeSession.date}. I dati sono salvati: puoi
              riprenderla da dove l’hai lasciata.
            </p>
            <div className="mt-3">
              <Button
                variant="secondary"
                onClick={() => { navigate({ name: 'session', sessionId: activeSession.sessionId }); }}
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

        {session === null ? (
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

        <Card tone={backupAgeDays !== null && backupAgeDays > 14 ? 'warn' : 'muted'}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Backup</p>
              <p className="mt-1 text-sm text-dim">
                {backupAgeDays === null
                  ? 'Mai fatto. I dati vivono solo su questo telefono.'
                  : backupAgeDays === 0
                    ? 'Fatto oggi.'
                    : `Ultimo backup ${String(backupAgeDays)} giorni fa.`}
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
