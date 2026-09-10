import { useEffect, useMemo, useRef, useState } from 'react';
import { WEEK_ZERO_TESTS, TEST_PROTOCOL_NOTE, TEST_REST_SECONDS } from '../../data/tests.ts';
import { getExercise } from '../../data/exercises.ts';
import { computeWorkRange, formatRange, testResultPerSide, testResultSingle } from '../../engine/ranges.ts';
import { addDays, startOfWeek, todayIso } from '../../engine/dates.ts';
import { programWeek } from '../../engine/schedule.ts';
import { repository } from '../../db/repository.ts';
import { navigate } from '../router.ts';
import { useSettings, useTestRounds } from '../hooks/useData.ts';
import { Badge, Button, Card, CueList, Notice, Screen, SectionTitle } from '../components/primitives.tsx';
import { NumberStepper } from '../components/NumberStepper.tsx';
import { CountdownPanel, StopwatchField } from '../components/TimerFields.tsx';
import type { TestDefinition, TestId, TestResult } from '../../types/index.ts';
import type { TestRound } from '../../engine/ranges.ts';

/**
 * Settimana 0: i nove test.
 *
 * Ogni risposta viene salvata subito. Chiudere l'app a metà non perde niente e
 * il wizard riprende dal test che manca: nove test con quattro minuti di
 * recupero l'uno non stanno sempre in una sessione sola.
 */

type Step =
  | { readonly kind: 'intro' }
  | { readonly kind: 'test'; readonly index: number }
  | { readonly kind: 'rest'; readonly nextIndex: number }
  | { readonly kind: 'summary' };

interface Draft {
  readonly value: number;
  readonly left: number;
  readonly right: number;
}

const EMPTY_DRAFT: Draft = { value: 0, left: 0, right: 0 };

function draftFrom(result: TestResult | undefined): Draft {
  if (result === undefined) return EMPTY_DRAFT;
  return {
    value: result.value,
    left: result.left ?? result.value,
    right: result.right ?? result.value,
  };
}

function effectiveValue(test: TestDefinition, draft: Draft): number {
  return test.perSide ? Math.min(draft.left, draft.right) : draft.value;
}

export function OnboardingScreen() {
  const rounds = useTestRounds();
  const settings = useSettings();

  const [step, setStep] = useState<Step>({ kind: 'intro' });
  const [roundDate, setRoundDate] = useState<string>(() => todayIso());
  const [drafts, setDrafts] = useState<Partial<Record<TestId, Draft>>>({});
  const [startsThisWeek, setStartsThisWeek] = useState(false);
  const initialized = useRef(false);

  /* Riprende il giro lasciato a metà, una volta sola. */
  useEffect(() => {
    if (rounds === undefined || initialized.current) return;
    initialized.current = true;

    const open = rounds.filter((round) => !round.complete).at(-1);
    if (open === undefined) return;

    setRoundDate(open.date);
    const restored: Partial<Record<TestId, Draft>> = {};
    for (const result of open.results) restored[result.testId] = draftFrom(result);
    setDrafts(restored);

    const firstMissing = WEEK_ZERO_TESTS.findIndex((test) => open.missing.includes(test.id));
    setStep(firstMissing === -1 ? { kind: 'summary' } : { kind: 'test', index: firstMissing });
  }, [rounds]);

  const currentRound: TestRound | null = useMemo(
    () => (rounds ?? []).find((round) => round.date === roundDate) ?? null,
    [rounds, roundDate],
  );

  const previousRound: TestRound | null = useMemo(
    () => (rounds ?? []).filter((round) => round.complete && round.date < roundDate).at(-1) ?? null,
    [rounds, roundDate],
  );

  const week = useMemo(() => {
    const start = settings?.programStartDate ?? null;
    return start === null ? 0 : programWeek(start, roundDate);
  }, [settings, roundDate]);

  if (rounds === undefined || settings === undefined) {
    return (
      <Screen title="Settimana 0">
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const saveTest = async (test: TestDefinition, draft: Draft): Promise<void> => {
    const result = test.perSide
      ? testResultPerSide(test.id, roundDate, week, draft.left, draft.right)
      : testResultSingle(test.id, roundDate, week, draft.value);
    await repository.saveTestResult(result);
  };

  const goAfter = (index: number): void => {
    setStep(
      index >= WEEK_ZERO_TESTS.length - 1
        ? { kind: 'summary' }
        : { kind: 'rest', nextIndex: index + 1 },
    );
  };

  /* ---------------------------------------------------------------------- */

  if (step.kind === 'intro') {
    return (
      <Screen title="Settimana 0" subtitle="I nove test dei massimali">
        <div className="space-y-4">
          <Notice>{TEST_PROTOCOL_NOTE}</Notice>

          <Card>
            <p className="text-sm leading-relaxed text-dim">
              I numeri della scheda sono esempi, non i tuoi. Da questi nove test l’app ricalcola
              tutti i range di lavoro delle sei sedute: finché non li hai fatti, il programma resta
              chiuso.
            </p>
          </Card>

          <Card tone="muted">
            <p className="text-sm font-semibold">Come funziona</p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-dim">
              <li>Una serie sola per test, fino al cedimento della forma. Non del muscolo.</li>
              <li>Da 4 a 5 minuti di recupero tra un test e l’altro, con il conto alla rovescia.</li>
              <li>Puoi fermarti quando vuoi: ogni risposta è già salvata.</li>
              <li>Se un test non puoi farlo, saltalo: viene registrato a zero e lo rifai dopo.</li>
            </ul>
          </Card>

          {previousRound !== null ? (
            <Card tone="accent">
              <p className="text-sm">
                Ritest. Il confronto sarà con il giro del{' '}
                <span className="font-semibold">{previousRound.date}</span>.
              </p>
            </Card>
          ) : null}
        </div>

        <div className="mt-6">
          <Button full size="xl" onClick={() => { setStep({ kind: 'test', index: 0 }); }}>
            Inizia i test
          </Button>
        </div>
      </Screen>
    );
  }

  if (step.kind === 'rest') {
    return (
      <Screen title="Recupero" subtitle={`Prossimo: ${WEEK_ZERO_TESTS[step.nextIndex]?.label ?? ''}`}>
        <CountdownPanel
          totalSeconds={TEST_REST_SECONDS.max}
          readySeconds={TEST_REST_SECONDS.min}
          title="Prima del prossimo test"
          hint="Il recupero pieno serve: un test fatto stanco misura la stanchezza, non la forza."
          onDone={() => { setStep({ kind: 'test', index: step.nextIndex }); }}
        />
      </Screen>
    );
  }

  if (step.kind === 'test') {
    const test = WEEK_ZERO_TESTS[step.index];
    if (test === undefined) return null;

    const exercise = getExercise(test.exercise);
    const stored = currentRound?.results.find((result) => result.testId === test.id);
    const draft = drafts[test.id] ?? draftFrom(stored);
    const value = effectiveValue(test, draft);
    const range = computeWorkRange(value);
    const unit = test.measurement === 'seconds' ? 'seconds' : 'reps';
    const previous = previousRound?.results.find((result) => result.testId === test.id) ?? null;

    const update = (patch: Partial<Draft>): void => {
      setDrafts((current) => ({ ...current, [test.id]: { ...draft, ...patch } }));
    };

    return (
      <Screen
        title={test.label}
        subtitle={`Test ${String(step.index + 1)} di ${String(WEEK_ZERO_TESTS.length)}`}
        onBack={
          step.index === 0
            ? () => { setStep({ kind: 'intro' }); }
            : () => { setStep({ kind: 'test', index: step.index - 1 }); }
        }
        footer={
          <div className="flex flex-col gap-2 pb-1">
            <Button
              full
              size="lg"
              disabled={value <= 0}
              onClick={() => {
                void saveTest(test, draft).then(() => { goAfter(step.index); });
              }}
            >
              Salva e continua
            </Button>
            <Button
              full
              variant="ghost"
              onClick={() => {
                void saveTest(test, { value: 0, left: 0, right: 0 }).then(() => {
                  goAfter(step.index);
                });
              }}
            >
              Salta questo test
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {test.note !== undefined ? <Notice tone="warn">{test.note}</Notice> : null}

          {previous !== null ? (
            <Card tone="muted">
              <p className="text-sm text-dim">
                Test precedente del {previous.date}:{' '}
                <span className="font-semibold text-ink">
                  {String(previous.value)}
                  {unit === 'seconds' ? '"' : ''}
                </span>
              </p>
            </Card>
          ) : null}

          {test.measurement === 'seconds' ? (
            <>
              <StopwatchField
                label="Cronometro"
                seconds={draft.value}
                onChange={(seconds) => { update({ value: seconds }); }}
              />
              <NumberStepper
                label="Oppure inserisci i secondi a mano"
                value={draft.value}
                onChange={(next) => { update({ value: next }); }}
                unit="s"
                max={600}
              />
            </>
          ) : test.perSide ? (
            <>
              <NumberStepper
                label="Gamba sinistra"
                value={draft.left}
                onChange={(next) => { update({ left: next }); }}
                unit="rip"
              />
              <NumberStepper
                label="Gamba destra"
                value={draft.right}
                onChange={(next) => { update({ right: next }); }}
                unit="rip"
              />
              <p className="text-xs leading-relaxed text-dim">
                Il range di lavoro esce dal lato più debole: così il lato forte resta appena sotto
                il proprio range, invece del debole sopra il proprio.
              </p>
            </>
          ) : (
            <NumberStepper
              label="Ripetizioni a cedimento tecnico"
              value={draft.value}
              onChange={(next) => { update({ value: next }); }}
              unit="rip"
            />
          )}

          <Card tone={value > 0 ? 'accent' : 'muted'}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-dim">Range di lavoro</span>
              <span data-testid="range" className="tabular text-2xl font-semibold">
                {value > 0 ? formatRange(range, unit) : '—'}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-dim">
              Dal 55% al 75% del massimale. È la fascia in cui un esercizio a corpo libero produce
              ipertrofia tenendo la tecnica su più serie.
            </p>
          </Card>

          <div>
            <SectionTitle>Esecuzione</SectionTitle>
            <CueList cues={exercise.cues} />
          </div>
        </div>
      </Screen>
    );
  }

  /* ------------------------------- Riepilogo ----------------------------- */

  const nextMonday = startOfWeek(addDays(roundDate, 7));
  const thisMonday = startOfWeek(roundDate);
  const chosenStart = startsThisWeek ? thisMonday : nextMonday;
  const missing = currentRound?.missing ?? WEEK_ZERO_TESTS.map((test) => test.id);

  return (
    <Screen
      title="Riepilogo"
      subtitle={`Giro del ${roundDate}`}
      footer={
        <div className="pb-1">
          <Button
            full
            size="xl"
            disabled={missing.length > 0}
            onClick={() => {
              void repository.setProgramStartDate(chosenStart).then(() => {
                navigate({ name: 'home' });
              });
            }}
          >
            {missing.length > 0 ? `Mancano ${String(missing.length)} test` : 'Conferma e vai alla Home'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {WEEK_ZERO_TESTS.map((test) => {
          const result = currentRound?.results.find((entry) => entry.testId === test.id);
          const previous = previousRound?.results.find((entry) => entry.testId === test.id) ?? null;
          const unit = test.measurement === 'seconds' ? 'seconds' : 'reps';
          const delta = result !== undefined && previous !== null ? result.value - previous.value : null;

          return (
            <Card key={test.id} tone={result === undefined ? 'warn' : 'default'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{test.label}</p>
                  <p className="mt-1 text-xs text-dim">
                    {result === undefined
                      ? 'Non ancora fatto'
                      : `Massimale ${String(result.value)}${unit === 'seconds' ? '"' : ''} · range ${formatRange(computeWorkRange(result.value), unit)}`}
                  </p>
                </div>
                {delta !== null ? (
                  <Badge tone={delta > 0 ? 'good' : delta < 0 ? 'danger' : 'neutral'}>
                    {delta > 0 ? `+${String(delta)}` : String(delta)}
                  </Badge>
                ) : null}
              </div>
            </Card>
          );
        })}

        <SectionTitle>Quando parte il programma</SectionTitle>
        <Card>
          <p className="text-sm">
            Settimana 1 dal <span className="font-semibold">{chosenStart}</span>.
          </p>
          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={() => { setStartsThisWeek((current) => !current); }}
            >
              {startsThisWeek ? 'Parti la settimana prossima' : 'Parti questa settimana'}
            </Button>
          </div>
        </Card>
      </div>
    </Screen>
  );
}
