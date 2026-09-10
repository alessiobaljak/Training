import { useState } from 'react';
import { getProgressionScale } from '../../data/progressions.ts';
import { variantLabelFor } from '../../engine/draft.ts';
import { LEVEL_INDEXES } from '../../types/index.ts';
import { Button, Card, Notice } from '../components/primitives.tsx';
import type { Exercise, ExerciseState, LevelIndex } from '../../types/index.ts';

/**
 * Campo Variante / Livello.
 *
 * Il livello di partenza viene dal programma, non da cosa l'utente sa fare:
 * il giovedì il programma prescrive archer push-up, che è il livello 5. Se
 * quel livello non è mai stato confermato, il player si ferma qui prima della
 * prima serie. Correggere adesso, con l'attrezzo in mano, costa un tap;
 * scoprirlo fra sei settimane guardando un grafico costa il confronto.
 */
export interface VariantPickerProps {
  readonly exercise: Exercise;
  readonly state: ExerciseState;
  readonly label: string;
  readonly mustConfirm: boolean;
  readonly onChange: (level: LevelIndex | null, label: string) => void;
  readonly onConfirm: (state: ExerciseState) => void;
}

export function VariantPicker({
  exercise,
  state,
  label,
  mustConfirm,
  onChange,
  onConfirm,
}: VariantPickerProps) {
  const [expanded, setExpanded] = useState(false);
  /*
   * Quando la conferma è dovuta il pannello è sempre aperto, e non solo la
   * prima volta: lo stato locale sopravvive al cambio di esercizio, e un
   * pannello chiuso su un esercizio da confermare lascerebbe il pulsante
   * "Serie fatta" disabilitato senza mostrare come sbloccarlo.
   */
  const open = mustConfirm || expanded;
  const scale = exercise.pattern === null ? null : getProgressionScale(exercise.pattern);

  const pick = (level: LevelIndex): void => {
    const next: ExerciseState = { ...state, level };
    onChange(level, variantLabelFor(exercise, next));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setExpanded(true); }}
        className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-line bg-panel px-4 text-left"
      >
        <span className="min-w-0">
          <span className="block text-xs text-dim">Variante / Livello</span>
          <span className="block truncate text-sm font-semibold">{label}</span>
        </span>
        <span aria-hidden="true" className="ml-3 text-dim">
          ✎
        </span>
      </button>
    );
  }

  return (
    <Card tone={mustConfirm ? 'warn' : 'default'}>
      {mustConfirm ? (
        <Notice tone="warn">
          Prima serie su questo esercizio. Il livello proposto è quello che il programma prescrive,
          non quello che sai fare oggi: confermalo o correggilo adesso, altrimenti il confronto tra
          le settimane parte già sbagliato.
        </Notice>
      ) : null}

      <p className="mt-3 text-xs font-semibold tracking-wide text-dim uppercase">
        Variante / Livello
      </p>

      {scale === null ? (
        <p className="mt-2 text-sm text-dim">
          {exercise.name} non appartiene a una scala di progressione: qui si scrive a mano.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {LEVEL_INDEXES.map((level) => {
            const step = scale.steps[level - 1];
            if (step === undefined) return null;
            const active = state.level === level;
            return (
              <li key={step.slug}>
                <button
                  type="button"
                  onClick={() => { pick(level); }}
                  aria-pressed={active}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm ${
                    active ? 'border-accent bg-accent/15 font-semibold' : 'border-line bg-panel text-dim'
                  }`}
                >
                  <span className={`w-6 shrink-0 font-mono ${active ? 'text-accent' : ''}`}>
                    {level}
                  </span>
                  <span className="flex-1">{step.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <label className="mt-4 block">
        <span className="text-xs text-dim">Come lo scrivi nel log</span>
        <input
          type="text"
          value={label}
          onChange={(event) => { onChange(state.level, event.target.value); }}
          className="mt-1 min-h-14 w-full rounded-2xl border border-line bg-surface px-4 text-sm text-ink"
        />
      </label>

      <div className="mt-4">
        <Button
          full
          size="lg"
          onClick={() => {
            onConfirm(state);
            setExpanded(false);
          }}
        >
          {mustConfirm ? 'Confermo, è questo' : 'Fatto'}
        </Button>
      </div>
    </Card>
  );
}
