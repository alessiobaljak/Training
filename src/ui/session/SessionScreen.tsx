import { useEffect, useMemo, useRef, useState } from 'react';
import { getExercise } from '../../data/exercises.ts';
import { repository } from '../../db/repository.ts';
import {
  closeSession,
  findLoggedExercise,
  firstPendingIndex,
  isStepLogged,
  sessionProgress,
  setVariant,
  suggestedSetValue,
  upsertLoggedSet,
} from '../../engine/draft.ts';
import { getLoadAvailability } from '../../engine/loading.ts';
import { describeTut, parseTut } from '../../engine/notation.ts';
import { effectiveTempo } from '../../engine/progression.ts';
import { formatRange, resolveBlockRange } from '../../engine/ranges.ts';
import { getWeekState } from '../../engine/schedule.ts';
import { Badge, Button, Card, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import { navigate } from '../router.ts';
import { CardioSession } from './CardioSession.tsx';
import { Metronome } from './Metronome.tsx';
import { RestBar } from './RestBar.tsx';
import { SessionSummary } from './SessionSummary.tsx';
import { SetEntry } from './SetEntry.tsx';
import { VariantPicker } from './VariantPicker.tsx';
import { useSessionDraft } from './useSessionDraft.ts';
import type { LoggedSet, OverloadLever, SessionId } from '../../types/index.ts';
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
  const { program, draft, plan, week, states, confirmed, previous, tests, update, confirmExercise } = state;

  const [stepIndex, setStepIndex] = useState(0);
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
  const [decided, setDecided] = useState<ReadonlySet<string>>(new Set());
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

  const saveAndExit = (): void => {
    update((session) => closeSession(session));
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
        states={states}
        tests={tests}
        decided={decided}
        onUpdate={update}
        onDecide={decide}
        onSave={saveAndExit}
        onBack={() => { setShowSummary(false); }}
      />
    );
  }

  const step: SessionStep | undefined = plan[stepIndex];
  if (step === undefined) {
    return (
      <Screen title={program.name} onBack={goHome}>
        <Notice tone="warn">Piano della seduta vuoto.</Notice>
      </Screen>
    );
  }

  const block = program.blocks.find((entry) => entry.code === step.blockCode);
  if (block === undefined) return null;

  const exercise = getExercise(block.exercise);
  const exerciseState = states.get(block.exercise);
  const logged = findLoggedExercise(draft, block.code);
  const range = resolveBlockRange(block, exercise, tests);
  const load = getLoadAvailability(exercise, week);
  const progress = sessionProgress(draft, plan);
  const weekState = getWeekState(week);
  const mustConfirm = !confirmed.has(block.exercise);
  const nothingLoggedYet = progress.done === 0;

  const past = previous.get(block.code);
  const suggestion = {
    value: suggestedSetValue(past, step.setIndex, null)?.value ?? 0,
    left: suggestedSetValue(past, step.setIndex, 'left')?.value ?? 0,
    right: suggestedSetValue(past, step.setIndex, 'right')?.value ?? 0,
    loadKg: suggestedSetValue(past, step.setIndex, step.perSide ? 'left' : null)?.loadKg ?? 0,
  };

  const tempo = exerciseState === undefined ? parseTut(block.tut) : effectiveTempo(block.tut, exerciseState);

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
        <div className="flex gap-2 pb-1">
          <Button
            full
            size="lg"
            variant={progress.complete ? 'primary' : 'secondary'}
            onClick={() => { setShowSummary(true); }}
          >
            {progress.complete ? 'Chiudi la seduta' : 'Chiudi in anticipo'}
          </Button>
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

        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.map((group) => {
            const first = plan.findIndex((entry) => entry.group === group);
            const groupSteps = plan.filter((entry) => entry.group === group);
            const groupDone = groupSteps.every((entry) => isStepLogged(draft, entry));
            const active = group === step.group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => { goToStep(first); }}
                aria-pressed={active}
                className={`min-h-12 min-w-14 shrink-0 rounded-xl border px-3 font-mono text-sm font-semibold ${
                  active
                    ? 'border-accent bg-accent/20 text-ink'
                    : groupDone
                      ? 'border-good/40 bg-panel text-good'
                      : 'border-line bg-panel text-dim'
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>

        <Card tone="accent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-accent">{block.code}</p>
              <p className="text-xl font-semibold">{exercise.name}</p>
            </div>
            <button
              type="button"
              onClick={() => { navigate({ name: 'exercise', slug: exercise.slug }); }}
              className="min-h-12 shrink-0 rounded-xl border border-line px-3 text-xs text-dim"
            >
              Scheda
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-dim">Target</p>
              <p className="tabular font-semibold">
                {range.kind === 'range' ? formatRange(range.range, range.unit) : '—'}
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

          <div className="mt-3">
            <Metronome tut={tempo} />
          </div>
        </Card>

        {exerciseState !== undefined ? (
          <VariantPicker
            key={exercise.slug}
            exercise={exercise}
            state={exerciseState}
            label={logged?.variantLabel ?? exercise.name}
            mustConfirm={mustConfirm}
            onChange={(level, label) => {
              update((session) => setVariant(session, block.code, label, level));
            }}
            onConfirm={(confirmedState) => {
              const level = logged?.level ?? confirmedState.level;
              confirmExercise({ ...confirmedState, level });
            }}
          />
        ) : null}

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
                    className="flex items-center gap-3 rounded-xl border border-line bg-panel px-3 py-2 text-sm"
                  >
                    <span className="w-6 shrink-0 font-mono text-dim">{index}</span>
                    <span className="tabular flex-1 font-semibold">{label}</span>
                    {kg > 0 ? <Badge>{kg} kg</Badge> : null}
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

        <SetEntry
          key={`${step.blockCode}-${String(step.setIndex)}`}
          step={step}
          block={block}
          exercise={exercise}
          range={range}
          load={load}
          suggestion={suggestion}
          lockedReason={
            mustConfirm ? 'Conferma prima variante e livello: senza, il confronto tra le settimane non ha significato.' : null
          }
          onCommit={commit}
        />

        <div className="flex gap-2">
          <Button
            full
            variant="secondary"
            disabled={stepIndex === 0}
            onClick={() => { goToStep(stepIndex - 1); }}
          >
            ‹ Serie precedente
          </Button>
          <Button
            full
            variant="secondary"
            disabled={stepIndex >= plan.length - 1}
            onClick={() => { goToStep(stepIndex + 1); }}
          >
            Serie successiva ›
          </Button>
        </div>
      </div>
    </Screen>
  );
}
