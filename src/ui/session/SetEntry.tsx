import { useState } from 'react';
import { classifyValue, formatRange } from '../../engine/ranges.ts';
import { parseRir } from '../../engine/notation.ts';
import { LOAD_STEP_KG } from '../../data/method.ts';
import { Badge, Button, Card, Notice } from '../components/primitives.tsx';
import { NumberStepper } from '../components/NumberStepper.tsx';
import { StopwatchField } from '../components/TimerFields.tsx';
import type { Exercise, LoggedSet, ProgramBlock, Side } from '../../types/index.ts';
import type { RangeResolution } from '../../engine/ranges.ts';
import type { LoadAvailability } from '../../engine/loading.ts';
import type { SessionStep } from '../../engine/rest.ts';

/**
 * Registrazione di una serie.
 *
 * Nulla finisce nel log finché non si tocca "Serie fatta". I valori della
 * volta scorsa si vedono e si possono tenere, ma restano una proposta: una
 * riga precompilata e mai confermata registrerebbe i numeri della settimana
 * scorsa come se fossero di oggi.
 */
export interface SetEntryProps {
  readonly step: SessionStep;
  readonly block: ProgramBlock;
  readonly exercise: Exercise;
  readonly range: RangeResolution;
  readonly load: LoadAvailability;
  readonly suggestion: { readonly value: number; readonly left: number; readonly right: number; readonly loadKg: number };
  readonly lockedReason: string | null;
  readonly onCommit: (sets: readonly LoggedSet[]) => void;
}

const RIR_CHOICES: readonly (number | null)[] = [0, 1, 2, 3, null];

function RangeHint({ value, range }: { value: number; range: RangeResolution }) {
  if (range.kind !== 'range' || value <= 0) return null;
  const position = classifyValue(value, range.range);
  const text = {
    under: 'Sotto il range',
    in: 'Dentro il range',
    over: 'Sopra il range',
  }[position];
  const tone = { under: 'warn', in: 'good', over: 'accent' }[position] as 'warn' | 'good' | 'accent';
  return <Badge tone={tone}>{text}</Badge>;
}

export function SetEntry({
  step,
  block,
  exercise,
  range,
  load,
  suggestion,
  lockedReason,
  onCommit,
}: SetEntryProps) {
  const [value, setValue] = useState(suggestion.value);
  const [left, setLeft] = useState(suggestion.left);
  const [right, setRight] = useState(suggestion.right);
  const [rir, setRir] = useState<number | null>(null);
  const [loadKg, setLoadKg] = useState(load.allowed ? suggestion.loadKg : 0);
  const [note, setNote] = useState('');

  const rirTarget = parseRir(block.rir);
  const isSeconds = exercise.measurement === 'seconds';
  const main = step.perSide ? Math.min(left, right) : value;
  const canCommit = lockedReason === null && (step.perSide ? left > 0 && right > 0 : value > 0);

  const build = (setValueFor: number, side: Side | null): LoggedSet => ({
    setIndex: step.setIndex,
    side,
    value: setValueFor,
    rir,
    loadKg,
    heartRate: null,
    note: note.trim() === '' ? null : note.trim(),
  });

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">
          {step.kind === 'activation'
            ? 'Serie di attivazione'
            : step.kind === 'mini-set'
              ? `Mini-serie ${String(step.setIndex - 1)}`
              : `Serie ${String(step.setIndex)} di ${String(step.totalSets)}`}
        </p>
        <RangeHint value={main} range={range} />
      </div>

      {lockedReason !== null ? (
        <div className="mt-3">
          <Notice tone="warn">{lockedReason}</Notice>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {isSeconds ? (
          <>
            <StopwatchField label="Cronometro" seconds={value} onChange={setValue} />
            <NumberStepper
              label="Oppure i secondi a mano"
              value={value}
              onChange={setValue}
              unit="s"
              max={900}
            />
          </>
        ) : step.perSide ? (
          <>
            <NumberStepper
              label="Sinistra"
              value={left}
              onChange={setLeft}
              unit="rip"
              hint={suggestion.left > 0 ? `Ultima volta ${String(suggestion.left)}` : ''}
            />
            <NumberStepper
              label="Destra"
              value={right}
              onChange={setRight}
              unit="rip"
              hint={suggestion.right > 0 ? `Ultima volta ${String(suggestion.right)}` : ''}
            />
          </>
        ) : (
          <NumberStepper
            label="Ripetizioni"
            value={value}
            onChange={setValue}
            unit="rip"
            hint={suggestion.value > 0 ? `Ultima volta ${String(suggestion.value)}` : ''}
          />
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-dim">
            RIR{rirTarget === null ? '' : ` · obiettivo ${block.rir}`}
          </p>
          <div className="flex gap-2">
            {RIR_CHOICES.map((choice) => {
              const active = rir === choice;
              const onTarget =
                choice !== null && rirTarget !== null && choice >= rirTarget.min && choice <= rirTarget.max;
              return (
                <button
                  key={String(choice)}
                  type="button"
                  onClick={() => { setRir(choice); }}
                  aria-pressed={active}
                  className={`min-h-14 flex-1 rounded-2xl border text-base font-semibold ${
                    active
                      ? 'border-accent bg-accent/20 text-ink'
                      : onTarget
                        ? 'border-good/40 bg-panel text-dim'
                        : 'border-line bg-panel text-dim'
                  }`}
                >
                  {choice === null ? '—' : choice === 3 ? '3+' : String(choice)}
                </button>
              );
            })}
          </div>
        </div>

        {load.allowed ? (
          <NumberStepper
            label="Zavorra"
            value={loadKg}
            onChange={setLoadKg}
            unit="kg"
            step={LOAD_STEP_KG}
            max={80}
            hint={`Solo passi da ${String(LOAD_STEP_KG)} kg`}
          />
        ) : load.explanation !== null ? (
          <p className="text-xs leading-relaxed text-dim">{load.explanation}</p>
        ) : null}

        <label className="block">
          <span className="text-xs text-dim">Nota su questa serie</span>
          <input
            type="text"
            value={note}
            onChange={(event) => { setNote(event.target.value); }}
            placeholder="facoltativa"
            className="mt-1 min-h-14 w-full rounded-2xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-dim/60"
          />
        </label>
      </div>

      <div className="mt-5">
        <Button
          full
          size="xl"
          disabled={!canCommit}
          onClick={() => {
            onCommit(
              step.perSide
                ? [build(left, 'left'), build(right, 'right')]
                : [build(value, null)],
            );
          }}
        >
          Serie fatta
        </Button>
        {range.kind === 'range' ? (
          <p className="mt-2 text-center text-xs text-dim">
            Target {formatRange(range.range, range.unit)}
            {range.source === 'test' ? ' · dal tuo massimale' : ''}
          </p>
        ) : range.kind === 'not-applicable' ? (
          <p className="mt-2 text-center text-xs text-dim">{range.reason}</p>
        ) : null}
      </div>
    </Card>
  );
}
