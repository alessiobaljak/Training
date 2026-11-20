import { formatNumber } from '../../engine/dates.ts';
import { useMemo, useState } from 'react';
import { getExercise } from '../../data/exercises.ts';
import {
  effectiveBlock,
  findLoggedExercise,
  setSessionNote,
  setTempoRespected,
} from '../../engine/draft.ts';
import { formatClock } from '../hooks/useTimers.ts';
import { aumentoRecente, evaluateProgression, livelloVoci, salitaConsentita } from '../../engine/progression.ts';
import { buildGuidedPlan, estimatedSeconds } from '../../engine/circuit.ts';
import { decadenze } from '../../engine/decadenza.ts';
import { statiDellaChiusura, tettoDelRiepilogo } from '../../engine/tetto.ts';
import { testBaseline } from '../../data/tests.ts';
import { useSessions, useSuggestions } from '../hooks/useData.ts';
import { calibrateLoad } from '../../engine/loading.ts';
import { resolveBlockRange } from '../../engine/ranges.ts';
import { summarizeExercise } from '../../engine/metrics.ts';
import { Badge, Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import type {
  ExerciseState,
  ExerciseSlug,
  LoggedSession,
  OverloadLever,
  ProgramSession,
  TestId,
  TestResult,
} from '../../types/index.ts';
import type { ProgressionSuggestion } from '../../engine/progression.ts';

/**
 * Fine seduta.
 *
 * Qui il motore propone e l'utente decide. Nulla viene applicato in automatico:
 * accettare cambia il livello o il carico della prossima volta, rimandare
 * lascia tutto com'è. In entrambi i casi la scelta viene registrata.
 */
export interface SessionSummaryProps {
  readonly program: ProgramSession;
  readonly draft: LoggedSession;
  readonly week: number;
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  readonly tests: ReadonlyMap<TestId, TestResult>;
  readonly decided: ReadonlySet<string>;
  /**
   * Durata prevista dal piano, in secondi. La passa il player guidato, che un
   * piano ce l'ha; con questa il riepilogo confronta la durata vera con
   * l'orologio della scheda e il tempo delle serie lo considera misurato.
   */
  readonly plannedSeconds?: number;
  readonly onUpdate: (change: (session: LoggedSession) => LoggedSession) => void;
  readonly onDecide: (
    blockCode: string,
    lever: OverloadLever,
    suggestion: ProgressionSuggestion,
    accepted: boolean,
  ) => void;
  readonly onSave: () => void;
  readonly onBack: () => void;
}

export function SessionSummary({
  program,
  draft,
  week,
  states,
  tests,
  decided,
  plannedSeconds,
  onUpdate,
  onDecide,
  onSave,
  onBack,
}: SessionSummaryProps) {
  const [note, setNote] = useState(draft.note ?? '');
  /* Le sedute chiuse servono a R7: da quando sei al gradino di oggi. */
  const sessions = useSessions();
  /*
   * Il registro delle scelte serve a R13. Quelle di questa seduta no: sono
   * le scelte che si stanno facendo adesso, e il riepilogo le mostra come
   * «Scelta registrata», non come un aumento che ferma sé stesso.
   */
  const registro = useSuggestions();
  /*
   * Nel player guidato il cronometro può dire soltanto «no»: una serie chiusa
   * prima del minimo. Il «sì» lo dà l'atleta, qui (PROGRESSION_RULES §1).
   */
  const tempoMisurato = plannedSeconds !== undefined;

  const rows = useMemo(() => {
    /*
     * R19: la durata si misura con gli stati di oggi più le leve di tempo e
     * pausa già proposte nei blocchi sopra, in questo stesso riepilogo.
     */
    const tetto = tettoDelRiepilogo(
      statiDellaChiusura(draft, states, registro ?? [], sessions ?? []),
      (stati) => estimatedSeconds(buildGuidedPlan(program, 1, stati)),
    );
    /*
     * R14a: le scelte che questa seduta toglie. Su quegli esercizi niente
     * leve, e R13 non conta la scelta tolta.
     */
    const tolte = decadenze(draft, registro ?? [], sessions ?? [], states);
    const toltePerEsercizio = new Map(tolte.map((d) => [d.exercise, d]));
    const idTolti = new Set(tolte.map((d) => d.scelta.id));
    return program.blocks.flatMap((declared) => {
        const logged = findLoggedExercise(draft, declared.code);
        if (logged === undefined || logged.sets.length === 0) return [];

        /*
         * Il blocco con l'esercizio davvero fatto.
         *
         * Senza questo il riepilogo leggeva il blocco dichiarato: chi aveva
         * fatto il wall sit si vedeva analizzare «Sissy squat», con il range
         * in ripetizioni e i suoi secondi contati come ripetizioni.
         */
        const block = effectiveBlock(declared, draft);
        const exercise = getExercise(block.exercise);
        const state = states.get(block.exercise);
        if (state === undefined) return [];

        const range = resolveBlockRange(block, exercise, tests);
        const summary = summarizeExercise(logged);
        /*
         * R6 Z4: il massimale del test dello schema motorio, su ogni blocco.
         * Prima arrivava solo ai blocchi `reps-from-test`, cioè a nessun
         * blocco del circuito, e la soglia della zavorra non si leggeva mai.
         */
        const baseline = exercise.pattern === null ? null : testBaseline(exercise.pattern);
        const latest =
          block.prescription.kind === 'reps-from-test'
            ? tests.get(block.prescription.testId)
            : baseline === null
              ? undefined
              : tests.get(baseline.testId);

        const evaluation = evaluateProgression({
          block,
          exercise,
          state,
          logged,
          range,
          week,
          currentMaxReps: latest?.value ?? null,
          salita: salitaConsentita(block.exercise, state.level, sessions ?? [], draft.date, draft),
          rientro: null,
          aumentoRecente: aumentoRecente(
            block.exercise,
            (registro ?? []).filter((record) => record.sessionLogId !== draft.id && !idTolti.has(record.id)),
            sessions ?? [],
            draft.date,
            draft,
          ),
          /* R14b: se il peso più alto di oggi è quello dello stato, lo stato resta. */
          caricoMassimoSeduta: draft.exercises
            .filter((voce) => voce.exercise === block.exercise)
            .reduce((max, voce) => voce.sets.reduce((m, set) => Math.max(m, set.loadKg), max), 0),
          /* L24: lo stesso per il gradino, il più alto. */
          livelloMassimoSeduta: livelloVoci(draft.exercises.filter((voce) => voce.exercise === block.exercise)),
          /* M21: il primo peso scritto su un manubrio. */
          pesoScrittoPrima: (sessions ?? []).some(
            (session) =>
              session.status === 'completed' &&
              session.id !== draft.id &&
              session.exercises.some(
                (voce) => voce.exercise === block.exercise && voce.sets.some((set) => set.loadKg > 0),
              ),
          ),
          decaduta: toltePerEsercizio.get(block.exercise)?.testo ?? null,
          durataCon: tetto.durataCon,
        });
        /* L25: ogni proposta che allunga la seduta conta per i blocchi sotto. */
        if (evaluation.suggestion !== null) tetto.proposta(evaluation.suggestion.nextState);

        const calibration =
          summary.maxLoadKg > 0 ? calibrateLoad(logged.sets, summary.maxLoadKg) : null;

        return [{ block, exercise, logged, summary, evaluation, calibration }];
      });
  }, [program, draft, states, tests, week, sessions, registro]);

  /*
   * Due gruppi, e solo il primo si giudica.
   *
   * Finitura e decompressione sono fuori dalla revisione, e qui dentro non lo
   * erano: il riepilogo chiedeva «hai tenuto il tempo prescritto su tutte le
   * serie?» su una respirazione da supino, con la risposta già messa a «no» e
   * la spiegazione che «la leva delle ripetizioni non è ancora esaurita».
   * Sei domande così in fondo a una seduta, tre delle quali su posizioni di
   * allungamento. Adesso quelle righe si leggono e basta.
   */
  const giudicate = rows.filter((row) => row.block.excludeFromReview !== true);
  const soloLette = rows.filter((row) => row.block.excludeFromReview === true);

  const totalSets = giudicate.reduce((sum, row) => sum + row.summary.setCount, 0);

  const inizio = typeof draft.startedAt === 'string' ? Date.parse(draft.startedAt) : Number.NaN;
  const fine = typeof draft.completedAt === 'string' ? Date.parse(draft.completedAt) : Date.now();
  const durataVera =
    Number.isNaN(inizio) || Number.isNaN(fine) || fine <= inizio || fine - inizio > 4 * 3600 * 1000
      ? null
      : Math.round((fine - inizio) / 1000);
  const troppoVeloci = giudicate.filter((row) => row.logged.tempoRespected === false).length;
  /*
   * L'orologio si giudica solo su una seduta fatta per intero. Una seduta
   * chiusa a metà è «sotto il piano» di venti minuti, e dirle che i carichi
   * sono bassi sarebbe leggere un numero senza guardare da dove viene.
   */
  const pianificate = program.blocks
    .filter((block) => block.excludeFromReview !== true)
    .reduce((sum, block) => sum + block.sets, 0);
  const completa = totalSets >= pianificate;
  const scarto =
    durataVera === null || plannedSeconds === undefined || !completa
      ? null
      : durataVera - plannedSeconds;

  return (
    <Screen
      title="Fine seduta"
      subtitle={`${program.name} · ${program.focus}`}
      onBack={onBack}
      footer={
        <div className="pb-1">
          <Button
            full
            size="xl"
            onClick={() => {
              onUpdate((session) => setSessionNote(session, note.trim() === '' ? null : note.trim()));
              onSave();
            }}
          >
            Salva e chiudi
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {rows.length === 0 ? (
          <Notice tone="warn">
            Nessuna serie registrata. Chiudendo ora la seduta resta a zero nel log.
          </Notice>
        ) : (
          <>
            {/*
              I tre numeri che dicono com'è andata, prima di qualunque elenco.
              Prima il riepilogo cominciava dalla prima riga della tabella e
              finiva tremila pixel più sotto: quanto era durata la seduta non
              lo diceva da nessuna parte.
            */}
            <div className="grid grid-cols-3 gap-2">
              <Card tone="muted" className="p-3">
                <p className="text-xs text-dim">Durata</p>
                <p className="tabular mt-1 text-xl font-semibold">
                  {durataVera === null ? '—' : formatClock(durataVera)}
                </p>
              </Card>
              <Card tone="muted" className="p-3">
                <p className="text-xs text-dim">Serie</p>
                <p className="tabular mt-1 text-xl font-semibold">{totalSets}</p>
              </Card>
              <Card tone="muted" className="p-3">
                <p className="text-xs text-dim">Sotto il minimo</p>
                <p className="tabular mt-1 text-xl font-semibold">
                  {tempoMisurato ? String(troppoVeloci) : '—'}
                </p>
              </Card>
            </div>
            {!completa && tempoMisurato ? (
              <p className="text-sm leading-relaxed text-dim">
                Seduta chiusa prima della fine: {totalSets} serie su {pianificate}.
              </p>
            ) : null}
            {scarto !== null && plannedSeconds !== undefined ? (
              <p className="text-sm leading-relaxed text-dim">
                {Math.abs(scarto) < 120
                  ? `In orario: il piano era ${formatClock(plannedSeconds)}.`
                  : scarto > 0
                    ? `${String(Math.round(scarto / 60))} minuti oltre il piano (${formatClock(plannedSeconds)}). Il tempo si recupera nelle transizioni, mai nel recupero di giro.`
                    : /*
                       * Il fatto, non una prescrizione sul carico (A14).
                       *
                       * La scheda originale scrive «se sei in anticipo di più di
                       * due minuti i carichi sono bassi: alzali». Detto qui
                       * diventava un consiglio di carico fuori dalle regole di
                       * progressione — in settimana 1, su esercizi dove la
                       * zavorra è vietata, e a chi era in anticipo solo perché
                       * aveva saltato i recuperi. Di quanto e quando si sale lo
                       * decide la revisione, non l'orologio.
                       */
                      `${String(Math.round(-scarto / 60))} minuti sotto il piano (${formatClock(plannedSeconds)}). Se non hai saltato recuperi, è un segnale che il lavoro è facile: lo leggerà la revisione della settimana.`}
              </p>
            ) : null}
          </>
        )}

        {giudicate.map(({ block, exercise, logged, summary, evaluation, calibration }) => {
          const key = `${draft.id}:${block.code}`;
          const alreadyDecided = decided.has(key);
          /* Dove non c'è una scala l'etichetta ripete il nome: una riga basta. */
          const variante = logged.variantLabel.endsWith(exercise.name)
            ? logged.level === null || logged.variantLabel === exercise.name
              ? null
              : `Liv. ${String(logged.level)}`
            : logged.variantLabel;

          return (
            <Card key={block.code}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm leading-snug font-semibold">
                    <span className="mr-2 font-mono text-xs font-normal text-accent">{block.code}</span>
                    {exercise.name}
                  </p>
                  {variante === null ? null : (
                    <p className="mt-1 text-xs text-dim">{variante}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular text-lg leading-tight font-semibold">
                    {summary.sets.map((entry) => entry.label).join(' · ')}
                  </p>
                  {summary.maxLoadKg > 0 ? (
                    <p className="tabular text-xs text-dim">{formatNumber(summary.maxLoadKg)} kg</p>
                  ) : null}
                </div>
              </div>

              {evaluation.closedRange ? (
                /*
                  Finché non si risponde nessuno dei due è acceso.
                  Prima il campo nasceva a «sì»: la domanda arrivava già
                  risposta, premere «Sì» non cambiava niente e sembrava rotto.
                */
                <div className="mt-4 rounded-2xl glass-soft p-3">
                  <p className="text-sm font-semibold">
                    Hai tenuto il tempo prescritto su tutte le serie?
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-dim">
                    Il metodo chiede di chiudere il massimo del range mantenendo il tempo. Senza
                    questa risposta la regola si ridurrebbe a un contatore di ripetizioni.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant={logged.tempoRespected === true ? 'primary' : 'secondary'}
                      ariaPressed={logged.tempoRespected === true}
                      onClick={() => {
                        onUpdate((session) => setTempoRespected(session, block.code, true));
                      }}
                    >
                      Sì, {block.tut}
                    </Button>
                    <Button
                      variant={logged.tempoRespected === false ? 'primary' : 'secondary'}
                      ariaPressed={logged.tempoRespected === false}
                      onClick={() => {
                        onUpdate((session) => setTempoRespected(session, block.code, false));
                      }}
                    >
                      No
                    </Button>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-dim">
                    {logged.tempoRespected === null
                      ? 'Non hai ancora risposto: finché manca, l’app non propone la leva successiva.'
                      : logged.tempoRespected
                        ? `Risposto sì: tempo ${block.tut} tenuto su tutte le serie.`
                        : tempoMisurato
                          ? 'Il cronometro ha misurato almeno una serie sotto il minimo: la leva delle ripetizioni non è ancora esaurita.'
                          : 'Risposto no: la leva delle ripetizioni non è ancora esaurita.'}
                  </p>
                </div>
              ) : logged.tempoRespected === false && tempoMisurato ? (
                <p className="mt-1 text-xs text-warn">
                  Almeno una serie chiusa prima del tempo minimo.
                </p>
              ) : null}

              {evaluation.enduranceWarning !== null ? (
                <div className="mt-3">
                  <Notice tone="warn">{evaluation.enduranceWarning}</Notice>
                </div>
              ) : null}

              {/*
                Finché le sedute non sono lette R7 non si può calcolare: si
                aspetta, invece di mostrare per un istante una leva che
                sparirebbe e che si potrebbe accettare per sbaglio.
              */}
              {sessions === undefined || registro === undefined ? null : evaluation.suggestion !== null ? (
                <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 p-4">
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">Leva successiva</Badge>
                    <p className="text-sm font-semibold">{evaluation.suggestion.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{evaluation.suggestion.change}</p>
                  {evaluation.suggestion.warning !== null ? (
                    <p className="mt-2 text-sm leading-relaxed text-warn">
                      {evaluation.suggestion.warning}
                    </p>
                  ) : null}

                  {alreadyDecided ? (
                    <p className="mt-3 text-sm font-semibold text-good">Scelta registrata.</p>
                  ) : (
                    <div className="mt-4 flex flex-col gap-2">
                      <Button
                        full
                        size="lg"
                        onClick={() => {
                          if (evaluation.suggestion !== null) {
                            onDecide(block.code, evaluation.suggestion.lever, evaluation.suggestion, true);
                          }
                        }}
                      >
                        Accetto, dalla prossima volta
                      </Button>
                      <Button
                        full
                        variant="ghost"
                        onClick={() => {
                          if (evaluation.suggestion !== null) {
                            onDecide(block.code, evaluation.suggestion.lever, evaluation.suggestion, false);
                          }
                        }}
                      >
                        Rimando
                      </Button>
                    </div>
                  )}
                </div>
              ) : evaluation.blockedReason !== null &&
                (evaluation.closedRange || evaluation.fuoriStato === 'r14a' || evaluation.fuoriStato === 'r14e') &&
                evaluation.motivoBlocco !== 'tempo-null' &&
                evaluation.motivoBlocco !== 'tempo-no' ? (
                /*
                  Massimo chiuso e nessuna leva: si dice perché. Scarico,
                  rientro, serie troppo poche o gradino in attesa (R5, R7).
                  Sul tempo lo dice già la domanda qui sopra.
                */
                <p className="mt-3 text-sm leading-relaxed text-warn">{evaluation.blockedReason}</p>
              ) : null}

              {calibration !== null && calibration.message !== null ? (
                <div className="mt-3">
                  <Notice>{calibration.message}</Notice>
                </div>
              ) : null}
            </Card>
          );
        })}

        {soloLette.length === 0 ? null : (
          <>
            <SectionTitle>Finitura e decompressione</SectionTitle>
            <Card tone="muted">
              <ul className="space-y-2">
                {soloLette.map(({ block, exercise, summary }) => (
                  <li key={block.code} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="mr-2 font-mono text-xs text-accent">{block.code}</span>
                      {exercise.name}
                    </span>
                    <span className="tabular shrink-0 text-dim">
                      {summary.sets
                        .map((entry) =>
                          exercise.measurement === 'seconds' ? `${entry.label}″` : entry.label,
                        )
                        .join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        <SectionTitle>Nota sulla seduta</SectionTitle>
        <textarea
          value={note}
          onChange={(event) => { setNote(event.target.value); }}
          rows={3}
          placeholder="Come è andata, cosa cambiare la prossima volta"
          className="w-full rounded-2xl border border-line-strong bg-surface p-4 text-sm text-ink placeholder:text-dim/60"
        />
      </div>
    </Screen>
  );
}
