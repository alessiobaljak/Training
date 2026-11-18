import { useEffect, useRef, useState } from 'react';
import { isTempoBreakdown } from '../../engine/notation.ts';
import { beep, primeAudio, vibrate } from '../feedback.ts';
import type { TempoPhase, Tut } from '../../types/index.ts';

/**
 * Metronomo del tempo sotto tensione.
 *
 * Il TUT è la variabile principale del metodo, non un dettaglio: un push-up a
 * 4-1-1-0 è un esercizio diverso da un push-up veloce. Contare a mente mentre
 * si spinge non funziona, quindi qui il tempo lo scandisce l'app.
 *
 * Come i cronometri, la posizione nel ciclo si ricava da `Date.now()`: con i
 * tick, un blocco schermo a metà serie sfaserebbe tutto.
 */

interface Phase {
  readonly name: string;
  readonly seconds: number;
}

/** Una fase esplosiva dura quanto serve a essere esplosiva: mezzo secondo. */
const EXPLOSIVE_SECONDS = 0.5;

function phaseSeconds(value: TempoPhase): number {
  return value === 'X' ? EXPLOSIVE_SECONDS : value;
}

export function tempoPhases(tut: Tut): Phase[] {
  if (!isTempoBreakdown(tut)) return [];
  return [
    { name: 'Giù', seconds: phaseSeconds(tut.eccentric) },
    { name: 'Fermo', seconds: phaseSeconds(tut.bottomPause) },
    { name: 'Su', seconds: phaseSeconds(tut.concentric) },
    { name: 'Tieni', seconds: phaseSeconds(tut.topPause) },
  ].filter((phase) => phase.seconds > 0);
}

export function Metronome({ tut }: { readonly tut: Tut }) {
  const phases = tempoPhases(tut);
  const cycle = phases.reduce((sum, phase) => sum + phase.seconds, 0);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const lastPhase = useRef(-1);

  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 60);
    return () => {
      window.clearInterval(id);
    };
  }, [startedAt]);

  if (phases.length === 0 || cycle <= 0) return null;

  const elapsed = startedAt === null ? 0 : (Date.now() - startedAt) / 1000;
  const position = elapsed % cycle;
  const reps = Math.floor(elapsed / cycle);

  let index = 0;
  let offset = 0;
  for (const [i, phase] of phases.entries()) {
    if (position < offset + phase.seconds) {
      index = i;
      break;
    }
    offset += phase.seconds;
    index = i;
  }
  const current = phases[index];
  const within = position - offset;

  if (startedAt !== null && index !== lastPhase.current) {
    lastPhase.current = index;
    beep(index === 0 ? 'done' : 'tick');
    vibrate(index === 0 ? 60 : 25);
  }

  const progress = current === undefined ? 0 : Math.min(1, within / current.seconds);

  return (
    <div className="rounded-2xl border border-line bg-panel p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            primeAudio();
            lastPhase.current = -1;
            setStartedAt((value) => (value === null ? Date.now() : null));
          }}
          aria-label={startedAt === null ? 'Avvia il metronomo' : 'Ferma il metronomo'}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold ${
            startedAt === null ? 'bg-panel text-dim ring-1 ring-line' : 'bg-accent text-accent-ink'
          }`}
        >
          {startedAt === null ? '▶' : '■'}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">
              {startedAt === null ? 'Metronomo del tempo' : (current?.name ?? '')}
            </p>
            <p className="tabular text-xs text-dim">
              {startedAt === null ? `ciclo ${String(cycle)}"` : `rip ${String(reps + 1)}`}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-75"
              style={{ width: `${String(Math.round(progress * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
