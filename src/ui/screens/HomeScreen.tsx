import { useState } from 'react';
import { ACTIVE_SESSIONS, findAnySession } from '../../data/sessions.ts';
import { findCircuitSession, isCircuitSessionId } from '../../data/circuit.ts';
import { daysBetween, formatDayLong, formatDayShort, formatDaysAgo, plural, todayIso } from '../../engine/dates.ts';
import { buildGuidedPlan, estimatedSeconds } from '../../engine/circuit.ts';
import { IN_A_ROW_WARNING, rotationState } from '../../engine/rotation.ts';
import { getWeekState, programWeek, weekEndDate } from '../../engine/schedule.ts';
import { pendingVerdicts, reviewDecisionId, reviewWeek } from '../../engine/review.ts';
import { sessionDurationSeconds } from '../../engine/draft.ts';
import { formatClock } from '../hooks/useTimers.ts';
import { IconaImpostazioni } from '../components/icons.tsx';
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

/**
 * Le serie di lavoro di una seduta: una per giro, anche sugli esercizi per
 * lato, e senza finitura e decompressione.
 *
 * Prima contava le righe registrate, cioè due per ogni serie per lato e una
 * per ogni posizione di stretching: la Home diceva «35 serie» della stessa
 * seduta che il riepilogo, un secondo prima, chiamava «18 serie».
 */
function contaSerie(session: LoggedSession | null): number {
  if (session === null) return 0;
  const programma = findAnySession(session.sessionId);
  return session.exercises.reduce((total, entry) => {
    const blocco = programma?.blocks.find((block) => block.code === entry.blockCode);
    if (blocco?.excludeFromReview === true) return total;
    return total + new Set(entry.sets.map((set) => set.setIndex)).size;
  }, 0);
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
            Il programma è chiuso finché non hai fatto i nove test. Le ripetizioni sono quelle
            della scheda; i test decidono da che gradino parti su ogni esercizio.
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
    startDate !== null &&
    sessions !== undefined &&
    exerciseStates !== undefined &&
    latestTests !== undefined &&
    suggestions !== undefined
      ? reviewWeek({
          week: settimanaChiusa,
          sessions,
          states: new Map(exerciseStates.map((state) => [state.exercise, state])),
          tests: latestTests,
          weekEnd: weekEndDate(startDate, settimanaChiusa),
          today,
          decisioni: suggestions,
        })
      : null;
  const decise = new Set((suggestions ?? []).map((record) => record.id));
  const daDecidere = revisione === null ? [] : pendingVerdicts(revisione, decise);
  /*
   * Anche senza niente da decidere la revisione può avere qualcosa da dire:
   * un gradino in attesa, una settimana di scarico, troppo pochi numeri. La
   * scheda resta finché la revisione è aperta (M17: prima spariva appena la
   * seduta del lunedì rimandava tutto).
   */
  const daLeggere =
    revisione === null
      ? 0
      : [
          ...revisione.pocheProve,
          ...revisione.rimandati,
          ...revisione.fermi,
          ...revisione.inAttesa,
          ...revisione.alMassimo,
        ].filter((voce) => !decise.has(reviewDecisionId(settimanaChiusa, voce.exercise))).length;

  const ripetuti = rotazione.repeatedMuscles.map((gruppo) => MUSCLE_GROUP_LABELS[gruppo]);

  /*
   * Tre stati, e la Home ne mostra uno solo in grande.
   *
   * Prima ce n'era uno: «Prossima», sempre, con il pulsante principale che
   * invitava ad aprirla. Anche dieci secondi dopo aver chiuso una seduta: la
   * schermata diceva «apri la Seduta 2» e, sotto, in un riquadro, «oggi hai
   * già caricato sei gruppi muscolari». Un invito e la sua smentita nella
   * stessa schermata. E una seduta lasciata a metà stava in fondo, dopo
   * quattro righe di elenco, mentre in cima c'era l'invito a cominciarne
   * un'altra.
   */
  const inCorsoOggi = aperte.find(
    (entry) => entry.date === today && isCircuitSessionId(entry.sessionId),
  );
  const fatteOggi = tutte.filter(
    (entry) =>
      entry.status === 'completed' && entry.date === today && isCircuitSessionId(entry.sessionId),
  );
  const ultimaDiOggi = fatteOggi.at(-1);
  const aperteVecchie = aperte.filter((entry) => entry !== inCorsoOggi);

  /* Le sedute del circuito chiuse in questa settimana del programma. */
  const fatteInSettimana = tutte.filter(
    (entry) =>
      entry.status === 'completed' && entry.week === week && isCircuitSessionId(entry.sessionId),
  ).length;
  const OBIETTIVO = ACTIVE_SESSIONS.length;

  /* Lo Shadow si nomina solo a chi ne ha uno nel diario. */
  const haStoricoArchiviato = tutte.some((entry) => !isCircuitSessionId(entry.sessionId));

  const quando = (id: string): string => {
    const data = ultimaVolta.get(id);
    return data === undefined ? 'mai fatta' : formatDaysAgo(data, today);
  };

  const stato: 'in-corso' | 'fatto-oggi' | 'prossima' =
    inCorsoOggi !== undefined ? 'in-corso' : ultimaDiOggi !== undefined ? 'fatto-oggi' : 'prossima';
  const inCorsoNome =
    inCorsoOggi === undefined ? '' : (findAnySession(inCorsoOggi.sessionId)?.name ?? '');

  return (
    <Screen
      title="Allenamento"
      subtitle={`Settimana ${String(week)} · ${formatDayLong(today)}`}
      action={
        <button
          type="button"
          onClick={() => { navigate({ name: 'settings' }); }}
          aria-label="App e dati"
          className="-mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-dim active:bg-panel"
        >
          <IconaImpostazioni />
        </button>
      }
      footer={
        stato === 'in-corso' && inCorsoOggi !== undefined ? (
          <div className="pb-1">
            <Button
              full
              size="xl"
              onClick={() => { navigate({ name: 'session', sessionId: inCorsoOggi.sessionId }); }}
            >
              Riprendi {inCorsoNome}
            </Button>
          </div>
        ) : prossima === undefined ? undefined : (
          <div className="pb-1">
            <Button
              full
              size={stato === 'fatto-oggi' ? 'lg' : 'xl'}
              variant={stato === 'fatto-oggi' ? 'secondary' : 'primary'}
              onClick={() => { navigate({ name: 'scheda', sessionId: prossima.id }); }}
            >
              Apri {prossima.name}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {weekState.isDeload || weekState.isRetestWeek ? (
          <div className="flex flex-wrap gap-2">
            {weekState.isDeload ? <Badge tone="warn">Scarico</Badge> : null}
            {weekState.isRetestWeek ? <Badge tone="good">Ritest</Badge> : null}
          </div>
        ) : null}

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
        ) : daLeggere > 0 ? (
          <Card tone="muted">
            <p className="text-sm font-semibold">
              Settimana {settimanaChiusa} chiusa: niente da cambiare
            </p>
            <p className="mt-1 text-sm leading-relaxed text-dim">
              Note su {plural(daLeggere, 'esercizio', 'esercizi')}: gradini in attesa, numeri non
              ancora sufficienti, leve che arrivano a fine seduta.
            </p>
            <div className="mt-3">
              <Button
                full
                variant="secondary"
                onClick={() => { navigate({ name: 'review', week: settimanaChiusa }); }}
              >
                Rivedi la settimana
              </Button>
            </div>
          </Card>
        ) : null}

        {weekState.isDeload ? <Notice tone="warn">{weekState.banner}</Notice> : null}

        {/* -------------------------------------------------------------- */}
        {/* Lo stato di oggi                                                */}
        {/* -------------------------------------------------------------- */}
        {stato === 'in-corso' && inCorsoOggi !== undefined ? (
          <Card tone="accent">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">In corso</p>
            <p className="mt-1 text-3xl leading-tight font-semibold">{inCorsoNome}</p>
            <p className="mt-1 text-sm text-dim">
              {contaSerie(inCorsoOggi) === 0
                ? 'Aperta, nessuna serie ancora registrata.'
                : `${plural(contaSerie(inCorsoOggi), 'serie registrata', 'serie registrate')}. Riparte dalla stazione in cui eri.`}
            </p>
          </Card>
        ) : stato === 'fatto-oggi' && ultimaDiOggi !== undefined ? (
          <Card tone="good">
            <p className="text-xs font-semibold tracking-wide text-good uppercase">Fatto per oggi</p>
            <p className="mt-1 text-3xl leading-tight font-semibold">
              {findAnySession(ultimaDiOggi.sessionId)?.name ?? ''}
            </p>
            <p className="tabular mt-1 text-sm text-dim">
              {(() => {
                const durataVera = sessionDurationSeconds(ultimaDiOggi);
                const serie = plural(contaSerie(ultimaDiOggi), 'serie', 'serie');
                return durataVera === null ? serie : `${formatClock(durataVera)} · ${serie}`;
              })()}
            </p>
            {prossima === undefined ? null : (
              <p className="mt-3 text-sm leading-relaxed text-dim">
                La prossima è <span className="font-semibold text-ink">{prossima.name}</span> ({prossima.focus}).
                Oggi il lavoro è fatto: il muscolo cresce nel recupero, non in una seconda seduta.
              </p>
            )}
          </Card>
        ) : prossima !== undefined ? (
          <Card tone="accent">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">Prossima</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-3xl leading-tight font-semibold">{prossima.name}</p>
                <p className="mt-1 text-sm text-dim">{prossima.focus}</p>
              </div>
              <Badge>{durata(prossima)}</Badge>
            </div>
            <p className="mt-3 text-sm text-dim">
              Ultima volta: <span className="font-semibold text-ink">{quando(prossima.id)}</span>
            </p>

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
                  Ieri hai già caricato {ripetuti.join(', ').toLowerCase()}. Questa seduta li
                  ricarica: il muscolo che non ha riposato non cresce, si consuma.
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
        {/* La settimana                                                    */}
        {/* -------------------------------------------------------------- */}
        <Card tone="muted">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Questa settimana</p>
              <p className="mt-0.5 text-sm text-dim">
                {fatteInSettimana >= OBIETTIVO
                  ? 'Tutte e quattro fatte.'
                  : `${String(fatteInSettimana)} di ${String(OBIETTIVO)} sedute`}
              </p>
            </div>
            <div className="flex gap-2" aria-hidden="true">
              {ACTIVE_SESSIONS.map((session, posizione) => (
                <span
                  key={session.id}
                  className={`h-4 w-4 rounded-full border ${
                    posizione < fatteInSettimana ? 'border-accent bg-accent' : 'border-line-strong'
                  }`}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* -------------------------------------------------------------- */}
        {/* Tutte e quattro, sempre apribili                                */}
        {/* -------------------------------------------------------------- */}
        <div>
          <SectionTitle>Le quattro sedute</SectionTitle>
          <ul className="space-y-2">
            {ACTIVE_SESSIONS.map((session) => {
              const attiva = stato === 'prossima' && session.id === rotazione.next;
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
                      <span className="block">{quando(session.id)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-dim">
            Nessun giorno assegnato. L’ordine è un consiglio: la prossima è quella che viene dopo
            l’ultima che hai chiuso.
          </p>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Sedute rimaste aperte nei giorni scorsi                         */}
        {/* -------------------------------------------------------------- */}
        {aperteVecchie.length > 0 ? (
          <Card tone="warn">
            <p className="text-sm font-semibold">
              {aperteVecchie.length === 1 ? 'Una seduta rimasta aperta' : 'Sedute rimaste aperte'}
            </p>
            <p className="mt-1 text-sm text-dim">
              Puoi archiviarle con quello che c’è scritto, oppure eliminarle.
            </p>
            <ul className="mt-3 space-y-2">
              {aperteVecchie.map((entry) => {
                const serie = contaSerie(entry);
                const nome = findAnySession(entry.sessionId)?.name ?? entry.sessionId;
                return (
                  <li key={entry.id} className="rounded-xl border border-line bg-panel p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{nome}</p>
                        <p className="tabular mt-1 text-xs text-dim">
                          {formatDayShort(entry.date, today)} ·{' '}
                          {serie === 0 ? 'nessuna serie' : plural(serie, 'serie', 'serie')}
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
                            : `Elimini ${plural(serie, 'serie registrata', 'serie registrate')} ${formatDayShort(entry.date, today)}. Non si torna indietro.`}
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
            Settimana {week}: è il momento di rifare i test. Da lì l’app ricalcola da che gradino
            riparti.
            <div className="mt-3">
              <Button variant="secondary" onClick={() => { navigate({ name: 'onboarding' }); }}>
                Rifai i test
              </Button>
            </div>
          </Notice>
        ) : null}

        {/*
          La copia di sicurezza compare qui solo quando c'è un problema.

          Prima aveva un riquadro fisso in Home con il pulsante «Apri», che era
          anche l'unico modo di arrivare alle impostazioni: tema, account e
          azzeramento stavano dietro una scheda che parlava di backup. Adesso le
          impostazioni hanno il loro ingranaggio in alto, e una copia che
          funziona non ha niente da dire.
        */}
        {snapshots !== undefined && backupAgeDays !== null && backupAgeDays > 14 ? (
          <Card tone="warn">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm leading-relaxed">
                L’ultima copia di sicurezza è di {String(backupAgeDays)} giorni fa.
              </p>
              <Button variant="secondary" onClick={() => { navigate({ name: 'settings' }); }}>
                Controlla
              </Button>
            </div>
          </Card>
        ) : null}

        {/* Lo Shadow non sparisce: si legge nel diario. Ma solo se c'è. */}
        {haStoricoArchiviato ? (
          <p className="pb-2 text-center text-xs text-dim">
            Le sedute del programma precedente sono archiviate: restano leggibili nel diario.
          </p>
        ) : null}
      </div>
    </Screen>
  );
}
