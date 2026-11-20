import { useEffect } from 'react';
import { formatClock, useCountdown, useStopwatch } from '../hooks/useTimers.ts';
import { primeAudio, signalRestOver } from '../feedback.ts';
import { Button } from './primitives.tsx';

/**
 * Cronometro per le isometrie: hollow hold e dead hang si misurano in secondi,
 * quindi il campo deve essere un cronometro e non un contatore.
 */
export interface StopwatchFieldProps {
  readonly label: string;
  readonly seconds: number;
  readonly onChange: (seconds: number) => void;
}

export function StopwatchField({ label, seconds, onChange }: StopwatchFieldProps) {
  const stopwatch = useStopwatch();

  useEffect(() => {
    if (stopwatch.running) onChange(stopwatch.seconds);
  }, [stopwatch.running, stopwatch.seconds, onChange]);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-dim">{label}</p>

      <div className="glass rounded-3xl p-4 text-center">
        <p className="tabular text-6xl font-semibold">
          {formatClock(stopwatch.running || stopwatch.seconds > 0 ? stopwatch.seconds : seconds)}
        </p>
        <p className="mt-1 text-xs text-dim">Il tempo si ferma alla prima perdita di posizione.</p>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          full
          size="lg"
          variant={stopwatch.running ? 'danger' : 'primary'}
          onClick={() => {
            primeAudio();
            if (stopwatch.running) {
              stopwatch.stop();
              onChange(stopwatch.seconds);
            } else {
              stopwatch.start();
            }
          }}
        >
          {stopwatch.running ? 'Ferma' : stopwatch.seconds > 0 ? 'Riprendi' : 'Avvia'}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => {
            stopwatch.reset();
            onChange(0);
          }}
        >
          Azzera
        </Button>
      </div>
    </div>
  );
}

/**
 * Recupero guidato.
 *
 * `readySeconds` è il punto in cui il recupero è già sufficiente: il conto
 * continua, ma il colore dice che si può ripartire. Serve ai 4-5 minuti tra un
 * test e l'altro, dove la scheda dà un intervallo e non un valore secco.
 */
export interface CountdownPanelProps {
  readonly totalSeconds: number;
  readonly readySeconds?: number;
  readonly title: string;
  readonly hint?: string;
  readonly onDone: () => void;
  readonly skipLabel?: string;
}

export function CountdownPanel({
  totalSeconds,
  readySeconds,
  title,
  hint,
  onDone,
  skipLabel = 'Salta il recupero',
}: CountdownPanelProps) {
  const countdown = useCountdown(totalSeconds, { autoStart: true, onDone: signalRestOver });

  const ready = readySeconds !== undefined && countdown.elapsed >= readySeconds;
  const tone = countdown.done || ready ? 'text-good' : 'text-ink';

  return (
    <div className="rounded-2xl glass-soft p-6 text-center">
      <p className="text-sm font-medium text-dim">{title}</p>
      <p className={`tabular mt-2 text-7xl font-semibold ${tone}`}>{formatClock(countdown.remaining)}</p>

      {ready && !countdown.done ? (
        <p className="mt-2 text-sm font-semibold text-good">Recupero sufficiente: puoi ripartire.</p>
      ) : hint !== undefined && hint !== '' ? (
        <p className="mt-2 text-sm text-dim">{hint}</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        <Button full size="lg" onClick={onDone}>
          {countdown.done ? 'Avanti' : skipLabel}
        </Button>
        {!countdown.done ? (
          <Button
            full
            variant="ghost"
            onClick={countdown.running ? countdown.pause : countdown.start}
          >
            {countdown.running ? 'Metti in pausa' : 'Riprendi il conto'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
