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
  readonly values: SetValues;
  readonly onChange: (values: SetValues) => void;
  readonly onCommit: (sets: readonly LoggedSet[]) => void;
}

/**
 * Quello che è stato scritto per una serie, prima di registrarla.
 *
 * Vive nel genitore e non qui dentro: cambiando serie il componente si rimonta
 * e lo stato locale sparirebbe, buttando via i numeri appena scritti senza
 * dire niente. `touched` distingue quello che ha scritto una persona dai
 * valori proposti dalla volta scorsa: solo il primo si può registrare da solo.
 */
export interface SetValues {
  readonly value: number;
  readonly left: number;
  readonly right: number;
  readonly rir: number | null;
  readonly loadKg: number;
  readonly note: string;
  readonly touched: boolean;
}

/** Valori di partenza per una serie mai toccata. */
export function initialSetValues(
  suggestion: { readonly value: number; readonly left: number; readonly right: number; readonly loadKg: number },
  load: LoadAvailability,
): SetValues {
  return {
    value: suggestion.value,
    left: suggestion.left,
    right: suggestion.right,
    rir: null,
    loadKg: load.recordable ? suggestion.loadKg : 0,
    note: '',
    touched: false,
  };
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
  values,
  onChange,
  onCommit,
}: SetEntryProps) {
  const { value, left, right, rir, loadKg, note } = values;
  const patch = (change: Partial<SetValues>): void => { onChange({ ...values, ...change, touched: true }); };
  const setValue = (next: number): void => { patch({ value: next }); };
  const setLeft = (next: number): void => { patch({ left: next }); };
  const setRight = (next: number): void => { patch({ right: next }); };
  const setRir = (next: number | null): void => { patch({ rir: next }); };
  const setLoadKg = (next: number): void => { patch({ loadKg: next }); };
  const setNote = (next: string): void => { patch({ note: next }); };

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
      {/*
        Quale serie sia lo dice già la scheda dell'esercizio, sopra. Qui resta
        solo quello che quella scheda non può sapere: se è una serie speciale,
        e se il numero appena scritto sta dentro il range.
      */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">
          {step.kind === 'activation'
            ? 'Serie di attivazione'
            : step.kind === 'mini-set'
              ? `Mini-serie ${String(step.setIndex - 1)}`
              : 'Quante ne hai fatte'}
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

        {/*
          Il campo c'è ogni volta che il peso si può scrivere, anche quando
          non è una leva. Prima, nelle prime due settimane, spariva del tutto:
          chi faceva il Bulgarian split squat con i manubri non aveva dove
          scrivere quanto stava usando, e il diario lo registrava a corpo
          libero.
        */}
        {load.recordable ? (
          <div>
            <NumberStepper
              label="Zavorra"
              value={loadKg}
              onChange={setLoadKg}
              unit="kg"
              step={LOAD_STEP_KG}
              max={80}
              hint={`Solo passi da ${String(LOAD_STEP_KG)} kg`}
            />
            {load.explanation !== null ? (
              <p className="mt-2 text-xs leading-relaxed text-dim">{load.explanation}</p>
            ) : null}
          </div>
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
