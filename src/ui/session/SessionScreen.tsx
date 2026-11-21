import { formatNumber } from '../../engine/dates.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getExercise } from '../../data/exercises.ts';
import { repository } from '../../db/repository.ts';
import {
  closeSession,
  effectiveBlock,
  findLoggedExercise,
  firstPendingIndex,
  isStepLogged,
  sessionProgress,
  setBlockExercise,
  syncStatesFromLog,
  setVariant,
  suggestedSetValue,
  upsertLoggedSet,
  statesToSave,
  statiDaFissare,
  statoDopoCambioAMano,
  sessionDecisions,
} from '../../engine/draft.ts';
import type { RecordedDecision } from '../../engine/draft.ts';
import { getLoadAvailability } from '../../engine/loading.ts';
import { describeTut, parseTut } from '../../engine/notation.ts';
import { effectiveTempo, initialExerciseState, isOwnLevel } from '../../engine/progression.ts';
import { formatRange, resolveBlockRange } from '../../engine/ranges.ts';
import { getWeekState } from '../../engine/schedule.ts';
import { Badge, Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import { navigate } from '../router.ts';
import { CardioSession } from './CardioSession.tsx';
import { Metronome } from './Metronome.tsx';
import { ExerciseArt } from '../components/ExerciseArt.tsx';
import { RestBar } from './RestBar.tsx';
import { SessionSummary } from './SessionSummary.tsx';
import { SetEntry, initialSetValues } from './SetEntry.tsx';
import type { SetValues } from './SetEntry.tsx';
import { VariantPicker } from './VariantPicker.tsx';
import { useSessionDraft } from './useSessionDraft.ts';
import type { ExerciseSlug, LoggedSet, OverloadLever, SessionId } from '../../types/index.ts';
import { useSessions, useSuggestions } from '../hooks/useData.ts';
import { decadenze } from '../../engine/decadenza.ts';
import type { RestDecision, SessionStep } from '../../engine/rest.ts';
import type { ProgressionSuggestion } from '../../engine/progression.ts';

/**
 * Player della seduta.
 *
 * Percorre il piano costruito dal motore: l'alternanza delle superserie,
 * i recuperi e le serie dimezzate in scarico sono già decisi lì. Qui si
 * registra e si naviga, non si calcola.
 */
export function SessionScreen({ sessionId }: { readonly sessionId: SessionId }) {
  const state = useSessionDraft(sessionId);
  const {
    program,
    draft,
    plan,
    week,
    states,
    confirmed,
    previous,
    tests,
    update,
    confirmExercise,
    discard,
  } = state;

  const [stepIndex, setStepIndex] = useState(0);
  /*
   * Quello che è stato scritto, serie per serie.
   *
   * Stava dentro SetEntry, che si rimonta a ogni cambio di serie: premere
   * «Serie successiva» dopo aver scritto le ripetizioni le buttava via senza
   * un avviso, e la serie risultava non registrata. Qui sopravvive alla
   * navigazione, quindi si può tornare indietro e registrarla.
   */
  const [valori, setValori] = useState<ReadonlyMap<string, SetValues>>(new Map());
  /* Esercizio verso cui si sta cambiando, in attesa di conferma. */
  const [cambioEsercizio, setCambioEsercizio] = useState<string | null>(null);
  /*
   * `startedAt` non serve a contare: serve a distinguere un recupero
   * dall'altro. React tiene in vita lo stesso componente quando cambiano solo
   * le sue proprietà, quindi senza un valore che cambia il cronometro non
   * riparte e ogni recupero nasce già consumato dal precedente. Dopo qualche
   * serie il recupero da quindici secondi nasceva a zero.
   */
  const [rest, setRest] = useState<{
    readonly rest: RestDecision;
    readonly nextLabel: string;
    readonly startedAt: number;
  } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [confermaScarto, setConfermaScarto] = useState(false);
  /* Le scelte di fine seduta si ricostruiscono da quello che è salvato (B11). */
  const registrate = useSuggestions();
  /* R14: le sedute chiuse, per sapere se una scelta è già stata eseguita. */
  const sedutePassate = useSessions();
  const [locali, setLocali] = useState<readonly RecordedDecision[]>([]);
  const positioned = useRef(false);

  /* Riparte dalla prima serie non registrata, non dall'inizio. */
  useEffect(() => {
    if (draft === null || positioned.current) return;
    positioned.current = true;
    const pending = firstPendingIndex(draft, plan);
    setStepIndex(pending === -1 ? Math.max(0, plan.length - 1) : pending);
  }, [draft, plan]);

  const groups = useMemo(() => [...new Set(plan.map((step) => step.group))], [plan]);

  if (state.loading || draft === null) {
    return (
      <Screen title={program.name}>
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const goHome = (): void => { navigate({ name: 'home' }); };
  const scelte = sessionDecisions(draft.id, registrate ?? [], locali, states);

  const saveAndExit = (): void => {
    /*
     * Chiudere una seduta è anche una decisione sul carico e sul gradino.
     * Quello che è stato scritto serie per serie diventa lo stato dell'app:
     * due kg in più di manubrio, o un livello sceso perché oggi non ne usciva
     * una, valgono senza doverli ridire in un'altra schermata.
     */
    /* Le leve accettate a fine seduta vincono sul diario (A13). */
    /*
     * R14: una scelta accettata e non eseguita si toglie. Lo stato di quegli
     * esercizi e il record `lapsed` si scrivono insieme (L22): mai l'uno
     * senza l'altro.
     */
    const tolte = decadenze(draft, registrate ?? [], sedutePassate ?? [], states);
    const tolti = new Set(tolte.map((d) => d.exercise));
    for (const state of statesToSave(syncStatesFromLog(draft, states), scelte.accepted)) {
      if (tolti.has(state.exercise)) continue;
      confirmExercise(state);
    }
    for (const d of tolte) {
      confirmExercise(d.stato, false);
      void repository.recordDecision(d.record, d.stato);
    }
    /* R9c (B16): un esercizio fatto e mai salvato si fissa, così nessun test lo alza da solo. */
    const giaScritti = new Set([
      ...confirmed,
      ...statesToSave(syncStatesFromLog(draft, states), scelte.accepted).map((x) => x.exercise),
      ...tolti,
    ]);
    for (const fisso of statiDaFissare([draft], giaScritti, (slug) => states.get(slug))) {
      confirmExercise(fisso);
    }
    update((session) => closeSession(session, new Date().toISOString()));
    goHome();
  };

  const decide = (
    blockCode: string,
    lever: OverloadLever,
    suggestion: ProgressionSuggestion,
    accepted: boolean,
  ): void => {
    const block = program.blocks.find((entry) => entry.code === blockCode);
    if (block === undefined) return;
    const before = scelte.toEvaluate.get(block.exercise) ?? states.get(block.exercise);
    if (before === undefined) return;
    if (scelte.decided.has(`${draft.id}:${blockCode}`)) return;

    /* Lo stato si scrive insieme alla traccia, qui sotto: tutti e due o nessuno. */
    if (accepted) confirmExercise(suggestion.nextState, false);

    const record: RecordedDecision = {
      sessionLogId: draft.id,
      exercise: block.exercise,
      blockCode,
      decision: accepted ? 'accepted' : 'postponed',
      stateBefore: before,
      stateAfter: accepted ? suggestion.nextState : before,
    };
    setLocali((current) => [...current, record]);
    void repository.recordDecision(
      {
        ...record,
        id: `${draft.id}:${blockCode}:${lever}`,
        date: draft.date,
        lever,
      },
      accepted ? suggestion.nextState : null,
    );
  };

  if (program.kind === 'cardio') {
    return (
      <CardioSession
        program={program}
        draft={draft}
        onUpdate={update}
        onBack={goHome}
        onClose={saveAndExit}
      />
    );
  }

  if (showSummary) {
    return (
      <SessionSummary
        program={program}
        draft={draft}
        week={week}
        states={scelte.toEvaluate}
        tests={tests}
        decided={scelte.decided}
        onUpdate={update}
        onDecide={decide}
        onSave={saveAndExit}
        onBack={() => { setShowSummary(false); }}
      />
    );
  }

  /*
   * Un indice fuori dal piano non è un piano vuoto.
   *
   * La causa vera era il componente riusato tra due sedute, e si corregge con
   * la `key` in App.tsx. Ma un indice fuori range non deve mai diventare un
   * vicolo cieco: qui si rientra nell'ultimo passo disponibile invece di
   * mostrare un messaggio da cui non si va avanti. Il piano vuoto per davvero
   * resta l'unico caso che lo dice.
   */
  const step: SessionStep | undefined = plan[stepIndex] ?? plan.at(-1);
  if (step === undefined) {
    return (
      <Screen title={program.name} onBack={goHome}>
        <Notice tone="warn">Piano della seduta vuoto.</Notice>
      </Screen>
    );
  }

  const declaredBlock = program.blocks.find((entry) => entry.code === step.blockCode);
  if (declaredBlock === undefined) return null;

  /* L'esercizio davvero scelto, non quello dichiarato dalla scheda. */
  const alternatives = declaredBlock.alternatives ?? [];
  const chosenSlug = findLoggedExercise(draft, declaredBlock.code)?.exercise ?? declaredBlock.exercise;
  const block = effectiveBlock(declaredBlock, draft);

  const exercise = getExercise(block.exercise);
  const exerciseState = states.get(block.exercise);
  const logged = findLoggedExercise(draft, block.code);
  const range = resolveBlockRange(block, exercise, tests);
  const load = getLoadAvailability(exercise, week);
  const progress = sessionProgress(draft, plan);
  const weekState = getWeekState(week);
  /*
   * L'esercizio non si conferma più a mano.
   *
   * Il livello di partenza esce dai nove test della settimana 0 e da quello
   * che il programma prescrive: chiederne conferma prima di ogni prima serie
   * era un passaggio in più che non aggiungeva informazione, e in palestra un
   * passaggio in più è un ostacolo. La variante resta cambiabile quando serve,
   * dalla riga qui sotto.
   */
  const mustConfirm = false;
  const nothingLoggedYet = progress.done === 0;

  const past = previous.get(block.code);
  /*
   * I kg li decide lo stato, non l'ultima riga di log.
   *
   * Prima il campo si precompilava solo dall'ultima volta, e lo stato del
   * carico non lo leggeva nessuno: accettare «aggiungi zavorra» a fine seduta
   * cambiava un numero invisibile, e la settimana dopo ricompariva il peso
   * vecchio. Ora lo stato viene sincronizzato con quello che si scrive a ogni
   * chiusura di seduta, quindi i due numeri coincidono sempre — tranne quando
   * una decisione presa fuori dal player, un suggerimento accettato o la
   * revisione di fine settimana, ha alzato il carico apposta.
   *
   * Lo zero resta la porta di servizio per lo storico vecchio, registrato
   * prima che lo stato venisse sincronizzato.
   */
  const kgDalLog = suggestedSetValue(past, step.setIndex, step.perSide ? 'left' : null)?.loadKg ?? 0;
  const kgDalloStato = exerciseState?.loadKg ?? 0;
  const suggestion = {
    value: suggestedSetValue(past, step.setIndex, null)?.value ?? 0,
    left: suggestedSetValue(past, step.setIndex, 'left')?.value ?? 0,
    right: suggestedSetValue(past, step.setIndex, 'right')?.value ?? 0,
    loadKg: kgDalloStato > 0 ? kgDalloStato : kgDalLog,
  };

  const tempo = exerciseState === undefined ? parseTut(block.tut) : effectiveTempo(block.tut, exerciseState);

  const prevStep = plan[stepIndex - 1];
  const nextStep = plan[stepIndex + 1];

  const gradinoAttuale = logged?.level ?? exerciseState?.level ?? null;

  /*
   * Cosa fai adesso, e cosa dice la scheda: due righe, in quest'ordine.
   *
   * Dove non c'è una scala il nome della riga e quello dell'esercizio sono la
   * stessa cosa — i manubri non hanno gradini — e la seconda riga non serve.
   */
  const variante = logged?.variantLabel ?? exercise.name;
  const suoGradino = isOwnLevel(exercise, gradinoAttuale);
  const titolo = suoGradino ? exercise.name : variante;
  /*
   * L'altra metà: quando comanda l'esercizio, il gradino; quando comanda il
   * gradino, l'esercizio che la scheda prescrive e a che livello lo vuole.
   * Il nome del gradino della scheda non serve ripeterlo — «Nella scheda:
   * Push-up archer · obiettivo Archer push-up» diceva due volte la stessa
   * cosa — e il nome dell'esercizio è comunque il più preciso dei due.
   */
  const scheda = suoGradino
    ? variante === exercise.name
      ? null
      : variante
    : `Nella scheda: ${exercise.name}${
        exercise.defaultLevel === null ? '' : ` (liv. ${String(exercise.defaultLevel)})`
      }`;

  /*
   * Scegliere un'alternativa a mano non passa dal tetto del test.
   *
   * Il tetto serve dove è la scheda ad assegnare un gradino che potresti non
   * reggere. Un'alternativa la scegli tu: se scegli il L-sit vuoi fare il
   * L-sit, non l'hollow hold che è il gradino a cui il test ti ha misurato.
   * Si scrive lo stato al livello proprio di quell'esercizio — ma solo se non
   * ne esiste già uno, altrimenti un lavoro già fatto su quella variante
   * verrebbe azzerato.
   */
  const scegliEsercizio = (slug: ExerciseSlug): void => {
    const scelto = getExercise(slug);
    update((session) => setBlockExercise(session, declaredBlock.code, slug, scelto.name));
    if (!confirmed.has(slug) && scelto.defaultLevel !== null) {
      confirmExercise({ ...initialExerciseState(scelto), level: scelto.defaultLevel });
    }
  };

  const stepKey = `${step.blockCode}-${String(step.setIndex)}`;
  const stepValues = valori.get(stepKey) ?? initialSetValues(suggestion, load);
  const stepLogged = isStepLogged(draft, step);
  /* Numeri scritti da una persona e non ancora finiti nel diario. */
  const daRegistrare = stepValues.touched && !stepLogged;

  const goToStep = (index: number): void => {
    setStepIndex(Math.min(Math.max(0, index), plan.length - 1));
  };

  const commit = (sets: readonly LoggedSet[]): void => {
    update((session) => sets.reduce((acc, entry) => upsertLoggedSet(acc, block.code, entry), session));

    const next = plan[stepIndex + 1];
    if (step.rest.kind !== 'none') {
      const nextBlock =
        next === undefined
          ? undefined
          : program.blocks.find((entry) => entry.code === next.blockCode);
      setRest({
        rest: step.rest,
        startedAt: Date.now(),
        nextLabel:
          nextBlock === undefined
            ? 'Ultima serie del blocco.'
            : `Prossima: ${nextBlock.code} · ${getExercise(nextBlock.exercise).name}`,
      });
    }
    if (next !== undefined) goToStep(stepIndex + 1);
  };

  return (
    <Screen
      title={`${program.name} · ${block.code}`}
      subtitle={`${String(progress.done)} di ${String(progress.total)} serie`}
      onBack={goHome}
      footer={
        <div className="flex flex-col gap-2 pb-1">
          {confermaScarto ? (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3">
              <p className="text-sm leading-relaxed">
                Cancella tutte le serie registrate oggi e riparte da vuoto. Test, misure e livelli
                restano.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    setConfermaScarto(false);
                    void discard();
                  }}
                >
                  Sì, cancella oggi
                </Button>
                <Button variant="ghost" onClick={() => { setConfermaScarto(false); }}>
                  Annulla
                </Button>
              </div>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button
              full
              size="lg"
              variant={progress.complete ? 'primary' : 'secondary'}
              onClick={() => { setShowSummary(true); }}
            >
              {progress.complete ? 'Chiudi la seduta' : 'Chiudi in anticipo'}
            </Button>
            <Button
              variant="danger"
              ariaLabel="Cancella la seduta di oggi"
              onClick={() => { setConfermaScarto((valore) => !valore); }}
            >
              Svuota
            </Button>
          </div>
        </div>
      }
    >
      {rest !== null ? (
        <div className="-mx-4 -mt-4 mb-4">
          <RestBar
            key={rest.startedAt}
            rest={rest.rest}
            nextLabel={rest.nextLabel}
            onDismiss={() => { setRest(null); }}
          />
        </div>
      ) : null}

      <div className="space-y-4">
        {weekState.isDeload ? <Notice tone="warn">{weekState.banner}</Notice> : null}

        {nothingLoggedYet && program.warmup.length > 0 ? (
          <Card tone="muted">
            <p className="text-sm font-semibold">Warm-up</p>
            <ul className="mt-2 space-y-1 text-sm text-dim">
              {program.warmup.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/*
          Le lettere dei blocchi portano alla prima serie *da fare* di quel
          blocco, non alla prima in assoluto. Prima riportavano sempre alla
          serie 1: chi andava a sbirciare un altro esercizio e tornava si
          ritrovava all'inizio del proprio, con le serie già registrate da
          riattraversare una a una.
        */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.map((group) => {
            const first = plan.findIndex((entry) => entry.group === group);
            const pending = plan.findIndex(
              (entry) => entry.group === group && !isStepLogged(draft, entry),
            );
            const groupSteps = plan.filter((entry) => entry.group === group);
            const groupDone = groupSteps.every((entry) => isStepLogged(draft, entry));
            const active = group === step.group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => { goToStep(pending === -1 ? first : pending); }}
                aria-pressed={active}
                className={`min-h-12 min-w-14 shrink-0 rounded-full border px-3 font-mono text-sm font-semibold ${
                  active
                    ? 'border-accent bg-accent/20 text-ink'
                    : groupDone
                      ? 'border-good/40 bg-panel text-good'
                      : 'border-line-strong bg-panel text-dim'
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>

        {/*
          L'ordine è quello che serve con il telefono a terra: prima cosa fai e
          che aspetto ha, poi tutti i numeri della prescrizione insieme, poi
          dove scrivi quello che hai fatto con il metronomo accanto. Lo storico
          della seduta sta in fondo, perché si consulta, non si usa.
        */}
        <Card tone="accent">
          <div className="flex items-start justify-between gap-3">
            {/*
              In alto il blocco come lo scrive la scheda, sotto la variante che
              si sta davvero facendo. Prima l'intestazione mostrava la variante
              *al posto* del nome: da quando il livello di partenza esce dal
              test, il giovedì diceva «Liv. 2 · Push-up a terra» e «Push-up
              archer o pseudo-planche» non compariva più da nessuna parte, cioè
              spariva l'obiettivo del blocco.
            */}
            <div className="min-w-0">
              <p className="font-mono text-xs text-accent">{block.code}</p>
              {/*
                Il titolo è il gradino che stai facendo, non il nome che la
                scheda dà alla riga.
                Sono due cose diverse appena il test ti mette sotto quello che
                la scheda prescrive: il giovedì l'intestazione diceva «Push-up
                archer» in grande e «Liv. 3 · Push-up declinati» in piccolo
                sotto. Gli archer erano la meta, i declinati erano l'esercizio
                da fare — e il titolo diceva l'altro. La meta non sparisce:
                scende di una riga, dove stava già.
              */}
              <p className="text-xl font-semibold">{titolo}</p>
              {scheda !== null ? (
                <p className="mt-1 text-xs leading-relaxed text-dim">{scheda}</p>
              ) : null}
              {/*
                Nella superserie i due esercizi non hanno sempre lo stesso
                numero di serie: il blocco C dell'Upper A è 4 serie di alzate
                laterali e 3 di diamond push-up, così l'ultimo giro è una serie
                sola. Senza dirlo sembra che l'app abbia perso l'altro
                esercizio.
              */}
              {step.aloneInRound ? (
                <p className="mt-1 text-xs text-dim">
                  Ultimo giro da solo: la scheda dà una serie in più a questo esercizio.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => { navigate({ name: 'exercise', slug: exercise.slug }); }}
              className="min-h-12 shrink-0 rounded-full border border-line-strong px-3 text-xs text-dim"
            >
              Scheda
            </button>
          </div>

          <div className="mt-3">
            <ExerciseArt slug={exercise.slug} level={gradinoAttuale} />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-xs text-dim">Serie</p>
              <p className="tabular font-semibold">
                {step.kind === 'work' ? `${String(step.setIndex)}/${String(step.totalSets)}` : '—'}
              </p>
            </div>
            {/*
              Un blocco a durata non ha ripetizioni: la sua prescrizione sono
              i minuti, e prima la casella diceva «Ripetizioni —».
            */}
            <div>
              <p className="text-xs text-dim">
                {block.prescription.kind === 'duration' ? 'Durata' : 'Ripetizioni'}
              </p>
              <p className="tabular font-semibold">
                {block.prescription.kind === 'duration'
                  ? block.prescription.minMinutes === block.prescription.maxMinutes
                    ? `${String(block.prescription.minMinutes)}′`
                    : `${String(block.prescription.minMinutes)}-${String(block.prescription.maxMinutes)}′`
                  : range.kind === 'range'
                    ? formatRange(range.range, range.unit)
                    : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-dim">TUT</p>
              <p className="font-semibold">{block.tut}</p>
            </div>
            <div>
              <p className="text-xs text-dim">RIR</p>
              <p className="font-semibold">{block.rir}</p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-dim">{describeTut(tempo)}</p>
          {block.variantNote !== undefined ? (
            <p className="mt-2 text-xs leading-relaxed text-warn">{block.variantNote}</p>
          ) : null}
        </Card>

        {/*
          Dove la scheda ammette più esercizi diversi — non più livelli dello
          stesso — la scelta sta qui, prima dei campi: cambia anche l'unità di
          misura di quello che si registra, quindi va fatta prima di scrivere.
        */}
        {alternatives.length > 0 ? (
          <Card>
            <p className="text-sm font-semibold">
              {alternatives.length === 1 ? 'Quale dei due stai facendo' : 'Quale stai facendo'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { slug: declaredBlock.exercise, prescription: declaredBlock.prescription },
                ...alternatives.map((entry) => ({
                  slug: entry.exercise,
                  prescription: entry.prescription,
                })),
              ].map((option) => {
                const optionExercise = getExercise(option.slug);
                const active = chosenSlug === option.slug;
                const unit = optionExercise.measurement === 'seconds' ? 'secondi' : 'ripetizioni';
                return (
                  <button
                    key={option.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      if (active) return;
                      const perse = findLoggedExercise(draft, declaredBlock.code)?.sets.length ?? 0;
                      if (perse > 0 && cambioEsercizio !== option.slug) {
                        setCambioEsercizio(option.slug);
                        return;
                      }
                      setCambioEsercizio(null);
                      scegliEsercizio(option.slug);
                    }}
                    className={`min-h-20 min-w-[9rem] flex-1 rounded-2xl border px-3 py-2 text-left ${
                      active ? 'border-accent bg-accent/20 text-ink' : 'border-line-strong bg-panel text-dim'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{optionExercise.name}</span>
                    <span className="mt-1 block text-xs">si misura in {unit}</span>
                  </button>
                );
              })}
            </div>
            {cambioEsercizio !== null ? (
              <div className="mt-3">
                <Notice tone="warn">
                  Hai già registrato delle serie su {exercise.name}. Passare a{' '}
                  {getExercise(cambioEsercizio).name} le cancella: sono misure diverse e non si
                  sommano.
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="danger"
                      onClick={() => {
                        setCambioEsercizio(null);
                        scegliEsercizio(cambioEsercizio);
                      }}
                    >
                      Sì, cambia esercizio
                    </Button>
                    <Button variant="ghost" onClick={() => { setCambioEsercizio(null); }}>
                      Annulla
                    </Button>
                  </div>
                </Notice>
              </div>
            ) : null}
          </Card>
        ) : null}

        {exerciseState !== undefined ? (
          <VariantPicker
            key={exercise.slug}
            exercise={exercise}
            state={exerciseState}
            label={logged?.variantLabel ?? exercise.name}
            mustConfirm={mustConfirm}
            onChange={(level, label) => {
              update((session) => setVariant(session, block.code, label, level));
              // Il cambio si salva subito: non c'è più una conferma a chiuderlo.
              confirmExercise(statoDopoCambioAMano(exercise, exerciseState, level));
            }}
            onConfirm={(confirmedState) => {
              const level = logged?.level ?? confirmedState.level;
              confirmExercise({ ...confirmedState, level });
            }}
          />
        ) : null}

        <SetEntry
          key={stepKey}
          step={step}
          block={block}
          exercise={exercise}
          range={range}
          load={load}
          suggestion={suggestion}
          lockedReason={null}
          values={stepValues}
          onChange={(next) => {
            setValori((current) => new Map(current).set(stepKey, next));
          }}
          onCommit={commit}
        />

        <Card>
          <Metronome tut={tempo} />
        </Card>

        {logged !== undefined && logged.sets.length > 0 ? (
          <div>
            <SectionTitle>Serie registrate</SectionTitle>
            <ul className="space-y-1">
              {[...new Set(logged.sets.map((entry) => entry.setIndex))].map((index) => {
                const rows = logged.sets.filter((entry) => entry.setIndex === index);
                const label = rows
                  .map((entry) => `${entry.side === null ? '' : entry.side === 'left' ? 'sx ' : 'dx '}${String(entry.value)}`)
                  .join(' · ');
                const rir = rows[0]?.rir;
                const kg = rows[0]?.loadKg ?? 0;
                return (
                  <li
                    key={index}
                    className="flex items-center gap-3 rounded-2xl glass-soft px-3 py-2 text-sm"
                  >
                    <span className="w-6 shrink-0 font-mono text-dim">{index}</span>
                    <span className="tabular flex-1 font-semibold">{label}</span>
                    {kg > 0 ? <Badge>{formatNumber(kg)} kg</Badge> : null}
                    {rir !== null && rir !== undefined ? <Badge tone="neutral">RIR {rir}</Badge> : null}
                    <button
                      type="button"
                      onClick={() => { goToStep(plan.findIndex((entry) => entry.blockCode === block.code && entry.setIndex === index)); }}
                      aria-label={`Rifai la serie ${String(index)}`}
                      className="text-dim"
                    >
                      ✎
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {/*
          Spostarsi non registra: chi scriveva le ripetizioni e premeva «Serie
          successiva» si ritrovava la serie mancante e nessun avviso. Ora se
          c'è qualcosa di scritto e non registrato la barra lo dice prima, e i
          pulsanti nominano la serie in cui portano, così si vede che un tocco
          ha fatto qualcosa.
        */}
        {daRegistrare ? (
          <Notice tone="warn">
            La serie {step.setIndex} non è ancora registrata. Premi «Serie fatta» qui sopra:
            spostarti su un’altra serie non la salva.
          </Notice>
        ) : null}

        <div className="flex gap-2">
          <Button
            full
            variant="secondary"
            disabled={stepIndex === 0}
            onClick={() => { goToStep(stepIndex - 1); }}
          >
            {prevStep === undefined
              ? '‹ Serie precedente'
              : `‹ ${prevStep.blockCode} · serie ${String(prevStep.setIndex)}`}
          </Button>
          <Button
            full
            variant="secondary"
            disabled={stepIndex >= plan.length - 1}
            onClick={() => { goToStep(stepIndex + 1); }}
          >
            {nextStep === undefined
              ? 'Serie successiva ›'
              : `${nextStep.blockCode} · serie ${String(nextStep.setIndex)} ›`}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
