import { useState } from 'react';
import { getSession } from '../../data/program.ts';
import { getExercise } from '../../data/exercises.ts';
import { addDays, daysBetween, isoWeekday, todayIso } from '../../engine/dates.ts';
import { getWeekState, isRetestDue, programWeek } from '../../engine/schedule.ts';
import type { NextTraining, SessionMove } from '../../engine/calendar.ts';
import {
  applyMoves,
  isMoved,
  moveWarning,
  nextTrainingDay,
  scheduledForDate,
  sessionForDate,
  swapDays,
} from '../../engine/calendar.ts';
import { pendingVerdicts, reviewWeek } from '../../engine/review.ts';
import { totalWorkSets } from '../../engine/rest.ts';
import type { LoggedSession, ProgramSession } from '../../types/index.ts';
import { WEEKDAY_LABELS } from '../../types/index.ts';
import { repository } from '../../db/repository.ts';
import { navigate } from '../router.ts';
import {
  useExerciseStates,
  useIsOnboarded,
  useLatestTests,
  useSessionMoves,
  useSessions,
  useSettings,
  useSuggestions,
} from '../hooks/useData.ts';
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
  const exerciseStates = useExerciseStates();
  const latestTests = useLatestTests();
  const suggestions = useSuggestions();
  const snapshots = useSnapshots();
  const moves = useSessionMoves();
  /* Quale seduta fuori posto sta aspettando conferma di eliminazione. */
  const [daEliminare, setDaEliminare] = useState<string | null>(null);
  /* Il pannello per spostare la seduta di oggi su un altro giorno. */
  const [spostando, setSpostando] = useState(false);

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
  /*
   * La seduta di oggi la decide il calendario più gli spostamenti, non il
   * giorno della settimana da solo. Finché gli spostamenti non sono arrivati
   * dal database si legge il calendario: è la stessa risposta nel caso
   * normale, e l'alternativa sarebbe una Home vuota a ogni avvio.
   */
  const spostamenti = moves ?? [];
  const session = sessionForDate(today, spostamenti);
  const oggiSpostato = isMoved(today, spostamenti);
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

  const next = nextTrainingDay(today, spostamenti);
  const nextSession = next === null ? null : sessionForDate(next.date, spostamenti);

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

  /*
   * La settimana chiusa va rivista prima di rifarla uguale.
   *
   * Senza questa scheda la settimana 2 era identica alla settimana 1 anche
   * dopo sette giorni passati sopra il massimo del range: il motore delle leve
   * proponeva solo a fine seduta, una volta, e se non rispondevi alla domanda
   * sul tempo non proponeva affatto. Qui la revisione resta finché non è stata
   * guardata, e guarda i numeri di tutta la settimana insieme.
   */
  const settimanaChiusa = week - 1;
  const revisione =
    settimanaChiusa >= 1 && sessions !== undefined && exerciseStates !== undefined && latestTests !== undefined
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

        {daDecidere.length > 0 ? (
          <Card tone="accent">
            <p className="text-sm font-semibold">
              Settimana {String(settimanaChiusa)} chiusa:{' '}
              {daDecidere.length === 1 ? '1 cosa da cambiare' : `${String(daDecidere.length)} cose da cambiare`}
            </p>
            <ul className="mt-2 space-y-1">
              {daDecidere.slice(0, 3).map((verdict) => (
                <li key={verdict.exercise} className="text-sm leading-relaxed text-dim">
                  {verdict.title}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Button
                full
                onClick={() => { navigate({ name: 'review', week: settimanaChiusa }); }}
              >
                Rivedi la settimana
              </Button>
            </div>
          </Card>
        ) : null}

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
              {oggiSpostato ? 'Oggi non si allena' : 'Riposo completo'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-dim">
              {oggiSpostato
                ? `La seduta di oggi è stata spostata. ${
                    scheduledForDate(today)?.name ?? 'Quella del calendario'
                  } non è persa: la trovi nel giorno dove l’hai messa.`
                : 'Domenica non si allena. Il recupero non è tempo perso: è la parte in cui l’adattamento avviene davvero.'}
            </p>
            <div className="mt-3">
              <Button
                full
                variant="secondary"
                onClick={() => { setSpostando(!spostando); }}
              >
                {spostando ? 'Lascia com’è' : 'Porta qui una seduta'}
              </Button>
            </div>
            {spostando ? (
              <SpostaSeduta
                today={today}
                moves={spostamenti}
                onDone={() => { setSpostando(false); }}
              />
            ) : null}
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

            {/*
              Spostare una seduta di giorno.
              Il calendario dà una seduta a ogni giorno, e per sei settimane è
              bastato finché non è capitato un sabato in cui non si allena. Senza
              questo, l'unica strada era aprire la seduta del sabato di domenica
              e ritrovarsela segnata come «fuori posto», cioè come un errore.
            */}
            <div className="mt-4">
              <Button full variant="secondary" onClick={() => { setSpostando(!spostando); }}>
                {spostando ? 'Lascia com’è' : 'Oggi non posso: sposta la seduta'}
              </Button>
            </div>
            {spostando ? (
              <SpostaSeduta
                today={today}
                moves={spostamenti}
                onDone={() => { setSpostando(false); }}
              />
            ) : null}

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
 * Il pannello che sposta una seduta di giorno.
 *
 * Non è un trasloco ma uno scambio: quello che c'è oggi va nel giorno scelto e
 * quello che c'è lì torna oggi. Quando il giorno scelto è libero — la domenica
 * — lo scambio svuota oggi, che è esattamente «oggi non alleno, lo faccio
 * domani». Quando è occupato, le due sedute si scambiano di posto invece di
 * sovrascriversi: è l'unica cosa che si può fare senza far sparire del lavoro.
 *
 * Sotto ogni giorno c'è quello che comporta sceglierlo. Sono conti, non
 * consigli: quanti giorni di fila si allenerebbe e cosa si ripete rispetto al
 * giorno prima. Spostare nel giorno di riposo toglie il riposo, ed è una cosa
 * che va detta prima, non scoperta il mercoledì dopo con le spalle a pezzi.
 */
function SpostaSeduta({
  today,
  moves,
  onDone,
}: {
  readonly today: string;
  readonly moves: readonly SessionMove[];
  readonly onDone: () => void;
}) {
  const giorni = [1, 2, 3, 4, 5, 6, 7].map((delta) => addDays(today, delta));
  const diOggi = sessionForDate(today, moves);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs leading-relaxed text-dim">
        {diOggi === null
          ? 'Scegli da quale giorno prendere la seduta: quel giorno resterà libero.'
          : 'Scegli il giorno in cui farla. Se quel giorno ha già una seduta, le due si scambiano di posto.'}
      </p>
      <ul className="space-y-2">
        {giorni.map((giorno) => {
          const lì = sessionForDate(giorno, moves);
          const dopo = moveWarning(giorno, applyMoves(moves, swapDays(today, giorno, moves)));
          return (
            <li key={giorno}>
              <button
                type="button"
                onClick={() => {
                  void repository.swapSessionDays(today, giorno);
                  onDone();
                }}
                className="w-full rounded-xl border border-line-strong bg-panel px-3 py-3 text-left"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {WEEKDAY_LABELS[isoWeekday(giorno)]} {giorno.slice(5)}
                  </span>
                  <span className="text-xs text-dim">{lì?.name ?? 'libero'}</span>
                </span>
                {dopo !== null && (dopo.inARow >= 7 || dopo.backToBack.length > 0) ? (
                  <span className="mt-1 block text-xs leading-relaxed text-warn">
                    {dopo.inARow >= 7
                      ? `${String(dopo.inARow)} giorni di allenamento di fila: sparisce il riposo. `
                      : ''}
                    {dopo.backToBack.length > 0
                      ? `Due giorni di fila su ${dopo.backToBack.join(', ')}.`
                      : ''}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
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
  readonly next: NextTraining | null;
  readonly nextSession: ProgramSession | null;
}) {
  if (next === null) return null;
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
