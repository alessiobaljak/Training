import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { getExercise } from '../../data/exercises.ts';
import { repository } from '../../db/repository.ts';
import {
  buildGuidedPlan,
  clockOffsets,
  estimatedSeconds,
  groupLabel,
} from '../../engine/circuit.ts';
import type { GuidedRestStep, GuidedStep, GuidedWorkStep } from '../../engine/circuit.ts';
import {
  closeSession,
  effectiveBlock,
  findLoggedExercise,
  isStepLogged,
  markStarted,
  setTempoRespected,
  suggestedSetValue,
  syncStatesFromLog,
  titleAtLevel,
  upsertLoggedSet,
} from '../../engine/draft.ts';
import { getLoadAvailability } from '../../engine/loading.ts';
import type { LoadAvailability } from '../../engine/loading.ts';
import { summarizeExercise } from '../../engine/metrics.ts';
import { parseTut, tempoSteps } from '../../engine/notation.ts';
import type { TempoStep } from '../../engine/notation.ts';
import type { ProgressionSuggestion } from '../../engine/progression.ts';
import { formatRange, resolveBlockRange } from '../../engine/ranges.ts';
import type { RangeResolution } from '../../engine/ranges.ts';
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
  Exercise,
  ExerciseSlug,
  ExerciseState,
  LevelIndex,
  LoggedExercise,
  LoggedSession,
  LoggedSet,
  OverloadLever,
  ProgramBlock,
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
 *
 * **Si legge nel recupero, non nella serie.** Il recupero mostra già la
 * prossima stazione — figura, numeri, nota della variante, cosa hai fatto la
 * volta scorsa — perché è l'unico momento in cui hai gli occhi liberi. Quando
 * il conto arriva a zero la serie parte da sola: prima serviva un tocco su
 * «Via» a ogni stazione, cioè piegarsi sul telefono due volte per serie con
 * le mani sudate, e il tempo passato a cercare il pulsante non lo contava
 * nessuno. «Via» resta solo dove non sei arrivato camminando: quando riprendi
 * una seduta interrotta o torni indietro di un passo.
 *
 * **Le stazioni a tempo fisso scorrono senza chiedere niente.** I trenta
 * secondi di corda della finitura e le posizioni della decompressione si
 * chiudono allo scadere e si registrano da sole: lì non c'è niente da contare.
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
  taglia = 'grande',
}: {
  readonly seconds: number;
  readonly tone: 'neutro' | 'pronto' | 'recupero';
  readonly caption: string;
  /** `media` quando sotto c'è altro da leggere o da riempire. */
  readonly taglia?: 'grande' | 'media';
}) {
  const colore =
    tone === 'pronto' ? 'text-good' : tone === 'recupero' ? 'text-accent' : 'text-ink';
  return (
    <div className="text-center">
      <p
        className={`tabular leading-none font-semibold ${taglia === 'media' ? 'text-7xl' : 'text-[5.5rem]'} ${colore}`}
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
/* Intestazione: dove sei, e come stai rispetto all'orologio                   */
/* -------------------------------------------------------------------------- */

/** L'ora di adesso, aggiornata ogni secondo finché serve. */
function useAdesso(attivo: boolean): number {
  const [adesso, setAdesso] = useState(() => Date.now());
  useEffect(() => {
    if (!attivo) return;
    const id = window.setInterval(() => { setAdesso(Date.now()); }, 1000);
    return () => { window.clearInterval(id); };
  }, [attivo]);
  return adesso;
}

/** Oltre questo scarto dal piano, l'intestazione lo dice. */
const SCARTO_DA_DIRE_SEC = 120;

/**
 * Dove sei nella seduta, in parole: il blocco e il giro, non un contatore.
 *
 * Prima qui c'era «3 di 29 serie», e le ventinove contavano anche le tre
 * posizioni di stretching: un numero che non aiutava a capire quanto mancava
 * al blocco e contava come serie una respirazione.
 */
function doveSei(plan: readonly GuidedStep[], index: number, session: ProgramSession): string {
  const step = plan[index];
  if (step === undefined) return '';
  if (step.kind === 'warmup') return 'Riscaldamento';
  const lavoro =
    step.kind === 'work'
      ? step
      : plan.slice(index + 1).find((entry): entry is GuidedWorkStep => entry.kind === 'work');
  if (lavoro === undefined) return 'Fine seduta';
  if (step.kind === 'rest' && plan[index + 1]?.kind === 'warmup') return 'Riscaldamento';
  /* «Finitura», non «Finitura metabolica»: accanto al giro non ci sta. */
  const nome = groupLabel(session, lavoro.group).replace(' metabolica', '');
  return lavoro.step.totalSets > 1
    ? `${nome} · giro ${String(lavoro.step.setIndex)} di ${String(lavoro.step.totalSets)}`
    : nome;
}

function Intestazione({
  dove,
  quota,
  trascorsi,
  previsti,
  sulLavoro,
  onIndietro,
  indietroAttivo,
  onEsci,
}: {
  readonly dove: string;
  /** Avanzamento sul piano, da 0 a 100. */
  readonly quota: number;
  /** Secondi veri dall'inizio. `null` se la seduta non ha un orario d'inizio. */
  readonly trascorsi: number | null;
  /** Secondi a cui il piano mette l'inizio di questo passo. */
  readonly previsti: number;
  /** Si è dentro i tri-set: è lì che l'orologio della scheda ha senso. */
  readonly sulLavoro: boolean;
  readonly onIndietro: () => void;
  readonly indietroAttivo: boolean;
  readonly onEsci: () => void;
}) {
  /*
   * L'orologio della scheda serve a una cosa sola, e la scheda la dice: «se
   * sei in ritardo di più di due minuti stai riposando troppo tra le
   * stazioni; se sei in anticipo di più di due minuti i carichi sono bassi».
   * Sotto i due minuti non si dice niente: è rumore.
   */
  /*
   * Solo il ritardo, perché è l'unico dei due su cui si può fare qualcosa
   * adesso. L'anticipo è un consiglio per la prossima volta — «alza il
   * carico» — e detto durante la seduta era rumore: compariva anche a chi
   * aveva solo saltato un recupero. Quello lo dice il riepilogo.
   */
  const scarto = trascorsi === null || !sulLavoro ? 0 : trascorsi - previsti;
  const avviso =
    scarto >= SCARTO_DA_DIRE_SEC
      ? `${String(Math.floor(scarto / 60))}′ di ritardo: accorcia le transizioni, non i recuperi`
      : null;

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex items-center gap-2 py-3">
        <button
          type="button"
          onClick={onIndietro}
          disabled={!indietroAttivo}
          aria-label="Passo precedente"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl text-dim disabled:opacity-30 active:bg-panel"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-semibold text-ink">{dove}</span>
            <span className="tabular shrink-0 text-dim">
              {trascorsi === null
                ? `piano ${formatClock(previsti)}`
                : `${formatClock(trascorsi)} · piano ${formatClock(previsti)}`}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${String(quota)}%` }}
            />
          </div>
          {avviso === null ? null : <p className="mt-1.5 text-xs text-warn">{avviso}</p>}
        </div>
        <button
          type="button"
          onClick={onEsci}
          aria-label="Esci dalla seduta"
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm text-dim active:bg-panel"
        >
          Esci
        </button>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Lettura di una stazione di lavoro                                           */
/* -------------------------------------------------------------------------- */

interface Contesto {
  readonly program: ProgramSession;
  readonly draft: LoggedSession;
  readonly week: number;
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  readonly previous: ReadonlyMap<string, LoggedExercise>;
  readonly tests: ReadonlyMap<TestId, TestResult>;
}

interface Stazione {
  readonly blocco: ProgramBlock;
  readonly esercizio: Exercise;
  readonly range: RangeResolution;
  readonly load: LoadAvailability;
  readonly gradino: LevelIndex | null;
  readonly titolo: string;
  readonly perSide: boolean;
  /** «6-8 ripetizioni per lato», «30″». */
  readonly prescrizione: string;
  readonly tempo: readonly TempoStep[];
  /** «tienine 1-2 di riserva», o `null` dove la scheda non lo prescrive. */
  readonly riserva: string | null;
  /** Le serie della volta scorsa su questo blocco, in una riga. */
  readonly voltaScorsa: string | null;
}

/**
 * Tutto quello che serve a mostrare una stazione, letto una volta sola.
 *
 * Lo usano due schermate — il recupero che la annuncia e il lavoro che la
 * esegue — e devono dire la stessa cosa: stesso titolo, stesso gradino, stessa
 * figura. Calcolato in due posti avrebbe finito per divergere.
 */
function leggiStazione(step: GuidedWorkStep, contesto: Contesto): Stazione | null {
  const { program, draft, week, states, previous, tests } = contesto;
  /*
   * Il blocco è quello della scheda, non una sua ricostruzione: `effectiveBlock`
   * ci applica sopra l'esercizio davvero scelto, dove la riga ne ammette più di
   * uno.
   */
  const dichiarato = program.blocks.find((entry) => entry.code === step.blockCode);
  if (dichiarato === undefined) return null;
  const blocco = effectiveBlock(dichiarato, draft);
  const esercizio = getExercise(blocco.exercise);
  const range = resolveBlockRange(blocco, esercizio, tests);
  const load = getLoadAvailability(esercizio, week);
  const perSide = step.step.perSide;
  const gradino =
    findLoggedExercise(draft, step.blockCode)?.level ?? states.get(esercizio.slug)?.level ?? null;

  /*
   * Il titolo segue il gradino, come la figura: quando il nome dell'esercizio
   * descrive un movimento che non stai facendo, vince il gradino. E l'etichetta
   * si ricalcola dal gradino di adesso invece di leggerla dalla bozza, che la
   * porta dalla seduta scorsa: dopo una salita accettata nella revisione il
   * titolo avrebbe nominato il gradino vecchio sopra la figura del nuovo.
   */
  const titolo = titleAtLevel(esercizio, gradino);

  const unita = esercizio.measurement === 'seconds' ? '' : ' ripetizioni';
  const prescrizione =
    range.kind === 'range'
      ? `${formatRange(range.range, range.unit)}${unita}${perSide ? ' per lato' : ''}`
      : '';

  const riserva = /^\d/.test(blocco.rir) ? `tienine ${blocco.rir} di riserva` : null;

  const passato = previous.get(step.blockCode);
  const riepilogo = passato === undefined ? null : summarizeExercise(passato);
  const voltaScorsa =
    riepilogo === null || riepilogo.sets.length === 0
      ? null
      : `${riepilogo.sets.map((entry) => entry.label).join(' · ')}${
          riepilogo.maxLoadKg > 0 ? ` · ${String(riepilogo.maxLoadKg)} kg` : ''
        }`;

  return {
    blocco,
    esercizio,
    range,
    load,
    gradino,
    titolo,
    perSide,
    prescrizione,
    tempo: tempoSteps(parseTut(blocco.tut)),
    riserva,
    voltaScorsa,
  };
}

/** Il tempo fase per fase: «3″ discesa · 1″ salita». */
function Tempo({ fasi }: { readonly fasi: readonly TempoStep[] }) {
  if (fasi.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Tempo della ripetizione">
      {fasi.map((fase) => (
        <span
          key={fase.label}
          className="inline-flex items-baseline gap-1 rounded-lg bg-panel px-2 py-1 text-xs text-dim"
        >
          <span className="tabular font-semibold text-ink">{fase.value}</span>
          {fase.label}
        </span>
      ))}
    </div>
  );
}

/** I numeri della stazione, uguali nel recupero che la annuncia e nel lavoro. */
function Prescrizione({ stazione }: { readonly stazione: Stazione }) {
  return (
    <>
      <p className="mt-1 text-sm text-dim">
        {[stazione.prescrizione, stazione.riserva].filter((parte) => parte !== null && parte !== '').join(' · ')}
      </p>
      <Tempo fasi={stazione.tempo} />
    </>
  );
}

/**
 * La nota della variante: quello che la figura non dice.
 *
 * Era scritta in arancione piccolo, il colore degli avvisi. Non è un avviso:
 * è l'istruzione più specifica della stazione — «un piede sul box»,
 * «kettlebell in racked» — e va letta come tale.
 */
function NotaVariante({ testo }: { readonly testo: string | undefined }) {
  if (testo === undefined) return null;
  return (
    <p className="mt-3 rounded-xl border-l-4 border-accent bg-accent/10 px-3 py-2 text-sm leading-relaxed">
      {testo}
    </p>
  );
}

/**
 * Il pulsante del passo, sempre a portata: resta attaccato al fondo dello
 * schermo qualunque cosa ci sia sopra.
 *
 * Con la nota della variante, la figura e due contatori per lato, «Fatto»
 * finiva sotto il bordo dello schermo: per chiudere una serie di bulgaro
 * bisognava scorrere, con le mani sudate e il telefono a terra. È l'unico
 * pulsante che in una seduta si preme sessanta volte, e non può mai essere
 * quello che manca.
 */
function Azione({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1" />
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-3 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {children}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Il player                                                                   */
/* -------------------------------------------------------------------------- */

/** Secondi di preavviso prima del primo passo: il tempo di posare il telefono. */
const PARTENZA_SEC = 5;

export function GuidedSession({ sessionId }: { readonly sessionId: SessionId }) {
  const state = useSessionDraft(sessionId);
  const { program, draft, week, states, update, confirmExercise } = state;

  const plan = useMemo(
    () => buildGuidedPlan(program, week, states),
    [program, week, states],
  );
  const offsets = useMemo(() => clockOffsets(plan), [plan]);
  const durata = useMemo(() => estimatedSeconds(plan), [plan]);

  const [index, setIndex] = useState(0);
  /*
   * Come si è arrivati al passo corrente.
   *
   * `true` quando ci si è arrivati avanzando — un conto finito, un «Fatto»,
   * un recupero saltato — e allora la stazione parte da sola. `false` quando
   * ci si è arrivati in un altro modo: riaprendo una seduta interrotta o
   * tornando indietro. Lì nessuno ha detto «sono pronto», e far partire un
   * cronometro su una schermata appena aperta vuol dire misurare il tempo
   * che serve a capire dove si è.
   */
  const [automatico, setAutomatico] = useState(false);
  const [inPartenza, setInPartenza] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [confermaUscita, setConfermaUscita] = useState(false);
  const [decided, setDecided] = useState<ReadonlySet<string>>(new Set());
  const posizionato = useRef(false);

  useWakeLock(!showSummary);

  /*
   * Riprendere una seduta interrotta non riparte dal riscaldamento.
   *
   * Si riparte dal primo passo di lavoro non ancora registrato: chi rientra
   * dopo una telefonata trova la stazione in cui era, non quindici schermate
   * da attraversare. Ma solo se c'è qualcosa da riprendere: il primo passo di
   * lavoro non registrato di una seduta vuota è la prima serie, e senza questa
   * condizione una seduta nuova saltava tutto il riscaldamento.
   *
   * Una seduta nuova comincia invece con cinque secondi di preavviso: tra il
   * tocco su «Inizia» e la corda in mano ci sono due metri, e prima il primo
   * conto partiva mentre il telefono era ancora in mano.
   */
  useEffect(() => {
    if (draft === null || posizionato.current || plan.length === 0) return;
    posizionato.current = true;
    const giaCominciata = plan.some(
      (step) => step.kind === 'work' && isStepLogged(draft, step.step),
    );
    if (!giaCominciata) {
      setInPartenza(true);
      return;
    }
    const primo = plan.findIndex(
      (step) => step.kind === 'work' && !isStepLogged(draft, step.step),
    );
    if (primo === -1) setShowSummary(true);
    else setIndex(primo);
  }, [draft, plan]);

  const inCorso = draft !== null && draft.status === 'in-progress' && !showSummary;
  const adesso = useAdesso(inCorso);

  if (state.loading || draft === null) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center px-4">
        <p className="text-dim">Carico…</p>
      </div>
    );
  }

  const chiudi = (): void => {
    for (const next of syncStatesFromLog(draft, states)) confirmExercise(next);
    update((session) => closeSession(session, new Date().toISOString()));
    navigate({ name: 'home' });
  };

  /*
   * Accettare o rimandare una leva a fine seduta.
   *
   * Qui prima c'era una funzione vuota: il riepilogo mostrava «Accetto, dalla
   * prossima volta», il pulsante si premeva e non succedeva niente — né lo
   * stato dell'esercizio cambiava, né la scelta veniva registrata, né la
   * scheda diceva «scelta registrata». È la stessa funzione del player a
   * serie, che la faceva già.
   */
  const decide = (
    blockCode: string,
    lever: OverloadLever,
    suggestion: ProgressionSuggestion,
    accepted: boolean,
  ): void => {
    const block = program.blocks.find((entry) => entry.code === blockCode);
    if (block === undefined) return;
    const before = states.get(block.exercise);
    if (before === undefined) return;

    if (accepted) confirmExercise(suggestion.nextState);

    void repository.recordSuggestion({
      id: `${draft.id}:${blockCode}:${lever}`,
      date: draft.date,
      sessionLogId: draft.id,
      exercise: block.exercise,
      blockCode,
      lever,
      decision: accepted ? 'accepted' : 'postponed',
      stateBefore: before,
      stateAfter: accepted ? suggestion.nextState : before,
    });

    setDecided((current) => new Set(current).add(`${draft.id}:${blockCode}`));
  };

  if (showSummary) {
    return (
      <SessionSummary
        program={program}
        draft={draft}
        week={week}
        states={states}
        tests={state.tests}
        decided={decided}
        plannedSeconds={durata}
        onUpdate={update}
        onDecide={decide}
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

  const contesto: Contesto = {
    program,
    draft,
    week,
    states,
    previous: state.previous,
    tests: state.tests,
  };

  /*
   * Una funzione qualunque, non una memorizzata: legge `index` dal disegno in
   * cui è nata, e chiamarla due volte dallo stesso passo porta allo stesso
   * posto invece di saltarne uno.
   */
  const avanti = (): void => {
    setAutomatico(true);
    if (index >= plan.length - 1) {
      setShowSummary(true);
      return;
    }
    setIndex(index + 1);
  };

  const indietro = (): void => {
    setAutomatico(false);
    setIndex(Math.max(0, index - 1));
  };

  const inizio = typeof draft.startedAt === 'string' ? Date.parse(draft.startedAt) : Number.NaN;
  const trascorsi =
    Number.isNaN(inizio) || inPartenza ? null : Math.max(0, Math.round((adesso - inizio) / 1000));
  const previsti = inPartenza ? 0 : (offsets[index] ?? 0);
  const quota = durata === 0 ? 0 : Math.min(100, Math.round((previsti / durata) * 100));

  /* Il passo che viene dopo, per il recupero che lo deve annunciare. */
  const prossimo = plan[index + 1];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <Intestazione
        dove={inPartenza ? program.name : doveSei(plan, index, program)}
        quota={quota}
        trascorsi={trascorsi}
        previsti={previsti}
        sulLavoro={!inPartenza && plan.slice(0, index + 1).some((entry) => entry.kind === 'work')}
        onIndietro={indietro}
        indietroAttivo={!inPartenza && index > 0}
        onEsci={() => { setConfermaUscita((valore) => !valore); }}
      />

      {confermaUscita ? (
        <div className="px-4 pt-4">
          <Notice tone="warn">
            Quello che hai registrato resta scritto. Puoi fermarti qui e riprendere più tardi da
            questa stazione, oppure chiudere la seduta così com’è.
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => { navigate({ name: 'home' }); }}>
                Riprendo dopo
              </Button>
              <Button variant="secondary" onClick={() => { setShowSummary(true); }}>
                Chiudi la seduta
              </Button>
              <Button variant="ghost" onClick={() => { setConfermaUscita(false); }}>
                Continua
              </Button>
            </div>
          </Notice>
        </div>
      ) : null}

      <main className="flex flex-1 flex-col px-4 py-4">
        {inPartenza ? (
          <PassoRecupero
            key="partenza"
            step={{
              kind: 'rest',
              id: 'partenza',
              order: 0,
              tier: 'transizione',
              seconds: PARTENZA_SEC,
              maxSeconds: PARTENZA_SEC,
              label: 'Si parte',
              hint: 'Posa il telefono dove lo vedi.',
              nextLabel: '',
              task: null,
            }}
            prossimo={step}
            contesto={contesto}
            etichettaSalto="Parti subito"
            onDone={() => {
              update((session) => markStarted(session, new Date().toISOString()));
              setInPartenza(false);
              setAutomatico(true);
            }}
          />
        ) : step.kind === 'warmup' ? (
          <PassoRiscaldamento key={step.id} step={step} autoStart={automatico} onDone={avanti} />
        ) : step.kind === 'rest' ? (
          <PassoRecupero
            key={step.id}
            step={step}
            prossimo={prossimo}
            contesto={contesto}
            onDone={avanti}
          />
        ) : (
          <PassoLavoro
            key={step.id}
            step={step}
            contesto={contesto}
            autoStart={automatico}
            onCommit={(sets, tempoRispettato) => {
              update((session) => {
                const conSerie = sets.reduce(
                  (acc, entry) => upsertLoggedSet(acc, step.blockCode, entry),
                  /* Chi riprende una seduta nata prima che l'inizio si segnasse. */
                  markStarted(session, new Date().toISOString()),
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
  autoStart,
  onDone,
}: {
  readonly step: Extract<GuidedStep, { kind: 'warmup' }>;
  readonly autoStart: boolean;
  readonly onDone: () => void;
}) {
  const countdown = useCountdown(step.workSeconds, { autoStart });
  const fermo = !countdown.running && !countdown.done;
  useSegnali(countdown.remaining, !fermo);

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
        <Badge tone="accent">{step.inRamp ? 'Giro di prova' : 'Riscaldamento'}</Badge>
      </div>
      <h2 className="mt-3 text-2xl leading-tight font-semibold">{step.label}</h2>
      {step.reps !== null ? (
        <p className="mt-1 text-sm text-dim">
          {step.reps} ripetizioni{step.perSide ? ' per lato' : ''}
        </p>
      ) : null}

      {step.exercise !== null ? (
        <div className="mt-4">
          <ExerciseArt slug={step.exercise} level={null} caption={false} />
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed text-dim">{step.hint}</p>

      <div className="flex items-center justify-center py-6">
        <Orologio
          seconds={countdown.remaining}
          tone="neutro"
          caption={
            fermo
              ? 'In pausa'
              : step.reps === null
                ? 'Fino al segnale'
                : 'Falle entro il segnale, poi si va avanti'
          }
        />
      </div>

      <Azione>
        {fermo ? (
          <Button full size="xl" onClick={() => { primeAudio(); countdown.start(); }}>
            Via
          </Button>
        ) : (
          <Button full size="lg" variant="secondary" onClick={() => { primeAudio(); onDone(); }}>
            Avanti
          </Button>
        )}
      </Azione>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recupero                                                                    */
/* -------------------------------------------------------------------------- */

/** La scheda di ciò che arriva dopo, da leggere mentre il conto scende. */
function Anteprima({
  prossimo,
  contesto,
}: {
  readonly prossimo: GuidedStep | undefined;
  readonly contesto: Contesto;
}) {
  if (prossimo === undefined || prossimo.kind === 'rest') return null;

  if (prossimo.kind === 'warmup') {
    return (
      <Card tone="muted">
        <p className="text-xs font-semibold tracking-wide text-dim uppercase">
          {prossimo.inRamp ? 'Poi · giro di prova' : 'Poi'}
        </p>
        <p className="mt-1 text-lg leading-tight font-semibold">{prossimo.label}</p>
        <p className="mt-1 text-sm text-dim">
          {prossimo.reps === null
            ? `${String(prossimo.workSeconds)}″`
            : `${String(prossimo.reps)} ripetizioni${prossimo.perSide ? ' per lato' : ''}`}
        </p>
        {prossimo.exercise !== null ? (
          <div className="mt-3">
            <ExerciseArt slug={prossimo.exercise} level={null} caption={false} compact />
          </div>
        ) : null}
      </Card>
    );
  }

  const stazione = leggiStazione(prossimo, contesto);
  if (stazione === null) return null;
  return (
    <Card tone="muted">
      <p className="text-xs font-semibold tracking-wide text-dim uppercase">
        Poi · {prossimo.blockCode}
        {prossimo.step.totalSets > 1
          ? ` · giro ${String(prossimo.step.setIndex)} di ${String(prossimo.step.totalSets)}`
          : ''}
      </p>
      <p className="mt-1 text-lg leading-tight font-semibold">{stazione.titolo}</p>
      <Prescrizione stazione={stazione} />
      <div className="mt-3">
        <ExerciseArt slug={stazione.esercizio.slug} level={stazione.gradino} caption={false} compact />
      </div>
      <NotaVariante testo={stazione.blocco.variantNote} />
      {stazione.voltaScorsa === null ? null : (
        <p className="tabular mt-3 text-sm text-dim">
          Volta scorsa: <span className="font-semibold text-ink">{stazione.voltaScorsa}</span>
        </p>
      )}
    </Card>
  );
}

function PassoRecupero({
  step,
  prossimo,
  contesto,
  etichettaSalto = 'Salta il recupero',
  onDone,
}: {
  readonly step: GuidedRestStep;
  readonly prossimo: GuidedStep | undefined;
  readonly contesto: Contesto;
  readonly etichettaSalto?: string;
  readonly onDone: () => void;
}) {
  const countdown = useCountdown(step.seconds, { autoStart: true, onDone: signalRestOver });
  useSegnali(countdown.remaining, true);

  useEffect(() => {
    if (countdown.done) onDone();
  }, [countdown.done, onDone]);

  /*
   * Il livello del recupero è scritto apposta.
   *
   * Una transizione da trenta secondi e un recupero di giro da quarantacinque
   * si assomigliano sul cronometro e non si assomigliano per niente
   * nell'allenamento: il primo è il tempo per spostarsi, il secondo è il
   * recupero vero. Chi li confonde taglia quello sbagliato.
   */
  return (
    <div className="flex flex-1 flex-col">
      <div>
        <Badge tone={step.tier === 'transizione' ? 'neutral' : 'accent'}>{step.label}</Badge>
      </div>

      <div className="py-5">
        <Orologio seconds={countdown.remaining} tone="recupero" caption={step.hint} taglia="media" />
      </div>

      {step.task === null ? null : (
        <div className="mb-3 rounded-2xl border border-accent bg-accent/10 p-4">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">In questa pausa</p>
          <p className="mt-1 text-base leading-snug font-semibold">{step.task}</p>
        </div>
      )}

      <Anteprima prossimo={prossimo} contesto={contesto} />

      <Azione>
        <Button full size="lg" variant="secondary" onClick={() => { primeAudio(); onDone(); }}>
          {etichettaSalto}
        </Button>
      </Azione>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lavoro                                                                      */
/* -------------------------------------------------------------------------- */

interface PassoLavoroProps {
  readonly step: GuidedWorkStep;
  readonly contesto: Contesto;
  readonly autoStart: boolean;
  readonly onCommit: (sets: readonly LoggedSet[], tempoRispettato: boolean) => void;
}

function PassoLavoro({ step, contesto, autoStart, onCommit }: PassoLavoroProps) {
  const cronometro = useStopwatch();
  const { start } = cronometro;
  const minimo = step.workSeconds;
  const rimasti = Math.max(0, minimo - cronometro.seconds);
  const raggiunto = minimo === 0 || cronometro.seconds >= minimo;
  useSegnali(rimasti, minimo > 0 && cronometro.running);

  /* Arrivati qui avanzando, la serie è già cominciata. */
  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  const stazione = leggiStazione(step, contesto);
  const perSide = step.step.perSide;
  const passato = contesto.previous.get(step.blockCode);
  const suggerito = suggestedSetValue(passato, step.step.setIndex, perSide ? 'left' : null);
  const suggeritoDestra = suggestedSetValue(passato, step.step.setIndex, perSide ? 'right' : null);
  const minimoRange =
    stazione !== null && stazione.range.kind === 'range' ? stazione.range.range.min : 0;

  const [valore, setValore] = useState(suggerito?.value ?? minimoRange);
  const [sinistra, setSinistra] = useState(suggerito?.value ?? minimoRange);
  const [destra, setDestra] = useState(suggeritoDestra?.value ?? suggerito?.value ?? minimoRange);
  const [kg, setKg] = useState(suggerito?.loadKg ?? 0);

  /* La serie è cominciata: da qui in poi comanda la registrazione. */
  const partita = cronometro.running || cronometro.seconds > 0;

  const registra = (valori?: { readonly tutti: number }): void => {
    const comune = { rir: null, loadKg: kg, heartRate: null, note: null } as const;
    const sets: LoggedSet[] = perSide
      ? [
          { setIndex: step.step.setIndex, side: 'left', value: valori?.tutti ?? sinistra, ...comune },
          { setIndex: step.step.setIndex, side: 'right', value: valori?.tutti ?? destra, ...comune },
        ]
      : [{ setIndex: step.step.setIndex, side: null, value: valori?.tutti ?? valore, ...comune }];
    onCommit(sets, raggiunto);
  };

  /*
   * Le stazioni a tempo fisso si chiudono da sole allo scadere, con il valore
   * che la scheda prescrive. `chiuso` evita la doppia registrazione: l'effetto
   * gira a ogni ridisegno finché il componente non viene smontato.
   */
  const chiuso = useRef(false);
  const autoCompleta = step.autoComplete && minimo > 0;
  useEffect(() => {
    if (!autoCompleta || !partita || !raggiunto || chiuso.current) return;
    chiuso.current = true;
    onCommit(
      perSide
        ? [
            { setIndex: step.step.setIndex, side: 'left', value: minimo / 2, rir: null, loadKg: 0, heartRate: null, note: null },
            { setIndex: step.step.setIndex, side: 'right', value: minimo / 2, rir: null, loadKg: 0, heartRate: null, note: null },
          ]
        : [{ setIndex: step.step.setIndex, side: null, value: minimo, rir: null, loadKg: 0, heartRate: null, note: null }],
      true,
    );
  }, [autoCompleta, partita, raggiunto, minimo, perSide, step.step.setIndex, onCommit]);

  if (stazione === null || stazione.range.kind !== 'range') {
    return <Notice tone="warn">Blocco {step.blockCode} non trovato nella scheda.</Notice>;
  }

  const { blocco, esercizio, load } = stazione;
  const unita = esercizio.measurement === 'seconds' ? 'sec' : 'rip';

  const testata = (
    <>
      <div className="flex items-center gap-2">
        <Badge tone="accent">{step.blockCode}</Badge>
        {step.step.totalSets > 1 ? (
          <span className="text-xs text-dim">
            giro {step.step.setIndex} di {step.step.totalSets}
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-2xl leading-tight font-semibold">{stazione.titolo}</h2>
      <Prescrizione stazione={stazione} />
    </>
  );

  /* ---------------------------------------------------------------------- */
  /* Stazione a tempo fisso: solo il conto                                   */
  /* ---------------------------------------------------------------------- */
  if (autoCompleta) {
    return (
      <div className="flex flex-1 flex-col">
        {testata}
        <NotaVariante testo={blocco.variantNote} />
        <div className="mt-4">
          <ExerciseArt slug={esercizio.slug} level={stazione.gradino} caption={false} compact />
        </div>

        <div className="flex items-center justify-center py-6">
          <Orologio
            seconds={partita ? rimasti : minimo}
            tone="neutro"
            caption={partita ? 'Fino al segnale' : 'Parte al tuo via'}
          />
        </div>

        <Azione>
          {partita ? (
            <Button
              full
              size="lg"
              variant="secondary"
              onClick={() => {
                if (chiuso.current) return;
                chiuso.current = true;
                /* Chiusa prima: si scrive il tempo fatto davvero, non quello prescritto. */
                registra({ tutti: perSide ? Math.floor(cronometro.seconds / 2) : cronometro.seconds });
              }}
            >
              Chiudi prima
            </Button>
          ) : (
            <Button full size="xl" onClick={() => { primeAudio(); start(); }}>
              Via
            </Button>
          )}
        </Azione>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Stazione da registrare                                                  */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="flex flex-1 flex-col">
      {testata}

      {/*
        A serie partita la figura e la nota per esteso non ci sono più: le hai
        lette nel recupero, dieci secondi fa, ed è lì che si legge. Qui lo
        spazio serve al conto e ai numeri da scrivere, che devono stare tutti
        sopra il pulsante senza scorrere. Della nota resta la prima riga, che è
        quella che dice cosa fare — «un piede sul box», «kettlebell in racked».
        Chi arriva senza passare dal recupero — riprendendo, o tornando
        indietro — non è partito, e vede tutto.
      */}
      {partita ? (
        blocco.variantNote === undefined ? null : (
          <p className="mt-2 line-clamp-2 text-sm leading-snug text-dim">{blocco.variantNote}</p>
        )
      ) : (
        <>
          <NotaVariante testo={blocco.variantNote} />
          <div className="mt-4">
            <ExerciseArt slug={esercizio.slug} level={stazione.gradino} caption={false} compact />
          </div>
        </>
      )}

      <div className="py-4">
        <Orologio
          taglia="media"
          seconds={partita ? (raggiunto ? cronometro.seconds : rimasti) : minimo}
          tone={raggiunto && partita && minimo > 0 ? 'pronto' : 'neutro'}
          caption={
            minimo === 0
              ? 'Tieni la posizione finché reggi la forma'
              : !partita
                ? `Deve durare almeno ${String(minimo)}″`
                : raggiunto
                  ? 'Tempo rispettato: chiudi quando hai finito'
                  : 'Non chiuderla prima'
          }
        />
        {partita && !raggiunto ? (
          <div className="text-center">
            <button
              type="button"
              onClick={() => { cronometro.reset(); start(); }}
              className="min-h-11 px-4 text-xs text-dim underline underline-offset-4"
            >
              Non ero pronto: fai ripartire il tempo
            </button>
          </div>
        ) : null}
      </div>

      {partita ? (
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
      ) : null}

      <Azione>
        {partita ? (
          <Button full size="xl" onClick={() => { registra(); }}>
            Fatto
          </Button>
        ) : (
          <Button full size="xl" onClick={() => { primeAudio(); start(); }}>
            Via
          </Button>
        )}
      </Azione>
    </div>
  );
}
