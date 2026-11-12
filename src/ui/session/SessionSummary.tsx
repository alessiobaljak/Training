import { useMemo, useState } from 'react';
import { getExercise } from '../../data/exercises.ts';
import {
  effectiveBlock,
  findLoggedExercise,
  setSessionNote,
  setTempoRespected,
} from '../../engine/draft.ts';
import { formatClock } from '../hooks/useTimers.ts';
import { evaluateProgression } from '../../engine/progression.ts';
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
  /* Nel player guidato il tempo lo misura il cronometro: non lo si chiede. */
  const tempoMisurato = plannedSeconds !== undefined;

  const rows = useMemo(
    () =>
      program.blocks.flatMap((declared) => {
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
        const latest = tests.get(
          block.prescription.kind === 'reps-from-test' ? block.prescription.testId : ('pull-up' as TestId),
        );

        const evaluation = evaluateProgression({
          block,
          exercise,
          state,
          logged,
          range,
          week,
          currentMaxReps:
            block.prescription.kind === 'reps-from-test' ? (latest?.value ?? null) : null,
        });

        const calibration =
          summary.maxLoadKg > 0 ? calibrateLoad(logged.sets, summary.maxLoadKg) : null;

        return [{ block, exercise, logged, summary, evaluation, calibration }];
      }),
    [program, draft, states, tests, week],
  );

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
  const conTempo = giudicate.filter((row) => row.logged.tempoRespected !== null);
  const tempoTenuto = conTempo.filter((row) => row.logged.tempoRespected === true).length;
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
                <p className="text-xs text-dim">Tempo tenuto</p>
                <p className="tabular mt-1 text-xl font-semibold">
                  {conTempo.length === 0 ? '—' : `${String(tempoTenuto)} su ${String(conTempo.length)}`}
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
                    : `${String(Math.round(-scarto / 60))} minuti sotto il piano (${formatClock(plannedSeconds)}). Se le serie erano complete, i carichi sono bassi: alzali la prossima volta.`}
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
                    <p className="tabular text-xs text-dim">{summary.maxLoadKg} kg</p>
                  ) : null}
                </div>
              </div>

              {tempoMisurato ? (
                /*
                 * Misurato, quindi detto e non chiesto. Resta correggibile: il
                 * cronometro parte da solo alla fine del recupero, e chi ha
                 * cominciato la serie cinque secondi dopo sa di averla tenuta
                 * anche se il conto dice di no.
                 */
                logged.tempoRespected === null ? null : (
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className={`min-w-0 text-xs ${logged.tempoRespected ? 'text-good' : 'text-warn'}`}>
                      {logged.tempoRespected ? 'Tempo tenuto' : 'Chiusa prima del tempo minimo'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdate((session) =>
                          setTempoRespected(session, block.code, logged.tempoRespected !== true),
                        );
                      }}
                      className="-my-1 min-h-11 shrink-0 text-xs text-dim underline underline-offset-4"
                    >
                      {logged.tempoRespected ? 'Non è vero' : 'Il tempo c’era'}
                    </button>
                  </div>
                )
              ) : evaluation.closedRange ? (
                /*
                  Finché non si risponde nessuno dei due è acceso.
                  Prima il campo nasceva a «sì»: la domanda arrivava già
                  risposta, premere «Sì» non cambiava niente e sembrava rotto.
                */
                <div className="mt-4 rounded-2xl border border-line bg-panel p-3">
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
                        : 'Risposto no: la leva delle ripetizioni non è ancora esaurita.'}
                  </p>
                </div>
              ) : null}

              {evaluation.enduranceWarning !== null ? (
                <div className="mt-3">
                  <Notice tone="warn">{evaluation.enduranceWarning}</Notice>
                </div>
              ) : null}

              {evaluation.suggestion !== null ? (
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
              ) : evaluation.triggered ? (
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
