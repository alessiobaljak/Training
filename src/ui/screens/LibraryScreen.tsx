import { useMemo, useState } from 'react';
import { EXERCISES } from '../../data/exercises.ts';
import { MOTOR_PATTERNS, MOTOR_PATTERN_LABELS } from '../../types/index.ts';
import { navigate } from '../router.ts';
import { useExerciseStates } from '../hooks/useData.ts';
import { Badge, Card, Screen, SectionTitle } from '../components/primitives.tsx';
import type { Exercise, MotorPattern } from '../../types/index.ts';

/**
 * Elenco degli esercizi, raggruppati per schema motorio.
 *
 * Il raggruppamento non è cosmetico: è lo stesso asse su cui si sale di
 * livello, quindi vedere quali esercizi condividono una scala dice già
 * qualcosa su come sono collegati.
 */
function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function LibraryScreen() {
  const states = useExerciseStates();
  const [query, setQuery] = useState('');

  const levelBySlug = useMemo(
    () => new Map((states ?? []).map((state) => [state.exercise, state.level])),
    [states],
  );

  const matching = useMemo(() => {
    const needle = normalize(query.trim());
    if (needle === '') return EXERCISES;
    return EXERCISES.filter((exercise) => normalize(exercise.name).includes(needle));
  }, [query]);

  const groups: { key: string; label: string; items: Exercise[] }[] = [
    ...MOTOR_PATTERNS.map((pattern: MotorPattern) => ({
      key: pattern,
      label: MOTOR_PATTERN_LABELS[pattern],
      items: matching.filter((exercise) => exercise.pattern === pattern),
    })),
    {
      key: 'accessori',
      label: 'Accessori e cardio',
      items: matching.filter((exercise) => exercise.pattern === null),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <Screen title="Esercizi" subtitle={`${String(EXERCISES.length)} schede`}>
      <input
        type="search"
        value={query}
        onChange={(event) => { setQuery(event.target.value); }}
        placeholder="Cerca un esercizio"
        aria-label="Cerca un esercizio"
        className="min-h-14 w-full rounded-2xl border border-line-strong bg-surface px-4 text-sm text-ink placeholder:text-dim/60"
      />

      {groups.length === 0 ? (
        <Card tone="muted" className="mt-4">
          <p className="text-sm text-dim">Nessun esercizio con questo nome.</p>
        </Card>
      ) : null}

      {groups.map((group) => (
        <section key={group.key}>
          <SectionTitle>{group.label}</SectionTitle>
          <ul className="space-y-2">
            {group.items.map((exercise) => {
              const level = levelBySlug.get(exercise.slug) ?? exercise.defaultLevel;
              return (
                <li key={exercise.slug}>
                  <button
                    type="button"
                    onClick={() => { navigate({ name: 'exercise', slug: exercise.slug }); }}
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line-strong bg-surface px-4 text-left active:bg-panel"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{exercise.name}</span>
                      <span className="block truncate text-xs text-dim">
                        {exercise.measurement === 'seconds'
                          ? 'Isometria, si misura in secondi'
                          : exercise.measurement === 'duration'
                            ? 'Attività a durata'
                            : exercise.loadPolicy === 'allowed'
                              ? 'Zavorra consentita'
                              : 'Zavorra non prevista'}
                      </span>
                    </span>
                    {level !== null ? <Badge tone="accent">Liv. {level}</Badge> : null}
                    <span aria-hidden="true" className="text-dim">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Screen>
  );
}
