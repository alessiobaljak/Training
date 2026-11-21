import { useEffect, useMemo, useRef, useState } from 'react';
import { WEEK_ZERO_TESTS, TEST_PROTOCOL_NOTE, TEST_REST_SECONDS } from '../../data/tests.ts';
import { getExercise } from '../../data/exercises.ts';
import { testResultPerSide, testResultSingle } from '../../engine/ranges.ts';
import { testOutcomes } from '../../engine/progression.ts';
import { titleAtLevel } from '../../engine/draft.ts';
import { addDays, formatDayLong, formatDayShort, startOfWeek, todayIso } from '../../engine/dates.ts';
import { chiusuraDelGiro, programWeek } from '../../engine/schedule.ts';
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
  const [saveError, setSaveError] = useState<string | null>(null);
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

  /*
   * Un salvataggio che fallisce non deve lasciare il pulsante morto.
   *
   * Prima qui c'era un `.then()` senza `.catch()`: se la scrittura non andava
   * a buon fine, il passo successivo non arrivava e a schermo non compariva
   * niente. Sembrava un pulsante che non funziona.
   */
  const saveThenGo = (test: TestDefinition, draft: Draft, index: number): void => {
    setSaveError(null);
    void saveTest(test, draft)
      .then(() => {
        goAfter(index);
      })
      .catch((cause: unknown) => {
        setSaveError(cause instanceof Error ? cause.message : 'Salvataggio non riuscito.');
      });
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
              Le ripetizioni delle quattro sedute sono scritte nella scheda e non cambiano. Quello
              che i test decidono è da che gradino parti su ogni esercizio: con quattro trazioni, le
              sei-otto della scheda si fanno con un piede sul box; con dieci, a corpo libero.
              Finché non li hai fatti, il programma resta chiuso.
            </p>
          </Card>

          <Card tone="muted">
            <p className="text-sm font-semibold">Come funziona</p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-dim">
              <li>Una serie sola per test, fino al cedimento della forma. Non del muscolo.</li>
              <li>Da 4 a 5 minuti di recupero tra un test e l’altro, con il conto alla rovescia.</li>
              <li>Puoi fermarti quando vuoi: ogni risposta è già salvata.</li>
              <li>
                Se un test non puoi farlo, saltalo: si parte dal primo gradino di quella scala, e lo
                rifai quando puoi.
              </li>
            </ul>
          </Card>

          {previousRound !== null ? (
            <Card tone="accent">
              <p className="text-sm">
                Ritest. Il confronto sarà con il giro di{' '}
                <span className="font-semibold">{formatDayLong(previousRound.date)}</span>.
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
        {/* Come nel player: una chiave diversa per ogni recupero, altrimenti
            il conto prosegue da quello precedente invece di ripartire. */}
        <CountdownPanel
          key={`recupero-${String(step.nextIndex)}`}
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
    /*
     * Il risultato come lo leggerà l'app: con un valore scritto, la stessa
     * regola del gradino di partenza (R1) fatta girare subito.
     */
    const esiti = testOutcomes(
      test.id,
      value > 0 ? testResultSingle(test.id, todayIso(), 0, value) : null,
    );
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
            {saveError === null ? null : <Notice tone="danger">{saveError}</Notice>}
            <Button
              full
              size="lg"
              disabled={value <= 0}
              onClick={() => {
                saveThenGo(test, draft, step.index);
              }}
            >
              Salva e continua
            </Button>
            <Button
              full
              variant="ghost"
              onClick={() => {
                saveThenGo(test, { value: 0, left: 0, right: 0 }, step.index);
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
                Conta il lato più debole: si parte dal gradino che regge lui, e il lato forte
                lavora un po’ sotto il suo massimo invece del debole sopra il proprio.
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

          <Card tone={value > 0 && esiti.length > 0 ? 'accent' : 'muted'}>
            <p className="text-sm text-dim">Da dove parti</p>
            <div data-testid="partenza" className="mt-1">
              {esiti.length === 0 ? (
                <p className="text-sm leading-relaxed">
                  Questo test non decide niente nelle quattro sedute: nessuna lo usa. Resta per
                  confrontare i progressi al ritest.
                </p>
              ) : value <= 0 ? (
                <p className="text-sm leading-relaxed text-dim">
                  Scrivi il risultato e qui compare il gradino da cui parti.
                </p>
              ) : (
                <ul className="space-y-1">
                  {esiti.map((esito) => (
                    <li key={esito.exercise} className="text-base leading-snug font-semibold">
                      {titleAtLevel(getExercise(esito.exercise), esito.level)}
                      <span className="ml-2 text-xs font-normal text-dim">{esito.where}</span>
                      {esito.notJudged ? (
                        <span className="mt-0.5 block text-xs font-normal text-dim">
                          Solo nella decompressione, dove non si giudica: il test non cambia il
                          gradino.
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
  /* R-16: un ritest non riscrive la data di inizio del programma. */
  const chiusura = chiusuraDelGiro(settings.programStartDate ?? null, missing.length, chosenStart);

  return (
    <Screen
      title="Riepilogo"
      subtitle={`Giro di ${formatDayLong(roundDate)}`}
      footer={
        <div className="pb-1">
          <Button
            full
            size="xl"
            disabled={!chiusura.attivo}
            onClick={() => {
              if (chiusura.dataDaScrivere === null) {
                navigate({ name: 'home' });
                return;
              }
              void repository.setProgramStartDate(chiusura.dataDaScrivere).then(() => {
                navigate({ name: 'home' });
              });
            }}
          >
            {chiusura.etichetta}
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
                  <p className="mt-1 text-xs leading-relaxed text-dim">
                    {result === undefined
                      ? 'Non ancora fatto'
                      : (() => {
                          const esiti = testOutcomes(test.id, result);
                          const massimale = `${String(result.value)}${unit === 'seconds' ? '″' : ''}`;
                          if (esiti.length === 0) return `${massimale} · non usato nelle sedute`;
                          if (esiti.every((esito) => esito.notJudged)) {
                            return `${massimale} · solo nella decompressione, non si giudica`;
                          }
                          return `${massimale} · parti da ${esiti
                            .map((esito) => titleAtLevel(getExercise(esito.exercise), esito.level))
                            .join(', ')}`;
                        })()}
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

        {!chiusura.chiediInizio ? null : (
        <>
        <SectionTitle>Quando parte il programma</SectionTitle>
        <Card>
          <p className="text-sm">
            La settimana 1 comincia <span className="font-semibold">{formatDayShort(chosenStart)}</span>.
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
        </>
        )}
      </div>
    </Screen>
  );
}
