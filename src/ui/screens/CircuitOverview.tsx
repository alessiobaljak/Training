import { getExercise } from '../../data/exercises.ts';
import { getAnySession } from '../../data/sessions.ts';
import {
  blockRestSeconds,
  buildGuidedPlan,
  estimatedSeconds,
  groupLabel,
  minWorkSeconds,
} from '../../engine/circuit.ts';
import { totalWorkSets } from '../../engine/rest.ts';
import { formatRange, resolveBlockRange } from '../../engine/ranges.ts';
import { ExerciseArt } from '../components/ExerciseArt.tsx';
import { formatClock } from '../hooks/useTimers.ts';
import { Badge, Button, Card, Screen, SectionTitle } from '../components/primitives.tsx';
import { useLatestTests } from '../hooks/useData.ts';
import { navigate } from '../router.ts';
import type { ProgramBlock, SessionId } from '../../types/index.ts';

/**
 * La scheda, prima di iniziare.
 *
 * Qui si vede tutto insieme: il riscaldamento, i blocchi, ogni esercizio con
 * la sua figura e la sua prescrizione. È l'unico momento in cui ha senso
 * mostrare tutto — serve a sapere cosa preparare e a decidere se oggi è la
 * seduta giusta. Dal tocco su «Inizia» in poi si vede un passo alla volta,
 * perché mentre ci si allena una lista è rumore.
 */

/**
 * Lo stesso formato del player, m:ss.
 *
 * La scheda scriveva «almeno 0′40″» e «almeno 1′», il player «0:40» e «1:00».
 * Due notazioni per lo stesso numero, e la seconda si legge come «uno-zero-
 * zero»: il bulgaro, che dura sessanta secondi tondi in tutte e due le
 * schermate, è stato letto come cento secondi. Una sola notazione, ovunque.
 */
function durata(seconds: number): string {
  return formatClock(seconds);
}

function Riga({ block }: { readonly block: ProgramBlock }) {
  const tests = useLatestTests();
  const exercise = getExercise(block.exercise);
  const range = resolveBlockRange(block, exercise, tests ?? new Map());
  const minimo = minWorkSeconds(block, exercise);

  return (
    <li>
      <button
        type="button"
        onClick={() => { navigate({ name: 'exercise', slug: exercise.slug }); }}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-panel p-3 text-left active:bg-line"
      >
        <span className="flex h-14 w-20 shrink-0 items-center overflow-hidden rounded-xl bg-canvas text-ink">
          <ExerciseArt slug={exercise.slug} level={null} caption={false} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-accent">{block.code}</span>
            <span className="truncate text-sm font-semibold">{exercise.name}</span>
          </span>
          <span className="tabular mt-1 block text-xs text-dim">
            {block.sets} × {range.kind === 'range' ? formatRange(range.range, range.unit) : '—'}
            {block.perSide ? ' per lato' : ''}
            {minimo > 0 ? ` · almeno ${durata(minimo)}` : ''}
          </span>
        </span>
      </button>
      {block.variantNote !== undefined ? (
        <p className="mt-1 px-3 text-xs leading-relaxed text-dim">{block.variantNote}</p>
      ) : null}
    </li>
  );
}

export function CircuitOverview({ sessionId }: { readonly sessionId: SessionId }) {
  const session = getAnySession(sessionId);
  /*
   * La stima e le serie si leggono alla settimana 1: qui non si sta allenando
   * nessuno, e far dipendere la scheda dallo scarico della settimana in corso
   * vorrebbe dire mostrare numeri diversi a seconda del giorno in cui la si
   * apre.
   */
  const week = 1;
  const plan = buildGuidedPlan(session, week);
  const secondi = estimatedSeconds(plan);

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
            Inizia
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Durata', value: durata(secondi) },
            { label: 'Serie', value: String(totalWorkSets(session, week)) },
            { label: 'Blocchi', value: String(gruppi.length) },
          ].map((voce) => (
            <Card key={voce.label} tone="muted">
              <p className="text-xs text-dim">{voce.label}</p>
              <p className="tabular mt-1 text-xl font-semibold">{voce.value}</p>
            </Card>
          ))}
        </div>

        {warmup.length > 0 ? (
          <div>
            <SectionTitle>Riscaldamento</SectionTitle>
            <Card tone="muted">
              <ul className="space-y-2 text-sm">
                {warmup.map((passo) => (
                  <li key={passo.label} className="flex gap-3">
                    <span className="tabular w-16 shrink-0 text-xs text-accent">
                      {passo.seconds !== null
                        ? `${String(passo.seconds)}″`
                        : `${String(passo.reps ?? 0)} rip${passo.perSide ? '/lato' : ''}`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block">{passo.label}</span>
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
          return (
            <div key={group}>
              <SectionTitle>{groupLabel(session, group)}</SectionTitle>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>{primo.sets} giri</Badge>
                {rest.kind === 'superset' ? (
                  <>
                    <Badge tone="neutral">transizione {rest.transitionMinSec}″</Badge>
                    {rest.roundRestSec > 0 ? (
                      <Badge tone="accent">giro {rest.roundRestSec}″</Badge>
                    ) : null}
                  </>
                ) : rest.kind === 'straight' ? (
                  <Badge tone="accent">tra le serie {rest.restSec}″</Badge>
                ) : null}
                {blockRestSeconds(primo) > 0 ? (
                  <Badge tone="neutral">poi {blockRestSeconds(primo)}″</Badge>
                ) : null}
              </div>
              <ul className="space-y-2">
                {blocks.map((block) => (
                  <Riga key={block.code} block={block} />
                ))}
              </ul>
            </div>
          );
        })}

        {session.note !== undefined ? (
          <Card tone="muted">
            <p className="text-sm leading-relaxed text-dim">{session.note}</p>
          </Card>
        ) : null}
      </div>
    </Screen>
  );
}
