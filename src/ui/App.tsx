import {
  EXERCISES,
  PROGRAM_SESSIONS,
  PROGRESSION_SCALES,
  WEEK_ZERO_TESTS,
  getExercise,
} from '../data/index.ts';
import { WEEKDAY_LABELS } from '../types/index.ts';

/**
 * Schermata di servizio della Fase 1.
 *
 * Non è la UI dell'app: serve solo a rendere ispezionabile il seed prima che
 * esistano onboarding, home e player. Verrà sostituita nella Fase 4.
 */
export function App() {
  const totalBlocks = PROGRAM_SESSIONS.reduce((sum, session) => sum + session.blocks.length, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Shadow — Calisthenics</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Fase 1: dati caricati. {PROGRAM_SESSIONS.length} sedute, {totalBlocks} blocchi,{' '}
          {EXERCISES.length} esercizi, {PROGRESSION_SCALES.length} scale di progressione,{' '}
          {WEEK_ZERO_TESTS.length} test.
        </p>
      </header>

      <div className="space-y-4">
        {PROGRAM_SESSIONS.map((session) => (
          <section
            key={session.id}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <h2 className="text-base font-semibold">
              {WEEKDAY_LABELS[session.weekday]} — {session.name}
              <span className="ml-2 text-sm font-normal text-[var(--color-ink-dim)]">
                {session.focus} · {session.estimatedMinutes}′
              </span>
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              {session.blocks.map((block) => (
                <li key={block.code} className="flex gap-3">
                  <span className="w-8 shrink-0 font-mono text-[var(--color-accent)]">
                    {block.code}
                  </span>
                  <span className="flex-1">{getExercise(block.exercise).name}</span>
                  <span className="shrink-0 text-[var(--color-ink-dim)]">
                    {block.sets}× · {block.tut}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
