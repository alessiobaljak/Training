import { useEffect, useMemo, useRef, useState } from 'react';
import { getExercise } from '../../data/exercises.ts';
import {
  buildGuidedPlan,
  clockOffsets,
  estimatedSeconds,
  workStepCount,
} from '../../engine/circuit.ts';
import type { GuidedStep, GuidedWorkStep } from '../../engine/circuit.ts';
import {
  closeSession,
  effectiveBlock,
  findLoggedExercise,
  isStepLogged,
  setTempoRespected,
  suggestedSetValue,
  syncStatesFromLog,
  upsertLoggedSet,
  variantLabelFor,
} from '../../engine/draft.ts';
import { getLoadAvailability } from '../../engine/loading.ts';
import { initialExerciseState, isOwnLevel } from '../../engine/progression.ts';
import { formatRange, resolveBlockRange } from '../../engine/ranges.ts';
import { formatClock, useCountdown, useStopwatch } from '../hooks/useTimers.ts';
import { useWakeLock } from '../hooks/useWakeLock.ts';
import { beep, primeAudio, signalRestOver, vibrate } from '../feedback.ts';
import { ExerciseArt } from '../components/ExerciseArt.tsx';
import { NumberStepper } from '../components/NumberStepper.tsx';
import { Badge, Button, Card, Notice } from '../components/primitives.tsx';
import { navigate } from '../router.ts';
import { SessionSummary } from './SessionSummary.tsx';
import { useSessionDraft } from './useSessionDraft.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  ProgramSession,
  SessionId,
  TestId,
  TestResult,
} from '../../types/index.ts';

/**
 * Il player guidato del circuito.
 *
 * Una sequenza sola, dal riscaldamento all'ultima stazione, e un passo alla
 * volta: non c'è niente da scegliere mentre ci si allena. È l'opposto del
 * player a serie, che mostra tutto insieme e lascia navigare — lì serve,
 * perché una seduta di forza si interrompe e si riprende; qui no, perché un
 * circuito o lo attraversi o non è un circuito.
 *
 * **Il countdown dell'esercizio non taglia la serie.** È un minimo, non un
 * tetto: dice che la serie deve *almeno* durare quel tempo, perché otto
 * ripetizioni a 3-0-1-0 sono trentadue secondi e chiuderle in diciotto vuol
 * dire che il tempo prescritto non c'era. Quando arriva a zero diventa verde e
 * continua a contare in avanti; a fermarlo sei tu, con «Fatto».
 *
 * E siccome lo misura, non c'è più bisogno di chiederlo: `tempoRespected` —
 * il campo che la regola di avanzamento del metodo richiede e che prima si
 * chiedeva a fine seduta, a memoria — qui si ricava dal cronometro.
 */

/* -------------------------------------------------------------------------- */
/* Segnali                                                                     */
/* -------------------------------------------------------------------------- */

/** Secondi dalla fine a cui avvisare che il tempo sta per scadere. */
const PREAVVISO_SEC = 5;

/**
 * Un bip a cinque secondi dalla fine e uno alla fine.
 *
 * Non di più: in palestra un conto alla rovescia che canta ogni secondo
 * diventa rumore e si impara a non sentirlo.
 */
function useSegnali(remaining: number, attivo: boolean): void {
  const fatto = useRef<number | null>(null);
  useEffect(() => {
    if (!attivo) return;
    if (remaining === PREAVVISO_SEC && fatto.current !== PREAVVISO_SEC) {
      fatto.current = PREAVVISO_SEC;
      beep('tick');
    }
    if (remaining === 0 && fatto.current !== 0) {
      fatto.current = 0;
      vibrate([180, 80, 180]);
      beep('done');
    }
  }, [remaining, attivo]);
}

/* -------------------------------------------------------------------------- */
/* Cronometro grande                                                           */
/* -------------------------------------------------------------------------- */

function Orologio({
  seconds,
  tone,
  caption,
  compatto = false,
}: {
  readonly seconds: number;
  readonly tone: 'neutro' | 'pronto' | 'recupero';
  readonly caption: string;
  /** Più piccolo quando sotto ci sono i campi da riempire. */
  readonly compatto?: boolean;
}) {
  const colore =
    tone === 'pronto' ? 'text-good' : tone === 'recupero' ? 'text-accent' : 'text-ink';
  return (
    <div className="text-center">
      <p
        className={`tabular leading-none font-semibold ${compatto ? 'text-6xl' : 'text-[5.5rem]'} ${colore}`}
      >
        {formatClock(Math.abs(seconds))}
      </p>
      <p className={`mt-2 text-sm font-medium ${tone === 'pronto' ? 'text-good' : 'text-dim'}`}>
        {caption}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Barra di avanzamento della seduta                                           */
/* -------------------------------------------------------------------------- */

function Avanzamento({
  fatte,
  totali,
  minuto,
  durata,
}: {
  readonly fatte: number;
  readonly totali: number;
  readonly minuto: number;
  readonly durata: number;
}) {
  const quota = durata === 0 ? 0 : Math.min(100, Math.round((minuto / durata) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-dim">
        <span>
          {fatte} di {totali} serie
        </span>
        <span className="tabular">
          minuto {Math.floor(minuto / 60)} di {Math.round(durata / 60)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${String(quota)}%` }} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Il player                                                                   */
/* -------------------------------------------------------------------------- */

export function GuidedSession({ sessionId }: { readonly sessionId: SessionId }) {
  const state = useSessionDraft(sessionId);
  const { program, draft, week, states, update, confirmExercise } = state;

  const plan = useMemo(
    () => buildGuidedPlan(program, week, states),
    [program, week, states],
  );
  const offsets = useMemo(() => clockOffsets(plan), [plan]);
  const durata = useMemo(() => estimatedSeconds(plan), [plan]);
  const serieTotali = useMemo(() => workStepCount(plan), [plan]);

  const [index, setIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [confermaUscita, setConfermaUscita] = useState(false);
  const posizionato = useRef(false);

  useWakeLock(!showSummary);

  /*
   * Riprendere una seduta interrotta non riparte dal riscaldamento.
   *
   * Si riparte dal primo passo di lavoro non ancora registrato: chi rientra
   * dopo una telefonata trova la stazione in cui era, non quindici schermate
   * da attraversare.
   *
   * Ma solo se c'è qualcosa da riprendere. Senza questa condizione una seduta
   * nuova saltava tutto il riscaldamento e si apriva sulla prima serie: il
   * primo passo di lavoro non registrato di una seduta vuota è la prima serie,
   * e il riscaldamento non è un passo di lavoro. L'ha trovato la prova di
   * fumo, che è l'unica che preme i pulsanti nell'ordine in cui li premi tu.
   */
  useEffect(() => {
    if (draft === null || posizionato.current || plan.length === 0) return;
    posizionato.current = true;
    const giaCominciata = plan.some(
      (step) => step.kind === 'work' && isStepLogged(draft, step.step),
    );
    if (!giaCominciata) return;
    const primo = plan.findIndex(
      (step) => step.kind === 'work' && !isStepLogged(draft, step.step),
    );
    if (primo > 0) setIndex(primo);
  }, [draft, plan]);

  if (state.loading || draft === null) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center px-4">
        <p className="text-dim">Carico…</p>
      </div>
    );
  }

  const chiudi = (): void => {
    for (const next of syncStatesFromLog(draft, states)) confirmExercise(next);
    update((session) => closeSession(session));
    navigate({ name: 'home' });
  };

  if (showSummary) {
    return (
      <SessionSummary
        program={program}
        draft={draft}
        week={week}
        states={states}
        tests={state.tests}
        decided={new Set()}
        onUpdate={update}
        onDecide={() => undefined}
        onSave={chiudi}
        onBack={() => { setShowSummary(false); }}
      />
    );
  }

  const step = plan[index];
  if (step === undefined) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-10">
        <Notice tone="warn">Piano della seduta vuoto.</Notice>
      </div>
    );
  }

  const serieFatte = plan.filter(
    (entry) => entry.kind === 'work' && isStepLogged(draft, entry.step),
  ).length;

  const avanti = (): void => {
    if (index >= plan.length - 1) {
      setShowSummary(true);
      return;
    }
    setIndex(index + 1);
  };

  const indietro = (): void => { setIndex(Math.max(0, index - 1)); };

  const intestazione = (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex items-center gap-2 py-3">
        <button
          type="button"
          onClick={indietro}
          disabled={index === 0}
          aria-label="Passo precedente"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl text-dim disabled:opacity-30 active:bg-panel"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <Avanzamento
            fatte={serieFatte}
            totali={serieTotali}
            minuto={offsets[index] ?? 0}
            durata={durata}
          />
        </div>
        <button
          type="button"
          onClick={() => { setConfermaUscita((valore) => !valore); }}
          aria-label="Esci dalla seduta"
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm text-dim active:bg-panel"
        >
          Esci
        </button>
      </div>
    </header>
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      {intestazione}

      {confermaUscita ? (
        <div className="px-4 pt-4">
          <Notice tone="warn">
            Quello che hai registrato resta. Puoi riaprire la seduta e ripartire da qui.
            <div className="mt-3 flex gap-2">
              <Button onClick={() => { setShowSummary(true); }}>Vai al riepilogo</Button>
              <Button variant="ghost" onClick={() => { setConfermaUscita(false); }}>
                Continua
              </Button>
            </div>
          </Notice>
        </div>
      ) : null}

      <main className="flex flex-1 flex-col px-4 py-4">
        {step.kind === 'warmup' ? (
          <PassoRiscaldamento key={step.id} step={step} onDone={avanti} />
        ) : step.kind === 'rest' ? (
          <PassoRecupero key={step.id} step={step} onDone={avanti} />
        ) : (
          <PassoLavoro
            key={step.id}
            step={step}
            program={program}
            draft={draft}
            week={week}
            states={states}
            previous={state.previous}
            tests={state.tests}
            onCommit={(sets, tempoRispettato) => {
              update((session) => {
                const conSerie = sets.reduce(
                  (acc, entry) => upsertLoggedSet(acc, step.blockCode, entry),
                  session,
                );
                /*
                 * Il tempo non si chiede più: lo misura il cronometro. Una
                 * serie chiusa prima del minimo marca il blocco come «tempo
                 * non rispettato», e basta una a farlo — la regola del metodo
                 * chiede il tempo su *tutte* le serie.
                 */
                const precedente = findLoggedExercise(conSerie, step.blockCode)?.tempoRespected;
                return setTempoRespected(
                  conSerie,
                  step.blockCode,
                  precedente === false ? false : tempoRispettato,
                );
              });
              avanti();
            }}
          />
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Riscaldamento                                                               */
/* -------------------------------------------------------------------------- */

function PassoRiscaldamento({
  step,
  onDone,
}: {
  readonly step: Extract<GuidedStep, { kind: 'warmup' }>;
  readonly onDone: () => void;
}) {
  const countdown = useCountdown(step.workSeconds, { autoStart: true });
  useSegnali(countdown.remaining, true);

  /*
   * Finito il conto, si va avanti da soli.
   *
   * Prima avanzavano solo i passi a tempo e quelli a ripetizioni aspettavano
   * un tocco — ma mostravano lo stesso conto alla rovescia, che arrivava a
   * zero e scriveva «Fatto» in verde. Una schermata che si dichiara finita e
   * non si muove è un'app che sembra bloccata.
   */
  useEffect(() => {
    if (countdown.done) onDone();
  }, [countdown.done, onDone]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Riscaldamento</Badge>
        {step.inRamp ? <Badge tone="neutral">Giro di prova</Badge> : null}
      </div>
      <h2 className="mt-3 text-2xl leading-tight font-semibold">{step.label}</h2>
      {step.reps !== null ? (
        <p className="mt-1 text-sm text-dim">
          {step.reps} ripetizioni{step.perSide ? ' per lato' : ''} in {step.workSeconds}″
        </p>
      ) : null}

      {step.exercise !== null ? (
        <div className="mt-4">
          <ExerciseArt slug={step.exercise} level={null} />
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed text-dim">{step.hint}</p>

      <div className="flex flex-1 items-center justify-center py-6">
        <Orologio
          seconds={countdown.remaining}
          tone={countdown.done ? 'pronto' : 'neutro'}
          caption={
            countdown.done
              ? 'Fatto'
              : step.reps === null
                ? 'Tieni il tempo'
                : 'Falle entro il tempo, poi si va avanti'
          }
        />
      </div>

      <Button full size="xl" onClick={() => { primeAudio(); onDone(); }}>
        Avanti
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recupero                                                                    */
/* -------------------------------------------------------------------------- */

function PassoRecupero({
  step,
  onDone,
}: {
  readonly step: Extract<GuidedStep, { kind: 'rest' }>;
  readonly onDone: () => void;
}) {
  const countdown = useCountdown(step.seconds, { autoStart: true, onDone: signalRestOver });
  useSegnali(countdown.remaining, true);

  useEffect(() => {
    if (countdown.done) onDone();
  }, [countdown.done, onDone]);

  /*
   * Il livello del recupero è scritto grande apposta.
   *
   * Una transizione da trenta secondi e un recupero di giro da quarantacinque
   * si assomigliano sul cronometro e non si assomigliano per niente
   * nell'allenamento: il primo è il tempo per spostarsi, il secondo è il
   * recupero vero. Chi li confonde taglia quello sbagliato.
   */
  return (
    <div className="flex flex-1 flex-col">
      <Badge tone={step.tier === 'transizione' ? 'neutral' : 'accent'}>{step.label}</Badge>

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <Orologio seconds={countdown.remaining} tone="recupero" caption={step.hint} />
      </div>

      <Card tone="muted">
        <p className="text-xs text-dim">Prossima</p>
        <p className="mt-1 font-semibold">{step.nextLabel}</p>
      </Card>

      <div className="mt-3">
        <Button full size="lg" variant="secondary" onClick={onDone}>
          Salta il recupero
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lavoro                                                                      */
/* -------------------------------------------------------------------------- */

interface PassoLavoroProps {
  readonly step: GuidedWorkStep;
  readonly program: ProgramSession;
  readonly draft: LoggedSession;
  readonly week: number;
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  readonly previous: ReadonlyMap<string, LoggedExercise>;
  readonly tests: ReadonlyMap<TestId, TestResult>;
  readonly onCommit: (sets: readonly LoggedSet[], tempoRispettato: boolean) => void;
}

function PassoLavoro({
  step,
  program,
  draft,
  week,
  states,
  previous,
  tests,
  onCommit,
}: PassoLavoroProps) {
  const cronometro = useStopwatch();
  const minimo = step.workSeconds;
  const rimasti = Math.max(0, minimo - cronometro.seconds);
  const raggiunto = minimo === 0 || cronometro.seconds >= minimo;
  useSegnali(rimasti, minimo > 0 && cronometro.running);

  /*
   * Il blocco è quello della scheda, non una sua ricostruzione: `effectiveBlock`
   * ci applica sopra l'esercizio davvero scelto, dove la riga ne ammette più di
   * uno.
   */
  const dichiarato = program.blocks.find((entry) => entry.code === step.blockCode);
  const blocco = dichiarato === undefined ? undefined : effectiveBlock(dichiarato, draft);
  const esercizio = blocco === undefined ? undefined : getExercise(blocco.exercise);
  const range = blocco === undefined || esercizio === undefined
    ? null
    : resolveBlockRange(blocco, esercizio, tests);
  const load = esercizio === undefined ? null : getLoadAvailability(esercizio, week);
  const perSide = step.step.perSide;
  const gradino =
    esercizio === undefined
      ? null
      : (findLoggedExercise(draft, step.blockCode)?.level ??
         states.get(esercizio.slug)?.level ??
         null);

  const passato = previous.get(step.blockCode);
  const suggerito = suggestedSetValue(passato, step.step.setIndex, perSide ? 'left' : null);
  const partenza =
    suggerito?.value ?? (range !== null && range.kind === 'range' ? range.range.min : 0);

  const [valore, setValore] = useState(partenza);
  const [sinistra, setSinistra] = useState(partenza);
  const [destra, setDestra] = useState(partenza);
  const [kg, setKg] = useState(suggerito?.loadKg ?? 0);

  const unita = esercizio?.measurement === 'seconds' ? 'sec' : 'rip';
  /* La serie è cominciata: da qui in poi comanda la registrazione, non la figura. */
  const partita = cronometro.running || cronometro.seconds > 0;

  const registra = (): void => {
    const comune = { rir: null, loadKg: kg, heartRate: null, note: null } as const;
    const sets: LoggedSet[] = perSide
      ? [
          { setIndex: step.step.setIndex, side: 'left', value: sinistra, ...comune },
          { setIndex: step.step.setIndex, side: 'right', value: destra, ...comune },
        ]
      : [{ setIndex: step.step.setIndex, side: null, value: valore, ...comune }];
    onCommit(sets, raggiunto);
  };

  if (blocco === undefined || esercizio === undefined || range === null || load === null) {
    return <Notice tone="warn">Blocco {step.blockCode} non trovato nella scheda.</Notice>;
  }

  /*
   * Il titolo segue il gradino, come la figura.
   *
   * Prima qui c'era `esercizio.name` secco, e la figura invece arrivava da
   * `media.ts`, che il gradino lo legge: al gradino 2 dell'hip thrust il
   * player scriveva «Hip thrust monopodalico» sopra il disegno di uno a due
   * gambe. Sono le stesse due righe dello `SessionScreen`, e il motivo per cui
   * ci sono e' lo stesso: quando il nome dell'esercizio descrive un movimento
   * che non stai facendo, vince il gradino.
   */
  const suoGradino = isOwnLevel(esercizio, gradino);
  /*
   * L'etichetta si ricalcola dal gradino di adesso, non si legge dalla bozza.
   *
   * `buildDraftSession` prende `variantLabel` dalla seduta scorsa e `level`
   * dallo stato corrente: due campi che dopo ogni salita accettata nella
   * revisione dicono due gradini diversi. Leggendo l'etichetta da lì, il
   * titolo avrebbe nominato il gradino della settimana scorsa sopra la figura
   * di quello nuovo — lo stesso difetto che queste righe servono a chiudere,
   * spostato di una settimana.
   */
  const titolo =
    suoGradino || gradino === null
      ? esercizio.name
      : variantLabelFor(esercizio, { ...initialExerciseState(esercizio), level: gradino });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2">
        <Badge tone="accent">{step.blockCode}</Badge>
        <span className="text-xs text-dim">
          giro {step.step.setIndex} di {step.step.totalSets}
        </span>
      </div>

      <h2 className="mt-3 text-2xl leading-tight font-semibold">{titolo}</h2>
      <p className="mt-1 text-sm text-dim">
        {range.kind === 'range' ? formatRange(range.range, range.unit) : '—'}
        {perSide ? ' per lato' : ''} · TUT {blocco.tut} · RIR {blocco.rir}
      </p>
      {/*
        * La nota della variante era solo nella scheda, e la scheda la leggi
        * prima di cominciare: al terzo giro, con il telefono a terra, «un
        * piede sul box» e «kettlebell in racked» non c'erano piu' da nessuna
        * parte. Sta sopra la figura perche' e' quello che la figura non dice.
        */}
      {blocco.variantNote !== undefined && !partita ? (
        <p className="mt-2 text-xs leading-relaxed text-warn">{blocco.variantNote}</p>
      ) : null}

      {partita ? null : (
        <div className="mt-4">
          <ExerciseArt slug={esercizio.slug} level={gradino} />
        </div>
      )}

      <div className={`flex flex-col items-center justify-center ${partita ? 'py-3' : 'flex-1 py-5'}`}>
        <Orologio
          compatto={partita}
          seconds={partita ? (raggiunto ? cronometro.seconds : rimasti) : minimo}
          tone={raggiunto && cronometro.seconds > 0 ? 'pronto' : 'neutro'}
          caption={
            minimo === 0
              ? 'Tieni la posizione finché reggi la forma'
              : !partita
                ? `Almeno ${String(minimo)}" se rispetti il tempo`
                : raggiunto
                  ? 'Tempo rispettato'
                  : 'Non chiuderla prima'
          }
        />
        {!partita ? (
          <div className="mt-5 w-full">
            <Button full size="xl" onClick={() => { primeAudio(); cronometro.start(); }}>
              Via
            </Button>
          </div>
        ) : null}
      </div>

      {partita ? (
        <>
          <Card>
            {perSide ? (
              <div className="space-y-3">
                <NumberStepper label={`Sinistra (${unita})`} value={sinistra} onChange={setSinistra} />
                <NumberStepper label={`Destra (${unita})`} value={destra} onChange={setDestra} />
              </div>
            ) : (
              <NumberStepper
                label={esercizio.measurement === 'seconds' ? 'Secondi tenuti' : 'Ripetizioni fatte'}
                value={valore}
                onChange={setValore}
              />
            )}
            {load.recordable ? (
              <div className="mt-3">
                <NumberStepper label="Peso" value={kg} onChange={setKg} step={2.5} unit="kg" />
              </div>
            ) : null}
          </Card>

          <div className="mt-3">
            <Button full size="xl" onClick={registra}>
              Fatto
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
