import { useMemo, useState } from 'react';
import { getExercise } from '../../data/exercises.ts';
import {
  effectiveBlock,
  findLoggedExercise,
  setSessionNote,
  setTempoRespected,
} from '../../engine/draft.ts';
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
  onUpdate,
  onDecide,
  onSave,
  onBack,
}: SessionSummaryProps) {
  const [note, setNote] = useState(draft.note ?? '');

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

  const totalSets = rows.reduce((sum, row) => sum + row.summary.setCount, 0);

  return (
    <Screen
      title="Fine seduta"
      subtitle={`${program.name} · ${String(totalSets)} serie registrate`}
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
      <div className="space-y-4">
        {rows.length === 0 ? (
          <Notice tone="warn">
            Nessuna serie registrata. Chiudendo ora la seduta resta a zero nel log.
          </Notice>
        ) : null}

        {rows.map(({ block, exercise, logged, summary, evaluation, calibration }) => {
          const key = `${draft.id}:${block.code}`;
          const alreadyDecided = decided.has(key);

          return (
            <Card key={block.code}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-accent">{block.code}</p>
                  <p className="truncate text-sm font-semibold">{exercise.name}</p>
                  <p className="mt-1 truncate text-xs text-dim">{logged.variantLabel}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-lg font-semibold">
                    {summary.sets.map((entry) => entry.label).join(' · ')}
                  </p>
                  <p className="text-xs text-dim">
                    {summary.totalValue} totali
                    {summary.maxLoadKg > 0 ? ` · ${String(summary.maxLoadKg)} kg` : ''}
                  </p>
                </div>
              </div>

              {/*
                Finché non si risponde nessuno dei due è acceso.
                Prima il campo nasceva a «sì»: la domanda arrivava già
                risposta, premere «Sì» non cambiava niente e sembrava rotto.
              */}
              {evaluation.closedRange ? (
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
