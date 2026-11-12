import { getExercise } from '../../data/exercises.ts';
import { getAnySession } from '../../data/sessions.ts';
import {
  blockRestSeconds,
  buildGuidedPlan,
  estimatedSeconds,
  groupLabel,
  isAutoComplete,
  minWorkSeconds,
} from '../../engine/circuit.ts';
import { formatDaysAgo, todayIso } from '../../engine/dates.ts';
import { lastLoggedByBlock, titleAtLevel, variantNoteAt } from '../../engine/draft.ts';
import { summarizeExercise } from '../../engine/metrics.ts';
import { initialExerciseState } from '../../engine/progression.ts';
import { formatRange, resolveBlockRange } from '../../engine/ranges.ts';
import { blockPerSide } from '../../engine/rest.ts';
import { ExerciseArt } from '../components/ExerciseArt.tsx';
import { formatClock } from '../hooks/useTimers.ts';
import { Badge, Button, Card, Screen, SectionTitle } from '../components/primitives.tsx';
import { useExerciseStates, useLatestTests, useSessions } from '../hooks/useData.ts';
import { navigate } from '../router.ts';
import type {
  ExerciseSlug,
  ExerciseState,
  LoggedExercise,
  ProgramBlock,
  SessionId,
  TestId,
  TestResult,
} from '../../types/index.ts';

/**
 * La scheda di un circuito: tutto quello che c'è da sapere prima di cominciare.
 *
 * È la schermata che risponde a «cosa faccio oggi» senza ancora chiedere di
 * farlo. Il player guidato mostra un passo alla volta e non lascia vedere
 * avanti; qui si vede tutto insieme, si capisce quanto dura e cosa serve, e
 * poi si preme un pulsante solo.
 *
 * **Dice le stesse cose del player.** Titolo, figura e «per lato» seguono il
 * gradino a cui sei, non quello per cui l'esercizio è scritto: prima la scheda
 * mostrava il nome dell'anagrafica e il player quello del gradino, e la stessa
 * stazione aveva due nomi a seconda di dove la guardavi.
 */

interface Contesto {
  readonly states: ReadonlyMap<ExerciseSlug, ExerciseState>;
  readonly tests: ReadonlyMap<TestId, TestResult>;
  readonly previous: ReadonlyMap<string, LoggedExercise>;
}

function Riga({ block, contesto }: { readonly block: ProgramBlock; readonly contesto: Contesto }) {
  const exercise = getExercise(block.exercise);
  const range = resolveBlockRange(block, exercise, contesto.tests);
  const gradino = contesto.states.get(exercise.slug)?.level ?? null;
  const perLato = blockPerSide(block, contesto.states);
  const minimo = minWorkSeconds(block, exercise, perLato);
  const passato = contesto.previous.get(block.code);
  const riepilogo = passato === undefined ? null : summarizeExercise(passato);

  return (
    <li>
      <button
        type="button"
        onClick={() => { navigate({ name: 'exercise', slug: exercise.slug }); }}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-panel p-3 text-left active:bg-line"
      >
        <span className="flex h-16 w-16 shrink-0 items-center overflow-hidden rounded-xl bg-canvas text-ink">
          <ExerciseArt slug={exercise.slug} level={gradino} caption={false} frame="last" />
        </span>
        <span className="min-w-0 flex-1">
          {/* Due righe, non una troncata: il titolo è ciò che distingue una stazione. */}
          <span className="block text-sm leading-snug font-semibold">
            <span className="mr-2 font-mono text-xs font-normal text-accent">{block.code}</span>
            {titleAtLevel(exercise, gradino)}
          </span>
          <span className="tabular mt-1 block text-xs text-dim">
            {block.sets} × {range.kind === 'range' ? formatRange(range.range, range.unit) : '—'}
            {perLato ? ' per lato' : ''}
            {minimo > 0 && !isAutoComplete(block) ? ` · almeno ${formatClock(minimo)}` : ''}
          </span>
          {riepilogo === null || riepilogo.sets.length === 0 ? null : (
            <span className="tabular mt-0.5 block text-xs text-dim">
              volta scorsa{' '}
              <span className="font-semibold text-ink">
                {riepilogo.sets.map((entry) => entry.label).join(' · ')}
                {riepilogo.maxLoadKg > 0 ? ` · ${String(riepilogo.maxLoadKg)} kg` : ''}
              </span>
            </span>
          )}
        </span>
      </button>
      {variantNoteAt(block, gradino) !== undefined ? (
        <p className="mt-1 px-3 text-xs leading-relaxed text-dim">{variantNoteAt(block, gradino)}</p>
      ) : null}
    </li>
  );
}

export function CircuitOverview({ sessionId }: { readonly sessionId: SessionId }) {
  const session = getAnySession(sessionId);
  const tests = useLatestTests();
  const stored = useExerciseStates();
  const sessions = useSessions();
  const today = todayIso();

  /*
   * Lo stato di ogni esercizio: quello salvato, o quello di partenza. Un
   * esercizio mai fatto non ha una riga nel database, e senza questo ripiego
   * la scheda lo mostrerebbe al gradino dell'anagrafica mentre il player lo
   * apre a quello calcolato dai test.
   */
  const prove = tests ?? new Map<TestId, TestResult>();
  const salvati = new Map((stored ?? []).map((state) => [state.exercise, state]));
  const states = new Map<ExerciseSlug, ExerciseState>(
    session.blocks.map((block) => [
      block.exercise,
      salvati.get(block.exercise) ?? initialExerciseState(getExercise(block.exercise), prove),
    ]),
  );

  const storico = (sessions ?? []).filter((entry) => entry.sessionId === session.id);
  const previous = lastLoggedByBlock(
    storico.filter((entry) => entry.status === 'completed'),
    session.id,
    '',
    new Map(session.blocks.map((block) => [block.code, block.exercise])),
  );
  const ultima = storico
    .filter((entry) => entry.status === 'completed')
    .map((entry) => entry.date)
    .sort()
    .at(-1);
  const inCorso = storico.some((entry) => entry.status === 'in-progress' && entry.date === today);

  const contesto: Contesto = { states, tests: prove, previous };

  const plan = buildGuidedPlan(session, 1, states);
  const secondi = estimatedSeconds(plan);
  const serieDiLavoro = session.blocks
    .filter((block) => block.excludeFromReview !== true)
    .reduce((somma, block) => somma + block.sets, 0);

  /* Il giro di prova dura la somma dei suoi passi, non il numero scritto sulla riga. */
  const secondiRampa = plan.reduce(
    (somma, step) => (step.kind === 'warmup' && step.inRamp ? somma + step.workSeconds : somma),
    0,
  );

  const gruppi = [...new Set(session.blocks.map((block) => block.group))];
  const warmup = session.warmupSteps ?? [];

  return (
    <Screen
      title={session.name}
      subtitle={session.focus}
      onBack={() => { navigate({ name: 'home' }); }}
      footer={
        <div className="pb-1">
          <Button
            full
            size="xl"
            onClick={() => { navigate({ name: 'session', sessionId: session.id }); }}
          >
            {inCorso ? 'Riprendi' : 'Inizia'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Durata', value: formatClock(secondi) },
            { label: 'Serie', value: String(serieDiLavoro) },
            { label: 'Ultima volta', value: ultima === undefined ? 'mai' : formatDaysAgo(ultima, today) },
          ].map((voce) => (
            <Card key={voce.label} tone="muted" className="p-3">
              <p className="text-xs text-dim">{voce.label}</p>
              <p className="tabular mt-1 text-lg leading-tight font-semibold">{voce.value}</p>
            </Card>
          ))}
        </div>

        {session.note !== undefined ? (
          <Card tone="muted">
            <p className="text-sm leading-relaxed text-dim">{session.note}</p>
          </Card>
        ) : null}

        {warmup.length > 0 ? (
          <div>
            <SectionTitle>Riscaldamento</SectionTitle>
            <Card tone="muted">
              <ul className="space-y-2 text-sm">
                {warmup.map((passo) => (
                  <li key={passo.label} className="flex gap-3">
                    <span className="tabular w-12 shrink-0 text-xs text-accent">
                      {passo.rampGroup === undefined
                        ? `${String(passo.seconds)}″`
                        : `${String(secondiRampa)}″`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block">
                        {passo.label}
                        {passo.reps === null
                          ? ''
                          : ` · ${String(passo.reps)}${passo.perSide ? ' per lato' : ''}`}
                      </span>
                      <span className="mt-0.5 block text-xs text-dim">{passo.hint}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : null}

        {gruppi.map((group) => {
          const blocks = session.blocks.filter((block) => block.group === group);
          const primo = blocks[0];
          if (primo === undefined) return null;
          const rest = primo.rest;
          const compito = session.pauseTasks?.[group];
          return (
            <div key={group}>
              <SectionTitle>{groupLabel(session, group)}</SectionTitle>
              {/*
                I recuperi con il loro nome. Prima c'era «giro 45″ · poi 90″»:
                «poi» non diceva dopo cosa, e uno zero veniva scritto lo stesso
                («transizione 0″» sulla decompressione).
              */}
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{primo.sets === 1 ? '1 giro' : `${String(primo.sets)} giri`}</Badge>
                {rest.kind === 'superset' ? (
                  <>
                    {rest.transitionMinSec > 0 ? (
                      <Badge tone="neutral">tra le stazioni {rest.transitionMinSec}″</Badge>
                    ) : null}
                    {rest.roundRestSec > 0 ? (
                      <Badge tone="accent">tra i giri {rest.roundRestSec}″</Badge>
                    ) : primo.sets > 1 ? (
                      <Badge tone="accent">giri di fila</Badge>
                    ) : null}
                  </>
                ) : rest.kind === 'straight' ? (
                  <Badge tone="accent">tra le serie {rest.restSec}″</Badge>
                ) : null}
                {blockRestSeconds(primo) > 0 ? (
                  <Badge tone="neutral">pausa alla fine {blockRestSeconds(primo)}″</Badge>
                ) : null}
              </div>
              <ul className="space-y-2">
                {blocks.map((block) => (
                  <Riga key={block.code} block={block} contesto={contesto} />
                ))}
              </ul>
              {compito === undefined ? null : (
                <p className="mt-2 rounded-xl border-l-4 border-accent bg-accent/10 px-3 py-2 text-sm leading-relaxed">
                  <span className="font-semibold">Nella pausa alla fine:</span> {compito}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
